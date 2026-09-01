import { useState, useEffect } from 'react';
import { CalendarClock, Plus, Loader2 } from 'lucide-react';
import { getPatients } from '../api/patients';
import { getAppointments, getDoctors, createAppointment, updateAppointmentStatus } from '../api/appointments';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ patient: '', doctor: '', scheduled_at: '', reason: '' });

  useEffect(() => {
    Promise.all([getAppointments(), getPatients(), getDoctors()])
      .then(([appts, pts, docs]) => {
        setAppointments(appts);
        setPatients(pts);
        setDoctors(docs);
      })
      .catch(() => setError('Could not load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const submitAppointment = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.scheduled_at || !form.reason.trim()) {
      setError('Patient, date/time, and reason are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form, doctor: form.doctor || null };
      const created = await createAppointment(payload);
      setAppointments((prev) => [...prev, created]);
      setForm({ patient: '', doctor: '', scheduled_at: '', reason: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not schedule appointment — check your permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const markStatus = async (id, status) => {
    try {
      const updated = await updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      setError('Could not update appointment status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-harbor">Appointments</h1>
          <p className="text-sm text-slate mt-1">Schedule and manage patient appointments.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor"
        >
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={submitAppointment} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-serenity"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>

            <select
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-serenity"
            >
              <option value="">Unassigned</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
            />

            <input
              placeholder="Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
            />
          </div>

          <button type="submit" disabled={submitting} className="flex items-center gap-1.5 bg-serenity text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-harbor disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-serenity" />
          <p className="text-xs font-medium text-slate uppercase tracking-wide">Upcoming & Past</p>
        </div>

        {appointments.length === 0 ? (
          <p className="text-sm text-slate/50 px-4 py-8 text-center">No appointments scheduled yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate uppercase tracking-wide border-b border-gray-100">
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Doctor</th>
                <th className="px-4 py-2.5">Reason</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-harbor">{new Date(a.scheduled_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-harbor">{a.patient_name}</td>
                  <td className="px-4 py-2.5 text-slate">{a.doctor_name}</td>
                  <td className="px-4 py-2.5 text-slate">{a.reason}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                      a.status === 'Completed' ? 'bg-green-50 text-green-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {a.status === 'Scheduled' && (
                      <div className="flex gap-2">
                        <button onClick={() => markStatus(a.id, 'Completed')} className="text-xs text-serenity hover:underline">Complete</button>
                        <button onClick={() => markStatus(a.id, 'Cancelled')} className="text-xs text-red-500 hover:underline">Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}