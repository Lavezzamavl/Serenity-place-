# audit/views.py
from rest_framework import viewsets
from .models import AuditLog
from .serializers import AuditLogSerializer
from patients.permissions import HasModulePermission


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only - logs are never edited or deleted via the API, per spec
    ('immutable and accessible only to authorized administrators')."""
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [HasModulePermission]
    module_key = 'settings'  # gated behind Settings/admin-level access