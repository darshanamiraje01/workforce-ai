import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, CheckSquare, Clock, Calendar, BarChart3,
  Brain, Bell, FileText, Settings, ChevronLeft, ChevronRight, Zap, LogOut
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Workforce',
    items: [
      { to: '/employees', icon: Users, label: 'Employees', roles: ['admin', 'manager'] },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/attendance', icon: Clock, label: 'Attendance' },
      { to: '/leaves', icon: Calendar, label: 'Leaves' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'manager'] },
      { to: '/ai-insights', icon: Brain, label: 'AI Insights', roles: ['admin', 'manager'] },
    ]
  },
  {
    label: 'Other',
    items: [
      { to: '/notifications', icon: Bell, label: 'Notifications' },
      { to: '/documents', icon: FileText, label: 'Documents' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user } = useSelector(s => s.auth);
  const { unreadCount } = useSelector(s => s.notifications);
  const dispatch = useDispatch();

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 72 },
  };

  const filteredGroups = navGroups.map(g => ({
    ...g,
    items: g.items.filter(item => !item.roles || item.roles.includes(user?.role))
  })).filter(g => g.items.length > 0);

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={`
        hidden lg:flex flex-col h-full bg-surface-900 border-r border-white/[0.06]
        relative z-50 overflow-hidden flex-shrink-0
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-brand flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="text-sm font-bold text-white leading-none">WorkForce</div>
              <div className="text-[10px] text-brand-400 font-semibold mt-0.5">AI Platform</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto scrollbar-none">
        {filteredGroups.map(group => (
          <div key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="label px-2 mb-2"
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item group relative ${isActive ? 'nav-item-active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-xl bg-brand-500/10 border border-brand-500/20"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <item.icon
                        size={18}
                        className={`relative z-10 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {/* Badge for notifications */}
                      {item.to === '/notifications' && unreadCount > 0 && (
                        <span className="relative z-10 ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {/* User info */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user?.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button
          onClick={() => dispatch(logout())}
          className="w-full nav-item text-slate-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
        >
          {collapsed
            ? <ChevronRight size={16} />
            : <ChevronLeft size={16} />
          }
        </button>
      </div>
    </motion.aside>
  );
}
