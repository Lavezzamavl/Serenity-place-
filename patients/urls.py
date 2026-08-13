from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, ProgressNoteViewSet

router = DefaultRouter()
router.register('progress-notes', ProgressNoteViewSet, basename='progress-note')
router.register('', PatientViewSet, basename='patient')

urlpatterns = router.urls