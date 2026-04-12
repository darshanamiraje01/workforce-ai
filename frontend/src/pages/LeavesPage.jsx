import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { leaveAPI } from '../utils/api';
import { Modal, Avatar, Badge, PageHeader, StatusBadge } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export default function LeavesPage() {
  const { user } = useSelector(s => s.auth);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [form, setForm] = useState({ leaveType: 'annual', startDate: '', endDate: '', reason: '', isUrgent: false });
  const [reviewNote, setReviewNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await leaveAPI.getAll({ status: filter, limit: 50 });
      setLeaves(data.data);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.request(form);
      toast.success('Leave request submitted');
      setShowRequest(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReview = async (status) => {
    try {
      await leaveAPI.review(reviewModal._id, { status, reviewNote });
      toast.success(`Leave ${status}`);
      setReviewModal(null);
      setReviewNote('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const canReview = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Leave Requests" subtitle="Manage time-off requests"
        actions={
          <div className="flex items-center gap-2">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="input-base h-9 text-xs w-32 form-select">
              <option value="">All</option>
              {['pending', 'approved', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowRequest(true)} className="btn-primary"><Plus size={15} /> Request Leave</button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: leaves.filter(l => l.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Approved', count: leaves.filter(l => l.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Rejected', count: leaves.filter(l => l.status === 'rejected').length, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg} border-opacity-30`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06] bg-surface-900/50">
            {['Employee', 'Type', 'Duration', 'Days', 'Reason', 'Status', canReview ? 'Action' : ''].filter(Boolean).map(h => (
              <th key={h} className="label text-left px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {leaves.map((l, i) => (
              <motion.tr key={l._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-white/[0.04] hover:bg-surface-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={l.employee?.name} size="xs" />
                    <span className="text-slate-300 text-xs">{l.employee?.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge variant="brand" size="xs">{l.leaveType}</Badge></td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(l.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →{' '}
                  {new Date(l.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-300">{l.totalDays}d</td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{l.reason}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                {canReview && (
                  <td className="px-4 py-3">
                    {l.status === 'pending' && (
                      <button onClick={() => setReviewModal(l)} className="text-xs text-brand-400 hover:text-brand-300 font-medium">Review</button>
                    )}
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!loading && leaves.length === 0 && <div className="py-12 text-center text-sm text-slate-600">No leave requests found</div>}
      </div>

      <Modal open={showRequest} onClose={() => setShowRequest(false)} title="Request Leave"
        footer={<><button onClick={() => setShowRequest(false)} className="btn-secondary">Cancel</button><button onClick={handleRequest} className="btn-primary">Submit Request</button></>}>
        <div className="space-y-4">
          <div><label className="label mb-1.5 block">Leave Type</label>
            <select value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))} className="input-base form-select">
              {['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label mb-1.5 block">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input-base" required /></div>
            <div><label className="label mb-1.5 block">End Date</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="input-base" required /></div>
          </div>
          <div><label className="label mb-1.5 block">Reason</label><textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="input-base resize-none" rows={3} placeholder="Please provide a reason..." required /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isUrgent} onChange={e => setForm(f => ({ ...f, isUrgent: e.target.checked }))} className="accent-brand-500" />
            <span className="text-sm text-slate-400">Mark as urgent</span>
          </label>
        </div>
      </Modal>

      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title="Review Leave Request"
        footer={
          <>{reviewModal?.status === 'pending' && <>
            <button onClick={() => setReviewModal(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => handleReview('rejected')} className="btn-danger"><XCircle size={14} /> Reject</button>
            <button onClick={() => handleReview('approved')} className="btn-primary"><CheckCircle size={14} /> Approve</button>
          </>}</>
        }>
        {reviewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-surface-700/50 rounded-xl">
              <Avatar name={reviewModal.employee?.name} size="md" />
              <div>
                <div className="font-semibold text-slate-200">{reviewModal.employee?.name}</div>
                <div className="text-xs text-slate-500">{reviewModal.leaveType} leave · {reviewModal.totalDays} day(s)</div>
              </div>
            </div>
            <div className="text-sm text-slate-400"><span className="text-slate-600">Reason: </span>{reviewModal.reason}</div>
            <div><label className="label mb-1.5 block">Review Note (optional)</label>
              <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} className="input-base resize-none" rows={2} placeholder="Add a note..." />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
