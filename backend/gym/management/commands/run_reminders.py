from django.core.management.base import BaseCommand
from gym.services.reminders import run_reminder_check


class Command(BaseCommand):
    help = 'Runs the WhatsApp renewal/expiry reminder check once (intended to be scheduled via cron)'

    def handle(self, *args, **options):
        count = run_reminder_check()
        self.stdout.write(self.style.SUCCESS(f'Reminder check complete. {count} message(s) processed.'))
