import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  LineChart, 
  BookOpenCheck,
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
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b-2 border-[#111410]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group" 
            onClick={() => setActiveTab('dashboard')}
          >
            {/* Geometric Kiwi Icon */}
            <div className="w-10 h-10 bg-[#7BB33B] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center relative overflow-hidden group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0px_0px_#111410] transition-all">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                {/* Outer kiwi slice */}
                <circle cx="12" cy="12" r="9" fill="#84C341" stroke="#111410" strokeWidth="2" />
                {/* Pale core */}
                <circle cx="12" cy="12" r="3.5" fill="#FAFBF8" stroke="#111410" strokeWidth="1.5" />
                {/* Geometric seeds */}
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(0 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(45 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(90 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(135 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(180 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(225 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(270 12 12)" />
                <rect x="11.5" y="5.5" width="1" height="2" fill="#42281D" transform="rotate(315 12 12)" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tighter text-[#111410] font-mono">
                  KIWI<span className="text-[#7BB33B]">.</span>LEARNING
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 font-bold uppercase tracking-wider bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                  SAT · ACT
                </span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-tight text-[#62685E] hidden sm:block">
                Swiss Grid Diagnostic Engine
              </p>
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
                  className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono font-bold tracking-tight uppercase transition-all duration-150 ${
                    isActive
                      ? 'bg-[#7BB33B] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white text-[#111410] border-2 border-transparent hover:border-[#111410] hover:bg-[#FAFBF8] hover:shadow-[2px_2px_0px_0px_#111410]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#42281D]'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Session Timer & Quick Stats */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono text-[#111410]">
              <Clock className="w-3.5 h-3.5 text-[#42281D]" />
              <span>TIME: <strong>{formatTime(sessionSeconds)}</strong></span>
            </div>
            {stats?.overall && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono text-[#2F441E]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7BB33B]" />
                <span>ACC: <strong>{stats.overall.accuracy_percentage}%</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
