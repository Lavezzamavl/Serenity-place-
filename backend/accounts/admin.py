from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Module, RolePermission


class RolePermissionInline(admin.TabularInline):
    """Lets you edit a Role's module permissions right on the Role's own page,
    instead of jumping to a separate screen."""
    model = RolePermission
    extra = 1


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_system_role', 'created_at']
    inlines = [RolePermissionInline]


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['key', 'label', 'icon']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Extends Django's built-in UserAdmin (keeps the nice password-change UI)
    but adds our custom fields - role and is_approved - front and center,
    since approving new signups is the #1 admin action for this system.
    """
    list_display = ['username', 'email', 'role', 'is_approved', 'is_active', 'date_joined']
    list_filter = ['is_approved', 'role', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Serenity Place', {'fields': ('role', 'phone_number', 'is_approved', 'mfa_enabled')}),
    )

    actions = ['approve_users']

    @admin.action(description="Approve selected users")
    def approve_users(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} user(s) approved.")

# Register your models here.
