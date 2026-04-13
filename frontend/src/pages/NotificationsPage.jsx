import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2 } from 'lucide-react';
import { fetchNotifications, markNotifRead, markAllRead } from '../store/index';
import { notificationAPI } from '../utils/api';
import { PageHeader, Badge } from '../components/common/index.jsx';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { items, unreadCount } = useSelector(s => s.notifications);

  useEffect(() => { dispatch(fetchNotifications({ limit: 50 })); }, []);

  const handleDelete = async (id) => {
    try { await notificationAPI.delete(id); dispatch(fetchNotifications({ limit: 50 })); }
    catch { toast.error('Failed to delete'); }
  };

  const typeColor = (type) => ({
    task_assigned: 'bg-blue-500/10 text-blue-400',
    task_completed: 'bg-emerald-500/10 text-emerald-400',
    task_overdue: 'bg-red-500/10 text-red-400',
    leave_request: 'bg-amber-500/10 text-amber-400',
    leave_approved: 'bg-emerald-500/10 text-emerald-400',
    leave_rejected: 'bg-red-500/10 text-red-400',
    overload_alert: 'bg-red-500/10 text-red-400',
    deadline_risk: 'bg-orange-500/10 text-orange-400',
    system: 'bg-brand-500/10 text-brand-400',
  }[type] || 'bg-slate-500/10 text-slate-400');

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={
          unreadCount > 0 && (
            <button onClick={() => dispatch(markAllRead())} className="btn-secondary text-xs">
              <Check size={13} /> Mark all read
            </button>
          )
        }
      />

      <div className="card overflow-hidden divide-y divide-white/[0.04]">
        {items.map((n, i) => (
          <motion.div
            key={n._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-start gap-4 p-4 hover:bg-surface-700/30 transition-colors group ${!n.isRead ? 'bg-brand-500/5' : ''}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor(n.type)}`}>
              <Bell size={14} />
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => !n.isRead && dispatch(markNotifRead(n._id))}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">{n.title}</span>
                {!n.isRead && <div className="w-1.5 h-1.5 bg-brand-400 rounded-full flex-shrink-0" />}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</div>
              <div className="text-[10px] text-slate-700 mt-1.5">
                {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button
              onClick={() => handleDelete(n._id)}
              className="text-slate-700 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-3xl mb-3">🔔</div>
            <div className="text-sm text-slate-500">All caught up! No notifications.</div>
          </div>
        )}
      </div>
    </div>
  );
}
