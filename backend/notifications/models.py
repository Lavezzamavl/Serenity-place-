from django.db import models


class Notification(models.Model):
    CATEGORY_CHOICES = [
        ('LOW_STOCK', 'Low Stock'),
        ('EXPIRING_DRUG', 'Expiring Drug'),
        ('MISSED_MEDICATION', 'Missed Medication'),
        ('UPCOMING_REVIEW', 'Upcoming Review'),
        ('OUTSTANDING_BILL', 'Outstanding Bill'),
    ]

    recipient = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notifications')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    message = models.CharField(max_length=255)
    # Lets the generator command be idempotent - re-running it every 15
    # minutes won't create duplicate "Drug X is low" notifications for the
    # same underlying object, only new/changed ones.
    dedupe_key = models.CharField(max_length=150, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['recipient', 'dedupe_key'],
                condition=models.Q(is_read=False),
                name='unique_unread_notification_per_recipient_key',
            )
        ]

    def __str__(self):
        return f"[{self.category}] {self.message}"
