from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import TestRequest
from .serializers import TestRequestSerializer
from patients.permissions import HasModulePermission
from audit_trail.mixins import AuditLoggingMixin
from audit_trail.utils import log_action
from audit_trail.models import AuditLog
from rest_framework.parsers import MultiPartParser, FormParser

class TestRequestViewSet(AuditLoggingMixin, viewsets.ModelViewSet):
    serializer_class = TestRequestSerializer
    permission_classes = [HasModulePermission]
    module_key = 'lab'
    audit_module = 'lab'

    def get_queryset(self):
        queryset = TestRequest.objects.select_related('patient', 'requested_by')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        test = self.get_object()
        test.status = 'Approved'
        test.approved_by = request.user
        test.approved_at = timezone.now()
        test.save(update_fields=['status', 'approved_by', 'approved_at'])
        log_action(request, AuditLog.Action.UPDATE, module='lab', detail=str(test),
                   changes={'status': ['Resulted', 'Approved']})
        return Response(TestRequestSerializer(test).data)
    
    @action(detail=True, methods=['post'])
    def collect(self, request, pk=None):
        test = self.get_object()
        if test.status != 'Requested':
            return Response({'detail': 'Only requested tests can be marked collected.'}, status=400)
        test.status = 'Collected'
        test.sample_collected_at = timezone.now()
        test.save(update_fields=['status', 'sample_collected_at'])
        log_action(request, AuditLog.Action.UPDATE, module='lab', detail=str(test),
                   changes={'status': ['Requested', 'Collected']})
        return Response(TestRequestSerializer(test).data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def submit_result(self, request, pk=None):
        test = self.get_object()
        if test.status != 'Collected':
            return Response({'detail': 'Sample must be collected before entering a result.'}, status=400)
        result_text = request.data.get('result', '')
        result_file = request.FILES.get('result_file')
        if not result_text and not result_file:
            return Response({'detail': 'Provide a result value or a file.'}, status=400)
        test.result = result_text
        if result_file:
            test.result_file = result_file
        test.status = 'Resulted'
        test.save(update_fields=['result', 'result_file', 'status'])
        log_action(request, AuditLog.Action.UPDATE, module='lab', detail=str(test),
                   changes={'status': ['Collected', 'Resulted']})
        return Response(TestRequestSerializer(test).data)
