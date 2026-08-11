from .models import AuditLog
from .utils import log_action


class AuditedViewSetMixin:
    """Add to any ModelViewSet touching PHI. Logs create/update/delete and,
    critically, logs *reads* on retrieve — that's the record a HIPAA audit
    will actually ask for ('who viewed this chart, and when')."""

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        log_action(request, AuditLog.Action.VIEW, self.get_object())
        return response

    def perform_create(self, serializer):
        super().perform_create(serializer)
        log_action(self.request, AuditLog.Action.CREATE, serializer.instance)

    def perform_update(self, serializer):
        before = {f.name: getattr(serializer.instance, f.name) for f in serializer.instance._meta.fields}
        super().perform_update(serializer)
        after = {f.name: getattr(serializer.instance, f.name) for f in serializer.instance._meta.fields}
        changes = {k: [str(before[k]), str(after[k])] for k in before if before[k] != after[k]}
        log_action(self.request, AuditLog.Action.UPDATE, serializer.instance, changes=changes)

    def perform_destroy(self, instance):
        log_action(self.request, AuditLog.Action.DELETE, instance, changes={'deleted': str(instance)})
        super().perform_destroy(instance)