import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, CheckSquare, Target, Calendar,
  AlertTriangle, Activity, ArrowRight, Brain, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { fetchAnalyticsOverview, fetchAtRiskTasks, fetchTeamInsights } from '../store/index';
import { StatCard, Badge, Avatar, ProgressBar, StatusBadge } from '../components/common/index.jsx';
import { taskAPI } from '../utils/api';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-700 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}: <span className="font-semibold text-slate-100">{p.value}</span></span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const { overview, teamInsights, atRiskTasks, loading } = useSelector(s => s.analytics);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    dispatch(fetchAnalyticsOverview());
    dispatch(fetchAtRiskTasks());
    if (user?.role !== 'employee') dispatch(fetchTeamInsights());
    taskAPI.getAll({ limit: 5, sortBy: 'updatedAt', sortOrder: 'desc' })
      .then(r => setRecentTasks(r.data.data || []))
      .catch(() => {});
  }, []);

  const kpis = overview?.kpis || {};
  const trend = overview?.monthlyTrend || [];
  const deptPerf = overview?.departmentPerformance || [];
  const taskBreakdown = overview?.taskStatusBreakdown || [];
  const pieData = taskBreakdown.map(t => ({ name: t._id?.replace(/_/g, ' '), value: t.count }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const riskBg = (level) => ({ high: 'text-red-400', medium: 'text-amber-400', low: 'text-emerald-400' }[level] || 'text-slate-400');

  return (
    <div className="p-6 space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-slate-100">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </motion.p>
        </div>
        {user?.role !== 'employee' && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            onClick={() => navigate('/ai-insights')} className="btn-primary hidden sm:flex">
            <Brain size={15} /> AI Insights
          </motion.button>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: 'Total Employees', value: kpis.totalEmployees ?? 0, icon: Users, iconBg: 'bg-brand-500/15 text-brand-400', change: 5, delay: 0 },
          { title: 'Active Tasks', value: kpis.totalTasks ?? 0, icon: CheckSquare, iconBg: 'bg-blue-500/15 text-blue-400', change: -2, delay: 0.05 },
          { title: 'Done This Week', value: kpis.completedThisWeek ?? 0, icon: Target, iconBg: 'bg-emerald-500/15 text-emerald-400', change: 12, delay: 0.1 },
          { title: 'Pending Leaves', value: kpis.pendingLeaves ?? 0, icon: Calendar, iconBg: 'bg-amber-500/15 text-amber-400', delay: 0.15 },
          { title: 'Overdue Tasks', value: kpis.overdueTasks ?? 0, icon: AlertTriangle, iconBg: 'bg-red-500/15 text-red-400', change: -8, delay: 0.2 },
          { title: "Today's Present", value: kpis.todayAttendance ?? 0, icon: Activity, iconBg: 'bg-purple-500/15 text-purple-400', change: 3, delay: 0.25 },
        ].map(kpi => <StatCard key={kpi.title} loading={loading} {...kpi} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div><div className="section-title">Task Completion Trend</div><div className="text-xs text-slate-600 mt-0.5">Last 6 months</div></div>
            <Badge variant="brand">Monthly</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="assigned" name="Assigned" stroke="#10b981" strokeWidth={2} fill="url(#dg2)" dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={2} fill="url(#dg1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="section-title mb-1">Task Status</div>
          <div className="text-xs text-slate-600 mb-4">Current distribution</div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-slate-500 capitalize">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-300">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No task data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dept perf */}
        {user?.role !== 'employee' && deptPerf.length > 0 && (
          <div className="card p-5">
            <div className="section-title mb-1">Dept Performance</div>
            <div className="text-xs text-slate-600 mb-4">Tasks completed</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="completed" name="Completed" radius={[0, 4, 4, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* At-risk tasks */}
        <div className={`card p-5 ${user?.role === 'employee' ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-title flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" /> At-Risk Tasks</div>
              <div className="text-xs text-slate-600 mt-0.5">AI deadline predictions</div>
            </div>
            <button onClick={() => navigate('/ai-insights')} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-2">
            {atRiskTasks.slice(0, 4).map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/tasks/${item.task?._id}`)}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/50 hover:bg-surface-700 cursor-pointer transition-all border border-white/[0.04] hover:border-white/[0.08]">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-600 ${riskBg(item.riskLevel)}`}>
                  {item.riskLevel?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate">{item.task?.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.task?.assignedTo?.name}</div>
                </div>
                <div className="text-[10px] text-slate-600 flex-shrink-0">{item.riskScore}%</div>
              </motion.div>
            ))}
            {atRiskTasks.length === 0 && <div className="py-8 text-center text-sm text-slate-600">✅ No at-risk tasks</div>}
          </div>
        </div>

        {/* Recent tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Recent Tasks</div>
            <button onClick={() => navigate('/tasks')} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">View all <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-2">
            {recentTasks.map((task, i) => (
              <motion.div key={task._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/tasks/${task._id}`)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-700/50 cursor-pointer transition-all group">
                <Avatar name={task.assignedTo?.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-200 truncate group-hover:text-brand-300 transition-colors">{task.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={task.status} size="xs" />
                    <span className="text-[10px] text-slate-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {recentTasks.length === 0 && <div className="py-8 text-center text-sm text-slate-600">No tasks yet</div>}
          </div>
        </div>
      </div>

      {/* AI Team Insights Strip */}
      {user?.role !== 'employee' && teamInsights && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-5 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-purple-500/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center"><Zap size={13} className="text-brand-400" /></div>
            <div className="text-sm font-bold text-slate-200">AI Team Insights</div>
            <Badge variant="brand" size="xs">Live</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Avg Productivity', value: `${teamInsights.avgProductivity || 0}%`, color: 'text-brand-400' },
              { label: 'Overloaded', value: `${teamInsights.overloadedEmployees?.length || 0}`, color: 'text-red-400', suffix: ' members' },
              { label: 'Team Size', value: `${teamInsights.totalEmployees || 0}`, color: 'text-emerald-400', suffix: ' members' },
              { label: 'Top Score', value: `${teamInsights.topPerformers?.[0]?.productivityScore || 0}%`, color: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className={`text-xl font-bold ${item.color}`}>{item.value}{item.suffix || ''}</div>
                <div className="text-xs text-slate-600 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
