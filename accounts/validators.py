import re
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import check_password


class PasswordComplexityValidator:
    """
    Enforces: at least one uppercase, one lowercase, one digit, one
    special character. Django's built-in validators only cover length,
    similarity-to-username, common-password and all-numeric checks —
    the spec asks for "complexity requirements" on top of that.
    """
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                "Password must contain at least one uppercase letter.",
                code='password_no_upper',
            )
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                "Password must contain at least one lowercase letter.",
                code='password_no_lower',
            )
        if not re.search(r'\d', password):
            raise ValidationError(
                "Password must contain at least one digit.",
                code='password_no_digit',
            )
        if not re.search(r'[^A-Za-z0-9]', password):
            raise ValidationError(
                "Password must contain at least one special character.",
                code='password_no_symbol',
            )

    def get_help_text(self):
        return (
            "Your password must include an uppercase letter, a lowercase "
            "letter, a digit, and a special character."
        )


class PasswordHistoryValidator:
    """
    Blocks reuse of a user's last N passwords (spec: "password history").
    Only runs when a `user` instance is available (i.e. on password
    change/reset, not on first registration).
    """
    def __init__(self, history_count=5):
        self.history_count = history_count

    def validate(self, password, user=None):
        if user is None or user.pk is None:
            return
        from .models import PasswordHistory
        recent = PasswordHistory.objects.filter(user=user).order_by('-created_at')[:self.history_count]
        for entry in recent:
            if check_password(password, entry.hashed_password):
                raise ValidationError(
                    f"You cannot reuse any of your last {self.history_count} passwords.",
                    code='password_reused',
                )

    def get_help_text(self):
        return f"Your password can't match any of your last {self.history_count} passwords."