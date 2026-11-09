import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  XCircle,
  Monitor,
  Smartphone
} from 'lucide-react';
import { verifyMagicLink } from '../services/api';

function parseTokenAndSid(rawInput, fallbackSid = null) {
  if (!rawInput || typeof rawInput !== 'string') return { token: '', sid: fallbackSid };
  let input = rawInput.trim();
  let sid = fallbackSid;

  // Extract from full URL if pasted
  if (input.includes('sid=')) {
    try {
      const match = input.match(/[?&]sid=([^&]+)/);
      if (match && match[1]) {
        sid = decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }

  if (input.includes('token=')) {
    input = input.split('token=')[1].split('&')[0];
  }

  // Remove quoted-printable soft line break artifacts and whitespaces
  input = input.replace(/=\r?\n/g, '').replace(/[\r\n\s]/g, '');

  // Strip quoted-printable =3D artifact
  if (input.startsWith('=3D')) {
    input = input.slice(3);
  } else if (input.startsWith('3D') && input.includes(':')) {
    input = input.slice(2);
  }

  return { token: input, sid };
}

export default function AuthVerifyCard({ 
  token: initialToken, 
  sessionId: initialSessionId, 
  onSuccess, 
  onOpenAuthModal, 
  onDismiss 
}) {
  // Statuses: 'verifying' | 'confirm_prompt' | 'cross_device_approved' | 'denied' | 'success' | 'error'
  const [status, setStatus] = useState('verifying');
  const [user, setUser] = useState(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [matchCode, setMatchCode] = useState(null);
  const [activeSid, setActiveSid] = useState(initialSessionId || null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const hasTriggeredRef = useRef(false);

  const initVerification = async (candidateToken, candidateSid) => {
    const { token: cleaned, sid } = parseTokenAndSid(candidateToken, candidateSid);
    if (!cleaned) {
      setStatus('error');
      setErrorMessage('Verification token is empty or invalid.');
      return;
    }

    setActiveSid(sid);

    // If cross-device sid is provided, inspect the session first to show the 2-digit confirmation screen
    if (sid) {
      try {
        setStatus('verifying');
        setErrorMessage(null);
        const checkData = await verifyMagicLink(cleaned, sid, 'check');

        if (checkData.status === 'APPROVED') {
          setStatus('cross_device_approved');
          setTargetEmail(checkData.email || '');
          return;
        }

        setTargetEmail(checkData.email || '');
        setMatchCode(checkData.match_code || null);
        setStatus('confirm_prompt');
      } catch (err) {
        console.error('Failed to inspect magic link session:', err);
        // If check failed with expired or used, report error
        setStatus('error');
        setErrorMessage(err.message || 'Invalid or expired magic link.');
      }
    } else {
      // Direct same-device login
      runDirectLogin(cleaned);
    }
  };

  const runDirectLogin = async (cleanedToken) => {
    try {
      setStatus('verifying');
      setErrorMessage(null);
      const userData = await verifyMagicLink(cleanedToken, null, 'verify');
      setUser(userData);
      setStatus('success');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(userData);
        }
      }, 1000);
    } catch (err) {
      console.error('Direct magic link verification failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Invalid or expired magic link.');
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

    initVerification(initialToken, initialSessionId);
  }, [initialToken, initialSessionId]);

  // Handle User Approving from Mobile Phone
  const handleApproveCrossDevice = async () => {
    const { token: cleaned } = parseTokenAndSid(initialToken, activeSid);
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await verifyMagicLink(cleaned, activeSid, 'approve');
      setStatus('cross_device_approved');
    } catch (err) {
      console.error('Failed to approve cross-device sign-in:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to approve sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle User Denying from Mobile Phone
  const handleDenyCrossDevice = async () => {
    const { token: cleaned } = parseTokenAndSid(initialToken, activeSid);
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await verifyMagicLink(cleaned, activeSid, 'deny');
      setStatus('denied');
    } catch (err) {
      console.error('Failed to deny sign-in:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to deny sign-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Also sign in on this phone" option after approving
  const handleAlsoSignInLocally = async () => {
    const { token: cleaned } = parseTokenAndSid(initialToken, activeSid);
    await runDirectLogin(cleaned);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const { token: cleaned, sid } = parseTokenAndSid(manualInput, activeSid);
    initVerification(cleaned, sid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111410]/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#FAFBF8] border-2 border-[#111410] shadow-[8px_8px_0px_0px_#111410] relative overflow-hidden">
        {/* Accent Bar */}
        <div 
          className={`h-2.5 w-full border-b-2 border-[#111410] ${
            status === 'success' || status === 'cross_device_approved'
              ? 'bg-[#7BB33B]' 
              : status === 'error' || status === 'denied'
              ? 'bg-[#DC2626]' 
              : 'bg-[#EAB308]'
          }`} 
        />

        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          {/* Header Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 bg-[#EDF5E5] border border-[#111410] text-[10px] font-mono font-bold uppercase tracking-wider text-[#2F441E] mb-5">
            <Sparkles className="w-3 h-3 text-[#7BB33B]" />
            <span>KIWI CRYPTOGRAPHIC AUTH</span>
          </div>

          {/* 1. VERIFYING SPINNER STATE */}
          {status === 'verifying' && (
            <div className="space-y-4 flex flex-col items-center py-4">
              <div className="w-14 h-14 border-4 border-[#111410] border-t-[#7BB33B] animate-spin" />
              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#111410]">
                  VERIFYING SIGN-IN REQUEST...
                </h2>
                <p className="mt-1 text-xs font-mono text-[#62685E] max-w-xs">
                  Validating cryptographic token and cross-device rendezvous session.
                </p>
              </div>
            </div>
          )}

          {/* 2. MOBILE CONFIRMATION PROMPT WITH 2-DIGIT MATCH CODE */}
          {status === 'confirm_prompt' && (
            <div className="space-y-4 flex flex-col items-center w-full animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-[#EDF5E5] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center text-[#7BB33B]">
                <Monitor className="w-7 h-7 text-[#111410]" />
              </div>

              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#111410]">
                  AUTHORIZE SIGN-IN ON COMPUTER?
                </h2>
                <p className="mt-1 text-xs font-mono text-[#2F441E]">
                  A computer is requesting access for:
                </p>
                <p className="mt-1 text-xs font-mono font-bold bg-white border border-[#111410] px-2.5 py-1 text-[#111410] inline-block">
                  {targetEmail || 'Scholar'}
                </p>
              </div>

              {/* Match Code Card */}
              {matchCode && (
                <div className="w-full bg-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] p-4 text-center space-y-2">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#62685E] flex items-center justify-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7BB33B]" />
                    <span>VERIFICATION MATCH CODE</span>
                  </div>
                  <div className="inline-flex items-center justify-center bg-[#EDF5E5] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] px-6 py-2">
                    <span className="text-3xl font-mono font-black tracking-widest text-[#111410]">
                      {matchCode}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#52594D] max-w-xs mx-auto leading-tight">
                    Verify that this number matches the <strong>2-digit code</strong> shown on your computer screen.
                  </p>
                </div>
              )}

              {/* Action Buttons: Approve vs Deny */}
              <div className="w-full pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleApproveCrossDevice}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] hover:shadow-[4px_4px_0px_0px_#111410] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] py-3 px-4 text-xs font-mono font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AUTHORIZING COMPUTER...</span>
                    </>
                  ) : (
                    <>
                      <span>APPROVE SIGN-IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDenyCrossDevice}
                  disabled={isSubmitting}
                  className="w-full bg-[#FAFBF8] hover:bg-[#FDF2F2] text-[#991B1B] hover:text-[#DC2626] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2 px-3 text-xs font-mono font-bold uppercase transition-all disabled:opacity-50"
                >
                  DENY SIGN-IN
                </button>
              </div>
            </div>
          )}

          {/* 3. CROSS-DEVICE APPROVAL SUCCESS (Displayed on mobile phone) */}
          {status === 'cross_device_approved' && (
            <div className="space-y-4 flex flex-col items-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-[#7BB33B] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center text-white">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#111410]">
                  COMPUTER AUTHORIZED!
                </h2>
                <p className="mt-1 text-xs font-mono text-[#2F441E]">
                  Your computer has been logged in as <strong className="font-bold underline">{targetEmail || 'scholar'}</strong>.
                </p>
                <div className="mt-3 bg-[#EDF5E5] border-2 border-[#111410] p-3 text-xs font-mono text-[#2F441E] leading-relaxed">
                  You can safely close this browser window or return to your computer.
                </div>
              </div>

              <div className="pt-2 w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleAlsoSignInLocally}
                  className="w-full flex items-center justify-center space-x-1.5 bg-[#FAFBF8] hover:bg-white text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2.5 px-3 text-xs font-mono font-bold uppercase transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#7BB33B]" />
                  <span>ALSO SIGN IN ON THIS PHONE</span>
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="w-full bg-white hover:bg-[#FAFBF8] text-[#62685E] border border-[#111410] py-2 px-3 text-xs font-mono font-bold uppercase"
                >
                  CLOSE WINDOW
                </button>
              </div>
            </div>
          )}

          {/* 4. CROSS-DEVICE DENIED STATE */}
          {status === 'denied' && (
            <div className="space-y-4 flex flex-col items-center py-2 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-[#FDF2F2] border-2 border-[#111410] shadow-[3px_3px_0px_0px_#111410] flex items-center justify-center text-[#991B1B]">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-mono font-black uppercase tracking-tight text-[#991B1B]">
                  SIGN-IN REJECTED
                </h2>
                <p className="mt-2 text-xs font-mono text-[#62685E] max-w-xs">
                  The login attempt on the computer has been cancelled. No session was established.
                </p>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="mt-2 bg-white hover:bg-[#FAFBF8] text-[#111410] border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] py-2 px-4 text-xs font-mono font-bold uppercase"
              >
                RETURN TO HOME
              </button>
            </div>
          )}

          {/* 5. DIRECT SAME-DEVICE SUCCESS (When user clicks on computer itself) */}
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

          {/* 6. ERROR STATE */}
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
                  If your email client didn't open the link automatically, you can paste the full link or verification token below.
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
                    disabled={!manualInput.trim()}
                    className="px-3 py-1.5 bg-[#7BB33B] hover:bg-[#84C341] text-white border-2 border-[#111410] shadow-[2px_2px_0px_0px_#111410] text-xs font-mono font-bold uppercase disabled:opacity-50"
                  >
                    RE-VERIFY
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
