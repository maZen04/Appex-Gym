import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class EmployeeManager(BaseUserManager):
    def create_user(self, phone, full_name, password=None, role='Reception', **extra):
        if not phone:
            raise ValueError('Phone number is required')
        employee = self.model(phone=phone, full_name=full_name, role=role, **extra)
        employee.set_password(password)
        employee.save(using=self._db)
        return employee

    def create_superuser(self, phone, full_name, password=None, **extra):
        extra.setdefault('role', 'Owner')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(phone, full_name, password, **extra)


class Employee(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('Owner', 'Owner'), ('Reception', 'Reception')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, unique=True)
    email = models.EmailField(blank=True, null=True)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default='Reception')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['full_name']

    objects = EmployeeManager()

    def __str__(self):
        return f'{self.full_name} ({self.role})'


class GymSettings(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    gym_name = models.CharField(max_length=255, default='Appex Gym')
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=32, blank=True, null=True)
    whatsapp_enabled = models.BooleanField(default=False)
    whatsapp_provider = models.CharField(max_length=32, default='twilio')
    whatsapp_from = models.CharField(max_length=32, blank=True, null=True)
    reminder_days = models.CharField(max_length=32, default='7,3,1')
    welcome_message_template = models.TextField(
        default='Welcome to {gym_name}, {member_name}! 🎉 Your membership is now active. '
                'Show this QR code at reception for check-in.')
    renewal_reminder_template = models.TextField(
        default='Hi {member_name}, your membership at {gym_name} expires on {expiry_date}. '
                'Renew now to keep your access active!')
    expired_reminder_template = models.TextField(
        default='Hi {member_name}, your membership at {gym_name} has expired. '
                'Come back and renew to continue your fitness journey!')

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class MembershipPlan(models.Model):
    TYPE_CHOICES = [('Monthly', 'Monthly'), ('Quarterly', 'Quarterly'), ('Yearly', 'Yearly'), ('Custom', 'Custom')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['duration_days']

    def __str__(self):
        return self.name


class Member(models.Model):
    GENDER_CHOICES = [('Male', 'Male'), ('Female', 'Female')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='members/', blank=True, null=True)
    qr_code = models.CharField(max_length=64, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def photo_url(self):
        return self.photo.url if self.photo else None

    def __str__(self):
        return self.full_name


class Membership(models.Model):
    STATUS_CHOICES = [('Active', 'Active'), ('Expired', 'Expired'), ('Frozen', 'Frozen'), ('Cancelled', 'Cancelled')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='memberships')
    plan = models.ForeignKey(MembershipPlan, on_delete=models.PROTECT, related_name='memberships')
    start_date = models.DateField()
    end_date = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='Active')
    freeze_start = models.DateField(blank=True, null=True)
    freeze_end = models.DateField(blank=True, null=True)
    freeze_days = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    @property
    def paid_amount(self):
        return self.payments.aggregate(models.Sum('amount'))['amount__sum'] or 0

    @property
    def due_amount(self):
        due = self.price - self.paid_amount
        return due if due > 0 else 0


class Payment(models.Model):
    METHOD_CHOICES = [('Cash', 'Cash'), ('Visa', 'Visa'), ('Instapay', 'Instapay')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='payments')
    membership = models.ForeignKey(Membership, on_delete=models.SET_NULL, related_name='payments', blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=16, choices=METHOD_CHOICES)
    payment_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']


class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendance')
    check_in_date = models.DateField()
    check_in_time = models.TimeField()
    method = models.CharField(max_length=16, default='QR')

    class Meta:
        ordering = ['-check_in_date', '-check_in_time']


class WhatsAppMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='whatsapp_messages', blank=True, null=True)
    phone = models.CharField(max_length=32)
    type = models.CharField(max_length=32)
    message = models.TextField()
    status = models.CharField(max_length=16, default='simulated')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
