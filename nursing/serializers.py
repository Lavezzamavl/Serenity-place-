from rest_framework import serializers
from django.db import transaction
from .models import NursingNote, VitalsCheck, MedicationAdministration, ConsumableUsage


class NursingNoteSerializer(serializers.ModelSerializer):
    nurse_name = serializers.SerializerMethodField()
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = NursingNote
        fields = ['id', 'patient', 'patient_name', 'shift', 'note', 'nurse_name', 'created_at']
        read_only_fields = ['created_at']

    def get_nurse_name(self, obj):
        if not obj.nurse:
            return 'Unknown'
        full = f"{obj.nurse.first_name} {obj.nurse.last_name}".strip()
        return full or obj.nurse.username


class VitalsCheckSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = VitalsCheck
        fields = ['id', 'patient', 'temperature_c', 'pulse_bpm', 'blood_pressure', 'recorded_by_name', 'recorded_at']
        read_only_fields = ['recorded_at']

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return 'Unknown'
        full = f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip()
        return full or obj.recorded_by.username

    def validate_blood_pressure(self, value):
        import re
        if not re.match(r'^\d{2,3}/\d{2,3}$', value):
            raise serializers.ValidationError("Format must be systolic/diastolic, e.g. 120/80.")
        systolic, diastolic = (int(x) for x in value.split('/'))
        if diastolic >= systolic:
            raise serializers.ValidationError("Diastolic must be lower than systolic.")
        return value


class MedicationAdministrationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    administered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = MedicationAdministration
        fields = [
            'id', 'patient', 'patient_name', 'medication', 'dose', 'route', 'frequency',
            'scheduled_time', 'administered_by_name', 'status', 'remarks', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_administered_by_name(self, obj):
        if not obj.administered_by:
            return 'Unknown'
        full = f"{obj.administered_by.first_name} {obj.administered_by.last_name}".strip()
        return full or obj.administered_by.username


class ConsumableUsageSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    total_charge = serializers.ReadOnlyField()

    class Meta:
        model = ConsumableUsage
        fields = [
            'id', 'patient', 'patient_name', 'item', 'item_name', 'quantity',
            'unit_price', 'total_charge', 'recorded_by_name', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_recorded_by_name(self, obj):
        if not obj.recorded_by:
            return 'Unknown'
        full = f"{obj.recorded_by.first_name} {obj.recorded_by.last_name}".strip()
        return full or obj.recorded_by.username

    def validate(self, attrs):
        item = attrs['item']
        quantity = attrs['quantity']
        if quantity > item.quantity:
            raise serializers.ValidationError({
                'quantity': f"Only {item.quantity} {item.unit} of {item.name} in stock — cannot use {quantity}."
            })
        if not attrs.get('unit_price'):
            attrs['unit_price'] = item.unit_price
        return attrs

    def create(self, validated_data):
        from billing.models import Invoice, InvoiceItem

        with transaction.atomic():
            item = validated_data['item']
            quantity = validated_data['quantity']
            unit_price = validated_data['unit_price']

            item.quantity -= quantity
            item.save(update_fields=['quantity'])
            usage = ConsumableUsage.objects.create(**validated_data)

            # Same auto-charge pattern as pharmacy.DispenseRecordSerializer:
            # reuse the patient's newest non-Paid invoice, or open a new one.
            invoice = Invoice.objects.filter(
                patient=usage.patient
            ).exclude(status='Paid').order_by('-created_at').first()
            if invoice is None:
                invoice = Invoice.objects.create(
                    patient=usage.patient,
                    created_by=self.context['request'].user,
                )

            InvoiceItem.objects.create(
                invoice=invoice,
                description=f"{item.name} x{quantity}",
                quantity=quantity,
                unit_price=unit_price,
            )
            invoice.refresh_status()

        return usage