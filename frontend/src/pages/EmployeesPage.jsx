import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, Mail, Phone, Building, MoreVertical, Shield } from 'lucide-react';
import { fetchEmployees } from '../store/index';
import { authAPI } from '../utils/api';
import { Modal, Avatar, Badge, StatusBadge, PageHeader, EmptyState } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

const DEPT_COLORS = {
  Engineering: 'bg-blue-500/10 text-blue-400',
  Design: 'bg-purple-500/10 text-purple-400',
  Marketing: 'bg-pink-500/10 text-pink-400',
  Sales: 'bg-emerald-500/10 text-emerald-400',
  HR: 'bg-amber-500/10 text-amber-400',
  Finance: 'bg-cyan-500/10 text-cyan-400',
  Product: 'bg-indigo-500/10 text-indigo-400',
};

function CreateEmployeeModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee',
    department: '', position: '', phone: '', salary: '', location: '', skills: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        ...form,
        salary: form.salary ? Number(form.salary) : undefined,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
      });
      toast.success('Employee created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const f = (label, key, type = 'text', req = false, placeholder = '') => (
    <div>
      <label className="label mb-1.5 block">{label}{req && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="input-base" placeholder={placeholder} required={req} />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Add New Employee" size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
            Add Employee
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {f('Full Name', 'name', 'text', true, 'John Doe')}
        {f('Email Address', 'email', 'email', true, 'john@company.com')}
        {f('Password', 'password', 'password', true, 'Min 6 characters')}
        <div>
          <label className="label mb-1.5 block">Role</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="input-base form-select">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {f('Department', 'department', 'text', false, 'Engineering')}
        {f('Position', 'position', 'text', false, 'Senior Developer')}
        {f('Phone', 'phone', 'tel', false, '+1 234 567 8900')}
        {f('Salary', 'salary', 'number', false, '75000')}
        {f('Location', 'location', 'text', false, 'San Francisco')}
        <div className="sm:col-span-2">{f('Skills (comma-separated)', 'skills', 'text', false, 'React, Node.js, MongoDB')}</div>
      </div>
    </Modal>
  );
}

export default function EmployeesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: employees, loading } = useSelector(s => s.employees);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState('grid');

  const loadData = () => dispatch(fetchEmployees({ limit: 100 }));
  useEffect(() => { loadData(); }, []);

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || e.department === deptFilter;
    const matchRole = !roleFilter || e.role === roleFilter;
    const matchStatus = !statusFilter || e.status === statusFilter;
    return matchSearch && matchDept && matchRole && matchStatus;
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader
        title="Employee Directory"
        subtitle={`${employees.length} total employees`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-800 border border-white/[0.06] rounded-xl p-1 gap-1">
              {['grid', 'list'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}>
                  {v === 'grid' ? '⊞ Grid' : '≡ List'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Add Employee
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..."
            className="input-base pl-9 h-9 text-xs" />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-base h-9 text-xs w-44 form-select">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-base h-9 text-xs w-32 form-select">
          <option value="">All Roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base h-9 text-xs w-32 form-select">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="text-slate-300 font-medium">{filtered.length} results</span>
        {['active', 'on_leave', 'inactive'].map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${s === 'active' ? 'bg-emerald-500' : s === 'on_leave' ? 'bg-amber-500' : 'bg-slate-600'}`} />
            {employees.filter(e => e.status === s).length} {s.replace('_', ' ')}
          </div>
        ))}
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card p-5 space-y-3">
                    <div className="skeleton w-12 h-12 rounded-xl" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                ))
              : filtered.map((emp, i) => (
                  <motion.div
                    key={emp._id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/employees/${emp._id}`)}
                    className="card card-hover p-5 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Avatar name={emp.name} src={emp.avatar} size="lg" />
                      <StatusBadge status={emp.status} size="xs" />
                    </div>
                    <div className="font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">{emp.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{emp.position || emp.role}</div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${DEPT_COLORS[emp.department] || 'bg-slate-500/10 text-slate-400'}`}>
                        {emp.department || 'No dept'}
                      </span>
                      {emp.role === 'manager' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-400 font-medium flex items-center gap-0.5">
                          <Shield size={9} /> Manager
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.04] text-xs text-slate-600 truncate">{emp.email}</div>
                    {emp.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-700 text-slate-500">{s}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
            }
          </AnimatePresence>
          {!loading && filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Users} title="No employees found" subtitle="Try adjusting your filters" />
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-surface-900/50">
                {['Employee', 'Department', 'Role', 'Status', 'Joined', 'Contact'].map(h => (
                  <th key={h} className="label text-left px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => navigate(`/employees/${emp._id}`)}
                  className="border-b border-white/[0.04] hover:bg-surface-700/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} src={emp.avatar} size="sm" />
                      <div>
                        <div className="font-medium text-slate-200">{emp.name}</div>
                        <div className="text-[10px] text-slate-600">{emp.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${DEPT_COLORS[emp.department] || 'bg-slate-500/10 text-slate-400'}`}>
                      {emp.department || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 capitalize">{emp.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-[140px]">{emp.email}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={Users} title="No employees found" />}
        </div>
      )}

      <CreateEmployeeModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
