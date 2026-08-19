from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """GET / - lets you confirm the backend is actually running by just
    visiting the bare URL, instead of getting a confusing 404 (the old
    behavior when nothing was registered at the root path)."""
    return JsonResponse({
        'status': 'ok',
        'service': 'Serenity Place API',
    })


urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/appointments/', include('appointments.urls')),
    path('api/pharmacy/', include('pharmacy.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/nursing/', include('nursing.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/settings/', include('facility_settings.urls')),
    path('api/audit/', include('audit_trail.urls')),
       path('api/counseling/', include('counseling.urls')),
]