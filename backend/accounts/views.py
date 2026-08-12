from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from audit_trail.utils import log_action
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from audit_trail.models import AuditLog
from audit_trail.utils import log_action

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Public endpoint - anyone can create an account, but per the spec it
    stays unapproved (is_approved=False) until an admin flips it on.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]  # overrides the global IsAuthenticated default

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Account created. An administrator must approve your account before you can log in.",
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class ApprovalCheckingTokenSerializer(TokenObtainPairSerializer):
    """
    Custom login serializer - wraps SimpleJWT's default login but adds
    our own check: block login entirely if the account isn't approved yet,
    even if the username/password are correct.
    """
    def validate(self, attrs):
        data = super().validate(attrs)  # runs the normal username/password check first

        if not self.user.is_approved:
            raise generics.serializers.ValidationError(
                "Your account is pending administrator approval."
            )

        # Attach the user's profile (including role + permissions) directly
        # into the login response, so React gets everything it needs in one call.
        data['user'] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Returns { access, refresh, user: {...} } on success.
    """
    serializer_class = ApprovalCheckingTokenSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
           log_action(request, AuditLog.Action.LOGIN, module='auth', detail=request.data.get('username', ''))
        return response


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # select_related follows the FK to Role in one JOIN instead of a
        # second query; prefetch_related does the same for the reverse FK
        # from Role to its RolePermission rows - without these two lines,
        # loading one user's profile triggers 1 (user) + 1 (role) +
        # N (one per permission row) queries instead of just 2 total.
        user = User.objects.select_related('role').prefetch_related(
            'role__permissions__module'
        ).get(pk=request.user.pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)