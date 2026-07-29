import os
from django.apps import AppConfig


class GymConfig(AppConfig):
    name = 'gym'

    def ready(self):
        # Only start the scheduler in the actual runserver process (not the
        # autoreloader's parent process), and never during migrations/tests.
        if os.environ.get('RUN_MAIN') != 'true' and 'runserver' in os.sys.argv:
            return
        if 'migrate' in os.sys.argv or 'makemigrations' in os.sys.argv or 'test' in os.sys.argv:
            return

        from apscheduler.schedulers.background import BackgroundScheduler

        def daily_reminder_job():
            from gym.services.reminders import run_reminder_check
            run_reminder_check()

        scheduler = BackgroundScheduler(daemon=True)
        scheduler.add_job(daily_reminder_job, 'cron', hour=9, minute=0)
        scheduler.start()
