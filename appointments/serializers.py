from rest_framework import serializers
from accounts.models import User
from .models import Appointment, DOCTOR_ROLE_NAMES

class DoctorSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name']

    def get_full_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.username

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__name__in=DOCTOR_ROLE_NAMES),
        required=False, allow_null=True,
    )

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'scheduled_at', 'reason', 'status', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_doctor_name(self, obj):
        if not obj.doctor:
            return 'Unassigned'
        full = f"{obj.doctor.first_name} {obj.doctor.last_name}".strip()
        return full or obj.doctor.username
    
