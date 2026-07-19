import { useState } from 'react';
import { HeartPulse, ClipboardList, AlertTriangle, Plus } from 'lucide-react';
import { INITIAL_PATIENTS } from '../data/mockPatients';
import { EMR_RECORDS } from '../data/mockEMR';

const RISK_STYLES = {
  Low: 'bg-sage/15 text-sage',
  Moderate: 'bg-amber-50 text-amber-600',
  High: 'bg-red-50 text-red-500',
};

export default function EMR() {
  const [selectedId, setSelectedId] = useState(INITIAL_PATIENTS[0].id);
  const [note, setNote] = useState('');
  const [records, setRecords] = useState(EMR_RECORDS);

  const patient = INITIAL_PATIENTS.find((p) => p.id === selectedId);
  const record = records[selectedId];

  const addNote = () => {
    if (!note.trim()) return;
    setRecords((prev) => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        progressNotes: [
          { date: new Date().toISOString().slice(0, 10), author: 'You (Demo Session)', note },
          ...prev[selectedId].progressNotes,
        ],
      },
    }));
    setNote('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      {/* Patient selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-slate uppercase tracking-wide">Patients</p>
        </div>
        {INITIAL_PATIENTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors
              ${selectedId === p.id ? 'bg-serenity/10' : 'hover:bg-mist/60'}`}
          >
            <p className={`text-sm font-medium ${selectedId === p.id ? 'text-serenity' : 'text-harbor'}`}>{p.name}</p>
            <p className="text-xs font-mono text-slate/60">{p.id}</p>
          </button>
        ))}
      </div>

      {/* EMR detail */}
      {record && (
        <div className="space-y-5">
          {/* Summary header */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-harbor">{patient.name}</h3>
              <p className="text-sm text-slate mt-1">{record.diagnosis}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${RISK_STYLES[record.riskLevel]}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {record.riskLevel} Risk
            </span>
          </div>

          {/* Vitals */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <HeartPulse className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Vital Signs</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(record.vitals).map(([key, val]) => (
                <div key={key}>
                  <p className="text-xs text-slate/60 uppercase tracking-wide">{key}</p>
                  <p className="font-mono text-sm font-medium text-harbor mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment plan */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Treatment Plan</h4>
            </div>
            <p className="text-sm text-slate">{record.treatmentPlan}</p>
          </div>

          {/* Progress notes */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-harbor mb-3">Progress Notes</h4>

            <div className="flex gap-2 mb-4">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a progress note..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              />
              <button
                onClick={addNote}
                className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="space-y-3">
              {record.progressNotes.map((n, i) => (
                <div key={i} className="border-l-2 border-sage pl-4 py-1">
                  <div className="flex items-center gap-2 text-xs text-slate/60">
                    <span className="font-medium text-harbor">{n.author}</span>
                    <span>·</span>
                    <span>{n.date}</span>
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