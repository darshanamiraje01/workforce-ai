// AttendancePage.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { attendanceAPI, employeeAPI } from '../utils/api';
import { Modal, Avatar, Badge, PageHeader, StatCard } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export function AttendancePage() {
  const { user } = useSelector(s => s.auth);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showMark, setShowMark] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], status: 'present', checkIn: '09:00', checkOut: '18:00', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getAll({ month, year });
      setRecords(data.data); setSummary(data.summary);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);
  useEffect(() => {
    if (user?.role !== 'employee') employeeAPI.getAll({ limit: 100 }).then(r => setEmployees(r.data.data));
  }, []);

  const handleMark = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, checkIn: `${form.date}T${form.checkIn}:00`, checkOut: `${form.date}T${form.checkOut}:00` };
      await attendanceAPI.mark(payload);
      toast.success('Attendance marked');
      setShowMark(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusIcon = { present: <CheckCircle size={14} className="text-emerald-400" />, absent: <XCircle size={14} className="text-red-400" />, late: <AlertCircle size={14} className="text-amber-400" />, half_day: <Clock size={14} className="text-orange-400" /> };
  const statusBadge = { present: 'green', absent: 'red', late: 'yellow', half_day: 'orange', weekend: 'gray' };

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Attendance Management" subtitle="Track daily attendance records"
        actions={
          <div className="flex items-center gap-2">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input-base h-9 text-xs w-32 form-select">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-base h-9 text-xs w-24 form-select">
              {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {user?.role !== 'employee' && (
              <button onClick={() => setShowMark(true)} className="btn-primary"><Plus size={15} /> Mark</button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: 'Present Days', value: summary.present || 0, iconBg: 'bg-emerald-500/15 text-emerald-400' },
          { title: 'Absent Days', value: summary.absent || 0, iconBg: 'bg-red-500/15 text-red-400' },
          { title: 'Late Arrivals', value: summary.late || 0, iconBg: 'bg-amber-500/15 text-amber-400' },
          { title: 'Total Hours', value: Math.round(summary.totalHours || 0), suffix: 'h', iconBg: 'bg-brand-500/15 text-brand-400' },
        ].map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.05} />)}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/[0.06] bg-surface-900/50">
            {['Employee', 'Date', 'Status', 'Check In', 'Check Out', 'Hours'].map(h => (
              <th key={h} className="label text-left px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {records.map((r, i) => (
              <motion.tr key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-white/[0.04] hover:bg-surface-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.employee?.name} size="xs" />
                    <span className="text-slate-300 text-xs">{r.employee?.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcon[r.status]}
                    <Badge variant={statusBadge[r.status] || 'gray'} size="xs">{r.status}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400 font-mono">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-300 font-medium">{r.workingHours ? `${r.workingHours}h` : '—'}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!loading && records.length === 0 && <div className="py-12 text-center text-sm text-slate-600">No attendance records found</div>}
      </div>

      <Modal open={showMark} onClose={() => setShowMark(false)} title="Mark Attendance"
        footer={<><button onClick={() => setShowMark(false)} className="btn-secondary">Cancel</button><button onClick={handleMark} className="btn-primary">Mark Attendance</button></>}>
        <div className="space-y-4">
          {user?.role !== 'employee' && (
            <div>
              <label className="label mb-1.5 block">Employee</label>
              <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} className="input-base form-select">
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="label mb-1.5 block">Date</label><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-base" /></div>
          <div><label className="label mb-1.5 block">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-base form-select">
              {['present', 'absent', 'late', 'half_day'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {form.status !== 'absent' && <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label mb-1.5 block">Check In</label><input type="time" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))} className="input-base" /></div>
              <div><label className="label mb-1.5 block">Check Out</label><input type="time" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))} className="input-base" /></div>
            </div>
          </>}
          <div><label className="label mb-1.5 block">Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base" placeholder="Optional notes" /></div>
        </div>
      </Modal>
    </div>
  );
}
export default AttendancePage;
