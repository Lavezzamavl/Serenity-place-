from rest_framework import viewsets
from .models import InventoryItem, StockAdjustment
from .serializers import InventoryItemSerializer, StockAdjustmentSerializer
from patients.permissions import HasModulePermission, IsAdminRole
from audit_trail.mixins import AuditedViewSetMixin
from audit_trail.utils import log_action

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('name')
    serializer_class = InventoryItemSerializer
    permission_classes = [HasModulePermission]
    module_key = 'inventory'


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.all()
    serializer_class = StockAdjustmentSerializer
    permission_classes = [HasModulePermission]
    module_key = 'inventory'

    def perform_create(self, serializer):
        adj = serializer.save(adjusted_by=self.request.user)
        action = 'stock_added' if adj.change > 0 else 'stock_removed'
        log_action(self.request, action, module='inventory',
                   detail=f"{adj.change:+} {adj.item.name} - {adj.reason}")
        
class StockAdjustmentViewSet(AuditedViewSetMixin, viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.all()
    serializer_class = StockAdjustmentSerializer
    module_key = 'inventory'

    def get_permissions(self):
        if self.action == 'create':
            return [HasModulePermission(), IsAdminRole()]
        return [HasModulePermission()]

    def extra_create_kwargs(self):
        return {'adjusted_by': self.request.user}