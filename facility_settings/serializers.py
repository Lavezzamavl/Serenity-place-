from rest_framework import serializers
from .models import FacilitySettings


class FacilitySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilitySettings
        fields = ['facility_name', 'address', 'phone', 'email', 'rehab_package_price', 'currency', 'total_beds']