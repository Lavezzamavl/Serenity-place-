from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/pharmacy/', include('pharmacy.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/nursing/', include('nursing.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/settings/', include('facility_settings.urls')),
]