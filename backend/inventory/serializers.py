from rest_framework import serializers
from django.db import transaction
from .models import InventoryItem, StockAdjustment


class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'category', 'unit', 'quantity', 'min_stock', 'supplier', 'status']


class StockAdjustmentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    adjusted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAdjustment
        fields = ['id', 'item', 'item_name', 'change', 'reason', 'adjusted_by_name', 'adjusted_at']
        read_only_fields = ['adjusted_at']

    def get_adjusted_by_name(self, obj):
        if not obj.adjusted_by:
            return 'Unknown'
        full = f"{obj.adjusted_by.first_name} {obj.adjusted_by.last_name}".strip()
        return full or obj.adjusted_by.username

    def validate(self, attrs):
        item = attrs['item']
        change = attrs['change']
        if item.quantity + change < 0:
            raise serializers.ValidationError({
                'change': f"Cannot remove {abs(change)} — only {item.quantity} {item.unit} in stock."
            })
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            item = validated_data['item']
            item.quantity += validated_data['change']
            item.save()
            adjustment = StockAdjustment.objects.create(**validated_data)
        return adjustment