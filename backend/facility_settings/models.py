from django.db import models


class FacilitySettings(models.Model):
    """Singleton - there should only ever be ONE row. Enforced in save()
    below, not just by convention, since this holds facility-wide config
    like package pricing that must never fork into two conflicting rows."""
    facility_name = models.CharField(max_length=200, default='Serenity Place Treatment Center')
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    rehab_package_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='KES')
    ward_a_daily_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Per-diem bed fee for Ward A. 0 = daily charging skips this ward."
    )
    ward_b_daily_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Per-diem bed fee for Ward B. 0 = daily charging skips this ward."
    )
    ward_c_daily_rate = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Per-diem bed fee for Ward C. 0 = daily charging skips this ward."
    )
    total_beds = models.PositiveIntegerField(
        default=50,
        help_text="Total bed capacity across all wards. Used to compute Available Beds on the dashboard."
    )

    def save(self, *args, **kwargs):
        self.pk = 1  # always overwrite the same row - true singleton
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def daily_rate_for_ward(self, ward):
        return {
            'Ward A': self.ward_a_daily_rate,
            'Ward B': self.ward_b_daily_rate,
            'Ward C': self.ward_c_daily_rate,
        }.get(ward, 0)

    def __str__(self):
        return self.facility_name