from rest_framework import serializers
from django.db import transaction
from .models import Drug, DispenseRecord


class DrugSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()

    class Meta:
        model = Drug
        fields = ['id', 'name', 'generic_name', 'strength', 'form',
                  'stock_quantity', 'min_stock', 'expiry_date', 'status']


class DispenseRecordSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    dispensed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DispenseRecord
        fields = ['id', 'drug', 'drug_name', 'patient', 'patient_name',
                  'quantity', 'dispensed_by_name', 'dispensed_at', 'notes']
        read_only_fields = ['dispensed_at']

    def get_dispensed_by_name(self, obj):
        if not obj.dispensed_by:
            return 'Unknown'
        full = f"{obj.dispensed_by.first_name} {obj.dispensed_by.last_name}".strip()
        return full or obj.dispensed_by.username

    def validate(self, attrs):
        drug = attrs['drug']
        quantity = attrs['quantity']
        if quantity > drug.stock_quantity:
            raise serializers.ValidationError({
                'quantity': f"Only {drug.stock_quantity} units of {drug.name} in stock — cannot dispense {quantity}."
            })
        return attrs

    def create(self, validated_data):
        # transaction.atomic() ensures the stock deduction and the dispense
        # record are saved together or not at all - if anything fails
        # partway through, stock is never left in an inconsistent state.
        with transaction.atomic():
            drug = validated_data['drug']
            drug.stock_quantity -= validated_data['quantity']
            drug.save()
            record = DispenseRecord.objects.create(**validated_data)
        return record