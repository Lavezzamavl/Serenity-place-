import { useState, useEffect } from 'react';
import { Plus, X, Search, Loader2, LogOut, RotateCcw, AlertCircle } from 'lucide-react';
import { getPatients, createPatient, dischargePatient, readmitPatient } from '../api/patients';
import { validatePatientForm } from '../utils/validation';

const EMPTY_FORM = {
  full_name: '', age: '', gender: 'Male', ward: 'Ward A', diagnosis: '',
  height_cm: '', weight_kg: '', temperature_c: '', pulse_bpm: '', blood_pressure: '',
  sponsor_name: '', sponsor_phone: '', sponsor_relationship: '',
  next_of_kin_name: '', next_of_kin_relationship: '', next_of_kin_phone: '',
};

// Mirrors backend CanDischarge (patients/permissions.py) for UI purposes
// only - hides the button when it obviously won't work. The backend is
// the real gate; this just avoids a pointless 403 round-trip.
const DISCHARGE_ROLE_KEYWORDS = ['nurse', 'doctor', 'physician', 'psychiatrist'];
function canDischarge(user) {
  if (!user) return false;
  if (user.is_superuser) return true;
  const role = user.role;
  if (!role) return false;
  if (role.is_admin_role) return true;
  const name = (role.name || '').toLowerCase();
  return DISCHARGE_ROLE_KEYWORDS.some((k) => name.includes(k));
}

export default function Patients({ user }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState('Admitted');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [selected, setSelected] = useState(null); // patient shown in the detail modal
  const [dischargeError, setDischargeError] = useState('');
  const [dischargeBusy, setDischargeBusy] = useState(false);

  const userCanDischarge = canDischarge(user);

  const load = () => getPatients().then(setPatients);

  useEffect(() => {
    load()
      .catch(() => setApiError('Could not load patients. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) =>
    p.status === statusTab &&
    (p.full_name.toLowerCase().includes(query.toLowerCase()) ||
     p.admission_id.toLowerCase().includes(query.toLowerCase()))
  );

  const admittedCount = patients.filter((p) => p.status === 'Admitted').length;
  const dischargedCount = patients.filter((p) => p.status === 'Discharged').length;

  const handleAdmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePatientForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setApiError('');
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        height_cm: form.height_cm || null,
        weight_kg: form.weight_kg || null,
        temperature_c: form.temperature_c || null,
        pulse_bpm: form.pulse_bpm || null,
      };
      const newPatient = await createPatient(payload);
      setPatients((prev) => [newPatient, ...prev]);
      setForm(EMPTY_FORM);
      setErrors({});
      setShowForm(false);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        setErrors(
          Object.fromEntries(
            Object.entries(serverErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
          )
        );
      } else {
        setApiError('Could not admit patient. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (patient) => {
    setSelected(patient);
    setDischargeError('');
  };

  const handleDischarge = async () => {
    setDischargeBusy(true);
    setDischargeError('');
    try {
      const updated = await dischargePatient(selected.id);
      setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelected(updated);
    } catch (err) {
      const data = err.response?.data;
      setDischargeError(
        data?.detail ||
        (err.response?.status === 403
          ? "Your role isn't permitted to discharge patients."
          : 'Could not discharge patient. Please try again.')
      );
    } finally {
      setDischargeBusy(false);
    }
  };

  const handleReadmit = async () => {
    setDischargeBusy(true);
    setDischargeError('');
    try {
      const updated = await readmitPatient(selected.id);
      setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelected(updated);
    } catch (err) {
      setDischargeError(err.response?.data?.detail || 'Could not re-admit patient.');
    } finally {
      setDischargeBusy(false);
    }
  };

  const field = (name, label, type = 'text', placeholder = '', step) => (
    <div>
      <label className="block text-xs font-medium text-slate mb-1">{label}</label>
      <input
        type={type}
        step={step}
        value={form[name]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
          ${errors[name] ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setStatusTab('Admitted')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusTab === 'Admitted' ? 'bg-serenity text-white' : 'text-slate hover:text-harbor'
              }`}
            >
              Admitted ({admittedCount})
            </button>
            <button
              onClick={() => setStatusTab('Discharged')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusTab === 'Discharged' ? 'bg-serenity text-white' : 'text-slate hover:text-harbor'
              }`}
            >
              Discharged ({dischargedCount})
            </button>
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or admission ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
            />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor transition-colors"
        >
          <Plus className="w-4 h-4" /> Admit Patient
        </button>
      </div>

      {apiError && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{apiError}</p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading patients...
          </div>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Admission ID</th>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Age / Gender</th>
                <th className="text-left px-5 py-3 font-medium">Ward</th>
                <th className="text-left px-5 py-3 font-medium">
                  {statusTab === 'Admitted' ? 'Days Admitted' : 'Days Stayed'}
                </th>
                <th className="text-left px-5 py-3 font-medium">Diagnosis</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => openDetail(p)}
                  className="hover:bg-mist/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-mono text-xs text-harbor">{p.admission_id}</td>
                  <td className="px-5 py-3 font-medium text-harbor">{p.full_name}</td>
                  <td className="px-5 py-3 text-slate">{p.age} / {p.gender}</td>
                  <td className="px-5 py-3 text-slate">{p.ward}</td>
                  <td className="px-5 py-3 font-mono text-slate">{p.days_admitted}</td>
                  <td className="px-5 py-3 text-slate">{p.diagnosis || 'Pending assessment'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Admitted' ? 'bg-sage/15 text-sage' : 'bg-slate/10 text-slate'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate/60">
                    No {statusTab.toLowerCase()} patients match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Admit Patient modal */}
      {showForm && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-harbor">Admit New Patient</h3>
              <button onClick={() => setShowForm(false)} className="text-slate hover:text-harbor">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdmit} className="space-y-3">
              {field('full_name', 'Full name', 'text', 'e.g. Jane Wanjiku')}

              <div className="grid grid-cols-2 gap-3">
                {field('age', 'Age', 'number')}
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate mb-1">Ward</label>
                <select
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                >
                  <option>Ward A</option>
                  <option>Ward B</option>
                  <option>Ward C</option>
                </select>
              </div>

              {field('diagnosis', 'Primary diagnosis (optional)', 'text')}

              <p className="text-xs font-medium text-slate uppercase tracking-wide pt-2">Vitals (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                {field('height_cm', 'Height (cm)', 'number', '30–250')}
                {field('weight_kg', 'Weight (kg)', 'number', '2–300')}
                {field('temperature_c', 'Temperature (°C)', 'number', '30.0–43.0', '0.1')}
                {field('pulse_bpm', 'Pulse (bpm)', 'number', '30–220')}
              </div>
              {field('blood_pressure', 'Blood pressure', 'text', 'e.g. 120/80')}

              <p className="text-xs font-medium text-slate uppercase tracking-wide pt-2">Sponsor (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                {field('sponsor_name', 'Sponsor name')}
                {field('sponsor_phone', 'Sponsor phone')}
              </div>
              {field('sponsor_relationship', 'Sponsor relationship', 'text', 'e.g. Employer, NHIF, Self, Family')}

              <p className="text-xs font-medium text-slate uppercase tracking-wide pt-2">Next of Kin (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                {field('next_of_kin_name', 'Next of kin name')}
                {field('next_of_kin_phone', 'Next of kin phone')}
              </div>
              {field('next_of_kin_relationship', 'Relationship', 'text', 'e.g. Spouse, Parent, Sibling')}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors disabled:opacity-60 mt-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Admitting...' : 'Admit Patient'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Patient detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-display text-lg font-semibold text-harbor">{selected.full_name}</h3>
                <p className="text-xs text-slate font-mono mt-0.5">{selected.admission_id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate hover:text-harbor">
                <X className="w-5 h-5" />
              </button>
            </div>

            <span className={`inline-flex mt-3 px-2.5 py-1 rounded-full text-xs font-medium ${
              selected.status === 'Admitted' ? 'bg-sage/15 text-sage' : 'bg-slate/10 text-slate'
            }`}>
              {selected.status}
            </span>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5 text-sm">
              <div><p className="text-xs text-slate/60">Age / Gender</p><p className="text-harbor">{selected.age} / {selected.gender}</p></div>
              <div><p className="text-xs text-slate/60">Ward</p><p className="text-harbor">{selected.ward}</p></div>
              <div><p className="text-xs text-slate/60">Admission Date</p><p className="text-harbor">{selected.admission_date}</p></div>
              <div>
                <p className="text-xs text-slate/60">{selected.status === 'Admitted' ? 'Days Admitted' : 'Total Stay'}</p>
                <p className="text-harbor">{selected.days_admitted} day{selected.days_admitted === 1 ? '' : 's'}</p>
              </div>
              {selected.discharged_at && (
                <div className="col-span-2"><p className="text-xs text-slate/60">Discharged At</p><p className="text-harbor">{new Date(selected.discharged_at).toLocaleString()}</p></div>
              )}
              <div className="col-span-2"><p className="text-xs text-slate/60">Diagnosis</p><p className="text-harbor">{selected.diagnosis || 'Pending assessment'}</p></div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-slate uppercase tracking-wide mb-2">Sponsor</p>
              {selected.sponsor_name ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><p className="text-xs text-slate/60">Name</p><p className="text-harbor">{selected.sponsor_name}</p></div>
                  <div><p className="text-xs text-slate/60">Phone</p><p className="text-harbor">{selected.sponsor_phone || '—'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-slate/60">Relationship</p><p className="text-harbor">{selected.sponsor_relationship || '—'}</p></div>
                </div>
              ) : (
                <p className="text-sm text-slate/50">Not recorded.</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-slate uppercase tracking-wide mb-2">Next of Kin</p>
              {selected.next_of_kin_name ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><p className="text-xs text-slate/60">Name</p><p className="text-harbor">{selected.next_of_kin_name}</p></div>
                  <div><p className="text-xs text-slate/60">Phone</p><p className="text-harbor">{selected.next_of_kin_phone || '—'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-slate/60">Relationship</p><p className="text-harbor">{selected.next_of_kin_relationship || '—'}</p></div>
                </div>
              ) : (
                <p className="text-sm text-slate/50">Not recorded.</p>
              )}
            </div>

            {dischargeError && (
              <div className="mt-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{dischargeError}</span>
              </div>
            )}

            {userCanDischarge && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                {selected.status === 'Admitted' ? (
                  <button
                    onClick={handleDischarge}
                    disabled={dischargeBusy}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
                  >
                    {dischargeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Discharge Patient
                  </button>
                ) : (
                  <button
                    onClick={handleReadmit}
                    disabled={dischargeBusy}
                    className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors disabled:opacity-60"
                  >
                    {dischargeBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Re-admit Patient
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}