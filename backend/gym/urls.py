from django.urls import path
from .views.auth import LoginView, MeView
from .views.members import MemberListView, MemberDetailView, MemberQRView
from .views.memberships import (
    MembershipListView, MembershipBalanceView, MembershipRenewView,
    MembershipFreezeView, MembershipUnfreezeView, MembershipCancelView,
)
from .views.plans import PlanListView, PlanDetailView
from .views.attendance import AttendanceListView, CheckInView
from .views.payments import PaymentListView, PaymentDetailView
from .views.employees import EmployeeListView, EmployeeDetailView
from .views.settings_view import SettingsView
from .views.dashboard import DashboardStatsView, DashboardAlertsView, DashboardChartsView, RenewalsTodayView
from .views.whatsapp import WhatsAppMessagesView, RunRemindersView
from .views.reports import (
    RevenueReportView, MembersReportView, MembershipsReportView, AttendanceReportView,
    PaymentsReportView, ExpiredMembersReportView, AnalyticsView, ExportCSVView, ExportPDFView,
)

urlpatterns = [
    path('auth/login', LoginView.as_view()),
    path('auth/me', MeView.as_view()),

    path('members', MemberListView.as_view()),
    path('members/<uuid:pk>', MemberDetailView.as_view()),
    path('members/<uuid:pk>/qr', MemberQRView.as_view()),

    path('memberships', MembershipListView.as_view()),
    path('memberships/<uuid:pk>/balance', MembershipBalanceView.as_view()),
    path('memberships/<uuid:member_id>/renew', MembershipRenewView.as_view()),
    path('memberships/<uuid:pk>/freeze', MembershipFreezeView.as_view()),
    path('memberships/<uuid:pk>/unfreeze', MembershipUnfreezeView.as_view()),
    path('memberships/<uuid:pk>/cancel', MembershipCancelView.as_view()),

    path('plans', PlanListView.as_view()),
    path('plans/<uuid:pk>', PlanDetailView.as_view()),

    path('attendance', AttendanceListView.as_view()),
    path('attendance/checkin', CheckInView.as_view()),

    path('payments', PaymentListView.as_view()),
    path('payments/<uuid:pk>', PaymentDetailView.as_view()),

    path('employees', EmployeeListView.as_view()),
    path('employees/<uuid:pk>', EmployeeDetailView.as_view()),

    path('settings', SettingsView.as_view()),

    path('dashboard/stats', DashboardStatsView.as_view()),
    path('dashboard/alerts', DashboardAlertsView.as_view()),
    path('dashboard/charts', DashboardChartsView.as_view()),
    path('dashboard/renewals-today', RenewalsTodayView.as_view()),

    path('whatsapp/messages', WhatsAppMessagesView.as_view()),
    path('whatsapp/run-reminders', RunRemindersView.as_view()),

    path('reports/revenue', RevenueReportView.as_view()),
    path('reports/members', MembersReportView.as_view()),
    path('reports/memberships', MembershipsReportView.as_view()),
    path('reports/attendance', AttendanceReportView.as_view()),
    path('reports/payments', PaymentsReportView.as_view()),
    path('reports/expired-members', ExpiredMembersReportView.as_view()),
    path('reports/analytics', AnalyticsView.as_view()),
    path('reports/export/<str:report>/csv', ExportCSVView.as_view()),
    path('reports/export/<str:report>/pdf', ExportPDFView.as_view()),
]
