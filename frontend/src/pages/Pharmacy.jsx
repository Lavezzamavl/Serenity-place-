import { useState, useEffect } from 'react';
import { Pill, AlertTriangle, Search, Send, X, Loader2 } from 'lucide-react';
import { getDrugs, dispenseMedication } from '../api/pharmacy';
import { getPatients } from '../api/patients';

const STATUS_STYLES = {
  OK: 'bg-sage/15 text-sage',
  Low: 'bg-red-50 text-red-500',
  'Expiring Soon': 'bg-amber-50 text-amber-600',
};

export default function Pharmacy() {
  const [drugs, setDrugs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [dispenseTarget, setDispenseTarget] = useState(null); // the drug being dispensed
  const [form, setForm] = useState({ patient: '', quantity: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDrugs = () => getDrugs().then(setDrugs);

  useEffect(() => {
    Promise.all([loadDrugs(), getPatients().then(setPatients)])
      .finally(() => setLoading(false));
  }, []);

  const filtered = drugs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));
  const alerts = drugs.filter((d) => d.status !== 'OK');

  const openDispense = (drug) => {
    setDispenseTarget(drug);
    setForm({ patient: patients[0]?.id || '', quantity: '', notes: '' });
    setError('');
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(form.quantity);
    if (!form.patient) return setError('Select a patient.');
    if (!qty || qty < 1) return setError('Enter a valid quantity.');
    if (qty > dispenseTarget.stock_quantity) {
      return setError(`Only ${dispenseTarget.stock_quantity} units in stock.`);
    }

    setSubmitting(true);
    try {
      await dispenseMedication({
        drug: dispenseTarget.id,
        patient: form.patient,
        quantity: qty,
        notes: form.notes,
      });
      await loadDrugs(); // refresh stock numbers from the server - source of truth
      setDispenseTarget(null);
    } catch (err) {
      const serverMsg = err.response?.data?.quantity?.[0] || err.response?.data?.detail;
      setError(serverMsg || (
        err.response?.status === 403
          ? "Your role doesn't have permission to dispense medication."
          : 'Could not dispense medication. Please try again.'
      ));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading pharmacy stock...
      </div>
    );
  }

  return (
    <div className="space-y-5">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Drug</th>
              <th className="text-left px-5 py-3 font-medium">Strength / Form</th>
              <th className="text-left px-5 py-3 font-medium">Stock</th>
              <th className="text-left px-5 py-3 font-medium">Expiry</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
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
                      <p className="text-xs text-slate/60">{d.generic_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate">{d.strength} · {d.form}</td>
                <td className="px-5 py-3 font-mono text-harbor">{d.stock_quantity}</td>
                <td className="px-5 py-3 text-slate">{d.expiry_date}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[d.status]}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => openDispense(d)}
                    disabled={d.stock_quantity === 0}
                    className="flex items-center gap-1 text-serenity text-xs font-medium hover:text-harbor disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispense
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dispenseTarget && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-harbor">Dispense Medication</h3>
                <p className="text-xs text-slate mt-0.5">{dispenseTarget.name} {dispenseTarget.strength} — {dispenseTarget.stock_quantity} in stock</p>
              </div>
              <button onClick={() => setDispenseTarget(null)} className="text-slate hover:text-harbor">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDispense} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Patient</label>
                <select
                  value={form.patient}
                  onChange={(e) => setForm({ ...form, patient: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.admission_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={dispenseTarget.stock_quantity}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors disabled:opacity-60 mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Dispensing...' : 'Confirm Dispense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}