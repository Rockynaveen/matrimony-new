import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { basicProfileSchema, type BasicProfileFormData } from '../utils/validationSchemas';
import { useApp, extractNameFromEmail, isGenericName } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CheckCircle2, Loader2, UserCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const CompleteBasicProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { currentUser, patchBasicProfile, showToast } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('login_method') !== 'google_register') {
      navigate('/profile/complete', { replace: true });
    }
  }, [navigate]);

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
      showToast('Basic information saved successfully! Proceeding to detailed profile...');
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
    <div className="min-h-[85vh] bg-gradient-to-b from-[#FFF8F3] via-white to-[#FFF8F3] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full"
      >
        <Card className="p-8 sm:p-10 shadow-2xl border-stone-200/80 rounded-3xl bg-white/95 backdrop-blur-md">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <Badge variant="gold" className="px-3.5 py-1 text-xs uppercase tracking-widest font-bold mx-auto">
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Quick Google Onboarding
            </Badge>
            <h1 className="font-serif text-3xl font-extrabold text-stone-900">
              Complete Your Basic Information
            </h1>
            <p className="text-xs text-stone-500 font-sans">
              Please enter your gender, date of birth, and phone number to complete basic account setup.
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Read-Only Google Info */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      First Name
                    </label>
                    <p className="text-xs font-bold text-stone-900 mt-0.5">{googleUser.first_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Last Name
                    </label>
                    <p className="text-xs font-bold text-stone-900 mt-0.5">{googleUser.last_name}</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <p className="text-xs font-bold text-stone-900 mt-0.5">{googleUser.email}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Profile For
                  </label>
                  <select
                    {...register('register_for')}
                    className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
                  >
                    <option value="SELF">Self</option>
                    <option value="SON">Son</option>
                    <option value="DAUGHTER">Daughter</option>
                    <option value="BROTHER">Brother</option>
                    <option value="SISTER">Sister</option>
                    <option value="RELATIVE">Relative</option>
                    <option value="FRIEND">Friend</option>
                  </select>
                  {errors.register_for && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">{errors.register_for.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
                  >
                    <option value="Male">Male (Groom)</option>
                    <option value="Female">Female (Bride)</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    {...register('date_of_birth')}
                    className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
                  />
                  {errors.date_of_birth && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">{errors.date_of_birth.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    {...register('phone')}
                    className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
                  />
                  {errors.phone && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Account Password Section */}
              <div className="space-y-4 pt-2 border-t border-stone-200/80">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#8B1E3F]">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Create Account Password</span>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new account password"
                      {...register('password')}
                      className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-3 pr-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-extrabold text-stone-800 uppercase tracking-wider block mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      {...register('confirm_password')}
                      className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl p-3 pr-10 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs font-semibold text-rose-500 mt-1">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-bold shadow-lg shadow-[#8B1E3F]/20 text-sm h-12 mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Basic Profile...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </form>
          ) : (
            /* Success Confirmation State */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6 space-y-6"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  ✓ Profile Updated Successfully
                </h3>
                <p className="text-xs text-stone-600 font-medium">
                  Your basic information has been saved in our system.
                </p>
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <Button
                  onClick={() => navigate('/profile/complete')}
                  variant="primary"
                  size="lg"
                  className="w-full font-bold text-sm h-12 shadow-md"
                >
                  Continue to Detailed Profile
                </Button>
                
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  size="lg"
                  className="w-full font-bold text-xs h-10 border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Go directly to Dashboard
                </Button>
              </div>
            </motion.div>
          )}

        </Card>
      </motion.div>
    </div>
  );
};
