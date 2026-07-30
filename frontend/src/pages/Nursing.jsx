import { useState, useEffect } from 'react';
import { Stethoscope, HeartPulse, Plus, Loader2 } from 'lucide-react';
import { getPatients } from '../api/patients';
import { getNursingNotes, addNursingNote, getVitalsChecks, addVitalsCheck } from '../api/nursing';

export default function Nursing() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [noteForm, setNoteForm] = useState({ shift: 'Morning', note: '' });
  const [vitalsForm, setVitalsForm] = useState({ temperature_c: '', pulse_bpm: '', blood_pressure: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getPatients().then((data) => {
      setPatients(data);
      if (data.length > 0) setSelected(data[0]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    getNursingNotes(selected.id).then(setNotes);
    getVitalsChecks(selected.id).then(setVitals);
  }, [selected]);

  const submitNote = async (e) => {
    e.preventDefault();
    if (!noteForm.note.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const newNote = await addNursingNote(selected.id, noteForm.shift, noteForm.note);
      setNotes((prev) => [newNote, ...prev]);
      setNoteForm({ ...noteForm, note: '' });
    } catch {
      setError("Could not save note — your role may not have Nursing write access.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitVitals = async (e) => {
    e.preventDefault();
    const { temperature_c, pulse_bpm, blood_pressure } = vitalsForm;
    if (!temperature_c || !pulse_bpm || !blood_pressure) return setError('All vitals fields are required.');
    setSubmitting(true);
    setError('');
    try {
      const newCheck = await addVitalsCheck(selected.id, vitalsForm);
      setVitals((prev) => [newCheck, ...prev]);
      setVitalsForm({ temperature_c: '', pulse_bpm: '', blood_pressure: '' });
    } catch (err) {
      setError(err.response?.data?.blood_pressure?.[0] || 'Could not save vitals check.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>;
  if (patients.length === 0) return <div className="text-center py-16 text-slate">No patients admitted yet.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-gray-100"><p className="text-xs font-medium text-slate uppercase tracking-wide">Patients</p></div>
        {patients.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 ${selected?.id === p.id ? 'bg-serenity/10' : 'hover:bg-mist/60'}`}>
            <p className={`text-sm font-medium ${selected?.id === p.id ? 'text-serenity' : 'text-harbor'}`}>{p.full_name}</p>
            <p className="text-xs font-mono text-slate/60">{p.admission_id}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-5">
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}

          {/* Vitals monitoring */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4"><HeartPulse className="w-4 h-4 text-serenity" /><h4 className="font-medium text-harbor">Vitals Monitoring</h4></div>
            <form onSubmit={submitVitals} className="flex flex-wrap gap-2 mb-4">
              <input placeholder="Temp °C" type="number" step="0.1" value={vitalsForm.temperature_c}
                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature_c: e.target.value })}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" />
              <input placeholder="Pulse bpm" type="number" value={vitalsForm.pulse_bpm}
                onChange={(e) => setVitalsForm({ ...vitalsForm, pulse_bpm: e.target.value })}
                className="w-28 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" />
              <input placeholder="BP e.g. 120/80" value={vitalsForm.blood_pressure}
                onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })}
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" />
              <button type="submit" disabled={submitting} className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-harbor disabled:opacity-60">
                <Plus className="w-4 h-4" /> Log Vitals
              </button>
            </form>
            <div className="space-y-2">
              {vitals.length === 0 && <p className="text-sm text-slate/50">No vitals logged yet.</p>}
              {vitals.map((v) => (
                <div key={v.id} className="flex gap-4 text-sm border-b border-gray-50 pb-2">
                  <span className="font-mono text-harbor">{v.temperature_c}°C</span>
                  <span className="font-mono text-harbor">{v.pulse_bpm} bpm</span>
                  <span className="font-mono text-harbor">{v.blood_pressure}</span>
                  <span className="text-slate/60 text-xs ml-auto">{v.recorded_by_name} · {new Date(v.recorded_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nursing notes / shift handover */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4"><Stethoscope className="w-4 h-4 text-serenity" /><h4 className="font-medium text-harbor">Nursing Notes & Shift Handover</h4></div>
            <form onSubmit={submitNote} className="space-y-2 mb-4">
              <select value={noteForm.shift} onChange={(e) => setNoteForm({ ...noteForm, shift: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-serenity">
                <option>Morning</option><option>Afternoon</option><option>Night</option>
              </select>
              <div className="flex gap-2">
                <input placeholder="Note..." value={noteForm.note} onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity" />
                <button type="submit" disabled={submitting} className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {notes.length === 0 && <p className="text-sm text-slate/50">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="border-l-2 border-sage pl-4 py-1">
                  <div className="flex items-center gap-2 text-xs text-slate/60">
                    <span className="font-medium text-harbor">{n.nurse_name}</span><span>·</span>
                    <span>{n.shift} shift</span><span>·</span><span>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate mt-1">{n.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}