// EmployeeDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Brain, BarChart2, TrendingUp } from 'lucide-react';
import { employeeAPI, aiAPI } from '../utils/api';
import { Avatar, Badge, StatusBadge, ProgressBar, Spinner } from '../components/common/index.jsx';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      employeeAPI.getOne(id),
      aiAPI.getPerformanceSummary(id, 'monthly').catch(() => ({ data: null })),
    ]).then(([empRes, sumRes]) => {
      setEmployee(empRes.data.data);
      setSummary(sumRes.data?.data);
    }).catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
  if (!employee) return null;

  const radarData = summary ? [
    { subject: 'Attendance', value: summary.scoreBreakdown?.attendance || 0 },
    { subject: 'Tasks', value: summary.scoreBreakdown?.taskCompletion || 0 },
    { subject: 'Deadlines', value: summary.scoreBreakdown?.overdueManagement || 0 },
    { subject: 'Consistency', value: summary.scoreBreakdown?.consistency || 0 },
    { subject: 'Availability', value: summary.scoreBreakdown?.leaveFrequency || 0 },
  ] : [];

  const tierColor = {
    exceptional: 'text-brand-400', good: 'text-emerald-400',
    average: 'text-amber-400', needs_improvement: 'text-red-400'
  }[summary?.performanceTier] || 'text-slate-400';

  const tabs = ['overview', 'performance', 'tasks'];

  return (
    <div className="p-6 space-y-5 animate-in">
      <button onClick={() => navigate('/employees')} className="flex items-center gap-2 text-slate-500 hover:text-slate-200 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Employees
      </button>

      {/* Profile header */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-900/60 via-purple-900/40 to-blue-900/40 relative">
          <div className="absolute inset-0 bg-mesh opacity-50" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="ring-4 ring-surface-800 rounded-2xl">
              <Avatar name={employee.name} src={employee.avatar} size="xl" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-100">{employee.name}</h1>
                <StatusBadge status={employee.status} />
                {employee.role !== 'employee' && (
                  <Badge variant="brand">{employee.role}</Badge>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">{employee.position} · {employee.department}</div>
            </div>
            {summary && (
              <div className="text-right pb-1">
                <div className={`text-2xl font-bold ${tierColor}`}>{summary.productivityScore}%</div>
                <div className="text-xs text-slate-600">Productivity Score</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Mail, value: employee.email, label: 'Email' },
              { icon: Phone, value: employee.phone || '—', label: 'Phone' },
              { icon: MapPin, value: employee.location || '—', label: 'Location' },
              { icon: Calendar, value: employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', label: 'Joined' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center">
                  <item.icon size={13} className="text-slate-500" />
                </div>
                <div>
                  <div className="text-xs text-slate-300 truncate max-w-[120px]">{item.value}</div>
                  <div className="text-[10px] text-slate-600">{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          {employee.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {employee.skills.map(s => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 border border-white/[0.06] rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === t ? 'bg-brand-500/20 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-4">
            <div className="section-title">Employee Info</div>
            {[
              ['Employee ID', employee.employeeId],
              ['Department', employee.department],
              ['Position', employee.position],
              ['Manager', employee.manager?.name || '—'],
              ['Salary', employee.salary ? `$${employee.salary.toLocaleString()}` : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-600">{k}</span>
                <span className="text-slate-300 font-medium">{v || '—'}</span>
              </div>
            ))}
          </div>
          {summary && (
            <div className="card p-5">
              <div className="section-title mb-4">Monthly Summary</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Tasks Completed', value: summary.summary?.tasksCompleted },
                  { label: 'On-Time Rate', value: `${summary.summary?.onTimeDeliveryRate}%` },
                  { label: 'Attendance Rate', value: `${summary.summary?.attendanceRate}%` },
                  { label: 'Leave Days', value: summary.summary?.leaveDaysTaken },
                ].map(item => (
                  <div key={item.label} className="bg-surface-700/50 rounded-xl p-3">
                    <div className="text-lg font-bold text-slate-100">{item.value}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              {summary.insights?.length > 0 && (
                <div className="space-y-1.5">
                  {summary.insights.map((ins, i) => (
                    <div key={i} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-brand-400">›</span> {ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Performance tab */}
      {activeTab === 'performance' && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="section-title mb-4 flex items-center gap-2">
              <Brain size={15} className="text-brand-400" /> Score Breakdown
            </div>
            <div className="space-y-3">
              {Object.entries(summary.scoreBreakdown || {}).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold text-slate-200">{val}%</span>
                  </div>
                  <ProgressBar value={val}
                    colorClass={val >= 80 ? 'from-emerald-500 to-teal-500' : val >= 60 ? 'from-brand-500 to-purple-500' : 'from-amber-500 to-orange-500'}
                    height="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="section-title mb-4">Performance Radar</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#1e2433', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <div className="section-title mb-3 text-emerald-400">Strengths</div>
            <div className="space-y-2">
              {summary.strengths?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 text-base">✓</span> {s}
                </div>
              ))}
              {!summary.strengths?.length && <div className="text-sm text-slate-600">No strengths identified yet</div>}
            </div>
          </div>
          <div className="card p-5">
            <div className="section-title mb-3 text-amber-400">Areas for Improvement</div>
            <div className="space-y-2">
              {summary.areasForImprovement?.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 text-base">→</span> {s}
                </div>
              ))}
              {!summary.areasForImprovement?.length && <div className="text-sm text-slate-600">All areas performing well!</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
