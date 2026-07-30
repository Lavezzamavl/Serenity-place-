import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, Pill, Loader2 } from 'lucide-react';
import { getSummaryReport } from '../api/reports';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getSummaryReport().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report...</div>;
  if (!data) return <div className="text-center py-16 text-slate">Could not load report data.</div>;

  const cards = [
    { label: 'Total Patients', value: data.total_patients, icon: Users },
    { label: 'Currently Admitted', value: data.admitted_patients, icon: Users },
    { label: 'New Admissions (7 days)', value: data.new_admissions_last_7_days, icon: Users },
    { label: 'Revenue Collected', value: `KES ${data.total_revenue_collected.toLocaleString()}`, icon: TrendingUp },
    { label: 'Outstanding Balance', value: `KES ${data.total_outstanding_balance.toLocaleString()}`, icon: AlertCircle },
    { label: 'Drugs Needing Attention', value: data.drugs_needing_attention, icon: Pill },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate">Live figures pulled directly from the database — not a static snapshot.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <c.icon className="w-5 h-5 text-serenity mb-3" />
            <p className="font-display text-2xl font-semibold text-harbor">{c.value}</p>
            <p className="text-xs text-slate mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}