import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { fetchAnalyticsOverview } from '../store/index';
import { PageHeader, Badge, StatCard } from '../components/common/index.jsx';
import { BarChart2, TrendingUp, Users, CheckSquare } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
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

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { overview, loading } = useSelector(s => s.analytics);
  useEffect(() => { dispatch(fetchAnalyticsOverview()); }, []);
  const trend = overview?.monthlyTrend || [];
  const dept = overview?.departmentPerformance || [];
  const kpis = overview?.kpis || {};

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="Analytics" subtitle="Company-wide performance metrics and trends" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={kpis.totalEmployees ?? 0} icon={Users} iconBg="bg-brand-500/15 text-brand-400" loading={loading} delay={0} />
        <StatCard title="Active Tasks" value={kpis.totalTasks ?? 0} icon={CheckSquare} iconBg="bg-blue-500/15 text-blue-400" loading={loading} delay={0.05} />
        <StatCard title="Completed This Week" value={kpis.completedThisWeek ?? 0} icon={TrendingUp} iconBg="bg-emerald-500/15 text-emerald-400" loading={loading} delay={0.1} />
        <StatCard title="Overdue Tasks" value={kpis.overdueTasks ?? 0} icon={BarChart2} iconBg="bg-red-500/15 text-red-400" loading={loading} delay={0.15} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div><div className="section-title">Task Completion Trend</div><div className="text-xs text-slate-600 mt-0.5">Last 6 months</div></div>
            <Badge variant="brand">Monthly</Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              <Area type="monotone" dataKey="assigned" name="Assigned" stroke="#10b981" strokeWidth={2} fill="url(#g2)" dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#6366f1" strokeWidth={2} fill="url(#g1)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <div className="section-title mb-1">Department Performance</div>
          <div className="text-xs text-slate-600 mb-4">Tasks completed by department</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dept}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" name="Tasks Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {overview?.taskStatusBreakdown?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <div className="section-title mb-4">Task Status Distribution</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {overview.taskStatusBreakdown.map((item, i) => {
              const colors = ['bg-slate-500/15 text-slate-400','bg-blue-500/15 text-blue-400','bg-purple-500/15 text-purple-400','bg-emerald-500/15 text-emerald-400','bg-red-500/15 text-red-400'];
              return (
                <div key={i} className={`rounded-xl p-4 text-center ${colors[i % colors.length]}`}>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <div className="text-xs mt-1 capitalize opacity-80">{item._id?.replace(/_/g, ' ')}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
