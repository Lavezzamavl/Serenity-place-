import { useState, useEffect } from 'react';
import { Briefcase, Check, X as XIcon, Loader2, Plus, X, UserPlus, Link2 } from 'lucide-react';
import { getStaff, getLeaveRequests, reviewLeave, getAvailableUsers, addStaffFromExisting, createStaffAccount, requestLeave } from '../api/hr';
import { getRoles } from '../api/auth';

const STATUS_STYLES = {
  Approved: 'bg-sage/15 text-sage', Rejected: 'bg-red-50 text-red-500', Pending: 'bg-amber-50 text-amber-600',
};

const DEPARTMENT_CHOICES = ['Clinical', 'Nursing', 'Pharmacy', 'Administration', 'Finance', 'Support'];

const EMPTY_LINK_FORM = { user: '', department: 'Clinical', position: '', date_hired: '' };
const EMPTY_NEW_FORM = {
  username: '', email: '', first_name: '', last_name: '', phone_number: '', password: '',
  role: '', department: 'Clinical', position: '', date_hired: '',
};
const EMPTY_LEAVE_FORM = { end_date: '', reason: '' };

export default function HR({ user }) {
  const [staff, setStaff] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.is_superuser || user?.role?.is_admin_role;

  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState('link'); // 'link' | 'new'
  const [availableUsers, setAvailableUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [linkForm, setLinkForm] = useState(EMPTY_LINK_FORM);
  const [newForm, setNewForm] = useState(EMPTY_NEW_FORM);
  const [staffErrors, setStaffErrors] = useState({});
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffApiError, setStaffApiError] = useState('');

  const [showRequestLeave, setShowRequestLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState(EMPTY_LEAVE_FORM);
  const [leaveErrors, setLeaveErrors] = useState({});
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveApiError, setLeaveApiError] = useState('');

  const loadLeaves = () => getLeaveRequests().then(setLeaves);
  const loadStaff = () => getStaff().then(setStaff);

  useEffect(() => {
    Promise.all([loadStaff(), loadLeaves()]).finally(() => setLoading(false));
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

  const openAddStaff = () => {
    setMode('link');
    setLinkForm(EMPTY_LINK_FORM);
    setNewForm(EMPTY_NEW_FORM);
    setStaffErrors({});
    setStaffApiError('');
    setShowAdd(true);
    getAvailableUsers().then(setAvailableUsers).catch(() => setAvailableUsers([]));
    if (isAdmin) getRoles().then(setRoles).catch(() => setRoles([]));
  };

  const openRequestLeave = () => {
    setLeaveForm(EMPTY_LEAVE_FORM);
    setLeaveErrors({});
    setLeaveApiError('');
    setShowRequestLeave(true);
  };

  const submitLink = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!linkForm.user) errs.user = 'Choose an account.';
    if (!linkForm.position.trim()) errs.position = 'Position is required.';
    if (!linkForm.date_hired) errs.date_hired = 'Date hired is required.';
    setStaffErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStaffSubmitting(true);
    setStaffApiError('');
    try {
      const created = await addStaffFromExisting(linkForm);
      setStaff((prev) => [...prev, created]);
      setShowAdd(false);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        setStaffErrors(Object.fromEntries(Object.entries(serverErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      } else {
        setStaffApiError('Could not add staff member. Please try again.');
      }
    } finally {
      setStaffSubmitting(false);
    }
  };

  const submitNew = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!newForm.username.trim()) errs.username = 'Username is required.';
    if (!newForm.first_name.trim()) errs.first_name = 'First name is required.';
    if (!newForm.password) errs.password = 'Password is required.';
    if (!newForm.position.trim()) errs.position = 'Position is required.';
    if (!newForm.date_hired) errs.date_hired = 'Date hired is required.';
    setStaffErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStaffSubmitting(true);
    setStaffApiError('');
    try {
      const payload = { ...newForm, role: newForm.role || undefined };
      const created = await createStaffAccount(payload);
      setStaff((prev) => [...prev, created]);
      setShowAdd(false);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        setStaffErrors(Object.fromEntries(Object.entries(serverErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      } else {
        setStaffApiError(
          err.response?.status === 403
            ? 'Only administrators can create new login accounts.'
            : 'Could not create account. Please try again.'
        );
      }
    } finally {
      setStaffSubmitting(false);
    }
  };

  const submitLeaveRequest = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!leaveForm.end_date) errs.end_date = 'Return date is required.';
    if (!leaveForm.reason.trim()) errs.reason = 'Reason is required.';
    setLeaveErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLeaveSubmitting(true);
    setLeaveApiError('');
    try {
      const created = await requestLeave(leaveForm);
      setLeaves((prev) => [created, ...prev]);
      setShowRequestLeave(false);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        setLeaveErrors(Object.fromEntries(Object.entries(serverErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
      } else {
        setLeaveApiError('Could not submit your leave request. Please try again.');
      }
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-16 text-slate"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading HR data...</div>;

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          onClick={openRequestLeave}
          className="flex items-center gap-2 bg-white border border-gray-200 text-harbor text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-mist transition-colors"
        >
          <Plus className="w-4 h-4" /> Request Leave
        </button>
        <button
          onClick={openAddStaff}
          className="flex items-center gap-2 bg-serenity text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-harbor transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

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
            {staff.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate/60">No staff profiles yet — click "Add Staff" to get started.</td></tr>}
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

      {showAdd && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-harbor">Add Staff</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate hover:text-harbor"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex bg-mist rounded-lg p-1 mb-5">
              <button
                onClick={() => { setMode('link'); setStaffErrors({}); setStaffApiError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'link' ? 'bg-white shadow-sm text-harbor' : 'text-slate hover:text-harbor'
                }`}
              >
                <Link2 className="w-4 h-4" /> Link Existing Account
              </button>
              <button
                onClick={() => { setMode('new'); setStaffErrors({}); setStaffApiError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'new' ? 'bg-white shadow-sm text-harbor' : 'text-slate hover:text-harbor'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Create New Account
              </button>
            </div>

            {mode === 'link' ? (
              <form onSubmit={submitLink} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Account</label>
                  <select
                    value={linkForm.user}
                    onChange={(e) => setLinkForm({ ...linkForm, user: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white
                      ${staffErrors.user ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                  >
                    <option value="">Select an approved account...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.username})</option>
                    ))}
                  </select>
                  {staffErrors.user && <p className="text-xs text-red-500 mt-1">{staffErrors.user}</p>}
                  {availableUsers.length === 0 && (
                    <p className="text-xs text-slate/60 mt-1">No approved accounts without a staff profile — try "Create New Account" instead.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Department</label>
                  <select
                    value={linkForm.department}
                    onChange={(e) => setLinkForm({ ...linkForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                  >
                    {DEPARTMENT_CHOICES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Position</label>
                  <input
                    value={linkForm.position}
                    placeholder="e.g. Registered Nurse"
                    onChange={(e) => setLinkForm({ ...linkForm, position: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                      ${staffErrors.position ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                  />
                  {staffErrors.position && <p className="text-xs text-red-500 mt-1">{staffErrors.position}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Date hired</label>
                  <input
                    type="date"
                    value={linkForm.date_hired}
                    onChange={(e) => setLinkForm({ ...linkForm, date_hired: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                      ${staffErrors.date_hired ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                  />
                  {staffErrors.date_hired && <p className="text-xs text-red-500 mt-1">{staffErrors.date_hired}</p>}
                </div>

                {staffApiError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{staffApiError}</p>}

                <button type="submit" disabled={staffSubmitting} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60 mt-2">
                  {staffSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {staffSubmitting ? 'Adding...' : 'Add Staff Member'}
                </button>
              </form>
            ) : (
              <form onSubmit={submitNew} className="space-y-3">
                {!isAdmin && (
                  <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                    Creating a new login account requires administrator access.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">First name</label>
                    <input
                      value={newForm.first_name}
                      onChange={(e) => setNewForm({ ...newForm, first_name: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                        ${staffErrors.first_name ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                    />
                    {staffErrors.first_name && <p className="text-xs text-red-500 mt-1">{staffErrors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Last name</label>
                    <input
                      value={newForm.last_name}
                      onChange={(e) => setNewForm({ ...newForm, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Username</label>
                    <input
                      value={newForm.username}
                      onChange={(e) => setNewForm({ ...newForm, username: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                        ${staffErrors.username ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                    />
                    {staffErrors.username && <p className="text-xs text-red-500 mt-1">{staffErrors.username}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Temporary password</label>
                    <input
                      type="password"
                      value={newForm.password}
                      onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                        ${staffErrors.password ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                    />
                    {staffErrors.password && <p className="text-xs text-red-500 mt-1">{staffErrors.password}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={newForm.email}
                      onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Phone (optional)</label>
                    <input
                      value={newForm.phone_number}
                      onChange={(e) => setNewForm({ ...newForm, phone_number: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Role (optional)</label>
                  <select
                    value={newForm.role}
                    onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                  >
                    <option value="">No role yet</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Department</label>
                    <select
                      value={newForm.department}
                      onChange={(e) => setNewForm({ ...newForm, department: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                    >
                      {DEPARTMENT_CHOICES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Position</label>
                    <input
                      value={newForm.position}
                      placeholder="e.g. Pharmacist"
                      onChange={(e) => setNewForm({ ...newForm, position: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                        ${staffErrors.position ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                    />
                    {staffErrors.position && <p className="text-xs text-red-500 mt-1">{staffErrors.position}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Date hired</label>
                  <input
                    type="date"
                    value={newForm.date_hired}
                    onChange={(e) => setNewForm({ ...newForm, date_hired: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                      ${staffErrors.date_hired ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                  />
                  {staffErrors.date_hired && <p className="text-xs text-red-500 mt-1">{staffErrors.date_hired}</p>}
                </div>

                {staffApiError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{staffApiError}</p>}

                <button type="submit" disabled={staffSubmitting} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60 mt-2">
                  {staffSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {staffSubmitting ? 'Creating...' : 'Create Account & Add Staff'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showRequestLeave && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-harbor">Request Leave</h3>
              <button onClick={() => setShowRequestLeave(false)} className="text-slate hover:text-harbor"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={submitLeaveRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate mb-1">Reason</label>
                <input
                  value={leaveForm.reason}
                  placeholder="e.g. Family emergency"
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                    ${leaveErrors.reason ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                />
                {leaveErrors.reason && <p className="text-xs text-red-500 mt-1">{leaveErrors.reason}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate mb-1">Date you'll return</label>
                <input
                  type="date"
                  value={leaveForm.end_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2
                    ${leaveErrors.end_date ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-serenity'}`}
                />
                {leaveErrors.end_date && <p className="text-xs text-red-500 mt-1">{leaveErrors.end_date}</p>}
              </div>

              {leaveApiError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{leaveApiError}</p>}

              <button type="submit" disabled={leaveSubmitting} className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor disabled:opacity-60 mt-2">
                {leaveSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
