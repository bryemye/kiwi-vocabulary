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
      console.error('Error loading SAT prep data:', err);
      setError('Unable to connect to backend API. Please verify the Django server is running on port 8000.');
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

  const handleSelectRootForPractice = (rootId) => {
    setSelectedRootId(rootId);
    setActiveTab('vocab');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        sessionSeconds={sessionSeconds}
      />

      {/* Error notification banner if API is unreachable */}
      {error && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2.5 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadAllData}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 font-semibold"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-sky-500 animate-spin" />
            <p className="text-sm text-slate-400 font-mono">Initializing SAT/ACT Diagnostic Engine...</p>
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AEGIS SAT/ACT Diagnostic Engine · Headless Django 6.0 & React 18
          </div>
          <div className="font-mono text-slate-400">
            Latin & Greek Etymology · Dynamic Math SVGs · Digital SAT Annotation
          </div>
        </div>
      </footer>
    </div>
  );
}
