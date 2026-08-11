from .models import AuditLog


def log_action(request, action, obj, reason='', changes=None):
    AuditLog.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        action=action,
        model_name=f"{obj._meta.app_label}.{obj._meta.model_name}",
        object_id=str(obj.pk),
        object_repr=str(obj)[:255],
        changes=changes,
        reason=reason,
        ip_address=request.META.get('REMOTE_ADDR'),
    )