from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class Action(models.TextChoices):
        VIEW = 'VIEW', 'Viewed'
        CREATE = 'CREATE', 'Created'
        UPDATE = 'UPDATE', 'Updated'
        DELETE = 'DELETE', 'Deleted'
        LOGIN = 'LOGIN', 'Logged in'
        FAILED_LOGIN = 'FAILED_LOGIN', 'Failed login'
        LOGOUT = 'LOGOUT', 'Logged out'
        FORCE_LOGOUT = 'FORCE_LOGOUT', 'Forced logout'
        REGISTER = 'REGISTER', 'Registered account'
        APPROVE_USER = 'APPROVE_USER', 'Approved user'
        ROLE_CHANGE = 'ROLE_CHANGE', 'Changed user role'
        PERMISSION_CHANGE = 'PERMISSION_CHANGE', 'Changed role permissions'
        PASSWORD_CHANGE = 'PASSWORD_CHANGE', 'Changed password'
        MFA_ENABLED = 'MFA_ENABLED', 'Enabled MFA'
        MFA_DISABLED = 'MFA_DISABLED', 'Disabled MFA'
        PAYMENT = 'PAYMENT', 'Recorded payment'
        REFUND = 'REFUND', 'Issued refund'
        STOCK_ADJUST = 'STOCK_ADJUST', 'Adjusted stock'
        DISPENSE = 'DISPENSE', 'Dispensed medication'
        LAB_APPROVE = 'LAB_APPROVE', 'Approved lab result'
        EXPORT = 'EXPORT', 'Exported data'
        CONFIG_CHANGE = 'CONFIG_CHANGE', 'Changed system configuration'

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=32, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    object_repr = models.CharField(max_length=255, blank=True)
    changes = models.JSONField(null=True, blank=True)
    reason = models.TextField(blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValueError("AuditLog entries are immutable — create new rows, never update.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("AuditLog entries cannot be deleted.")

    def __str__(self):
        return f"{self.actor} {self.action} {self.model_name}#{self.object_id}"
