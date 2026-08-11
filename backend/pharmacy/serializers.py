from rest_framework import serializers
from django.db import transaction

from .models import Drug, DispenseRecord, StockAddition


class DrugSerializer(serializers.ModelSerializer):
    status = serializers.ReadOnlyField()

    class Meta:
        model = Drug
        fields = [
            'id',
            'name',
            'generic_name',
            'strength',
            'form',
            'stock_quantity',
            'min_stock',
            'expiry_date',
            'buying_price',
            'selling_price',
            'status',
        ]

    def validate(self, attrs):
        request = self.context.get('request')

        # Prices can only be changed by an administrator.
        if self.instance and request:
            if not request.user.is_staff:

                if 'buying_price' in attrs:
                    if attrs['buying_price'] != self.instance.buying_price:
                        raise serializers.ValidationError({
                            'buying_price':
                                'Only an administrator can change the buying price.'
                        })

                if 'selling_price' in attrs:
                    if attrs['selling_price'] != self.instance.selling_price:
                        raise serializers.ValidationError({
                            'selling_price':
                                'Only an administrator can change the selling price.'
                        })

        return attrs


class StockAdditionSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(
        source='drug.name',
        read_only=True
    )

    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockAddition
        fields = [
            'id',
            'drug',
            'drug_name',
            'quantity',
            'added_by_name',
            'added_at',
        ]

        read_only_fields = [
            'added_by_name',
            'added_at',
        ]

    def get_added_by_name(self, obj):
        if not obj.added_by:
            return 'Unknown'

        full = (
            f"{obj.added_by.first_name} "
            f"{obj.added_by.last_name}"
        ).strip()

        return full or obj.added_by.username

    def create(self, validated_data):
        with transaction.atomic():
            drug = validated_data['drug']
            quantity = validated_data['quantity']

            # Increase stock
            drug.stock_quantity += quantity
            drug.save(update_fields=['stock_quantity'])

            # Create audit record
            return StockAddition.objects.create(
                **validated_data
            )


class DispenseRecordSerializer(serializers.ModelSerializer):
    drug_name = serializers.CharField(
        source='drug.name',
        read_only=True
    )

    patient_name = serializers.CharField(
        source='patient.full_name',
        read_only=True
    )

    dispensed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DispenseRecord
        fields = [
            'id',
            'drug',
            'drug_name',
            'patient',
            'patient_name',
            'quantity',
            'dispensed_by_name',
            'dispensed_at',
            'notes',
        ]

        read_only_fields = [
            'dispensed_at',
        ]

    def get_dispensed_by_name(self, obj):
        if not obj.dispensed_by:
            return 'Unknown'

        full = (
            f"{obj.dispensed_by.first_name} "
            f"{obj.dispensed_by.last_name}"
        ).strip()

        return full or obj.dispensed_by.username

    def validate(self, attrs):
        drug = attrs['drug']
        quantity = attrs['quantity']

        if quantity > drug.stock_quantity:
            raise serializers.ValidationError({
                'quantity':
                    f"Only {drug.stock_quantity} units of "
                    f"{drug.name} in stock — cannot dispense {quantity}."
            })

        return attrs

    def create(self, validated_data):
        # Stock deduction + dispense record are atomic.
        with transaction.atomic():
            drug = validated_data['drug']

            drug.stock_quantity -= validated_data['quantity']

            drug.save(
                update_fields=['stock_quantity']
            )

            return DispenseRecord.objects.create(
                **validated_data
            )