import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, Pill, Package, Loader2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getSummaryReport, getDashboardSummary } from '../api/reports';

export default function Reports() {
  const [data, setData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSummaryReport(), getDashboardSummary()])
      .then(([summary, dashboard]) => { setData(summary); setTrends(dashboard); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading report...</div>;
  if (!data) return <div className="text-center py-16 text-slate">Could not load report data.</div>;

  const cards = [
    { label: 'Total Patients', value: data.total_patients, icon: Users },
    { label: 'Currently Admitted', value: data.admitted_patients, icon: Users },
    { label: 'Discharged Patients', value: data.discharged_patients, icon: Users },
    { label: 'New Admissions (7 days)', value: data.new_admissions_last_7_days, icon: Users },
    { label: 'Revenue Collected', value: `KES ${data.total_revenue_collected.toLocaleString()}`, icon: TrendingUp },
    { label: 'Outstanding Balance', value: `KES ${data.total_outstanding_balance.toLocaleString()}`, icon: AlertCircle },
    { label: 'Drugs Needing Attention', value: data.drugs_needing_attention, icon: Pill },
    { label: 'Inventory Items Needing Attention', value: data.inventory_items_needing_attention, icon: Package },
    { label: 'Inventory Stock Value', value: `KES ${data.inventory_stock_value.toLocaleString()}`, icon: Package },
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

      {trends && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-harbor mb-4">Revenue Trend (6 months, KES millions)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trends.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#4f7d7a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-harbor mb-4">Admissions vs Discharges (6 months)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trends.admission_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="admissions" fill="#4f7d7a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discharges" fill="#c9a25f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}