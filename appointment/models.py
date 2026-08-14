from django.db import models

class Appointment(models.Model):
    TYPE_CHOICES = [
        ('Consultation', 'Consultation'),
        ('Follow-up', 'Follow-up'),     
        ('Therapy Session', 'Therapy Session'),
        ('Surgery', 'Surgery'),
        ('Check-up', 'Check-up'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'), 
        ('Cancelled', 'Cancelled'),
        ('No-show', 'No-show'),
    ]
    patient = models.ForeignKey('patient.Patient', on_delete=models.CASCADE)
    doctor = models.ForeignKey('doctor.Doctor', on_delete=models.CASCADE)
    appointment_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')  
    scheduled_at = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-scheduled_at']
        
    def __str__(self):
        return f"{self.appointment_type} - {self.patient.admission_id} @ {self.scheduled_at}"
