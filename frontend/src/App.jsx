import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import VocabView from './components/VocabView';
import MathView from './components/MathView';
import ReadingView from './components/ReadingView';
import { 
  fetchDashboardStats, 
  fetchRoots, 
  fetchWords, 
  fetchQuestions, 
  fetchReadingPassages 
} from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [roots, setRoots] = useState([]);
  const [words, setWords] = useState([]);
  const [mathQuestions, setMathQuestions] = useState([]);
  const [readingPassages, setReadingPassages] = useState([]);
  const [selectedRootId, setSelectedRootId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);

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
      const [statsData, rootsData, wordsData, mathData, readingData] = await Promise.all([
        fetchDashboardStats(),
        fetchRoots(),
        fetchWords(),
        fetchQuestions('MATH'),
        fetchReadingPassages(),
      ]);

      setStats(statsData);
      setRoots(rootsData);
      setWords(wordsData);
      setMathQuestions(mathData);
      setReadingPassages(readingData);
    } catch (err) {
      console.error('Error loading Kiwi Learning data:', err);
      setError('Unable to connect to backend API. Please verify the Django server is active on port 8000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh stats whenever an attempt is logged in any study mode
  const handleAttemptLogged = async () => {
    try {
      const updatedStats = await fetchDashboardStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  };

  // Fetch fresh dashboard stats every time user navigates to the dashboard view
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardStats()
        .then((updatedStats) => setStats(updatedStats))
        .catch((err) => console.error('Failed to refresh stats on navigating to dashboard:', err));
    }
  }, [activeTab]);

  const handleSelectRootForPractice = (rootId) => {
    setSelectedRootId(rootId);
    setActiveTab('vocab');
  };

  return (
    <div className="min-h-screen bg-[#FAFBF8] bg-grid-kiwi text-[#111410] flex flex-col font-sans selection:bg-[#7BB33B] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        sessionSeconds={sessionSeconds}
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

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#111410] border-t-[#7BB33B] animate-spin" />
            <p className="text-xs text-[#111410] font-mono font-bold uppercase tracking-wider">
              INITIALIZING KIWI LEARNING GRID...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                onSelectRoot={handleSelectRootForPractice}
                onNavigateMode={setActiveTab}
              />
            )}

            {activeTab === 'vocab' && (
              <VocabView
                words={words}
                roots={roots}
                initialRootId={selectedRootId}
                onAttemptLogged={handleAttemptLogged}
              />
            )}

            {activeTab === 'math' && (
              <MathView
                questions={mathQuestions}
                onAttemptLogged={handleAttemptLogged}
              />
            )}

            {activeTab === 'reading' && (
              <ReadingView
                passages={readingPassages}
                onAttemptLogged={handleAttemptLogged}
              />
            )}
          </>
        )}
      </main>

      {/* Swiss/Neo-Brutalist Technical Footer */}
      <footer className="border-t-2 border-[#111410] bg-white py-6 text-center text-xs font-mono uppercase text-[#42281D]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-extrabold tracking-tight">
            KIWI LEARNING SYSTEM · SWISS-GRID SAT/ACT DIAGNOSTICS · DJANGO & REACT
          </div>
          <div className="font-bold text-[#62685E]">
            ROOT ETYMOLOGY · DRAFTING PLANE · KIWI-LIME ANNOTATION
          </div>
        </div>
      </footer>
    </div>
  );
}
