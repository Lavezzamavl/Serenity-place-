from django.core.management.base import BaseCommand
from accounts.models import User, Role

USERS = [
    ('dr_wanjiru', 'Grace', 'Wanjiru', 'Psychiatrist'),
    ('nurse_achieng', 'Mary', 'Achieng', 'Nurse'),
    ('reception_kamau', 'Peter', 'Kamau', 'Receptionist'),
    ('pharm_otieno', 'James', 'Otieno', 'Pharmacist'),
    ('accounts_njeri', 'Faith', 'Njeri', 'Accountant'),
]

DEMO_PASSWORD = 'Demo2026!'


class Command(BaseCommand):
    help = "Seeds one demo user per key role, all approved and ready to log in."

    def handle(self, *args, **kwargs):
        for username, first, last, role_name in USERS:
            role = Role.objects.filter(name=role_name).first()
            if not role:
                self.stdout.write(self.style.WARNING(f"Role '{role_name}' not found — run seed_data first."))
                continue

            user, created = User.objects.get_or_create(
                username=username,
                defaults={'first_name': first, 'last_name': last, 'email': f'{username}@serenityplace.demo'},
            )
            user.role = role
            user.is_approved = True
            user.set_password(DEMO_PASSWORD)
            user.save()
            status = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(f"{status}: {username} ({role_name})"))

        self.stdout.write(self.style.SUCCESS(f"\nAll demo users use password: {DEMO_PASSWORD}"))