from datetime import date, timedelta
from ..models import Membership, GymSettings
from .whatsapp import send_whatsapp, fill_template


def run_reminder_check():
    gym_settings = GymSettings.load()
    reminder_days = [d.strip() for d in (gym_settings.reminder_days or '7,3,1').split(',') if d.strip()]
    sent_count = 0
    today = date.today()

    # Upcoming-renewal reminders (e.g. 7, 3, 1 days before expiry)
    for days in reminder_days:
        target_date = today + timedelta(days=int(days))
        upcoming = Membership.objects.filter(status='Active', end_date=target_date).select_related('member')
        for m in upcoming:
            message = fill_template(
                gym_settings.renewal_reminder_template,
                gym_name=gym_settings.gym_name, member_name=m.member.full_name, expiry_date=m.end_date,
            )
            send_whatsapp(m.member, m.member.phone, f'renewal_reminder_{days}d', message)
            sent_count += 1

    # Post-expiry reminder (the day after expiry)
    yesterday = today - timedelta(days=1)
    just_expired = Membership.objects.filter(status='Active', end_date=yesterday).select_related('member')
    for m in just_expired:
        message = fill_template(
            gym_settings.expired_reminder_template,
            gym_name=gym_settings.gym_name, member_name=m.member.full_name,
        )
        send_whatsapp(m.member, m.member.phone, 'expired_reminder', message)
        m.status = 'Expired'
        m.save(update_fields=['status'])
        sent_count += 1

    return sent_count
