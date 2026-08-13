from rest_framework.routers import DefaultRouter
from .views import DrugViewSet, DispenseRecordViewSet, StockAdditionViewSet

router = DefaultRouter()
router.register('dispense-records', DispenseRecordViewSet, basename='dispense-record')
router.register('stock-additions', StockAdditionViewSet, basename='stock-addition')
router.register('', DrugViewSet, basename='drug')

urlpatterns = router.urls