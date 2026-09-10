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
import { Eye, EyeOff, Loader2, Check, CheckCircle2 } from 'lucide-react';
import { GoogleAuthModal } from '../components/auth/GoogleAuthModal';
import { motion } from 'framer-motion';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { registerUser, googleRegisterUser, updateCurrentUserAvatar, showToast } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxAllowedDob = getMaxDobDateString();

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
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
      showToast('OTP sent to your mobile number.');
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
      showToast('Mobile number verified successfully.');
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

  const onSubmit = async (data: RegisterFormData) => {
    if (!isAtLeast18YearsOld(data.date_of_birth)) {
      showToast('You must be 18 years or older to register.');
      return;
    }
    if (otpSent && !otpVerified) {
      showToast('Please verify the OTP sent to your mobile number.');
      return;
    }
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

      const manualName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      if (manualName) {
        localStorage.setItem('logged_in_name', manualName);
      }
      if (data.email) {
        localStorage.setItem('logged_in_email', data.email);
      }

      showToast('Registration successful. Please complete your detailed profile.');
      const target = redirectUrl ? `/profile/complete?redirect=${encodeURIComponent(redirectUrl)}` : '/profile/complete';
      navigate(target);
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

      const formValues = getValues();
      await googleRegisterUser({
        first_name: firstName || formValues.first_name || 'User',
        last_name: lastName || formValues.last_name || '',
        email: email || formValues.email,
        google_id: tokenPayload?.sub || 'google_user',
        password: formValues.password || 'GoogleAuth@2026!',
        confirm_password: formValues.confirm_password || formValues.password || 'GoogleAuth@2026!',
        date_of_birth: formValues.date_of_birth || '2000-01-01',
        gender: formValues.gender || 'Male',
        phone: formValues.phone || '9999999999',
        register_for: formValues.register_for || 'SELF'
      });

      showToast('Google Registration successful. Please complete your basic profile.');
      if (redirectUrl) {
        navigate(`/complete-basic-profile?redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/complete-basic-profile');
      }
    } catch (err: any) {
      const msg = err.message || 'Google Registration failed';
      if (msg.toLowerCase().includes('already')) {
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
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
      >
        {/* Left Side: Visual Image */}
        <div className="hidden lg:block lg:col-span-5 relative overflow-hidden bg-stone-900 min-h-[650px]">
          <img
            src="/images/auth_couple_bg.jpg"
            alt="Vivah Royal Matrimony"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>

        {/* Right Side: shadcn Form Card */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 md:p-10">
          <Card className="border-0 shadow-none rounded-none bg-transparent">
            <CardHeader className="space-y-1.5 pb-4">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create an account
              </CardTitle>
              <CardDescription>
                Fill out the required information below to register your matrimonial profile
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Profile For */}
                <div className="space-y-1.5">
                  <Label htmlFor="register-for">
                    Creating profile for
                  </Label>
                  <select
                    id="register-for"
                    {...register('register_for')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
                    <p className="text-xs font-medium text-destructive">
                      {errors.register_for.message}
                    </p>
                  )}
                </div>

                {/* Name Row (First Name, Last Name) - NO PLACEHOLDERS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="first-name">
                      First name
                    </Label>
                    <Input
                      id="first-name"
                      type="text"
                      autoComplete="given-name"
                      {...register('first_name')}
                      className={errors.first_name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                    />
                    {errors.first_name && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="last-name">
                      Last name
                    </Label>
                    <Input
                      id="last-name"
                      type="text"
                      autoComplete="family-name"
                      {...register('last_name')}
                      className={errors.last_name ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                    />
                    {errors.last_name && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gender and Date of Birth Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      {...register('gender')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <option value="Male">Male (Groom)</option>
                      <option value="Female">Female (Bride)</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dob">
                      Date of birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      max={maxAllowedDob}
                      {...register('date_of_birth')}
                      className={errors.date_of_birth ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                    />
                    <p className="text-[11px] text-muted-foreground">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-email">
                      Email address
                    </Label>
                    <Input
                      id="register-email"
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
                      <Label htmlFor="register-phone">
                        Mobile number
                      </Label>
                      {otpVerified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="register-phone"
                        type="tel"
                        autoComplete="tel"
                        disabled={otpVerified}
                        {...register('phone')}
                        className={`flex-1 ${
                          otpVerified
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                            : errors.phone
                            ? 'border-destructive focus-visible:ring-destructive/30'
                            : ''
                        }`}
                      />
                      {!otpVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendOtp(currentPhone)}
                          disabled={isSendingOtp || otpCooldown > 0}
                          className="shrink-0 h-10 px-3 text-xs font-medium border-input"
                        >
                          {isSendingOtp ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : otpCooldown > 0 ? (
                            `${otpCooldown}s`
                          ) : otpSent ? (
                            'Resend'
                          ) : (
                            'Send OTP'
                          )}
                        </Button>
                      )}
                    </div>
                    {errors.phone && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* OTP Verification Box if OTP was sent and not verified */}
                {otpSent && !otpVerified && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2.5">
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
                            className="h-10 w-9 text-center text-base font-semibold border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                          />
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleVerifyOtp(currentPhone)}
                        disabled={isVerifyingOtp || otpCode.join('').length < 6}
                        className="h-10 px-4 text-xs font-semibold"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="register-password">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
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
                    <p className="text-[11px] text-muted-foreground">
                      Minimum 6 characters
                    </p>
                    {errors.password && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="register-confirm-password">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirm_password')}
                        className={`pr-10 ${errors.confirm_password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="space-y-1 pt-1">
                  <div className="flex items-start space-x-2.5">
                    <label className="relative inline-flex items-center cursor-pointer select-none mt-0.5">
                      <input
                        type="checkbox"
                        id="accept_terms"
                        checked={!!acceptTerms}
                        onChange={(e) => setValue('accept_terms', e.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background shadow-xs transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                        <Check className={`h-3 w-3 stroke-[3] text-white transition-opacity ${acceptTerms ? 'opacity-100' : 'opacity-0'}`} />
                      </span>
                    </label>
                    <Label htmlFor="accept_terms" className="text-xs font-normal text-muted-foreground leading-relaxed cursor-pointer">
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
                  className="w-full h-11 text-sm font-semibold shadow-sm"
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
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google Register Button */}
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
      />
    </div>
  );
};
