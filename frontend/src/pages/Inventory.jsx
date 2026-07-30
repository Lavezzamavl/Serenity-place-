import { useState, useEffect } from 'react';
import { Package, Plus, Minus, X, Loader2, AlertTriangle } from 'lucide-react';
import { getInventoryItems, adjustStock } from '../api/inventory';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [direction, setDirection] = useState('add'); // 'add' | 'remove'
  const [form, setForm] = useState({ quantity: '', reason: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => getInventoryItems().then(setItems);

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const openAdjust = (item, dir) => {
    setTarget(item); setDirection(dir); setForm({ quantity: '', reason: '' }); setError('');
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
      await adjustStock(target.id, change, form.reason);
      await load();
      setTarget(null);
    } catch (err) {
      setError(err.response?.data?.change?.[0] || 'Could not adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inventory...</div>;

  const alerts = items.filter((i) => i.status === 'Low');

  return (
    <div className="space-y-5">
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700"><span className="font-medium">{alerts.length} items</span> at or below minimum stock.</p>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Item</th>
              <th className="text-left px-5 py-3 font-medium">Category</th>
              <th className="text-left px-5 py-3 font-medium">Quantity</th>
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
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'Low' ? 'bg-red-50 text-red-500' : 'bg-sage/15 text-sage'}`}>{item.status}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openAdjust(item, 'add')} className="text-sage hover:text-harbor" title="Restock"><Plus className="w-4 h-4" /></button>
                    <button onClick={() => openAdjust(item, 'remove')} className="text-red-400 hover:text-harbor" title="Use/Remove"><Minus className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate/60">No inventory items yet.</td></tr>}
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