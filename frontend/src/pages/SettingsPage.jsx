import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Loader2, Check, ShieldCheck } from 'lucide-react';
import { getFacilitySettings, updateFacilitySettings } from '../api/settings';
import { getAuditLogs } from '../api/audit';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => { 
    getFacilitySettings()
      .then(setForm)
      .finally(() => setLoading(false)); 
  }, []);

  useEffect(() => { 
    getAuditLogs()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLogsLoading(false)); 
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); 
    setError(''); 
    setSaved(false);
    try {
      const updated = await updateFacilitySettings(form);
      setForm(updated);
      setSaved(true);
    } catch {
      setError("Could not save — your role may not have Settings edit access.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <SettingsIcon className="w-4 h-4 text-serenity" />
          <h4 className="font-medium text-harbor">Facility Settings</h4>
        </div>
        
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Facility Name</label>
            <input 
              value={form?.facility_name || ''} 
              onChange={(e) => setForm({ ...form, facility_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Address</label>
            <input 
              value={form?.address || ''} 
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Phone</label>
              <input 
                value={form?.phone || ''} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Email</label>
              <input 
                type="email" 
                value={form?.email || ''} 
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Rehab Package Price (KES / week)</label>
            <input 
              type="number" 
              value={form?.rehab_package_price || ''} 
              onChange={(e) => setForm({ ...form, rehab_package_price: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" 
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {saved && <p className="text-sm text-sage bg-sage/10 px-3 py-2 rounded-lg flex items-center gap-1.5"><Check className="w-4 h-4" /> Saved.</p>}

          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60 mt-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Settings
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-serenity" />
          <h4 className="font-medium text-harbor">Audit Trail</h4>
        </div>
        {logsLoading ? (
          <div className="flex items-center text-slate text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading audit log...
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {logs.length === 0 && <p className="text-sm text-slate/50">No activity logged yet.</p>}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-3 text-xs border-b border-gray-50 pb-2">
                <div>
                  <span className="font-medium text-harbor">{log.actor_name}</span>
                  <span className="text-slate/60"> — {log.object_repr?.replace(/_/g, ' ')}</span>
                  {log.reason && <span className="text-slate/60"> ({log.reason})</span>}
                </div>
                <span className="text-slate/40 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}