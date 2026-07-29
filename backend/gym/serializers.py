from rest_framework import serializers
from .models import Employee, GymSettings, MembershipPlan, Member, Membership, Payment, Attendance, WhatsAppMessage


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'phone', 'email', 'role', 'created_at']


class GymSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GymSettings
        fields = [
            'gym_name', 'address', 'phone', 'whatsapp_enabled', 'whatsapp_provider', 'whatsapp_from',
            'reminder_days', 'welcome_message_template', 'renewal_reminder_template', 'expired_reminder_template',
        ]


class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = ['id', 'name', 'type', 'price', 'duration_days', 'is_active', 'created_at']


class MemberSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            'id', 'full_name', 'phone', 'email', 'gender', 'date_of_birth', 'address',
            'emergency_contact', 'notes', 'photo_url', 'qr_code', 'created_at',
        ]

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return obj.photo_url


class MembershipSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    plan_type = serializers.CharField(source='plan.type', read_only=True)
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_id = serializers.UUIDField(source='member.id', read_only=True)
    paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    due_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Membership
        fields = [
            'id', 'member_id', 'plan_id', 'plan_name', 'plan_type', 'member_name', 'member_phone',
            'start_date', 'end_date', 'price', 'status', 'freeze_start', 'freeze_end', 'freeze_days',
            'paid_amount', 'due_amount', 'created_at',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='member.full_name', read_only=True)
    phone = serializers.CharField(source='member.phone', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'member_id', 'membership_id', 'amount', 'method', 'payment_date', 'notes', 'full_name', 'phone', 'created_at']


class AttendanceSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='member.full_name', read_only=True)
    phone = serializers.CharField(source='member.phone', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'member_id', 'full_name', 'phone', 'check_in_date', 'check_in_time', 'method']


class WhatsAppMessageSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='member.full_name', read_only=True, default=None)

    class Meta:
        model = WhatsAppMessage
        fields = ['id', 'member_id', 'full_name', 'phone', 'type', 'message', 'status', 'created_at']
