import { useState, useEffect } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { getDrugs } from '../api/pharmacy';
import { getPatients } from '../api/patients';
import { getDispenseRecords, dispenseMedication } from '../api/dispensing';

export default function Dispensing() {
  const [drugs, setDrugs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ patient: '', drug: '', quantity: 1, unit_price: '', notes: '' });

  const selectedDrug = drugs.find((d) => String(d.id) === String(form.drug));
  const totalCharge = (Number(form.quantity) || 0) * (Number(form.unit_price) || 0);

  useEffect(() => {
    Promise.all([getDrugs(), getPatients(), getDispenseRecords()])
      .then(([d, p, r]) => { setDrugs(d); setPatients(p); setRecords(r); })
      .catch(() => setError('Could not load dispensing data.'))
      .finally(() => setLoading(false));
  }, []);

  // When a drug is picked, default the unit price to its selling price.
  const handleDrugChange = (drugId) => {
    const drug = drugs.find((d) => String(d.id) === String(drugId));
    setForm((f) => ({ ...f, drug: drugId, unit_price: drug ? drug.selling_price : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = Number(form.quantity);
    if (!form.patient) return setError('Select a patient.');
    if (!form.drug) return setError('Select a drug.');
    if (!qty || qty < 1) return setError('Enter a valid quantity.');
    if (selectedDrug && qty > selectedDrug.stock_quantity) {
      return setError(`Only ${selectedDrug.stock_quantity} units in stock.`);
    }

    setSubmitting(true);
    try {
      const record = await dispenseMedication({
        patient: form.patient,
        drug: form.drug,
        quantity: qty,
        unit_price: form.unit_price || undefined,
        notes: form.notes,
      });
      setRecords((prev) => [record, ...prev]);
      setDrugs((prev) => prev.map((d) => d.id === record.drug
        ? { ...d, stock_quantity: d.stock_quantity - qty }
        : d));
      setForm({ patient: '', drug: '', quantity: 1, unit_price: '', notes: '' });
    } catch (err) {
      const serverMsg = err.response?.data?.quantity?.[0] || err.response?.data?.detail;
      setError(serverMsg || (
        err.response?.status === 403
          ? "Your role doesn't have permission to dispense medication."
          : 'Could not dispense medication.'
      ));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-harbor">Dispense medication</h1>
      <p className="text-sm text-slate mt-1 mb-6">Records the sale, deducts stock, and charges the patient automatically.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-slate">Patient</label>
              <select
                value={form.patient}
                onChange={(e) => setForm({ ...form, patient: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate">Drug</label>
              <select
                value={form.drug}
                onChange={(e) => handleDrugChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Select drug</option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.stock_quantity === 0}>
                    {d.name} ({d.stock_quantity} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate">Quantity</label>
                <input
                  type="number" min="1" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate">Unit price</label>
                <input
                  type="number" min="0" step="0.01" value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate">Notes</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-xs text-slate">Total charge</p>
                <p className="text-lg font-semibold text-harbor">KES {totalCharge.toLocaleString()}</p>
              </div>
              <button
                type="submit" disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-serenity text-white text-sm font-medium hover:bg-harbor disabled:opacity-50"
              >
                {submitting ? 'Dispensing...' : 'Dispense'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-serenity" />
            <p className="text-xs font-medium text-slate uppercase tracking-wide">Recent dispensing</p>
          </div>
          {records.length === 0 ? (
            <p className="text-sm text-slate/50 px-4 py-8 text-center">No dispensing records yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-2.5">When</th>
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-4 py-2.5">Drug</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 text-slate">{new Date(r.dispensed_at).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-harbor">{r.patient_name}</td>
                    <td className="px-4 py-2.5 text-harbor">{r.drug_name}</td>
                    <td className="px-4 py-2.5 font-mono">{r.quantity}</td>
                    <td className="px-4 py-2.5 font-mono text-harbor">KES {Number(r.total_charge).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}