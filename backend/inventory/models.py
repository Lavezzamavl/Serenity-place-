from django.core.validators import MinValueValidator
from django.db import models


class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('Medical Supplies', 'Medical Supplies'), ('Cleaning Supplies', 'Cleaning Supplies'),
        ('Office Supplies', 'Office Supplies'), ('Food Supplies', 'Food Supplies'),
    ]
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    unit = models.CharField(max_length=20, default='pcs')
    quantity = models.PositiveIntegerField(default=0)
    min_stock = models.PositiveIntegerField(default=10)
    supplier = models.CharField(max_length=150, blank=True)
    buying_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="What the facility paid per unit - for stock valuation and cost reporting."
    )
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Charged to the patient's bill when used via ConsumableUsage."
    )
    expiry_date = models.DateField(
        null=True, blank=True,
        help_text="Optional - only relevant for items that actually expire (e.g. dressings, reagents)."
    )

    @property
    def status(self):
        from datetime import date, timedelta
        if self.quantity <= self.min_stock:
            return 'Low'
        if self.expiry_date and self.expiry_date <= date.today() + timedelta(days=60):
            return 'Expiring Soon'
        return 'OK'

    @property
    def stock_value(self):
        return self.quantity * self.buying_price

    def __str__(self):
        return self.name


class StockAdjustment(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='adjustments')
    change = models.IntegerField()
    reason = models.CharField(max_length=255)
    buying_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
        help_text="Only used on restocks (positive change) - updates the item's buying_price if provided."
    )
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
        help_text="Only used on restocks (positive change) - updates the item's unit_price if provided."
    )
    adjusted_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    adjusted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-adjusted_at']

    def __str__(self):
        return f"{self.change:+} {self.item.name}"
