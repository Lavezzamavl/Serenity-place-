import { useState, useEffect } from 'react';
import { Pill, AlertTriangle, Search, Send, Plus, X, Loader2 } from 'lucide-react';
import { getDrugs, dispenseMedication, addStock } from '../api/pharmacy';
import { getPatients } from '../api/patients';

const STATUS_STYLES = {
  OK: 'bg-sage/15 text-sage',
  Low: 'bg-red-50 text-red-500',
  'Expiring Soon': 'bg-amber-50 text-amber-600',
};

export default function Pharmacy({ user }) {
  const [drugs, setDrugs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [dispenseTarget, setDispenseTarget] = useState(null);
  const [form, setForm] = useState({ patient: '', quantity: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // NEW: add-stock modal state
  const [stockTarget, setStockTarget] = useState(null); // the drug being restocked
  const [stockForm, setStockForm] = useState({
    quantity: '', batch_number: '', supplier: '', buying_price: '', selling_price: '', notes: '',
  });
  const [stockError, setStockError] = useState('');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const isAdmin = user?.is_superuser || user?.role?.is_admin_role;

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

  const openAddStock = (drug) => {
    setStockTarget(drug);
    setStockForm({
      quantity: '', batch_number: drug.batch_number || '', supplier: drug.supplier || '',
      buying_price: drug.buying_price || '', selling_price: drug.selling_price || '', notes: '',
    });
    setStockError('');
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
      await loadDrugs();
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

  // NEW: submit handler for adding stock
  const handleAddStock = async (e) => {
    e.preventDefault();
    setStockError('');

    const qty = Number(stockForm.quantity);
    const buy = Number(stockForm.buying_price);
    const sell = Number(stockForm.selling_price);
    if (!qty || qty < 1) return setStockError('Enter a valid quantity.');
    if (buy < 0 || sell < 0) return setStockError('Prices cannot be negative.');

    setStockSubmitting(true);
    try {
      await addStock({
        drug: stockTarget.id,
        quantity: qty,
        batch_number: stockForm.batch_number,
        supplier: stockForm.supplier,
        buying_price: buy,
        selling_price: sell,
        notes: stockForm.notes,
      });
      await loadDrugs();
      setStockTarget(null);
    } catch (err) {
      const serverMsg = err.response?.data?.quantity?.[0] || err.response?.data?.detail;
      setStockError(serverMsg || (
        err.response?.status === 403
          ? 'Only administrators can add stock or change pricing.'
          : 'Could not add stock. Please try again.'
      ));
    } finally {
      setStockSubmitting(false);
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
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Drug</th>
              <th className="text-left px-5 py-3 font-medium">Strength / Form</th>
              <th className="text-left px-5 py-3 font-medium">Stock</th>
              <th className="text-left px-5 py-3 font-medium">Buy / Sell</th>
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
                <td className="px-5 py-3 text-slate font-mono text-xs">
                  {d.buying_price} / {d.selling_price}
                </td>
                <td className="px-5 py-3 text-slate">{d.expiry_date}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[d.status]}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openDispense(d)}
                      disabled={d.stock_quantity === 0}
                      className="flex items-center gap-1 text-serenity text-xs font-medium hover:text-harbor disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispense
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openAddStock(d)}
                        className="flex items-center gap-1 text-sage text-xs font-medium hover:text-harbor"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Stock
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* existing dispense modal stays exactly as-is below this point */}

      {stockTarget && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-harbor">Add Stock — {stockTarget.name}</h3>
              <button onClick={() => setStockTarget(null)}><X className="w-4 h-4 text-slate" /></button>
            </div>
            <form onSubmit={handleAddStock} className="space-y-3">
              <div>
                <label className="text-xs text-slate">Quantity to add</label>
                <input
                  type="number" min="1" value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate">Buying price</label>
                  <input
                    type="number" min="0" step="0.01" value={stockForm.buying_price}
                    onChange={(e) => setStockForm({ ...stockForm, buying_price: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate">Selling price</label>
                  <input
                    type="number" min="0" step="0.01" value={stockForm.selling_price}
                    onChange={(e) => setStockForm({ ...stockForm, selling_price: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate">Batch number</label>
                <input
                  value={stockForm.batch_number}
                  onChange={(e) => setStockForm({ ...stockForm, batch_number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate">Supplier</label>
                <input
                  value={stockForm.supplier}
                  onChange={(e) => setStockForm({ ...stockForm, supplier: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
              {stockError && <p className="text-xs text-red-500">{stockError}</p>}
              <button
                type="submit" disabled={stockSubmitting}
                className="w-full py-2.5 rounded-lg bg-serenity text-white text-sm font-medium hover:bg-harbor disabled:opacity-50"
              >
                {stockSubmitting ? 'Saving...' : 'Add Stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}