from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets
from rest_framework.decorators import action
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, InvoiceCreateSerializer, PaymentSerializer
from patients.permissions import HasModulePermission
from facility_settings.models import FacilitySettings
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

    @action(detail=True, methods=['get'])
    def print(self, request, pk=None):
        """GET /api/billing/{id}/print/ - a standalone, printable HTML
        page for this invoice: facility header, patient details, every
        line item (all expenditure), every payment received (with
        M-Pesa code where applicable), and the outstanding balance.
        Opens directly in the browser; the page's own Print button
        (or Ctrl/Cmd+P) sends it to the printer."""
        invoice = self.get_object()
        html = render_to_string('billing/invoice_print.html', {
            'invoice': invoice,
            'patient': invoice.patient,
            'items': invoice.items.all(),
            'payments': invoice.payments.all(),
            'facility': FacilitySettings.load(),
        })
        log_action(request, 'invoice_printed', module='billing', detail=invoice.invoice_number)
        return HttpResponse(html)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'received_by')
    serializer_class = PaymentSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'billing'
    
    def perform_create(self, serializer):
        payment = serializer.save(received_by=self.request.user)
        log_action(self.request, 'payment_received', module='billing',
                   detail=f"Payment of {payment.amount} for Invoice {payment.invoice.id}")