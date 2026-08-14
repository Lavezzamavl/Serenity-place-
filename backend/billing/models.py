from django.core.validators import MinValueValidator
from django.db import models


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('Outstanding', 'Outstanding'),
        ('Partial', 'Partial'),
        ('Paid', 'Paid'),
    ]

    invoice_number = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='invoices')
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Outstanding')

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = self._generate_number()
        super().save(*args, **kwargs)

    def _generate_number(self):
        from datetime import date
        year = date.today().year
        prefix = f"INV-{year}-"
        last = Invoice.objects.filter(invoice_number__startswith=prefix).order_by('-id').first()
        next_num = int(last.invoice_number.split('-')[-1]) + 1 if last else 1
        return f"{prefix}{next_num:04d}"

    @property
    def total_amount(self):
        return sum(item.line_total for item in self.items.all())

    @property
    def total_paid(self):
        return sum(p.amount for p in self.payments.all())

    @property
    def balance(self):
        return self.total_amount - self.total_paid

    def refresh_status(self):
        paid = self.total_paid
        total = self.total_amount
        if paid <= 0:
            self.status = 'Outstanding'
        elif paid < total:
            self.status = 'Partial'
        else:
            self.status = 'Paid'
        self.save(update_fields=['status'])

    def __str__(self):
        return f"{self.invoice_number} - {self.patient.full_name}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    @property
    def line_total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.description} ({self.invoice.invoice_number})"


class Payment(models.Model):
    METHOD_CHOICES = [
        ('Cash', 'Cash'), ('Bank Transfer', 'Bank Transfer'),
        ('Card', 'Card'), ('M-Pesa', 'M-Pesa'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount} via {self.method} on {self.invoice.invoice_number}"