from django.contrib import admin
from .models import Employee, GymSettings, MembershipPlan, Member, Membership, Payment, Attendance, WhatsAppMessage

admin.site.register(Employee)
admin.site.register(GymSettings)
admin.site.register(MembershipPlan)
admin.site.register(Member)
admin.site.register(Membership)
admin.site.register(Payment)
admin.site.register(Attendance)
admin.site.register(WhatsAppMessage)
