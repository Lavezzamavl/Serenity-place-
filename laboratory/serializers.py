from rest_framework import serializers
from .models import TestRequest


class TestRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    requested_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TestRequest
        fields = [
            'id', 'patient', 'patient_name', 'test_name', 'requested_by', 'requested_by_name',
            'status', 'sample_collected_at', 'result', 'result_file',
            'approved_by', 'approved_at', 'created_at',
        ]
        read_only_fields = ['requested_by', 'approved_by', 'approved_at', 'created_at']

    def get_requested_by_name(self, obj):
        if not obj.requested_by:
            return 'Unknown'
        full = f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip()
        return full or obj.requested_by.username