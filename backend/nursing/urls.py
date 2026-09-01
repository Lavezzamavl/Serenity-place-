from rest_framework.routers import DefaultRouter
from .views import (
    NursingNoteViewSet, VitalsCheckViewSet,
    MedicationAdministrationViewSet, ConsumableUsageViewSet,
)

router = DefaultRouter()
router.register('vitals', VitalsCheckViewSet, basename='vitals-check')
router.register('notes', NursingNoteViewSet, basename='nursing-note')
router.register('mar', MedicationAdministrationViewSet, basename='mar-entry')
router.register('consumables', ConsumableUsageViewSet, basename='consumable-usage')

urlpatterns = router.urls
