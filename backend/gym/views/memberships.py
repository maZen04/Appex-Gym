from datetime import timedelta, date as date_cls
from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Membership, MembershipPlan, Member, Payment
from ..serializers import MembershipSerializer


def add_days(start_date, days):
    return start_date + timedelta(days=int(days))


def record_payment(membership, member, amount, method, notes=None):
    return Payment.objects.create(
        member=member, membership=membership, amount=amount, method=method,
        payment_date=date_cls.today(), notes=notes,
    )


class MembershipListView(APIView):
    def get(self, request):
        rows = Membership.objects.select_related('member', 'plan').all()
        return Response(MembershipSerializer(rows, many=True).data)

    def post(self, request):
        data = request.data
        member_id, plan_id, start_date = data.get('member_id'), data.get('plan_id'), data.get('start_date')
        if not all([member_id, plan_id, start_date]):
            return Response({'error': 'member_id, plan_id and start_date are required'}, status=400)

        try:
            member = Member.objects.get(pk=member_id)
            plan = MembershipPlan.objects.get(pk=plan_id)
        except (Member.DoesNotExist, MembershipPlan.DoesNotExist):
            return Response({'error': 'Member or plan not found'}, status=404)

        start = date_cls.fromisoformat(start_date)
        end = add_days(start, plan.duration_days)
        membership = Membership.objects.create(
            member=member, plan=plan, start_date=start, end_date=end, price=plan.price, status='Active',
        )

        amount = data.get('payment_amount')
        amount = float(amount) if amount is not None else float(plan.price)
        payment_id = None
        if amount > 0:
            if amount > float(plan.price):
                membership.delete()
                return Response({'error': f"Payment ({amount}) can't exceed the plan price ({plan.price})"}, status=400)
            method = data.get('payment_method')
            if not method:
                membership.delete()
                return Response({'error': 'payment_method is required when recording a payment'}, status=400)
            payment = record_payment(membership, member, amount, method, data.get('payment_notes'))
            payment_id = str(payment.id)

        return Response({
            'id': str(membership.id), 'member_id': str(member.id), 'plan_id': str(plan.id),
            'start_date': start, 'end_date': end, 'price': plan.price, 'status': 'Active',
            'paid_amount': amount, 'due_amount': max(0, float(plan.price) - amount), 'payment_id': payment_id,
        }, status=201)


class MembershipBalanceView(APIView):
    def get(self, request, pk):
        try:
            m = Membership.objects.get(pk=pk)
        except Membership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=404)
        return Response({'price': m.price, 'paid_amount': m.paid_amount, 'due_amount': m.due_amount})


class MembershipRenewView(APIView):
    def post(self, request, member_id):
        data = request.data
        plan_id = data.get('plan_id')
        try:
            member = Member.objects.get(pk=member_id)
            plan = MembershipPlan.objects.get(pk=plan_id)
        except (Member.DoesNotExist, MembershipPlan.DoesNotExist):
            return Response({'error': 'Member or plan not found'}, status=404)

        start = date_cls.fromisoformat(data['start_date']) if data.get('start_date') else date_cls.today()
        end = add_days(start, plan.duration_days)
        membership = Membership.objects.create(
            member=member, plan=plan, start_date=start, end_date=end, price=plan.price, status='Active',
        )

        amount = data.get('payment_amount')
        amount = float(amount) if amount is not None else float(plan.price)
        payment_id = None
        if amount > 0:
            if amount > float(plan.price):
                membership.delete()
                return Response({'error': f"Payment ({amount}) can't exceed the plan price ({plan.price})"}, status=400)
            method = data.get('payment_method')
            if not method:
                membership.delete()
                return Response({'error': 'payment_method is required when recording a payment'}, status=400)
            payment = record_payment(membership, member, amount, method, data.get('payment_notes'))
            payment_id = str(payment.id)

        return Response({
            'id': str(membership.id), 'member_id': str(member.id), 'plan_id': str(plan.id),
            'start_date': start, 'end_date': end, 'price': plan.price, 'status': 'Active',
            'paid_amount': amount, 'due_amount': max(0, float(plan.price) - amount), 'payment_id': payment_id,
        }, status=201)


class MembershipFreezeView(APIView):
    def post(self, request, pk):
        try:
            m = Membership.objects.get(pk=pk)
        except Membership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=404)
        data = request.data
        freeze_start, freeze_end = data.get('freeze_start'), data.get('freeze_end')
        if not freeze_start or not freeze_end:
            return Response({'error': 'freeze_start and freeze_end are required'}, status=400)

        fs, fe = date_cls.fromisoformat(freeze_start), date_cls.fromisoformat(freeze_end)
        days = max(0, (fe - fs).days)
        new_end = add_days(m.end_date, days)

        m.status = 'Frozen'
        m.freeze_start, m.freeze_end, m.freeze_days = fs, fe, days
        m.end_date = new_end
        m.save()
        return Response({'message': 'Membership frozen', 'freeze_days': days, 'new_end_date': new_end})


class MembershipUnfreezeView(APIView):
    def post(self, request, pk):
        try:
            m = Membership.objects.get(pk=pk)
        except Membership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=404)
        m.status = 'Expired' if m.end_date < date_cls.today() else 'Active'
        m.save()
        return Response({'message': 'Membership reactivated', 'status': m.status})


class MembershipCancelView(APIView):
    def post(self, request, pk):
        try:
            m = Membership.objects.get(pk=pk)
        except Membership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=404)
        m.status = 'Cancelled'
        m.save()
        return Response({'message': 'Membership cancelled'})
