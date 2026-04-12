// AnalyticsPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { fetchAnalyticsOverview } from '../store/index';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { PageHeader, Badge } from '../components/common/index.jsx';

export function AnalyticsPage() {
  const dispatch = useDispatch();
  const { overview, loading } = useSelector(s => s.analytics);
  useEffect(() => { dispatch(fetchAnalyticsOverview()); }, []);

  const trend = overview?.monthlyTrend || [];
  const dept = overview?.departmentPerformance || [];

  const T = ({ active, payload, label }) => active && payload?.length ? (
    <div className="bg-surface-700 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}: <span className="font-semibold text-slate-100">{p.value}</span></span>
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Analytics" subtitle="Performance metrics and trends" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Task Completion Trend</div>
            <Badge variant="brand">6 months</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Area type="monotone" dataKey="assigned" name="Assigned" stroke="#10b981" strokeWidth={2} fill="url(#ag2)" dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={2} fill="url(#ag1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <div className="section-title mb-4">Department Performance</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dept}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<T />} />
              <Bar dataKey="completed" name="Tasks Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// NotificationsPage.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { fetchNotifications, markNotifRead, markAllRead } from '../store/index';
import { notificationAPI } from '../utils/api';
import { PageHeader, Badge } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const dispatch = useDispatch();
  const { items, unreadCount, loading } = useSelector(s => s.notifications);

  useEffect(() => { dispatch(fetchNotifications({ limit: 50 })); }, []);

  const handleDelete = async (id) => {
    try { await notificationAPI.delete(id); dispatch(fetchNotifications({ limit: 50 })); }
    catch { toast.error('Failed to delete'); }
  };

  const typeColor = (type) => ({
    task_assigned: 'bg-blue-500/10 text-blue-400', task_completed: 'bg-emerald-500/10 text-emerald-400',
    task_overdue: 'bg-red-500/10 text-red-400', leave_request: 'bg-amber-500/10 text-amber-400',
    leave_approved: 'bg-emerald-500/10 text-emerald-400', leave_rejected: 'bg-red-500/10 text-red-400',
    overload_alert: 'bg-red-500/10 text-red-400', deadline_risk: 'bg-orange-500/10 text-orange-400',
    system: 'bg-brand-500/10 text-brand-400',
  }[type] || 'bg-slate-500/10 text-slate-400');

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread`}
        actions={unreadCount > 0 && (
          <button onClick={() => dispatch(markAllRead())} className="btn-secondary text-xs">
            <Check size={13} /> Mark all read
          </button>
        )} />
      <div className="card overflow-hidden divide-y divide-white/[0.04]">
        {items.map((n, i) => (
          <motion.div key={n._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className={`flex items-start gap-4 p-4 hover:bg-surface-700/30 transition-colors ${!n.isRead ? 'bg-brand-500/5' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor(n.type)}`}>
              <Bell size={14} />
            </div>
            <div className="flex-1 min-w-0" onClick={() => !n.isRead && dispatch(markNotifRead(n._id))}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">{n.title}</span>
                {!n.isRead && <div className="w-1.5 h-1.5 bg-brand-400 rounded-full" />}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
              <div className="text-[10px] text-slate-700 mt-1">{new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <button onClick={() => handleDelete(n._id)} className="text-slate-700 hover:text-red-400 transition-colors p-1"><Trash2 size={13} /></button>
          </motion.div>
        ))}
        {items.length === 0 && <div className="py-16 text-center text-sm text-slate-600">No notifications</div>}
      </div>
    </div>
  );
}

// DocumentsPage.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { documentAPI, employeeAPI } from '../utils/api';
import { Modal, Avatar, Badge, PageHeader } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export function DocumentsPage() {
  const { user } = useSelector(s => s.auth);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'id_proof', description: '', employeeId: '', isConfidential: false });
  const [file, setFile] = useState(null);

  const load = async () => {
    try { const { data } = await documentAPI.getAll(); setDocs(data.data); }
    catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (user?.role !== 'employee') employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file && !form.url) { toast.error('Please select a file'); return; }
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      await documentAPI.upload(fd);
      toast.success('Document uploaded'); setShowUpload(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
  };

  const docTypeColor = { id_proof: 'blue', offer_letter: 'green', contract: 'purple', certificate: 'amber', payslip: 'cyan', appraisal: 'brand', other: 'gray' };

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Documents" subtitle="Employee files and records"
        actions={<button onClick={() => setShowUpload(true)} className="btn-primary"><Upload size={15} /> Upload</button>} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc, i) => (
          <motion.div key={doc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="card card-hover p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><FileText size={18} className="text-brand-400" /></div>
              <div className="flex items-center gap-1">
                <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-surface-700 text-slate-500 hover:text-slate-300 transition-all"><Download size={13} /></a>
                <button onClick={async () => { await documentAPI.delete(doc._id); load(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="font-medium text-slate-200 text-sm truncate">{doc.name}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={docTypeColor[doc.type] || 'gray'} size="xs">{doc.type.replace('_', ' ')}</Badge>
              {doc.isConfidential && <Badge variant="red" size="xs">Confidential</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
              <Avatar name={doc.employee?.name} size="xs" />
              <span className="text-xs text-slate-500 truncate">{doc.employee?.name}</span>
            </div>
          </motion.div>
        ))}
        {!loading && docs.length === 0 && <div className="col-span-full py-16 text-center text-sm text-slate-600">No documents uploaded yet</div>}
      </div>
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document"
        footer={<><button onClick={() => setShowUpload(false)} className="btn-secondary">Cancel</button><button onClick={handleUpload} className="btn-primary"><Upload size={14} />Upload</button></>}>
        <div className="space-y-4">
          <div><label className="label mb-1.5 block">Document Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="e.g. ID Proof" required /></div>
          <div><label className="label mb-1.5 block">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-base form-select">
              {['id_proof', 'offer_letter', 'contract', 'certificate', 'payslip', 'appraisal', 'other'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          {user?.role !== 'employee' && (
            <div><label className="label mb-1.5 block">Employee</label>
              <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className="input-base form-select">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="label mb-1.5 block">File</label><input type="file" onChange={e => setFile(e.target.files[0])} className="input-base py-2 cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400 file:text-xs file:font-medium hover:file:bg-brand-500/30" /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isConfidential} onChange={e => setForm(f => ({ ...f, isConfidential: e.target.checked }))} className="accent-brand-500" /><span className="text-sm text-slate-400">Mark as confidential</span></label>
        </div>
      </Modal>
    </div>
  );
}

// SettingsPage.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Lock, Bell } from 'lucide-react';
import { updateProfile } from '../store/slices/authSlice';
import { authAPI } from '../utils/api';
import { PageHeader, Avatar } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', location: user?.location || '', bio: user?.bio || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await dispatch(updateProfile(profile)).unwrap(); toast.success('Profile updated'); }
    catch (err) { toast.error(err || 'Failed'); }
    finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (passwords.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password updated'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5 animate-in max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account" />
      <div className="flex gap-1 bg-surface-800 border border-white/[0.06] rounded-xl p-1 w-fit">
        {[{ id: 'profile', icon: User }, { id: 'password', icon: Lock }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t.id ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}>
            <t.icon size={12} /> {t.id}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/[0.06]">
            <Avatar name={user?.name} size="xl" />
            <div>
              <div className="font-bold text-slate-100">{user?.name}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
              <div className="text-xs text-slate-600 capitalize mt-0.5">{user?.role} · {user?.department}</div>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            {[['Full Name', 'name', 'text'], ['Phone', 'phone', 'tel'], ['Location', 'location', 'text']].map(([label, key, type]) => (
              <div key={key}>
                <label className="label mb-1.5 block">{label}</label>
                <input type={type} value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} className="input-base" />
              </div>
            ))}
            <div><label className="label mb-1.5 block">Bio</label><textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} className="input-base resize-none" rows={3} placeholder="Brief bio..." /></div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card p-6">
          <form onSubmit={savePassword} className="space-y-4">
            {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm Password', 'confirmPassword']].map(([label, key]) => (
              <div key={key}>
                <label className="label mb-1.5 block">{label}</label>
                <input type="password" value={passwords[key]} onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} className="input-base" required />
              </div>
            ))}
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
