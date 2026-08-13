from django.urls import path
from .views import FacilitySettingsView

urlpatterns = [
    path('', FacilitySettingsView.as_view(), name='facility-settings'),
]