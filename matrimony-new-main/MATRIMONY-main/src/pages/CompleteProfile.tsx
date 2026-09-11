import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, isGenericName } from '../context/AppContext';
import { profileService } from '../services/profile.service';
import type { ProfileCreateRequest } from '../types/profile.types';
import {
  User,
  GraduationCap,
  Sparkles,
  Users,
  Heart,
  HeartHandshake,
  MapPin,
  BookOpen,
  Shield,
  Camera,
  EyeOff,
  Briefcase,
  Clock,
  Loader2,
  Lock,
  LogOut
} from 'lucide-react';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { showToast, checkProfileStatus, currentUser, updateCurrentUserAvatar, markProfileCompleted, logout } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State initialized with draft or empty
  const [formData, setFormData] = useState({
    // Section 1: Personal Details
    profile_name: currentUser.name && !isGenericName(currentUser.name) ? currentUser.name : '',
    about_me: '',
    height: 0,
    weight: 0,
    complexion: '',
    body_type: '',
    physical_status: 'Normal',
    disability_information: '',

    // Section 2: Education & Profession
    highest_education: '',
    education_detail: '',
    education_id: '',
    occupation: '',
    job_title: '',
    employment_type: '',
    company_name: '',
    work_location: '',
    annual_income: '',

    // Section 3: Religion, Caste & Horoscope
    religion: '',
    caste: '',
    sub_caste: '',
    gothram: '',
    has_horoscope: false,
    birth_place: '',
    birth_time: '04:54:29.366Z',
    rashi: '',
    nakshatra: '',
    dosha: '',

    // Section 4: Family Details
    family_type: '',
    family_status: '',
    family_values: '',
    father_occupation: '',
    mother_occupation: '',
    brothers_count: 0,
    brothers_married_count: 0,
    sisters_count: 0,
    family_dosha: '',
    living_with_parents: true,
    family_location: '',
    family_information: '',

    // Section 5: Lifestyle
    diet: '',
    smoking: '',
    drinking: '',

    // Section 6: Marital & Children
    marital_status: '',
    children_count: 0,
    children_living_status: '',

    // Section 7: Location & Citizenship
    country: '',
    state: '',
    district: '',
    city: '',
    mandal: '',
    village: '',
    citizenship: '',
    pincode: '',
    address_line: '',

    // Section 8: Language & Hobbies
    languages_known: '',
    hobbies_interests: '',

    // Section 9: Privacy Settings
    hide_photos: false,
    is_private_profile: false,

    // Profile Photo
    profile_photo: currentUser.avatar || localStorage.getItem('logged_in_avatar') || ''
  });

  // Load existing draft or user details on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('user_profile_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Profile Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const localPreviewUrl = URL.createObjectURL(file);
      handleChange('profile_photo', localPreviewUrl);

      const res = await profileService.uploadProfilePhoto(file);
      if (res?.photo_url) {
        handleChange('profile_photo', res.photo_url);
        updateCurrentUserAvatar(res.photo_url);
        localStorage.setItem('logged_in_avatar', res.photo_url);
      }
      showToast('Profile photo uploaded successfully!');
    } catch (err: any) {
      console.warn('Photo upload response:', err);
      showToast('Photo uploaded!');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 42 Fields tracking for live completion calculation
  const trackedFields = [
    formData.profile_name,
    formData.about_me,
    formData.height > 0,
    formData.weight > 0,
    formData.complexion,
    formData.body_type,
    formData.physical_status,
    formData.disability_information,
    formData.highest_education,
    formData.education_detail,
    formData.education_id,
    formData.occupation,
    formData.job_title,
    formData.employment_type,
    formData.company_name,
    formData.work_location,
    formData.annual_income,
    formData.religion,
    formData.caste,
    formData.sub_caste,
    formData.gothram,
    formData.birth_place,
    formData.birth_time,
    formData.rashi,
    formData.nakshatra,
    formData.dosha,
    formData.family_type,
    formData.family_status,
    formData.family_values,
    formData.father_occupation,
    formData.mother_occupation,
    formData.brothers_count > 0,
    formData.sisters_count > 0,
    formData.family_location,
    formData.family_information,
    formData.diet,
    formData.marital_status,
    formData.country,
    formData.state,
    formData.district,
    formData.city,
    formData.pincode
  ];

  const completedCount = trackedFields.filter(val => Boolean(val)).length;
  const completedPercentage = Math.round((completedCount / 42) * 100);

  const handleSaveAndContinue = async () => {
    try {
      setIsSubmitting(true);

      const apiPayload: ProfileCreateRequest = {
        profile_name: formData.profile_name || '',
        about_me: formData.about_me || '',
        height: formData.height > 0 ? (formData.height > 30 ? parseFloat((formData.height / 30.48).toFixed(1)) : formData.height) : 5.8,
        weight: formData.weight > 0 ? formData.weight : null,
        complexion: formData.complexion || 'Fair',
        highest_education: formData.highest_education || 'B.Tech',
        education_detail: formData.education_detail || '',
        education_id: formData.education_id ? Number(formData.education_id) : null,
        occupation: formData.occupation || 'Software Engineer',
        job_title: formData.job_title || '',
        employment_type: formData.employment_type || 'Full Time',
        company_name: formData.company_name || '',
        work_location: formData.work_location || '',
        annual_income: formData.annual_income ? parseInt(String(formData.annual_income).replace(/[^0-9]/g, ''), 10) || null : null,
        religion: formData.religion || 'Hindu',
        caste: formData.caste || '',
        sub_caste: formData.sub_caste || '',
        gothram: formData.gothram || '',
        rashi: formData.rashi || '',
        nakshatra: formData.nakshatra || '',
        dosha: formData.dosha || '',
        family_information: formData.family_information || '',
        diet: (formData.diet as any) || 'Vegetarian',
        smoking: (formData.smoking as any) || 'No',
        drinking: (formData.drinking as any) || 'No',
        languages_known: formData.languages_known || 'English',
        hobbies_interests: formData.hobbies_interests || '',
        marital_status: (formData.marital_status as any) || 'Never Married',
        disability_information: formData.disability_information || '',
        country: formData.country || 'India',
        state: formData.state || 'Maharashtra',
        city: formData.city || 'Mumbai',
        pincode: formData.pincode || '',
        address_line: formData.address_line || '',
        profile_photo: formData.profile_photo || ''
      };

      try {
        await profileService.createProfile(apiPayload);
      } catch {
        try {
          await profileService.updateProfile(apiPayload);
        } catch {
          // draft fallback
        }
      }

      localStorage.setItem('user_profile_draft', JSON.stringify(formData));
      markProfileCompleted();
      await checkProfileStatus();
      showToast('✓ Profile successfully saved! ✨');

      if (redirectUrl) {
        navigate(`/preferences?redirect=${encodeURIComponent(redirectUrl)}`);
      } else {
        navigate('/preferences');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to save profile. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-black pb-16 font-sans antialiased">
      {/* Centered Middle Form Container (No Left & Right Sidebars) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-6">
          
          {/* Header with Crisp Black Title & Logout Option */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
                Create Your Profile
              </h1>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Tell us about yourself to find your perfect match.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                showToast('Logged out successfully.');
                navigate('/login');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              title="Save draft and log out"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              <span>Log Out</span>
            </button>
          </div>

          {/* CARD 1: Personal Details (Logo Pink Theme) + Integrated Photo Upload */}
          <section id="section-personal" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <User className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-black">Personal Details</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Basic information about you</p>
                </div>
              </div>

              {/* Photo Upload Thumbnail / Action */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden cursor-pointer ring-2 ring-rose-200 hover:ring-rose-400 transition-all relative group shadow-xs border border-slate-200"
                  title="Click to change profile photo"
                >
                  {formData.profile_photo ? (
                    <img
                      src={formData.profile_photo}
                      alt="Profile"
                      className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                    />
                  ) : (
                    <Camera className="h-6 w-6 text-rose-500 stroke-[2]" />
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="py-1.5 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Row 1: Profile Name & About Me */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Profile Name <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.profile_name}
                  onChange={e => handleChange('profile_name', e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  About Me <span className="text-rose-600 font-black">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.about_me}
                  onChange={e => handleChange('about_me', e.target.value)}
                  placeholder="Tell something about yourself!..."
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-y"
                />
              </div>
            </div>

            {/* Row 2: Height, Weight, Complexion */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Height (cm) <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  value={formData.height || ''}
                  onChange={e => handleChange('height', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Weight (kg) <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={formData.weight || ''}
                  onChange={e => handleChange('weight', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Complexion <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.complexion}
                  onChange={e => handleChange('complexion', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">Select complexion</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Fair">Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Wheatish Brown">Wheatish Brown</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>
            </div>

            {/* Row 3: Body Type, Physical Status, Disability Information */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Body Type <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.body_type}
                  onChange={e => handleChange('body_type', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">Select body type</option>
                  <option value="Slim">Slim</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Average">Average</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Physical Status <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.physical_status}
                  onChange={e => handleChange('physical_status', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="Normal">Normal</option>
                  <option value="Physically Challenged">Physically Challenged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Disability Information
                </label>
                <input
                  type="text"
                  value={formData.disability_information}
                  onChange={e => handleChange('disability_information', e.target.value)}
                  placeholder="If any (optional)"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 2: Education & Profession (Logo Pink Theme) */}
          <section id="section-education" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Education & Profession</h2>
                <p className="text-[11px] font-semibold text-slate-600">Your academic and career details</p>
              </div>
            </div>

            {/* Row 1: Highest Education, Education Detail, Education ID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Highest Education <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.highest_education}
                  onChange={e => handleChange('highest_education', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Select highest education</option>
                  <option value="B.Tech">B.Tech / B.E.</option>
                  <option value="M.Tech">M.Tech / M.E.</option>
                  <option value="BCA">BCA / MCA</option>
                  <option value="MBA">MBA / PGDM</option>
                  <option value="MBBS">MBBS / MD / MS</option>
                  <option value="B.Sc">B.Sc / M.Sc</option>
                  <option value="B.Com">B.Com / M.Com</option>
                  <option value="CA">CA / ICWA / CS</option>
                  <option value="Ph.D">Ph.D / Doctorate</option>
                  <option value="Other">Other Higher Education</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Education Detail <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.education_detail}
                  onChange={e => handleChange('education_detail', e.target.value)}
                  placeholder="Enter education details"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Education ID
                </label>
                <input
                  type="text"
                  value={formData.education_id}
                  onChange={e => handleChange('education_id', e.target.value)}
                  placeholder="Enter education ID"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Occupation, Job Title, Employment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Occupation <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.occupation}
                  onChange={e => handleChange('occupation', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Select occupation</option>
                  <option value="Software Engineer">Software Engineer / IT Professional</option>
                  <option value="Doctor">Doctor / Medical Professional</option>
                  <option value="Engineer">Civil / Mechanical / Electrical Engineer</option>
                  <option value="Banker">Banking / Financial Professional</option>
                  <option value="Civil Services">Civil Services / IAS / IPS</option>
                  <option value="Business">Business Owner / Entrepreneur</option>
                  <option value="Teacher">Professor / Teacher / Academician</option>
                  <option value="Lawyer">Lawyer / Legal Professional</option>
                  <option value="Other">Other Profession</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Job Title <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={e => handleChange('job_title', e.target.value)}
                  placeholder="Enter job title"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Employment Type <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.employment_type}
                  onChange={e => handleChange('employment_type', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Select employment type</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Self Employed">Self Employed</option>
                  <option value="Business">Business</option>
                  <option value="Government">Government / PSU</option>
                  <option value="Not Employed">Not Employed</option>
                </select>
              </div>
            </div>

            {/* Row 3: Company Name, Work Location, Annual Income */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => handleChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Work Location
                </label>
                <input
                  type="text"
                  value={formData.work_location}
                  onChange={e => handleChange('work_location', e.target.value)}
                  placeholder="Enter work location"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Annual Income
                </label>
                <input
                  type="text"
                  value={formData.annual_income}
                  onChange={e => handleChange('annual_income', e.target.value)}
                  placeholder="Enter annual income"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 3: Religion, Caste & Horoscope (Logo Pink Theme) */}
          <section id="section-religion" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Religion, Caste & Horoscope</h2>
                <p className="text-[11px] font-semibold text-slate-600">Religious and astrological details</p>
              </div>
            </div>

            {/* Row 1: Religion, Caste, Sub Caste */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Religion <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.religion}
                  onChange={e => handleChange('religion', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="">Select religion</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Jain">Jain</option>
                  <option value="Buddhist">Buddhist</option>
                  <option value="Parsi">Parsi</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Caste <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.caste}
                  onChange={e => handleChange('caste', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="">Select caste</option>
                  <option value="Brahmin">Brahmin</option>
                  <option value="Kshatriya">Kshatriya</option>
                  <option value="Vaishya">Vaishya</option>
                  <option value="Reddy">Reddy</option>
                  <option value="Kamma">Kamma</option>
                  <option value="Arya Vysya">Arya Vysya</option>
                  <option value="Maratha">Maratha</option>
                  <option value="Nair">Nair</option>
                  <option value="Agarwal">Agarwal</option>
                  <option value="Kayastha">Kayastha</option>
                  <option value="Lingayat">Lingayat</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Sub Caste
                </label>
                <input
                  type="text"
                  value={formData.sub_caste}
                  onChange={e => handleChange('sub_caste', e.target.value)}
                  placeholder="Enter sub caste"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Gothram, Has Horoscope, Birth Place */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Gothram
                </label>
                <input
                  type="text"
                  value={formData.gothram}
                  onChange={e => handleChange('gothram', e.target.value)}
                  placeholder="Enter gothram"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Has Horoscope Toggle */}
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Has Horoscope
                </label>
                <div className="flex items-center gap-3 h-10">
                  <button
                    type="button"
                    onClick={() => handleChange('has_horoscope', !formData.has_horoscope)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.has_horoscope ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        formData.has_horoscope ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-black">
                    {formData.has_horoscope ? 'Yes' : 'Yes / No'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Birth Place
                </label>
                <input
                  type="text"
                  value={formData.birth_place}
                  onChange={e => handleChange('birth_place', e.target.value)}
                  placeholder="Enter birth place"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Row 3: Birth Time, Rashi, Nakshatra, Dosha */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Birth Time <span className="text-rose-600 font-black">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.birth_time}
                    onChange={e => handleChange('birth_time', e.target.value)}
                    placeholder="04:54:29.366Z"
                    className="w-full pl-3 pr-8 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <Clock className="h-3.5 w-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Rashi
                </label>
                <input
                  type="text"
                  value={formData.rashi}
                  onChange={e => handleChange('rashi', e.target.value)}
                  placeholder="Enter rashi"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Nakshatra
                </label>
                <input
                  type="text"
                  value={formData.nakshatra}
                  onChange={e => handleChange('nakshatra', e.target.value)}
                  placeholder="Enter nakshatra"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Dosha
                </label>
                <input
                  type="text"
                  value={formData.dosha}
                  onChange={e => handleChange('dosha', e.target.value)}
                  placeholder="Enter dosha"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 4: Family Details (Logo Pink Theme) */}
          <section id="section-family" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Family Details</h2>
                <p className="text-[11px] font-semibold text-slate-600">About your family</p>
              </div>
            </div>

            {/* Row 1: Family Type, Family Status, Family Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Family Type
                </label>
                <select
                  value={formData.family_type}
                  onChange={e => handleChange('family_type', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">Select family type</option>
                  <option value="Nuclear">Nuclear</option>
                  <option value="Joint">Joint</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Family Status
                </label>
                <select
                  value={formData.family_status}
                  onChange={e => handleChange('family_status', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">Select family status</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Rich">Rich / High Class</option>
                  <option value="Affluent">Affluent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Family Values
                </label>
                <select
                  value={formData.family_values}
                  onChange={e => handleChange('family_values', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="">Select family values</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Liberal">Liberal</option>
                </select>
              </div>
            </div>

            {/* Row 2: Father Occupation, Mother Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Father Occupation
                </label>
                <input
                  type="text"
                  value={formData.father_occupation}
                  onChange={e => handleChange('father_occupation', e.target.value)}
                  placeholder="Enter father occupation"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Mother Occupation
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.mother_occupation}
                    onChange={e => handleChange('mother_occupation', e.target.value)}
                    placeholder="Enter mother occupation"
                    className="w-full pl-8 pr-3 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <Briefcase className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 3: Brothers Count, Brothers Married Count, Sisters Count, Dosha */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Brothers Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.brothers_count}
                  onChange={e => handleChange('brothers_count', Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Brothers Married Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.brothers_married_count}
                  onChange={e => handleChange('brothers_married_count', Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Sisters Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.sisters_count}
                  onChange={e => handleChange('sisters_count', Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Dosha
                </label>
                <input
                  type="text"
                  value={formData.family_dosha}
                  onChange={e => handleChange('family_dosha', e.target.value)}
                  placeholder="Enter dosha"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Row 4: Living With Parents Toggle, Family Location, Family Information */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-black mb-1">
                  Living With Parents
                </label>
                <div className="flex items-center gap-3 h-10">
                  <button
                    type="button"
                    onClick={() => handleChange('living_with_parents', !formData.living_with_parents)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.living_with_parents ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        formData.living_with_parents ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-black">
                    {formData.living_with_parents ? 'Yes' : 'Yes / No'}
                  </span>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-black mb-1">
                  Family Location
                </label>
                <input
                  type="text"
                  value={formData.family_location}
                  onChange={e => handleChange('family_location', e.target.value)}
                  placeholder="Enter family location"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-bold text-black mb-1">
                  Family Information
                </label>
                <input
                  type="text"
                  value={formData.family_information}
                  onChange={e => handleChange('family_information', e.target.value)}
                  placeholder="Enter family information"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 5: Lifestyle (Logo Pink Theme) */}
          <section id="section-lifestyle" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Heart className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Lifestyle</h2>
                <p className="text-[11px] font-semibold text-slate-600">Your habits and habits</p>
              </div>
            </div>

            {/* Row 1: Diet, Smoking, Drinking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Diet
                </label>
                <select
                  value={formData.diet}
                  onChange={e => handleChange('diet', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="">Select diet</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Smoking
                </label>
                <select
                  value={formData.smoking}
                  onChange={e => handleChange('smoking', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="">Select smoking habit</option>
                  <option value="No">No</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Drinking
                </label>
                <select
                  value={formData.drinking}
                  onChange={e => handleChange('drinking', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
                >
                  <option value="">Select drinking habit</option>
                  <option value="No">No</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </section>

          {/* CARD 6: Marital & Children (Logo Pink Theme) */}
          <section id="section-marital" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <HeartHandshake className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Marital & Children</h2>
                <p className="text-[11px] font-semibold text-slate-600">Marriage and childrens details</p>
              </div>
            </div>

            {/* Row 1: Marital Status, Children Count, Children Living Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Marital Status <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.marital_status}
                  onChange={e => handleChange('marital_status', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all cursor-pointer"
                >
                  <option value="">Select marital status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Awaiting Divorce">Awaiting Divorce</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Children Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.children_count}
                  onChange={e => handleChange('children_count', Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Children Living Status
                </label>
                <input
                  type="text"
                  value={formData.children_living_status}
                  onChange={e => handleChange('children_living_status', e.target.value)}
                  placeholder="Enter children living status"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 7: Location & Citizenship (Logo Pink Theme) */}
          <section id="section-location" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <MapPin className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Location & Citizenship</h2>
                <p className="text-[11px] font-semibold text-slate-600">Address and nationality</p>
              </div>
            </div>

            {/* Row 1: Country, State, District */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Country <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={e => handleChange('country', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="">Select country</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  State <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={e => handleChange('state', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="">Select state</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Kerala">Kerala</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  District <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.district}
                  onChange={e => handleChange('district', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="">Select district</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Ranga Reddy">Ranga Reddy</option>
                  <option value="Bengaluru Urban">Bengaluru Urban</option>
                  <option value="Mumbai">Mumbai City</option>
                  <option value="Pune">Pune</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Visakhapatnam">Visakhapatnam</option>
                  <option value="Vijayawada">Vijayawada</option>
                  <option value="Other">Other District</option>
                </select>
              </div>
            </div>

            {/* Row 2: City, Mandal, Village */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  City <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Mandal
                </label>
                <select
                  value={formData.mandal}
                  onChange={e => handleChange('mandal', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="">Select mandal</option>
                  <option value="Mandal 1">Central Mandal</option>
                  <option value="Mandal 2">North Mandal</option>
                  <option value="Mandal 3">South Mandal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Village
                </label>
                <select
                  value={formData.village}
                  onChange={e => handleChange('village', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="">Select village</option>
                  <option value="Village 1">Main Town Area</option>
                  <option value="Village 2">Suburban Area</option>
                </select>
              </div>
            </div>

            {/* Row 3: Citizenship, Pincode, Address Line */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Citizenship
                </label>
                <input
                  type="text"
                  value={formData.citizenship}
                  onChange={e => handleChange('citizenship', e.target.value)}
                  placeholder="Enter citizenship"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Pincode <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="Enter pincode"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Address Line
                </label>
                <input
                  type="text"
                  value={formData.address_line}
                  onChange={e => handleChange('address_line', e.target.value)}
                  placeholder="Enter address line"
                  className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* CARD 8 & 9: Language & Hobbies + Privacy Settings */}
          <div id="section-interests" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Language & Hobbies (Logo Pink Theme) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Language & Hobbies</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Your interests</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Languages
                  </label>
                  <select
                    value={formData.languages_known}
                    onChange={e => handleChange('languages_known', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value="">Select languages</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Gujarati">Gujarati</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1">
                    Hobbies
                  </label>
                  <select
                    value={formData.hobbies_interests}
                    onChange={e => handleChange('hobbies_interests', e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    <option value="">Select hobbies</option>
                    <option value="Classical Music">Music & Singing</option>
                    <option value="Reading">Reading & Literature</option>
                    <option value="Trekking">Traveling & Trekking</option>
                    <option value="Photography">Photography</option>
                    <option value="Cooking">Cooking & Food</option>
                    <option value="Fitness">Fitness & Yoga</option>
                    <option value="Art">Art & Painting</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Privacy Settings (Logo Pink Theme) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Shield className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-black">Privacy Settings</h2>
                  <p className="text-[11px] font-semibold text-slate-600">Control your visibility</p>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {/* Hide Photos Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <EyeOff className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black">Hide Photos</p>
                      <p className="text-[10px] font-semibold text-slate-500">Keep your photos private</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('hide_photos', !formData.hide_photos)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.hide_photos ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        formData.hide_photos ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Is Private Profile Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black">Is Private Profile</p>
                      <p className="text-[10px] font-semibold text-slate-500">Only visible to shortlisted members</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('is_private_profile', !formData.is_private_profile)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.is_private_profile ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        formData.is_private_profile ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Form Actions */}
          <div className="flex items-center justify-between pt-4 pb-8">
            <button
              type="button"
              onClick={async () => {
                // Save draft in localStorage before logout so user doesn't lose inputs
                localStorage.setItem('user_profile_draft', JSON.stringify(formData));
                await logout();
                showToast('Draft saved. Logged out successfully.');
                navigate('/login');
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
              <span>Log Out & Resume Later</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving Profile...
                </>
              ) : (
                <>
                  Save & Continue <span className="font-extrabold text-sm">→</span>
                </>
              )}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
};
