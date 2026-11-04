import React, { useState, useEffect, useRef } from 'react';
import { ConfirmationResult, linkWithPhoneNumber, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../hooks/useAuth';
import { Phone, KeyRound, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhoneOTPFormProps {
  role?: 'USER' | 'OWNER';
  mode?: 'sign-in' | 'link-phone';
  containerId?: string;
  onSuccess?: () => void;
}

function getFriendlyFirebaseError(err: any): string {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code.includes('invalid-phone-number')) {
    return 'Please enter a valid 10-digit Indian mobile number.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many OTP requests. Please wait a minute and try again.';
  }
  if (code.includes('quota-exceeded')) {
    return 'SMS limit reached. Please try again later.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'Domain not authorized. Please contact support.';
  }
  if (code.includes('captcha-check-failed') || code.includes('invalid-app-credential')) {
    return 'reCAPTCHA verification failed. Please refresh the page and try again.';
  }
  if (code.includes('invalid-verification-code')) {
    return 'Incorrect 6-digit OTP. Please check and re-enter.';
  }
  if (code.includes('credential-already-in-use')) {
    return 'This phone number is already linked to another account. Sign in to that account or use a different number.';
  }
  if (code.includes('code-expired')) {
    return 'OTP has expired. Please request a new OTP.';
  }
  return msg.replace(/^Firebase:\s*/i, '') || 'Failed to authenticate. Please try again.';
}

export const PhoneOTPForm: React.FC<PhoneOTPFormProps> = ({
  role = 'USER',
  mode = 'sign-in',
  containerId = 'recaptcha-container',
  onSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { setUser } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const clearVerifier = () => {
    if (verifierRef.current) {
      try {
        verifierRef.current.clear();
      } catch {}
      verifierRef.current = null;
    }
    const target = containerRef.current || document.getElementById(containerId);
    if (target) {
      target.innerHTML = '';
    }
  };

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      clearVerifier();
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const getOrCreateRecaptcha = (): RecaptchaVerifier | null => {
    try {
      if (verifierRef.current) {
        return verifierRef.current;
      }

      const targetElement = containerRef.current || document.getElementById(containerId);
      if (!targetElement) {
        console.error('reCAPTCHA container element not found');
        return null;
      }

      // Clear any leftover content in the container
      targetElement.innerHTML = '';

      const verifier = new RecaptchaVerifier(auth, targetElement, {
        size: 'normal',
        callback: () => {},
        'expired-callback': () => {
          clearVerifier();
        },
      });

      verifierRef.current = verifier;
      return verifier;
    } catch (err) {
      console.error('reCAPTCHA init error:', err);
      clearVerifier();
      return null;
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const formattedPhone = `+91${cleanPhone}`;
    setLoading(true);

    try {
      const verifier = getOrCreateRecaptcha();
      if (!verifier) {
        toast.error('Verification setup failed. Please refresh the page and try again.');
        return;
      }

      const confirmation = mode === 'link-phone'
        ? auth.currentUser
          ? await linkWithPhoneNumber(auth.currentUser, formattedPhone, verifier)
          : null
        : await signInWithPhoneNumber(auth, formattedPhone, verifier);
      if (!confirmation) {
        toast.error('Your sign-in session has expired. Please sign in again before verifying your phone.');
        return;
      }
      setConfirmationResult(confirmation);
      setStep('OTP');
      setCountdown(60);
      toast.success(`OTP sent to +91 ${cleanPhone}!`);
    } catch (err: any) {
      console.error('SMS OTP Error:', err);
      // Clear verifier on error so it gets recreated fresh on retry
      clearVerifier();
      const friendlyMsg = getFriendlyFirebaseError(err);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      toast.error('Session expired. Please request OTP again.');
      setStep('PHONE');
      return;
    }
    if (otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      const response = await authService.firebaseLogin(idToken, role);

      if (response.success && response.data) {
        setUser(response.data.user, response.data.token);
        toast.success(`Welcome, ${response.data.user.name}!`);
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      const friendlyMsg = getFriendlyFirebaseError(err);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* reCAPTCHA anchor — invisible widget renders here */}
      <div ref={containerRef} id={containerId} />

      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Mobile Number (Chennai / India)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5A059] font-bold text-sm">
                +91
              </div>
              <input
                type="tel"
                maxLength={10}
                required
                placeholder="98400 12345"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-14 pr-4 py-3 bg-white border border-[#E8DFC8] rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25 focus:border-[#C5A059] transition shadow-xs"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              A random 6-digit OTP will be sent to this number via SMS.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white font-bold text-sm rounded-xl transition shadow-md shadow-[#D4AF37]/25 active:scale-[0.99] disabled:opacity-50"
          >
            <Phone className="w-4 h-4" />
            <span>{loading ? 'Sending OTP...' : 'Send OTP via SMS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Enter 6-Digit OTP
              </label>
              <button
                type="button"
                onClick={() => { setStep('PHONE'); clearVerifier(); }}
                className="text-xs text-[#C5A059] hover:underline font-semibold"
              >
                Change Number (+91 {phoneNumber})
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4 text-[#C5A059]" />
              </div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8DFC8] rounded-xl text-gray-900 font-bold tracking-widest text-center text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C5A059]/25 focus:border-[#C5A059] transition shadow-xs"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              OTP sent to +91 {phoneNumber}. Check your SMS inbox.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#B8860B] hover:brightness-105 text-white font-bold text-sm rounded-xl transition shadow-md shadow-[#D4AF37]/25 active:scale-[0.99] disabled:opacity-50"
          >
            <span>{loading ? 'Verifying OTP...' : 'Verify & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center pt-1 text-xs">
            {countdown > 0 ? (
              <span className="text-gray-400 font-medium">Resend OTP in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="inline-flex items-center gap-1.5 font-bold text-[#C5A059] hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resend OTP
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
