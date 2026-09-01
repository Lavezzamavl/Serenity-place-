from rest_framework.routers import DefaultRouter
from .views import StaffProfileViewSet, LeaveRequestViewSet

router = DefaultRouter()
router.register('leave-requests', LeaveRequestViewSet, basename='leave-request')
router.register('staff', StaffProfileViewSet, basename='staff-profile')

urlpatterns = router.urls
