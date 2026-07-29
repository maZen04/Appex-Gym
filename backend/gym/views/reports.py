import csv
from datetime import date, timedelta
from io import BytesIO
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth, ExtractWeekDay, ExtractHour
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Member, Membership, Payment, Attendance, MembershipPlan


def date_range_filter(qs, range_, from_date, to_date):
    today = date.today()
    if range_ == 'today':
        return qs.filter(payment_date=today), 'Today'
    if range_ == 'week':
        return qs.filter(payment_date__gte=today - timedelta(days=7)), 'This Week'
    if range_ == 'month':
        return qs.filter(payment_date__year=today.year, payment_date__month=today.month), 'This Month'
    if range_ == 'year':
        return qs.filter(payment_date__year=today.year), 'This Year'
    if range_ == 'custom':
        return qs.filter(payment_date__gte=from_date, payment_date__lte=to_date), 'Custom Range'
    return qs, 'All Time'


class RevenueReportView(APIView):
    def get(self, request):
        range_ = request.query_params.get('range', 'month')
        qs, label = date_range_filter(Payment.objects.all(), range_, request.query_params.get('from'), request.query_params.get('to'))
        total = qs.aggregate(s=Sum('amount'))['s'] or 0
        by_method = qs.values('method').annotate(total=Sum('amount'), count=Count('id'))
        return Response({
            'range': label, 'total_revenue': float(total),
            'revenue_by_method': [{'method': r['method'], 'total': float(r['total']), 'count': r['count']} for r in by_method],
        })


class MembersReportView(APIView):
    def get(self, request):
        today = date.today()
        total = Member.objects.count()
        active = Membership.objects.filter(status='Active', end_date__gte=today).values('member').distinct().count()
        expired = Membership.objects.exclude(status='Frozen').filter(end_date__lt=today).values('member').distinct().count()
        new_this_month = Member.objects.filter(created_at__year=today.year, created_at__month=today.month).count()
        return Response({'total_members': total, 'active_members': active, 'expired_members': expired, 'new_members_this_month': new_this_month})


class MembershipsReportView(APIView):
    def get(self, request):
        rows = Membership.objects.values('status').annotate(count=Count('id'))
        return Response(list(rows))


class AttendanceReportView(APIView):
    def get(self, request):
        thirty_days_ago = date.today() - timedelta(days=30)
        daily = Attendance.objects.filter(check_in_date__gte=thirty_days_ago).values('check_in_date').annotate(count=Count('id')).order_by('check_in_date')
        daily = [{'date': str(r['check_in_date']), 'count': r['count']} for r in daily]

        monthly = (
            Attendance.objects.annotate(month=TruncMonth('check_in_date'))
            .values('month').annotate(count=Count('id')).order_by('-month')[:12]
        )
        monthly = [{'month': r['month'].strftime('%Y-%m'), 'count': r['count']} for r in monthly]

        most_active = (
            Attendance.objects.values('member__full_name', 'member__phone')
            .annotate(visits=Count('id')).order_by('-visits')[:10]
        )
        most_active = [{'full_name': r['member__full_name'], 'phone': r['member__phone'], 'visits': r['visits']} for r in most_active]

        return Response({'daily_attendance': daily, 'monthly_attendance': monthly, 'most_active_members': most_active})


class PaymentsReportView(APIView):
    def get(self, request):
        qs = Payment.objects.select_related('member').all()
        member_id, from_date, to_date = request.query_params.get('member_id'), request.query_params.get('from'), request.query_params.get('to')
        if member_id:
            qs = qs.filter(member_id=member_id)
        if from_date:
            qs = qs.filter(payment_date__gte=from_date)
        if to_date:
            qs = qs.filter(payment_date__lte=to_date)
        return Response([
            {'id': str(p.id), 'payment_date': p.payment_date, 'full_name': p.member.full_name, 'phone': p.member.phone, 'amount': float(p.amount), 'method': p.method}
            for p in qs
        ])


class ExpiredMembersReportView(APIView):
    def get(self, request):
        today = date.today()
        rows = Membership.objects.exclude(status='Frozen').filter(end_date__lt=today).select_related('member').order_by('end_date')
        return Response([
            {
                'full_name': m.member.full_name, 'phone': m.member.phone, 'end_date': m.end_date,
                'days_since_expiry': (today - m.end_date).days,
            }
            for m in rows
        ])


class AnalyticsView(APIView):
    def get(self, request):
        today = date.today()

        # Revenue trend (last 12 months) with month-over-month growth %
        monthly_revenue = list(
            Payment.objects.annotate(month=TruncMonth('payment_date'))
            .values('month').annotate(total=Sum('amount')).order_by('-month')[:12]
        )
        monthly_revenue.reverse()
        revenue_trend = []
        for i, row in enumerate(monthly_revenue):
            growth = None
            if i > 0 and monthly_revenue[i - 1]['total']:
                growth = round(float((row['total'] - monthly_revenue[i - 1]['total']) / monthly_revenue[i - 1]['total']) * 1000) / 10
            revenue_trend.append({'month': row['month'].strftime('%Y-%m'), 'total': float(row['total']), 'growth_pct': growth})

        # Plan popularity
        plan_popularity = []
        for plan in MembershipPlan.objects.all():
            memberships = Membership.objects.filter(plan=plan)
            active_count = memberships.filter(status='Active', end_date__gte=today).count()
            revenue = Payment.objects.filter(membership__plan=plan).aggregate(s=Sum('amount'))['s'] or 0
            plan_popularity.append({
                'plan_name': plan.name, 'plan_type': plan.type, 'total_sold': memberships.count(),
                'active_count': active_count, 'revenue': float(revenue),
            })
        plan_popularity.sort(key=lambda p: p['revenue'], reverse=True)

        # Attendance by weekday (0=Sunday..6=Saturday to match the Node/SQLite version) and hour
        weekday_rows = Attendance.objects.annotate(wd=ExtractWeekDay('check_in_date')).values('wd').annotate(count=Count('id'))
        # Django's ExtractWeekDay: Sunday=1..Saturday=7 -> convert to 0-6 (Sunday=0)
        attendance_by_weekday = [{'weekday': (r['wd'] - 1) % 7, 'count': r['count']} for r in weekday_rows]

        hour_rows = Attendance.objects.annotate(hr=ExtractHour('check_in_time')).values('hr').annotate(count=Count('id'))
        attendance_by_hour = [{'hour': r['hr'], 'count': r['count']} for r in hour_rows]

        # Retention: renewed within 14 days of previous expiry vs churned
        by_member = {}
        for m in Membership.objects.order_by('member_id', 'start_date').values('member_id', 'start_date', 'end_date'):
            by_member.setdefault(m['member_id'], []).append(m)
        renewed, churned = 0, 0
        for history in by_member.values():
            for i in range(len(history) - 1):
                gap_days = (history[i + 1]['start_date'] - history[i]['end_date']).days
                if gap_days <= 14:
                    renewed += 1
                else:
                    churned += 1
            last = history[-1]
            if last['end_date'] < today:
                churned += 1
        retention_total = renewed + churned
        retention_rate = round((renewed / retention_total) * 1000) / 10 if retention_total > 0 else None

        total_revenue = Payment.objects.aggregate(s=Sum('amount'))['s'] or 0
        total_members = Member.objects.count()
        avg_revenue_per_member = round(float(total_revenue) / total_members, 2) if total_members > 0 else 0

        outstanding_balance_total = 0
        for m in Membership.objects.filter(status='Active'):
            outstanding_balance_total += float(m.due_amount)

        return Response({
            'revenue_trend': revenue_trend,
            'plan_popularity': plan_popularity,
            'attendance_by_weekday': attendance_by_weekday,
            'attendance_by_hour': attendance_by_hour,
            'retention': {'renewed': renewed, 'churned': churned, 'retention_rate': retention_rate},
            'avg_revenue_per_member': avg_revenue_per_member,
            'outstanding_balance_total': outstanding_balance_total,
        })


class ExportCSVView(APIView):
    def get(self, request, report):
        today = date.today()
        if report == 'expired-members':
            rows = [
                {'full_name': m.member.full_name, 'phone': m.member.phone, 'end_date': str(m.end_date)}
                for m in Membership.objects.exclude(status='Frozen').filter(end_date__lt=today).select_related('member')
            ]
        elif report == 'payments':
            rows = [
                {'payment_date': str(p.payment_date), 'full_name': p.member.full_name, 'phone': p.member.phone, 'amount': float(p.amount), 'method': p.method}
                for p in Payment.objects.select_related('member').order_by('-payment_date')
            ]
        elif report == 'members':
            rows = [
                {'full_name': m.full_name, 'phone': m.phone, 'email': m.email or '', 'gender': m.gender or '', 'created_at': str(m.created_at)}
                for m in Member.objects.all()
            ]
        else:
            return Response({'error': 'Unknown report type'}, status=400)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{report}.csv"'
        if not rows:
            response.write('No data')
            return response
        writer = csv.DictWriter(response, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        return response


class ExportPDFView(APIView):
    def get(self, request, report):
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4

        today = date.today()
        if report == 'expired-members':
            title = 'Expired Members Report'
            rows = [[m.member.full_name, m.member.phone, str(m.end_date)] for m in Membership.objects.exclude(status='Frozen').filter(end_date__lt=today).select_related('member')]
            headers = ['Name', 'Phone', 'Expired On']
        elif report == 'payments':
            title = 'Payments Report'
            rows = [[str(p.payment_date), p.member.full_name, str(p.amount), p.method] for p in Payment.objects.select_related('member').order_by('-payment_date')]
            headers = ['Date', 'Member', 'Amount', 'Method']
        elif report == 'members':
            title = 'Members Report'
            rows = [[m.full_name, m.phone, m.gender or ''] for m in Member.objects.all()]
            headers = ['Name', 'Phone', 'Gender']
        else:
            return Response({'error': 'Unknown report type'}, status=400)

        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        width, height = A4
        c.setFont('Helvetica-Bold', 16)
        c.drawCentredString(width / 2, height - 50, title)

        y = height - 90
        c.setFont('Helvetica-Bold', 10)
        c.drawString(40, y, '   |   '.join(headers))
        y -= 20
        c.setFont('Helvetica', 9)
        if not rows:
            c.drawString(40, y, 'No data available.')
        else:
            for row in rows:
                if y < 40:
                    c.showPage()
                    c.setFont('Helvetica', 9)
                    y = height - 50
                c.drawString(40, y, '   |   '.join(str(v) for v in row))
                y -= 16
        c.save()
        buf.seek(0)

        response = HttpResponse(buf.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{report}.pdf"'
        return response
