from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, StockAdjustmentViewSet

router = DefaultRouter()
router.register('adjustments', StockAdjustmentViewSet, basename='stock-adjustment')
router.register('', InventoryItemViewSet, basename='inventory-item')

urlpatterns = router.urls