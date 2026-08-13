from rest_framework import serializers
from .models import StaffProfile, LeaveRequest


class StaffProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'username', 'full_name', 'department', 'position', 'date_hired', 'employment_status']

    def get_full_name(self, obj):
        full = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full or obj.user.username


class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = ['id', 'staff', 'staff_name', 'start_date', 'end_date', 'reason',
                  'status', 'reviewed_by_name', 'requested_at']
        read_only_fields = ['status', 'requested_at']

    def get_staff_name(self, obj):
        full = f"{obj.staff.user.first_name} {obj.staff.user.last_name}".strip()
        return full or obj.staff.user.username

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return None
        full = f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
        return full or obj.reviewed_by.username

    def validate(self, attrs):
        if attrs['end_date'] < attrs['start_date']:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})
        return attrs