from django.core.management.base import BaseCommand
from gym.models import Employee, MembershipPlan


class Command(BaseCommand):
    help = 'Seeds default Owner/Reception logins and sample membership plans'

    def handle(self, *args, **options):
        if not Employee.objects.filter(role='Owner').exists():
            Employee.objects.create_user(phone='01000000000', full_name='Gym Owner', password='owner123', role='Owner', email='owner@appexgym.com')
            self.stdout.write(self.style.SUCCESS('Seeded default Owner login -> phone: 01000000000 / password: owner123'))

        if not Employee.objects.filter(role='Reception').exists():
            Employee.objects.create_user(phone='01000000001', full_name='Front Desk', password='reception123', role='Reception', email='reception@appexgym.com')
            self.stdout.write(self.style.SUCCESS('Seeded default Reception login -> phone: 01000000001 / password: reception123'))

        if not MembershipPlan.objects.exists():
            MembershipPlan.objects.create(name='Monthly Plan', type='Monthly', price=500, duration_days=30)
            MembershipPlan.objects.create(name='Quarterly Plan', type='Quarterly', price=1350, duration_days=90)
            MembershipPlan.objects.create(name='Yearly Plan', type='Yearly', price=4800, duration_days=365)
            self.stdout.write(self.style.SUCCESS('Seeded default membership plans'))
