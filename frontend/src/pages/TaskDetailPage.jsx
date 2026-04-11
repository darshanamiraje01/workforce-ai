import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Clock, Calendar, User, Tag, MessageSquare, Send,
  Edit3, Trash2, CheckCircle, BarChart2, Brain
} from 'lucide-react';
import { taskAPI } from '../utils/api';
import { updateTask, deleteTask } from '../store/index';
import { StatusBadge, Badge, Avatar, ProgressBar, ConfirmModal, Spinner } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

const RISK_CONFIG = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'High Risk' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Medium Risk' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Low Risk' },
};

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [task, setTask] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchTask = async () => {
    try {
      const { data } = await taskAPI.getOne(id);
      setTask(data.data);
      setRisk(data.risk);
      setProgress(data.data.progress || 0);
    } catch {
      toast.error('Task not found');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await dispatch(updateTask({ id, updates: { status: newStatus } })).unwrap();
      await fetchTask();
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProgressChange = async (val) => {
    setProgress(val);
    try {
      await dispatch(updateTask({ id, updates: { progress: val } })).unwrap();
    } catch {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingComment(true);
    try {
      await taskAPI.addComment(id, { text: comment });
      setComment('');
      await fetchTask();
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    setDeletingTask(true);
    try {
      await dispatch(deleteTask(id)).unwrap();
      toast.success('Task deleted');
      navigate('/tasks');
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeletingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!task) return null;

  const canEdit = user?.role === 'admin' || user?.role === 'manager' || task.assignedTo?._id === user?._id;
  const canDelete = user?.role === 'admin' || user?.role === 'manager';
  const riskCfg = RISK_CONFIG[risk?.riskLevel] || RISK_CONFIG.low;
  const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const statusFlow = ['todo', 'in_progress', 'in_review', 'completed'];
  const currentIdx = statusFlow.indexOf(task.status);

  return (
    <div className="p-6 space-y-5 animate-in">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/tasks')} className="flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Tasks
        </button>
        {canDelete && (
          <button onClick={() => setShowDelete(true)} className="btn-danger btn-sm">
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={task.status} />
                  <Badge variant={{ critical: 'red', high: 'orange', medium: 'yellow', low: 'gray' }[task.priority]}>
                    {task.priority} priority
                  </Badge>
                  {task.isOverdue && <Badge variant="red" dot>Overdue</Badge>}
                </div>
                <h1 className="text-xl font-bold text-slate-100">{task.title}</h1>
                {task.project && <div className="text-sm text-slate-500 mt-1">{task.project}</div>}
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-slate-400 leading-relaxed">{task.description}</p>
            )}

            {/* Tags */}
            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {task.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-surface-700 text-slate-400 border border-white/[0.06]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Progress slider */}
            {canEdit && task.status !== 'completed' && (
              <div className="mt-5 pt-5 border-t border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Progress</span>
                  <span className="text-xs font-bold text-brand-400">{progress}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  onMouseUp={e => handleProgressChange(Number(e.target.value))}
                  onTouchEnd={e => handleProgressChange(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            )}
            {(task.status === 'completed' || !canEdit) && (
              <div className="mt-4">
                <ProgressBar value={progress} showLabel height="h-2" />
              </div>
            )}
          </motion.div>

          {/* Status workflow */}
          {canEdit && task.status !== 'completed' && task.status !== 'cancelled' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={15} className="text-brand-400" />
                <span className="section-title">Update Status</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFlow.map((s, i) => (
                  <button
                    key={s}
                    disabled={updatingStatus || s === task.status || i < currentIdx}
                    onClick={() => handleStatusChange(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed
                      ${s === task.status
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                        : i > currentIdx ? 'bg-surface-700 text-slate-400 hover:bg-surface-600 hover:text-slate-200 border border-white/[0.06]'
                        : 'bg-surface-800 text-slate-600 border border-white/[0.04]'}`}
                  >
                    {updatingStatus && s !== task.status ? <Spinner size="sm" /> : s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Status history */}
          {task.statusHistory?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
              <div className="section-title mb-4">Activity Timeline</div>
              <div className="space-y-3">
                {task.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-500/60 flex-shrink-0" />
                    <div className="flex-1 text-xs">
                      <span className="text-slate-400">Status changed to </span>
                      <span className="font-semibold text-slate-200">{h.status.replace(/_/g, ' ')}</span>
                      {h.note && <span className="text-slate-600"> — {h.note}</span>}
                    </div>
                    <span className="text-[10px] text-slate-600">
                      {new Date(h.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Comments */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={15} className="text-brand-400" />
              <span className="section-title">Comments ({task.comments?.length || 0})</span>
            </div>
            <div className="space-y-3 mb-4">
              {task.comments?.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar name={c.user?.name} size="sm" />
                  <div className="flex-1 bg-surface-700/50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-300">{c.user?.name}</span>
                      <span className="text-[10px] text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-400">{c.text}</p>
                  </div>
                </div>
              ))}
              {!task.comments?.length && (
                <div className="py-6 text-center text-xs text-slate-600">No comments yet</div>
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Avatar name={user?.name} size="sm" />
              <div className="flex-1 flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input-base flex-1 text-xs h-9"
                />
                <button type="submit" disabled={!comment.trim() || submittingComment} className="btn-primary px-3 h-9">
                  {submittingComment ? <Spinner size="sm" /> : <Send size={13} />}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* AI Risk Score */}
          {risk && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className={`card p-5 border ${riskCfg.bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <Brain size={15} className={riskCfg.color} />
                <span className="text-sm font-bold text-slate-200">AI Risk Analysis</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-2xl font-bold ${riskCfg.color}`}>{risk.riskScore}%</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${riskCfg.bg} ${riskCfg.color}`}>
                  {riskCfg.label}
                </span>
              </div>
              <ProgressBar
                value={risk.riskScore}
                colorClass={risk.riskLevel === 'high' ? 'from-red-500 to-red-600' : risk.riskLevel === 'medium' ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'}
                height="h-2"
              />
              {risk.factors?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {risk.factors.map((f, i) => (
                    <div key={i} className="flex gap-2 text-[11px] text-slate-500">
                      <AlertTriangle size={10} className={`${riskCfg.color} flex-shrink-0 mt-0.5`} />
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Task details */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card p-5">
            <div className="section-title mb-4">Task Details</div>
            <div className="space-y-4">
              <div>
                <div className="label mb-1">Assigned To</div>
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignedTo?.name} size="sm" />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{task.assignedTo?.name}</div>
                    <div className="text-xs text-slate-600">{task.assignedTo?.department}</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="label mb-1">Assigned By</div>
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignedBy?.name} size="sm" />
                  <span className="text-sm text-slate-300">{task.assignedBy?.name}</span>
                </div>
              </div>
              {[
                { label: 'Due Date', value: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—', warning: daysLeft !== null && daysLeft <= 2 },
                { label: 'Start Date', value: task.startDate ? new Date(task.startDate).toLocaleDateString() : '—' },
                { label: 'Estimated Hours', value: task.estimatedHours ? `${task.estimatedHours}h` : '—' },
                { label: 'Actual Hours', value: task.actualHours ? `${task.actualHours}h` : '—' },
                { label: 'Department', value: task.department || '—' },
              ].map(item => (
                <div key={item.label}>
                  <div className="label mb-1">{item.label}</div>
                  <div className={`text-sm ${item.warning ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Completion info */}
          {task.completedAt && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="card p-5 border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={15} className="text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Completed</span>
              </div>
              <div className="text-xs text-slate-400">
                {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              {task.completedAt <= task.dueDate ? (
                <div className="text-xs text-emerald-400 mt-1">✓ Delivered on time</div>
              ) : (
                <div className="text-xs text-red-400 mt-1">⚠ Delivered late</div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
      />
    </div>
  );
}
