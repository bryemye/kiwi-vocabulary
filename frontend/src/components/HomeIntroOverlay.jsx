import React from 'react';
import {
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  Calendar,
  CheckCircle2,
  X,
  Compass,
  Layers,
  BookOpen
} from 'lucide-react';

export default function HomeIntroOverlay({
  isOpen,
  onStartAsGuest,
  onOpenSignIn,
  onClose,
  todayFormatted = ''
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#FAFBF8] border-2 sm:border-3 border-[#111410] shadow-[8px_8px_0px_0px_#111410] p-5 sm:p-8">
        
        {/* Close / Dismiss (defaults to Guest) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 bg-white hover:bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <X className="w-4 h-4 text-[#111410]" />
          </button>
        )}

        {/* Brand & Suite Tag */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-[#7BB33B]" />
            <span>KIWI VOCABULARY · SAT & ACT MASTERY</span>
          </span>
        </div>

        {/* Header */}
        <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-[#111410] leading-none mb-2">
          CHOOSE YOUR STUDY PATH
        </h2>
        <p className="text-xs sm:text-sm font-mono text-[#62685E] uppercase mb-6 leading-relaxed">
          Master 1,200+ high-frequency test words through Classical Latin and Greek root deconstruction.
        </p>

        {/* Two High-Contrast Pathway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">

          {/* Option 1: Start as Guest (Daily 15 Challenge) */}
          <div className="bg-white border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-[#EDF5E5] text-[#2F441E] border border-[#111410] text-[10px] font-mono font-black uppercase tracking-wide flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-[#7BB33B]" />
                  <span>DAILY CHALLENGE</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-[#62685E] flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#7BB33B]" />
                  <span>{todayFormatted}</span>
                </span>
              </div>

              <h3 className="text-lg font-black font-sans uppercase text-[#111410] mb-2">
                START AS GUEST
              </h3>

              <ul className="text-xs font-mono text-[#42281D] space-y-2 mb-4 leading-relaxed">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7BB33B] shrink-0 mt-0.5" />
                  <span>Curated 15-word daily morpheme deck</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7BB33B] shrink-0 mt-0.5" />
                  <span>Changes automatically at local midnight</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7BB33B] shrink-0 mt-0.5" />
                  <span>Zero setup: jump right into flashcards</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onStartAsGuest}
              className="w-full py-2.5 px-4 bg-[#7BB33B] hover:bg-[#6FA334] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] active:translate-x-0.5 active:translate-y-0.5 text-xs font-mono font-black uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>PLAY DAILY 15 NOW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Sign In / Register (Personalized Spaced Repetition) */}
          <div className="bg-[#FAFBF8] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-4 sm:p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-transform">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-[#FAFBF8] text-[#42281D] border border-[#111410] text-[10px] font-mono font-black uppercase tracking-wide flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-[#42281D]" />
                  <span>SPACED REPETITION</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-[#62685E] flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-[#42281D]" />
                  <span>SAVED PROGRESS</span>
                </span>
              </div>

              <h3 className="text-lg font-black font-sans uppercase text-[#111410] mb-2">
                SIGN IN / REGISTER
              </h3>

              <ul className="text-xs font-mono text-[#42281D] space-y-2 mb-4 leading-relaxed">
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#42281D] shrink-0 mt-0.5" />
                  <span>Prioritizes words you missed for review</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#42281D] shrink-0 mt-0.5" />
                  <span>Track retention rates & root mastery rings</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#42281D] shrink-0 mt-0.5" />
                  <span>Passwordless email magic link sign-in</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onOpenSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#EDF5E5] text-[#111410] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] active:translate-x-0.5 active:translate-y-0.5 text-xs font-mono font-black uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>SIGN IN WITH MAGIC LINK</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Footer Note */}
        <div className="pt-2 border-t border-[#111410]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#62685E]">
          <span>⚡ You can sign in anytime to save your score and unlock full stats.</span>
          <button
            type="button"
            onClick={onStartAsGuest}
            className="text-[#7BB33B] hover:underline font-bold mt-1 sm:mt-0 cursor-pointer"
          >
            Continue as Guest &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
