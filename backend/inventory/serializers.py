from rest_framework import serializers
from django.db import transaction
from .models import InventoryItem, StockAdjustment


class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = ['id', 'name', 'category', 'unit', 'quantity', 'min_stock', 'supplier',
                  'buying_price', 'unit_price', 'expiry_date', 'status', 'stock_value']


class StockAdjustmentSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    adjusted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAdjustment
        fields = ['id', 'item', 'item_name', 'change', 'reason',
                  'buying_price', 'unit_price', 'adjusted_by_name', 'adjusted_at']
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
        if change < 0 and (attrs.get('buying_price') is not None or attrs.get('unit_price') is not None):
            raise serializers.ValidationError({
                'buying_price': "Pricing can only be set on a restock (positive change), not a usage/removal."
            })
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            item = validated_data['item']
            item.quantity += validated_data['change']
            update_fields = ['quantity']
            if validated_data.get('buying_price') is not None:
                item.buying_price = validated_data['buying_price']
                update_fields.append('buying_price')
            if validated_data.get('unit_price') is not None:
                item.unit_price = validated_data['unit_price']
                update_fields.append('unit_price')
            item.save(update_fields=update_fields)
            adjustment = StockAdjustment.objects.create(**validated_data)
        return adjustment
