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


class MedicationAdministration(models.Model):
    """The MAR - distinct from pharmacy.DispenseRecord: DispenseRecord is the
    pharmacy handing stock to the ward (and where billing happens);
    this is the nurse's record of actually administering a dose at the
    bedside, which the spec calls out as its own document."""
    STATUS_CHOICES = [('Given', 'Given'), ('Missed', 'Missed'), ('Refused', 'Refused')]

    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='mar_entries')
    medication = models.CharField(max_length=150)
    dose = models.CharField(max_length=50)
    route = models.CharField(max_length=50)
    frequency = models.CharField(max_length=50)
    scheduled_time = models.DateTimeField()
    administered_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Given')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_time']

    def __str__(self):
        return f"{self.medication} {self.dose} - {self.patient.admission_id} ({self.status})"


class ConsumableUsage(models.Model):
    """Consumables (syringes, gloves, IV sets, saline, etc.) used while
    administering care. Deducts from inventory.InventoryItem and
    auto-charges the patient's bill the same way pharmacy dispensing does."""
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='consumables_used')
    item = models.ForeignKey('inventory.InventoryItem', on_delete=models.PROTECT, related_name='consumable_usages')
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def total_charge(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.quantity}x {self.item.name} -> {self.patient.admission_id}"
