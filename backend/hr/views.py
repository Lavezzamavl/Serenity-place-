from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.models import User
from .models import StaffProfile, LeaveRequest
from .serializers import (
    StaffProfileSerializer, LeaveRequestSerializer,
    AvailableUserSerializer, StaffAccountCreateSerializer,
)
from patients.permissions import HasModulePermission, IsAdminRole
from audit_trail.utils import log_action

class StaffProfileViewSet(viewsets.ModelViewSet):
    queryset = StaffProfile.objects.select_related('user').all()
    serializer_class = StaffProfileSerializer
    permission_classes = [HasModulePermission]
    module_key = 'hr'

    def get_permissions(self):
        # Creating a login account is more sensitive than linking an
        # existing one, so it additionally requires an admin role.
        if self.action == 'create_with_account':
            return [HasModulePermission(), IsAdminRole()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='available-users')
    def available_users(self, request):
        """GET /api/hr/staff/available-users/ - approved users with no
        staff profile yet, for the 'link an existing account' flow."""
        users = User.objects.filter(is_approved=True, staff_profile__isnull=True).order_by('username')
        return Response(AvailableUserSerializer(users, many=True).data)

    @action(detail=False, methods=['post'], url_path='create-with-account')
    def create_with_account(self, request):
        """POST /api/hr/staff/create-with-account/ - creates a new login
        account and staff profile together, for onboarding an employee
        who doesn't have an account yet."""
        serializer = StaffAccountCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            staff_profile = serializer.save()
        log_action(request, 'staff_account_created', module='hr', detail=staff_profile.user.username)
        return Response(StaffProfileSerializer(staff_profile).data, status=status.HTTP_201_CREATED)


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
        log_action(request, f'leave_{decision.lower()}', module='hr',
                   detail=f"{leave.staff.user.username}: {leave.start_date} to {leave.end_date}")
        return Response(self.get_serializer(leave).data)