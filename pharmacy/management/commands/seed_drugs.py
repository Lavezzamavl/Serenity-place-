from django.core.management.base import BaseCommand
from datetime import date, timedelta
from pharmacy.models import Drug

DRUGS = [
    ('Sertraline', 'Sertraline HCl', '50mg', 'Tablet', 340, 100, 240),
    ('Diazepam', 'Diazepam', '5mg', 'Tablet', 42, 50, 120),
    ('Olanzapine', 'Olanzapine', '10mg', 'Tablet', 210, 80, 330),
    ('Naltrexone', 'Naltrexone HCl', '50mg', 'Tablet', 18, 40, 20),
    ('Lorazepam', 'Lorazepam', '2mg', 'Injection', 95, 30, 40),
    ('Fluoxetine', 'Fluoxetine HCl', '20mg', 'Capsule', 275, 90, 420),
]


class Command(BaseCommand):
    help = "Seeds sample pharmacy stock."

    def handle(self, *args, **kwargs):
        for name, generic, strength, form, stock, min_stock, days_to_expiry in DRUGS:
            Drug.objects.update_or_create(
                name=name, strength=strength,
                defaults={
                    'generic_name': generic, 'form': form,
                    'stock_quantity': stock, 'min_stock': min_stock,
                    'expiry_date': date.today() + timedelta(days=days_to_expiry),
                },
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(DRUGS)} drugs."))