import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../utils/validationSchemas';
import { useApp } from '../context/AppContext';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Sparkles, Eye, EyeOff, Loader2, User, Mail, Phone, Calendar as CalendarIcon, Lock, CheckCircle2, Heart, ShieldCheck } from 'lucide-react';
import { GoogleAuthModal } from '../components/auth/GoogleAuthModal';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { registerUser, googleRegisterUser, showToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend
  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const handleSendOtp = async (phoneValue: string) => {
    if (!phoneValue || phoneValue.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.');
      return;
    }
    try {
      setIsSendingOtp(true);
      await authApi.sendMobileOtp(phoneValue);
      setOtpSent(true);
      setOtpCooldown(30);
      showToast('OTP sent to your mobile number!');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      showToast(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (phoneValue: string) => {
    const code = otpCode.join('');
    if (code.length < 6) {
      showToast('Please enter the complete 6-digit OTP.');
      return;
    }
    try {
      setIsVerifyingOtp(true);
      await authApi.verifyMobileOtp(phoneValue, code);
      setOtpVerified(true);
      showToast('Mobile number verified successfully! ✓');
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
      for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
      setOtpCode(newOtp);
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      await registerUser({
        register_for: data.register_for,
        first_name: data.first_name,
        last_name: data.last_name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirm_password: data.confirm_password,
        accept_terms: data.accept_terms
      });

      // After registration, proceed to Login as per sequence: Home -> Register -> Login -> Requested Page
      showToast('Registration successful! Please login to continue.');
      const loginTarget = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login';
      navigate(loginTarget);
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleTokenSuccess = async (idToken: string) => {
    setIsGoogleModalOpen(false);
    try {
      setIsSubmitting(true);
      // Decode the ID token payload (JWT) to extract required fields for registration
      const tokenPayload = decodeGoogleIdToken(idToken);
      const email = tokenPayload?.email || '';
      const fullName: string = tokenPayload?.name || `${tokenPayload?.given_name || ''} ${tokenPayload?.family_name || ''}`.trim();
      const emailName = extractNameFromEmail(email);
      const resolvedName = (fullName && !isGenericName(fullName)) ? fullName : emailName;

      const nameParts = resolvedName.split(' ');
      const firstName = tokenPayload?.given_name || nameParts[0] || '';
      const lastName = tokenPayload?.family_name || nameParts.slice(1).join(' ') || '';

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

      await googleRegisterUser({
        first_name: firstName,
        last_name: lastName,
        email: email,
        google_id: tokenPayload?.sub || 'google_user'
      });

      // Always navigate to basic profile completion page after Google Registration
      showToast('Google Registration successful! Please complete your basic profile.');
      if (redirectUrl) {
        navigate(`/complete-basic-profile?redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/complete-basic-profile');
      }
    } catch (err: any) {
      const msg = err.message || 'Google Registration failed';
      if (msg.toLowerCase().includes('already')) {
        // If user already registered, redirect to login page
        showToast(msg);
        navigate('/login');
      } else {
        showToast(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-stone-50/60 p-3 sm:p-6 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-5xl w-full h-full max-h-[720px] grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200/80"
      >
        {/* Left Side Visual Banner (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex lg:col-span-5 relative overflow-hidden bg-stone-900 flex-col justify-end p-6">
          <img
            src="/images/auth_couple_bg.jpg?v=3"
            alt="Vivah Royal Matrimony"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

          <div className="relative z-10 space-y-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg">
            <div className="space-y-2 text-xs font-semibold text-stone-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>100% Verified Matrimonial Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>Express Interest to Matches</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>Horoscope & Value Matching</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-200/80 flex items-center gap-2.5">
              <div className="h-7.5 w-7.5 rounded-full bg-[#8B1E3F] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
                <Heart className="h-3.5 w-3.5 fill-amber-300 stroke-none" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-stone-900">100,000+ Active Profiles</p>
                <p className="text-[10px] text-stone-600 font-medium">Find your ideal match today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="text-left space-y-1">
            <Badge variant="gold" className="px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-extrabold">
              <Sparkles className="h-3 w-3 mr-1 text-[#8B1E3F]" /> Create Free Account
            </Badge>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Register Profile
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Start your journey to finding the right life partner.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 my-auto py-1.5">
            
            {/* Register For Dropdown */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                Creating Profile For
              </label>
              <select
                {...register('register_for')}
                className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all cursor-pointer"
              >
                <option value="SELF">Myself</option>
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="BROTHER">Brother</option>
                <option value="SISTER">Sister</option>
                <option value="FRIEND">Friend</option>
                <option value="RELATIVE">Relative</option>
              </select>
              {errors.register_for && (
                <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.register_for.message}</p>
              )}
            </div>

            {/* Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Ravi"
                    {...register('first_name')}
                    className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 pl-9 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                  />
                </div>
                {errors.first_name && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Kumar"
                    {...register('last_name')}
                    className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 pl-9 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                  />
                </div>
                {errors.last_name && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            {/* Gender & DOB Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Gender
                </label>
                <select
                  {...register('gender')}
                  className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                >
                  <option value="Male">Male (Groom)</option>
                  <option value="Female">Female (Bride)</option>
                </select>
                {errors.gender && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.gender.message}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  <input
                    type="date"
                    {...register('date_of_birth')}
                    className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 pl-9 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                  />
                </div>
                {errors.date_of_birth && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.date_of_birth.message}</p>
                )}
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="email"
                    placeholder="e.g. ravi@gmail.com"
                    {...register('email')}
                    className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 pl-9 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      {...register('phone')}
                      disabled={otpVerified}
                      className={`w-full text-xs font-semibold border rounded-xl p-2.5 pl-9 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 transition-all ${
                        otpVerified
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-stone-50/80 border-stone-200 text-stone-900 focus:bg-white'
                      }`}
                    />
                    {otpVerified && (
                      <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        const phoneEl = document.querySelector<HTMLInputElement>('input[name="phone"]');
                        handleSendOtp(phoneEl?.value || '');
                      }}
                      disabled={isSendingOtp || otpCooldown > 0}
                      className="shrink-0 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all disabled:opacity-50 bg-[#8B1E3F] text-white hover:bg-[#721733] border-[#8B1E3F]"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : otpCooldown > 0 ? (
                        `${otpCooldown}s`
                      ) : otpSent ? (
                        'Resend'
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  )}
                </div>
                {errors.phone && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.phone.message}</p>
                )}
                {otpVerified && (
                  <p className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Mobile verified successfully
                  </p>
                )}
              </div>
            </div>

            {/* OTP Input Section */}
            {otpSent && !otpVerified && (
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#8B1E3F]" />
                  <span className="text-[11px] font-bold text-stone-800">Enter 6-digit OTP sent to mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
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
                        className="h-9 w-8 text-center font-serif text-base font-bold border border-stone-200 rounded-lg bg-white focus:border-[#8B1E3F] focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/20 transition-all"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const phoneEl = document.querySelector<HTMLInputElement>('input[name="phone"]');
                      handleVerifyOtp(phoneEl?.value || '');
                    }}
                    disabled={isVerifyingOtp || otpCode.join('').length < 6}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Verify
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 pl-9 pr-9 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-0.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('confirm_password')}
                    className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-2.5 pl-9 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                  />
                </div>
                {errors.confirm_password && (
                  <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('accept_terms')}
                  className="mt-0.5 rounded border-stone-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                />
                <span className="text-[11px] font-medium text-stone-600">
                  I accept the{' '}
                  <span className="font-bold text-[#8B1E3F] underline">Terms & Conditions</span> and{' '}
                  <span className="font-bold text-[#8B1E3F] underline">Privacy Policy</span>.
                </span>
              </label>
              {errors.accept_terms && (
                <p className="text-[11px] font-semibold text-rose-500 mt-0.5">{errors.accept_terms.message}</p>
              )}
            </div>

            {/* Submit & Google Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting || !otpVerified}
                className="w-full font-bold shadow-lg bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-10 uppercase tracking-wider rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Registering...
                  </>
                ) : (
                  'Register Free Profile Now'
                )}
              </Button>

              <div className="relative my-2 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200" />
                </div>
                <span className="relative bg-white px-3 text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                  Or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full font-bold border-stone-200 text-stone-800 hover:bg-stone-50 text-xs h-10 flex items-center justify-center gap-2 rounded-xl transition-all"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                <span>Register with Google</span>
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="pt-2 text-center text-xs font-medium text-stone-500 border-t border-stone-100">
            Already have a matrimonial account?{' '}
            <Link to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'} className="font-bold text-[#8B1E3F] hover:underline">
              Login here
            </Link>
          </div>
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
