from datetime import date, timedelta
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Member, Membership, Payment, Attendance, MembershipPlan


class DashboardStatsView(APIView):
    def get(self, request):
        today = date.today()
        total_members = Member.objects.count()
        active_members = Membership.objects.filter(status='Active', end_date__gte=today).values('member').distinct().count()

        latest_per_member = {}
        for m in Membership.objects.order_by('member_id', '-end_date'):
            latest_per_member.setdefault(m.member_id, m)
        expired_memberships = sum(1 for m in latest_per_member.values() if m.end_date < today and m.status != 'Frozen')

        revenue_this_month = Payment.objects.filter(payment_date__year=today.year, payment_date__month=today.month).aggregate(s=Sum('amount'))['s'] or 0
        renewals_today = Membership.objects.filter(end_date=today).count()
        today_checkins = Attendance.objects.filter(check_in_date=today).count()

        return Response({
            'total_members': total_members, 'active_members': active_members,
            'expired_memberships': expired_memberships, 'revenue_this_month': float(revenue_this_month),
            'renewals_today': renewals_today, 'today_checkins': today_checkins,
        })


class DashboardAlertsView(APIView):
    def get(self, request):
        today = date.today()
        expiring_soon = Membership.objects.filter(
            status='Active', end_date__gte=today, end_date__lte=today + timedelta(days=3)
        ).select_related('member').order_by('end_date')
        expired = Membership.objects.exclude(status='Frozen').filter(end_date__lt=today).select_related('member').order_by('-end_date')[:20]

        outstanding = []
        for m in Membership.objects.filter(status='Active').select_related('member'):
            if m.due_amount > 0:
                outstanding.append({
                    'id': str(m.member.id), 'full_name': m.member.full_name, 'phone': m.member.phone,
                    'price': float(m.price), 'paid': float(m.paid_amount), 'due': float(m.due_amount),
                })

        return Response({
            'expiring_soon': [{'id': str(m.id), 'full_name': m.member.full_name, 'phone': m.member.phone, 'end_date': m.end_date} for m in expiring_soon],
            'expired': [{'id': str(m.id), 'full_name': m.member.full_name, 'phone': m.member.phone, 'end_date': m.end_date} for m in expired],
            'outstanding_payments': outstanding,
        })


class DashboardChartsView(APIView):
    def get(self, request):
        six_months_ago = date.today().replace(day=1) - timedelta(days=180)
        revenue_by_month = (
            Payment.objects.filter(payment_date__gte=six_months_ago)
            .annotate(month=TruncMonth('payment_date'))
            .values('month').annotate(total=Sum('amount')).order_by('month')
        )
        revenue_by_month = [{'month': r['month'].strftime('%Y-%m'), 'total': float(r['total'])} for r in revenue_by_month][-6:]

        two_weeks_ago = date.today() - timedelta(days=13)
        attendance_by_day = (
            Attendance.objects.filter(check_in_date__gte=two_weeks_ago)
            .values('check_in_date').annotate(count=Count('id')).order_by('check_in_date')
        )
        attendance_by_day = [{'date': str(r['check_in_date']), 'count': r['count']} for r in attendance_by_day]

        membership_distribution = (
            Membership.objects.filter(status='Active')
            .values(type=F('plan__type')).annotate(count=Count('id'))
        )

        return Response({
            'revenue_by_month': revenue_by_month,
            'attendance_by_day': attendance_by_day,
            'membership_distribution': list(membership_distribution),
        })


class RenewalsTodayView(APIView):
    def get(self, request):
        today = date.today()
        rows = Membership.objects.filter(end_date=today).select_related('member').order_by('member__full_name')
        return Response([
            {'membership_id': str(m.id), 'member_id': str(m.member.id), 'full_name': m.member.full_name, 'phone': m.member.phone, 'end_date': m.end_date}
            for m in rows
        ])
