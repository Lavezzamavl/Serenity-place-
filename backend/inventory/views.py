from rest_framework import viewsets
from .models import InventoryItem, StockAdjustment
from .serializers import InventoryItemSerializer, StockAdjustmentSerializer
from patients.permissions import HasModulePermission, IsAdminRole


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
        serializer.save(adjusted_by=self.request.user)
        
class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.all()
    serializer_class = StockAdjustmentSerializer
    module_key = 'inventory'

    def get_permissions(self):
        if self.action == 'create':
            return [HasModulePermission(), IsAdminRole()]
        return [HasModulePermission()]

    def perform_create(self, serializer):
        serializer.save(adjusted_by=self.request.user)