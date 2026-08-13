from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'actor_name', 'action', 'model_name', 'object_id',
                  'object_repr', 'reason', 'ip_address', 'timestamp']

    def get_actor_name(self, obj):
        if not obj.actor:
            return 'System'
        full = f"{obj.actor.first_name} {obj.actor.last_name}".strip()
        return full or obj.actor.username