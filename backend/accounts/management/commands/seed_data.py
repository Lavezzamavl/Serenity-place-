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

ROLES = {
    'Super Administrator': ['dashboard', 'patients', 'emr', 'pharmacy', 'nursing', 'lab', 'billing', 'inventory', 'hr', 'reports', 'settings'],
    'Director': ['dashboard', 'patients', 'emr', 'billing', 'reports', 'hr'],
    'Psychiatrist': ['dashboard', 'patients', 'emr', 'reports'],
    'Nurse': ['dashboard', 'patients', 'nursing', 'emr'],
    'Receptionist': ['dashboard', 'patients'],
    'Pharmacist': ['dashboard', 'pharmacy', 'inventory'],
    'Accountant': ['dashboard', 'billing', 'reports'],
}


class Command(BaseCommand):
    help = "Seeds Modules and Roles to match the React RBAC config."

    def handle(self, *args, **kwargs):
        module_objs = {}
        for key, label, icon in MODULES:
            mod, _ = Module.objects.get_or_create(key=key, defaults={'label': label, 'icon': icon})
            module_objs[key] = mod
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(module_objs)} modules."))

        for role_name, module_keys in ROLES.items():
            role, _ = Role.objects.get_or_create(name=role_name, defaults={'is_system_role': True})
            for key in module_keys:
                RolePermission.objects.get_or_create(role=role, module=module_objs[key])
            self.stdout.write(self.style.SUCCESS(f"Seeded role: {role_name}"))