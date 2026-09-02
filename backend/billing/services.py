from datetime import date as date_cls
from django.db import transaction
from patients.models import Patient
from facility_settings.models import FacilitySettings
from .models import Invoice, InvoiceItem, DailyBedCharge


def charge_daily_bed_fees(for_date=None, charged_by=None):
    """Charges every currently-Admitted patient a per-diem bed fee for
    `for_date` (defaults to today), based on their ward's rate in
    FacilitySettings. Safe to call more than once for the same day -
    DailyBedCharge's unique_together(patient, date) guarantees a patient
    is never billed twice for the same calendar day, so this can be
    triggered manually, via a cron job, or both without double-charging.

    Returns a summary dict rather than raising on a per-patient basis,
    since one skipped patient (e.g. ward has no rate configured) should
    never stop the rest of the ward from being charged.
    """
    if for_date is None:
        for_date = date_cls.today()

    settings_obj = FacilitySettings.load()
    charged = []
    skipped_already_charged = []
    skipped_no_rate = []
    total_amount = 0

    for patient in Patient.objects.filter(status='Admitted'):
        if DailyBedCharge.objects.filter(patient=patient, date=for_date).exists():
            skipped_already_charged.append(patient.admission_id)
            continue

        rate = settings_obj.daily_rate_for_ward(patient.ward)
        if not rate or rate <= 0:
            skipped_no_rate.append(patient.admission_id)
            continue

        with transaction.atomic():
            invoice = Invoice.objects.filter(
                patient=patient
            ).exclude(status='Paid').order_by('-created_at').first()
            if invoice is None:
                invoice = Invoice.objects.create(patient=patient, created_by=charged_by)

            item = InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{patient.ward} - Daily Bed Fee ({for_date.isoformat()})",
                quantity=1,
                unit_price=rate,
            )
            DailyBedCharge.objects.create(
                patient=patient, date=for_date, invoice_item=item, amount=rate,
            )
            invoice.refresh_status()

        charged.append(patient.admission_id)
        total_amount += rate

    return {
        'date': for_date.isoformat(),
        'charged_count': len(charged),
        'charged_patients': charged,
        'skipped_already_charged_count': len(skipped_already_charged),
        'skipped_no_rate_count': len(skipped_no_rate),
        'skipped_no_rate_patients': skipped_no_rate,
        'total_amount': total_amount,
    }