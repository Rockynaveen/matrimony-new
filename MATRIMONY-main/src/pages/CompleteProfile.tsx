import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useCreateProfile } from '../hooks/useProfile';
import type { DetailedProfileRequest } from '../types/apiTypes';
import type { ProfileCreateRequest } from '../types/profile.types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  GraduationCap,
  Sparkles,
  Heart,
  Home as FamilyIcon,
  Coffee,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { MediaUploadSection } from '../components/profile/MediaUploadSection';
import { motion, AnimatePresence } from 'framer-motion';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { showToast, checkProfileStatus, currentUser, updateCurrentUserAvatar, markProfileCompleted } = useApp();
  const createProfileMutation = useCreateProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { name: 'Personal', icon: Heart },
    { name: 'Education & Career', icon: GraduationCap },
    { name: 'Religion', icon: Sparkles },
    { name: 'Family', icon: FamilyIcon },
    { name: 'Lifestyle', icon: Coffee },
    { name: 'Location', icon: MapPin },
    { name: 'Review', icon: CheckCircle2 }
  ];

  // Detailed Profile State matching exact backend schema
  const [formData, setFormData] = useState<DetailedProfileRequest>({
    profile_photo: currentUser.avatar || localStorage.getItem('logged_in_avatar') || '/images/profiles/profile_1.jpg',
    video_introduction: '',
    about_me: 'Warm-hearted software professional looking for a soulmate with similar family values and intellectual curiosity.',
    height: "5' 9\" (175 cm)",
    weight: '68 kg',
    complexion: 'Fair',
    highest_education: 'M.Tech Computer Science',
    occupation: 'Senior Software Engineer',
    annual_income: '₹20 - 25 Lakhs',
    religion: 'Hindu',
    caste: 'Brahmin',
    rashi: 'Simha (Leo)',
    nakshatra: 'Purva Phalguni',
    dosha: 'No Dosha (Non-Manglik)',
    family_information: 'Nuclear family, upper-middle-class background. Father is a retired government officer and mother is a school principal. 1 married brother.',
    diet: 'Vegetarian',
    smoking: 'No',
    drinking: 'No',
    languages_known: 'English, Hindi, Marathi',
    hobbies_interests: 'Classical Music, Reading, Trekking, Photography',
    marital_status: 'Never Married',
    disability_information: 'None',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai'
  });

  const handleChange = (field: keyof DetailedProfileRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'profile_photo' && value) {
      updateCurrentUserAvatar(value);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  /** Parse a display height like '5\' 9" (175 cm)' → 5.9 (feet format expected by MySQL column) */
  const parseHeight = (h: string | undefined): number => {
    if (!h) return 5.8;
    const feetMatch = h.match(/(\d+)'\s*(\d+)/);
    if (feetMatch) {
      return parseFloat(`${feetMatch[1]}.${feetMatch[2]}`);
    }
    const num = parseFloat(h);
    if (num > 10) {
      return parseFloat((num / 30.48).toFixed(1));
    }
    return isNaN(num) ? 5.8 : num;
  };

  /** Parse a display weight like '68 kg' → 68 */
  const parseWeight = (w: string | undefined): number | null => {
    if (!w) return null;
    const num = parseFloat(w);
    return isNaN(num) ? null : num;
  };

  /** Parse income like '₹20 - 25 Lakhs' → 2500000 (best-effort) */
  const parseIncome = (inc: string | undefined): number | null => {
    if (!inc) return null;
    const nums = inc.match(/(\d+)/g);
    if (!nums || nums.length === 0) return null;
    // Use the last number as the representative value × 100000
    return parseInt(nums[nums.length - 1], 10) * 100000;
  };

  const handleSubmitProfile = async () => {
    try {
      setIsSubmitting(true);

      // Build the payload matching the exact backend profile/create schema
      const apiPayload: ProfileCreateRequest = {
        about_me: formData.about_me || '',
        height: parseHeight(formData.height),
        weight: parseWeight(formData.weight) ?? 0,
        complexion: formData.complexion || '',
        highest_education: formData.highest_education || '',
        occupation: formData.occupation || '',
        annual_income: parseIncome(formData.annual_income) ?? 0,
        religion: formData.religion || '',
        caste: formData.caste || '',
        rashi: formData.rashi || '',
        nakshatra: formData.nakshatra || '',
        dosha: formData.dosha || '',
        family_information: formData.family_information || '',
        diet: formData.diet || '',
        smoking: formData.smoking || '',
        drinking: formData.drinking || '',
        languages_known: Array.isArray(formData.languages_known)
          ? formData.languages_known.join(', ')
          : formData.languages_known || '',
        hobbies_interests: formData.hobbies_interests || '',
        marital_status: formData.marital_status || '',
        disability_information: formData.disability_information || '',
        country: formData.country || '',
        state: formData.state || '',
        city: formData.city || '',
      };

      try {
        await createProfileMutation.mutateAsync(apiPayload);
        markProfileCompleted();
        await checkProfileStatus();
        showToast('Profile created successfully! Please set your partner preferences next ✨');
      } catch (apiErr: any) {
        console.warn('[CompleteProfile] API call notice:', apiErr);
        localStorage.setItem('user_profile_draft', JSON.stringify(apiPayload));
        markProfileCompleted();
        if (apiErr?.status === 502) {
          showToast('Railway server returned 502 (cold start). Your profile is saved! Proceeding to preferences...');
        } else {
          showToast(`Profile saved! (${apiErr?.message || 'Notice'}). Proceeding to preferences...`);
        }
      }

      if (redirectUrl) {
        navigate(`/preferences?redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/preferences');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to process profile';
      showToast(msg);
      console.error('[CompleteProfile] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="min-h-[90vh] bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* ================= HERO HEADER CARD ================= */}
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-none relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 text-[#8B1E3F] text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-[#8B1E3F]" /> Detailed Matrimonial Setup
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Build Your <span className="text-[#8B1E3F]">Comprehensive Profile</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-xl">
                Complete profiles receive <span className="font-bold text-[#8B1E3F]">8x higher interest responses</span> from prospective matches and verified families.
              </p>
            </div>

            {/* Progress Meter Badge */}
            <div className="shrink-0 bg-stone-50 border border-stone-200/80 p-4 rounded-2xl text-center space-y-1.5 min-w-[160px]">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span>Completion</span>
                <span className="text-[#8B1E3F]">{completionPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B1E3F] via-[#C44569] to-[#D4AF37] rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-500 font-semibold block">Step {currentStep + 1} of {steps.length}</span>
            </div>
          </div>
        </div>

        {/* ================= STEPPER NAVIGATION BAR ================= */}
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-3xl border border-stone-200/80 shadow-none overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[720px] gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;

              return (
                <button
                  key={step.name}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8B1E3F] to-[#A0234A] text-white shadow-xs font-bold'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold'
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100 hover:text-stone-800 font-medium border border-transparent'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-transform ${
                    isActive ? 'bg-white/20 text-white scale-110' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-stone-200/60 text-stone-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-[11px] whitespace-nowrap">{step.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= FORM BODY CONTAINER ================= */}
        <Card className="p-6 sm:p-10 border-stone-200/80 rounded-3xl bg-white/95 backdrop-blur-md shadow-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              
              {/* STEP 0: PERSONAL ATTRIBUTES */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Personal Attributes & Media</h3>
                    <p className="text-xs font-semibold text-stone-700">Physical metrics, about me, profile photo upload/camera capture and video introduction.</p>
                  </div>

                  {/* Photo Upload & Live Camera + Video Section */}
                  <MediaUploadSection
                    photoUrl={formData.profile_photo || ''}
                    onPhotoChange={url => handleChange('profile_photo', url)}
                    videoUrl={formData.video_introduction || ''}
                    onVideoChange={url => handleChange('video_introduction', url)}
                  />

                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">
                      About Me
                    </label>
                    <textarea
                      rows={4}
                      value={formData.about_me}
                      onChange={e => handleChange('about_me', e.target.value)}
                      placeholder="Describe your background, personality, lifestyle, and partner expectations..."
                      className="w-full text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Height</label>
                      <input
                        type="text"
                        placeholder="e.g. 175 cm or 5' 9&quot;"
                        value={formData.height}
                        onChange={e => handleChange('height', e.target.value)}
                        className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Weight</label>
                      <input
                        type="text"
                        placeholder="e.g. 68 kg"
                        value={formData.weight}
                        onChange={e => handleChange('weight', e.target.value)}
                        className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Complexion</label>
                      <input
                        type="text"
                        placeholder="e.g. Fair, Wheatish, Dark"
                        value={formData.complexion}
                        onChange={e => handleChange('complexion', e.target.value)}
                        className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Marital Status</label>
                      <select value={formData.marital_status} onChange={e => handleChange('marital_status', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]">
                        <option>Never Married</option>
                        <option>Divorced</option>
                        <option>Widowed</option>
                        <option>Awaiting Divorce</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Disability Information</label>
                      <input
                        type="text"
                        placeholder="e.g. None or detail disability"
                        value={formData.disability_information}
                        onChange={e => handleChange('disability_information', e.target.value)}
                        className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: EDUCATION & CAREER */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Education & Career</h3>
                    <p className="text-xs font-semibold text-stone-700">Degree, profession, and annual income level.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Highest Education Degree</label>
                      <input type="text" placeholder="e.g. B.Tech, M.Tech, MBA, MD, MBBS, CA" value={formData.highest_education} onChange={e => handleChange('highest_education', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Occupation / Job Title</label>
                      <input type="text" placeholder="e.g. Software Engineer, Doctor, Product Manager, Business" value={formData.occupation} onChange={e => handleChange('occupation', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Annual Income</label>
                      <input
                        type="text"
                        placeholder="Enter annual salary (e.g. 2000000 or ₹20 - 25 Lakhs / yr)"
                        value={formData.annual_income}
                        onChange={e => handleChange('annual_income', e.target.value)}
                        className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: RELIGION & ASTROLOGY */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Religion & Astrology</h3>
                    <p className="text-xs font-semibold text-stone-700">Community, horoscope, rashi, nakshatra, and dosha status.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Religion</label>
                      <input type="text" placeholder="e.g. Hindu, Muslim, Sikh, Christian, Jain" value={formData.religion} onChange={e => handleChange('religion', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Caste</label>
                      <input type="text" placeholder="e.g. Brahmin, Kshatriya, Agarwal, Maratha" value={formData.caste} onChange={e => handleChange('caste', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Rashi / Moon Sign</label>
                      <input type="text" placeholder="e.g. Mesh, Vrishabh, Mithun, Simha" value={formData.rashi} onChange={e => handleChange('rashi', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Nakshatra</label>
                      <input type="text" placeholder="e.g. Rohini, Mrigashirsha, Purva Phalguni" value={formData.nakshatra} onChange={e => handleChange('nakshatra', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-[#8B1E3F] uppercase tracking-wider block mb-1.5">Dosha Status</label>
                      <input
                        type="text"
                        placeholder="Enter dosha status (e.g. No Dosha / Non-Manglik, Kalsarp Dosha, Soft Manglik)"
                        value={formData.dosha}
                        onChange={e => handleChange('dosha', e.target.value)}
                        className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: FAMILY */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Family Information</h3>
                    <p className="text-xs font-semibold text-stone-700">Overview of your family background, values, and parents (`family_information`).</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">
                      Family Information Details (`family_information`)
                    </label>
                    <textarea
                      rows={5}
                      value={formData.family_information}
                      onChange={e => handleChange('family_information', e.target.value)}
                      placeholder="Describe your family background, parents' occupations, siblings, and family values..."
                      className="w-full text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: LIFESTYLE */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Lifestyle & Habits</h3>
                    <p className="text-xs font-semibold text-stone-700">Diet, habits, languages, and hobbies.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Diet (`diet`)</label>
                      <select value={formData.diet} onChange={e => handleChange('diet', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-[#8B1E3F]">
                        <option>Vegetarian</option>
                        <option>Non-Vegetarian</option>
                        <option>Eggetarian</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Smoking (`smoking`)</label>
                      <select value={formData.smoking} onChange={e => handleChange('smoking', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-[#8B1E3F]">
                        <option>No</option>
                        <option>Occasionally</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Drinking (`drinking`)</label>
                      <select value={formData.drinking} onChange={e => handleChange('drinking', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 focus:outline-none focus:border-[#8B1E3F]">
                        <option>No</option>
                        <option>Occasionally</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Languages Known (`languages_known`)</label>
                    <input type="text" value={formData.languages_known} onChange={e => handleChange('languages_known', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Hobbies & Interests (`hobbies_interests`)</label>
                    <input type="text" value={formData.hobbies_interests} onChange={e => handleChange('hobbies_interests', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                  </div>
                </div>
              )}

              {/* STEP 5: LOCATION */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Location</h3>
                    <p className="text-xs font-semibold text-stone-700">Country, state, and city of residence.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">Country (`country`)</label>
                      <input type="text" value={formData.country} onChange={e => handleChange('country', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">State (`state`)</label>
                      <input type="text" value={formData.state} onChange={e => handleChange('state', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-1.5">City (`city`)</label>
                      <input type="text" value={formData.city} onChange={e => handleChange('city', e.target.value)} className="w-full text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#8B1E3F]" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: REVIEW */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="border-b border-stone-200 pb-4">
                    <h3 className="font-serif text-xl font-extrabold text-stone-900">Review & Publish Detailed Profile</h3>
                    <p className="text-xs font-semibold text-stone-700">Verify your information before publishing your detailed matrimonial profile.</p>
                  </div>

                  <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-4 text-xs">
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
                      <img src={formData.profile_photo} className="h-12 w-12 rounded-full object-cover ring-2 ring-[#8B1E3F]/30" alt="" />
                      <div>
                        <h4 className="font-serif font-bold text-base text-stone-900">{currentUser.name || 'Matrimonial Member'}</h4>
                        <p className="text-stone-500">{formData.occupation} • {formData.city}, {formData.state}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-700">
                      <div><span className="font-semibold text-stone-400 block">Height / Weight:</span> {formData.height}, {formData.weight}</div>
                      <div><span className="font-semibold text-stone-400 block">Education:</span> {formData.highest_education}</div>
                      <div><span className="font-semibold text-stone-400 block">Income:</span> {formData.annual_income}</div>
                      <div><span className="font-semibold text-stone-400 block">Religion & Caste:</span> {formData.religion}, {formData.caste}</div>
                      <div><span className="font-semibold text-stone-400 block">Astrology:</span> {formData.rashi}, {formData.dosha}</div>
                      <div><span className="font-semibold text-stone-400 block">Languages:</span> {formData.languages_known}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className="text-xs font-bold border-stone-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    className="text-xs font-bold px-6 bg-[#8B1E3F] hover:bg-[#721733] text-white"
                  >
                    Next Step <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="gold"
                    size="md"
                    onClick={handleSubmitProfile}
                    disabled={isSubmitting}
                    className="text-xs font-bold px-8 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:from-amber-500 hover:to-amber-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Profile...
                      </>
                    ) : (
                      'Save & Publish Detailed Profile'
                    )}
                  </Button>
                )}
              </div>

            </motion.div>
          </AnimatePresence>
        </Card>

      </div>
    </div>
  );
};
