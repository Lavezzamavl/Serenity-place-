from .models import AuditLog


def log_action(request, action, module='', detail=''):
    """Call this from any view after a security-relevant action succeeds."""
    AuditLog.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        action=action,
        model_name=module or 'system',
        object_id='',
        object_repr=detail,
        reason=detail,
        ip_address=request.META.get('REMOTE_ADDR'),
    )