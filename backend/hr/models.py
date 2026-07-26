from django.db import models


class StaffProfile(models.Model):
    DEPARTMENT_CHOICES = [
        ('Clinical', 'Clinical'), ('Nursing', 'Nursing'), ('Pharmacy', 'Pharmacy'),
        ('Administration', 'Administration'), ('Finance', 'Finance'), ('Support', 'Support'),
    ]
    STATUS_CHOICES = [('Active', 'Active'), ('On Leave', 'On Leave'), ('Inactive', 'Inactive')]

    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='staff_profile')
    department = models.CharField(max_length=30, choices=DEPARTMENT_CHOICES)
    position = models.CharField(max_length=100)
    date_hired = models.DateField()
    employment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')

    def __str__(self):
        return f"{self.user.username} - {self.position}"


class LeaveRequest(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Approved', 'Approved'), ('Rejected', 'Rejected')]

    staff = models.ForeignKey(StaffProfile, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    reviewed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='leave_reviews')
    requested_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.staff.user.username} leave {self.start_date} to {self.end_date}"