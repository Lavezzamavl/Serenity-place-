from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.db import models

# Letters, spaces, hyphens, apostrophes, periods only - blocks "John123" etc.
name_validator = RegexValidator(
    regex=r"^[A-Za-zÀ-ÿ\s\.'-]+$",
    message="Name can only contain letters, spaces, hyphens, apostrophes and periods."
)

# Format check for blood pressure e.g. "120/80" - the *range* check
# (is 120/80 physiologically plausible) happens in the serializer,
# since that needs to compare systolic vs diastolic together.
bp_format_validator = RegexValidator(
    regex=r"^\d{2,3}/\d{2,3}$",
    message="Blood pressure must be formatted as systolic/diastolic, e.g. 120/80."
)


class Patient(models.Model):
    GENDER_CHOICES = [('Male', 'Male'), ('Female', 'Female')]
    WARD_CHOICES = [('Ward A', 'Ward A'), ('Ward B', 'Ward B'), ('Ward C', 'Ward C')]
    STATUS_CHOICES = [('Admitted', 'Admitted'), ('Discharged', 'Discharged')]

    admission_id = models.CharField(max_length=20, unique=True, editable=False)
    full_name = models.CharField(max_length=150, validators=[name_validator])
    age = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(120)]
    )
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    ward = models.CharField(max_length=20, choices=WARD_CHOICES)
    diagnosis = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Admitted')
    admission_date = models.DateField(auto_now_add=True)

    height_cm = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(250)],
        help_text="30-250 cm"
    )
    weight_kg = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(2), MaxValueValidator(300)],
        help_text="2-300 kg"
    )
    temperature_c = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True,
        validators=[MinValueValidator(30.0), MaxValueValidator(43.0)],
        help_text="30.0-43.0 °C (covers severe hypothermia to severe hyperthermia)"
    )
    pulse_bpm = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(220)],
        help_text="30-220 bpm"
    )
    blood_pressure = models.CharField(
        max_length=10, blank=True, validators=[bp_format_validator],
        help_text="Format: systolic/diastolic, e.g. 120/80"
    )

    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='admitted_patients'
    )

    def save(self, *args, **kwargs):
        if not self.admission_id:
            self.admission_id = self._generate_admission_id()
        super().save(*args, **kwargs)

    def _generate_admission_id(self):
        from datetime import date
        year = date.today().year
        prefix = f"SPT-{year}-"
        last = Patient.objects.filter(admission_id__startswith=prefix).order_by('-id').first()
        next_num = int(last.admission_id.split('-')[-1]) + 1 if last else 1
        return f"{prefix}{next_num:04d}"

    def __str__(self):
        return f"{self.admission_id} - {self.full_name}"
    
class ProgressNote(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='progress_notes')
    author = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # newest first, matches the UI

    def __str__(self):
        return f"Note on {self.patient.admission_id} by {self.author}"