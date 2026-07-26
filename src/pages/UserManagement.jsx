import { useEffect, useState } from 'react';
import { FiUserPlus, FiTrash2, FiShield, FiUser, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ROLE_BADGE = {
  superuser: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  admin:     'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  user:      'bg-slate-100  text-slate-600  dark:bg-ink-700       dark:text-paper-300',
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[role] ?? ''}`}>
      {role === 'superuser' && <FiShield size={11} />}
      {role === 'admin'     && <FiShield size={11} />}
      {role === 'user'      && <FiUser   size={11} />}
      {role}
    </span>
  );
}

function CreateUserModal({ onClose, onCreated, actorRole }) {
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const allowedRoles = actorRole === 'superuser' ? ['user', 'admin'] : ['user'];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/users', form);
      onCreated(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-semibold text-lg mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="eyebrow block mb-1">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="user@rajalakshmi.edu.in"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="eyebrow block mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border rule bg-white dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-amber-400/60"
            >
              {allowedRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-bad">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border rule text-sm font-medium hover:bg-ink-900/5 dark:hover:bg-paper-100/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-2.5 rounded-lg bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { user: actor, isSuperuser } = useAuth();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(targetUser, newRole) {
    setActionError('');
    try {
      const res = await api.patch(`/users/${targetUser.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === targetUser.id ? res.data.user : u));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to update role');
    }
  }

  async function handleDelete(targetUser) {
    if (!window.confirm(`Delete "${targetUser.name}" (${targetUser.email})? This cannot be undone.`)) return;
    setActionError('');
    try {
      await api.delete(`/users/${targetUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to delete user');
    }
  }

  function canChangeRole(target) {
    if (target.id === actor.id) return false;
    if (isSuperuser) return target.role !== 'superuser';
    return target.role === 'user';
  }

  function roleOptions(target) {
    if (isSuperuser) return ['user', 'admin'].filter((r) => r !== target.role);
    return target.role === 'user' ? ['admin'] : [];
  }

  function canDelete(target) {
    if (target.id === actor.id) return false;
    return isSuperuser && target.role !== 'superuser';
  }

  function applyRoleChange(u) {
    const options = roleOptions(u);
    if (options.length === 1) {
      handleRoleChange(u, options[0]);
    } else {
      const choice = window.prompt(
        `Change role for "${u.name}".\nEnter new role (${options.join(' / ')}):`,
        options[0]
      );
      if (choice && options.includes(choice)) handleRoleChange(u, choice);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 max-w-3xl mx-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-ink-900/5 dark:bg-paper-100/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-bad text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-slate2-500 mt-0.5">
            {isSuperuser
              ? 'Manage all accounts, roles, and access.'
              : 'View users and promote accounts to admin.'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 sm:px-4 py-3 rounded-lg bg-ink-900 dark:bg-amber-500 text-amber-400 dark:text-ink-950 text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <FiUserPlus size={15} />
          <span className="hidden xs:inline">New User</span>
          <span className="xs:hidden">New</span>
        </button>
      </div>

      {actionError && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-bad">
          {actionError}
        </div>
      )}

      {/* ── Mobile: card list ── */}
      <div className="sm:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-slate2-500 break-all mt-0.5">{u.email}</div>
              </div>
              <RoleBadge role={u.role} />
            </div>

            {(canChangeRole(u) || canDelete(u)) && (
              <div className="flex items-center gap-2 pt-2 border-t rule">
                {canChangeRole(u) && roleOptions(u).length > 0 && (
                  <button
                    onClick={() => applyRoleChange(u)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg border rule text-xs font-medium hover:bg-ink-900/5 dark:hover:bg-paper-100/10 transition-colors"
                  >
                    <FiShield size={12} />
                    {roleOptions(u).length === 1 ? `Promote to ${roleOptions(u)[0]}` : 'Change role'}
                  </button>
                )}
                {canDelete(u) && (
                  <button
                    onClick={() => handleDelete(u)}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 text-xs font-medium text-bad hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={`Delete ${u.name}`}
                  >
                    <FiTrash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && (
          <div className="card p-8 text-center text-slate2-400 text-sm">No users found.</div>
        )}
      </div>

      {/* ── Desktop: table ── */}
      <div className="hidden sm:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b rule text-left">
              <th className="px-4 py-3 eyebrow font-medium">Name</th>
              <th className="px-4 py-3 eyebrow font-medium">Email</th>
              <th className="px-4 py-3 eyebrow font-medium">Role</th>
              <th className="px-4 py-3 eyebrow font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5 dark:divide-paper-100/5">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-ink-900/[0.02] dark:hover:bg-paper-100/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate2-500 text-xs">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {canChangeRole(u) && roleOptions(u).length > 0 && (
                      <button
                        onClick={() => applyRoleChange(u)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg border rule text-xs font-medium hover:bg-ink-900/5 dark:hover:bg-paper-100/10 transition-colors whitespace-nowrap"
                      >
                        <FiShield size={12} />
                        {roleOptions(u).length === 1
                          ? `Promote to ${roleOptions(u)[0]}`
                          : <>Change role <FiChevronDown size={11} /></>}
                      </button>
                    )}
                    {canDelete(u) && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-2 rounded-lg text-slate2-400 hover:text-bad hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete user"
                        aria-label={`Delete ${u.name}`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate2-400 text-sm">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserModal
          actorRole={actor.role}
          onClose={() => setShowCreate(false)}
          onCreated={(newUser) => setUsers((prev) => [...prev, newUser])}
        />
      )}
    </div>
  );
}
