from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facility_settings', '0002_facilitysettings_total_beds'),
    ]

    operations = [
        migrations.AddField(
            model_name='facilitysettings',
            name='ward_a_daily_rate',
            field=models.DecimalField(
                decimal_places=2, default=0, max_digits=10,
                help_text="Per-diem bed fee for Ward A. 0 = daily charging skips this ward.",
            ),
        ),
        migrations.AddField(
            model_name='facilitysettings',
            name='ward_b_daily_rate',
            field=models.DecimalField(
                decimal_places=2, default=0, max_digits=10,
                help_text="Per-diem bed fee for Ward B. 0 = daily charging skips this ward.",
            ),
        ),
        migrations.AddField(
            model_name='facilitysettings',
            name='ward_c_daily_rate',
            field=models.DecimalField(
                decimal_places=2, default=0, max_digits=10,
                help_text="Per-diem bed fee for Ward C. 0 = daily charging skips this ward.",
            ),
        ),
    ]