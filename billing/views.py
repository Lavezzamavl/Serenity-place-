from rest_framework import viewsets
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, InvoiceCreateSerializer, PaymentSerializer
from patients.permissions import HasModulePermission
from audit_trail.mixins import AuditLoggingMixin
from audit_trail.utils import log_action

class InvoiceViewSet(AuditLoggingMixin,viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('patient', 'created_by').prefetch_related(
        'items', 'payments'
    ).order_by('-created_at')
    permission_classes = [HasModulePermission]
    audit_module = 'billing'

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'received_by')
    serializer_class = PaymentSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'billing'
    
    def perform_create(self, serializer):
        payment = serializer.save(received_by=self.request.user)
        log_action(self.request, 'payment_received', module='billing',
                   detail=f"Payment of {payment.amount} for Invoice {payment.invoice.id}")