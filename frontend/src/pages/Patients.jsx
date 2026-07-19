import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { INITIAL_PATIENTS } from '../data/mockPatients';

export default function Patients() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male', ward: 'Ward A', diagnosis: '' });

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.toLowerCase().includes(query.toLowerCase())
  );

  const nextId = () => {
    const n = 43 + patients.length - INITIAL_PATIENTS.length;
    return `SPT-2026-${String(n).padStart(4, '0')}`;
  };

  const handleAdmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setPatients((prev) => [
      {
        id: nextId(),
        name: form.name,
        age: Number(form.age) || 0,
        gender: form.gender,
        ward: form.ward,
        admissionDate: new Date().toISOString().slice(0, 10),
        diagnosis: form.diagnosis || 'Pending assessment',
        status: 'Admitted',
      },
      ...prev,
    ]);
    setForm({ name: '', age: '', gender: 'Male', ward: 'Ward A', diagnosis: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-mist text-slate text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Admission ID</th>
              <th className="text-left px-5 py-3 font-medium">Name</th>
              <th className="text-left px-5 py-3 font-medium">Age / Gender</th>
              <th className="text-left px-5 py-3 font-medium">Ward</th>
              <th className="text-left px-5 py-3 font-medium">Diagnosis</th>
              <th className="text-left px-5 py-3 font-medium">Admitted</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-mist/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-harbor">{p.id}</td>
                <td className="px-5 py-3 font-medium text-harbor">{p.name}</td>
                <td className="px-5 py-3 text-slate">{p.age} / {p.gender}</td>
                <td className="px-5 py-3 text-slate">{p.ward}</td>
                <td className="px-5 py-3 text-slate">{p.diagnosis}</td>
                <td className="px-5 py-3 text-slate">{p.admissionDate}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sage/15 text-sage">
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
      </div>

      {/* Admit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-harbor/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-harbor">Admit New Patient</h3>
              <button onClick={() => setShowForm(false)} className="text-slate hover:text-harbor">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdmit} className="space-y-3">
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Age"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
                />
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <select
                value={form.ward}
                onChange={(e) => setForm({ ...form, ward: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
              >
                <option>Ward A</option>
                <option>Ward B</option>
                <option>Ward C</option>
              </select>
              <input
                placeholder="Primary diagnosis (optional)"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-serenity"
              />
              <button
                type="submit"
                className="w-full bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors mt-2"
              >
                Admit Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}