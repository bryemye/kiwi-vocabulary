import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Film,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ScrollText,
  Terminal,
  Layers,
  Wind,
  Volume2,
  VolumeX,
  Plus,
  X,
  Check,
  Eye,
  EyeOff,
  Type,
  Palette,
  ArrowLeft
} from 'lucide-react';
import {
  SAMPLE_POEMS,
  CREDIT_STYLES,
  BACKGROUND_PRESETS,
  FONT_PAIRINGS
} from '../data/poemsData';

export default function PoemsView({ onNavigateHome }) {
  // Active Poem & Custom Poems State
  const [poemsList, setPoemsList] = useState(SAMPLE_POEMS);
  const [activePoemId, setActivePoemId] = useState(SAMPLE_POEMS[0].id);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customPoet, setCustomPoet] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [customText, setCustomText] = useState('');

  const currentPoem = poemsList.find((p) => p.id === activePoemId) || poemsList[0];

  // Cinematic Style & Aesthetics State
  const [activeStyleId, setActiveStyleId] = useState(currentPoem.recommendedStyle || 'dissolve');
  const [activeBgId, setActiveBgId] = useState(currentPoem.recommendedBg || 'forest');
  const [activeFontId, setActiveFontId] = useState('cinematic-serif');
  const [showGrain, setShowGrain] = useState(true);
  const [showLetterbox, setShowLetterbox] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Playback & Stanza State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStanzaIndex, setCurrentStanzaIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 100%
  const [isControlsHidden, setIsControlsHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileConsoleTab, setMobileConsoleTab] = useState('poem'); // 'poem' | 'style' | 'aesthetic'
  const [swipeToast, setSwipeToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Touch gesture tracking for mobile swipe & tap
  const touchStartRef = useRef(null);

  // Cinema viewport ref
  const cinemaContainerRef = useRef(null);
  const rollContainerRef = useRef(null);

  // Ambient Sound Engine (Web Audio API - completely offline / zero external asset dependency)
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);

  const showSwipeFeedback = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setSwipeToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setSwipeToast(null);
    }, 1200);
  }, []);

  // When poem changes, align defaults
  const handleSelectPoem = (poemId) => {
    const selected = poemsList.find((p) => p.id === poemId);
    if (selected) {
      setActivePoemId(selected.id);
      setCurrentStanzaIndex(0);
      setPlaybackProgress(0);
      setIsPlaying(true);
      if (selected.recommendedStyle) setActiveStyleId(selected.recommendedStyle);
      if (selected.recommendedBg) setActiveBgId(selected.recommendedBg);
    }
  };

  // Keyboard Shortcuts: Space for Play/Pause, F for Fullscreen, Arrow keys for stanzas
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in textarea or input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextStanza();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStanza();
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        setIsControlsHidden((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPoem]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!cinemaContainerRef.current) return;
    if (!document.fullscreenElement) {
      cinemaContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Web Audio Warm Ambient Drone Synth (Cinema room presence)
  useEffect(() => {
    if (!isAudioEnabled) {
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(0, audioContextRef.current.currentTime, 0.4);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 2);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Low warm binaural oscillators (55Hz / 110Hz warm cinematic drone)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.5, ctx.currentTime); // Slight detune for warm chorus

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(masterGain);

      osc1.start();
      osc2.start();

      return () => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          filter.disconnect();
          masterGain.disconnect();
        } catch (_) {}
      };
    } catch (err) {
      console.warn('Web Audio Ambient engine notice:', err);
    }
  }, [isAudioEnabled]);

  // Stanza Playback Engine (for Dissolve, Noir, Kinetic, Drift modes)
  useEffect(() => {
    if (!isPlaying || activeStyleId === 'roll') return;

    // Calculate duration per stanza based on lines count and speed multiplier
    const stanzaLines = currentPoem.stanzas[currentStanzaIndex]?.length || 4;
    const baseDuration = (stanzaLines * 2.2 + 2.5) * 1000;
    const activeDuration = baseDuration / speedMultiplier;

    const interval = setTimeout(() => {
      if (currentStanzaIndex < currentPoem.stanzas.length - 1) {
        setCurrentStanzaIndex((prev) => prev + 1);
        setPlaybackProgress(((currentStanzaIndex + 1) / currentPoem.stanzas.length) * 100);
      } else {
        // Loop back to start or pause at end
        setCurrentStanzaIndex(0);
        setPlaybackProgress(0);
      }
    }, activeDuration);

    return () => clearTimeout(interval);
  }, [isPlaying, currentStanzaIndex, currentPoem, activeStyleId, speedMultiplier]);

  // Continuous Film Roll Animation Engine (for 'roll' mode)
  useEffect(() => {
    if (activeStyleId !== 'roll') return;

    let animFrameId;
    let lastTime = performance.now();

    const step = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setPlaybackProgress((prev) => {
          // Speed: ~ 2.5% per second at 1x speed
          const next = prev + (2.2 * speedMultiplier * dt);
          if (next >= 100) {
            return 0; // loops roll
          }
          return next;
        });
      }
      animFrameId = requestAnimationFrame(step);
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, activeStyleId, speedMultiplier]);

  const handleNextStanza = () => {
    if (currentStanzaIndex < currentPoem.stanzas.length - 1) {
      setCurrentStanzaIndex((p) => p + 1);
      setPlaybackProgress(((currentStanzaIndex + 1) / currentPoem.stanzas.length) * 100);
    }
  };

  const handlePrevStanza = () => {
    if (currentStanzaIndex > 0) {
      setCurrentStanzaIndex((p) => p - 1);
      setPlaybackProgress(((currentStanzaIndex - 1) / currentPoem.stanzas.length) * 100);
    }
  };

  const handleResetPlayback = () => {
    setCurrentStanzaIndex(0);
    setPlaybackProgress(0);
    setIsPlaying(true);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Horizontal swipe gesture (Next / Prev Stanza)
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3 && dt < 600) {
      if (dx < 0) {
        if (activeStyleId !== 'roll') {
          handleNextStanza();
          showSwipeFeedback('NEXT STANZA →');
        }
      } else {
        if (activeStyleId !== 'roll') {
          handlePrevStanza();
          showSwipeFeedback('← PREV STANZA');
        }
      }
      return;
    }

    // Fast tap (no drag) -> toggle play / pause
    if (Math.hypot(dx, dy) < 15 && dt < 300) {
      const target = e.target;
      if (!target.closest('button, input, select, textarea, a')) {
        setIsPlaying((p) => {
          const next = !p;
          showSwipeFeedback(next ? '▶ RESUMED' : '⏸ PAUSED');
          return next;
        });
      }
    }
  };

  // Add Custom Poem Submission
  const handleSaveCustomPoem = (e) => {
    e.preventDefault();
    if (!customTitle.trim() || !customText.trim()) return;

    // Split text by double line breaks for stanzas, and single line breaks for lines
    const rawStanzas = customText
      .split(/\n\s*\n/)
      .map((block) => block.split('\n').map((l) => l.trim()).filter(Boolean))
      .filter((block) => block.length > 0);

    const newPoem = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      poet: customPoet.trim() || 'Anonymous',
      year: customYear.trim() || new Date().getFullYear().toString(),
      vibe: 'Author Original',
      recommendedStyle: activeStyleId,
      recommendedBg: activeBgId,
      stanzas: rawStanzas.length > 0 ? rawStanzas : [[customText.trim()]]
    };

    setPoemsList([newPoem, ...poemsList]);
    setActivePoemId(newPoem.id);
    setCurrentStanzaIndex(0);
    setPlaybackProgress(0);
    setIsCustomModalOpen(false);
    setCustomTitle('');
    setCustomPoet('');
    setCustomYear('');
    setCustomText('');
  };

  // Get active background styling
  const currentBg = BACKGROUND_PRESETS.find((b) => b.id === activeBgId) || BACKGROUND_PRESETS[0];
  const activeFont = FONT_PAIRINGS.find((f) => f.id === activeFontId) || FONT_PAIRINGS[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0D0A] text-[#FAFBF8] select-none font-sans overflow-x-hidden">
      {/* 1. Header Toolbar (Kiwi Swiss-Neo-Brutalist Frame) */}
      <header className="z-30 bg-[#111410] border-b-2 border-[#2F441E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 px-3 py-1.5 bg-[#FAFBF8] hover:bg-[#EDF5E5] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#7BB33B] font-mono text-xs font-black uppercase transition-all"
            title="Return to Kiwi Platform"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>KIWI HOME</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7BB33B] animate-pulse" />
            <h1 className="font-mono text-xs sm:text-sm font-black tracking-wider uppercase text-white">
              KIWI CINEMA <span className="text-[#7BB33B]">/</span> POEMS
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-[#2F441E] text-[#84C341] border border-[#7BB33B]/40 text-[10px] font-mono font-bold uppercase tracking-widest">
              CREDITS PROTOTYPE
            </span>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setIsAudioEnabled((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-bold border transition-colors ${
              isAudioEnabled
                ? 'bg-[#7BB33B] text-[#111410] border-[#84C341]'
                : 'bg-[#1C241B] text-[#A1B898] border-[#2F441E] hover:text-white'
            }`}
            title="Toggle Cinema Ambient Drone (Synthesized)"
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isAudioEnabled ? 'AMBIENCE ON' : 'AMBIENCE OFF'}</span>
          </button>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-[#84C341] hover:bg-[#7BB33B] text-[#111410] border border-[#111410] shadow-[2px_2px_0px_0px_#FAFBF8] text-xs font-mono font-black uppercase transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW POEM</span>
          </button>
        </div>
      </header>

      {/* 2. Main Cinematic Theater Viewport */}
      <div
        ref={cinemaContainerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden bg-black transition-all touch-manipulation select-none ${
          isFullscreen ? 'h-screen w-screen' : 'min-h-[460px] sm:min-h-[640px] max-h-[85vh] sm:max-h-[820px] w-full'
        }`}
      >
        {/* Dynamic Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {currentBg.type === 'abstract' ? (
            <div
              className="absolute inset-[-20%] animate-aurora opacity-90 transition-all duration-1000"
              style={{
                background: currentBg.gradient,
                backgroundColor: currentBg.baseColor
              }}
            />
          ) : (
            <div className="absolute inset-[-10%] overflow-hidden">
              <img
                src={currentBg.url}
                alt={currentBg.name}
                className="w-full h-full object-cover animate-kenburns filter brightness-60 contrast-110 saturate-90 transition-all duration-1000"
                style={{
                  background: currentBg.fallbackGradient
                }}
              />
            </div>
          )}

          {/* Contrast Scrim Vignette (Guarantees poetry legibility over any photo/gradient) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(10, 13, 10, 0.45) 0%, rgba(10, 13, 10, 0.85) 75%, rgba(0, 0, 0, 0.98) 100%)'
            }}
          />

          {/* 35mm Procedural Film Grain Overlay */}
          {showGrain && (
            <div
              className="absolute inset-[-50%] pointer-events-none opacity-25 mix-blend-screen animate-grain"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundSize: '160px 160px'
              }}
            />
          )}

          {/* CinemaScope Letterbox Bars */}
          {showLetterbox && (
            <>
              <div className="absolute top-0 left-0 right-0 h-6 sm:h-14 bg-black border-b border-white/5 z-20 pointer-events-none transition-all" />
              <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-14 bg-black border-t border-white/5 z-20 pointer-events-none transition-all" />
            </>
          )}
        </div>

        {/* Floating Minimal Controls Bar in Theater Mode (Top Left & Right Overlays) */}
        <div className="absolute top-8 sm:top-18 left-3 sm:left-6 z-20 flex items-center space-x-2 text-xs font-mono text-[#FAFBF8]/70 pointer-events-auto">
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 uppercase tracking-widest text-[10px]">
            {activeStyleId.toUpperCase()} STYLE
          </span>
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 uppercase tracking-widest text-[10px] hidden sm:inline-block">
            {currentBg.name}
          </span>
        </div>

        <div className="absolute top-8 sm:top-18 right-3 sm:right-6 z-20 flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={() => setIsControlsHidden((prev) => !prev)}
            className="p-1.5 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 backdrop-blur-md text-xs font-mono flex items-center space-x-1.5 transition-all"
            title={isControlsHidden ? 'Show Director Console (H)' : 'Hide Console for Pure Cinema (H)'}
          >
            {isControlsHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-bold hidden sm:inline">
              {isControlsHidden ? 'DIRECTOR CONSOLE' : 'CLEAN CINEMA'}
            </span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 backdrop-blur-md transition-all"
            title="Toggle Theater Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mobile Gesture Toast Feedback */}
        {swipeToast && (
          <div className="absolute top-14 sm:top-24 z-30 pointer-events-none px-3.5 py-1.5 bg-[#7BB33B] text-[#111410] font-mono font-black text-xs uppercase tracking-wider border border-[#111410] shadow-[3px_3px_0px_0px_#111410] animate-bounce">
            {swipeToast}
          </div>
        )}

        {/* 3. Typography & Movie Credit Renderer (The 5 Styles) */}
        <div className="relative z-10 w-full max-w-4xl px-6 sm:px-12 flex-1 flex flex-col justify-center items-center text-center">

          {/* STYLE 1: A24 Dissolve (Stanza by Stanza Cards) */}
          {activeStyleId === 'dissolve' && (
            <div
              key={`${activePoemId}-${currentStanzaIndex}`}
              className={`flex flex-col items-center justify-center space-y-6 transition-all duration-1000 ease-out animate-fade-in max-w-2xl ${activeFont.fontClass}`}
            >
              <div className="space-y-1 opacity-60 font-mono text-[11px] tracking-[0.3em] uppercase text-[#84C341]">
                STANZA {String(currentStanzaIndex + 1).padStart(2, '0')} // {String(currentPoem.stanzas.length).padStart(2, '0')}
              </div>

              <div className="space-y-3 sm:space-y-4">
                {currentPoem.stanzas[currentStanzaIndex]?.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed sm:leading-snug tracking-wide font-light text-[#FAFBF8] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                    style={{
                      transitionDelay: `${idx * 150}ms`
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>

              <div className="pt-6 flex flex-col items-center space-y-1 opacity-70">
                <span className="w-8 h-[1px] bg-gradient-to-r from-transparent via-[#84C341] to-transparent" />
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#C29B78]">
                  {currentPoem.title} — {currentPoem.poet}
                </p>
              </div>
            </div>
          )}

          {/* STYLE 2: Classic Film Roll (Continuous Crawl) */}
          {activeStyleId === 'roll' && (
            <div className="relative w-full h-[480px] sm:h-[560px] overflow-hidden mask-feather-vertical flex justify-center">
              <div
                ref={rollContainerRef}
                className={`w-full max-w-2xl py-24 flex flex-col items-center text-center space-y-16 transition-transform ease-linear ${activeFont.fontClass}`}
                style={{
                  transform: `translateY(${300 - playbackProgress * 9.5}px)`
                }}
              >
                {/* Roll Opening Header */}
                <div className="space-y-3">
                  <span className="font-mono text-xs tracking-[0.35em] text-[#84C341] uppercase">
                    A LITERARY FILM PRESENTATION
                  </span>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    {currentPoem.title}
                  </h2>
                  <p className="font-mono text-xs sm:text-sm tracking-[0.25em] uppercase text-[#EFE8DF]/80">
                    VERSES BY {currentPoem.poet} ({currentPoem.year})
                  </p>
                  <div className="pt-2 flex justify-center">
                    <span className="text-sm tracking-widest text-[#7BB33B]">✦ ✦ ✦</span>
                  </div>
                </div>

                {/* Stanzas in Roll */}
                {currentPoem.stanzas.map((stanza, sIdx) => (
                  <div key={sIdx} className="space-y-3 max-w-xl">
                    <div className="font-mono text-[10px] text-[#A1B898] uppercase tracking-widest opacity-60">
                      — {sIdx + 1} —
                    </div>
                    {stanza.map((line, lIdx) => (
                      <p
                        key={lIdx}
                        className="text-lg sm:text-2xl leading-relaxed tracking-normal text-[#FAFBF8] drop-shadow-md font-medium"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ))}

                {/* Roll Conclusion Card */}
                <div className="pt-16 pb-32 space-y-3">
                  <div className="text-[#84C341] text-xs font-mono tracking-[0.4em] uppercase">
                    KIWI MOTION PICTURES
                  </div>
                  <div className="text-2xl font-serif italic text-[#C29B78]">
                    Fin.
                  </div>
                  <div className="font-mono text-[10px] text-white/50 tracking-widest uppercase">
                    DIRECTED FOR THE MIND’S EYE
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STYLE 3: Noir Cold Open (Monospaced Tele-type / Cut-in) */}
          {activeStyleId === 'noir' && (
            <div
              key={`${activePoemId}-${currentStanzaIndex}`}
              className="w-full max-w-2xl bg-black/75 border-2 border-[#2F441E] p-6 sm:p-10 shadow-[8px_8px_0px_0px_#111410] font-mono text-left animate-fade-in relative"
            >
              {/* Clapper metadata bar */}
              <div className="flex items-center justify-between border-b border-[#2F441E] pb-3 mb-6 text-xs text-[#84C341] font-bold tracking-widest uppercase">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-[#84C341] inline-block" />
                  <span>SCENE {String(currentStanzaIndex + 1).padStart(2, '0')} // ROLL 04</span>
                </div>
                <div className="text-[#A1B898] text-[11px]">
                  REC: {currentPoem.year || '1940s'}
                </div>
              </div>

              {/* Title Header */}
              <div className="mb-6">
                <h3 className="text-sm text-[#EFE8DF] font-bold uppercase tracking-wider">
                  &gt; {currentPoem.title}
                </h3>
                <p className="text-xs text-[#A1B898] tracking-widest uppercase">
                  AUTHOR: {currentPoem.poet}
                </p>
              </div>

              {/* Monospace Stanza Lines */}
              <div className="space-y-3 text-base sm:text-xl text-[#FAFBF8] font-bold">
                {currentPoem.stanzas[currentStanzaIndex]?.map((line, idx) => (
                  <p key={idx} className="tracking-wide">
                    {line}
                  </p>
                ))}
              </div>

              {/* Blinking Cursor Bar */}
              <div className="mt-8 pt-4 border-t border-[#2F441E] flex items-center justify-between text-xs text-[#84C341]">
                <div className="flex items-center space-x-2">
                  <span className="animate-pulse">_</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#FAFBF8]/60">
                    STANZA {currentStanzaIndex + 1} OF {currentPoem.stanzas.length}
                  </span>
                </div>
                <span className="text-[10px] tracking-widest text-[#FAFBF8]/40">
                  PRESS SPACE TO HALT
                </span>
              </div>
            </div>
          )}

          {/* STYLE 4: Saul Bass Kinetic Graphic */}
          {activeStyleId === 'kinetic' && (
            <div
              key={`${activePoemId}-${currentStanzaIndex}`}
              className="w-full max-w-2xl text-left font-sans animate-fade-in relative"
            >
              {/* Graphic Structural Axis Bars */}
              <div className="flex items-center space-x-3 mb-4">
                <span className="w-12 h-1.5 bg-[#7BB33B]" />
                <span className="font-mono text-xs font-black tracking-[0.3em] uppercase text-[#84C341]">
                  ACT {currentStanzaIndex + 1}
                </span>
                <span className="flex-1 h-[2px] bg-white/20" />
              </div>

              <div className="border-l-4 border-[#7BB33B] pl-6 sm:pl-8 py-2 space-y-4">
                {currentPoem.stanzas[currentStanzaIndex]?.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-[#FAFBF8] drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
                  >
                    {line}
                  </p>
                ))}
              </div>

              <div className="mt-6 pl-8 flex items-center space-x-4">
                <div className="px-3 py-1 bg-[#7BB33B] text-[#111410] font-mono font-black text-xs uppercase">
                  {currentPoem.poet}
                </div>
                <div className="font-mono text-xs text-[#FAFBF8]/60 uppercase tracking-widest">
                  {currentPoem.title}
                </div>
              </div>
            </div>
          )}

          {/* STYLE 5: Ambient Drift */}
          {activeStyleId === 'drift' && (
            <div
              key={`${activePoemId}-${currentStanzaIndex}`}
              className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 animate-fade-in"
            >
              <div className="font-serif italic text-sm tracking-widest text-[#C29B78] opacity-80">
                ~ {currentPoem.title} ~
              </div>

              <div className="space-y-4 sm:space-y-5">
                {currentPoem.stanzas[currentStanzaIndex]?.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-xl sm:text-2xl md:text-3xl font-serif font-normal italic tracking-wide text-[#FAFBF8] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]"
                  >
                    {line}
                  </p>
                ))}
              </div>

              <div className="pt-4 font-mono text-[11px] tracking-[0.25em] uppercase text-[#84C341] opacity-75">
                {currentPoem.poet} · {currentStanzaIndex + 1}/{currentPoem.stanzas.length}
              </div>
            </div>
          )}

        </div>

        {/* Floating Quick Playback Pill Controls (Visible inside Theater Viewport) */}
        {!isControlsHidden && (
          <div className="absolute bottom-3 sm:bottom-8 z-30 flex items-center space-x-1.5 sm:space-x-3 bg-black/80 backdrop-blur-md border border-white/20 px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xl">
            {activeStyleId !== 'roll' && (
              <button
                onClick={handlePrevStanza}
                disabled={currentStanzaIndex === 0}
                className="p-1.5 sm:p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                title="Previous Stanza"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="p-2 sm:p-2.5 bg-[#7BB33B] hover:bg-[#84C341] text-[#111410] font-black transition-all"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {activeStyleId !== 'roll' && (
              <button
                onClick={handleNextStanza}
                disabled={currentStanzaIndex === currentPoem.stanzas.length - 1}
                className="p-1.5 sm:p-2 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                title="Next Stanza"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="h-4 w-[1px] bg-white/20 mx-0.5 sm:mx-1" />

            <button
              onClick={handleResetPlayback}
              className="p-1.5 sm:p-2 text-white/70 hover:text-white transition-colors"
              title="Reset to Beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed Multiplier Pill */}
            <div className="flex items-center space-x-0.5 sm:space-x-1 pl-0.5 sm:pl-1">
              {[0.5, 1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                    speedMultiplier === spd
                      ? 'bg-[#FAFBF8] text-[#111410]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Director's Console (Neo-Brutalist Swiss Control Deck) */}
      {!isControlsHidden && (
        <section className="bg-[#111410] border-t-2 border-[#2F441E] p-4 sm:p-6 text-[#FAFBF8]">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Control Bar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2F441E] pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#7BB33B]" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-white">
                  DIRECTOR'S CONTROL CONSOLE
                </h2>
                <span className="text-xs text-[#A1B898] font-mono hidden sm:inline">
                  • Custom Movie Title & Credit Styling
                </span>
              </div>

              {/* Progress Scrubber */}
              <div className="w-full sm:w-72 flex items-center space-x-3">
                <span className="text-[10px] font-mono uppercase text-[#A1B898]">TIMELINE</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={playbackProgress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPlaybackProgress(val);
                    if (activeStyleId !== 'roll') {
                      const newStanza = Math.min(
                        Math.floor((val / 100) * currentPoem.stanzas.length),
                        currentPoem.stanzas.length - 1
                      );
                      setCurrentStanzaIndex(newStanza);
                    }
                  }}
                  className="flex-1 accent-[#7BB33B] h-1.5 bg-[#2F441E] cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-[#84C341] w-8 text-right">
                  {Math.round(playbackProgress)}%
                </span>
              </div>
            </div>

            {/* Mobile Segmented Console Tabs */}
            <div className="md:hidden flex border-2 border-[#2F441E] bg-[#1C241B] p-1 font-mono text-xs uppercase font-black">
              <button
                type="button"
                onClick={() => setMobileConsoleTab('poem')}
                className={`flex-1 py-1.5 text-center transition ${
                  mobileConsoleTab === 'poem' ? 'bg-[#7BB33B] text-[#111410] font-black' : 'text-white/70'
                }`}
              >
                1. Poem
              </button>
              <button
                type="button"
                onClick={() => setMobileConsoleTab('style')}
                className={`flex-1 py-1.5 text-center transition ${
                  mobileConsoleTab === 'style' ? 'bg-[#7BB33B] text-[#111410] font-black' : 'text-white/70'
                }`}
              >
                2. Style
              </button>
              <button
                type="button"
                onClick={() => setMobileConsoleTab('aesthetic')}
                className={`flex-1 py-1.5 text-center transition ${
                  mobileConsoleTab === 'aesthetic' ? 'bg-[#7BB33B] text-[#111410] font-black' : 'text-white/70'
                }`}
              >
                3. Look
              </button>
            </div>

            {/* 3 Main Configuration Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Column 1: Poem Selector */}
              <div className={`space-y-3 ${mobileConsoleTab === 'poem' ? 'block' : 'hidden md:block'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#84C341] uppercase tracking-wider flex items-center space-x-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>SELECT POEM</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#A1B898]">
                    {poemsList.length} AVAILABLE
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {poemsList.map((poem) => {
                    const isSelected = poem.id === activePoemId;
                    return (
                      <button
                        key={poem.id}
                        onClick={() => handleSelectPoem(poem.id)}
                        className={`w-full text-left px-3 py-2 border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#2F441E] border-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#7BB33B]'
                            : 'bg-[#1C241B] border-[#2F441E] text-[#FAFBF8]/80 hover:border-[#7BB33B]/50'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{poem.title}</div>
                          <div className="text-[10px] text-[#A1B898] font-mono">
                            {poem.poet} ({poem.year})
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#84C341]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Movie Credit Style Presets */}
              <div className={`space-y-3 ${mobileConsoleTab === 'style' ? 'block' : 'hidden md:block'}`}>
                <span className="font-mono text-xs font-bold text-[#84C341] uppercase tracking-wider flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  <span>CREDIT STYLE PRESET</span>
                </span>

                <div className="grid grid-cols-1 gap-2">
                  {CREDIT_STYLES.map((style) => {
                    const isSelected = style.id === activeStyleId;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setActiveStyleId(style.id)}
                        className={`text-left px-3 py-2 border-2 transition-all flex items-start space-x-2.5 ${
                          isSelected
                            ? 'bg-[#2F441E] border-[#7BB33B] text-white shadow-[2px_2px_0px_0px_#7BB33B]'
                            : 'bg-[#1C241B] border-[#2F441E] text-[#FAFBF8]/80 hover:border-[#7BB33B]/50'
                        }`}
                      >
                        <div className="p-1 bg-[#111410] border border-[#7BB33B]/40 mt-0.5">
                          {style.id === 'roll' && <ScrollText className="w-3.5 h-3.5 text-[#84C341]" />}
                          {style.id === 'dissolve' && <Sparkles className="w-3.5 h-3.5 text-[#84C341]" />}
                          {style.id === 'noir' && <Terminal className="w-3.5 h-3.5 text-[#84C341]" />}
                          {style.id === 'kinetic' && <Layers className="w-3.5 h-3.5 text-[#84C341]" />}
                          {style.id === 'drift' && <Wind className="w-3.5 h-3.5 text-[#84C341]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs flex items-center justify-between">
                            <span>{style.name}</span>
                            {isSelected && <span className="text-[10px] font-mono text-[#84C341]">ACTIVE</span>}
                          </div>
                          <div className="text-[10px] text-[#A1B898] truncate">
                            {style.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 3: Background & Cinema Treatments */}
              <div className={`space-y-4 ${mobileConsoleTab === 'aesthetic' ? 'block' : 'hidden md:block'}`}>
                <span className="font-mono text-xs font-bold text-[#84C341] uppercase tracking-wider flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5" />
                  <span>BACKGROUND & TREATMENT</span>
                </span>

                {/* Background Selector Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_PRESETS.map((bg) => {
                    const isSelected = bg.id === activeBgId;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setActiveBgId(bg.id)}
                        className={`text-left p-2 border transition-all text-xs ${
                          isSelected
                            ? 'bg-[#2F441E] border-[#7BB33B] text-white font-bold'
                            : 'bg-[#1C241B] border-[#2F441E] text-[#FAFBF8]/70 hover:border-[#7BB33B]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{bg.name}</span>
                          <span className="text-[9px] font-mono opacity-60 uppercase">
                            {bg.type}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Typography Choice */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-mono text-[11px] text-[#A1B898] uppercase">TYPOGRAPHY PAIRING</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FONT_PAIRINGS.map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setActiveFontId(font.id)}
                        className={`p-1.5 border text-center text-[10px] font-mono uppercase ${
                          activeFontId === font.id
                            ? 'bg-[#84C341] text-[#111410] border-[#84C341] font-black'
                            : 'bg-[#1C241B] text-[#FAFBF8]/70 border-[#2F441E] hover:text-white'
                        }`}
                      >
                        {font.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Film Texture Toggles */}
                <div className="flex items-center space-x-4 pt-1 text-xs font-mono">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGrain}
                      onChange={(e) => setShowGrain(e.target.checked)}
                      className="accent-[#7BB33B] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[#EFE8DF]">35mm Film Grain</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLetterbox}
                      onChange={(e) => setShowLetterbox(e.target.checked)}
                      className="accent-[#7BB33B] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[#EFE8DF]">CinemaScope Bars</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* 5. Custom Poem Authoring Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1C241B] border-2 border-[#7BB33B] shadow-[8px_8px_0px_0px_#111410] w-full max-w-xl max-h-[92dvh] overflow-y-auto text-[#FAFBF8] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2F441E] pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-[#7BB33B]" />
                <h3 className="font-mono text-sm font-black uppercase text-white tracking-wider">
                  DIRECT YOUR OWN POEM
                </h3>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1.5 hover:bg-[#2F441E] text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPoem} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#84C341] uppercase font-bold">Poem Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Midnight Reverie"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#111410] border border-[#2F441E] p-2 text-base sm:text-xs text-white placeholder-white/30 focus:border-[#7BB33B] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#84C341] uppercase font-bold">Poet / Author Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Your Name"
                    value={customPoet}
                    onChange={(e) => setCustomPoet(e.target.value)}
                    className="w-full bg-[#111410] border border-[#2F441E] p-2 text-base sm:text-xs text-white placeholder-white/30 focus:border-[#7BB33B] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#84C341] uppercase font-bold">
                  Poem Verses * (Separate stanzas with double line breaks)
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder={`First line of stanza one\nSecond line of stanza one\n\nFirst line of stanza two\nSecond line of stanza two`}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-[#111410] border border-[#2F441E] p-2.5 text-white placeholder-white/30 focus:border-[#7BB33B] outline-none font-sans text-base sm:text-sm leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 border border-[#2F441E] hover:bg-[#2F441E] uppercase font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-[#111410] border border-[#111410] shadow-[2px_2px_0px_0px_#FAFBF8] font-black uppercase"
                >
                  ACTION / PREVIEW
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
