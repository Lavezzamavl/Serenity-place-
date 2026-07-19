from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Role, Module, RolePermission


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'key', 'label', 'icon']


class RolePermissionSerializer(serializers.ModelSerializer):
    module = ModuleSerializer(read_only=True)

    class Meta:
        model = RolePermission
        fields = ['module', 'can_view', 'can_create', 'can_edit', 'can_delete']


class RoleSerializer(serializers.ModelSerializer):
    permissions = RolePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'is_system_role', 'permissions']


class UserSerializer(serializers.ModelSerializer):
    """
    Used to return a logged-in user's own profile - e.g. after login,
    so React knows their name, role, and which modules to show.
    Never exposes password, and per the spec, users should never see
    OTHER users' roles/permissions - this serializer is only ever used
    for the request.user themselves, enforced in the view, not here.
    """
    role = RoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'phone_number', 'role', 'is_approved', 'mfa_enabled']
        read_only_fields = ['is_approved']  # users can't self-approve


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new account self-registration.
    Per the spec: accounts must stay INACTIVE until an admin approves them,
    and users must NEVER be able to assign their own role - so 'role' and
    'is_approved' are deliberately excluded from what this serializer accepts.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)   # hashes it - never store plain text
        user.is_active = True          # they CAN log in attempt-wise...
        user.is_approved = False       # ...but stay locked out until admin approval
        user.role = None               # no role until an admin assigns one
        user.save()
        return user