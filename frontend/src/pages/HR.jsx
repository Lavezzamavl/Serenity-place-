import { useState, useEffect } from 'react';
import { Briefcase, Check, X as XIcon, Loader2 } from 'lucide-react';
import { getStaff, getLeaveRequests, reviewLeave } from '../api/hr';

const STATUS_STYLES = {
  Approved: 'bg-sage/15 text-sage', Rejected: 'bg-red-50 text-red-500', Pending: 'bg-amber-50 text-amber-600',
};

export default function HR() {
  const [staff, setStaff] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeaves = () => getLeaveRequests().then(setLeaves);

  useEffect(() => {
    Promise.all([getStaff().then(setStaff), loadLeaves()]).finally(() => setLoading(false));
  }, []);

  const handleReview = async (id, decision) => {
    setError('');
    try {
      await reviewLeave(id, decision);
      await loadLeaves();
    } catch {
      setError("Could not update leave request — your role may not have HR write access.");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading HR data...</div>;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><Briefcase className="w-4 h-4 text-serenity" /><h4 className="font-medium text-harbor">Staff Directory</h4></div>
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr><th className="text-left px-5 py-3 font-medium">Name</th><th className="text-left px-5 py-3 font-medium">Department</th><th className="text-left px-5 py-3 font-medium">Position</th><th className="text-left px-5 py-3 font-medium">Hired</th><th className="text-left px-5 py-3 font-medium">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-mist/50">
                <td className="px-5 py-3 font-medium text-harbor">{s.full_name}</td>
                <td className="px-5 py-3 text-slate">{s.department}</td>
                <td className="px-5 py-3 text-slate">{s.position}</td>
                <td className="px-5 py-3 text-slate">{s.date_hired}</td>
                <td className="px-5 py-3"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-sage/15 text-sage">{s.employment_status}</span></td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate/60">No staff profiles yet — add them via Django admin.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <div className="px-5 py-3 border-b border-gray-100"><h4 className="font-medium text-harbor">Leave Requests</h4></div>
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr><th className="text-left px-5 py-3 font-medium">Staff</th><th className="text-left px-5 py-3 font-medium">Dates</th><th className="text-left px-5 py-3 font-medium">Reason</th><th className="text-left px-5 py-3 font-medium">Status</th><th className="px-5 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-mist/50">
                <td className="px-5 py-3 font-medium text-harbor">{l.staff_name}</td>
                <td className="px-5 py-3 text-slate">{l.start_date} → {l.end_date}</td>
                <td className="px-5 py-3 text-slate">{l.reason}</td>
                <td className="px-5 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[l.status]}`}>{l.status}</span></td>
                <td className="px-5 py-3">
                  {l.status === 'Pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(l.id, 'Approved')} className="text-sage hover:text-harbor" title="Approve"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleReview(l.id, 'Rejected')} className="text-red-400 hover:text-harbor" title="Reject"><XIcon className="w-4 h-4" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate/60">No leave requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}