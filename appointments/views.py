from rest_framework import viewsets
from .models import Appointment, DOCTOR_ROLE_NAMES
from .serializers import AppointmentSerializer
from patients.permissions import HasModulePermission
from audit_trail.utils import log_action
from rest_framework.generics import ListAPIView
from accounts.models import User
from .serializers import AppointmentSerializer, DoctorSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [HasModulePermission]
    module_key = 'appointments'

    def get_queryset(self):
        qs = Appointment.objects.select_related('patient', 'doctor').all()
        user = self.request.user

        if user.is_superuser or (user.role and user.role.is_admin_role):
            return qs
        if user.role and user.role.name in DOCTOR_ROLE_NAMES:
            return qs.filter(doctor=user)
        return qs

    def perform_create(self, serializer):
        appt = serializer.save(created_by=self.request.user)
        log_action(
            self.request, 'appointment_scheduled', module='appointments',
            detail=f"{appt.patient.full_name} with {appt.doctor} @ {appt.scheduled_at}"
        )

    def perform_update(self, serializer):
        appt = serializer.save()
        log_action(
            self.request, 'appointment_updated', module='appointments',
            detail=f"Appointment #{appt.id} -> {appt.status}"
        )

    def perform_destroy(self, instance):
        log_action(
            self.request, 'appointment_deleted', module='appointments',
            detail=f"Appointment #{instance.id} ({instance.patient.full_name})"
        )
        instance.delete()
        
class DoctorListView(ListAPIView):
    """Minimal doctor list for the appointment-scheduling dropdown.
    Only exposes id + name - never role/permissions - per the existing
    rule that users shouldn't see other users' role data (see UserSerializer)."""
    serializer_class = DoctorSerializer
    permission_classes = [HasModulePermission]
    module_key = 'appointments'

    def get_queryset(self):
        return User.objects.filter(
            role__name__in=DOCTOR_ROLE_NAMES, is_approved=True
        ).order_by('first_name')
    