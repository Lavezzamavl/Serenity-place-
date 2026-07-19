import { Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import { INVOICES, PAYMENT_METHODS_SUMMARY } from '../data/mockBilling';

const STATUS_STYLES = {
  Paid: 'bg-sage/15 text-sage',
  Partial: 'bg-amber-50 text-amber-600',
  Outstanding: 'bg-red-50 text-red-500',
};

export default function Billing() {
  const totalRevenue = INVOICES.reduce((sum, i) => sum + i.paid, 0);
  const totalOutstanding = INVOICES.reduce((sum, i) => sum + (i.amount - i.paid), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-slate/60 text-xs uppercase tracking-wide mb-2">
            <TrendingUp className="w-3.5 h-3.5" /> Collected
          </div>
          <p className="font-display text-2xl font-semibold text-harbor">
            KES {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-slate/60 text-xs uppercase tracking-wide mb-2">
            <AlertCircle className="w-3.5 h-3.5" /> Outstanding
          </div>
          <p className="font-display text-2xl font-semibold text-red-500">
            KES {totalOutstanding.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-slate/60 text-xs uppercase tracking-wide mb-2">
            <Receipt className="w-3.5 h-3.5" /> Invoices Issued
          </div>
          <p className="font-display text-2xl font-semibold text-harbor">{INVOICES.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h4 className="font-medium text-harbor">Recent Invoices</h4>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Invoice</th>
              <th className="text-left px-5 py-3 font-medium">Patient</th>
              <th className="text-left px-5 py-3 font-medium">Items</th>
              <th className="text-left px-5 py-3 font-medium">Amount</th>
              <th className="text-left px-5 py-3 font-medium">Paid</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-mist/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-harbor">{inv.id}</td>
                <td className="px-5 py-3 font-medium text-harbor">{inv.patient}</td>
                <td className="px-5 py-3 text-slate">{inv.items}</td>
                <td className="px-5 py-3 font-mono text-harbor">KES {inv.amount.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-slate">KES {inv.paid.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-medium text-harbor mb-4">Payments by Method (This Month)</h4>
        <div className="space-y-3">
          {PAYMENT_METHODS_SUMMARY.map((p) => {
            const max = Math.max(...PAYMENT_METHODS_SUMMARY.map((x) => x.amount));
            return (
              <div key={p.method}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate">{p.method}</span>
                  <span className="font-mono text-harbor">KES {p.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-mist rounded-full overflow-hidden">
                  <div className="h-full bg-serenity rounded-full" style={{ width: `${(p.amount / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}