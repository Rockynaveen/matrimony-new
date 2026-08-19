import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../utils/validationSchemas';
import { useApp, isUserProfileCompleted } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Sparkles, Eye, EyeOff, Loader2, Mail, Lock, Heart, CheckCircle2 } from 'lucide-react';
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

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: true
    }
  });

  const checkOnboardingFlow = (res: any) => {
    if (redirectUrl) {
      navigate(redirectUrl);
      return;
    }

    const email = localStorage.getItem('logged_in_email') || '';
    const isDetailedDone = res.is_detailed_complete || isUserProfileCompleted(email);

    // Rule 3: 2nd Time Login / Profile ALREADY Completed -> Redirect DIRECTLY to /matches!
    if (isDetailedDone) {
      navigate('/matches');
      return;
    }

    // Rule 1: Google Register ONLY without basic info -> show basic profile form (/complete-basic-profile)
    if (!res.is_basic_complete && localStorage.getItem('login_method') === 'google_register') {
      navigate('/complete-basic-profile');
      return;
    }

    // Rule 2: 1st Time Login after Manual Register or Google Login (profile incomplete) -> show complete detailed profile form (/profile/complete)
    navigate('/profile/complete');
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      const profileRes = await loginUser({
        email: data.email,
        password: data.password
      });
      checkOnboardingFlow(profileRes);
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleTokenSuccess = async (idToken: string) => {
    setIsGoogleModalOpen(false);
    try {
      setIsSubmitting(true);
      const profileRes = await googleLoginUser({
        id_token: idToken,
        action: 'login'
      });
      checkOnboardingFlow(profileRes);
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
    <div className="h-screen w-full bg-stone-50/60 p-3 sm:p-6 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-4xl w-full h-full max-h-[640px] grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200/80"
      >
        {/* Left Side Visual Banner */}
        <div className="hidden md:flex md:col-span-5 relative overflow-hidden bg-stone-900 flex-col justify-end p-6">
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
                <span>Strict Privacy & Contact Controls</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#8B1E3F] shrink-0" />
                <span>AI Horoscope & Value Matching</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-200/80 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#8B1E3F] text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
                <Heart className="h-3.5 w-3.5 fill-amber-300 stroke-none" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-stone-900">45,000+ Happy Unions</p>
                <p className="text-[10px] text-stone-600 font-medium">Trusted by families across India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="text-left space-y-1.5">
            <Badge variant="gold" className="px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-extrabold">
              <Sparkles className="h-3 w-3 mr-1 text-[#8B1E3F]" /> Welcome Back
            </Badge>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Login to Your Account
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Enter your credentials to access your matrimonial dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 my-auto py-2">
            {/* Email / Phone */}
            <div>
              <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="e.g. ravi@gmail.com or 9876543210"
                  {...register('email')}
                  className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-3 pl-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#8B1E3F] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full text-xs font-semibold bg-stone-50/80 border border-stone-200 rounded-xl p-3 pl-10 pr-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-semibold text-rose-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('remember_me')}
                  className="rounded border-stone-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                />
                <span className="text-xs font-semibold text-stone-600">Remember me on this device</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold shadow-lg bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs h-10.5 uppercase tracking-wider rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Logging in...
                  </>
                ) : (
                  'Login Securely'
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
                className="w-full font-bold border-stone-200 text-stone-800 hover:bg-stone-50 text-xs h-10.5 flex items-center justify-center gap-2.5 rounded-xl transition-all"
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
                <span>Continue with Google</span>
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="pt-3 text-center text-xs font-medium text-stone-500 border-t border-stone-100">
            Don't have a matrimonial account?{' '}
            <Link to={redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register'} className="font-bold text-[#8B1E3F] hover:underline">
              Register Free Profile
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
