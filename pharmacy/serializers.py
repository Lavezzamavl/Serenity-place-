from rest_framework import serializers
from django.db import transaction
from .models import Drug, DispenseRecord, StockAddition
from billing.models import Invoice, InvoiceItem

class DrugSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()

    class Meta:
        model = Drug
        fields = ['id', 'name', 'generic_name', 'strength', 'form',
                  'batch_number', 'supplier', 'stock_quantity', 'min_stock',
                  'max_stock', 'expiry_date', 'status',
                  'buying_price', 'selling_price']
        read_only_fields = ['stock_quantity', 'batch_number', 'supplier',
                             'buying_price', 'selling_price']


class StockAdditionSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAddition
        fields = ['id', 'drug', 'drug_name', 'quantity', 'batch_number',
                  'supplier', 'buying_price', 'selling_price',
                  'added_by_name', 'added_at', 'notes']
        read_only_fields = ['added_at']

    def get_added_by_name(self, obj):
        if not obj.added_by:
            return 'Unknown'
        full = f"{obj.added_by.first_name} {obj.added_by.last_name}".strip()
        return full or obj.added_by.username

    def create(self, validated_data):
        with transaction.atomic():
            drug = validated_data['drug']
            drug.stock_quantity += validated_data['quantity']
            drug.buying_price = validated_data['buying_price']
            drug.selling_price = validated_data['selling_price']
            if validated_data.get('batch_number'):
                drug.batch_number = validated_data['batch_number']
            if validated_data.get('supplier'):
                drug.supplier = validated_data['supplier']
            drug.save()
            addition = StockAddition.objects.create(**validated_data)
        return addition


class DispenseRecordSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    dispensed_by_name = serializers.SerializerMethodField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    total_charge = serializers.ReadOnlyField()

    class Meta:
        model = DispenseRecord
        fields = ['id', 'drug', 'drug_name', 'patient', 'patient_name',
                  'quantity', 'unit_price', 'total_charge',
                  'dispensed_by_name', 'dispensed_at', 'notes']
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
        if not attrs.get('unit_price'):
            attrs['unit_price'] = drug.selling_price
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            drug = validated_data['drug']
            quantity = validated_data['quantity']
            unit_price = validated_data['unit_price']

            drug.stock_quantity -= quantity
            drug.save()
            record = DispenseRecord.objects.create(**validated_data)

            # Auto-charge: reuse the patient's newest non-Paid invoice,
            # or open a new one if they don't have one in progress.
            invoice = Invoice.objects.filter(
                patient=record.patient
            ).exclude(status='Paid').order_by('-created_at').first()
            if invoice is None:
                invoice = Invoice.objects.create(
                    patient=record.patient,
                    created_by=self.context['request'].user,
                )

            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{drug.name} {drug.strength}".strip() + f" x{quantity}",
                quantity=quantity,
                unit_price=unit_price,
            )
            invoice.refresh_status()

        return record