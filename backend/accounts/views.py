import base64
from io import BytesIO
from datetime import timedelta

import pyotp
import qrcode
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from audit_trail.utils import log_action
from .models import User, PasswordHistory
from .serializers import RegisterSerializer, UserSerializer
from .throttles import LoginRateThrottle, MFARateThrottle

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        PasswordHistory.objects.create(user=user, hashed_password=user.password)
        log_action(request, 'register', module='auth', detail=user.username)
        return Response(
            {
                "message": "Account created. An administrator must approve your account before you can log in.",
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class ApprovalCheckingTokenSerializer(TokenObtainPairSerializer):
    """
    Wraps SimpleJWT's login with:
      - account-lockout enforcement (checked BEFORE credentials, so a
        locked account doesn't leak whether the password was right)
      - approval-gate enforcement
      - MFA challenge: if the account has MFA enabled, a valid `mfa_code`
        must be supplied in the same request, or a fresh `mfa_required`
        response is returned instead of tokens.
    """
    mfa_code = None

    def validate(self, attrs):
        self.mfa_code = attrs.pop('mfa_code', None)
        username = attrs.get('username')

        # Look the user up early purely to check lockout state - we do NOT
        # reveal *why* login failed differently for "no such user" vs
        # "locked" vs "wrong password", to avoid username enumeration.
        candidate = User.objects.filter(username=username).first()
        if candidate and candidate.locked_until and candidate.locked_until > timezone.now():
            raise ValidationError(
                "This account is temporarily locked due to repeated failed "
                "login attempts. Try again later."
            )

        try:
            data = super().validate(attrs)
        except Exception:
            if candidate:
                candidate.failed_login_attempts += 1
                if candidate.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                    candidate.locked_until = timezone.now() + timedelta(minutes=LOCKOUT_MINUTES)
                candidate.save(update_fields=['failed_login_attempts', 'locked_until'])
            raise

        if not self.user.is_approved:
            raise ValidationError("Your account is pending administrator approval.")

        if self.user.mfa_enabled:
            if not self.mfa_code:
                raise ValidationError({"mfa_required": True, "detail": "Enter your authenticator code."})
            totp = pyotp.TOTP(self.user.mfa_secret)
            if not totp.verify(self.mfa_code, valid_window=1):
                raise ValidationError({"mfa_required": True, "detail": "Invalid authenticator code."})

        # Success: reset lockout counters.
        self.user.failed_login_attempts = 0
        self.user.locked_until = None
        self.user.save(update_fields=['failed_login_attempts', 'locked_until'])

        # Single active session policy: blacklist this user's other
        # outstanding refresh tokens unless they've been explicitly
        # allowed multiple concurrent sessions.
        if not self.user.allow_multiple_sessions:
            for token in OutstandingToken.objects.filter(user=self.user):
                BlacklistedToken.objects.get_or_create(token=token)

        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    serializer_class = ApprovalCheckingTokenSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            log_action(request, 'login', module='auth', detail=request.data.get('username', ''))
            return response
        except Exception:
            log_action(request, 'failed_login', module='auth', detail=request.data.get('username', ''))
            raise


class LogoutView(APIView):
    """POST /api/auth/logout/  { "refresh": "<token>" }
    Blacklists the given refresh token so it can never be used again -
    without this, a stolen refresh token stays valid until it naturally
    expires even after the user 'logs out' client-side."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except Exception:
            pass  # already invalid/expired - logout should still succeed
        log_action(request, 'logout', module='auth', detail=request.user.username)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class ForceLogoutView(APIView):
    """POST /api/auth/users/<id>/force-logout/  - admin-only.
    Blacklists ALL outstanding refresh tokens for the target user,
    ending every active session immediately, per the spec requirement
    that admins can force-logout any active user session."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if not (request.user.is_superuser or (request.user.role and request.user.role.is_admin_role)):
            raise PermissionDenied("Only administrators can force-logout other users.")
        target = generics.get_object_or_404(User, pk=user_id)
        for token in OutstandingToken.objects.filter(user=target):
            BlacklistedToken.objects.get_or_create(token=token)
        log_action(request, 'force_logout', module='auth', detail=target.username)
        return Response({"message": f"All sessions for {target.username} have been ended."})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = User.objects.select_related('role').prefetch_related(
            'role__permissions__module'
        ).get(pk=request.user.pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ { "old_password", "new_password" }"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not user.check_password(old_password):
            raise ValidationError({"old_password": "Incorrect current password."})

        validate_password(new_password, user=user)  # runs full validator chain incl. history/complexity

        user.set_password(new_password)
        user.save(update_fields=['password'])
        PasswordHistory.objects.create(user=user, hashed_password=user.password)
        log_action(request, 'password_change', module='auth', detail=user.username)
        return Response({"message": "Password updated successfully."})


class MFASetupView(APIView):
    """GET /api/auth/mfa/setup/ - generates (but does not yet activate) a
    TOTP secret and returns a QR code the user scans in an authenticator
    app. MFA only becomes active once MFAEnableView confirms a valid code."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        secret = pyotp.random_base32()
        request.user.mfa_secret = secret
        request.user.save(update_fields=['mfa_secret'])

        uri = pyotp.TOTP(secret).provisioning_uri(
            name=request.user.username, issuer_name="Serenity Place"
        )
        qr_img = qrcode.make(uri)
        buffer = BytesIO()
        qr_img.save(buffer, format='PNG')
        qr_b64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "secret": secret,  # shown once for manual entry; not returned again elsewhere
            "qr_code": f"data:image/png;base64,{qr_b64}",
        })


class MFAEnableView(APIView):
    """POST /api/auth/mfa/enable/ { "code": "123456" }"""
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [MFARateThrottle]
    throttle_scope = 'mfa'

    def post(self, request):
        user = request.user
        if not user.mfa_secret:
            raise ValidationError("Call /mfa/setup/ first to generate a secret.")
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(request.data.get('code', ''), valid_window=1):
            raise ValidationError("Invalid code. Please try again.")
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled'])
        log_action(request, 'mfa_enabled', module='auth', detail=user.username)
        return Response({"message": "MFA enabled."})


class MFADisableView(APIView):
    """POST /api/auth/mfa/disable/ { "password": "..." } - requires
    re-entering the password so a hijacked-but-unlocked session can't
    silently turn MFA off."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.check_password(request.data.get('password', '')):
            raise ValidationError({"password": "Incorrect password."})
        user.mfa_enabled = False
        user.mfa_secret = ''
        user.save(update_fields=['mfa_enabled', 'mfa_secret'])
        log_action(request, 'mfa_disabled', module='auth', detail=user.username)
        return Response({"message": "MFA disabled."})
