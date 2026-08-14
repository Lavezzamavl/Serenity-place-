from rest_framework.routers import DefaultRouter
from .views import NursingNoteViewSet, VitalsCheckViewSet

router = DefaultRouter()
router.register('vitals', VitalsCheckViewSet, basename='vitals-check')
router.register('notes', NursingNoteViewSet, basename='nursing-note')

urlpatterns = router.urls