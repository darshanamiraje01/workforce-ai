import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, TrendingUp, Users, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { fetchTeamInsights, fetchAtRiskTasks } from '../store/index';
import { aiAPI } from '../utils/api';
import { Avatar, Badge, ProgressBar, PageHeader, Spinner } from '../components/common/index.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
const TIER_CONFIG = {
  exceptional: { color: 'text-brand-400', bg: 'bg-brand-500/10', label: '🏆 Exceptional' },
  good: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: '✅ Good' },
  average: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '📊 Average' },
  needs_improvement: { color: 'text-red-400', bg: 'bg-red-500/10', label: '⚠ Needs Work' },
};

export default function AIInsightsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { teamInsights, atRiskTasks, loading } = useSelector(s => s.analytics);
  const [workload, setWorkload] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchTeamInsights()),
      dispatch(fetchAtRiskTasks()),
      aiAPI.getWorkloadBalance().then(r => setWorkload(r.data.data)).catch(() => {}),
    ]);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const chartData = teamInsights?.teamWorkloadData?.map(d => ({
    name: d.name?.split(' ')[0],
    productivity: d.productivityScore,
    tasks: d.activeTasks,
    fill: d.overloadLevel === 'critical' ? '#ef4444' : d.overloadLevel === 'high' ? '#f59e0b' : '#6366f1',
  })) || [];

  return (
    <div className="p-6 space-y-5 animate-in">
      <PageHeader title="AI Insights Dashboard" subtitle="Real-time rule-based intelligence from your workforce data"
        actions={
          <button onClick={load} disabled={refreshing} className="btn-secondary">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {/* AI explanation banner */}
      <div className="card p-4 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-purple-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-brand-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-200 mb-1">How AI Scores Work</div>
            <div className="text-xs text-slate-500 leading-relaxed">
              All scores are computed from real database data using rule-based logic.
              <strong className="text-slate-400"> Productivity</strong> = attendance(30%) + task completion(30%) + overdue management(20%) + consistency(10%) + leave frequency(10%).
              <strong className="text-slate-400"> Risk scores</strong> factor in progress-vs-time ratio, days remaining, employee workload, and current productivity.
            </div>
          </div>
        </div>
      </div>

      {/* Team overview stats */}
      {teamInsights && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Team Avg Productivity', value: `${teamInsights.avgProductivity}%`, color: 'text-brand-400', icon: '📊' },
            { label: 'Top Score', value: `${teamInsights.topPerformers?.[0]?.productivityScore || 0}%`, color: 'text-emerald-400', icon: '🏆' },
            { label: 'Overloaded Members', value: teamInsights.overloadedEmployees?.length || 0, color: 'text-red-400', icon: '⚠️' },
            { label: 'At-Risk Tasks', value: atRiskTasks.filter(r => r.riskLevel === 'high').length, color: 'text-amber-400', icon: '🎯' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-slate-600 mt-0.5">{item.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* At-risk tasks */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <span className="section-title">Deadline Risk Analysis</span>
            <Badge variant="yellow" size="xs">{atRiskTasks.length} tasks</Badge>
          </div>
          <div className="space-y-3">
            {atRiskTasks.slice(0, 6).map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/tasks/${item.task?._id}`)}
                className="p-3 rounded-xl bg-surface-700/50 border border-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 truncate flex-1 mr-2">{item.task?.title}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full" style={{ background: RISK_COLORS[item.riskLevel] }} />
                    <span className="text-[10px] font-bold" style={{ color: RISK_COLORS[item.riskLevel] }}>
                      {item.riskScore}% risk
                    </span>
                  </div>
                </div>
                <ProgressBar value={item.riskScore}
                  colorClass={item.riskLevel === 'high' ? 'from-red-500 to-red-600' : item.riskLevel === 'medium' ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'}
                  height="h-1" />
                {item.factors?.length > 0 && (
                  <div className="mt-2 text-[10px] text-slate-600">{item.factors[0]}</div>
                )}
              </motion.div>
            ))}
            {atRiskTasks.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-600">✅ No at-risk tasks detected</div>
            )}
          </div>
        </div>

        {/* Team productivity scores */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-brand-400" />
            <span className="section-title">Team Productivity Scores</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="productivity" name="Score" radius={[0, 4, 4, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-40"><Spinner /></div>}
        </div>
      </div>

      {/* Overloaded employees */}
      {teamInsights?.overloadedEmployees?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={15} className="text-red-400" />
            <span className="section-title text-red-300">Overloaded Employees</span>
            <Badge variant="red">{teamInsights.overloadedEmployees.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teamInsights.overloadedEmployees.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                onClick={() => navigate(`/employees/${item.employee?._id}`)}
                className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={item.employee?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200 truncate">{item.employee?.name}</div>
                    <div className="text-[10px] text-slate-500">{item.employee?.department}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-700/60 rounded-lg p-2 text-center">
                    <div className="font-bold text-red-400">{item.overload?.activeTasks}</div>
                    <div className="text-slate-600 text-[10px]">Active tasks</div>
                  </div>
                  <div className="bg-surface-700/60 rounded-lg p-2 text-center">
                    <div className="font-bold text-brand-400">{item.productivityScore}%</div>
                    <div className="text-slate-600 text-[10px]">Productivity</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Top performers */}
      {teamInsights?.topPerformers?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">🏆</span>
            <span className="section-title">Top Performers</span>
          </div>
          <div className="space-y-2">
            {teamInsights.topPerformers.map((item, i) => {
              const tier = item.productivityScore >= 85 ? 'exceptional' : item.productivityScore >= 70 ? 'good' : item.productivityScore >= 55 ? 'average' : 'needs_improvement';
              const cfg = TIER_CONFIG[tier];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => navigate(`/employees/${item.employee?._id}`)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-700/50 cursor-pointer transition-all">
                  <div className="w-7 h-7 flex items-center justify-center font-bold text-slate-500 text-sm">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <Avatar name={item.employee?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-200">{item.employee?.name}</div>
                    <div className="text-xs text-slate-500">{item.employee?.department}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-xs px-2 py-0.5 rounded-lg font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</div>
                    <div className="text-lg font-bold text-brand-400">{item.productivityScore}%</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workload suggestions */}
      {workload?.suggestions?.length > 0 && (
        <div className="card p-5 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={15} className="text-amber-400" />
            <span className="section-title text-amber-300">Workload Redistribution Suggestions</span>
          </div>
          <div className="space-y-3">
            {workload.suggestions.map((s, i) => (
              <div key={i} className="p-3 bg-surface-800/60 rounded-xl border border-white/[0.06]">
                <div className="text-sm text-slate-300 mb-2">{s.message}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="text-red-400 font-medium">{s.from.name}</span>
                  <ArrowRight size={10} />
                  {s.to.map(t => <span key={t.id} className="text-emerald-400 font-medium">{t.name}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
