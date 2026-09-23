import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../utils/validationSchemas';
import { useApp, getStoredOnboardingStatus, getNextPendingRoute, decodeGoogleIdToken, extractNameFromEmail, isGenericName } from '../context/AppContext';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Separator } from '../components/ui/Separator';
import { Eye, EyeOff, Loader2, Heart, ShieldCheck, Sparkles, Check, Smartphone, KeyRound, Mail, Lock, Send } from 'lucide-react';
import { GoogleAuthModal } from '../components/auth/GoogleAuthModal';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { loginUser, googleLoginUser, showToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // Login Mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const phoneParam = searchParams.get('phone');
  const emailParam = searchParams.get('email');
  const modeParam = searchParams.get('mode');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: true
    }
  });

  const rememberMe = watch('remember_me');

  useEffect(() => {
    if (phoneParam) {
      const clean = phoneParam.replace(/\D/g, '').slice(-10);
      setValue('email', clean);
      setOtpPhone(clean);
      if (modeParam === 'otp') {
        setLoginMode('otp');
      }
    } else if (emailParam) {
      setValue('email', emailParam.trim());
    }
  }, [phoneParam, emailParam, modeParam, setValue]);

  const checkOnboardingFlow = async (targetEmail?: string) => {
    const email = (targetEmail || localStorage.getItem('logged_in_email') || '').toLowerCase().trim();
    // Synchronize latest profile, partner preferences, and verification status from backend
    try {
      await checkProfileStatus();
    } catch {}

    const status = getStoredOnboardingStatus(email);
    const nextRoute = getNextPendingRoute(status);

    if (nextRoute === '/matches' && redirectUrl) {
      navigate(redirectUrl);
      return;
    }

    navigate(nextRoute);
  };

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
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtpCode(newOtp);
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleSendLoginOtp = async () => {
    const rawPhone = otpPhone || (document.getElementById('login-otp-phone') as HTMLInputElement)?.value || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }
    console.log('[Login] handleSendLoginOtp calling Railway API with phone:', cleanPhone);

    try {
      setIsSendingOtp(true);
      const res = await authApi.forgotPasswordSendOtp(cleanPhone);
      setOtpSent(true);
      setOtpCooldown(30);
      setOtpCode(['', '', '', '', '', '']);
      showToast(res.message || 'OTP sent successfully to your mobile number.');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP. Please try again.';
      const lower = msg.toLowerCase();
      if (lower.includes('not registered') || lower.includes('not found') || lower.includes('no account') || lower.includes('register first')) {
        showToast('Mobile number is not registered. Redirecting to registration...');
        setTimeout(() => navigate('/register'), 1200);
      } else {
        showToast(msg);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    const rawPhone = otpPhone || (document.getElementById('login-otp-phone') as HTMLInputElement)?.value || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const code = otpCode.join('');
    if (code.length < 6) {
      showToast('Please enter the complete 6-digit OTP code.');
      return;
    }
    console.log('[Login] handleVerifyLoginOtp calling Railway API with phone:', cleanPhone, 'otp:', code);

    try {
      setIsVerifyingOtp(true);
      const res = await authApi.forgotPasswordVerifyOtp(cleanPhone, code);
      showToast(res.message || 'Mobile OTP verified! Redirecting to set your password.');
      navigate(`/forgot-password?phone=${cleanPhone}&step=3`);
    } catch (err: any) {
      const msg = err.message || 'Invalid or expired OTP. Please try again.';
      showToast(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await loginUser({
        email: data.email,
        password: data.password
      });
      await checkOnboardingFlow(data.email);
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check credentials.';
      const lower = msg.toLowerCase();
      if (
        lower.includes('not registered') ||
        lower.includes('not found') ||
        lower.includes('register first') ||
        lower.includes('no account')
      ) {
        showToast('Account not found. Please register first.');
        setTimeout(() => navigate('/register'), 1200);
      } else {
        showToast(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleTokenSuccess = async (idToken: string) => {
    setIsGoogleModalOpen(false);
    try {
      setIsSubmitting(true);
      const tokenPayload = decodeGoogleIdToken(idToken);
      let googleEmail = '';
      if (tokenPayload) {
        const rawName = tokenPayload.name || `${tokenPayload.given_name || ''} ${tokenPayload.family_name || ''}`.trim();
        googleEmail = tokenPayload.email || '';
        const emailName = extractNameFromEmail(googleEmail);
        const resolvedName = (rawName && !isGenericName(rawName)) ? rawName : emailName;

        if (resolvedName && !isGenericName(resolvedName)) {
          localStorage.setItem('logged_in_name', resolvedName);
        }
        if (googleEmail) {
          localStorage.setItem('logged_in_email', googleEmail);
        }
        if (tokenPayload.picture) {
          localStorage.setItem('logged_in_avatar', tokenPayload.picture);
        }
      }
      await googleLoginUser({
        id_token: idToken,
        action: 'login'
      });
      await checkOnboardingFlow(googleEmail);
    } catch (err: any) {
      const msg = err.message || 'Google Login failed';
      if (msg.toLowerCase().includes('register')) {
        showToast(msg);
        navigate('/register');
      } else {
        showToast(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-4 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[700px] grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden"
      >
        {/* Left Side: Visual Image */}
        <div className="hidden md:block md:col-span-5 relative overflow-hidden bg-stone-900 min-h-[400px]">
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
              <CardTitle className="text-xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-xs">
                Sign in to your account with password or mobile OTP
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Tab Selector: Password vs Mobile OTP */}
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-slate-600 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLoginMode('password')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                    loginMode === 'password'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Password Login
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('otp')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-all ${
                    loginMode === 'otp'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Mobile OTP Login
                </button>
              </div>

              {loginMode === 'password' ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  {/* Email / Mobile Field */}
                  <div className="space-y-1">
                    <Label htmlFor="login-email" className="text-xs">
                      Email address or mobile number
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-email"
                        type="text"
                        autoComplete="username"
                        {...register('email')}
                        className={`pl-10 h-9 text-sm ${errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Registered email address or 10-digit mobile number
                    </p>
                    {errors.email && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs">
                        Password
                      </Label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...register('password')}
                        className={`pl-10 pr-10 h-9 text-sm ${errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 pt-0.5">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="remember_me"
                        checked={!!rememberMe}
                        onChange={(e) => setValue('remember_me', e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white shadow-xs transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#8B1E3F] peer-checked:border-[#8B1E3F] peer-checked:bg-[#8B1E3F] peer-checked:text-white">
                        <Check className={`h-2.5 w-2.5 stroke-[3] text-white transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                      </span>
                    </label>
                    <Label htmlFor="remember_me" className="text-xs font-normal text-muted-foreground cursor-pointer">
                      Remember me on this device
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-9 text-sm font-semibold shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              ) : (
                /* Mobile OTP Login View */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="login-otp-phone" className="text-xs">Mobile number</Label>
                    <div className="relative w-full">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="login-otp-phone"
                        type="tel"
                        autoComplete="tel"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        className="pl-10 pr-10 h-9 text-sm w-full"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSendLoginOtp();
                        }}
                        disabled={isSendingOtp || otpCooldown > 0}
                        title={otpCooldown > 0 ? `Resend in ${otpCooldown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                        aria-label={otpCooldown > 0 ? `Resend in ${otpCooldown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingOtp ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : otpCooldown > 0 ? (
                          <span className="text-[10px] font-bold text-muted-foreground">{otpCooldown}s</span>
                        ) : (
                          <Send className="h-3.5 w-3.5 text-primary" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      We will send a 6-digit OTP code to this mobile number
                    </p>
                  </div>

                  {otpSent && (
                    <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Enter 6-digit OTP code
                      </Label>
                      <div className="flex justify-between gap-1.5">
                        {otpCode.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={idx === 0 ? handleOtpPaste : undefined}
                            className="h-9 w-9 text-center text-base font-bold border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        ))}
                      </div>

                      <Button
                        type="button"
                        onClick={handleVerifyLoginOtp}
                        disabled={isVerifyingOtp}
                        className="w-full h-9 text-sm font-semibold shadow-xs"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying OTP...
                          </>
                        ) : (
                          'Verify & Sign In'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Separator Divider */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground font-medium tracking-wider text-[11px]">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full h-9 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-foreground font-medium">Continue with Google</span>
              </button>
            </CardContent>

            <CardFooter className="pt-1 pb-1 flex justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link
                  to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Create free account
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </motion.div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccessToken={handleGoogleTokenSuccess}
      />
    </div>
  );
};
