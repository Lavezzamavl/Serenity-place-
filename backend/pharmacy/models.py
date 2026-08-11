from django.core.validators import MinValueValidator
from django.db import models


class Drug(models.Model):
    FORM_CHOICES = [
        ('Tablet', 'Tablet'), ('Capsule', 'Capsule'),
        ('Injection', 'Injection'), ('Syrup', 'Syrup'),
    ]
    
    buying_price = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=0.00,
    validators=[MinValueValidator(0)]
    )

    selling_price = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=0.00,
    validators=[MinValueValidator(0)]
    )

    name = models.CharField(max_length=150)
    generic_name = models.CharField(max_length=150, blank=True)
    strength = models.CharField(max_length=50, blank=True)
    form = models.CharField(max_length=20, choices=FORM_CHOICES, default='Tablet')

    stock_quantity = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=10)
    expiry_date = models.DateField()

    def __str__(self):
        return f"{self.name} {self.strength}"

    @property
    def status(self):
        from datetime import date, timedelta
        if self.stock_quantity <= self.min_stock:
            return 'Low'
        if self.expiry_date <= date.today() + timedelta(days=60):
            return 'Expiring Soon'
        return 'OK'

class StockAddition(models.Model):
    drug = models.ForeignKey(
        Drug,
        on_delete=models.CASCADE,
        related_name='stock_additions'
    )

    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
    )

    added_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True
    )

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-added_at']

    def __str__(self):
        return f"+{self.quantity} {self.drug.name}"
class DispenseRecord(models.Model):
    """
    Every time medication is dispensed to a patient. This is what actually
    deducts stock - see the serializer's create() method, which is where
    the deduction and the "don't allow dispensing more than exists" rule
    both live, atomically.
    """
    drug = models.ForeignKey(Drug, on_delete=models.PROTECT, related_name='dispense_records')
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='medications')
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    dispensed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    dispensed_at = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-dispensed_at']

    def __str__(self):
        return f"{self.quantity}x {self.drug.name} -> {self.patient.admission_id}"

