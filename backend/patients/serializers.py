from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    bmi = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'admission_id', 'full_name', 'age', 'gender', 'ward',
            'diagnosis', 'status', 'admission_date',
            'height_cm', 'weight_kg', 'temperature_c', 'pulse_bpm', 'blood_pressure',
            'bmi',
        ]
        read_only_fields = ['admission_id', 'admission_date']

    def get_bmi(self, obj):
        if obj.height_cm and obj.weight_kg:
            height_m = float(obj.height_cm) / 100
            return round(float(obj.weight_kg) / (height_m ** 2), 1)
        return None

    def validate_blood_pressure(self, value):
        """
        The model's regex only checks the SHAPE (digits/digits).
        This checks the shape makes clinical sense - e.g. rejects "40/180",
        which matches the regex but is physiologically backwards or absurd.
        """
        if not value:
            return value
        systolic, diastolic = (int(x) for x in value.split('/'))
        if not (60 <= systolic <= 250):
            raise serializers.ValidationError("Systolic pressure must be between 60 and 250 mmHg.")
        if not (30 <= diastolic <= 150):
            raise serializers.ValidationError("Diastolic pressure must be between 30 and 150 mmHg.")
        if diastolic >= systolic:
            raise serializers.ValidationError("Diastolic pressure must be lower than systolic pressure.")
        return value