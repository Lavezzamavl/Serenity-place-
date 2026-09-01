from rest_framework.routers import DefaultRouter
from .views import TestRequestViewSet

router = DefaultRouter()
router.register('requests', TestRequestViewSet, basename='lab-request')

urlpatterns = router.urls
