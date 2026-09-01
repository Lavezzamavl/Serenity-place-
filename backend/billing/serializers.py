from rest_framework import serializers
from django.db import transaction
from .models import Invoice, InvoiceItem, Payment


class InvoiceItemSerializer(serializers.ModelSerializer):
    line_total = serializers.ReadOnlyField()

    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'line_total']


class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'amount', 'method', 'mpesa_code', 'received_by_name', 'received_at']
        read_only_fields = ['received_at']

    def get_received_by_name(self, obj):
        if not obj.received_by:
            return 'Unknown'
        full = f"{obj.received_by.first_name} {obj.received_by.last_name}".strip()
        return full or obj.received_by.username

    def validate(self, attrs):
        # On update (PATCH, e.g. fixing up the mpesa_code afterwards),
        # attrs only has the fields being changed - fall back to the
        # existing instance for anything not in this request.
        invoice = attrs.get('invoice') or (self.instance.invoice if self.instance else None)
        amount = attrs.get('amount') if 'amount' in attrs else (self.instance.amount if self.instance else None)
        if invoice is not None and amount is not None:
            balance = invoice.balance
            if self.instance and self.instance.invoice_id == invoice.id:
                # Adjusting an existing payment's own amount shouldn't be
                # penalized by the balance it already contributed.
                balance += self.instance.amount
            if amount > balance:
                raise serializers.ValidationError({
                    'amount': f"Payment of {amount} exceeds outstanding balance of {balance}."
                })
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            payment = Payment.objects.create(**validated_data)
            payment.invoice.refresh_status()
        return payment

    def update(self, instance, validated_data):
        # Covers the "mpesa code can be adjusted later" case, and keeps
        # the invoice status correct if the amount itself is corrected.
        with transaction.atomic():
            payment = super().update(instance, validated_data)
            payment.invoice.refresh_status()
        return payment


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    total_amount = serializers.ReadOnlyField()
    total_paid = serializers.ReadOnlyField()
    balance = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'patient', 'patient_name', 'status',
                  'created_at', 'items', 'payments', 'total_amount', 'total_paid', 'balance']
        read_only_fields = ['invoice_number', 'status', 'created_at']


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Separate serializer for CREATING an invoice with its line items in one
    request, since the frontend builds an invoice as 'patient + a list of
    charges' in a single form submission, not item-by-item API calls.
    """
    items = InvoiceItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = ['patient', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        with transaction.atomic():
            invoice = Invoice.objects.create(
                patient=validated_data['patient'],
                created_by=self.context['request'].user,
            )
            for item in items_data:
                InvoiceItem.objects.create(invoice=invoice, **item)
        return invoice
