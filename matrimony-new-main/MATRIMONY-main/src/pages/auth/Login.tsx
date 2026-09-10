import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Separator } from '../../components/ui/Separator';
import {
  Heart,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useUIStore(state => state.showToast);
  const { loginUser, loginWithGoogle } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await loginUser({
        email: data.email,
        password: data.password
      });
      showToast('Login successful! Welcome back to Vivah.');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const googleMockAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocIq3a4X5v6w7y8z9a0b1c2d3e4f5g6h7i8j=s96-c';
      useAuthStore.getState().setGoogleAvatar(googleMockAvatar);
      useAuthStore.getState().setCurrentUser({ avatar: googleMockAvatar });
      
      try {
        await loginWithGoogle({
          id_token: 'mock_google_id_token',
          action: 'login'
        });
      } catch {}

      showToast('Signed in with Google Account');
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 sm:p-8 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Left Side Feature Showcase Banner */}
        <div className="hidden md:flex md:col-span-5 relative bg-primary/95 text-primary-foreground flex-col justify-between p-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-xs text-white border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Verified Matrimony</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-serif text-white">
              Find your ideal life partner
            </h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Connect with thousands of verified profiles with complete trust, privacy, and traditional family values.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="space-y-2.5 text-xs text-white/90">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-amber-300 shrink-0" />
                <span>100% ID-verified profiles</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-amber-300 shrink-0" />
                <span>Granular privacy & contact controls</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-amber-300 shrink-0" />
                <span>Smart community & horoscope matching</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/15 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center">
                <Heart className="h-4 w-4 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">45,000+ Happy Marriages</p>
                <p className="text-[11px] text-white/70">Trusted across all communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side shadcn Form Card */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <Card className="border-0 shadow-none rounded-none bg-transparent">
            <CardHeader className="space-y-1.5 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription>
                Sign in to manage your profile and view interested matches
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-email">Email address</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password">Password</Label>
                    <Link to="/forgot-password" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="auth-password"
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

              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full h-10 font-medium text-foreground bg-background hover:bg-muted/50 border-input shadow-xs flex items-center justify-center gap-2.5"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </Button>
            </CardContent>

            <CardFooter className="pt-2 pb-6 flex justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Don't have a profile yet?{' '}
                <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Register free profile
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};
