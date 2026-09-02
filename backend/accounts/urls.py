from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, ForceLogoutView, MeView, RoleListView,
    ChangePasswordView, MFASetupView, MFAEnableView, MFADisableView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('roles/', RoleListView.as_view(), name='role-list'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('mfa/setup/', MFASetupView.as_view(), name='mfa_setup'),
    path('mfa/enable/', MFAEnableView.as_view(), name='mfa_enable'),
    path('mfa/disable/', MFADisableView.as_view(), name='mfa_disable'),
    path('users/<int:user_id>/force-logout/', ForceLogoutView.as_view(), name='force_logout'),
]