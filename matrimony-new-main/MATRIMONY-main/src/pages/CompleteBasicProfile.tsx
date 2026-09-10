import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { basicProfileSchema, getMaxDobDateString, isAtLeast18YearsOld, type BasicProfileFormData } from '../utils/validationSchemas';
import { useApp, extractNameFromEmail, isGenericName } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { CheckCircle2, Loader2, Eye, EyeOff, Lock, LogOut, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const CompleteBasicProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { currentUser, patchBasicProfile, onboardingStatus, logout, showToast } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const maxAllowedDob = getMaxDobDateString();

  useEffect(() => {
    if (onboardingStatus.registration_method !== 'google' || onboardingStatus.basic_profile_completed) {
      navigate('/profile/complete', { replace: true });
    }
  }, [navigate, onboardingStatus]);

  const storedName = localStorage.getItem('logged_in_name');
  const storedEmail = currentUser.email || localStorage.getItem('logged_in_email') || '';
  const emailName = extractNameFromEmail(storedEmail);

  let displayName = '';
  if (currentUser.name && !isGenericName(currentUser.name)) {
    displayName = currentUser.name;
  } else if (storedName && !isGenericName(storedName)) {
    displayName = storedName;
  } else {
    displayName = emailName;
  }

  const nameParts = displayName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const googleUser = {
    first_name: firstName,
    last_name: lastName,
    email: storedEmail
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BasicProfileFormData>({
    resolver: zodResolver(basicProfileSchema) as any,
    defaultValues: {
      gender: 'Male',
      date_of_birth: '',
      phone: '',
      register_for: 'SELF',
      password: '',
      confirm_password: ''
    }
  });

  const onSubmit = async (data: BasicProfileFormData) => {
    if (!isAtLeast18YearsOld(data.date_of_birth)) {
      showToast('You must be 18 years or older to proceed.');
      return;
    }
    try {
      setIsSubmitting(true);
      await patchBasicProfile({
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        phone: data.phone,
        register_for: data.register_for || 'SELF',
        password: data.password,
        confirm_password: data.confirm_password
      });
      localStorage.setItem('login_method', 'google');
      setIsSuccess(true);
      showToast('Basic profile saved successfully! Continuing to detailed profile...');
      if (redirectUrl) {
        navigate(`/profile/complete?redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/profile/complete');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update basic profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Card className="w-full rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 md:p-10 lg:p-12 space-y-8">
          {!isSuccess ? (
            <>
              {/* Top Horizontal Header & Google Verification Pill */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Quick Google Onboarding</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-foreground">
                    Complete Basic Profile
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Review your account details and set your password to begin finding matches.
                  </p>
                </div>

                {/* Google Verified Identity Pill */}
                <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-2.5 shrink-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {googleUser.first_name ? googleUser.first_name[0] : 'G'}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-foreground">
                        {displayName || 'Google User'}
                      </span>
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                    </div>
                    <span className="text-[11px] text-muted-foreground block truncate max-w-[200px] sm:max-w-[240px]">
                      {googleUser.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Section 1: Personal Details (4-Column Full-Width Horizontal Grid) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Personal Details
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Profile For */}
                    <div className="space-y-1.5">
                      <Label htmlFor="basic-register-for">Creating Profile For</Label>
                      <select
                        id="basic-register-for"
                        {...register('register_for')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
                      >
                        <option value="SELF">Myself</option>
                        <option value="SON">Son</option>
                        <option value="DAUGHTER">Daughter</option>
                        <option value="BROTHER">Brother</option>
                        <option value="SISTER">Sister</option>
                        <option value="RELATIVE">Relative</option>
                        <option value="FRIEND">Friend</option>
                      </select>
                      {errors.register_for && (
                        <p className="text-xs font-medium text-destructive">{errors.register_for.message}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                      <Label htmlFor="basic-gender">Gender</Label>
                      <select
                        id="basic-gender"
                        {...register('gender')}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 cursor-pointer"
                      >
                        <option value="Male">Male (Groom)</option>
                        <option value="Female">Female (Bride)</option>
                      </select>
                      {errors.gender && (
                        <p className="text-xs font-medium text-destructive">{errors.gender.message}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1.5">
                      <Label htmlFor="basic-dob">Date of Birth</Label>
                      <Input
                        id="basic-dob"
                        type="date"
                        max={maxAllowedDob}
                        {...register('date_of_birth')}
                        className={errors.date_of_birth ? 'border-destructive' : ''}
                      />
                      <p className="text-[11px] text-muted-foreground">Must be 18 years or older</p>
                      {errors.date_of_birth && (
                        <p className="text-xs font-medium text-destructive">{errors.date_of_birth.message}</p>
                      )}
                    </div>

                    {/* Mobile Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="basic-phone">Mobile Number</Label>
                      <Input
                        id="basic-phone"
                        type="tel"
                        autoComplete="tel"
                        {...register('phone')}
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      <p className="text-[11px] text-muted-foreground">10-digit primary mobile number</p>
                      {errors.phone && (
                        <p className="text-xs font-medium text-destructive">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Account Security (Horizontal Grid) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" /> Create Account Password
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="basic-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="basic-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...register('password')}
                          className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
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
                      <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
                      {errors.password && (
                        <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="basic-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="basic-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...register('confirm_password')}
                          className={`pr-10 ${errors.confirm_password ? 'border-destructive' : ''}`}
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
                        <p className="text-xs font-medium text-destructive">{errors.confirm_password.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      logout();
                      showToast('Logged out. You can log in anytime to resume registration.');
                      navigate('/login');
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground h-10 justify-start sm:justify-center"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" /> Save & Log Out (Resume Later)
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-8 text-sm font-semibold shadow-sm sm:w-auto w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save & Continue to Detailed Profile'
                    )}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Success Confirmation State */
            <div className="text-center py-8 space-y-5">
              <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Profile Updated Successfully
                </h2>
                <p className="text-xs text-muted-foreground">
                  Your basic information has been saved in our system.
                </p>
              </div>

              <div className="pt-2 max-w-sm mx-auto flex flex-col gap-2.5">
                <Button
                  onClick={() => navigate('/profile/complete')}
                  className="w-full h-11 text-sm font-semibold shadow-sm"
                >
                  Continue to Detailed Profile
                </Button>
                
                <Button
                  onClick={() => {
                    logout();
                    showToast('Logged out. You can log in anytime to continue your profile.');
                    navigate('/login');
                  }}
                  variant="outline"
                  className="w-full h-10 text-xs font-medium border-input text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" /> Log Out & Resume Later
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};
