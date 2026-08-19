from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, DoctorListView

router = DefaultRouter()
router.register('', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('doctors/', DoctorListView.as_view(), name='appointment-doctors'),
] + router.urls