import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Mail, ArrowLeft, Send, KeyRound, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPassword: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();

  // Multi-step state: 1 = Send OTP, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus first OTP input when step 2 opens
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // STEP 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneOrEmail.trim()) {
      showToast('Please enter your registered phone number or email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authApi.forgotPasswordSendOtp(phoneOrEmail.trim());
      showToast(res.message || 'OTP sent successfully!');
      setStep(2);
      setCooldown(30);
    } catch (err: any) {
      showToast(err.message || 'Failed to send recovery OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      showToast('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authApi.forgotPasswordVerifyOtp(phoneOrEmail.trim(), code);
      showToast(res.message || 'OTP Verified! Please enter your new password.');
      setStep(3);
    } catch (err: any) {
      showToast(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsSubmitting(true);
      const code = otpCode.join('');
      const res = await authApi.forgotPasswordReset({
        phone_or_email: phoneOrEmail.trim(),
        otp: code,
        password: newPassword,
        confirm_password: confirmPassword
      });

      showToast(res.message || 'Password reset successfully! You can now log in.');
      setStep(4);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Input Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otpCode];
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtpCode(newOtp);
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

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
                <span>Instant OTP Verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>Encrypted Security Safeguards</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          
          {/* Header */}
          <div className="text-left space-y-2 mb-8">
            <Badge variant="gold" className="px-3 py-1 text-[10px] uppercase tracking-widest font-extrabold">
              <KeyRound className="h-3 w-3 mr-1 text-[#8B1E3F]" /> Account Recovery
            </Badge>
            <h1 className="font-serif text-3xl font-extrabold text-stone-900 tracking-tight">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify Recovery OTP'}
              {step === 3 && 'Set New Password'}
              {step === 4 && 'Password Reset Complete'}
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              {step === 1 && 'Enter your registered phone number or email address to receive an OTP code.'}
              {step === 2 && `Enter the 6-digit security OTP sent to ${phoneOrEmail}.`}
              {step === 3 && 'Choose a strong new password for your matrimonial account.'}
              {step === 4 && 'Your password has been updated successfully.'}
            </p>
          </div>

          {/* STEP 1: Enter Phone / Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                  Phone Number or Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-stone-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={phoneOrEmail}
                    onChange={e => setPhoneOrEmail(e.target.value)}
                    placeholder="e.g. 9876543210 or ravi@gmail.com"
                    className="w-full text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl p-3.5 pl-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold shadow-xl bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-11 uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Send Recovery OTP
                  </>
                )}
              </Button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-center gap-2">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="h-12 w-10 text-center font-serif text-xl font-bold border-2 border-stone-200 rounded-xl bg-stone-50 focus:border-[#8B1E3F] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#8B1E3F]/20 transition-all shadow-sm"
                  />
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting || otpCode.join('').length < 6}
                className="w-full font-bold shadow-xl bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-11 uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" /> Verify OTP Code
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs text-stone-500 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-stone-600 hover:underline"
                >
                  Change Email / Phone
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={cooldown > 0 || isSubmitting}
                  className="font-bold text-[#8B1E3F] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password Fields */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 pr-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl p-3 pl-10 pr-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold shadow-xl bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-11 uppercase tracking-wider mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" /> Save New Password & Finish
                  </>
                )}
              </Button>
            </form>
          )}

          {/* STEP 4: Success State */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">Password Reset Successfully!</h4>
                <p className="text-xs text-emerald-800">
                  Your password for <strong>{phoneOrEmail}</strong> has been updated. You can now sign in with your new credentials.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/login')}
                className="w-full font-bold bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-11 uppercase tracking-wider"
              >
                Sign In Now
              </Button>
            </div>
          )}

          <div className="text-center pt-6 border-t border-stone-100 mt-6">
            <Link to="/login" className="text-xs font-bold text-stone-500 hover:text-[#8B1E3F] inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
