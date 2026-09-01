from rest_framework import serializers
from .models import CounselingSession


class CounselingSessionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    counselor_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = CounselingSession
        fields = [
            'id', 'patient', 'patient_name', 'counselor_name',
            'session_type', 'notes', 'date', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_counselor_name(self, obj):
        if not obj.counselor:
            return 'Unknown'
        full = f"{obj.counselor.first_name} {obj.counselor.last_name}".strip()
        return full or obj.counselor.username

    def get_date(self, obj):
        return obj.created_at.date()
