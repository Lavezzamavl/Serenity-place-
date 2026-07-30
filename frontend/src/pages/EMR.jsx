import { useState, useEffect } from 'react';
import { HeartPulse, ClipboardList, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { getPatients } from '../api/patients';
import { getProgressNotes, addProgressNote } from '../api/emr';

const DEFAULT_CLINICAL = {
  diagnosis: 'Assessment pending',
  riskLevel: 'Low',
  treatmentPlan: 'Treatment plan not yet documented.',
};

const RISK_STYLES = {
  Low: 'bg-sage/15 text-sage',
  Moderate: 'bg-amber-50 text-amber-600',
  High: 'bg-red-50 text-red-500',
};

export default function EMR() {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [posting, setPosting] = useState(false);
  const [noteError, setNoteError] = useState('');

  // Load all patients once, select the first by default
  useEffect(() => {
    getPatients()
      .then((data) => {
        setPatients(data);
        if (data.length > 0) setSelectedPatient(data[0]);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  // Whenever the selected patient changes, load THEIR notes from the real API
  useEffect(() => {
    if (!selectedPatient) return;
    setLoadingNotes(true);
    getProgressNotes(selectedPatient.admission_id)
      .then(setNotes)
      .finally(() => setLoadingNotes(false));
  }, [selectedPatient]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedPatient) return;
    setPosting(true);
    setNoteError('');
    try {
      const newNote = await addProgressNote(selectedPatient.id, noteText);
      setNotes((prev) => [newNote, ...prev]);
      setNoteText('');
    } catch (err) {
      setNoteError(
        err.response?.status === 403
          ? "Your role doesn't have permission to add clinical notes."
          : 'Could not save note. Please try again.'
      );
    } finally {
      setPosting(false);
    }
  };

  if (loadingPatients) {
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading patients...
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-16 text-slate">
        No patients admitted yet — admit a patient first to view their EMR.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-slate uppercase tracking-wide">Patients</p>
        </div>
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPatient(p)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors
              ${selectedPatient?.id === p.id ? 'bg-serenity/10' : 'hover:bg-mist/60'}`}
          >
            <p className={`text-sm font-medium ${selectedPatient?.id === p.id ? 'text-serenity' : 'text-harbor'}`}>{p.full_name}</p>
            <p className="text-xs font-mono text-slate/60">{p.admission_id}</p>
          </button>
        ))}
      </div>

      {selectedPatient && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-harbor">{selectedPatient.full_name}</h3>
              <p className="text-sm text-slate mt-1">{selectedPatient.diagnosis || DEFAULT_CLINICAL.diagnosis}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${RISK_STYLES[DEFAULT_CLINICAL.riskLevel]}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {DEFAULT_CLINICAL.riskLevel} Risk
            </span>
          </div>

          {/* Real vitals, taken straight from the admission record */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <HeartPulse className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Vital Signs (at admission)</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div><p className="text-xs text-slate/60 uppercase tracking-wide">bp</p><p className="font-mono text-sm font-medium text-harbor mt-0.5">{selectedPatient.blood_pressure || '—'}</p></div>
              <div><p className="text-xs text-slate/60 uppercase tracking-wide">pulse</p><p className="font-mono text-sm font-medium text-harbor mt-0.5">{selectedPatient.pulse_bpm ? `${selectedPatient.pulse_bpm} bpm` : '—'}</p></div>
              <div><p className="text-xs text-slate/60 uppercase tracking-wide">temp</p><p className="font-mono text-sm font-medium text-harbor mt-0.5">{selectedPatient.temperature_c ? `${selectedPatient.temperature_c}°C` : '—'}</p></div>
              <div><p className="text-xs text-slate/60 uppercase tracking-wide">weight</p><p className="font-mono text-sm font-medium text-harbor mt-0.5">{selectedPatient.weight_kg ? `${selectedPatient.weight_kg} kg` : '—'}</p></div>
              <div><p className="text-xs text-slate/60 uppercase tracking-wide">bmi</p><p className="font-mono text-sm font-medium text-harbor mt-0.5">{selectedPatient.bmi ?? '—'}</p></div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Treatment Plan</h4>
            </div>
            <p className="text-sm text-slate">{DEFAULT_CLINICAL.treatmentPlan}</p>
          </div>

          {/* Real, database-backed progress notes */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-harbor mb-3">Progress Notes</h4>

            <form onSubmit={handleAddNote} className="flex gap-2 mb-2">
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a progress note..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              />
              <button
                type="submit"
                disabled={posting}
                className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor transition-colors shrink-0 disabled:opacity-60"
              >
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </form>
            {noteError && <p className="text-xs text-red-500 mb-3">{noteError}</p>}

            <div className="space-y-3">
              {loadingNotes && (
                <div className="flex items-center text-slate text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading notes...
                </div>
              )}
              {!loadingNotes && notes.length === 0 && (
                <p className="text-sm text-slate/50">No progress notes yet.</p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="border-l-2 border-sage pl-4 py-1">
                  <div className="flex items-center gap-2 text-xs text-slate/60">
                    <span className="font-medium text-harbor">{n.author_name}</span>
                    <span>·</span>
                    <span>{new Date(n.created_at).toLocaleDateString()}</span>
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