from django.db import models


class TestRequest(models.Model):
    STATUS_CHOICES = [
        ('Requested', 'Requested'), ('Collected', 'Collected'),
        ('Resulted', 'Resulted'), ('Approved', 'Approved'),
    ]
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='lab_requests')
    test_name = models.CharField(max_length=150)
    requested_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='lab_requests_made')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Requested')
    sample_collected_at = models.DateTimeField(null=True, blank=True)
    result = models.TextField(blank=True)
    result_file = models.FileField(upload_to='lab_results/', null=True, blank=True)
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_results_approved')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.test_name} - {self.patient.full_name} ({self.status})"