import { useState, useEffect, Fragment } from 'react';
import { FlaskConical, Download, Plus, Loader2 } from 'lucide-react';
import { getPatients } from '../api/patients';
import { getLabRequests, createLabRequest, approveLabResult, collectSample, submitLabResult } from '../api/laboratory';

const STATUS_STYLES = {
  Approved: 'bg-sage/15 text-sage',
  Resulted: 'bg-amber-50 text-amber-600',
  Collected: 'bg-serenity/10 text-serenity',
  Requested: 'bg-gray-100 text-slate',
};

export default function Laboratory() {
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resultDraftId, setResultDraftId] = useState(null);
  const [resultDraft, setResultDraft] = useState({ result: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ patient: '', test_name: '' });

  const loadRequests = () => getLabRequests().then(setRequests);

  useEffect(() => {
    Promise.all([getPatients(), loadRequests()])
      .then(([patientData]) => setPatients(patientData))
      .catch(() => setError('Could not load lab data.'))
      .finally(() => setLoading(false));
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!form.patient || !form.test_name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const newRequest = await createLabRequest(form.patient, form.test_name);
      setRequests((prev) => [newRequest, ...prev]);
      setForm({ patient: '', test_name: '' });
    } catch {
      setError('Could not create request — your role may not have Laboratory write access.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollect = async (id) => {
    try {
      const updated = await collectSample(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError('Could not mark sample as collected.');
    }
  };

  const handleSubmitResult = async (id) => {
    if (!resultDraft.result.trim() && !resultDraft.file) {
      setError('Enter a result or attach a file.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const updated = await submitLabResult(id, resultDraft.result, resultDraft.file);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setResultDraftId(null);
      setResultDraft({ result: '', file: null });
    } catch {
      setError('Could not submit result.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const updated = await approveLabResult(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError('Could not approve result — approval may be admin-only.');
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
    <div className="space-y-5">
      <form onSubmit={submitRequest} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate mb-1">Patient</label>
          <select
            value={form.patient}
            onChange={(e) => setForm({ ...form, patient: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate mb-1">Test</label>
          <input
            type="text"
            value={form.test_name}
            onChange={(e) => setForm({ ...form, test_name: e.target.value })}
            placeholder="e.g. Full Blood Count"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1 bg-serenity text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Request Test
        </button>
        {error && <p className="text-xs text-red-500 w-full">{error}</p>}
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-serenity" />
          <h4 className="font-medium text-harbor">Test Requests</h4>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Patient</th>
              <th className="text-left px-5 py-3 font-medium">Test</th>
              <th className="text-left px-5 py-3 font-medium">Requested By</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-slate">No test requests yet.</td></tr>
            )}
            {requests.map((r) => (
              <Fragment key={r.id}>
                <tr className="hover:bg-mist/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-harbor">{r.patient_name}</td>
                  <td className="px-5 py-3 text-slate">{r.test_name}</td>
                  <td className="px-5 py-3 text-slate">{r.requested_by_name}</td>
                  <td className="px-5 py-3 text-slate">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.status === 'Requested' && (
                      <button onClick={() => handleCollect(r.id)} className="text-serenity text-xs font-medium hover:text-harbor">
                        Mark Collected
                      </button>
                    )}
                    {r.status === 'Collected' && resultDraftId !== r.id && (
                      <button onClick={() => setResultDraftId(r.id)} className="text-serenity text-xs font-medium hover:text-harbor">
                        Enter Result
                      </button>
                    )}
                    {r.status === 'Resulted' && (
                      <button onClick={() => handleApprove(r.id)} className="text-serenity text-xs font-medium hover:text-harbor">
                        Approve
                      </button>
                    )}
                    {r.status === 'Approved' && r.result_file && (
                      <a href={r.result_file} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-serenity text-xs font-medium hover:text-harbor">
                        <Download className="w-3.5 h-3.5" /> Report
                      </a>
                    )}
                  </td>
                </tr>
                {resultDraftId === r.id && (
                  <tr className="bg-mist/40">
                    <td colSpan={6} className="px-5 py-3">
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs text-slate mb-1">Result</label>
                          <input
                            type="text"
                            value={resultDraft.result}
                            onChange={(e) => setResultDraft({ ...resultDraft, result: e.target.value })}
                            placeholder="e.g. WBC 6.2, Hb 13.4 ..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate mb-1">Attach report (optional)</label>
                          <input
                            type="file"
                            onChange={(e) => setResultDraft({ ...resultDraft, file: e.target.files[0] || null })}
                            className="text-xs"
                          />
                        </div>
                        <button
                          onClick={() => handleSubmitResult(r.id)}
                          disabled={submitting}
                          className="bg-serenity text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => { setResultDraftId(null); setResultDraft({ result: '', file: null }); }}
                          className="text-slate text-sm px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}