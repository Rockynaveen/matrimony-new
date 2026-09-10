import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../utils/validationSchemas';
import { useApp, getStoredOnboardingStatus, getNextPendingRoute, decodeGoogleIdToken, extractNameFromEmail, isGenericName } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Separator } from '../components/ui/Separator';
import { Eye, EyeOff, Loader2, Heart, ShieldCheck, Sparkles, Check } from 'lucide-react';
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

  const checkOnboardingFlow = (targetEmail?: string) => {
    const email = (targetEmail || localStorage.getItem('logged_in_email') || '').toLowerCase().trim();
    const status = getStoredOnboardingStatus(email);
    const nextRoute = getNextPendingRoute(status);

    if (nextRoute === '/matches' && redirectUrl) {
      navigate(redirectUrl);
      return;
    }

    navigate(nextRoute);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await loginUser({
        email: data.email,
        password: data.password
      });
      checkOnboardingFlow(data.email);
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
      checkOnboardingFlow(googleEmail);
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
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Left Side: Visual Image & Brand Showcase */}
        <div className="hidden md:flex md:col-span-5 relative overflow-hidden bg-stone-900 flex-col justify-end p-6 min-h-[560px]">
          <img
            src="/images/auth_couple_bg.jpg"
            alt="Vivah Royal Matrimony"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

          <div className="relative z-10 space-y-3 bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-xl text-white">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-xs text-white border border-white/20">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>Verified Matrimony</span>
            </div>

            <h2 className="text-lg font-bold tracking-tight font-serif text-white leading-snug">
              Find your ideal life partner
            </h2>

            <p className="text-xs text-white/80 leading-relaxed">
              Connect with thousands of verified profiles with complete trust, privacy, and traditional family values.
            </p>

            <div className="space-y-1.5 text-xs text-white/90 pt-0.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span>100% ID-verified profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span>Granular privacy & contact controls</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span>Smart community & value matching</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/20 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">45,000+ Happy Marriages</p>
                <p className="text-[10px] text-white/70">Trusted across all communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: shadcn Form Card */}
        <div className="md:col-span-7 flex flex-col justify-between p-4 sm:p-6 md:p-8">
          <Card className="border-0 shadow-none rounded-none bg-transparent">
            <CardHeader className="space-y-1.5 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription>
                Enter your credentials below to log in to your account
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email / Mobile Field (NO PLACEHOLDER) */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">
                    Email address or mobile number
                  </Label>
                  <Input
                    id="login-email"
                    type="text"
                    autoComplete="username"
                    {...register('email')}
                    className={errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Registered email address or 10-digit mobile number
                  </p>
                  {errors.email && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field (NO PLACEHOLDER) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">
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
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password')}
                      className={`pr-10 ${errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="flex items-center space-x-2 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="remember_me"
                      checked={!!rememberMe}
                      onChange={(e) => setValue('remember_me', e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background shadow-xs transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                      <Check className={`h-3 w-3 stroke-[3] text-white transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
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
                  className="w-full h-10 font-semibold shadow-xs"
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

              {/* Separator Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Auth Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full h-10 font-medium text-foreground bg-background hover:bg-muted/50 border-input shadow-xs flex items-center justify-center gap-2.5"
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
                <span>Google</span>
              </Button>
            </CardContent>

            <CardFooter className="pt-2 pb-6 flex justify-center">
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
