import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { ShieldCheck, RotateCcw, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const VerifyOtp: React.FC = () => {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Phone number resolution with persistent fallback so page refresh doesn't break
  const statePhone = (location.state as any)?.phone;
  const queryPhone = searchParams.get('phone');
  const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('pending_otp_phone') || '' : '';
  const phone = statePhone || queryPhone || storedPhone;
  const redirectTo = (location.state as any)?.redirectTo || '/dashboard';

  useEffect(() => {
    if (statePhone || queryPhone) {
      localStorage.setItem('pending_otp_phone', statePhone || queryPhone || '');
    }
  }, [statePhone, queryPhone]);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
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
      const focusIdx = Math.min(pastedData.length, 5);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      showToast('Please enter the complete 6-digit OTP code.');
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
      showToast(res.message || 'Mobile OTP verified successfully!');
      localStorage.removeItem('pending_otp_phone');
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
      showToast(res.message || 'New OTP sent to your mobile number.');
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(30);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Mask phone for display: +91 9876****10
  const cleanDigits = phone.replace(/\D/g, '').slice(-10);
  const maskedPhone = cleanDigits.length === 10
    ? `+91 ${cleanDigits.slice(0, 4)}****${cleanDigits.slice(-2)}`
    : phone || '+91 Mobile Number';

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-4 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[700px] grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Left Side: Visual Image matching Login and Register */}
        <div className="hidden md:block md:col-span-5 relative overflow-hidden bg-stone-900 min-h-[380px]">
          <img
            src="/images/auth_couple_bg.jpg"
            alt="Vivah Royal Matrimony"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        {/* Right Side: shadcn Form Card */}
        <div className="md:col-span-7 flex flex-col justify-between p-3.5 sm:p-5">
          <Card className="border-0 shadow-none rounded-none bg-transparent">
            <CardHeader className="space-y-1 pb-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Security Check
                </span>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                Verify Mobile OTP
              </CardTitle>
              <CardDescription className="text-xs">
                We sent a 6-digit security code to{' '}
                <span className="font-semibold text-foreground">{maskedPhone}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleVerify} className="space-y-3.5">
                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-1.5 sm:gap-2 my-1">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className="h-11 w-10 sm:w-11 text-center text-lg font-bold rounded-lg border border-slate-300 bg-white text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  ))}
                </div>

                {/* Submit Verification Button */}
                <Button
                  type="submit"
                  disabled={isVerifying || otp.join('').length < 6}
                  className="w-full h-9 text-sm font-semibold shadow-xs"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" /> Verify & Continue
                    </>
                  )}
                </Button>
              </form>

              {/* Encryption Notice */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Encrypted 2FA authentication for profile security</span>
              </div>
            </CardContent>

            <CardFooter className="pt-1 pb-1 flex flex-col items-center gap-2">
              {/* Resend OTP Section */}
              <div className="text-xs text-muted-foreground text-center">
                Didn't receive the code?{' '}
                {resendCooldown > 0 ? (
                  <span className="font-medium text-muted-foreground">
                    Resend in <span className="font-semibold text-foreground">{resendCooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-primary underline-offset-4 hover:underline inline-flex items-center gap-1"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3 w-3" /> Resend OTP
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Edit Phone Number Link */}
              <Link
                to="/register"
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Change mobile number
              </Link>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};
