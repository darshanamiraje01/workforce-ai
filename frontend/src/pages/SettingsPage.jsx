import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { updateProfile } from '../store/slices/authSlice';
import { authAPI } from '../utils/api';
import { PageHeader, Avatar, Spinner } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    address: user?.address || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await dispatch(updateProfile(profile)).unwrap();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) { toast.error('Current password required'); return; }
    if (passwords.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
  ];

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Settings" subtitle="Manage your account preferences" />

      <div className="max-w-2xl space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 bg-surface-800 border border-white/[0.06] rounded-xl p-1 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            {/* Avatar section */}
            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/[0.06]">
              <div className="relative">
                <Avatar name={user?.name} src={user?.avatar} size="xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 border-2 border-surface-800 flex items-center justify-center cursor-pointer hover:bg-brand-400 transition-colors">
                  <span className="text-[9px] text-white font-bold">✏</span>
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-100 text-lg">{user?.name}</div>
                <div className="text-sm text-slate-500">{user?.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-400 capitalize">{user?.role}</span>
                  {user?.department && <span className="text-xs text-slate-600">{user?.department}</span>}
                </div>
              </div>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5 block">Full Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="input-base"
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="input-base"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Location</label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                    className="input-base"
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div>
                  <label className="label mb-1.5 block">Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    className="input-base"
                    placeholder="123 Main St"
                  />
                </div>
              </div>
              <div>
                <label className="label mb-1.5 block">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  className="input-base resize-none"
                  rows={3}
                  placeholder="A brief description about yourself..."
                />
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/[0.06]">
                {[
                  { label: 'Email (read-only)', value: user?.email },
                  { label: 'Employee ID', value: user?.employeeId },
                  { label: 'Department', value: user?.department },
                  { label: 'Position', value: user?.position },
                ].map(f => (
                  <div key={f.label}>
                    <label className="label mb-1.5 block">{f.label}</label>
                    <div className="input-base bg-surface-700/30 text-slate-600 cursor-not-allowed select-none">
                      {f.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : <Save size={14} />}
                Save Changes
              </button>
            </form>
          </motion.div>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <div className="mb-5">
              <div className="section-title">Change Password</div>
              <div className="text-xs text-slate-500 mt-1">Use a strong password with at least 6 characters</div>
            </div>

            <form onSubmit={savePassword} className="space-y-4">
              {[
                { label: 'Current Password', key: 'currentPassword', showKey: 'current' },
                { label: 'New Password', key: 'newPassword', showKey: 'new' },
                { label: 'Confirm New Password', key: 'confirmPassword', showKey: 'confirm' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label mb-1.5 block">{f.label}</label>
                  <div className="relative">
                    <input
                      type={showPw[f.showKey] ? 'text' : 'password'}
                      value={passwords[f.key]}
                      onChange={e => setPasswords(p => ({ ...p, [f.key]: e.target.value }))}
                      className="input-base pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => ({ ...p, [f.showKey]: !p[f.showKey] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                    >
                      {showPw[f.showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-surface-700/30 rounded-xl p-4 text-xs text-slate-500 space-y-1">
                <div>✓ At least 6 characters</div>
                <div>✓ Mix of letters and numbers recommended</div>
                <div>✓ Avoid reusing recent passwords</div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Spinner size="sm" /> : <Lock size={14} />}
                Update Password
              </button>
            </form>
          </motion.div>
        )}

        {/* Account info card */}
        <div className="card p-5">
          <div className="section-title mb-3">Account Information</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Account Status', value: user?.status || 'active', colored: true },
              { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A' },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A' },
              { label: 'Role', value: user?.role, capitalize: true },
            ].map(item => (
              <div key={item.label} className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-600">{item.label}</span>
                <span className={`font-medium ${item.colored ? 'text-emerald-400' : 'text-slate-300'} ${item.capitalize ? 'capitalize' : ''}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
