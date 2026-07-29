from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Member, GymSettings
from ..serializers import MemberSerializer, MembershipSerializer, PaymentSerializer, AttendanceSerializer
from ..services.qr import generate_member_qr, qr_image_data_url
from ..services.whatsapp import send_whatsapp, fill_template


class MemberListView(APIView):
    def get(self, request):
        search = request.query_params.get('search')
        qs = Member.objects.all()
        if search:
            qs = qs.filter(Q(full_name__icontains=search) | Q(phone__icontains=search))

        rows = MemberSerializer(qs, many=True, context={'request': request}).data
        for row, member in zip(rows, qs):
            current = member.memberships.order_by('-end_date').first()
            row['current_membership'] = MembershipSerializer(current).data if current else None
        return Response(rows)

    def post(self, request):
        data = request.data
        full_name, phone = data.get('full_name'), data.get('phone')
        if not full_name or not phone:
            return Response({'error': 'full_name and phone are required'}, status=400)

        member = Member.objects.create(
            full_name=full_name, phone=phone, email=data.get('email') or None,
            gender=data.get('gender') or None, date_of_birth=data.get('date_of_birth') or None,
            address=data.get('address') or None, emergency_contact=data.get('emergency_contact') or None,
            notes=data.get('notes') or None, photo=request.FILES.get('photo'),
        )
        code, qr_image = generate_member_qr(member.id)
        member.qr_code = code
        member.save(update_fields=['qr_code'])

        gym_settings = GymSettings.load()
        message = fill_template(gym_settings.welcome_message_template, gym_name=gym_settings.gym_name, member_name=full_name)
        send_whatsapp(member, phone, 'welcome', message)

        return Response({
            'id': str(member.id), 'full_name': full_name, 'phone': phone,
            'qr_code': code, 'qr_image': qr_image,
            'photo_url': request.build_absolute_uri(member.photo.url) if member.photo else None,
        }, status=201)


class MemberDetailView(APIView):
    def get(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)

        data = MemberSerializer(member, context={'request': request}).data
        data['memberships'] = MembershipSerializer(member.memberships.select_related('plan').all(), many=True).data
        data['payments'] = PaymentSerializer(member.payments.all(), many=True).data
        data['attendance'] = AttendanceSerializer(member.attendance.all()[:100], many=True).data
        return Response(data)

    def put(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)

        data = request.data
        for field in ('full_name', 'phone', 'email', 'gender', 'date_of_birth', 'address', 'emergency_contact', 'notes'):
            if field in data:
                setattr(member, field, data[field])
        if request.FILES.get('photo'):
            member.photo = request.FILES['photo']
        member.save()
        return Response({'message': 'Member updated'})

    def delete(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)
        member.delete()
        return Response({'message': 'Member deleted'})


class MemberQRView(APIView):
    def get(self, request, pk):
        try:
            member = Member.objects.get(pk=pk)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)
        return Response({'qr_code': member.qr_code, 'qr_image': qr_image_data_url(member.qr_code)})
