import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  LineChart,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Network,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({
  activeApp = 'vocab',
  setActiveApp,
  stats,
  sessionSeconds,
  user,
  onOpenAuth,
  onLogout,
  isAdminMode = false,
  onToggleAdminMode
}) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Close switcher on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const apps = [
    {
      id: 'vocab',
      name: 'Kiwi Vocabulary',
      badge: 'ACTIVE',
      tagline: 'Etymological Flashcards & Spaced Repetition',
      icon: Sparkles,
      color: '#7BB33B',
      accentBg: '#EDF5E5',
      disabled: false,
    },
    {
      id: 'graph',
      name: 'Root Graph',
      badge: 'ACTIVE',
      tagline: 'Interactive Etymology Knowledge Graph',
      icon: Network,
      color: '#7BB33B',
      accentBg: '#EDF5E5',
      disabled: false,
    },
    {
      id: 'math',
      name: 'Kiwi Math',
      badge: 'IN DEVELOPMENT',
      tagline: 'Interactive Coordinate Plane & Math Lab',
      icon: LineChart,
      color: '#42281D',
      accentBg: '#FAFBF8',
      disabled: true,
    },
    {
      id: 'reading',
      name: 'Kiwi Reading',
      badge: 'IN DEVELOPMENT',
      tagline: 'Passage Analysis & Active Annotation',
      icon: BookOpenCheck,
      color: '#42281D',
      accentBg: '#FAFBF8',
      disabled: true,
    },
  ];

  const currentApp = apps.find(a => a.id === activeApp && !a.disabled) || apps[0];

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b-2 border-[#111410]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Platform Brand & App Switcher */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Platform Brand */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveApp('vocab')}
            >
              {/* Geometric Kiwi Icon */}
              <div className="w-10 h-10 bg-[#7BB33B] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center relative overflow-hidden group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0px_0px_#111410] transition-all">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                  <circle cx="12" cy="12" r="9" fill="#84C341" stroke="#111410" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3.5" fill="#FAFBF8" stroke="#111410" strokeWidth="1.5" />
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
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#111410] font-mono">
                    KIWI
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase tracking-wider bg-[#EDF5E5] text-[#2F441E] border border-[#111410]">
                    VOCABULARY
                  </span>
                </div>
              </div>
            </div>

            {/* Separator Pipe */}
            <div className="h-7 w-[2px] bg-[#111410]/20 hidden sm:block" />

            {/* APP SWITCHER DROPDOWN */}
            <div className="relative" ref={switcherRef}>
              <button
                onClick={() => setIsSwitcherOpen(prev => !prev)}
                className="flex items-center space-x-2 px-3 py-1.5 border-2 border-[#111410] font-mono text-xs font-bold uppercase transition-all bg-[#7BB33B] text-white shadow-[3px_3px_0px_0px_#111410]"
              >
                <currentApp.icon className="w-3.5 h-3.5 text-white" />
                <span className="truncate max-w-[120px] sm:max-w-none">{currentApp.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${isSwitcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isSwitcherOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border-2 border-[#111410] shadow-[5px_5px_0px_0px_#111410] z-50 animate-fade-in p-1">
                  <div className="px-3 py-1.5 border-b border-[#111410]/20 text-[10px] font-mono font-black uppercase text-[#62685E] tracking-wider">
                    Kiwi Platform Educational Products
                  </div>
                  <div className="space-y-1 mt-1">
                    {apps.map((app) => {
                      const Icon = app.icon;
                      const isActive = activeApp === app.id && !app.disabled;

                      if (app.disabled) {
                        return (
                          <div
                            key={app.id}
                            className="w-full text-left p-2.5 flex items-start space-x-3 border-2 border-dashed border-[#111410]/30 bg-[#FAFBF8] opacity-60 cursor-not-allowed select-none"
                            title={`${app.name} is currently in development`}
                          >
                            <div className="p-1.5 border border-[#111410]/40 bg-[#EFE8DF] text-[#42281D] mt-0.5 shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-black uppercase truncate text-[#111410]/80">
                                  {app.name}
                                </span>
                                <span className="bg-[#EFE8DF] text-[#42281D] text-xs font-mono px-1.5 py-0.5 border border-[#111410] font-bold uppercase tracking-wider shrink-0">
                                  {app.badge}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-[#62685E] truncate mt-0.5">
                                {app.tagline}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={app.id}
                          onClick={() => {
                            setActiveApp(app.id);
                            setIsSwitcherOpen(false);
                          }}
                          className={`w-full text-left p-2.5 flex items-start space-x-3 border-2 transition ${isActive
                              ? 'bg-[#EDF5E5] border-[#111410] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
                              : 'bg-white border-transparent hover:border-[#111410] hover:bg-[#FAFBF8] text-[#111410]'
                            }`}
                        >
                          <div className={`p-1.5 border border-[#111410] mt-0.5 shrink-0 ${isActive ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#42281D]'
                            }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-black uppercase truncate">
                                {app.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 border uppercase font-bold bg-[#7BB33B] text-white border-[#111410]">
                                {app.badge}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-[#62685E] truncate mt-0.5">
                              {app.tagline}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Product Tabs for Desktop (Only Active Vocabulary Clickable) */}
          <div className="hidden lg:flex items-center space-x-2 font-mono text-xs">
            {apps.map((app) => {
              const Icon = app.icon;
              const isActive = activeApp === app.id && !app.disabled;

              if (app.disabled) {
                return (
                  <div
                    key={app.id}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-bold uppercase bg-[#FAFBF8] text-[#42281D]/70 border-2 border-dashed border-[#111410]/30 opacity-60 cursor-not-allowed select-none"
                    title={`${app.name} is in development`}
                  >
                    <Icon className="w-3 h-3 text-[#42281D]" />
                    <span>{app.name.replace('Kiwi ', '')}</span>
                    <span className="bg-[#EFE8DF] text-[#42281D] text-xs font-mono px-1.5 py-0.5 border border-[#111410] font-bold">
                      SOON
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={app.id}
                  onClick={() => setActiveApp(app.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold uppercase transition border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] ${isActive
                      ? 'bg-[#7BB33B] text-white'
                      : 'bg-white hover:bg-[#FAFBF8] text-[#111410]'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#7BB33B]'}`} />
                  <span>{app.name.replace('Kiwi ', '')}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 border border-[#111410] font-bold ${isActive ? 'bg-[#EDF5E5] text-[#2F441E]' : 'bg-[#FAFBF8] text-[#62685E]'
                    }`}>
                    ACTIVE
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Section: Stats & Global Magic-Link Authentication */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Session Timer & Accuracy (Desktop) */}
            <div className="hidden xl:flex items-center space-x-2">
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

            {/* Editorial / Admin Review Mode Toggle */}
            {onToggleAdminMode && (
              <button
                onClick={onToggleAdminMode}
                className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-bold uppercase transition border-2 border-[#111410] ${isAdminMode
                    ? 'bg-[#111410] text-[#7BB33B] shadow-[2px_2px_0px_0px_#7BB33B]'
                    : 'bg-[#FAFBF8] hover:bg-white text-[#42281D] shadow-[2px_2px_0px_0px_#111410]'
                  }`}
                title={`Toggle Editorial / Admin Review Mode (Ctrl+Shift+E) · Currently: ${isAdminMode ? 'ACTIVE' : 'OFF'}`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isAdminMode ? 'text-[#7BB33B]' : 'text-[#42281D]'}`} />
                <span className="hidden sm:inline">REVIEW</span>
                <span className={`w-2 h-2 rounded-full border border-[#111410] ${isAdminMode ? 'bg-[#7BB33B] animate-pulse' : 'bg-gray-300'}`} />
              </button>
            )}

            {/* Global User Authentication Status */}
            {user ? (
              <div className="flex items-center space-x-1.5">
                <div
                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono text-[#2F441E] max-w-[130px] sm:max-w-[190px]"
                  title={`Signed in as ${user.email}`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#7BB33B] shrink-0" />
                  <span className="truncate font-bold">{user.email}</span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out of your session"
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#FDF2F2] hover:text-[#991B1B] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-bold uppercase transition hover:translate-x-[-1px] hover:translate-y-[-1px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">LOGOUT</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>SIGN IN / REGISTER</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
