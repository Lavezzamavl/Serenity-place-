from rest_framework import viewsets
from .models import Patient
from .serializers import PatientSerializer
from .permissions import HasModulePermission


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [HasModulePermission]
    module_key = 'patients'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)