from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from ..serializers import EmployeeSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        password = request.data.get('password')
        if not phone or not password:
            return Response({'error': 'Phone and password are required'}, status=400)

        employee = authenticate(request, phone=phone, password=password)
        if not employee:
            return Response({'error': 'Invalid phone or password'}, status=401)

        token = RefreshToken.for_user(employee)
        return Response({
            'token': str(token.access_token),
            'user': {
                'id': str(employee.id), 'full_name': employee.full_name,
                'role': employee.role, 'phone': employee.phone,
            },
        })


class MeView(APIView):
    def get(self, request):
        return Response(EmployeeSerializer(request.user).data)
