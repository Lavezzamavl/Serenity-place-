from rest_framework import viewsets
from .models import Drug, DispenseRecord
from .serializers import DrugSerializer, DispenseRecordSerializer
from patients.permissions import HasModulePermission


class DrugViewSet(viewsets.ModelViewSet):
    queryset = Drug.objects.all().order_by('name')
    serializer_class = DrugSerializer
    permission_classes = [HasModulePermission]
    module_key = 'pharmacy'


class DispenseRecordViewSet(viewsets.ModelViewSet):
    queryset = DispenseRecord.objects.all()
    serializer_class = DispenseRecordSerializer
    permission_classes = [HasModulePermission]
    module_key = 'pharmacy'

    def perform_create(self, serializer):
        serializer.save(dispensed_by=self.request.user)
