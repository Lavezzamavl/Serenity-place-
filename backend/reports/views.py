from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from patients.models import Patient
from pharmacy.models import Drug
from inventory.models import InventoryItem
from billing.models import Invoice, Payment
from facility_settings.models import FacilitySettings
from hr.models import StaffProfile, LeaveRequest
from audit_trail.models import AuditLog
from datetime import date, timedelta
from calendar import month_abbr


class SummaryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = Patient.objects.all()
        invoices = Invoice.objects.all()
        low_stock_drugs = [d for d in Drug.objects.all() if d.status != 'OK']
        low_stock_inventory = [i for i in InventoryItem.objects.all() if i.status != 'OK']
        inventory_stock_value = sum(float(i.stock_value) for i in InventoryItem.objects.all())

        total_revenue = sum(float(inv.total_paid) for inv in invoices)
        total_outstanding = sum(float(inv.balance) for inv in invoices)

        return Response({
            'total_patients': patients.count(),
            'admitted_patients': patients.filter(status='Admitted').count(),
            'discharged_patients': patients.filter(status='Discharged').count(),
            'new_admissions_last_7_days': patients.filter(
                admission_date__gte=date.today() - timedelta(days=7)
            ).count(),
            'total_invoices': invoices.count(),
            'total_revenue_collected': total_revenue,
            'total_outstanding_balance': total_outstanding,
            'drugs_needing_attention': len(low_stock_drugs),
            'inventory_items_needing_attention': len(low_stock_inventory),
            'inventory_stock_value': inventory_stock_value,
        })


def _month_bounds(months_ago):
    first_of_this_month = date.today().replace(day=1)
    year = first_of_this_month.year
    month = first_of_this_month.month - months_ago
    while month <= 0:
        month += 12
        year -= 1
    start = date(year, month, 1)
    end_month = month + 1
    end_year = year
    if end_month > 12:
        end_month = 1
        end_year += 1
    end = date(end_year, end_month, 1)
    return start, end


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        settings_obj = FacilitySettings.load()

        admitted_qs = Patient.objects.filter(status='Admitted')
        current_admissions = admitted_qs.count()
        available_beds = max(settings_obj.total_beds - current_admissions, 0)
        occupancy_rate = (
            round((current_admissions / settings_obj.total_beds) * 100, 1)
            if settings_obj.total_beds else 0
        )

        new_admissions_today = Patient.objects.filter(admission_date=today).count()
        discharged_this_week = Patient.objects.filter(
            discharged_at__date__gte=today - timedelta(days=7)
        ).count()

        invoices = Invoice.objects.all()
        total_outstanding = sum(float(inv.balance) for inv in invoices)

        this_month_start, next_month_start = _month_bounds(0)
        revenue_this_month = sum(
            float(p.amount) for p in Payment.objects.filter(
                received_at__date__gte=this_month_start,
                received_at__date__lt=next_month_start,
            )
        )

        low_stock_drugs = [d for d in Drug.objects.all() if d.status != 'OK']
        low_stock_inventory = [i for i in InventoryItem.objects.all() if i.status != 'OK']

        total_staff = StaffProfile.objects.filter(employment_status='Active').count()
        pending_leave_requests = LeaveRequest.objects.filter(status='Pending').count()

        revenue_trend = []
        admission_trend = []
        for months_ago in range(5, -1, -1):
            start, end = _month_bounds(months_ago)
            label = month_abbr[start.month]

            month_revenue = sum(
                float(p.amount) for p in Payment.objects.filter(
                    received_at__date__gte=start, received_at__date__lt=end
                )
            )
            month_admissions = Patient.objects.filter(
                admission_date__gte=start, admission_date__lt=end
            ).count()
            month_discharges = Patient.objects.filter(
                discharged_at__date__gte=start, discharged_at__date__lt=end
            ).count()

            revenue_trend.append({'month': label, 'revenue': round(month_revenue / 1_000_000, 2)})
            admission_trend.append({'month': label, 'admissions': month_admissions, 'discharges': month_discharges})

        recent_activity = []
        for log in AuditLog.objects.select_related('actor').order_by('-timestamp')[:8]:
            actor_name = 'System'
            if log.actor:
                full = f"{log.actor.first_name} {log.actor.last_name}".strip()
                actor_name = full or log.actor.username
            recent_activity.append({
                'id': log.id,
                'actor_name': actor_name,
                'action': log.get_action_display(),
                'model_name': log.model_name,
                'object_repr': log.object_repr,
                'timestamp': log.timestamp,
            })

        return Response({
            'current_admissions': current_admissions,
            'available_beds': available_beds,
            'occupancy_rate': occupancy_rate,
            'new_admissions_today': new_admissions_today,
            'discharged_this_week': discharged_this_week,
            'revenue_this_month': revenue_this_month,
            'total_outstanding_balance': total_outstanding,
            'pharmacy_stock_alerts': len(low_stock_drugs),
            'inventory_stock_alerts': len(low_stock_inventory),
            'total_staff': total_staff,
            'pending_leave_requests': pending_leave_requests,
            'revenue_trend': revenue_trend,
            'admission_trend': admission_trend,
            'recent_activity': recent_activity,
        })
