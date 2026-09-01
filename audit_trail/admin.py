from rest_framework import viewsets
from .models import AuditLog
from .serializers import AuditLogSerializer
from patients.permissions import HasModulePermission


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('actor').all()
    serializer_class = AuditLogSerializer
    permission_classes = [HasModulePermission]
    module_key = 'settings'