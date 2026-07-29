from datetime import datetime, date as date_cls
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Attendance, Member, Membership
from ..serializers import AttendanceSerializer


class AttendanceListView(APIView):
    def get(self, request):
        date_param = request.query_params.get('date')
        qs = Attendance.objects.select_related('member').all()
        if date_param:
            qs = qs.filter(check_in_date=date_param)
        else:
            qs = qs[:200]
        return Response(AttendanceSerializer(qs, many=True).data)


class CheckInView(APIView):
    def post(self, request):
        data = request.data
        qr_code, member_id, method = data.get('qr_code'), data.get('member_id'), data.get('method')

        if qr_code:
            member = Member.objects.filter(qr_code=qr_code).first()
            if not member:
                return Response({'error': 'No member matches this QR code'}, status=404)
        elif member_id:
            member = Member.objects.filter(pk=member_id).first()
            if not member:
                return Response({'error': 'Member not found'}, status=404)
        else:
            return Response({'error': 'qr_code or member_id is required'}, status=400)

        now = datetime.now()
        attendance = Attendance.objects.create(
            member=member, check_in_date=now.date(), check_in_time=now.time(),
            method=method or ('QR' if qr_code else 'Manual'),
        )

        current = member.memberships.order_by('-end_date').first()
        expired = True
        if current:
            expired = current.end_date < date_cls.today() and current.status != 'Frozen'

        return Response({
            'id': str(attendance.id),
            'member': {
                'id': str(member.id), 'full_name': member.full_name, 'phone': member.phone,
                'photo_url': request.build_absolute_uri(member.photo.url) if member.photo else None,
            },
            'check_in_time': attendance.check_in_time.strftime('%H:%M:%S'),
            'check_in_date': str(attendance.check_in_date),
            'membership_warning': "This member's membership is expired or missing" if expired else None,
        }, status=201)
