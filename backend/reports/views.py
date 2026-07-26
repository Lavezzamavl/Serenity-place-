from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from patients.models import Patient
from pharmacy.models import Drug
from billing.models import Invoice
from datetime import date, timedelta


class SummaryReportView(APIView):
    """GET /api/reports/summary/ - real numbers pulled live from the DB,
    not mock data. This is what the Reports module's dashboard-style
    view is built from."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        patients = Patient.objects.all()
        invoices = Invoice.objects.all()
        low_stock_drugs = [d for d in Drug.objects.all() if d.status != 'OK']

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
        })