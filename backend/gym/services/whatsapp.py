"""
WhatsApp sending service, wired to Twilio's WhatsApp API shape (the same
approach used by the Node version of this project).

To go live:
  1. Create a Twilio account + WhatsApp sender.
  2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM as environment
     variables (see backend/.env.example).
  3. Turn on "Enable live WhatsApp sending" in Settings.

Until then, every "send" is safely logged to the WhatsAppMessage table with
status 'simulated' instead of hitting an external API.
"""
import base64
import urllib.request
import urllib.parse
import urllib.error
from django.conf import settings
from ..models import WhatsAppMessage, GymSettings


def fill_template(template, **kwargs):
    out = template
    for key, val in kwargs.items():
        out = out.replace(f'{{{key}}}', str(val) if val is not None else '')
    return out


def send_whatsapp(member, phone, msg_type, message):
    gym_settings = GymSettings.load()
    status = 'simulated'

    if gym_settings.whatsapp_enabled and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_WHATSAPP_FROM:
        try:
            url = f'https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json'
            data = urllib.parse.urlencode({
                'From': f'whatsapp:{settings.TWILIO_WHATSAPP_FROM}',
                'To': f'whatsapp:{phone}',
                'Body': message,
            }).encode()
            auth = base64.b64encode(f'{settings.TWILIO_ACCOUNT_SID}:{settings.TWILIO_AUTH_TOKEN}'.encode()).decode()
            req = urllib.request.Request(url, data=data, headers={'Authorization': f'Basic {auth}'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = 'sent' if resp.status < 300 else 'failed'
        except Exception:
            status = 'failed'

    return WhatsAppMessage.objects.create(member=member, phone=phone, type=msg_type, message=message, status=status)
