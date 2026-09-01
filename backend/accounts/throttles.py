from rest_framework.throttling import ScopedRateThrottle


class LoginRateThrottle(ScopedRateThrottle):
    """Applied to the login view. Rate is set in settings.REST_FRAMEWORK
    ->  DEFAULT_THROTTLE_RATES['login']. Throttles by IP for anonymous
    requests, which is what login attempts always are."""
    scope = 'login'


class MFARateThrottle(ScopedRateThrottle):
    scope = 'mfa'
