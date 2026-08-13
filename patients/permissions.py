from rest_framework.permissions import BasePermission

ACTION_TO_FLAG = {
    'GET': 'can_view',
    'POST': 'can_create',
    'PUT': 'can_edit',
    'PATCH': 'can_edit',
    'DELETE': 'can_delete',
}


class HasModulePermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        role = request.user.role
        module_key = getattr(view, 'module_key', None)
        required_flag = ACTION_TO_FLAG.get(request.method)

        if not role or not module_key or not required_flag:
            return False

        return role.permissions.filter(module__key=module_key, **{required_flag: True}).exists()
    

class IsAdminRole(BasePermission):
    """Admin-gate for actions that must bypass per-module CRUD flags entirely —
    e.g. stock adjustments. Superuser always passes; otherwise role.is_admin_role."""
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.is_admin_role)