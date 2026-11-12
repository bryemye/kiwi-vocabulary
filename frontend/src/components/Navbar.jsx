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
  X,
  Award,
  Milestone
} from 'lucide-react';
import { useCelestialTrajectory } from '../context/CelestialTrajectoryContext';

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

  // Trajectory flight path context for toggle and status
  const trajectoryContext = useCelestialTrajectory();
  const isRibbonVisible = trajectoryContext?.isRibbonVisible;
  const setIsRibbonVisible = trajectoryContext?.setIsRibbonVisible;
  const trajectory = trajectoryContext?.trajectory || [];

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
      shortName: 'Study Deck',
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
      shortName: 'Explorer',
      badge: 'ACTIVE',
      tagline: 'Morpheme & Etymology Root Explorer',
      icon: Compass,
      color: '#7BB33B',
      accentBg: '#EDF5E5',
      disabled: false,
    },
    {
      id: 'platform',
      name: 'Mastery Dashboard',
      shortName: 'Mastery',
      badge: 'ACTIVE',
      tagline: 'Circle Mastery Telemetry & Domain Horizons',
      icon: Award,
      color: '#7BB33B',
      accentBg: '#EDF5E5',
      disabled: false,
    },
    {
      id: 'graph',
      name: 'Root Graph',
      shortName: 'Graph',
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-soft-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Platform Brand & Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Platform Brand */}
            <div
              className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
              onClick={() => handleSelectApp('vocab')}
            >
              {/* Geometric Kiwi Icon with refined soft borders */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#7BB33B] border border-[#7BB33B] rounded-xl shadow-soft-sm flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-all shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none">
                  <circle cx="12" cy="12" r="9" fill="#84C341" stroke="#2F441E" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3.5" fill="#FAFBF8" stroke="#2F441E" strokeWidth="1" />
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
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-stone-900 font-sans">
                    Kiwi
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 font-bold uppercase tracking-wider bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/30 rounded-md hidden xs:inline-block">
                    Vocab
                  </span>
                </div>
              </div>
            </div>

            {/* Separator Pipe */}
            <div className="h-6 w-[1px] bg-stone-200 hidden md:block" />

            {/* Consolidated Navigation Links (Desktop >= md) */}
            <nav className="hidden md:flex items-center space-x-1 font-sans text-xs" aria-label="Main Navigation">
              {apps.map((app) => {
                const Icon = app.icon;
                const isActive = activeApp === app.id && !app.disabled;

                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/40 shadow-soft-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7BB33B]' : 'text-stone-400'}`} />
                    <span>{app.shortName}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Trajectory, Auth & Mobile Menu Trigger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Trajectory Navigation Toggle Pill (Desktop >= lg) */}
            {setIsRibbonVisible && (
              <button
                onClick={() => setIsRibbonVisible(prev => !prev)}
                title="Toggle Celestial Flight Trajectory Ribbon"
                className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-xl border transition-all ${
                  isRibbonVisible
                    ? 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]/40 shadow-soft-xs'
                    : 'bg-white hover:bg-stone-50 text-stone-600 border-stone-200/90'
                }`}
              >
                <Milestone className={`w-3.5 h-3.5 ${isRibbonVisible ? 'text-[#7BB33B]' : 'text-stone-400'}`} />
                <span>Path</span>
                {trajectory.length > 0 && (
                  <span className="text-[10px] text-stone-500 font-bold">({trajectory.length})</span>
                )}
              </button>
            )}

            {/* Global User Authentication Status (Desktop >= sm) */}
            {user ? (
              <div className="hidden sm:flex items-center space-x-1.5">
                <div
                  className="flex items-center space-x-1.5 px-3 py-1 bg-[#EDF5E5] border border-[#7BB33B]/30 rounded-xl text-xs font-mono text-[#2F441E] max-w-[130px] md:max-w-[180px] shadow-soft-xs"
                  title={`Signed in as ${user.email}`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#7BB33B] shrink-0" />
                  <span className="truncate font-bold">{user.email}</span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out of your session"
                  className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 text-stone-600 border border-stone-200 rounded-xl text-xs font-sans font-medium transition shadow-soft-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {isGuestMode && (
                  <span className="hidden md:inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF5E5] text-[#2F441E] border border-[#7BB33B]/30 rounded-full text-[11px] font-mono font-bold shadow-soft-xs">
                    <span className="w-2 h-2 rounded-full bg-[#7BB33B] animate-pulse" />
                    <span>Daily 15</span>
                  </span>
                )}
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#7BB33B] hover:bg-[#6FA334] text-white rounded-xl shadow-soft-sm hover:shadow-soft-md text-xs font-sans font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Sign In / Register</span>
                  <span className="md:hidden">Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Header Quick Auth Trigger (When logged out on mobile) */}
            {!user && (
              <button
                onClick={onOpenAuth}
                className="sm:hidden flex items-center space-x-1 px-2.5 py-1.5 bg-[#7BB33B] text-white rounded-xl shadow-soft-sm text-xs font-sans font-bold"
                title="Sign In / Register"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Hamburger Button (< md) */}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl shadow-soft-xs text-stone-700 transition"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-stone-800" />
              ) : (
                <Menu className="w-5 h-5 text-stone-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE FULL-WIDTH DRAWER MENU (< md) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white/98 backdrop-blur-md shadow-soft-lg animate-fade-in p-3 space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase text-stone-500 px-1">
            Navigation
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {apps.map((app) => {
              const Icon = app.icon;
              const isActive = activeApp === app.id && !app.disabled;

              return (
                <button
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={`w-full text-left p-2.5 flex items-center space-x-3 rounded-xl border transition ${
                    isActive
                      ? 'bg-[#EDF5E5] border-[#7BB33B]/40 text-[#2F441E] font-bold shadow-soft-xs'
                      : 'bg-white border-stone-200/80 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg border shrink-0 ${
                    isActive ? 'bg-[#7BB33B] text-white border-[#7BB33B]' : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-bold truncate">
                        {app.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-[#7BB33B] text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                      {app.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile Trajectory flight path toggle */}
          {setIsRibbonVisible && (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between px-1">
              <span className="text-xs font-sans text-stone-600">Trajectory Flight Path</span>
              <button
                onClick={() => {
                  setIsRibbonVisible(prev => !prev);
                  setIsMobileMenuOpen(false);
                }}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border ${
                  isRibbonVisible
                    ? 'bg-[#EDF5E5] text-[#2F441E] border-[#7BB33B]/40'
                    : 'bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                {isRibbonVisible ? 'Shown (Tap to Hide)' : 'Hidden (Tap to Show)'}
              </button>
            </div>
          )}

          {/* Mobile User & Session Status */}
          {user && (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between px-1">
              <span className="text-xs font-mono text-stone-600 truncate max-w-[200px]">
                {user.email}
              </span>
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="px-2.5 py-1 text-xs font-sans font-bold text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Mobile Editorial Review Mode Toggle */}
          {onToggleAdminMode && (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <ShieldCheck className={`w-4 h-4 ${isAdminMode ? 'text-[#7BB33B]' : 'text-stone-400'}`} />
                <span className="text-xs font-sans font-bold text-stone-700">
                  Reviewer Admin Mode
                </span>
              </div>
              <button
                onClick={onToggleAdminMode}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${
                  isAdminMode
                    ? 'bg-[#7BB33B] text-white border-[#7BB33B]'
                    : 'bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                {isAdminMode ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
