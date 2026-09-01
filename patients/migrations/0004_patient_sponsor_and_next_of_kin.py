# Generated manually to match project migration style

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0003_patient_discharged_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='patient',
            name='sponsor_name',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name='patient',
            name='sponsor_phone',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='patient',
            name='sponsor_relationship',
            field=models.CharField(
                blank=True, max_length=100,
                help_text='e.g. Employer, NHIF, Self, Family',
            ),
        ),
        migrations.AddField(
            model_name='patient',
            name='next_of_kin_name',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name='patient',
            name='next_of_kin_relationship',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='patient',
            name='next_of_kin_phone',
            field=models.CharField(blank=True, max_length=20),
        ),
    ]