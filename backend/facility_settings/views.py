from rest_framework.views import APIView
from rest_framework.response import Response
from .models import FacilitySettings
from .serializers import FacilitySettingsSerializer
from patients.permissions import HasModulePermission
from audit_trail.utils import log_action


class FacilitySettingsView(APIView):
    """GET/PUT /api/settings/ - the singleton settings object.
    No list/create/delete - settings always exist and are only ever updated."""
    permission_classes = [HasModulePermission]
    module_key = 'settings'

    def get(self, request):
        return Response(FacilitySettingsSerializer(FacilitySettings.load()).data)

    def put(self, request):
        instance = FacilitySettings.load()
        serializer = FacilitySettingsSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        log_action(request, 'settings_changed', module='settings',
                   detail='Facility settings updated')
        return Response(serializer.data)
