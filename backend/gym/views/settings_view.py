from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import GymSettings
from ..serializers import GymSettingsSerializer
from ..permissions import IsOwner


class SettingsView(APIView):
    def get(self, request):
        return Response(GymSettingsSerializer(GymSettings.load()).data)

    def put(self, request):
        if request.user.role != 'Owner':
            return Response({'error': 'Owner access required'}, status=403)
        gym_settings = GymSettings.load()
        data = request.data
        for field in (
            'gym_name', 'address', 'phone', 'whatsapp_enabled', 'whatsapp_provider', 'whatsapp_from',
            'reminder_days', 'welcome_message_template', 'renewal_reminder_template', 'expired_reminder_template',
        ):
            if field in data:
                setattr(gym_settings, field, data[field])
        gym_settings.save()
        return Response({'message': 'Settings updated'})
