import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  RefreshCw 
} from 'lucide-react';
import { requestMagicLink } from '../services/api';

export default function AuthModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1 = Email Form, 2 = Check Inbox
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await requestMagicLink(email.trim());
      setStep(2);
    } catch (err) {
      console.error('Magic link request failed:', err);
      setError(err.message || 'Failed to dispatch magic link. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setError(null);
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111410]/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#FAFBF8] border-2 border-[#111410] shadow-[8px_8px_0px_0px_#111410] relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Neo-brutalist top decorative stripe */}
        <div className="bg-[#7BB33B] h-2 w-full border-b-2 border-[#111410]" />

        {/* Modal Header */}
        <div className="p-5 border-b-2 border-[#111410] bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#7BB33B]" />
            </div>
            <div>
              <div className="font-extrabold text-sm font-mono uppercase tracking-tight text-[#111410] flex items-center space-x-1.5">
                <span>PASSWORDLESS ACCESS</span>
                <span className="text-[10px] bg-[#EDF5E5] text-[#2F441E] px-1.5 py-0.2 border border-[#111410] font-bold">
                  MAGIC LINK
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#62685E]">
                {step === 1 ? 'Instant registration & sign in via email' : 'Verification dispatch completed'}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="w-8 h-8 bg-white hover:bg-[#FAFBF8] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center text-[#111410] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-[#FDF2F2] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] p-3 text-xs font-mono text-[#991B1B] flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#991B1B]" />
              <div className="flex-1 font-bold">{error}</div>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Email Input Form */
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <label 
                  htmlFor="auth-email-input"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111410] mb-1.5"
                >
                  Student / Scholar Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#62685E]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@kiwilearning.com"
                    autoFocus
                    required
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] text-base sm:text-sm font-mono text-[#111410] placeholder-[#8F968A] focus:outline-none focus:border-[#7BB33B] focus:shadow-[4px_4px_0px_0px_#7BB33B] transition-all disabled:opacity-50"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-mono text-[#62685E]">
                  No passwords required. If your account is new, we'll create it automatically.
                </p>
              </div>

              {/* Submit Button in Kiwi Green */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center space-x-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] hover:shadow-[4px_4px_0px_0px_#111410] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] py-3 sm:py-2.5 min-h-[46px] px-4 text-xs font-mono font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>DISPATCHING MAGIC LINK...</span>
                  </>
                ) : (
                  <>
                    <span>SEND MAGIC LINK</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Security info pill */}
              <div className="p-3 bg-white border border-[#111410] flex items-center space-x-2 text-[11px] font-mono text-[#42281D]">
                <Sparkles className="w-3.5 h-3.5 text-[#7BB33B] shrink-0" />
                <span>Cryptographically signed with 15-minute single-use expiration.</span>
              </div>
            </form>
          ) : (
            /* STEP 2: "Check your inbox" State */
            <div className="space-y-4">
              <div className="bg-[#EDF5E5] border-2 border-[#111410] shadow-[4px_4px_0px_0px_#111410] p-5 text-center flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-[#7BB33B] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] flex items-center justify-center text-white">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-mono font-black text-sm uppercase tracking-wide text-[#111410]">
                    CHECK YOUR INBOX
                  </h3>
                  <p className="mt-1 text-xs font-mono text-[#2F441E]">
                    We dispatched a secure magic login link to:
                  </p>
                  <p className="mt-1 text-xs font-mono font-bold bg-white border border-[#111410] px-2 py-1 text-[#111410] inline-block">
                    {email}
                  </p>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="bg-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] p-4 space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#111410] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7BB33B]" />
                  <span>INSTRUCTIONS</span>
                </div>
                <ul className="text-[11px] font-mono text-[#42281D] space-y-1.5 list-disc list-inside">
                  <li>Open the email and click the verification link.</li>
                  <li>The link is cryptographically signed and valid for <strong>15 minutes</strong>.</li>
                  <li>Tokens are <strong>single-use</strong> and cannot be replayed.</li>
                </ul>
              </div>

              {/* Terminal development hint */}
              <div className="bg-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] p-3 text-white">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#84C341] mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>LOCAL DEV CONSOLE BACKEND</span>
                </div>
                <p className="text-[11px] font-mono text-[#C4CDBC] leading-relaxed">
                  Django's console email backend is active. The magic login link is printed directly in your terminal console!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSubmitEmail}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-1.5 bg-[#FAFBF8] hover:bg-white text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2 px-3 text-xs font-mono font-bold uppercase transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>RESEND LINK</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-white hover:bg-[#EDF5E5] text-[#2F441E] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2 px-3 text-xs font-mono font-bold uppercase transition-all"
                >
                  USE DIFFERENT EMAIL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
