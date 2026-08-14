import { useState, useEffect } from 'react';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { getPatients, createPatient } from '../api/patients';
import { validatePatientForm } from '../utils/validation';

const EMPTY_FORM = {
  full_name: '', age: '', gender: 'Male', ward: 'Ward A', diagnosis: '',
  height_cm: '', weight_kg: '', temperature_c: '', pulse_bpm: '', blood_pressure: '',
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => setApiError('Could not load patients. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(query.toLowerCase()) ||
    p.admission_id.toLowerCase().includes(query.toLowerCase())
  );

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
      // Surface Django's own validation errors if ours somehow missed something
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
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or admission ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
          />
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

      {/* Table wrapper scrolls horizontally on small screens instead of squashing columns */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading patients...
          </div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Admission ID</th>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Age / Gender</th>
                <th className="text-left px-5 py-3 font-medium">Ward</th>
                <th className="text-left px-5 py-3 font-medium">BMI</th>
                <th className="text-left px-5 py-3 font-medium">Diagnosis</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-mist/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-harbor">{p.admission_id}</td>
                  <td className="px-5 py-3 font-medium text-harbor">{p.full_name}</td>
                  <td className="px-5 py-3 text-slate">{p.age} / {p.gender}</td>
                  <td className="px-5 py-3 text-slate">{p.ward}</td>
                  <td className="px-5 py-3 font-mono text-slate">{p.bmi ?? '—'}</td>
                  <td className="px-5 py-3 text-slate">{p.diagnosis || 'Pending assessment'}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-sage/15 text-sage">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate/60">No patients match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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
    </div>
  );
}