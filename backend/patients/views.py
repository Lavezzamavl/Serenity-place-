from rest_framework import viewsets
from .models import Patient, ProgressNote
from .serializers import PatientSerializer, ProgressNoteSerializer
from .permissions import HasModulePermission
from audit_trail.mixins import AuditedViewSetMixin


class PatientViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [HasModulePermission]
    module_key = 'patients'

    def extra_create_kwargs(self):
        return {'created_by': self.request.user}


class ProgressNoteViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ProgressNoteSerializer
    permission_classes = [HasModulePermission]
    module_key = 'emr'

    def get_queryset(self):
        queryset = ProgressNote.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient__admission_id=patient_id)
        return queryset

    def extra_create_kwargs(self):
        return {'author': self.request.user}