import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import type { ProfileUpdateRequest } from '../../types/profile.types';
import type { DetailedProfileRequest } from '../../types/apiTypes';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MediaUploadSection } from '../../components/profile/MediaUploadSection';
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
  Loader2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotsLoader } from '../../components/ui/LoadingScreen';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, checkProfileStatus, currentUser, updateCurrentUserAvatar } = useApp();
  const { data: profile, isLoading, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();
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

  // Detailed Profile State matching exact backend schema pre-filled with entered fields
  const [formData, setFormData] = useState<DetailedProfileRequest>({
    profile_photo: currentUser.avatar || localStorage.getItem('logged_in_avatar') || '/images/profiles/profile_1.jpg',
    video_introduction: '',
    about_me: '',
    height: '',
    weight: '',
    complexion: '',
    highest_education: '',
    occupation: '',
    annual_income: '',
    religion: '',
    caste: '',
    rashi: '',
    nakshatra: '',
    dosha: '',
    family_information: '',
    diet: 'Vegetarian',
    smoking: 'No',
    drinking: 'No',
    languages_known: '',
    hobbies_interests: '',
    marital_status: 'Never Married',
    disability_information: 'None',
    country: 'India',
    state: '',
    city: ''
  });

  // Pre-fill form state when backend profile or local draft loads
  useEffect(() => {
    const localDraftRaw = localStorage.getItem('user_profile_draft');
    const localDraft = localDraftRaw ? JSON.parse(localDraftRaw) : null;
    const rawSource: any = profile || localDraft;
    const source = rawSource?.data || rawSource?.profile || rawSource;

    if (source) {
      const photo = source.profile_photo || source.photo || source.avatar || source.profile_image || currentUser.avatar || localStorage.getItem('logged_in_avatar');
      setFormData(prev => ({
        ...prev,
        profile_photo: photo || prev.profile_photo,
        video_introduction: source.video_introduction || prev.video_introduction,
        about_me: source.about_me || source.about || source.bio || prev.about_me,
        height: source.height ? String(source.height) : prev.height,
        weight: source.weight ? String(source.weight) : prev.weight,
        complexion: source.complexion || prev.complexion,
        highest_education: source.highest_education || source.education || source.qualification || prev.highest_education,
        occupation: source.occupation || source.profession || source.job_title || prev.occupation,
        annual_income: source.annual_income ? String(source.annual_income) : (source.income ? String(source.income) : prev.annual_income),
        religion: source.religion || prev.religion,
        caste: source.caste || prev.caste,
        rashi: source.rashi || prev.rashi,
        nakshatra: source.nakshatra || prev.nakshatra,
        dosha: source.dosha || prev.dosha,
        family_information: source.family_information || source.family_details || source.family || prev.family_information,
        diet: Array.isArray(source.diet) ? source.diet.join(', ') : (source.diet || prev.diet),
        smoking: Array.isArray(source.smoking) ? source.smoking.join(', ') : (source.smoking || prev.smoking),
        drinking: Array.isArray(source.drinking) ? source.drinking.join(', ') : (source.drinking || prev.drinking),
        languages_known: Array.isArray(source.languages_known) ? source.languages_known.join(', ') : (source.languages_known || source.languages || source.mother_tongue || prev.languages_known),
        hobbies_interests: Array.isArray(source.hobbies_interests) ? source.hobbies_interests.join(', ') : (source.hobbies_interests || source.hobbies || source.interests || prev.hobbies_interests),
        marital_status: Array.isArray(source.marital_status) ? source.marital_status.join(', ') : (source.marital_status || source.maritalStatus || prev.marital_status),
        disability_information: source.disability_information || source.disability || prev.disability_information,
        country: source.country || prev.country,
        state: source.state || prev.state,
        city: source.city || prev.city
      }));

      if (photo) {
        updateCurrentUserAvatar(photo);
      }
    }
  }, [profile]);

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

  const parseHeight = (h: string | undefined): number => {
    if (!h) return 5.8;
    const feetMatch = String(h).match(/(\d+)'\s*(\d+)/);
    if (feetMatch) {
      return parseFloat(`${feetMatch[1]}.${feetMatch[2]}`);
    }
    const num = parseFloat(String(h));
    if (num > 10) {
      return parseFloat((num / 30.48).toFixed(1));
    }
    return isNaN(num) ? 5.8 : num;
  };

  const parseWeight = (w: string | undefined): number | null => {
    if (!w) return null;
    const num = parseFloat(String(w));
    return isNaN(num) ? null : num;
  };

  const parseIncome = (inc: string | undefined): number | null => {
    if (!inc) return null;
    const nums = String(inc).match(/(\d+)/g);
    if (!nums || nums.length === 0) return null;
    return parseInt(nums[nums.length - 1], 10) * 100000;
  };

  const handleSaveProfile = async () => {
    try {
      setIsSubmitting(true);

      const putPayload: ProfileUpdateRequest = {
        profile_photo: formData.profile_photo || null,
        video_introduction: formData.video_introduction || null,
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
        city: formData.city || ''
      };

      try {
        await updateProfileMutation.mutateAsync(putPayload);
        await checkProfileStatus();
        showToast('Profile updated successfully! ✨');
      } catch (apiErr: any) {
        console.warn('[EditProfile] API call notice:', apiErr);
        localStorage.setItem('user_profile_draft', JSON.stringify(putPayload));
        showToast(`Profile changes saved! (${apiErr?.message || 'Notice'})`);
      }

      refetch();
      navigate('/profile');
    } catch (err: any) {
      const msg = err?.message || 'Failed to update profile';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="min-h-[90vh] bg-transparent py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        
        {/* Back to Profile Button */}
        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center text-xs font-bold text-stone-700 hover:text-[#8B1E3F] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Profile
        </button>

        {/* Loading Indicator (3rd Loading State) */}
        {isLoading && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-3">
              <DotsLoader size="sm" />
              <span>Fetching latest profile information...</span>
            </div>
          </div>
        )}

        {/* HERO HEADER CARD */}
        <div className="bg-white/95 backdrop-blur-md p-4 sm:p-8 rounded-3xl border border-stone-200/80 shadow-none relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="space-y-1.5 sm:space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 text-[#8B1E3F] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-[#8B1E3F]" /> Edit Matrimonial Profile
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
                Update Your <span className="text-[#8B1E3F]">Profile Details</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-semibold max-w-xl">
                Edit your entered information step-by-step or save your changes anytime.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 w-full md:w-auto">
              {/* Save Quick Action Button */}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSaveProfile}
                disabled={isSubmitting}
                className="bg-[#8B1E3F] hover:bg-[#721733] text-white font-extrabold text-xs px-6 h-11 shadow-md w-full sm:w-auto justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save All Changes 💾
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* STEPPER NAVIGATION BAR (Smooth Swiping on Mobile) */}
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-3xl border border-stone-200/80 shadow-none overflow-x-auto touch-pan-x scrollbar-none">
          <div className="flex items-center min-w-[620px] sm:min-w-[720px] gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;

              return (
                <button
                  key={step.name}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2 px-2 rounded-2xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8B1E3F] to-[#A0234A] text-white shadow-xs font-bold'
                      : 'bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-900 font-semibold border border-stone-200/60'
                  }`}
                >
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center transition-transform ${
                    isActive ? 'bg-white/20 text-white scale-110' : 'bg-stone-200/80 text-stone-700'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] whitespace-nowrap">{step.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN STEP FORM CONTAINER */}
        <Card className="p-4 sm:p-6 md:p-8 bg-white/95 backdrop-blur-md border border-stone-200/80 shadow-none rounded-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step Title Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
                    {React.createElement(steps[currentStep].icon, { className: "h-5 w-5 text-[#8B1E3F]" })}
                    Step {currentStep + 1}: {steps[currentStep].name} Details
                  </h3>
                  <p className="text-xs text-stone-600 font-semibold mt-0.5">Fill out your information accurately for higher match accuracy.</p>
                </div>
                <span className="text-xs font-extrabold text-[#8B1E3F] bg-[#8B1E3F]/10 px-3 py-1 rounded-full border border-[#8B1E3F]/20 shrink-0">
                  {currentStep + 1} / {steps.length}
                </span>
              </div>

              {/* Step Forms */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">About Myself (Bio)</label>
                    <textarea
                      rows={4}
                      value={formData.about_me || ''}
                      onChange={e => setFormData({ ...formData, about_me: e.target.value })}
                      placeholder="Write a brief intro about your personality, values, and family background..."
                      className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Height (Feet/Inches)</label>
                      <input
                        type="text"
                        placeholder="e.g. 5' 8&quot; or 5.6"
                        value={formData.height || ''}
                        onChange={e => setFormData({ ...formData, height: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Weight (Kg)</label>
                      <input
                        type="text"
                        placeholder="e.g. 68 kg"
                        value={formData.weight || ''}
                        onChange={e => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Complexion</label>
                      <select
                        value={formData.complexion || 'Fair'}
                        onChange={e => setFormData({ ...formData, complexion: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      >
                        <option value="Fair">Fair</option>
                        <option value="Very Fair">Very Fair</option>
                        <option value="Wheatish">Wheatish</option>
                        <option value="Wheatish Brown">Wheatish Brown</option>
                        <option value="Dark">Dark</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">Marital Status</label>
                    <select
                      value={formData.marital_status || 'Never Married'}
                      onChange={e => setFormData({ ...formData, marital_status: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                    >
                      <option value="Never Married">Never Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  {/* Media Upload Section */}
                  <div className="pt-4 border-t border-stone-100">
                    <MediaUploadSection
                      photoUrl={formData.profile_photo || ''}
                      onPhotoChange={url => setFormData(prev => ({ ...prev, profile_photo: url }))}
                      videoUrl={formData.video_introduction || ''}
                      onVideoChange={url => setFormData(prev => ({ ...prev, video_introduction: url }))}
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Highest Education</label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech / MBA / MD"
                        value={formData.highest_education || ''}
                        onChange={e => setFormData({ ...formData, highest_education: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Occupation / Profession</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Software Engineer"
                        value={formData.occupation || ''}
                        onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">Annual Income</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹18 Lakhs / annum"
                      value={formData.annual_income || ''}
                      onChange={e => setFormData({ ...formData, annual_income: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Religion</label>
                      <input
                        type="text"
                        placeholder="e.g. Hindu / Muslim / Sikh"
                        value={formData.religion || ''}
                        onChange={e => setFormData({ ...formData, religion: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Caste / Subcaste</label>
                      <input
                        type="text"
                        placeholder="e.g. Brahmin (Gaur)"
                        value={formData.caste || ''}
                        onChange={e => setFormData({ ...formData, caste: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Rashi (Moon Sign)</label>
                      <input
                        type="text"
                        placeholder="e.g. Mesh / Vrishabh"
                        value={formData.rashi || ''}
                        onChange={e => setFormData({ ...formData, rashi: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Nakshatra (Star)</label>
                      <input
                        type="text"
                        placeholder="e.g. Rohini"
                        value={formData.nakshatra || ''}
                        onChange={e => setFormData({ ...formData, nakshatra: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Dosha Status</label>
                      <input
                        type="text"
                        placeholder="e.g. Non-Manglik"
                        value={formData.dosha || ''}
                        onChange={e => setFormData({ ...formData, dosha: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-900 mb-1">Family Information & Values</label>
                    <textarea
                      rows={5}
                      value={formData.family_information || ''}
                      onChange={e => setFormData({ ...formData, family_information: e.target.value })}
                      placeholder="Describe your family background, parents' occupations, siblings, and family values..."
                      className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-[#8B1E3F]"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Diet</label>
                      <select
                        value={formData.diet || 'Vegetarian'}
                        onChange={e => setFormData({ ...formData, diet: e.target.value as any })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      >
                        <option value="Vegetarian">Vegetarian</option>
                        <option value="Non-Vegetarian">Non-Vegetarian</option>
                        <option value="Eggetarian">Eggetarian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Smoking</label>
                      <select
                        value={formData.smoking || 'No'}
                        onChange={e => setFormData({ ...formData, smoking: e.target.value as any })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      >
                        <option value="No">No</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Drinking</label>
                      <select
                        value={formData.drinking || 'No'}
                        onChange={e => setFormData({ ...formData, drinking: e.target.value as any })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      >
                        <option value="No">No</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Languages Known</label>
                      <input
                        type="text"
                        placeholder="e.g. English, Hindi, Kannada, Marathi"
                        value={formData.languages_known || ''}
                        onChange={e => setFormData({ ...formData, languages_known: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Hobbies & Interests</label>
                      <input
                        type="text"
                        placeholder="e.g. Photography, Travelling, Music"
                        value={formData.hobbies_interests || ''}
                        onChange={e => setFormData({ ...formData, hobbies_interests: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru"
                        value={formData.city || ''}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Karnataka"
                        value={formData.state || ''}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1">Country</label>
                      <input
                        type="text"
                        placeholder="e.g. India"
                        value={formData.country || 'India'}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-300 rounded-2xl p-3 text-xs font-bold text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="bg-stone-50 p-4 sm:p-6 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
                      <img
                        src={formData.profile_photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'}
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#8B1E3F]"
                        alt="Profile avatar preview"
                      />
                      <div>
                        <h4 className="font-serif text-lg font-bold text-stone-900">{currentUser.name || 'Member Profile'}</h4>
                        <p className="text-xs text-stone-600 font-semibold">{formData.occupation || 'Professional'} • {formData.city || 'Location'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-800 font-bold text-xs">
                      <div><span className="font-extrabold text-stone-950 block">Height / Weight:</span> {formData.height}, {formData.weight}</div>
                      <div><span className="font-extrabold text-stone-950 block">Education:</span> {formData.highest_education}</div>
                      <div><span className="font-extrabold text-stone-950 block">Income:</span> {formData.annual_income}</div>
                      <div><span className="font-extrabold text-stone-950 block">Religion & Caste:</span> {formData.religion}, {formData.caste}</div>
                      <div><span className="font-extrabold text-stone-950 block">Astrology:</span> {formData.rashi}, {formData.dosha}</div>
                      <div><span className="font-extrabold text-stone-950 block">Languages:</span> {formData.languages_known}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls (Mobile Optimized Stack) */}
              <div className="pt-6 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className="w-full sm:w-auto text-xs font-bold border-stone-200 justify-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous Step
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {currentStep < steps.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={handleNext}
                      className="w-full sm:w-auto flex-1 sm:flex-initial text-xs font-bold border-stone-300 text-stone-700 hover:bg-stone-100 justify-center"
                    >
                      Next Step <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleSaveProfile}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto flex-1 sm:flex-initial text-xs font-bold px-6 bg-[#8B1E3F] hover:bg-[#721733] text-white shadow-2xs justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin inline" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </Card>

      </div>
    </div>
  );
};
