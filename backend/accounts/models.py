from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """
    A role is a named bundle of permissions - e.g. 'Nurse', 'Pharmacist'.
    Admins can create custom roles beyond the built-in ones, per the spec.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(
        default=False,
        help_text="True for built-in roles (Super Admin, Nurse, etc) that shouldn't be deleted."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Module(models.Model):
    """
    Every screen/section in the system - Dashboard, Patients, EMR, Pharmacy, etc.
    This mirrors the MODULES list we hardcoded in React's roles.js -
    except now it lives in the database so admins can manage it without a code deploy.
    """
    key = models.CharField(max_length=50, unique=True)   # e.g. 'patients'
    label = models.CharField(max_length=100)              # e.g. 'Patient Management'
    icon = models.CharField(max_length=50, blank=True)    # lucide-react icon name

    def __str__(self):
        return self.label


class RolePermission(models.Model):
    """
    Links a Role to a Module, with granular CRUD-style flags.
    This is what makes permissions "highly granular" per the spec -
    a role isn't just 'can see Patients', it's 'can see Patients AND can
    it also edit/delete within that module'.
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    can_view = models.BooleanField(default=True)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ('role', 'module')  # a role can only have ONE permission row per module

    def __str__(self):
        return f"{self.role.name} -> {self.module.label}"


class User(AbstractUser):
    """
    Our custom user. Extends Django's AbstractUser so we keep
    password hashing, login, is_active, etc. for free - we just add
    the fields the spec actually asks for.
    """
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True, related_name='users')
    phone_number = models.CharField(max_length=20, blank=True)

    # Spec: "new accounts must remain inactive until approved by an administrator"
    is_approved = models.BooleanField(default=False)

    # Spec: MFA is optional per user
    mfa_enabled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username} ({self.role.name if self.role else 'No role'})"
# Create your models here.
