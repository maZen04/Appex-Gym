from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Payment, Member, Membership
from ..serializers import PaymentSerializer


class PaymentListView(APIView):
    def get(self, request):
        qs = Payment.objects.select_related('member').all()
        member_id = request.query_params.get('member_id')
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if member_id:
            qs = qs.filter(member_id=member_id)
        if from_date:
            qs = qs.filter(payment_date__gte=from_date)
        if to_date:
            qs = qs.filter(payment_date__lte=to_date)
        return Response(PaymentSerializer(qs, many=True).data)

    def post(self, request):
        data = request.data
        member_id, membership_id = data.get('member_id'), data.get('membership_id')
        amount, method, payment_date = data.get('amount'), data.get('method'), data.get('payment_date')

        if not member_id or amount is None or not method or not payment_date:
            return Response({'error': 'member_id, amount, method and payment_date are required'}, status=400)
        if method not in ('Cash', 'Visa', 'Instapay'):
            return Response({'error': 'method must be Cash, Visa or Instapay'}, status=400)

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response({'error': 'Amount must be a number'}, status=400)
        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero'}, status=400)

        try:
            member = Member.objects.get(pk=member_id)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)

        membership = None
        if membership_id:
            try:
                membership = Membership.objects.get(pk=membership_id)
            except Membership.DoesNotExist:
                return Response({'error': 'Membership not found'}, status=404)
            if str(membership.member_id) != str(member.id):
                return Response({'error': 'This membership does not belong to the selected member'}, status=400)

            due = float(membership.due_amount)
            if due <= 0:
                return Response({'error': 'This membership is already fully paid — no balance remaining'}, status=400)
            if amount > due:
                return Response({'error': f'Amount exceeds the remaining balance ({due} EGP due)'}, status=400)

        payment = Payment.objects.create(
            member=member, membership=membership, amount=amount, method=method,
            payment_date=payment_date, notes=data.get('notes') or None,
        )
        return Response(PaymentSerializer(payment).data, status=201)


class PaymentDetailView(APIView):
    def delete(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)
        payment.delete()
        return Response({'message': 'Payment deleted'})
