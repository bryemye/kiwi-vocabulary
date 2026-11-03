import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { verifyMagicLink } from '../services/api';

function cleanToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  let token = rawToken.trim();

  // If user pasted the whole URL (e.g. http://localhost:5173/auth/verify?token=...)
  if (token.includes('token=')) {
    token = token.split('token=')[1].split('&')[0];
  }

  // Remove quoted-printable soft line break artifacts and whitespaces
  token = token.replace(/=\r?\n/g, '').replace(/[\r\n\s]/g, '');

  // Strip quoted-printable =3D artifact
  if (token.startsWith('=3D')) {
    token = token.slice(3);
  } else if (token.startsWith('3D') && token.includes(':')) {
    token = token.slice(2);
  }

  return token;
}

export default function AuthVerifyCard({ token: initialToken, onSuccess, onOpenAuthModal, onDismiss }) {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [isVerifyingManual, setIsVerifyingManual] = useState(false);
  const hasTriggeredRef = useRef(false);

  const runVerification = async (candidateToken) => {
    const cleaned = cleanToken(candidateToken);
    if (!cleaned) {
      setStatus('error');
      setErrorMessage('Verification token is empty or invalid.');
      return;
    }

    try {
      setStatus('verifying');
      setErrorMessage(null);
      const userData = await verifyMagicLink(cleaned);
      setUser(userData);
      setStatus('success');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(userData);
        }
      }, 1000);
    } catch (err) {
      console.error('Magic link verification failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Invalid or expired magic link.');
    } finally {
      setIsVerifyingManual(false);
    }
  };

  useEffect(() => {
    if (!initialToken) {
      setStatus('error');
      setErrorMessage('Missing authentication token in URL.');
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    runVerification(initialToken);
  }, [initialToken]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setIsVerifyingManual(true);
    runVerification(manualInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111410]/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#FAFBF8] border-2 border-[#111410] shadow-[8px_8px_0px_0px_#111410] relative overflow-hidden">
        {/* Top accent bar */}
        <div 
          className={`h-2.5 w-full border-b-2 border-[#111410] ${
            status === 'success' ? 'bg-[#7BB33B]' : status === 'error' ? 'bg-[#DC2626]' : 'bg-[#EAB308]'
          }`} 
        />

        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          {/* Header Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#EDF5E5] border border-[#111410] text-[10px] font-mono font-bold uppercase tracking-wider text-[#2F441E] mb-5">
            <Sparkles className="w-3 h-3 text-[#7BB33B]" />
            <span>KIWI CRYPTOGRAPHIC AUTH</span>
          </div>

          {status === 'verifying' && (
            <div className="space-y-4 flex flex-col items-center py-4">
              <div className="w-14 h-14 border-4 border-[#111410] border-t-[#7BB33B] animate-spin" />
              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#111410]">
                  VERIFYING YOUR LINK...
                </h2>
                <p className="mt-1 text-xs font-mono text-[#62685E] max-w-xs">
                  Validating cryptographic signature, 15-minute expiration, and single-use status.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 flex flex-col items-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-[#7BB33B] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center text-white">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#111410]">
                  AUTHENTICATION SUCCESSFUL
                </h2>
                <p className="mt-1 text-xs font-mono text-[#2F441E]">
                  Welcome back, <strong className="font-bold underline">{user?.email || 'scholar'}</strong>!
                </p>
                <p className="mt-2 text-[11px] font-mono text-[#62685E]">
                  Session established. Redirecting to Kiwi Learning...
                </p>
              </div>
              <button
                onClick={() => onSuccess && onSuccess(user)}
                className="mt-2 flex items-center space-x-2 px-4 py-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] text-xs font-mono font-black uppercase tracking-wider"
              >
                <span>ENTER DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 flex flex-col items-center py-2 animate-in zoom-in-95 duration-200 w-full">
              <div className="w-14 h-14 bg-[#FDF2F2] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center text-[#991B1B]">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#991B1B]">
                  VERIFICATION FAILED
                </h2>
                <div className="mt-2 bg-[#FDF2F2] border-2 border-[#111410] p-3 text-xs font-mono text-[#991B1B] font-bold text-left">
                  {errorMessage}
                </div>
                <p className="mt-2 text-[11px] font-mono text-[#62685E] text-left">
                  Note: If copying from terminal, look for the un-wrapped single-line banner labelled <strong>KIWI MAGIC LOGIN LINK</strong>.
                </p>
              </div>

              {/* Direct Paste Fallback Input */}
              <form onSubmit={handleManualSubmit} className="w-full text-left bg-white border-2 border-[#111410] p-3 shadow-[2px_2px_0px_0px_#111410] space-y-2">
                <label className="block text-[11px] font-mono font-bold uppercase text-[#111410] flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#7BB33B]" />
                  <span>PASTE FULL LINK OR TOKEN:</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Paste link or token here..."
                    className="flex-1 px-2.5 py-1.5 text-base sm:text-xs font-mono bg-[#FAFBF8] border-2 border-[#111410] focus:outline-none focus:border-[#7BB33B]"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingManual || !manualInput.trim()}
                    className="px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-bold uppercase disabled:opacity-50"
                  >
                    {isVerifyingManual ? 'VERIFYING...' : 'RE-VERIFY'}
                  </button>
                </div>
              </form>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={() => {
                    if (onDismiss) onDismiss();
                    if (onOpenAuthModal) onOpenAuthModal();
                  }}
                  className="flex-1 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2 px-3 text-xs font-mono font-bold uppercase transition-all"
                >
                  REQUEST NEW LINK
                </button>
                <button
                  onClick={onDismiss}
                  className="flex-1 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2 px-3 text-xs font-mono font-bold uppercase transition-all"
                >
                  RETURN TO HOME
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
