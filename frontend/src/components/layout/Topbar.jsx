import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Search, Bell, Sun, Moon, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { fetchNotifications, markAllRead } from '../../store/index';

export default function Topbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { unreadCount } = useSelector(s => s.notifications);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 5 }));
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { items: notifications } = useSelector(s => s.notifications);

  const getNotifColor = (type) => {
    if (type?.includes('overdue') || type?.includes('risk')) return 'text-red-400 bg-red-500/10';
    if (type?.includes('approved')) return 'text-green-400 bg-green-500/10';
    if (type?.includes('rejected')) return 'text-red-400 bg-red-500/10';
    if (type?.includes('assigned')) return 'text-blue-400 bg-blue-500/10';
    return 'text-brand-400 bg-brand-500/10';
  };

  return (
    <header className="h-14 flex items-center px-4 gap-3 bg-surface-900/80 border-b border-white/[0.06] backdrop-blur-md sticky top-0 z-40">
      {/* Mobile menu */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5">
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface-800 border border-white/[0.06] rounded-xl text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-brand-500/40 focus:bg-surface-700/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-surface-800 border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition-all"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-surface-900" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface-800 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-semibold text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={() => dispatch(markAllRead())} className="text-xs text-brand-400 hover:text-brand-300">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.slice(0, 5).map(n => (
                    <div
                      key={n._id}
                      className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors ${!n.isRead ? 'bg-brand-500/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${getNotifColor(n.type)}`}>
                          <Bell size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-200 truncate">{n.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                        </div>
                        {!n.isRead && <div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-1 flex-shrink-0" />}
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-8 text-center text-sm text-slate-600">No notifications</div>
                  )}
                </div>
                <button
                  onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                  className="w-full px-4 py-3 text-xs text-brand-400 hover:text-brand-300 font-medium text-center hover:bg-white/[0.03] transition-colors"
                >
                  View all notifications
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-800 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-none">{user?.name?.split(' ')[0]}</div>
              <div className="text-[10px] text-slate-500 capitalize mt-0.5">{user?.role}</div>
            </div>
            <ChevronDown size={12} className="text-slate-500 hidden sm:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-52 bg-surface-800 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-sm font-semibold text-slate-200">{user?.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{user?.email}</div>
                </div>
                <div className="p-1.5">
                  {[
                    { icon: User, label: 'Profile', to: `/employees/${user?._id}` },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { navigate(item.to); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
                    >
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.06] mt-1 pt-1">
                    <button
                      onClick={() => dispatch(logout())}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
