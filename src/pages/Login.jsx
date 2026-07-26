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
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-paper-100 to-paper-200 dark:from-ink-950 dark:to-ink-900">
      <div className="card p-8 sm:p-10 w-full max-w-sm shadow-[0_2px_4px_rgba(15,27,45,0.04),0_12px_40px_-16px_rgba(15,27,45,0.24)] dark:shadow-[0_2px_4px_rgba(0,0,0,0.2),0_12px_40px_-16px_rgba(0,0,0,0.5)] rounded-2xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-5 p-2 rounded-2xl bg-white dark:bg-ink-900/60 border rule shadow-sm">
            <img src="/reclogo.png" alt="REC Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-ink-900 dark:text-paper-100">
            Sign in
          </h1>
          <p className="text-sm text-slate2-500 mt-1.5 leading-relaxed">
            Access your timetable portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="eyebrow block mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border rule bg-white dark:bg-ink-900/60 text-sm outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)] focus:border-amber-500/50 dark:focus:border-amber-500/40 placeholder:text-slate2-400/60"
              placeholder="admin@rajalakshmi.edu.in"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="eyebrow block mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border rule bg-white dark:bg-ink-900/60 text-sm outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(232,163,61,0.15)] focus:border-amber-500/50 dark:focus:border-amber-500/40 placeholder:text-slate2-400/60"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bad/10 border border-bad/20 text-sm text-bad">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 font-medium text-sm tracking-wide hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
