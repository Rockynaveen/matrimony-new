import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, Smartphone, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyOtp: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Phone number passed from Register page via navigation state
  const phone = (location.state as any)?.phone || '';
  const redirectTo = (location.state as any)?.redirectTo || '/dashboard';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last digit
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // On backspace, move to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      // Focus last filled input or the next empty one
      const focusIdx = Math.min(pastedData.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      showToast('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!phone) {
      showToast('Phone number not found. Please register again.');
      navigate('/register');
      return;
    }

    try {
      setIsVerifying(true);
      const res = await authApi.verifyMobileOtp(phone, otpCode);
      showToast(res.message || 'Mobile OTP Verified! Welcome to Vivah Matrimony.');
      navigate(redirectTo);
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!phone) {
      showToast('Phone number not found. Please register again.');
      return;
    }

    try {
      setIsResending(true);
      const res = await authApi.sendMobileOtp(phone);
      showToast(res.message || 'New OTP sent to your mobile!');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Mask phone for display: +91 9876****10
  const maskedPhone = phone
    ? phone.replace(/(\d{4})(\d+)(\d{2})$/, '$1****$3')
    : '+91 XXXX XXXX';

  return (
    <div className="min-h-[85vh] bg-transparent py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200/80"
      >
        {/* Left Side Visual Banner */}
        <div className="hidden md:flex md:col-span-5 relative overflow-hidden bg-stone-900 flex-col justify-end p-6">
          <img
            src="/images/auth_couple_bg.jpg?v=3"
            alt="Vivah Royal Matrimony Traditional Couple"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

          <div className="relative z-10 space-y-4 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-white/80 shadow-lg">
            <div className="space-y-2 text-xs font-semibold text-stone-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>Instant Mobile Number Validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>Encrypted 2FA Safeguard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="text-left space-y-2 mb-8">
            <Badge variant="gold" className="px-3 py-1 text-[10px] uppercase tracking-widest font-extrabold">
              <Smartphone className="h-3 w-3 mr-1 text-[#8B1E3F]" /> Verification Step
            </Badge>
            <h1 className="font-serif text-3xl font-extrabold text-stone-900 tracking-tight">
              Verify Mobile OTP
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              We sent a 6-digit security code to <span className="font-bold text-stone-900">{maskedPhone}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  className="h-14 w-12 text-center font-serif text-2xl font-bold border-2 border-stone-200 rounded-2xl bg-stone-50 focus:border-[#8B1E3F] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8B1E3F]/20 transition-all shadow-sm"
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isVerifying || otp.join('').length < 6}
              className="w-full font-bold shadow-xl bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-11 uppercase tracking-wider"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Verify Code & Access Profile
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>OTP auto-detected on mobile. Instant activation ready.</span>
          </div>

          <p className="text-center text-xs text-stone-500 mt-6 pt-4 border-t border-stone-100">
            Didn't receive code?{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="font-bold text-[#8B1E3F] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
