from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from patients.models import Patient
from pharmacy.models import Drug
from inventory.models import InventoryItem
from billing.models import Invoice, Payment
from facility_settings.models import FacilitySettings
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

        return Response({
            'current_admissions': current_admissions,
            'available_beds': available_beds,
            'new_admissions_today': new_admissions_today,
            'discharged_this_week': discharged_this_week,
            'revenue_this_month': revenue_this_month,
            'total_outstanding_balance': total_outstanding,
            'pharmacy_stock_alerts': len(low_stock_drugs),
            'inventory_stock_alerts': len(low_stock_inventory),
            'revenue_trend': revenue_trend,
            'admission_trend': admission_trend,
        })
