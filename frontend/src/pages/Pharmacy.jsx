import { useState } from 'react';
import { Pill, AlertTriangle, Search } from 'lucide-react';
import { PHARMACY_STOCK } from '../data/mockPharmacy';

const STATUS_STYLES = {
  OK: 'bg-sage/15 text-sage',
  Low: 'bg-red-50 text-red-500',
  'Expiring Soon': 'bg-amber-50 text-amber-600',
};

export default function Pharmacy() {
  const [query, setQuery] = useState('');
  const filtered = PHARMACY_STOCK.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );
  const alerts = PHARMACY_STOCK.filter((d) => d.status !== 'OK');

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-medium">{alerts.length} drugs</span> need attention — low stock or approaching expiry.
          </p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate/50 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medication..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Drug</th>
              <th className="text-left px-5 py-3 font-medium">Strength / Form</th>
              <th className="text-left px-5 py-3 font-medium">Stock</th>
              <th className="text-left px-5 py-3 font-medium">Min. Stock</th>
              <th className="text-left px-5 py-3 font-medium">Expiry</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-mist/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-serenity/60" />
                    <div>
                      <p className="font-medium text-harbor">{d.name}</p>
                      <p className="text-xs text-slate/60">{d.generic}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate">{d.strength} · {d.form}</td>
                <td className="px-5 py-3 font-mono text-harbor">{d.stock}</td>
                <td className="px-5 py-3 font-mono text-slate/60">{d.minStock}</td>
                <td className="px-5 py-3 text-slate">{d.expiry}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[d.status]}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}