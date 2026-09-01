from rest_framework.routers import DefaultRouter
from .views import CounselingSessionViewSet

router = DefaultRouter()
router.register('', CounselingSessionViewSet, basename='counseling-session')

urlpatterns = router.urls
