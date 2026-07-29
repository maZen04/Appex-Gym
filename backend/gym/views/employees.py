from rest_framework.views import APIView
from rest_framework.response import Response
from ..models import Employee
from ..serializers import EmployeeSerializer
from ..permissions import IsOwner


class EmployeeListView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        rows = Employee.objects.all().order_by('-created_at')
        return Response(EmployeeSerializer(rows, many=True).data)

    def post(self, request):
        data = request.data
        full_name, phone, role, password = data.get('full_name'), data.get('phone'), data.get('role'), data.get('password')
        if not all([full_name, phone, role, password]):
            return Response({'error': 'full_name, phone, role and password are required'}, status=400)
        if role not in ('Owner', 'Reception'):
            return Response({'error': 'role must be Owner or Reception'}, status=400)
        if Employee.objects.filter(phone=phone).exists():
            return Response({'error': 'An employee with this phone already exists'}, status=409)

        employee = Employee.objects.create_user(
            phone=phone, full_name=full_name, password=password, role=role, email=data.get('email') or None,
        )
        return Response(EmployeeSerializer(employee).data, status=201)


class EmployeeDetailView(APIView):
    permission_classes = [IsOwner]

    def put(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)

        data = request.data
        employee.full_name = data.get('full_name', employee.full_name)
        employee.phone = data.get('phone', employee.phone)
        employee.email = data.get('email', employee.email)
        employee.role = data.get('role', employee.role)
        if data.get('password'):
            employee.set_password(data['password'])
        employee.save()
        return Response({'message': 'Employee updated'})

    def delete(self, request, pk):
        try:
            employee = Employee.objects.get(pk=pk)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=404)
        if str(request.user.id) == str(pk):
            return Response({'error': "You can't delete your own account"}, status=400)
        employee.delete()
        return Response({'message': 'Employee removed'})
