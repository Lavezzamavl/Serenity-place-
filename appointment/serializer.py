from rest_framework import serializers
from .models import Appointment

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'patient_name', 'doctor', 'doctor_name', 'appointment_type', 'status', 'scheduled_at', 'notes', 'created_at']
        read_only_fields = ['created_at']
        
    def get_doctor_name(self, obj):
        if not obj.doctor:
            return 'Unassigned'
        full = f"{obj.doctor.first_name} {obj.doctor.last_name}"
        return full or obj.doctor.uswername
    

