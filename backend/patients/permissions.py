from rest_framework.permissions import BasePermission

ACTION_TO_FLAG = {
    'GET': 'can_view',
    'POST': 'can_create',
    'PUT': 'can_edit',
    'PATCH': 'can_edit',
    'DELETE': 'can_delete',
}


class HasModulePermission(BasePermission):
    """
    Checks whether the logged-in user's Role has the right RolePermission
    flag for this view's module_key, matching the HTTP method used.
    e.g. a Receptionist with can_create=True on 'patients' can POST,
    but a Nurse with can_create=False on 'patients' gets a 403.
    """
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