from rest_framework import viewsets
from .models import NursingNote, VitalsCheck
from .serializers import NursingNoteSerializer, VitalsCheckSerializer
from patients.permissions import HasModulePermission
from audit_trail.mixins import AuditedViewSetMixin


class NursingNoteViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = NursingNote.objects.all()
    serializer_class = NursingNoteSerializer
    permission_classes = [HasModulePermission]
    module_key = 'nursing'

    def extra_create_kwargs(self):
        return {'nurse': self.request.user}

    def get_queryset(self):
        queryset = NursingNote.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class VitalsCheckViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = VitalsCheck.objects.all()
    serializer_class = VitalsCheckSerializer
    permission_classes = [HasModulePermission]
    module_key = 'nursing'

    def extra_create_kwargs(self):
        return {'recorded_by': self.request.user}

    def get_queryset(self):
        queryset = VitalsCheck.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset