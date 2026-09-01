import { useState, useEffect } from 'react';
import { HeartHandshake, Plus, Loader2, Users2, User, RefreshCcw, AlertTriangle } from 'lucide-react';
import { getPatients } from '../api/patients';
import { getCounselingSessions, addCounselingSession } from '../api/counseling';

const SESSION_TYPES = ['Individual', 'Group', 'Family', 'Psychoeducation', 'Relapse'];

const TYPE_STYLES = {
  Individual: 'bg-serenity/10 text-serenity',
  Group: 'bg-sage/20 text-harbor',
  Family: 'bg-amber-100 text-amber-700',
  Psychoeducation: 'bg-sky-100 text-sky-700',
  Relapse: 'bg-red-100 text-red-600',
};

const TYPE_ICONS = {
  Individual: User,
  Group: Users2,
  Family: Users2,
  Psychoeducation: User,
  Relapse: AlertTriangle,
};

export default function Counseling() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [form, setForm] = useState({ session_type: 'Individual', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    getPatients()
      .then((data) => {
        setPatients(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setSessionsLoading(true);
    getCounselingSessions(selected.id)
      .then(setSessions)
      .catch(() => setError('Could not load session history.'))
      .finally(() => setSessionsLoading(false));
  }, [selected]);

  const submitSession = async (e) => {
    e.preventDefault();
    if (!form.notes.trim()) return setError('Session notes are required.');
    setSubmitting(true);
    setError('');
    try {
      const newSession = await addCounselingSession(selected.id, form);
      setSessions((prev) => [newSession, ...prev]);
      setForm({ ...form, notes: '' });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not save session — your role may not have Counseling write access."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const visibleSessions =
    filterType === 'All' ? sessions : sessions.filter((s) => s.session_type === filterType);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
      </div>
    );
  if (patients.length === 0)
    return <div className="text-center py-16 text-slate">No patients admitted yet.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      {/* Patient list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-slate uppercase tracking-wide">Patients</p>
        </div>
        {patients.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 ${
              selected?.id === p.id ? 'bg-serenity/10' : 'hover:bg-mist/60'
            }`}
          >
            <p className={`text-sm font-medium ${selected?.id === p.id ? 'text-serenity' : 'text-harbor'}`}>
              {p.full_name}
            </p>
            <p className="text-xs font-mono text-slate/60">{p.admission_id}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-5">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          {/* Log a session */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <HeartHandshake className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Log Counseling Session</h4>
              <span className="ml-auto text-xs text-slate/60">for {selected.full_name}</span>
            </div>
            <form onSubmit={submitSession} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SESSION_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setForm({ ...form, session_type: t })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.session_type === t
                        ? 'bg-serenity text-white border-serenity'
                        : 'bg-white text-slate border-gray-200 hover:border-serenity/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Session notes — presenting issues, interventions used, patient response, plan..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Save Session
                </button>
              </div>
            </form>
          </div>

          {/* Session history */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <HeartHandshake className="w-4 h-4 text-serenity" />
              <h4 className="font-medium text-harbor">Session History</h4>
              {sessionsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate/50" />}
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-serenity"
                >
                  <option value="All">All types</option>
                  {SESSION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setSessionsLoading(true);
                    getCounselingSessions(selected.id)
                      .then(setSessions)
                      .finally(() => setSessionsLoading(false));
                  }}
                  className="p-1.5 rounded-lg border border-gray-200 text-slate hover:text-serenity hover:border-serenity/50"
                  title="Refresh"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {visibleSessions.length === 0 && (
                <p className="text-sm text-slate/50">No sessions logged yet.</p>
              )}
              {visibleSessions.map((s) => {
                const Icon = TYPE_ICONS[s.session_type] || User;
                return (
                  <div key={s.id} className="border-l-2 border-sage pl-4 py-1.5">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate/60">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                          TYPE_STYLES[s.session_type] || 'bg-gray-100 text-slate'
                        }`}
                      >
                        <Icon className="w-3 h-3" /> {s.session_type}
                      </span>
                      <span className="font-medium text-harbor">{s.counselor_name}</span>
                      <span>·</span>
                      <span>{new Date(s.date || s.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate mt-1.5 whitespace-pre-wrap">{s.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}