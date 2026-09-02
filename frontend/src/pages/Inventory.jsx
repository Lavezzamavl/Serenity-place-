import { useState, useEffect } from 'react';
import { Package, Plus, Minus, X, Loader2, AlertTriangle } from 'lucide-react';
import { getInventoryItems, adjustStock } from '../api/inventory';

const STATUS_STYLES = {
  OK: 'bg-sage/15 text-sage',
  Low: 'bg-red-50 text-red-500',
  'Expiring Soon': 'bg-amber-50 text-amber-600',
};

export default function Inventory({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [direction, setDirection] = useState('add'); // 'add' | 'remove'
  const [form, setForm] = useState({ quantity: '', reason: '', buying_price: '', unit_price: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = user?.is_superuser || user?.role?.is_admin_role;

  const load = () => getInventoryItems().then(setItems);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openAdjust = (item, dir) => {
    setTarget(item);
    setDirection(dir);
    setForm({
      quantity: '', reason: '',
      buying_price: dir === 'add' ? item.buying_price || '' : '',
      unit_price: dir === 'add' ? item.unit_price || '' : '',
    });
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!qty || qty < 1) return setError('Enter a valid quantity.');
    if (!form.reason.trim()) return setError('Reason is required.');

    setSubmitting(true);
    setError('');
    try {
      const change = direction === 'add' ? qty : -qty;
      // Pricing can only be updated on a restock (positive change) - the
      // backend rejects it on removals, so don't even send it there.
      const pricing = direction === 'add'
        ? {
            buying_price: form.buying_price !== '' ? Number(form.buying_price) : undefined,
            unit_price: form.unit_price !== '' ? Number(form.unit_price) : undefined,
          }
        : undefined;
      await adjustStock(target.id, change, form.reason, pricing);
      await load();
      setTarget(null);
    } catch (err) {
      setError(
        err.response?.data?.change?.[0] ||
        err.response?.data?.buying_price?.[0] ||
        (err.response?.status === 403
          ? 'Only administrators can add stock or change pricing.'
          : 'Could not adjust stock.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inventory...</div>;

  const alerts = items.filter((i) => i.status !== 'OK');
  const totalStockValue = items.reduce((sum, i) => sum + Number(i.stock_value || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700"><span className="font-medium">{alerts.length} items</span> need attention — low stock or approaching expiry.</p>
          </div>
        )}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <span className="text-xs text-slate uppercase tracking-wide">Total Stock Value (at cost)</span>
          <span className="font-display text-lg font-semibold text-harbor">KES {totalStockValue.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Item</th>
              <th className="text-left px-5 py-3 font-medium">Category</th>
              <th className="text-left px-5 py-3 font-medium">Quantity</th>
              <th className="text-left px-5 py-3 font-medium">Buy / Sell Price</th>
              <th className="text-left px-5 py-3 font-medium">Expiry</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-mist/50">
                <td className="px-5 py-3"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-serenity/60" /><span className="font-medium text-harbor">{item.name}</span></div></td>
                <td className="px-5 py-3 text-slate">{item.category}</td>
                <td className="px-5 py-3 font-mono text-harbor">{item.quantity} {item.unit}</td>
                <td className="px-5 py-3 text-slate font-mono text-xs">{item.buying_price} / {item.unit_price}</td>
                <td className="px-5 py-3 text-slate">{item.expiry_date || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || 'bg-sage/15 text-sage'}`}>{item.status}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openAdjust(item, 'add')} className="text-sage hover:text-harbor" title="Restock"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => openAdjust(item, 'remove')} className="text-red-400 hover:text-harbor" title="Use/Remove"><Minus className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-slate/60">No inventory items yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {target && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-harbor">{direction === 'add' ? 'Restock' : 'Remove Stock'}: {target.name}</h3>
              <button onClick={() => setTarget(null)} className="text-slate hover:text-harbor"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input type="number" min="1" placeholder="Quantity" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" />
              <input placeholder="Reason (e.g. Weekly delivery, Used in Ward B)" value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" />

              {direction === 'add' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate">Buying price (optional)</label>
                    <input type="number" min="0" step="0.01" value={form.buying_price}
                      onChange={(e) => setForm({ ...form, buying_price: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate">Unit price (optional)</label>
                    <input type="number" min="0" step="0.01" value={form.unit_price}
                      onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Confirm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}