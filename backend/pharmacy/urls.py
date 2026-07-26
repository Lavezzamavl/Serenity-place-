from rest_framework.routers import DefaultRouter
from .views import DrugViewSet, DispenseRecordViewSet

router = DefaultRouter()
router.register('dispense-records', DispenseRecordViewSet, basename='dispense-record')
router.register('', DrugViewSet, basename='drug')

urlpatterns = router.urls