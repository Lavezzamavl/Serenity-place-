from rest_framework import viewsets
from django.utils import timezone
from .models import Appointment
from .serializer import AppointmentSerializer
from patients.permissions import HasModulePermission
from audit_trail.utils import log_action

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [HasModulePermission]

    def get_queryset(self):
        queryset = self.queryset
        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(scheduled_at__gt=timezone.now())
        return queryset
    
    def perform_create(self, serializer):
        appt = serializer.save()
        logaction(self.request.user, 'appointment_scheduled', module = 'emr',
                  detail = f"{appt.appointment_type} appointment scheduled for patient {appt.patient.admission_id} with doctor {appt.doctor.first_name} {appt.doctor.last_name} at {appt.scheduled_at}.")    
