from django.db import models


class CounselingSession(models.Model):
    TYPE_CHOICES = [
        ('Individual', 'Individual'),
        ('Group', 'Group'),
        ('Family', 'Family'),
        ('Psychoeducation', 'Psychoeducation'),
        ('Relapse', 'Relapse'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='counseling_sessions'
    )
    counselor = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='counseling_sessions'
    )
    session_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Individual')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.session_type} session — {self.patient.full_name} ({self.created_at.date()})"
