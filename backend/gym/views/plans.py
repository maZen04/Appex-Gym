from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import MembershipPlan
from ..serializers import MembershipPlanSerializer
from ..permissions import IsOwner


class PlanListView(APIView):
    def get(self, request):
        rows = MembershipPlan.objects.all()
        return Response(MembershipPlanSerializer(rows, many=True).data)

    def post(self, request):
        if request.user.role != 'Owner':
            return Response({'error': 'Owner access required'}, status=403)
        data = request.data
        name, type_, price, duration_days = data.get('name'), data.get('type'), data.get('price'), data.get('duration_days')
        if not all([name, type_, price, duration_days]):
            return Response({'error': 'name, type, price and duration_days are required'}, status=400)
        plan = MembershipPlan.objects.create(name=name, type=type_, price=price, duration_days=duration_days)
        return Response(MembershipPlanSerializer(plan).data, status=201)


class PlanDetailView(APIView):
    permission_classes = [IsOwner]

    def put(self, request, pk):
        try:
            plan = MembershipPlan.objects.get(pk=pk)
        except MembershipPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)
        data = request.data
        for field in ('name', 'type', 'price', 'duration_days', 'is_active'):
            if field in data:
                setattr(plan, field, data[field])
        plan.save()
        return Response({'message': 'Plan updated'})

    def delete(self, request, pk):
        try:
            plan = MembershipPlan.objects.get(pk=pk)
        except MembershipPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)
        plan.is_active = False
        plan.save()
        return Response({'message': 'Plan deactivated'})
