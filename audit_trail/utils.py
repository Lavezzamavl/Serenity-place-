from .models import AuditLog


def get_client_ip(request):
    """Behind Render/any reverse proxy, REMOTE_ADDR is the proxy's own
    address, not the visitor's. X-Forwarded-For's first entry is the
    real client IP; trust it only because SecurityMiddleware + our proxy
    setup (SECURE_PROXY_SSL_HEADER) already assumes a single trusted
    front-end proxy in this deployment."""
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(request, action, module='', detail='', object_id='', changes=None):
    """Call this from any view after a security-relevant action succeeds."""
    AuditLog.objects.create(
        actor=request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
        action=action.upper(),
        model_name=module or 'system',
        object_id=str(object_id),
        object_repr=detail,
        reason=detail,
        changes=changes,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
    )