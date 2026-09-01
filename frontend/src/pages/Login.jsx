import { useState } from 'react';
import { ShieldCheck, Loader2, KeyRound } from 'lucide-react';
import { login } from '../api/auth';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  // Once the backend tells us this account needs a second factor, we swap
  // to a small code-entry step instead of re-asking for username/password.
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const extractError = (err) => {
    const data = err.response?.data;
    if (data?.mfa_required) {
      return { mfaRequired: true, message: data.detail?.[0] || data.detail || 'Enter your authenticator code.' };
    }
    const msg = data?.detail
      || data?.non_field_errors?.[0]
      || (err.request && !err.response
          ? 'Could not reach the server — check that the backend is running and reachable.'
          : 'Invalid username or password.');
    return { mfaRequired: false, message: msg };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password, mfaRequired ? mfaCode : undefined);
      onLogin(user);
    } catch (err) {
      const { mfaRequired: needsMfa, message } = extractError(err);
      if (needsMfa) {
        setMfaRequired(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
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
          {!mfaRequired ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-serenity"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-serenity"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-3 text-sm text-slate">
                <KeyRound className="w-4 h-4 text-serenity" />
                Signed in as <span className="font-medium text-harbor">{username}</span>
              </div>
              <label className="block text-sm font-medium text-slate mb-1">Authenticator Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-serenity tracking-widest text-center"
                required
              />
              <button
                type="button"
                onClick={() => { setMfaRequired(false); setMfaCode(''); setError(''); }}
                className="text-xs text-slate/60 hover:text-slate mt-2"
              >
                ← Use a different account
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-serenity text-white font-medium py-2.5 rounded-lg hover:bg-harbor transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Signing in...' : mfaRequired ? 'Verify Code' : 'Sign In'}
          </button>
          {loading && (
            <p className="text-xs text-slate/60 text-center mt-2">
              First request may take up to a minute if the server was asleep.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}