import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Check,
  X,
  Phone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { translations } from '../utils/translations';
import { User } from '../types';

export const AdminUserManager: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, language, setActiveView, showToast } =
    useApp();
  const t = translations[language];

  const [isCreating, setIsCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New User Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'user'>('user');
  const [formAgency, setFormAgency] = useState('AC');
  const [formPhone, setFormPhone] = useState('');

  const agencyPresets = ['AC', 'CM', 'MR', 'JG', 'MZ', 'SA', 'RK', 'HB', 'ER', 'ALL'];

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-sm text-slate-600 mt-2">
          Only the administrator can create and manage user accounts.
        </p>
        <button
          onClick={() => setActiveView('consumers')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formPassword.trim() || !formName.trim()) {
      showToast('Please fill out all required fields');
      return;
    }

    const ok = addUser({
      id: formId.trim().toLowerCase(),
      name: formName.trim(),
      password: formPassword.trim(),
      role: formRole,
      agency: formRole === 'admin' ? 'ALL' : formAgency.trim().toUpperCase(),
      phone: formPhone.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    });

    if (ok) {
      setIsCreating(false);
      setFormId('');
      setFormName('');
      setFormPassword('');
      setFormPhone('');
    }
  };

  const handleSaveEdit = (user: User) => {
    updateUser(user);
    setEditingUserId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('consumers')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.adminSettings}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Admin-Only Staff Management: Create credentials and assign agencies to surveyors
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : t.createNewUser}</span>
        </button>
      </div>

      {/* Create New User Modal / Box */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-blue-500 shadow-md space-y-4 animate-in fade-in-50"
        >
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Create New User & Password</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t.username} (Login ID) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. agency_ac, surveyor_1"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t.password} *
              </label>
              <input
                type="text"
                required
                placeholder="Set password for user"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t.fullName} *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Debashis Saha (AC Team)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t.role}
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">Field Surveyor (Scoped to Agency)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                {t.assignedAgency}
              </label>
              <select
                value={formAgency}
                onChange={(e) => setFormAgency(e.target.value)}
                disabled={formRole === 'admin'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
              >
                {agencyPresets.map((ag) => (
                  <option key={ag} value={ag}>
                    {ag === 'ALL' ? 'ALL (Office Admin)' : `Agency ${ag}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9832109876"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
            >
              Save New User Account
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-sm">
            Active Staff Accounts ({users.length})
          </span>
          <span className="text-xs text-slate-500">
            Field workers only see their assigned agency consumers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">User ID (Login)</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Agency</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isEditing = editingUserId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {u.id}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={u.name}
                          id={`edit-name-${u.id}`}
                          className="border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        u.name
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={u.agency}
                          id={`edit-agency-${u.id}`}
                          className="w-16 border border-slate-300 rounded px-2 py-1 text-xs uppercase"
                        />
                      ) : (
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-mono text-xs">
                          {u.agency}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={u.password}
                          id={`edit-pass-${u.id}`}
                          className="border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                      ) : (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {u.password}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {u.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{u.phone}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const nameInput = document.getElementById(
                                `edit-name-${u.id}`
                              ) as HTMLInputElement;
                              const passInput = document.getElementById(
                                `edit-pass-${u.id}`
                              ) as HTMLInputElement;
                              const agencyInput = document.getElementById(
                                `edit-agency-${u.id}`
                              ) as HTMLInputElement;

                              handleSaveEdit({
                                ...u,
                                name: nameInput?.value || u.name,
                                password: passInput?.value || u.password,
                                agency: agencyInput?.value?.toUpperCase() || u.agency,
                              });
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUserId(u.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.id !== 'harishchandrapur' && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete user account "${u.id}"?`)) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
