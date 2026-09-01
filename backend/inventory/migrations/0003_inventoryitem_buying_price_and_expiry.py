from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_inventoryitem_unit_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='inventoryitem',
            name='buying_price',
            field=models.DecimalField(
                decimal_places=2, default=0, max_digits=10,
                validators=[django.core.validators.MinValueValidator(0)],
                help_text="What the facility paid per unit - for stock valuation and cost reporting.",
            ),
        ),
        migrations.AddField(
            model_name='inventoryitem',
            name='expiry_date',
            field=models.DateField(
                blank=True, null=True,
                help_text="Optional - only relevant for items that actually expire (e.g. dressings, reagents).",
            ),
        ),
    ]
