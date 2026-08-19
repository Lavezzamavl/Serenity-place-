from rest_framework import viewsets
from .models import Drug, DispenseRecord, StockAddition
from .serializers import DrugSerializer, DispenseRecordSerializer, StockAdditionSerializer
from patients.permissions import HasModulePermission, IsAdminRole
from audit_trail.mixins import AuditedViewSetMixin
from audit_trail.utils import log_action

class DrugViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = Drug.objects.all().order_by('name')
    serializer_class = DrugSerializer
    permission_classes = [HasModulePermission]
    module_key = 'pharmacy'


class DispenseRecordViewSet(viewsets.ModelViewSet):
    queryset = DispenseRecord.objects.all()
    serializer_class = DispenseRecordSerializer
    permission_classes = [HasModulePermission]
    module_key = 'dispensing'

    def perform_create(self, serializer):
        record = serializer.save(dispensed_by=self.request.user)
        log_action(self.request, 'medication_dispensed', module='pharmacy',
                   detail=f"{record.quantity}x {record.drug.name} -> {record.patient.admission_id}")


class StockAdditionViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = StockAddition.objects.all()
    serializer_class = StockAdditionSerializer
    module_key = 'pharmacy'

    def get_permissions(self):
        if self.action == 'create':
            return [HasModulePermission(), IsAdminRole()]
        return [HasModulePermission()]

    def extra_create_kwargs(self):
        return {'added_by': self.request.user}