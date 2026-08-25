"""
python manage.py generate_notifications

Scans for the conditions the spec calls out as needing automatic alerts
and creates a Notification for every admin/relevant-role user, skipping
duplicates via Notification.dedupe_key. Intended to run on a schedule
(cron / Celery beat / Render Cron Job) every 15-30 minutes - it's cheap
and fully idempotent, so running it more often than needed is harmless.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import IntegrityError
from django.db.models import F, Q
from django.utils import timezone

from accounts.models import User
from notifications.models import Notification
from pharmacy.models import Drug
from inventory.models import InventoryItem
from nursing.models import MedicationAdministration
from billing.models import Invoice
from appointments.models import Appointment


def notify(recipients, category, message, dedupe_key):
    for user in recipients:
        try:
            Notification.objects.create(
                recipient=user, category=category, message=message, dedupe_key=dedupe_key,
            )
        except IntegrityError:
            pass  # an unread notification with this key already exists for this user


class Command(BaseCommand):
    help = "Scans stock, MAR, billing and appointments for conditions that should notify staff."

    def handle(self, *args, **options):
        # Admin/director roles get every category; pharmacists/nurses/
        # accountants get the ones relevant to their module.
        admin_filter = Q(is_superuser=True) | Q(role__is_admin_role=True) | Q(role__name__iexact='Director')
        admins = list(User.objects.filter(is_approved=True).filter(admin_filter))
        pharmacists = list(User.objects.filter(is_approved=True, role__name__iexact='Pharmacist'))
        nurses = list(User.objects.filter(is_approved=True, role__name__iexact='Nurse'))
        accountants = list(User.objects.filter(is_approved=True, role__name__iexact='Accountant'))

        self._low_stock_drugs(admins + pharmacists)
        self._low_stock_inventory(admins)
        self._expiring_drugs(admins + pharmacists)
        self._missed_medications(admins + nurses)
        self._outstanding_bills(admins + accountants)
        self._upcoming_reviews(admins)

        self.stdout.write(self.style.SUCCESS("Notification scan complete."))

    def _low_stock_drugs(self, recipients):
        for drug in Drug.objects.filter(stock_quantity__lte=F('min_stock')):
            notify(
                recipients, 'LOW_STOCK',
                f"{drug.name} {drug.strength} is low on stock ({drug.stock_quantity} left).",
                dedupe_key=f"low_stock_drug_{drug.id}",
            )

    def _low_stock_inventory(self, recipients):
        for item in InventoryItem.objects.filter(quantity__lte=F('min_stock')):
            notify(
                recipients, 'LOW_STOCK',
                f"{item.name} is low on stock ({item.quantity} {item.unit} left).",
                dedupe_key=f"low_stock_item_{item.id}",
            )

    def _expiring_drugs(self, recipients):
        cutoff = timezone.now().date() + timedelta(days=60)
        for drug in Drug.objects.filter(expiry_date__lte=cutoff):
            notify(
                recipients, 'EXPIRING_DRUG',
                f"{drug.name} {drug.strength} expires on {drug.expiry_date}.",
                dedupe_key=f"expiring_drug_{drug.id}_{drug.expiry_date}",
            )

    def _missed_medications(self, recipients):
        for mar in MedicationAdministration.objects.filter(status='Missed'):
            notify(
                recipients, 'MISSED_MEDICATION',
                f"{mar.medication} was missed for {mar.patient.full_name} (scheduled {mar.scheduled_time}).",
                dedupe_key=f"missed_mar_{mar.id}",
            )

    def _outstanding_bills(self, recipients):
        for invoice in Invoice.objects.exclude(status='Paid'):
            if invoice.balance <= 0:
                continue
            notify(
                recipients, 'OUTSTANDING_BILL',
                f"{invoice.patient.full_name} has an outstanding balance of {invoice.balance} on {invoice.invoice_number}.",
                dedupe_key=f"outstanding_invoice_{invoice.id}",
            )

    def _upcoming_reviews(self, recipients):
        now = timezone.now()
        window_end = now + timedelta(hours=48)
        upcoming = Appointment.objects.filter(
            status='Scheduled', scheduled_at__gte=now, scheduled_at__lte=window_end,
        )
        for appt in upcoming:
            notify(
                recipients, 'UPCOMING_REVIEW',
                f"{appt.patient.full_name} has an appointment with {appt.doctor} on {appt.scheduled_at:%Y-%m-%d %H:%M}.",
                dedupe_key=f"upcoming_appt_{appt.id}",
            )