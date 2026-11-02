import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import VocabView from './components/VocabView';
import AdminReviewBar from './components/AdminReviewBar';
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
  logoutUser
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
    if (hash.includes('graph') || path.includes('graph')) return 'graph';
    if (hash.includes('explorer') || path.includes('explorer')) return 'explorer';
    if (hash.includes('progress') || path.includes('progress')) return 'progress';
    return 'study';
  };

  // App Suite Navigation: 'vocab' is the standalone primary experience
  const [activeTab, setActiveTab] = useState(getTabFromUrl);
  const [activeApp, setActiveApp] = useState(() => {
    const tab = getTabFromUrl();
    return tab === 'graph' ? 'graph' : 'vocab';
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

  // Editorial Reviewer / Admin Mode State
  const [isAdminMode, setIsAdminMode] = useState(getStoredAdminMode);

  const handleToggleAdminMode = useCallback(() => {
    setIsAdminMode((prev) => {
      const next = !prev;
      setStoredAdminMode(next);
      return next;
    });
  }, []);

  // Global Keyboard Shortcut: Ctrl + Shift + E to toggle Reviewer / Admin Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        handleToggleAdminMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleAdminMode]);

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

  // Sync state whenever URL hash or browser history changes
  useEffect(() => {
    const handleLocationChange = () => {
      const tab = getTabFromUrl();
      setActiveTab(tab);
      setActiveApp(tab === 'graph' ? 'graph' : 'vocab');
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
      if (fullPath.includes('math') || fullPath.includes('reading')) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, '#study');
        }
        setActiveApp('vocab');
        setActiveTab('study');
      } else if (fullPath.includes('graph')) {
        setActiveApp('graph');
        setActiveTab('graph');
      } else if (fullPath.includes('explorer')) {
        setActiveApp('vocab');
        setActiveTab('explorer');
      } else if (fullPath.includes('progress')) {
        setActiveApp('vocab');
        setActiveTab('progress');
      }

      const searchParams = new URLSearchParams(window.location.search);
      let tokenInQuery = searchParams.get('token');
      if (!tokenInQuery && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, '?'));
        tokenInQuery = hashParams.get('token');
      }

      if (tokenInQuery) {
        let cleaned = tokenInQuery.trim();
        cleaned = cleaned.replace(/=\r?\n/g, '').replace(/[\r\n\s]/g, '');
        if (cleaned.startsWith('=3D')) cleaned = cleaned.slice(3);
        else if (cleaned.startsWith('3D') && cleaned.includes(':')) cleaned = cleaned.slice(2);
        setVerifyToken(cleaned);
      }
    } catch (e) {
      console.error('Failed to parse URL search params:', e);
    }
  }, []);

  // Fetch current authenticated user session on mount
  useEffect(() => {
    fetchCurrentUser()
      .then((userData) => {
        if (userData) {
          setUser(userData);
        }
      })
      .catch((err) => {
        console.warn('Session verification error:', err);
      });
  }, []);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      // Fetch platform stats and vocabulary data only (Math & Reading endpoints isolated/disabled)
      const [statsData, rootsData, wordsData] = await Promise.all([
        fetchDashboardStats(),
        fetchRoots(),
        fetchWords(),
      ]);

      const wordsWithReviews = mergeReviewsIntoWords(wordsData);
      const rootsWithReviews = mergeReviewsIntoRoots(rootsData);

      setStats(statsData);
      setRoots(rootsWithReviews);
      setWords(wordsWithReviews);
    } catch (err) {
      console.error('Error loading Kiwi Learning data:', err);
      setError('Unable to connect to platform API. Please ensure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
    setSelectedRootId(rootId);
    handleNavigateTab('study');
  };

  // Safe navigation handler enforcing Kiwi Vocabulary views & Root Graph
  const handleNavigateTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'graph') {
      setActiveApp('graph');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, '#graph');
      }
    } else {
      setActiveApp('vocab');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, `#${tab}`);
      }
    }
  };

  const handleNavigateApp = (targetApp) => {
    if (targetApp === 'math' || targetApp === 'reading') {
      // Disabled module: redirect immediately to Kiwi Vocabulary study deck
      handleNavigateTab('study');
      return;
    }
    if (targetApp === 'graph') {
      handleNavigateTab('graph');
      return;
    }
    if (targetApp === 'vocab' || targetApp === 'study') {
      handleNavigateTab('study');
      return;
    }
    if (targetApp === 'explorer' || targetApp === 'progress') {
      handleNavigateTab(targetApp);
      return;
    }
    setActiveApp(targetApp);
  };

  // Auth Handlers
  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    setVerifyToken(null);

    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname.replace(/\/auth\/verify\/?/, '') || '/';
      window.history.replaceState({}, document.title, cleanUrl);
    }

    try {
      const updatedStats = await fetchDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to refresh stats post-login:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setUser(null);
      try {
        const resetStats = await fetchDashboardStats();
        setStats(resetStats);
      } catch (err) {
        console.error('Failed to refresh stats post-logout:', err);
      }
    }
  };

  const handleDismissVerify = () => {
    setVerifyToken(null);
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname.replace(/\/auth\/verify\/?/, '') || '/';
      window.history.replaceState({}, document.title, cleanUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBF8] bg-grid-kiwi text-[#111410] flex flex-col font-sans selection:bg-[#7BB33B] selection:text-white">
      {/* Shared Suite Header featuring Kiwi Vocabulary and Disabled Switcher Badges */}
      <Navbar
        activeApp={activeApp}
        setActiveApp={handleNavigateApp}
        stats={stats}
        sessionSeconds={sessionSeconds}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
      />

      {/* Editorial / Admin Review Mode Status Toolbar */}
      <AdminReviewBar
        isAdminMode={isAdminMode}
        onToggleAdminMode={handleToggleAdminMode}
        words={words}
        roots={roots}
        onUpdateWordReview={handleUpdateWordReview}
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
          onSuccess={handleAuthSuccess}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onDismiss={handleDismissVerify}
        />
      )}

      {/* Magic Link Sign In / Register Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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
            isAdminMode={isAdminMode}
            onUpdateWordReview={handleUpdateWordReview}
          />
        )}
      </main>

      {/* Neo-Brutalist Technical Footer */}
      <footer className="border-t-2 border-[#111410] bg-white py-6 text-center text-xs font-mono uppercase text-[#42281D]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-extrabold tracking-tight">
            KIWI VOCABULARY
          </div>
          <div className="font-bold text-[#62685E]">
            LATIN & GREEK MORPHEMES ·  VOCABULARY MASTERY
          </div>
        </div>
      </footer>
    </div>
  );
}
