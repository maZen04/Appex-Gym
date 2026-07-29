from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import WhatsAppMessage
from ..serializers import WhatsAppMessageSerializer
from ..services.reminders import run_reminder_check


class WhatsAppMessagesView(APIView):
    def get(self, request):
        rows = WhatsAppMessage.objects.select_related('member').all()[:100]
        return Response(WhatsAppMessageSerializer(rows, many=True).data)


class RunRemindersView(APIView):
    def post(self, request):
        count = run_reminder_check()
        return Response({'message': f'Reminder check complete. {count} message(s) processed.'})
