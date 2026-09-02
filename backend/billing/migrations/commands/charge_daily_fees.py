from django.core.management.base import BaseCommand
from billing.services import charge_daily_bed_fees


class Command(BaseCommand):
    help = (
        "Charges every currently-Admitted patient a per-diem bed fee for "
        "today, based on their ward's rate in Facility Settings. Meant to "
        "be run once a day via a scheduler (cron on Linux/Render, Task "
        "Scheduler on Windows). Safe to re-run - a patient already charged "
        "for the day is skipped, never double-billed."
    )

    def handle(self, *args, **options):
        summary = charge_daily_bed_fees()
        self.stdout.write(self.style.SUCCESS(
            f"[{summary['date']}] Charged {summary['charged_count']} patients, "
            f"total {summary['total_amount']}. "
            f"Skipped {summary['skipped_already_charged_count']} (already charged today), "
            f"{summary['skipped_no_rate_count']} (no rate set for their ward)."
        ))
        if summary['skipped_no_rate_patients']:
            self.stdout.write(self.style.WARNING(
                f"No ward rate configured for: {', '.join(summary['skipped_no_rate_patients'])} "
                f"- set rates in Facility Settings."
            ))