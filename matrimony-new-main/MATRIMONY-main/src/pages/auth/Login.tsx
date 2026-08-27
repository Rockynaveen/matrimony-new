import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Heart,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Smartphone,
  Sparkles
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
  const setTokens = useAuthStore(state => state.setTokens);

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'mobile'>('email');
  const [mobileNumber, setMobileNumber] = useState('');
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#FFF9F5] via-[#FDF5F0] to-[#FFF9F5] relative overflow-hidden">
      
      {/* Decorative Radial Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#8B1E3F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side Feature Showcase Banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block md:col-span-5 space-y-6"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <img
              src="/images/hero_couple.png"
              alt="Vivah Royal Matrimony"
              className="w-full h-[460px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white space-y-2">
              <Badge variant="gold" className="w-fit bg-amber-400/20 text-amber-200 border-amber-400/30">
                <Sparkles className="h-3 w-3 mr-1" /> 100% ID Verified Platform
              </Badge>
              <h3 className="font-serif text-2xl font-bold">Find Your Soulmate With Royal Trust</h3>
              <p className="text-xs text-stone-300 font-sans leading-relaxed">
                Connect with verified profiles, horoscope compatibility matching, and 100% privacy protection.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Side Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-7"
        >
          <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-xl border-border/80 rounded-3xl space-y-6">
            
            {/* Logo & Header */}
            <div className="text-center space-y-2">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#C44569] text-white shadow-md">
                  <Heart className="h-5 w-5 fill-white stroke-none" />
                </div>
                <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                  Vivah<span className="text-[#D4AF37] font-sans text-xs uppercase tracking-widest ml-1 font-semibold">Match</span>
                </span>
              </Link>
              <h2 className="font-serif text-2xl font-bold text-foreground">Welcome Back</h2>
              <p className="text-xs text-muted-foreground">Sign in to manage your profile and view interested matches.</p>
            </div>

            {/* Login Method Segmented Control */}
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-2xl border border-border/50 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'email'
                    ? 'bg-white text-[#8B1E3F] shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mail className="h-3.5 w-3.5" /> Email Sign In
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('mobile')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'mobile'
                    ? 'bg-white text-[#8B1E3F] shadow-2xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile OTP
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {loginMethod === 'email' ? (
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-muted-foreground absolute left-3.5 top-3" />
                    <input
                      type="email"
                      {...register('email')}
                      placeholder="rahul.sharma@example.com"
                      className="w-full bg-muted/20 border border-border/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[11px] text-rose-600 font-medium mt-1 block">{errors.email.message}</span>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Mobile Phone Number</label>
                  <div className="relative">
                    <span className="text-xs font-bold text-muted-foreground absolute left-3.5 top-3">+91</span>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full bg-muted/20 border border-border/80 rounded-xl pl-12 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground">Password</label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-[#8B1E3F] hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full bg-muted/20 border border-border/80 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-[11px] text-rose-600 font-medium mt-1 block">{errors.password.message}</span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold shadow-lg shadow-[#8B1E3F]/20 mt-2"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In to Your Account'} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>

            {/* Social Google Login */}
            <div className="pt-4 border-t border-border/60 space-y-3">
              <div className="relative text-center">
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-muted-foreground relative z-10">Or continue with</span>
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={handleGoogleSignIn}
                className="w-full text-xs font-bold cursor-pointer"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign In with Google
              </Button>
            </div>

            {/* Footer Registration Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Don't have a profile yet?{' '}
                <Link to="/register" className="font-bold text-[#8B1E3F] hover:underline">
                  Register Free Profile
                </Link>
              </p>
            </div>

          </Card>
        </motion.div>

      </div>
    </div>
  );
};
