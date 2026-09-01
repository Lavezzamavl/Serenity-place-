from rest_framework import viewsets
from .models import NursingNote, VitalsCheck, MedicationAdministration, ConsumableUsage
from .serializers import (
    NursingNoteSerializer, VitalsCheckSerializer,
    MedicationAdministrationSerializer, ConsumableUsageSerializer,
)
from patients.permissions import HasModulePermission
from audit_trail.mixins import AuditLoggingMixin
from audit_trail.utils import log_action
from audit_trail.models import AuditLog


class NursingNoteViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    queryset = NursingNote.objects.all()
    serializer_class = NursingNoteSerializer
    permission_classes = [HasModulePermission]
    audit_module= 'nursing'

    def perform_create(self, serializer):
        # NOTE: previously this used an `extra_create_kwargs()` hook that
        # AuditedViewSetMixin never actually calls, so `nurse` was silently
        # left null on every note. This explicit perform_create fixes that,
        # matching the working pattern already used in pharmacy/inventory.
        note = serializer.save(nurse=self.request.user)
        log_action(self.request, AuditLog.Action.CREATE, note)

    def get_queryset(self):
        queryset = NursingNote.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class VitalsCheckViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    queryset = VitalsCheck.objects.all()
    serializer_class = VitalsCheckSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'nursing'

    def perform_create(self, serializer):
        vitals = serializer.save(recorded_by=self.request.user)
        log_action(self.request, AuditLog.Action.CREATE, vitals)

    def get_queryset(self):
        queryset = VitalsCheck.objects.all()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class MedicationAdministrationViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    serializer_class = MedicationAdministrationSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'nursing'

    def get_queryset(self):
        queryset = MedicationAdministration.objects.select_related('patient', 'administered_by')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        entry = serializer.save(administered_by=self.request.user)
        log_action(self.request, AuditLog.Action.CREATE, entry)


class ConsumableUsageViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    serializer_class = ConsumableUsageSerializer
    permission_classes = [HasModulePermission]
    audit_module = 'nursing'

    def get_queryset(self):
        queryset = ConsumableUsage.objects.select_related('patient', 'item', 'recorded_by')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        usage = serializer.save(recorded_by=self.request.user)
        log_action(self.request, AuditLog.Action.CREATE, usage)