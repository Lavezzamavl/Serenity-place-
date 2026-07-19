from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .serializers import RegisterSerializer, UserSerializer


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


class MeView(APIView):
    """
    GET /api/auth/me/
    Returns the CURRENTLY logged-in user's own profile only.
    This is what enforces "users must never view other users' roles" -
    there is no user ID in this URL, it always uses request.user,
    so there's no way to ask for anyone else's data through this endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)