from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Patient, ProgressNote
from .serializers import PatientSerializer, ProgressNoteSerializer
from .permissions import HasModulePermission
from .ai_summary import generate_patient_summary
from audit_trail.mixins import AuditLoggingMixin
from audit_trail.utils import log_action

class PatientViewSet(AuditLoggingMixin,viewsets.ModelViewSet):
    queryset = Patient.objects.select_related('created_by').order_by('-id')
    serializer_class = PatientSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'patients'

    def get_queryset(self):
        # ?status=Admitted or ?status=Discharged - the "click a patient to
        # see admission details" and "list of discharged patients" views
        # both just filter the same list by status.
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        patient = serializer.save(created_by=self.request.user)
        log_action(self.request, 'patient_admitted', module='patients', detail=patient.admission_id)

    @action(detail=True, methods=['post'])
    def discharge(self, request, pk=None):
        """POST /api/patients/{id}/discharge/ - discharges a patient.
        discharged_at is stamped automatically by Patient.save()."""
        patient = self.get_object()
        if patient.status == 'Discharged':
            return Response({'detail': 'Patient is already discharged.'}, status=status.HTTP_400_BAD_REQUEST)
        patient.status = 'Discharged'
        patient.save()
        log_action(request, 'patient_discharged', module='patients', detail=patient.admission_id)
        return Response(self.get_serializer(patient).data)

    @action(detail=True, methods=['post'])
    def readmit(self, request, pk=None):
        """POST /api/patients/{id}/readmit/ - reopens a discharged patient's
        stay. discharged_at is cleared automatically by Patient.save()."""
        patient = self.get_object()
        if patient.status == 'Admitted':
            return Response({'detail': 'Patient is already admitted.'}, status=status.HTTP_400_BAD_REQUEST)
        patient.status = 'Admitted'
        patient.save()
        log_action(request, 'patient_readmitted', module='patients', detail=patient.admission_id)
        return Response(self.get_serializer(patient).data)

    @action(detail=True, methods=['post'])
    def summarize(self, request, pk=None):
        """POST /api/patients/{id}/summarize/ - generates an AI-assisted
        shift-handover summary from the patient's recent notes, vitals,
        and medication administration records."""
        patient = self.get_object()
        try:
            summary = generate_patient_summary(patient)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        log_action(request, 'export', module='patients',
                   object_id=patient.pk, detail=f"AI summary generated for {patient.admission_id}")
        return Response({'summary': summary})


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
