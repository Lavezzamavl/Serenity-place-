from rest_framework import viewsets
from .models import Patient, ProgressNote
from .serializers import PatientSerializer, ProgressNoteSerializer
from .permissions import HasModulePermission


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [HasModulePermission]
    module_key = 'patients'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProgressNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressNoteSerializer
    permission_classes = [HasModulePermission]
    module_key = 'emr'  # gated by EMR permissions, not Patients - matches the sidebar module it lives under

    def get_queryset(self):
        queryset = ProgressNote.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient__admission_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)