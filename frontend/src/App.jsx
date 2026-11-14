import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import VocabView from './components/VocabView';
import PoemsView from './components/PoemsView';
import AdminReviewBar from './components/AdminReviewBar';
import CelestialTrajectoryRibbon from './components/CelestialTrajectoryRibbon';
import CelestialFlightLogModal from './components/CelestialFlightLogModal';
import { useCelestialTrajectory } from './context/CelestialTrajectoryContext';
// Dormant standalone module imports preserved for future activation
import MathView from './components/MathView';
import ReadingView from './components/ReadingView';
import DashboardView from './components/DashboardView';
import AuthModal from './components/AuthModal';
import AuthVerifyCard from './components/AuthVerifyCard';
import {
  fetchDashboardStats,
  fetchRoots,
  fetchWords,
  fetchCurrentUser,
  logoutUser,
  fetchWordSession,
  fetchDailyDeck,
  getLocalDateString,
  getCachedDailyDeck,
  setCachedDailyDeck,
  getGuestSession,
  saveGuestSession,
  getCachedUserDeck,
  setCachedUserDeck,
} from './services/api';
import {
  getStoredAdminMode,
  setStoredAdminMode,
  mergeReviewsIntoWords,
  mergeReviewsIntoRoots
} from './services/editorialService';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const getTabFromUrl = () => {
    if (typeof window === 'undefined') return 'study';
    const hash = (window.location.hash || '').toLowerCase();
    const path = (window.location.pathname || '').toLowerCase();
    if (hash.includes('poems') || path.includes('poems')) return 'poems';
    if (hash.includes('graph') || path.includes('graph')) return 'graph';
    if (hash.includes('explorer') || path.includes('explorer')) return 'explorer';
    if (hash.includes('progress') || path.includes('progress')) return 'progress';
    return 'study';
  };

  // App Suite Navigation: 'vocab' is the primary SAT/ACT view, 'poems' is the poetry cinema
  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [activeApp, setActiveApp] = useState(() => {
    const tab = getTabFromUrl();
    if (tab === 'poems') return 'poems';
    if (tab === 'graph') return 'graph';
    if (tab === 'explorer') return 'explorer';
    return 'vocab';
  });

  const [stats, setStats] = useState(null);
  const [roots, setRoots] = useState([]);
  const [words, setWords] = useState([]);
  const [selectedRootId, setSelectedRootId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Authentication State
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [verifyToken, setVerifyToken] = useState(null);
  const [verifySessionId, setVerifySessionId] = useState(null);

  // Guest Mode States
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [preloadedDeck, setPreloadedDeck] = useState([]);
  const [guestSession, setGuestSession] = useState(null);
  const [todayDateStr, setTodayDateStr] = useState(() => getLocalDateString());
  const [todayFormatted, setTodayFormatted] = useState(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date());
    } catch (e) {
      return '';
    }
  });

  // Celestial History & Fast Travel Restorations
  const [externalMorphemeView, setExternalMorphemeView] = useState(null);
  const [practiceSetupTarget, setPracticeSetupTarget] = useState(null);
  const [vocabNavNonce, setVocabNavNonce] = useState(0);
  const [initialPoemId, setInitialPoemId] = useState(null);
  const [poemRestoreTarget, setPoemRestoreTarget] = useState(null);
  const [trajectoryRestoreTarget, setTrajectoryRestoreTarget] = useState(null);
  const { recordWaypoint, registerNavigator, setIsFlightLogOpen } = useCelestialTrajectory();

  // Register master fast-travel navigator
  useEffect(() => {
    registerNavigator((state, waypoint) => {
      if (!state) return;

      if (state.app === 'poems') {
        if (state.poemId) {
          setInitialPoemId(state.poemId);
          setPoemRestoreTarget({ poemId: state.poemId, nonce: Date.now() + Math.random() });
        } else {
          setPoemRestoreTarget(null);
        }
        setActiveApp('poems');
        setActiveTab('poems');
        if (window.history && window.history.pushState) {
          window.history.pushState({}, document.title, '/poems');
        }
      } else if (state.app === 'platform') {
        setExternalMorphemeView(null);
        setTrajectoryRestoreTarget(null);
        setActiveApp('platform');
      } else {
        const targetTab = state.tab || 'study';
        setActiveTab(targetTab);
        if (targetTab === 'graph') {
          setActiveApp('graph');
        } else if (targetTab === 'explorer') {
          setActiveApp('explorer');
        } else {
          setActiveApp('vocab');
        }

        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, `#${targetTab}`);
        }

        if (state.morphemeData) {
          setExternalMorphemeView(state.morphemeData);
        } else {
          setExternalMorphemeView(null);
        }

        setTrajectoryRestoreTarget({
          ...state,
          tab: targetTab,
          waypointType: waypoint?.type,
          nonce: Date.now() + Math.random(),
        });
      }
    });
  }, [registerNavigator]);

  // Global hotkey 'H' to toggle Celestial Flight Log
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'h' || e.key === 'H') {
        setIsFlightLogOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsFlightLogOpen]);

  // Record top-level navigation changes into Celestial Trajectory
  useEffect(() => {
    if (activeApp === 'platform') {
      recordWaypoint({
        type: 'SECTOR',
        title: 'BASE COMMAND',
        subtitle: 'PLATFORM DASHBOARD & GLOBAL TELEMETRY',
        system: 'Platform Command Core',
        depth: 0,
        state: { app: 'platform' },
      });
    } else if (activeApp === 'poems') {
      recordWaypoint({
        type: 'ANOMALY',
        title: 'POETRY CINEMA',
        subtitle: 'CINEMATIC TEXT RUNNER',
        system: 'Poetry Cinema',
        depth: 1,
        state: { app: 'poems' },
      });
    } else if (
      (activeApp === 'vocab' || activeApp === 'explorer' || activeApp === 'graph') &&
      !externalMorphemeView
    ) {
      if (activeTab === 'study') {
        recordWaypoint({
          type: 'STAR_SYSTEM',
          title: 'STUDY DECK',
          subtitle: 'SPACED REPETITION FLASHCARDS',
          system: 'Vocab Mastery',
          depth: 1,
          state: { app: 'vocab', tab: 'study' },
        });
      } else if (activeTab === 'explorer') {
        recordWaypoint({
          type: 'STAR_SYSTEM',
          title: 'ARCHIVE EXPLORER',
          subtitle: 'ROOT & MORPHEME DICTIONARY',
          system: 'Vocab Mastery',
          depth: 1,
          state: { app: 'vocab', tab: 'explorer' },
        });
      } else if (activeTab === 'graph') {
        recordWaypoint({
          type: 'STAR_SYSTEM',
          title: 'ROOT GRAPH',
          subtitle: 'LATIN & GREEK ETYMOLOGY GRAPH',
          system: 'Vocab Mastery',
          depth: 1,
          state: { app: 'vocab', tab: 'graph' },
        });
      } else if (activeTab === 'progress') {
        recordWaypoint({
          type: 'STAR_SYSTEM',
          title: 'PROGRESS TELEMETRY',
          subtitle: 'ACCURACY & MASTERY TELEMETRY',
          system: 'Vocab Mastery',
          depth: 1,
          state: { app: 'vocab', tab: 'progress' },
        });
      }
    }
  }, [activeApp, activeTab, externalMorphemeView, recordWaypoint]);

  // Editorial Reviewer / Admin Mode State (Restricted to Staff/Admin Users)
  const [isAdminMode, setIsAdminMode] = useState(getStoredAdminMode);
  const isStaffUser = Boolean(user?.is_staff);
  const effectiveAdminMode = isStaffUser && isAdminMode;

  const handleToggleAdminMode = useCallback(() => {
    if (!isStaffUser) return;
    setIsAdminMode((prev) => {
      const next = !prev;
      setStoredAdminMode(next);
      return next;
    });
  }, [isStaffUser]);

  // Global Keyboard Shortcut: Ctrl + Shift + E to toggle Reviewer / Admin Mode (Staff only)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        if (isStaffUser) {
          handleToggleAdminMode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleAdminMode, isStaffUser]);

  // Reactive handler for review updates
  const handleUpdateWordReview = useCallback((wordName, review) => {
    if (!wordName) return;
    const lower = wordName.toLowerCase();
    setWords((prev) =>
      prev.map((w) => (w.word?.toLowerCase() === lower ? { ...w, review } : w))
    );
    setRoots((prev) =>
      prev.map((r) => ({
        ...r,
        words: (r.words || []).map((w) =>
          w.word?.toLowerCase() === lower ? { ...w, review } : w
        ),
      }))
    );
  }, []);

  // Reactive handler for full word updates (lexical definition, affixes, sentence, etc.)
  const handleUpdateWord = useCallback((updatedWord) => {
    if (!updatedWord || !updatedWord.id) return;
    setWords((prev) =>
      prev.map((w) => (w.id === updatedWord.id ? { ...w, ...updatedWord } : w))
    );
    setRoots((prev) =>
      prev.map((r) => ({
        ...r,
        words: (r.words || []).map((w) =>
          w.id === updatedWord.id ? { ...w, ...updatedWord } : w
        ),
      }))
    );
    setPreloadedDeck((prev) => {
      const next = prev.map((w) =>
        w.id === updatedWord.id ? { ...w, ...updatedWord } : w
      );
      if (user?.id) {
        setCachedUserDeck(user.id, next);
      }
      return next;
    });
  }, [user?.id]);

  // Sync state whenever URL hash or browser history changes
  useEffect(() => {
    const handleLocationChange = () => {
      const tab = getTabFromUrl();
      setActiveTab(tab);
      if (tab === 'poems') {
        setActiveApp('poems');
      } else if (tab === 'graph') {
        setActiveApp('graph');
      } else if (tab === 'explorer') {
        setActiveApp('explorer');
      } else {
        setActiveApp('vocab');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Check URL on mount & enforce redirect away from disabled modules (/math, /reading)
  useEffect(() => {
    try {
      const fullPath = (window.location.pathname + window.location.hash + window.location.search).toLowerCase();
      if (fullPath.includes('poems')) {
        setActiveApp('poems');
        setActiveTab('poems');
      } else if (fullPath.includes('math') || fullPath.includes('reading')) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, '#study');
        }
        setActiveApp('vocab');
        setActiveTab('study');
      } else if (fullPath.includes('graph')) {
        setActiveApp('graph');
        setActiveTab('graph');
      } else if (fullPath.includes('explorer')) {
        setActiveApp('explorer');
        setActiveTab('explorer');
      } else if (fullPath.includes('progress')) {
        setActiveApp('vocab');
        setActiveTab('progress');
      }

      const searchParams = new URLSearchParams(window.location.search);
      let tokenInQuery = searchParams.get('token');
      let sidInQuery = searchParams.get('sid') || searchParams.get('session_id');
      if (!tokenInQuery && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, '?'));
        tokenInQuery = hashParams.get('token');
        if (!sidInQuery) sidInQuery = hashParams.get('sid') || hashParams.get('session_id');
      }

      if (tokenInQuery) {
        let cleaned = tokenInQuery.trim();
        cleaned = cleaned.replace(/=\r?\n/g, '').replace(/[\r\n\s]/g, '');
        if (cleaned.startsWith('=3D')) cleaned = cleaned.slice(3);
        else if (cleaned.startsWith('3D') && cleaned.includes(':')) cleaned = cleaned.slice(2);
        setVerifyToken(cleaned);
        if (sidInQuery) {
          setVerifySessionId(sidInQuery.trim());
        }
      }
    } catch (e) {
      console.error('Failed to parse URL search params:', e);
    }
  }, []);

  // Fast-path initial session & 15-card sequence loader
  useEffect(() => {
    let isMounted = true;
    const localDate = getLocalDateString();
    setTodayDateStr(localDate);

    const savedGuestSession = getGuestSession(localDate);
    const cachedDaily = getCachedDailyDeck(localDate);

    const init = async () => {
      try {
        const userData = await fetchCurrentUser();
        if (!isMounted) return;

        if (userData) {
          setUser(userData);
          setIsGuestMode(false);

          // Fast 0ms render from cached user deck if available
          const cachedUser = getCachedUserDeck(userData.id);
          if (cachedUser && cachedUser.length > 0) {
            setPreloadedDeck(cachedUser);
            setLoading(false);
          }

          // Fetch prioritized 15-word spaced repetition queue from backend
          const userDeck = await fetchWordSession({ count: 15 });
          if (isMounted && userDeck?.length > 0) {
            setPreloadedDeck(userDeck);
            setCachedUserDeck(userData.id, userDeck);
          }
        } else {
          setUser(null);
          setIsGuestMode(true);
          if (savedGuestSession && savedGuestSession.deck?.length > 0) {
            // Returning guest from earlier today: restore session
            setGuestSession(savedGuestSession);
            setPreloadedDeck(savedGuestSession.deck);
          } else {
            if (cachedDaily && cachedDaily.length > 0) {
              setPreloadedDeck(cachedDaily);
            } else {
              // Pre-load today's daily 15 challenge deck for immediate guest study
              const dailyDeck = await fetchDailyDeck(localDate);
              if (isMounted && dailyDeck?.length > 0) {
                setPreloadedDeck(dailyDeck);
                setCachedDailyDeck(localDate, dailyDeck);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Initial session init notice:', err);
        if (isMounted) {
          setIsGuestMode(true);
          if (cachedDaily && cachedDaily.length > 0) {
            setPreloadedDeck(cachedDaily);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Background non-blocking lazy loader for full dictionary (roots, words, telemetry stats)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const [rootsData, wordsData, statsData] = await Promise.all([
          fetchRoots().catch(err => { console.warn('Roots background sync note:', err); return []; }),
          fetchWords().catch(err => { console.warn('Words background sync note:', err); return []; }),
          fetchDashboardStats().catch(err => { console.warn('Dashboard stats sync note:', err); return null; }),
        ]);

        if (!isMounted) return;

        if (wordsData && wordsData.length > 0) {
          const wordsWithReviews = mergeReviewsIntoWords(wordsData);
          setWords(wordsWithReviews);
        }
        if (rootsData && rootsData.length > 0) {
          const rootsWithReviews = mergeReviewsIntoRoots(rootsData);
          setRoots(rootsWithReviews);
        }
        if (statsData) {
          setStats(statsData);
        }
      } catch (err) {
        console.warn('Background data sync note:', err);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh stats whenever an attempt is logged in vocabulary mode
  const handleAttemptLogged = async () => {
    try {
      const updatedStats = await fetchDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  const handleSelectRootForPractice = (rootId) => {
    setPracticeSetupTarget({
      rootIds: [Number(rootId)],
      source: 'platform',
      nonce: Date.now() + Math.random(),
    });
    handleNavigateTab('study', { preservePracticeSetup: true });
  };

  // Safe navigation handler enforcing Kiwi Views
  const handleNavigateTab = (tab, options = {}) => {
    setExternalMorphemeView(null);
    setTrajectoryRestoreTarget(null);
    if (!options.preservePracticeSetup) {
      setPracticeSetupTarget(null);
      setVocabNavNonce((n) => n + 1);
    }
    setActiveTab(tab);
    if (tab === 'poems') {
      setActiveApp('poems');
      if (window.history && window.history.pushState) {
        window.history.pushState({}, document.title, '/poems');
      }
    } else if (tab === 'graph') {
      setActiveApp('graph');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, '#graph');
      }
    } else if (tab === 'explorer') {
      setActiveApp('explorer');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, '#explorer');
      }
    } else {
      setActiveApp('vocab');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, `#${tab}`);
      }
    }
  };

  const handleNavigateApp = (targetApp) => {
    if (targetApp === 'poems') {
      handleNavigateTab('poems');
      return;
    }
    if (targetApp === 'math' || targetApp === 'reading') {
      // Disabled module: redirect immediately to Kiwi Vocabulary study deck
      handleNavigateTab('study');
      return;
    }
    if (targetApp === 'graph') {
      handleNavigateTab('graph');
      return;
    }
    if (targetApp === 'explorer') {
      handleNavigateTab('explorer');
      return;
    }
    if (targetApp === 'vocab' || targetApp === 'study') {
      handleNavigateTab('study');
      return;
    }
    if (targetApp === 'progress') {
      handleNavigateTab(targetApp);
      return;
    }
    setActiveApp(targetApp);
  };

  // Auth Handlers
  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    setIsGuestMode(false);
    setIsAuthModalOpen(false);
    setVerifyToken(null);
    setVerifySessionId(null);

    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname.replace(/\/auth\/verify\/?/, '') || '/';
      window.history.replaceState({}, document.title, cleanUrl);
    }

    try {
      const userDeck = await fetchWordSession({ count: 15 });
      if (userDeck && userDeck.length > 0) {
        setPreloadedDeck(userDeck);
        setCachedUserDeck(userData.id, userDeck);
      }
      const updatedStats = await fetchDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to refresh data post-login:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setUser(null);
      setIsGuestMode(true);
      try {
        const dailyDeck = await fetchDailyDeck(todayDateStr);
        if (dailyDeck && dailyDeck.length > 0) {
          setPreloadedDeck(dailyDeck);
        }
        const resetStats = await fetchDashboardStats();
        setStats(resetStats);
      } catch (err) {
        console.error('Failed to refresh stats post-logout:', err);
      }
    }
  };

  const handleDismissVerify = () => {
    setVerifyToken(null);
    setVerifySessionId(null);
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname.replace(/\/auth\/verify\/?/, '') || '/';
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

  // Dedicated Cinematic Poetry Engine Route (/poems)
  if (activeApp === 'poems') {
    return (
      <div className="min-h-screen bg-black flex flex-col font-sans">
        <CelestialTrajectoryRibbon />
        <CelestialFlightLogModal />
        <div className="flex-1 flex flex-col">
          <PoemsView
            onNavigateHome={() => handleNavigateApp('vocab')}
            initialPoemId={initialPoemId}
            poemRestoreTarget={poemRestoreTarget}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF8] bg-grid-kiwi text-[#111410] flex flex-col font-sans selection:bg-[#7BB33B] selection:text-white">
      {/* Shared Suite Header featuring Kiwi Vocabulary and Disabled Switcher Badges */}
      <Navbar
        activeApp={activeApp === 'vocab' && activeTab === 'progress' ? 'platform' : activeApp}
        setActiveApp={handleNavigateApp}
        stats={stats}
        sessionSeconds={sessionSeconds}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isAdminMode={effectiveAdminMode}
        onToggleAdminMode={isStaffUser ? handleToggleAdminMode : null}
        isGuestMode={isGuestMode && !user}
      />

      {/* Celestial Trajectory & Orbital Telemetry Navigation Bar */}
      <CelestialTrajectoryRibbon />

      {/* Editorial / Admin Review Mode Status Toolbar (Visible only when staff user enables it) */}
      <AdminReviewBar
        isAdminMode={effectiveAdminMode}
        onToggleAdminMode={isStaffUser ? handleToggleAdminMode : null}
        words={words}
        roots={roots}
        onUpdateWordReview={handleUpdateWordReview}
        onUpdateWord={handleUpdateWord}
      />

      {/* Error notification banner if API is unreachable */}
      {error && (
        <div className="bg-[#FDF2F2] border-b-2 border-[#111410] text-[#991B1B] px-4 py-2.5 text-xs font-mono font-bold uppercase flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#991B1B]" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadAllData}
            className="flex items-center space-x-1 px-3 py-1 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-black"
          >
            <RefreshCw className="w-3 h-3" />
            <span>RETRY</span>
          </button>
        </div>
      )}

      {/* Verification Route Card Handler (/auth/verify) */}
      {verifyToken && (
        <AuthVerifyCard
          token={verifyToken}
          sessionId={verifySessionId}
          onSuccess={handleAuthSuccess}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onDismiss={handleDismissVerify}
        />
      )}

      {/* Magic Link Sign In / Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Main Workspace: Mutually Exclusive Full Views */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#111410] border-t-[#7BB33B] animate-spin" />
            <p className="text-xs text-[#111410] font-mono font-bold uppercase tracking-wider">
              LOADING KIWI VOCABULARY...
            </p>
          </div>
        ) : activeApp === 'platform' ? (
          <DashboardView
            stats={stats}
            onSelectRoot={handleSelectRootForPractice}
            onNavigateMode={() => handleNavigateTab('study')}
          />
        ) : (
          <VocabView
            words={words}
            roots={roots}
            stats={stats}
            initialRootId={selectedRootId}
            activeTab={activeTab}
            onTabChange={handleNavigateTab}
            onAttemptLogged={handleAttemptLogged}
            onNavigateDashboard={() => setActiveApp('platform')}
            isAdminMode={effectiveAdminMode}
            onUpdateWordReview={handleUpdateWordReview}
            onUpdateWord={handleUpdateWord}
            externalMorphemeView={externalMorphemeView}
            onClearExternalMorphemeView={() => setExternalMorphemeView(null)}
            trajectoryRestoreTarget={trajectoryRestoreTarget}
            initialPracticeSetup={practiceSetupTarget}
            onClearInitialPracticeSetup={() => setPracticeSetupTarget(null)}
            navResetNonce={vocabNavNonce}
            preloadedDeck={preloadedDeck}
            isGuestMode={isGuestMode && !user}
            dailyDateFormatted={todayFormatted}
            initialGuestSession={guestSession}
            onSaveGuestSession={(data) => saveGuestSession(todayDateStr, data)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Celestial Flight Log & Cartography Modal */}
      <CelestialFlightLogModal />

      {/* Clean Editorial Footer */}
      <footer className="border-t border-stone-200 bg-white/80 py-8 text-center text-xs font-sans text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-bold tracking-tight text-stone-800">
            Kiwi Vocabulary Studio
          </div>
          <div className="text-stone-500">
            Latin & Greek Morphemes · Test Preparation Lexicon
          </div>
        </div>
      </footer>
    </div>
  );
}
