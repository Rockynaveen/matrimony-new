import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, getMaxDobDateString, isAtLeast18YearsOld, type RegisterFormData } from '../utils/validationSchemas';
import { useApp, decodeGoogleIdToken, extractNameFromEmail, isGenericName } from '../context/AppContext';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Separator } from '../components/ui/Separator';
import { Eye, EyeOff, Loader2, Check, CheckCircle2, Sparkles, ShieldCheck, Heart, User, Users, Mail, Lock, Phone, Calendar, Send, AlertCircle, LogIn, KeyRound } from 'lucide-react';
import { GoogleAuthModal, type GoogleExtraData } from '../components/auth/GoogleAuthModal';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const {
    registerUser,
    googleRegisterUser,
    googleLoginUser,
    isAuthenticated,
    checkProfileStatus,
    updateCurrentUserAvatar,
    showToast
  } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxAllowedDob = getMaxDobDateString();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated || localStorage.getItem('access_token')) {
      navigate(redirectUrl || '/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, redirectUrl, navigate]);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [alreadyRegisteredPhone, setAlreadyRegisteredPhone] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOtp = async (inputPhone?: string) => {
    const rawPhone = inputPhone 
      || (document.getElementById('register-phone') as HTMLInputElement)?.value 
      || getValues('phone') 
      || currentPhone 
      || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number first.');
      return;
    }
    console.log('[Register] handleSendOtp calling Railway API with phone:', cleanPhone);

    try {
      setIsSendingOtp(true);
      setAlreadyRegisteredPhone(null);
      const res = await authApi.sendMobileOtp(cleanPhone);
      setOtpSent(true);
      setOtpCooldown(30);
      setOtpCode(['', '', '', '', '', '']);
      showToast('OTP sent successfully to your mobile number.');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP. Please try again.';
      const lower = msg.toLowerCase();
      if (lower.includes('already') || lower.includes('registered') || lower.includes('please login') || lower.includes('exists')) {
        setAlreadyRegisteredPhone(cleanPhone);
        showToast('This mobile number is already registered. Please log in.');
        setTimeout(() => {
          navigate(`/login?phone=${cleanPhone}`);
        }, 1500);
      } else {
        showToast(msg);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (inputPhone?: string) => {
    const rawPhone = inputPhone 
      || (document.getElementById('register-phone') as HTMLInputElement)?.value 
      || getValues('phone') 
      || currentPhone 
      || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
    const code = otpCode.join('');
    console.log('[Register] handleVerifyOtp calling Railway API with phone:', cleanPhone, 'otp:', code);

    try {
      setIsVerifyingOtp(true);
      const res = await authApi.verifyMobileOtp(cleanPhone, code);
      setOtpVerified(true);
      lastVerifiedPhoneRef.current = cleanPhone;
      showToast(res.message || 'Mobile number verified successfully.');
    } catch (err: any) {
      showToast(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
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

  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      register_for: 'SELF',
      first_name: '',
      last_name: '',
      gender: 'Male',
      date_of_birth: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      accept_terms: false
    }
  });

  const acceptTerms = watch('accept_terms');
  const currentPhone = watch('phone');

  // Reset OTP verification if user edits their phone number
  const lastVerifiedPhoneRef = useRef<string>('');
  useEffect(() => {
    const clean = (currentPhone || '').replace(/\D/g, '').slice(-10);
    setAlreadyRegisteredPhone(null);
    if (lastVerifiedPhoneRef.current && clean !== lastVerifiedPhoneRef.current) {
      setOtpVerified(false);
      setOtpSent(false);
      setOtpCode(['', '', '', '', '', '']);
    }
  }, [currentPhone]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!isAtLeast18YearsOld(data.date_of_birth)) {
      showToast('You must be 18 years or older to register.');
      return;
    }
    if (!otpVerified) {
      showToast('Please verify your mobile number with OTP before completing registration.');
      return;
    }
    const cleanPhone = (data.phone || '').replace(/\D/g, '').slice(-10);
    try {
      setIsSubmitting(true);
      setAlreadyRegisteredPhone(null);
      await registerUser({
        register_for: data.register_for,
        first_name: data.first_name,
        last_name: data.last_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        email: data.email,
        phone: cleanPhone,
        password: data.password,
        confirm_password: data.confirm_password,
        accept_terms: data.accept_terms
      });

      const manualName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      if (manualName) {
        localStorage.setItem('logged_in_name', manualName);
      }
      if (data.email) {
        localStorage.setItem('logged_in_email', data.email);
      }
      if (data.gender) {
        localStorage.setItem('logged_in_gender', data.gender);
      }
      if (data.date_of_birth) {
        localStorage.setItem('logged_in_dob', data.date_of_birth);
      }
      if (cleanPhone) {
        localStorage.setItem('logged_in_phone', cleanPhone);
      }

      showToast('Registration successful. Please complete your detailed profile.');
      const target = redirectUrl ? `/profile/complete?redirect=${encodeURIComponent(redirectUrl)}` : '/profile/complete';
      navigate(target);
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      const lower = msg.toLowerCase();
      if (lower.includes('already') || lower.includes('registered') || lower.includes('exists') || lower.includes('please login')) {
        setAlreadyRegisteredPhone(cleanPhone);
        showToast('This mobile number or email is already registered. Redirecting to login...');
        setTimeout(() => {
          navigate(`/login?phone=${cleanPhone}`);
        }, 1200);
      } else {
        showToast(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleTokenSuccess = async (idToken: string, extraData?: GoogleExtraData) => {
    setIsGoogleModalOpen(false);
    try {
      setIsSubmitting(true);
      const tokenPayload = decodeGoogleIdToken(idToken);
      const email = tokenPayload?.email || '';
      const fullName: string = tokenPayload?.name || `${tokenPayload?.given_name || ''} ${tokenPayload?.family_name || ''}`.trim();
      const emailName = extractNameFromEmail(email);
      const resolvedName = (fullName && !isGenericName(fullName)) ? fullName : emailName;

      if (resolvedName && !isGenericName(resolvedName)) {
        localStorage.setItem('logged_in_name', resolvedName);
      }
      if (email) {
        localStorage.setItem('logged_in_email', email);
      }
      if (tokenPayload?.picture) {
        localStorage.setItem('logged_in_avatar', tokenPayload.picture);
        updateCurrentUserAvatar(tokenPayload.picture);
      }

      // 1. If detected as existing user by GoogleAuthModal, log in immediately!
      if (extraData?.is_existing_user) {
        showToast('Welcome back! You are already registered. Logging you in...');
        await googleLoginUser({
          id_token: idToken,
          action: 'login'
        });
        await checkProfileStatus();
        navigate(redirectUrl || '/dashboard');
        return;
      }

      // 2. Proactive Login check: Try logging in first in case user was already registered
      try {
        await googleLoginUser({
          id_token: idToken,
          action: 'login'
        });
        showToast('Welcome back! You are already registered. Logged in successfully.');
        await checkProfileStatus();
        navigate(redirectUrl || '/dashboard');
        return;
      } catch {
        // User not found in database; proceed with registration
      }

      const formValues = getValues();
      const finalGender = extraData?.gender || formValues.gender || 'Male';
      const finalDob = extraData?.date_of_birth || formValues.date_of_birth || '';
      const rawPhone = extraData?.phone || formValues.phone || '';
      const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '').slice(-10) : `9${Date.now().toString().slice(-9)}`;
      const finalPassword = extraData?.password || formValues.password || 'GoogleAuth@2026!';
      const finalConfirmPassword = extraData?.confirm_password || formValues.confirm_password || finalPassword;

      if (finalGender) {
        localStorage.setItem('logged_in_gender', finalGender);
      }
      if (finalDob) {
        localStorage.setItem('logged_in_dob', finalDob);
      }
      if (cleanPhone) {
        localStorage.setItem('logged_in_phone', cleanPhone);
      }

      try {
        await googleRegisterUser({
          first_name: tokenPayload?.given_name || resolvedName.split(' ')[0] || formValues.first_name || 'User',
          last_name: tokenPayload?.family_name || resolvedName.split(' ').slice(1).join(' ') || formValues.last_name || '',
          email: email || formValues.email,
          google_id: tokenPayload?.sub || 'google_user',
          password: finalPassword,
          confirm_password: finalConfirmPassword,
          date_of_birth: finalDob || '2000-01-01',
          gender: finalGender,
          phone: cleanPhone,
          register_for: formValues.register_for || 'SELF'
        });

        showToast('Google Registration successful. Please complete your profile.');
        if (redirectUrl) {
          navigate(`/profile/complete?redirect=${encodeURIComponent(redirectUrl)}`);
        } else {
          navigate('/profile/complete');
        }
      } catch (regErr: any) {
        const msg = regErr?.message || '';
        // 3. Fallback: If registration fails because account already exists, auto-login immediately!
        if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')) {
          showToast('Account already exists! Logging you in...');
          try {
            await googleLoginUser({
              id_token: idToken,
              action: 'login'
            });
            await checkProfileStatus();
            navigate(redirectUrl || '/dashboard');
          } catch {
            showToast('Account already registered. Please sign in.');
            navigate(`/login?email=${encodeURIComponent(email)}`);
          }
        } else {
          showToast(msg || 'Google Registration failed');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Authentication error');
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
        className="w-full max-w-[820px] grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden"
      >
        {/* Left Side: Visual Image */}
        <div className="hidden lg:block lg:col-span-5 relative overflow-hidden bg-stone-900 min-h-[460px]">
          <img
            src="/images/auth_couple_bg.jpg"
            alt="Vivah Royal Matrimony"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        {/* Right Side: shadcn Form Card */}
        <div className="lg:col-span-7 flex flex-col justify-between p-3.5 sm:p-5">
          <Card className="border-0 shadow-none rounded-none bg-transparent">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-xl font-bold tracking-tight">
                Create an account
              </CardTitle>
              <CardDescription className="text-xs">
                Fill out the required information below to register your matrimonial profile
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">

                {/* Profile For */}
                <div className="space-y-1">
                  <Label htmlFor="register-for" className="text-xs">
                    Creating profile for
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
                    <select
                      id="register-for"
                      {...register('register_for')}
                      className="flex h-10 w-full rounded-xl border border-slate-300 hover:border-slate-400 bg-white pl-10 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 font-medium shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1E3F]/25 focus-visible:border-[#8B1E3F] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <option value="SELF">Myself</option>
                      <option value="SON">Son</option>
                      <option value="DAUGHTER">Daughter</option>
                      <option value="BROTHER">Brother</option>
                      <option value="SISTER">Sister</option>
                      <option value="FRIEND">Friend</option>
                      <option value="RELATIVE">Relative</option>
                    </select>
                  </div>
                  {errors.register_for && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.register_for.message}
                    </p>
                  )}
                </div>

                {/* Name Row (First Name, Last Name) - NO PLACEHOLDERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="first-name" className="text-xs">
                      First name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="first-name"
                        type="text"
                        autoComplete="given-name"
                        {...register('first_name')}
                        className={`pl-10 h-9 text-sm ${errors.first_name ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                    </div>
                    {errors.first_name && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="last-name" className="text-xs">
                      Last name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="last-name"
                        type="text"
                        autoComplete="family-name"
                        {...register('last_name')}
                        className={`pl-10 h-9 text-sm ${errors.last_name ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                    </div>
                    {errors.last_name && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gender and Date of Birth Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs">
                      Gender
                    </Label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none" />
                      <select
                        id="gender"
                        {...register('gender')}
                        className="flex h-10 w-full rounded-xl border border-slate-300 hover:border-slate-400 bg-white pl-10 pr-3 py-1.5 text-xs sm:text-sm text-slate-900 font-medium shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1E3F]/25 focus-visible:border-[#8B1E3F] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        <option value="Male">Male (Groom)</option>
                        <option value="Female">Female (Bride)</option>
                      </select>
                    </div>
                    {errors.gender && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="dob" className="text-xs">
                      Date of birth
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="dob"
                        type="date"
                        max={maxAllowedDob}
                        {...register('date_of_birth')}
                        className={`pl-10 h-9 text-sm ${errors.date_of_birth ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Must be 18 years or older
                    </p>
                    {errors.date_of_birth && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.date_of_birth.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email and Mobile Number Row - NO PLACEHOLDERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="register-email" className="text-xs">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        className={`pl-10 h-9 text-sm ${errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="register-phone" className="text-xs">
                        Mobile number
                      </Label>
                      {otpVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="relative w-full">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="register-phone"
                        type="tel"
                        autoComplete="tel"
                        disabled={otpVerified}
                        {...register('phone')}
                        className={`pl-10 pr-10 h-9 text-sm w-full ${
                          otpVerified
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                            : errors.phone
                            ? 'border-destructive focus-visible:ring-destructive/30'
                            : ''
                        }`}
                      />
                      {otpVerified ? (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSendOtp();
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
                      )}
                    </div>
                    {errors.phone && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Already Registered Phone Alert Banner */}
                {alreadyRegisteredPhone && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-amber-300/80 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-700/60 p-3 space-y-2 text-xs text-amber-950 dark:text-amber-200 shadow-xs"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-xs text-amber-900 dark:text-amber-100">
                          Mobile number is already registered
                        </p>
                        <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                          +91 {alreadyRegisteredPhone} is already linked with an existing account. You can log in directly or reset your password.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                        onClick={() => navigate(`/login?phone=${alreadyRegisteredPhone}`)}
                      >
                        <LogIn className="h-3.5 w-3.5 mr-1" /> Log In Now
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-medium border-amber-300 dark:border-amber-700 hover:bg-amber-100/70 dark:hover:bg-amber-900/40"
                        onClick={() => navigate(`/forgot-password?phone=${alreadyRegisteredPhone}`)}
                      >
                        <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset Password via OTP
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* OTP Verification Box if OTP was sent and not verified */}
                {otpSent && !otpVerified && (
                  <div className="rounded-lg border border-border bg-muted/40 p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        Enter 6-digit OTP code sent to mobile
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex gap-1.5">
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
                            className="h-9 w-8 text-center text-sm font-semibold border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-[#8B1E3F] transition-all"
                          />
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleVerifyOtp();
                        }}
                        disabled={isVerifyingOtp}
                        className="h-9 px-3 text-xs font-semibold"
                      >
                        {isVerifyingOtp ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        Verify OTP
                      </Button>
                    </div>
                  </div>
                )}

                {/* Password & Confirm Password Row - NO PLACEHOLDERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="register-password" className="text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
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
                    <p className="text-[10px] text-muted-foreground">
                      Minimum 6 characters
                    </p>
                    {errors.password && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="register-confirm-password" className="text-xs">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirm_password')}
                        className={`pl-10 pr-10 h-9 text-sm ${errors.confirm_password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.confirm_password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Accept Terms Checkbox */}
                <div className="space-y-0.5 pt-0.5">
                  <div className="flex items-start space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer select-none mt-0.5">
                      <input
                        type="checkbox"
                        id="accept_terms"
                        checked={!!acceptTerms}
                        onChange={(e) => setValue('accept_terms', e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white shadow-xs transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#8B1E3F] peer-checked:border-[#8B1E3F] peer-checked:bg-[#8B1E3F] peer-checked:text-white">
                        <Check className={`h-2.5 w-2.5 stroke-[3] text-white transition-opacity ${acceptTerms ? 'opacity-100' : 'opacity-0'}`} />
                      </span>
                    </label>
                    <Label htmlFor="accept_terms" className="text-xs font-normal text-muted-foreground leading-snug cursor-pointer">
                      I agree to the{' '}
                      <span className="font-semibold text-foreground underline underline-offset-2">
                        Terms of Service
                      </span>{' '}
                      and{' '}
                      <span className="font-semibold text-foreground underline underline-offset-2">
                        Privacy Policy
                      </span>
                      .
                    </Label>
                  </div>
                  {errors.accept_terms && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.accept_terms.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-9 text-sm font-semibold shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating profile...
                    </>
                  ) : (
                    'Register Free Profile'
                  )}
                </Button>
              </form>

              {/* Separator Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground font-medium tracking-wider text-[11px]">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Register Button */}
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
                Already have a matrimonial account?{' '}
                <Link
                  to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Sign in here
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
        mode="register"
        initialGender={getValues('gender') || 'Male'}
        initialDob={getValues('date_of_birth') || ''}
        initialPhone={getValues('phone') || ''}
        initialPassword={getValues('password') || ''}
        initialConfirmPassword={getValues('confirm_password') || ''}
      />
    </div>
  );
};
