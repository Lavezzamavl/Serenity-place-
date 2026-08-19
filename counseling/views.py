from rest_framework import viewsets
from .models import CounselingSession
from .serializers import CounselingSessionSerializer
from patients.permissions import HasModulePermission
from audit_trail.utils import log_action


class CounselingSessionViewSet(viewsets.ModelViewSet):
    queryset = CounselingSession.objects.select_related('patient', 'counselor').all()
    serializer_class = CounselingSessionSerializer
    permission_classes = [HasModulePermission]
    module_key = 'counseling'

    def perform_create(self, serializer):
        session = serializer.save(counselor=self.request.user)
        log_action(
            self.request, 'counseling_session_logged', module='counseling',
            detail=f"{session.session_type} session with {session.patient.full_name}"
        )