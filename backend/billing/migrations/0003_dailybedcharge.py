from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0002_payment_mpesa_code'),
        ('patients', '0004_patient_sponsor_and_next_of_kin'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyBedCharge',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('charged_at', models.DateTimeField(auto_now_add=True)),
                ('invoice_item', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='daily_bed_charge', to='billing.invoiceitem',
                )),
                ('patient', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='daily_bed_charges', to='patients.patient',
                )),
            ],
            options={
                'ordering': ['-date'],
                'unique_together': {('patient', 'date')},
            },
        ),
    ]