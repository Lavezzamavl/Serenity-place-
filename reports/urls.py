from django.urls import path
from .views import SummaryReportView, DashboardSummaryView

urlpatterns = [
    path('summary/', SummaryReportView.as_view(), name='report-summary'),
    path('dashboard/', DashboardSummaryView.as_view(), name='report-dashboard'),
]