import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Loader2, Check, ShieldCheck, KeyRound, Smartphone } from 'lucide-react';
import { getFacilitySettings, updateFacilitySettings } from '../api/settings';
import { getAuditLogs } from '../api/audit';
import { changePassword, mfaSetup, mfaEnable, mfaDisable } from '../api/auth';

export default function SettingsPage({ user, onUserUpdate }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // --- Change password ---------------------------------------------------
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  // --- MFA -----------------------------------------------------------
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSetupData, setMfaSetupData] = useState(null); // { secret, qr_code }
  const [mfaCode, setMfaCode] = useState('');
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [showMfaDisable, setShowMfaDisable] = useState(false);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(pwForm.old_password, pwForm.new_password);
      setPwSaved(true);
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      const data = err.response?.data;
      setPwError(
        data?.old_password?.[0] || data?.new_password?.[0] || data?.detail
          || 'Could not change password. Check your current password and try again.'
      );
    } finally {
      setPwSaving(false);
    }
  };

  const handleMfaSetup = async () => {
    setMfaError('');
    setMfaBusy(true);
    try {
      const data = await mfaSetup();
      setMfaSetupData(data);
    } catch {
      setMfaError('Could not start MFA setup. Please try again.');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaEnable = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaBusy(true);
    try {
      await mfaEnable(mfaCode);
      setMfaSetupData(null);
      setMfaCode('');
      onUserUpdate?.({ mfa_enabled: true });
    } catch (err) {
      setMfaError(err.response?.data?.detail || 'Invalid code. Please try again.');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaDisable = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaBusy(true);
    try {
      await mfaDisable(mfaDisablePassword);
      setMfaDisablePassword('');
      setShowMfaDisable(false);
      onUserUpdate?.({ mfa_enabled: false });
    } catch (err) {
      setMfaError(err.response?.data?.password?.[0] || 'Incorrect password.');
    } finally {
      setMfaBusy(false);
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

          <div>
            <label className="block text-xs font-medium text-slate mb-1">Per-Diem Bed Rates (KES / day)</label>
            <p className="text-xs text-slate/50 mb-2">
              Used by "Run Daily Bed Charges" on the Billing page. Leave a ward at 0 to skip auto-charging it.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-slate/60 mb-1">Ward A</label>
                <input
                  type="number"
                  value={form?.ward_a_daily_rate || ''}
                  onChange={(e) => setForm({ ...form, ward_a_daily_rate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
              </div>
              <div>
                <label className="block text-xs text-slate/60 mb-1">Ward B</label>
                <input
                  type="number"
                  value={form?.ward_b_daily_rate || ''}
                  onChange={(e) => setForm({ ...form, ward_b_daily_rate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
              </div>
              <div>
                <label className="block text-xs text-slate/60 mb-1">Ward C</label>
                <input
                  type="number"
                  value={form?.ward_c_daily_rate || ''}
                  onChange={(e) => setForm({ ...form, ward_c_daily_rate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {saved && <p className="text-sm text-sage bg-sage/10 px-3 py-2 rounded-lg flex items-center gap-1.5"><Check className="w-4 h-4" /> Saved.</p>}

          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60 mt-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Settings
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-5">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-4 h-4 text-serenity" />
          <h4 className="font-medium text-harbor">Change Password</h4>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Current Password</label>
            <input
              type="password"
              value={pwForm.old_password}
              onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate mb-1">New Password</label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate mb-1">Confirm New Password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              required
            />
          </div>

          {pwError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>}
          {pwSaved && <p className="text-sm text-sage bg-sage/10 px-3 py-2 rounded-lg flex items-center gap-1.5"><Check className="w-4 h-4" /> Password updated.</p>}

          <button type="submit" disabled={pwSaving} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60 mt-2">
            {pwSaving && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-5">
        <div className="flex items-center gap-2 mb-5">
          <Smartphone className="w-4 h-4 text-serenity" />
          <h4 className="font-medium text-harbor">Two-Factor Authentication</h4>
        </div>

        {mfaError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">{mfaError}</p>}

        {user?.mfa_enabled ? (
          <div>
            <p className="text-sm text-slate mb-3 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-sage" /> MFA is enabled on your account.
            </p>
            {!showMfaDisable ? (
              <button
                onClick={() => setShowMfaDisable(true)}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Disable MFA
              </button>
            ) : (
              <form onSubmit={handleMfaDisable} className="space-y-3 mt-2">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={mfaDisablePassword}
                    onChange={(e) => setMfaDisablePassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={mfaBusy} className="flex items-center justify-center gap-2 bg-red-500 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-60">
                    {mfaBusy && <Loader2 className="w-4 h-4 animate-spin" />} Disable
                  </button>
                  <button type="button" onClick={() => { setShowMfaDisable(false); setMfaDisablePassword(''); setMfaError(''); }} className="text-sm text-slate hover:text-harbor py-2 px-4">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : mfaSetupData ? (
          <form onSubmit={handleMfaEnable} className="space-y-3">
            <p className="text-sm text-slate">Scan this QR code with your authenticator app, then enter the 6-digit code it generates.</p>
            <img src={mfaSetupData.qr_code} alt="MFA QR code" className="w-40 h-40 mx-auto border border-gray-100 rounded-lg" />
            <p className="text-xs text-slate/60 text-center">Can't scan it? Enter this key manually: <span className="font-mono">{mfaSetupData.secret}</span></p>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">Authenticator Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-serenity"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={mfaBusy} className="flex items-center justify-center gap-2 bg-serenity text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-harbor disabled:opacity-60">
                {mfaBusy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm & Enable
              </button>
              <button type="button" onClick={() => { setMfaSetupData(null); setMfaCode(''); setMfaError(''); }} className="text-sm text-slate hover:text-harbor py-2 px-4">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm text-slate mb-3">Add an extra layer of security by requiring a code from an authenticator app at login.</p>
            <button onClick={handleMfaSetup} disabled={mfaBusy} className="flex items-center justify-center gap-2 bg-serenity text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-harbor disabled:opacity-60">
              {mfaBusy && <Loader2 className="w-4 h-4 animate-spin" />} Enable MFA
            </button>
          </div>
        )}
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