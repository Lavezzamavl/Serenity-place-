# Generated manually to match project migration style

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='mpesa_code',
            field=models.CharField(
                blank=True, max_length=20,
                help_text="M-Pesa transaction code, e.g. QAB1CD2EFG. Editable "
                           "after capture in case it was mistyped or wasn't "
                           "available yet.",
            ),
        ),
    ]
