import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-6 sm:p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-ink-900 dark:bg-amber-500 flex items-center justify-center mx-auto mb-3">
            <span className="font-display font-semibold text-amber-400 dark:text-ink-950 text-lg">R</span>
          </div>
          <h1 className="font-display text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate2-500 mt-1">Access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="eyebrow block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="admin@rajalakshmi.edu.in"
              required
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-bad">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
