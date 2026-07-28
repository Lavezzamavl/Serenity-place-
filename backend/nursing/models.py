from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class NursingNote(models.Model):
    SHIFT_CHOICES = [('Morning', 'Morning'), ('Afternoon', 'Afternoon'), ('Night', 'Night')]

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='nursing_notes')
    nurse = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.shift} note - {self.patient.admission_id}"


class VitalsCheck(models.Model):
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='vitals_checks')
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    temperature_c = models.DecimalField(max_digits=4, decimal_places=1,
        validators=[MinValueValidator(30.0), MaxValueValidator(43.0)])
    pulse_bpm = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(30), MaxValueValidator(220)])
    blood_pressure = models.CharField(max_length=10)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Vitals - {self.patient.admission_id} @ {self.recorded_at}"