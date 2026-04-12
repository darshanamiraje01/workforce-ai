import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, Users, BarChart3, CheckSquare, Clock, Shield, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'Real AI Scoring', desc: 'Productivity scores from attendance, tasks, consistency and leave — no placeholders.', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { icon: BarChart3, title: 'Live Analytics', desc: 'Monthly trends, department breakdowns and task charts from your actual data.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: CheckSquare, title: 'Task Intelligence', desc: 'AI deadline risk prediction, overload detection and smart assignment suggestions.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Users, title: 'Team Management', desc: 'Full employee directory, role-based access, manager hierarchy and profiles.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Clock, title: 'Attendance & Leaves', desc: 'Daily tracking, monthly summaries and leave approval workflows.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Shield, title: 'Role-Based Auth', desc: 'JWT with Admin, Manager and Employee roles and protected route guards.', color: 'text-red-400', bg: 'bg-red-500/10' },
];

const STACK = ['React + Vite', 'Node.js + Express', 'MongoDB + Mongoose', 'Redux Toolkit', 'Tailwind CSS', 'Framer Motion', 'JWT Auth', 'Recharts'];

const DEMOS = [
  { role: 'Admin', email: 'admin@workforce.ai', pass: 'Admin@123', color: 'from-purple-500 to-brand-500' },
  { role: 'Manager', email: 'manager1@workforce.ai', pass: 'Manager@123', color: 'from-blue-500 to-cyan-500' },
  { role: 'Employee', email: 'james.wilson@workforce.ai', pass: 'Employee@123', color: 'from-emerald-500 to-teal-500' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/6 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-4 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-brand">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-none">WorkForce AI</div>
            <div className="text-[10px] text-brand-400 mt-0.5">Employee Management</div>
          </div>
        </div>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Sign In <ArrowRight size={14} />
        </button>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 sm:px-10 pt-20 pb-16 text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6">
            <Zap size={12} /> Full-Stack MERN SaaS — Production Grade
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5">
            Intelligent Workforce<br />
            <span className="text-gradient">Management Platform</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            A real-world MERN application with rule-based AI scoring, deadline risk prediction,
            task kanban, attendance tracking and department analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')} className="btn-primary px-8 py-3 text-sm">
              Launch Dashboard <ArrowRight size={16} />
            </motion.button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {['SC','AR','JW'].map(n => (
                  <div key={n} className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-500 border-2 border-surface-950 flex items-center justify-center text-[10px] font-bold text-white">{n}</div>
                ))}
              </div>
              <span>3 demo roles ready</span>
            </div>
          </div>
        </motion.div>

        {/* Mock dashboard preview */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-14 relative">
          <div className="bg-surface-800 border border-white/[0.08] rounded-3xl p-4 shadow-2xl text-left">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex gap-1.5">{['bg-red-500','bg-amber-500','bg-emerald-500'].map((c,i)=><div key={i} className={`w-3 h-3 rounded-full ${c}`}/>)}</div>
              <div className="flex-1 bg-surface-700/60 rounded-lg h-5 mx-4" />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[['👥 Employees','21','text-brand-400'],['✅ Tasks','24','text-blue-400'],['🏆 Completed','8','text-emerald-400'],['⚠️ Overdue','3','text-red-400']].map(([l,v,c])=>(
                <div key={l} className="bg-surface-700/60 rounded-xl p-3">
                  <div className={`text-xl font-bold ${c}`}>{v}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-surface-700/40 rounded-xl h-28 flex items-center justify-center"><div className="text-xs text-slate-700">📈 Task completion chart</div></div>
              <div className="bg-surface-700/40 rounded-xl h-28 flex items-center justify-center"><div className="text-xs text-slate-700">🧠 AI risk panel</div></div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-transparent to-transparent rounded-3xl pointer-events-none" />
        </motion.div>
      </section>

      {/* Demo accounts */}
      <section className="relative z-10 px-6 sm:px-10 py-10 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-2">Demo Accounts</div>
          <div className="text-slate-400 text-sm">Three roles — each with different dashboard views and permissions</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMOS.map(d => (
            <motion.div key={d.role} whileHover={{ y: -3 }}
              onClick={() => navigate('/login')}
              className="card card-hover p-5 cursor-pointer text-center">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}>{d.role[0]}</div>
              <div className="font-bold text-slate-200 mb-1">{d.role}</div>
              <div className="text-xs text-slate-500 font-mono">{d.email}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">{d.pass}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 sm:px-10 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Everything you need</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">Built with real rule-based AI logic — every score is computed from your actual database</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="card card-hover p-5">
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3`}><f.icon size={18} className={f.color} /></div>
              <h3 className="font-bold text-slate-100 mb-1.5 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="relative z-10 px-6 sm:px-10 py-12 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xs text-slate-600 uppercase tracking-widest mb-5">Built with</div>
          <div className="flex flex-wrap justify-center gap-2">
            {STACK.map(t => (
              <span key={t} className="px-4 py-2 bg-surface-800 border border-white/[0.08] rounded-xl text-xs text-slate-400 font-medium hover:border-brand-500/30 hover:text-brand-300 transition-all cursor-default">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 sm:px-10 py-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <div className="card p-10 border-brand-500/20 bg-gradient-to-r from-brand-500/5 to-purple-500/5 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to explore?</h2>
            <p className="text-slate-400 mb-8 text-sm">Sign in as Admin to see the full platform, or try a Manager or Employee view.</p>
            <button onClick={() => navigate('/login')} className="btn-primary px-10 py-3 mx-auto justify-center">
              Get Started Free <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
