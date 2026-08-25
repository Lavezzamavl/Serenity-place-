from rest_framework import viewsets
from .models import Patient, ProgressNote
from .serializers import PatientSerializer, ProgressNoteSerializer
from .permissions import HasModulePermission
from audit_trail.mixins import AuditLoggingMixin
from audit_trail.utils import log_action

class PatientViewSet(AuditLoggingMixin,viewsets.ModelViewSet):
    queryset = Patient.objects.select_related('created_by').order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'patients'

    def perform_create(self, serializer):
        patient = serializer.save(created_by=self.request.user)
        log_action(self.request, 'patient_admitted', module='patients', detail=patient.admission_id)


class ProgressNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressNoteSerializer
    permission_classes = [HasModulePermission]
    module_key = 'emr'

    def get_queryset(self):
        # select_related('author', 'patient') means fetching 20 notes
        # is 1 query instead of 1 + 20 (author) + 20 (patient) = 41 queries.
        queryset = ProgressNote.objects.select_related('author', 'patient')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient__admission_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)