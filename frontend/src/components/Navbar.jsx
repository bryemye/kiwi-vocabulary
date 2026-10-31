import React from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Sparkles, 
  LineChart, 
  BookOpenCheck,
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, stats, sessionSeconds }) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vocab', label: 'Etymology Flashcards', icon: Sparkles },
    { id: 'math', label: 'Math Graphing Lab', icon: LineChart },
    { id: 'reading', label: 'Reading & Annotation', icon: BookOpenCheck },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">AEGIS</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  SAT · ACT
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Mastery Studio & Adaptive Labs</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Session Timer & Quick Stats */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Session: <strong className="text-white font-mono">{formatTime(sessionSeconds)}</strong></span>
            </div>
            {stats?.overall && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accuracy: <strong>{stats.overall.accuracy_percentage}%</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
