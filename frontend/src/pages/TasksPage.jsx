import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, List, LayoutGrid, ChevronDown,
  Clock, AlertTriangle, CheckCircle2, Circle, ArrowUpCircle, Loader2
} from 'lucide-react';
import { fetchTasks, createTask } from '../store/index';
import { employeeAPI } from '../utils/api';
import { Modal, StatusBadge, Badge, Avatar, ProgressBar, PageHeader, EmptyState } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

const STATUS_COLS = [
  { id: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-400', border: 'border-slate-700' },
  { id: 'in_progress', label: 'In Progress', icon: Loader2, color: 'text-blue-400', border: 'border-blue-500/30' },
  { id: 'in_review', label: 'In Review', icon: ArrowUpCircle, color: 'text-purple-400', border: 'border-purple-500/30' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/30' },
];

const PRIORITY_COLORS = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-slate-500' };

function TaskCard({ task, onClick }) {
  const isOverdue = task.isOverdue && task.status !== 'completed';
  const daysLeft = task.dueDate
    ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-surface-800 border border-white/[0.06] rounded-xl p-4 cursor-pointer hover:border-white/[0.12] hover:shadow-card-hover transition-all group"
    >
      {/* Priority dot + title */}
      <div className="flex items-start gap-2 mb-3">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
            {task.title}
          </div>
          {task.project && (
            <div className="text-[10px] text-slate-600 mt-0.5">{task.project}</div>
          )}
        </div>
      </div>

      {/* Progress */}
      {task.status === 'in_progress' && (
        <div className="mb-3">
          <ProgressBar value={task.progress || 0} />
        </div>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-700 text-slate-500 border border-white/[0.05]">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <Avatar name={task.assignedTo?.name} size="xs" />
        <div className="flex items-center gap-2">
          {isOverdue ? (
            <span className="text-[10px] text-red-400 font-semibold flex items-center gap-0.5">
              <AlertTriangle size={9} /> Overdue
            </span>
          ) : daysLeft !== null && (
            <span className={`text-[10px] font-medium ${daysLeft <= 2 ? 'text-amber-400' : 'text-slate-600'}`}>
              {daysLeft <= 0 ? 'Today' : `${daysLeft}d left`}
            </span>
          )}
          <Badge variant={{ critical: 'red', high: 'orange', medium: 'yellow', low: 'gray' }[task.priority] || 'gray'} size="xs">
            {task.priority}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

function CreateTaskModal({ open, onClose, employees }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'medium',
    dueDate: '', estimatedHours: 4, project: '', tags: '', department: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.assignedTo || !form.dueDate) {
      toast.error('Please fill required fields');
      return;
    }
    setLoading(true);
    try {
      await dispatch(createTask({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        estimatedHours: Number(form.estimatedHours)
      })).unwrap();
      toast.success('Task created successfully');
      onClose();
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedHours: 4, project: '', tags: '', department: '' });
    } catch (err) {
      toast.error(err || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', required = false, placeholder = '') => (
    <div>
      <label className="label mb-1.5 block">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input-base" placeholder={placeholder} required={required} />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Create New Task" size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={15} />}
            Create Task
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">{field('Task Title', 'title', 'text', true, 'e.g. Redesign dashboard UI')}</div>
        <div className="sm:col-span-2">
          <label className="label mb-1.5 block">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="input-base min-h-[80px] resize-none" placeholder="Task details and requirements..." />
        </div>
        <div>
          <label className="label mb-1.5 block">Assign To <span className="text-red-400">*</span></label>
          <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
            className="input-base form-select" required>
            <option value="">Select employee</option>
            {employees.map(e => (
              <option key={e._id} value={e._id}>{e.name} — {e.department}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1.5 block">Priority</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-base form-select">
            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        {field('Due Date', 'dueDate', 'date', true)}
        {field('Estimated Hours', 'estimatedHours', 'number', false, '4')}
        {field('Project', 'project', 'text', false, 'e.g. Platform v2')}
        {field('Department', 'department', 'text', false, 'e.g. Engineering')}
        <div className="sm:col-span-2">{field('Tags (comma-separated)', 'tags', 'text', false, 'React, API, Design')}</div>
      </div>
    </Modal>
  );
}

export default function TasksPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { items: tasks, loading } = useSelector(s => s.tasks);
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    dispatch(fetchTasks({ limit: 100 }));
    if (user?.role !== 'employee') {
      employeeAPI.getAll({ status: 'active', limit: 100 }).then(r => setEmployees(r.data.data)).catch(() => {});
    }
  }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const byStatus = (status) => filtered.filter(t => t.status === status);

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader
        title="Task Management"
        subtitle={`${tasks.length} total tasks`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-800 border border-white/[0.06] rounded-xl p-1">
              <button onClick={() => setView('kanban')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'kanban' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}>
                <LayoutGrid size={13} />
              </button>
              <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === 'list' ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}>
                <List size={13} />
              </button>
            </div>
            {canCreate && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={15} /> New Task
              </button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..." className="input-base pl-9 h-9 text-xs" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-base h-9 text-xs w-36 form-select">
          <option value="">All Status</option>
          {STATUS_COLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="input-base h-9 text-xs w-36 form-select">
          <option value="">All Priority</option>
          {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        {(search || statusFilter || priorityFilter) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_COLS.map(col => {
            const colTasks = byStatus(col.id);
            return (
              <div key={col.id} className={`bg-surface-900/60 rounded-2xl border ${col.border} p-3 min-h-[400px]`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <col.icon size={14} className={col.color} />
                    <span className="text-xs font-semibold text-slate-300">{col.label}</span>
                  </div>
                  <span className="text-xs text-slate-600 bg-surface-700 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                {/* Cards */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {colTasks.map(task => (
                      <TaskCard key={task._id} task={task} onClick={() => navigate(`/tasks/${task._id}`)} />
                    ))}
                  </AnimatePresence>
                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-700">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-surface-900/50">
                  {['Task', 'Assigned To', 'Status', 'Priority', 'Due Date', 'Progress'].map(h => (
                    <th key={h} className="label text-left px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((task, i) => (
                    <motion.tr
                      key={task._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/tasks/${task._id}`)}
                      className="border-b border-white/[0.04] hover:bg-surface-700/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`} />
                          <div>
                            <div className="font-medium text-slate-200 group-hover:text-brand-300 transition-colors truncate max-w-[200px]">{task.title}</div>
                            {task.project && <div className="text-[10px] text-slate-600">{task.project}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={task.assignedTo?.name} size="xs" />
                          <span className="text-slate-400 text-xs truncate max-w-[100px]">{task.assignedTo?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                      <td className="px-4 py-3">
                        <Badge variant={{ critical: 'red', high: 'orange', medium: 'yellow', low: 'gray' }[task.priority]}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${task.isOverdue ? 'text-red-400 font-semibold' : 'text-slate-400'}`}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={task.progress || 0} height="h-1" />
                          <span className="text-[10px] text-slate-600 w-8 flex-shrink-0">{task.progress || 0}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <EmptyState icon={CheckCircle2} title="No tasks found" subtitle="Try adjusting your filters or create a new task" />
            )}
          </div>
        </div>
      )}

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} employees={employees} />
    </div>
  );
}
