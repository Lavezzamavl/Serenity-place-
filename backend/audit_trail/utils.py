from .models import AuditLog


def log_action(request, action, module='', detail=''):
    from .models import AuditLog
    AuditLog.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        action=AuditLog.Action.CREATE,
        model_name=module or 'system',
        object_id='',
        object_repr=action,
        reason=detail,
        ip_address=request.META.get('REMOTE_ADDR'),
    )