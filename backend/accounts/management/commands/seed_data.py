from django.core.management.base import BaseCommand
from accounts.models import Module, Role, RolePermission


MODULES = [
    ('dashboard', 'Dashboard', 'LayoutDashboard'),
    ('patients', 'Patient Management', 'Users'),
    ('emr', 'EMR', 'FileText'),
    ('pharmacy', 'Pharmacy', 'Pill'),
    ('nursing', 'Nursing', 'Stethoscope'),
    ('lab', 'Laboratory', 'FlaskConical'),
    ('billing', 'Billing & Finance', 'Receipt'),
    ('inventory', 'Inventory & Stores', 'Package'),
    ('hr', 'Human Resources', 'Briefcase'),
    ('reports', 'Reports', 'BarChart3'),
    ('settings', 'Settings', 'Settings'),
]

# module_key -> (can_view, can_create, can_edit, can_delete)
ROLES = {
    'Super Administrator': {
        key: (True, True, True, True)
        for key in ['dashboard', 'patients', 'emr', 'pharmacy', 'nursing', 'lab', 'billing', 'inventory', 'hr', 'reports', 'settings']
    },
    'Director': {
        'dashboard': (True, False, False, False),
        'patients': (True, False, False, False),
        'emr': (True, False, False, False),
        'billing': (True, False, False, False),
        'reports': (True, False, False, False),
        'hr': (True, False, True, False),
    },
    'Psychiatrist': {
        'dashboard': (True, False, False, False),
        'patients': (True, False, True, False),
        'emr': (True, True, True, False),
        'reports': (True, False, False, False),
    },
    'Nurse': {
        'dashboard': (True, False, False, False),
        'patients': (True, False, True, False),
        'nursing': (True, True, True, False),
        'emr': (True, True, True, False),
    },
    'Receptionist': {
        'dashboard': (True, False, False, False),
        'patients': (True, True, True, False),  # can register/admit patients
    },
    'Pharmacist': {
        'dashboard': (True, False, False, False),
        'pharmacy': (True, True, True, False),
        'inventory': (True, True, True, False),
    },
    'Accountant': {
        'dashboard': (True, False, False, False),
        'billing': (True, True, True, False),
        'reports': (True, False, False, False),
    },
}


class Command(BaseCommand):
    help = "Seeds Modules and Roles with granular permissions, matching the RBAC spec."

    def handle(self, *args, **kwargs):
        module_objs = {}
        for key, label, icon in MODULES:
            mod, _ = Module.objects.get_or_create(key=key, defaults={'label': label, 'icon': icon})
            module_objs[key] = mod
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(module_objs)} modules."))

        for role_name, module_perms in ROLES.items():
            role, _ = Role.objects.get_or_create(name=role_name, defaults={'is_system_role': True})
            for key, (can_view, can_create, can_edit, can_delete) in module_perms.items():
                RolePermission.objects.update_or_create(
                    role=role,
                    module=module_objs[key],
                    defaults={
                        'can_view': can_view,
                        'can_create': can_create,
                        'can_edit': can_edit,
                        'can_delete': can_delete,
                    },
                )
            self.stdout.write(self.style.SUCCESS(f"Seeded role: {role_name}"))