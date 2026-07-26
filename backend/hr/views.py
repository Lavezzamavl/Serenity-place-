from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import StaffProfile, LeaveRequest
from .serializers import StaffProfileSerializer, LeaveRequestSerializer
from patients.permissions import HasModulePermission


class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.select_related('user').all()
    serializer_class = StaffProfileSerializer
    permission_classes = [HasModulePermission]
    module_key = 'hr'


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [HasModulePermission]
    module_key = 'hr'

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """POST /api/hr/leave-requests/{id}/review/ with {"decision": "Approved"|"Rejected"}"""
        leave = self.get_object()
        decision = request.data.get('decision')
        if decision not in ('Approved', 'Rejected'):
            return Response({'detail': 'decision must be Approved or Rejected.'}, status=status.HTTP_400_BAD_REQUEST)
        leave.status = decision
        leave.reviewed_by = request.user
        leave.save()
        return Response(self.get_serializer(leave).data)