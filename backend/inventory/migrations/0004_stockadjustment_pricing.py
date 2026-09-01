from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0003_inventoryitem_buying_price_and_expiry'),
    ]

    operations = [
        migrations.AddField(
            model_name='stockadjustment',
            name='buying_price',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="Only used on restocks (positive change) - updates the item's buying_price if provided.",
            ),
        ),
        migrations.AddField(
            model_name='stockadjustment',
            name='unit_price',
            field=models.DecimalField(
                blank=True, decimal_places=2, max_digits=10, null=True,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="Only used on restocks (positive change) - updates the item's unit_price if provided.",
            ),
        ),
    ]
