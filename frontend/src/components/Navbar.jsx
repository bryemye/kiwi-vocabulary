import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Network,
  Menu,
  X
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
  onToggleAdminMode,
  isGuestMode = false,
}) {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const switcherRef = useRef(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      id: 'explorer',
      name: 'Root Explorer',
      badge: 'ACTIVE',
      tagline: 'Morpheme & Etymology Root Explorer',
      icon: Compass,
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
  ];

  const currentApp = apps.find(a => a.id === activeApp && !a.disabled) || apps[0];

  const handleSelectApp = (appId) => {
    setActiveApp(appId);
    setIsSwitcherOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b-2 border-[#111410]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Platform Brand & Desktop App Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Platform Brand */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink-0"
              onClick={() => handleSelectApp('vocab')}
            >
              {/* Geometric Kiwi Icon */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#7BB33B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] sm:shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center relative overflow-hidden group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-all shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none">
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
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#111410] font-mono">
                    KIWI
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 sm:py-0.5 font-bold uppercase tracking-wider bg-[#EDF5E5] text-[#2F441E] border border-[#111410] hidden xs:inline-block">
                    VOCAB
                  </span>
                </div>
              </div>
            </div>

            {/* Separator Pipe */}
            <div className="h-7 w-[2px] bg-[#111410]/20 hidden md:block" />

            {/* APP SWITCHER DROPDOWN (Desktop/Tablet) */}
            <div className="relative hidden md:block" ref={switcherRef}>
              <button
                onClick={() => setIsSwitcherOpen(prev => !prev)}
                className="flex items-center space-x-2 px-3 py-1.5 border-2 border-[#111410] font-mono text-xs font-bold uppercase transition-all bg-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#111410]"
              >
                <currentApp.icon className="w-3.5 h-3.5 text-white" />
                <span className="truncate max-w-[120px] lg:max-w-none">{currentApp.name}</span>
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

                      return (
                        <button
                          key={app.id}
                          onClick={() => handleSelectApp(app.id)}
                          className={`w-full text-left p-2.5 flex items-start space-x-3 border-2 transition ${
                            isActive
                              ? 'bg-[#EDF5E5] border-[#111410] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
                              : 'bg-white border-transparent hover:border-[#111410] hover:bg-[#FAFBF8] text-[#111410]'
                          }`}
                        >
                          <div className={`p-1.5 border border-[#111410] mt-0.5 shrink-0 ${
                            isActive ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#42281D]'
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

          {/* Quick Product Tabs for Desktop (>= lg) */}
          <div className="hidden xl:flex items-center space-x-2 font-mono text-xs">
            {apps.map((app) => {
              const Icon = app.icon;
              const isActive = activeApp === app.id && !app.disabled;

              return (
                <button
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold uppercase transition border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] ${
                    isActive
                      ? 'bg-[#7BB33B] text-white'
                      : 'bg-white hover:bg-[#FAFBF8] text-[#111410]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#7BB33B]'}`} />
                  <span>{app.name.replace('Kiwi ', '')}</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 border border-[#111410] font-bold ${
                    isActive ? 'bg-[#EDF5E5] text-[#2F441E]' : 'bg-[#FAFBF8] text-[#62685E]'
                  }`}>
                    {app.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Section: Auth & Mobile Menu Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global User Authentication Status (Desktop >= sm) */}
            {user ? (
              <div className="hidden sm:flex items-center space-x-1.5">
                <div
                  className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono text-[#2F441E] max-w-[130px] md:max-w-[180px]"
                  title={`Signed in as ${user.email}`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#7BB33B] shrink-0" />
                  <span className="truncate font-bold">{user.email}</span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out of your session"
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#FDF2F2] hover:text-[#991B1B] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-bold uppercase transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">LOGOUT</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isGuestMode && (
                  <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[10px] font-mono font-black uppercase">
                    <span className="w-2 h-2 rounded-full bg-[#7BB33B] animate-pulse" />
                    <span>GUEST · DAILY 15</span>
                  </span>
                )}
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">SIGN IN / REGISTER</span>
                  <span className="md:hidden">SIGN IN</span>
                </button>
              </div>
            )}

            {/* Mobile Header Quick Auth Trigger (When logged out on mobile) */}
            {!user && (
              <button
                onClick={onOpenAuth}
                className="sm:hidden flex items-center space-x-1 px-2.5 py-1.5 bg-[#7BB33B] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-black uppercase"
                title="Sign In / Register"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </button>
            )}

            {/* Mobile Menu Hamburger Button (< lg) */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-2 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-[#111410] active:translate-x-[1px] active:translate-y-[1px] transition"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-[#111410]" />
              ) : (
                <Menu className="w-5 h-5 text-[#111410]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FULL-WIDTH DRAWER MENU (< lg) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-[#111410] bg-white shadow-[0px_8px_0px_0px_rgba(17,20,16,0.25)] animate-fade-in divide-y-2 divide-[#111410]/20">
          {/* Mobile Navigation Apps */}
          <div className="p-3 space-y-2">
            <div className="text-[10px] font-mono font-black uppercase text-[#62685E] px-1">
              Kiwi Educational Products
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {apps.map((app) => {
                const Icon = app.icon;
                const isActive = activeApp === app.id && !app.disabled;

                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app.id)}
                    className={`w-full text-left p-2.5 flex items-start space-x-3 border-2 transition ${
                      isActive
                        ? 'bg-[#EDF5E5] border-[#111410] text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
                        : 'bg-white border-[#111410]/30 hover:border-[#111410] text-[#111410]'
                    }`}
                  >
                    <div className={`p-1.5 border border-[#111410] mt-0.5 shrink-0 ${
                      isActive ? 'bg-[#7BB33B] text-white' : 'bg-white text-[#42281D]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black uppercase truncate">
                          {app.name}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 border uppercase font-bold ${
                          isActive ? 'bg-[#7BB33B] text-white border-[#111410]' : 'bg-[#FAFBF8] border-[#111410] text-[#62685E]'
                        }`}>
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

          {/* Mobile Editorial Review Mode Toggle */}
          {onToggleAdminMode && (
            <div className="p-3 bg-[#FAFBF8] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className={`w-4 h-4 ${isAdminMode ? 'text-[#7BB33B]' : 'text-[#42281D]'}`} />
                <div>
                  <div className="text-xs font-mono font-black uppercase text-[#111410]">
                    Editorial Review Mode
                  </div>
                  <div className="text-[10px] font-mono text-[#62685E]">
                    Currently: {isAdminMode ? 'ACTIVE (Editor Bar Visible)' : 'INACTIVE'}
                  </div>
                </div>
              </div>

              <button
                onClick={onToggleAdminMode}
                className={`px-3 py-1.5 text-xs font-mono font-black uppercase border-2 border-[#111410] transition ${
                  isAdminMode
                    ? 'bg-[#111410] text-[#7BB33B] shadow-[2px_2px_0px_0px_#7BB33B]'
                    : 'bg-white text-[#111410] shadow-[2px_2px_0px_0px_#111410]'
                }`}
              >
                {isAdminMode ? 'DISABLE' : 'ENABLE'}
              </button>
            </div>
          )}

          {/* Mobile User Profile & Auth */}
          <div className="p-3 bg-white">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  <div className="p-1.5 bg-[#EDF5E5] border border-[#111410] text-[#7BB33B]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-[#62685E] uppercase block">Signed In As</span>
                    <span className="text-xs font-mono font-bold text-[#111410] truncate block">{user.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-[#FDF2F2] hover:text-[#991B1B] text-[#42281D] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-black uppercase"
                >
                  <LogOut className="w-3.5 h-3.5 inline mr-1" />
                  <span>LOGOUT</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>SIGN IN / REGISTER VIA MAGIC LINK</span>
              </button>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
