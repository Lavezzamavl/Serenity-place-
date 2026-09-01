from .utils import log_action


class AuditLoggingMixin:
    """
    Usage:
        class PatientViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
            audit_module = 'patients'
            ...
    """
    audit_module = 'system'

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        log_action(request, 'view', module=self.audit_module,
                   object_id=kwargs.get('pk', ''), detail=str(self.get_object()))
        return response

    def perform_create(self, serializer):
        instance = serializer.save()
        log_action(
            self.request, 'create', module=self.audit_module,
            object_id=instance.pk, detail=str(instance),
        )
        return instance

    def perform_update(self, serializer):
        before = self.get_object()
        before_snapshot = {f.name: str(getattr(before, f.name)) for f in before._meta.fields}
        instance = serializer.save()
        after_snapshot = {f.name: str(getattr(instance, f.name)) for f in instance._meta.fields}
        changed = {
            k: [before_snapshot[k], after_snapshot[k]]
            for k in before_snapshot if before_snapshot[k] != after_snapshot.get(k)
        }
        log_action(
            self.request, 'update', module=self.audit_module,
            object_id=instance.pk, detail=str(instance), changes=changed or None,
        )
        return instance

    def perform_destroy(self, instance):
        log_action(
            self.request, 'delete', module=self.audit_module,
            object_id=instance.pk, detail=str(instance),
        )
        instance.delete()
