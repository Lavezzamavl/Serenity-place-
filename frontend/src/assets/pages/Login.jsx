import { useState } from 'react';
import { ROLES } from '../config/roles';
import { ShieldCheck } from 'lucide-react';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('super_admin');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      name: name.trim() || 'Demo User',
      role,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-harbor px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-sage" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-harbor text-center">
            Serenity Place
          </h1>
          <p className="text-sm text-slate mt-1">Treatment Center Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              Staff Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nathanael Kamau"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-serenity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate mb-1">
              Sign in as (role)
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-serenity bg-white"
            >
              {Object.entries(ROLES).map(([key, r]) => (
                <option key={key} value={key}>{r.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate/70 mt-1">
              The dashboard will only show modules this role is permitted to access.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}