from django.db import models

# Roles treated as "doctors" for the purpose of appointment visibility -
# see AppointmentViewSet.get_queryset(). Front-desk / coordinating roles
# (Receptionist, Nurse, Pharmacist, Accountant, admins) still see every
# appointment, since they're the ones scheduling on a doctor's behalf.
DOCTOR_ROLE_NAMES = {'Psychiatrist', 'Director'}


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='appointments'
    )
    doctor = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='doctor_appointments',
        help_text="The clinician this appointment is with. Only their own "
                   "appointments are visible to them (see DOCTOR_ROLE_NAMES)."
    )
    scheduled_at = models.DateTimeField()
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')

    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_appointments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_at']

    def __str__(self):
        return f"{self.patient.full_name} with {self.doctor} @ {self.scheduled_at}"
