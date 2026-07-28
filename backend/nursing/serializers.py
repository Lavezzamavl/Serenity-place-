from rest_framework import serializers
from .models import NursingNote, VitalsCheck


class NursingNoteSerializer(serializers.ModelSerializer):
    nurse_name = serializers.SerializerMethodField()
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = NursingNote
        fields = ['id', 'patient', 'patient_name', 'shift', 'note', 'nurse_name', 'created_at']
        read_only_fields = ['created_at']

    def get_nurse_name(self, obj):
        if not obj.nurse:
            return 'Unknown'
        full = f"{obj.nurse.first_name} {obj.nurse.last_name}".strip()
        return full or obj.nurse.username


class VitalsCheckSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VitalsCheck
        fields = ['id', 'patient', 'temperature_c', 'pulse_bpm', 'blood_pressure', 'recorded_by_name', 'recorded_at']
        read_only_fields = ['recorded_at']

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return 'Unknown'
        full = f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip()
        return full or obj.recorded_by.username

    def validate_blood_pressure(self, value):
        import re
        if not re.match(r'^\d{2,3}/\d{2,3}$', value):
            raise serializers.ValidationError("Format must be systolic/diastolic, e.g. 120/80.")
        systolic, diastolic = (int(x) for x in value.split('/'))
        if diastolic >= systolic:
            raise serializers.ValidationError("Diastolic must be lower than systolic.")
        return value