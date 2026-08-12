# audit/serializers.py
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user_name', 'action', 'module', 'ip_address', 'detail', 'timestamp']

    def get_user_name(self, obj):
        if not obj.user:
            return 'System'
        full = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full or obj.user.username