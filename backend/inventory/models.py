from django.core.validators import MinValueValidator
from django.db import models


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('Medical Supplies', 'Medical Supplies'), ('Cleaning Supplies', 'Cleaning Supplies'),
        ('Office Supplies', 'Office Supplies'), ('Food Supplies', 'Food Supplies'),
    ]
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    unit = models.CharField(max_length=20, default='pcs')  # e.g. pcs, boxes, litres
    quantity = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=10)
    supplier = models.CharField(max_length=150, blank=True)

    @property
    def status(self):
        return 'Low' if self.quantity <= self.min_stock else 'OK'

    def __str__(self):
        return self.name


class StockAdjustment(models.Model):
    """Positive change = restock, negative = usage/consumption.
    Kept as a signed integer log so every quantity change has an audit trail,
    same pattern as the Pharmacy dispense records."""
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='adjustments')
    change = models.IntegerField()
    reason = models.CharField(max_length=255)
    adjusted_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    adjusted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-adjusted_at']

    def __str__(self):
        return f"{self.change:+} {self.item.name}"