import { useState } from 'react';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match');
    }
    if (form.newPassword.length < 8) {
      return setError('New password must be at least 8 characters');
    }

    setBusy(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Change Password</h1>
        <p className="text-sm text-slate2-500 mt-1">Update your account password.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label htmlFor="currentPassword" className="eyebrow block mb-1.5">Current password</label>
          <input
            id="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
            placeholder="Enter current password"
            autoComplete="current-password"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="eyebrow block mb-1.5">New password</label>
          <input
            id="newPassword"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="eyebrow block mb-1.5">Confirm new password</label>
          <input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            className="w-full px-4 py-3 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
            placeholder="Re-enter new password"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-lg bg-bad/10 border border-bad/20 text-sm text-bad">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-good/10 border border-good/20 text-sm text-good">
            <FiCheckCircle size={16} />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-lg bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FiLock size={15} />
          {busy ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
