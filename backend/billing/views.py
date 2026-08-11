from rest_framework import viewsets
from .models import Invoice, Payment
from .serializers import InvoiceSerializer, InvoiceCreateSerializer, PaymentSerializer
from patients.permissions import HasModulePermission
from audit_trail.mixins import AuditedViewSetMixin


class InvoiceViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    permission_classes = [HasModulePermission]
    module_key = 'billing'

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer


class PaymentViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [HasModulePermission]
    module_key = 'billing'

    def extra_create_kwargs(self):
        return {'received_by': self.request.user}