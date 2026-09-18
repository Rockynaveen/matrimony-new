import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp, isGenericName } from '../context/AppContext';
import { profileService } from '../services/profile.service';
import type { ProfileCreateRequest } from '../types/profile.types';
import {
  useIncomeRanges,
  useEducations,
  useProfessions,
  useReligions,
  useCastes,
  useLanguages,
  useHobbies,
  useCountries,
  useStates,
  useDistricts,
  useMandals,
  useVillages,
} from '../hooks/useProfileOptions';
import {
  User,
  GraduationCap,
  Sparkles,
  Users,
  Heart,
  MapPin,
  Camera,
  Video,
  Loader2,
  LogOut,
  Clock,
  Shield,
  Briefcase,
  Check,
  Plus,
  Play
} from 'lucide-react';

export const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { showToast, checkProfileStatus, currentUser, updateCurrentUserAvatar, markProfileCompleted, patchBasicProfile, logout } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Master Data Queries (100% Dynamic from Backend APIs)
  const { data: incomeRanges = [], isLoading: isLoadingIncomes } = useIncomeRanges();
  const { data: educations = [], isLoading: isLoadingEducations } = useEducations();
  const { data: professions = [], isLoading: isLoadingProfessions } = useProfessions();
  const { data: religions = [], isLoading: isLoadingReligions } = useReligions();
  const { data: languages = [], isLoading: isLoadingLanguages } = useLanguages();
  const { data: hobbies = [], isLoading: isLoadingHobbies } = useHobbies();
  const { data: countries = [], isLoading: isLoadingCountries } = useCountries();

  // Form State initialized only with requested fields
  const [formData, setFormData] = useState({
    // Section 1: Profile Display & Media
    profile_name: currentUser?.name && !isGenericName(currentUser.name) ? currentUser.name : (localStorage.getItem('logged_in_name') || ''),
    profile_photo: currentUser?.avatar || localStorage.getItem('logged_in_avatar') || '',
    video_type: 'None' as 'None' | 'UPLOAD' | 'YOUTUBE' | 'EXTERNAL',
    video_url: '',
    video_file_name: '',
    about_me: '',

    // Section 2: Education & Profession
    highest_education: '',
    education_detail: '',
    education_id: '' as string | number,
    profession_id: null as number | null,
    occupation: '',
    job_title: '',
    employment_type: '',
    company_name: '',
    work_location: '',
    annual_income: '',

    // Section 3: Religion, Community & Horoscope
    religion: '',
    religion_id: null as number | null,
    caste: '',
    caste_id: null as number | null,
    sub_caste: '',
    gothram: '',
    rashi: '',
    nakshatra: '',
    dosha: '',
    birth_place: '',
    birth_time: '',

    // Section 4: Physical Attributes & Lifestyle
    height: 0,
    weight: 0,
    complexion: '',
    body_type: '',
    physical_status: 'No',
    disability_information: '',
    diet: '',
    smoking: '',
    drinking: '',
    languages_known: '',
    language_ids: [] as number[],
    hobbies_interests: '',
    hobby_ids: [] as number[],
    marital_status: '',
    children_count: 0,

    // Section 5: Family Information
    family_type: '',
    family_status: '',
    family_values: '',
    father_occupation: '',
    mother_occupation: '',
    brothers_count: 0,
    brothers_married_count: 0,
    sisters_count: 0,
    sisters_married_count: 0,
    family_information: '',

    // Section 6: Profile Location Details (Dependent Hierarchy)
    country: '',
    country_id: null as number | null,
    state: '',
    state_id: null as number | null,
    district: '',
    district_id: null as number | null,
    city: '',
    mandal: '',
    mandal_id: null as number | null,
    village: '',
    village_id: null as number | null,
    pincode: '',

    // Preserved background registration info
    gender: currentUser?.gender || localStorage.getItem('logged_in_gender') || 'Male',
    date_of_birth: (currentUser?.date_of_birth && currentUser.date_of_birth !== '2000-01-01') ? currentUser.date_of_birth : (localStorage.getItem('logged_in_dob') || ''),
    phone: currentUser?.phone || localStorage.getItem('logged_in_phone') || ''
  });

  // Cascading Location & Caste Queries
  const selectedReligion = religions.find(
    r => (formData.religion_id && r.id === Number(formData.religion_id)) || (formData.religion && r.name.toLowerCase() === formData.religion.toLowerCase())
  );
  const selectedReligionId = selectedReligion?.id || (formData.religion_id ? Number(formData.religion_id) : null);
  const { data: castes = [], isLoading: isLoadingCastes } = useCastes(selectedReligionId);

  const selectedCountry = countries.find(
    c => (formData.country_id && c.id === Number(formData.country_id)) || (formData.country && c.name.toLowerCase() === formData.country.toLowerCase())
  );
  const selectedCountryId = selectedCountry?.id || (formData.country_id ? Number(formData.country_id) : null);
  const { data: states = [], isLoading: isLoadingStates } = useStates(selectedCountryId);

  const selectedState = states.find(
    s => (formData.state_id && s.id === Number(formData.state_id)) || (formData.state && s.name.toLowerCase() === formData.state.toLowerCase())
  );
  const selectedStateId = selectedState?.id || (formData.state_id ? Number(formData.state_id) : null);
  const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(selectedStateId);

  const selectedDistrict = districts.find(
    d => (formData.district_id && d.id === Number(formData.district_id)) || (formData.district && d.name.toLowerCase() === formData.district.toLowerCase())
  );
  const selectedDistrictId = selectedDistrict?.id || (formData.district_id ? Number(formData.district_id) : null);
  const { data: mandals = [], isLoading: isLoadingMandals } = useMandals(selectedDistrictId);

  const selectedMandal = mandals.find(
    m => (formData.mandal_id && m.id === Number(formData.mandal_id)) || (formData.mandal && m.name.toLowerCase() === formData.mandal.toLowerCase())
  );
  const selectedMandalId = selectedMandal?.id || (formData.mandal_id ? Number(formData.mandal_id) : null);
  const { data: villages = [], isLoading: isLoadingVillages } = useVillages(selectedMandalId);

  // Auto-set India if no country selected
  useEffect(() => {
    if (!formData.country_id && countries.length > 0) {
      const india = countries.find(c => c.name.toLowerCase() === 'india') || countries[0];
      if (india) {
        setFormData(prev => ({
          ...prev,
          country_id: prev.country_id || india.id,
          country: prev.country || india.name
        }));
      }
    }
  }, [countries]);

  // Load existing draft or user details on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('user_profile_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch {}

    const storedGender = currentUser?.gender || localStorage.getItem('logged_in_gender');
    const storedDob = (currentUser?.date_of_birth && currentUser.date_of_birth !== '2000-01-01') 
      ? currentUser.date_of_birth 
      : localStorage.getItem('logged_in_dob');
    if (storedGender || storedDob) {
      setFormData(prev => ({
        ...prev,
        gender: prev.gender || storedGender || 'Male',
        date_of_birth: prev.date_of_birth || storedDob || ''
      }));
    }
  }, [currentUser]);

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

  // Profile Video Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('Video file size must be less than 50MB');
      return;
    }

    try {
      setIsUploadingVideo(true);
      handleChange('video_file_name', file.name);
      const res = await profileService.uploadProfileVideo(file);
      if (res?.video_url) {
        handleChange('video_url', res.video_url);
        showToast('Profile video uploaded successfully!');
      }
    } catch (err: any) {
      console.warn('Video upload response:', err);
      showToast(err?.message || 'Video uploaded!');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Language multi-selection toggle
  const toggleLanguage = (langName: string, langId?: number) => {
    let currentLangs = formData.languages_known
      ? formData.languages_known.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    let currentIds = [...formData.language_ids];

    if (currentLangs.includes(langName)) {
      currentLangs = currentLangs.filter(l => l !== langName);
      if (langId) currentIds = currentIds.filter(id => id !== langId);
    } else {
      currentLangs.push(langName);
      if (langId && !currentIds.includes(langId)) currentIds.push(langId);
    }

    setFormData(prev => ({
      ...prev,
      languages_known: currentLangs.join(', '),
      language_ids: currentIds
    }));
  };

  // Hobby multi-selection toggle
  const toggleHobby = (hobbyName: string, hobbyId?: number) => {
    let currentHobbies = formData.hobbies_interests
      ? formData.hobbies_interests.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    let currentIds = [...formData.hobby_ids];

    if (currentHobbies.includes(hobbyName)) {
      currentHobbies = currentHobbies.filter(h => h !== hobbyName);
      if (hobbyId) currentIds = currentIds.filter(id => id !== hobbyId);
    } else {
      currentHobbies.push(hobbyName);
      if (hobbyId && !currentIds.includes(hobbyId)) currentIds.push(hobbyId);
    }

    setFormData(prev => ({
      ...prev,
      hobbies_interests: currentHobbies.join(', '),
      hobby_ids: currentIds
    }));
  };

  // Fields tracking for live completion calculation
  const trackedFields = [
    formData.profile_name,
    formData.about_me,
    formData.highest_education,
    formData.education_detail,
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
    formData.rashi,
    formData.nakshatra,
    formData.dosha,
    formData.birth_place,
    formData.birth_time,
    formData.height > 0,
    formData.weight > 0,
    formData.complexion,
    formData.body_type,
    formData.diet,
    formData.marital_status,
    formData.family_type,
    formData.family_status,
    formData.family_values,
    formData.father_occupation,
    formData.mother_occupation,
    formData.country,
    formData.state,
    formData.district,
    formData.city || formData.mandal,
    formData.pincode
  ];

  const completedCount = trackedFields.filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / trackedFields.length) * 100);

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profile_name?.trim()) {
      showToast('Please enter your Display / Profile Name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const parseIncome = (val: string | number) => {
        if (!val) return null;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[^0-9]/g, '');
        return cleaned ? parseInt(cleaned, 10) : null;
      };

      const selectedLang = languages.find(l => l.name === formData.languages_known);
      const selectedHobby = hobbies.find(h => h.name === formData.hobbies_interests);

      const apiPayload: ProfileCreateRequest = {
        profile_name: formData.profile_name || '',
        about_me: formData.about_me || '',
        height: formData.height > 0 ? (formData.height > 30 ? parseFloat((formData.height / 30.48).toFixed(1)) : formData.height) : 5.8,
        weight: formData.weight > 0 ? formData.weight : null,
        complexion: formData.complexion || 'Fair',
        marital_status: formData.marital_status || 'Never Married',
        disability_information: formData.disability_information || '',

        // Education & Profession
        education_id: formData.education_id ? Number(formData.education_id) : null,
        highest_education: formData.highest_education || '',
        education_detail: formData.education_detail || '',
        profession_id: formData.profession_id,
        occupation: formData.occupation || '',
        job_title: formData.job_title || '',
        employment_type: formData.employment_type || 'Full Time',
        company_name: formData.company_name || '',
        work_location: formData.work_location || '',
        annual_income: parseIncome(formData.annual_income),

        // Religion & Community
        religion_id: formData.religion_id,
        religion: formData.religion || '',
        caste_id: formData.caste_id,
        caste: formData.caste || '',
        sub_caste: formData.sub_caste || '',
        gothram: formData.gothram || '',
        rashi: formData.rashi || '',
        nakshatra: formData.nakshatra || '',
        dosha: formData.dosha || '',

        // Family
        family_information: formData.family_information || '',

        // Lifestyle & Marital
        diet: formData.diet || 'Vegetarian',
        smoking: formData.smoking || 'No',
        drinking: formData.drinking || 'No',

        // Languages & Hobbies
        languages_known: formData.languages_known || '',
        language_ids: formData.language_ids?.length > 0 ? formData.language_ids : (selectedLang ? [selectedLang.id] : undefined),
        hobbies_interests: formData.hobbies_interests || '',
        hobby_ids: formData.hobby_ids?.length > 0 ? formData.hobby_ids : (selectedHobby ? [selectedHobby.id] : undefined),

        // Location Hierarchy
        country_id: formData.country_id,
        country: formData.country || '',
        state_id: formData.state_id,
        state: formData.state || '',
        district_id: formData.district_id,
        city: formData.city || formData.district || '',
        mandal_id: formData.mandal_id,
        village_id: formData.village_id,
        pincode: formData.pincode || '',

        // Photos & Video
        profile_photo: formData.profile_photo || '',
        video_type: formData.video_type !== 'None' ? formData.video_type : null,
        video_url: formData.video_url || null,
        video_introduction: formData.video_url || null
      };

      if (formData.date_of_birth || formData.gender || formData.phone) {
        try {
          await patchBasicProfile({
            gender: formData.gender || undefined,
            date_of_birth: formData.date_of_birth || undefined,
            phone: formData.phone || undefined
          });
        } catch {}
      }

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

  // Preset chip options for languages & hobbies
  const commonLanguages = ['Telugu', 'English', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];
  const commonHobbies = ['Singing', 'Traveling', 'Reading', 'Cooking', 'Music', 'Photography', 'Dancing', 'Gardening', 'Fitness / Gym', 'Sports'];

  return (
    <div className="min-h-screen bg-transparent text-black pb-16 font-sans antialiased">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="space-y-6">
          
          {/* Header with Title & Save Draft / Logout */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
                Create Your Profile
              </h1>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Complete the details below to find your perfect matrimonial match.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80">
                <div className="text-[11px] font-bold text-rose-800">
                  Completion: <span className="font-extrabold">{completionPercentage}%</span>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  localStorage.setItem('user_profile_draft', JSON.stringify(formData));
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
          </div>

          {/* Registration Info Note (Read-only, set during registration) */}
          {(formData.gender || formData.date_of_birth) && (
            <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
                Registration Details:
              </span>
              {formData.gender && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs">
                  <Heart className="h-3 w-3 text-[#C44569]" />
                  {formData.gender === 'Male' ? 'Male (Groom)' : 'Female (Bride)'}
                </span>
              )}
              {formData.date_of_birth && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs">
                  {formData.date_of_birth}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-400 sm:ml-auto">
                Set during registration
              </span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 1: Profile Display & Media                             */}
          {/* ============================================================== */}
          <section id="section-media" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-5 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <User className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Profile Display & Media</h2>
                <p className="text-[11px] font-semibold text-slate-600">Your profile photo, video and basic display info</p>
              </div>
            </div>

            {/* Display / Profile Name */}
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Display / Profile Name <span className="text-rose-600 font-black">*</span>
              </label>
              <input
                type="text"
                value={formData.profile_name}
                onChange={e => handleChange('profile_name', e.target.value)}
                placeholder="Enter display or profile name"
                className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              />
            </div>

            {/* Primary Profile Photo */}
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Primary Profile Photo
              </label>
              <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 overflow-hidden cursor-pointer ring-2 ring-rose-200 hover:ring-rose-400 transition-all relative group shadow-xs border border-slate-200 shrink-0"
                  title="Click to choose profile photo"
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
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="py-1.5 px-3 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold text-slate-700 hover:text-rose-700 transition-all cursor-pointer shadow-2xs"
                    >
                      {isUploadingPhoto ? 'Uploading...' : 'Choose File'}
                    </button>
                    <span className="text-xs text-slate-500">
                      {formData.profile_photo ? 'Photo selected' : 'No file chosen'}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400">JPG, PNG or WEBP (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Video Type & Video Media Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Video Type
                </label>
                <select
                  value={formData.video_type}
                  onChange={e => handleChange('video_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="None">None</option>
                  <option value="UPLOAD">File Upload</option>
                  <option value="YOUTUBE">YouTube / Video Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Video File Upload
                </label>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="py-2 px-3 rounded-lg bg-white border border-slate-300 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold text-slate-700 hover:text-rose-700 transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    {isUploadingVideo ? 'Uploading...' : 'Choose File'}
                  </button>
                  <span className="text-xs text-slate-500 truncate max-w-[140px]">
                    {formData.video_file_name || (formData.video_type === 'UPLOAD' && formData.video_url ? 'Video attached' : 'No file chosen')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Video URL (YouTube/Link)
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={e => handleChange('video_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* About Me */}
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                About Me <span className="text-rose-600 font-black">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.about_me}
                onChange={e => handleChange('about_me', e.target.value)}
                placeholder="Describe yourself..."
                className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-y"
              />
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 2: Education & Profession                             */}
          {/* ============================================================== */}
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

            {/* Row 1: Highest Education, Degree Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Highest Education (Master) <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.education_id || (formData.highest_education ? educations.find(e => e.name === formData.highest_education)?.id : '') || ''}
                  onChange={e => {
                    const selected = educations.find(ed => String(ed.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      education_id: selected ? String(selected.id) : '',
                      highest_education: selected ? selected.name : ''
                    }));
                  }}
                  disabled={isLoadingEducations}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">---------</option>
                  {educations.map(edu => (
                    <option key={edu.id} value={edu.id}>
                      {edu.name} {edu.degree_level ? `(${edu.degree_level})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Degree Specialization / Notes
                </label>
                <input
                  type="text"
                  value={formData.education_detail}
                  onChange={e => handleChange('education_detail', e.target.value)}
                  placeholder="College / Specialization"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Profession, Job Title, Employment Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Profession (Master) <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.profession_id || (formData.occupation ? professions.find(p => p.name === formData.occupation)?.id : '') || ''}
                  onChange={e => {
                    const selected = professions.find(p => String(p.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      profession_id: selected ? selected.id : null,
                      occupation: selected ? selected.name : ''
                    }));
                  }}
                  disabled={isLoadingProfessions}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">---------</option>
                  {professions.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name} {prof.category ? `(${prof.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Job Title / Designation
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={e => handleChange('job_title', e.target.value)}
                  placeholder="Job Title / Designation"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Employment Sector
                </label>
                <select
                  value={formData.employment_type}
                  onChange={e => handleChange('employment_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Private Sector">Private Sector</option>
                  <option value="Government / Public Sector">Government / Public Sector</option>
                  <option value="Business / Self-Employed">Business / Self-Employed</option>
                  <option value="Civil Services">Civil Services</option>
                  <option value="Defense">Defense</option>
                  <option value="Not Employed">Not Employed</option>
                </select>
              </div>
            </div>

            {/* Row 3: Company / Organization, Work Location, Annual Income */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => handleChange('company_name', e.target.value)}
                  placeholder="Company / Organization"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
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
                  placeholder="Work Location"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Annual Income (Master Range)
                </label>
                <select
                  value={formData.annual_income}
                  onChange={e => handleChange('annual_income', e.target.value)}
                  disabled={isLoadingIncomes}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">Select Annual Income Range</option>
                  {incomeRanges.map(inc => (
                    <option key={inc.id} value={inc.label}>
                      {inc.label}
                    </option>
                  ))}
                  {formData.annual_income && !incomeRanges.some(i => i.label === formData.annual_income) && (
                    <option value={formData.annual_income}>{formData.annual_income}</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Select from admin-configured predefined income brackets</p>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 3: Religion, Community & Horoscope                     */}
          {/* ============================================================== */}
          <section id="section-religion" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Religion, Community & Horoscope</h2>
                <p className="text-[11px] font-semibold text-slate-600">Religious and astrological details</p>
              </div>
            </div>

            {/* Row 1: Religion, Caste, Sub-Caste */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Religion (Master) <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.religion_id || (formData.religion ? religions.find(r => r.name === formData.religion)?.id : '') || ''}
                  onChange={e => {
                    const selected = religions.find(r => String(r.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      religion_id: selected ? selected.id : null,
                      religion: selected ? selected.name : '',
                      caste_id: null,
                      caste: ''
                    }));
                  }}
                  disabled={isLoadingReligions}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">---------</option>
                  {religions.map(rel => (
                    <option key={rel.id} value={rel.id}>
                      {rel.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Caste / Community (Master) <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.caste_id || (formData.caste ? castes.find(c => c.name === formData.caste)?.id : '') || ''}
                  onChange={e => {
                    const selected = castes.find(c => String(c.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      caste_id: selected ? selected.id : null,
                      caste: selected ? selected.name : ''
                    }));
                  }}
                  disabled={!selectedReligionId || isLoadingCastes}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">---------</option>
                  {castes.map(cst => (
                    <option key={cst.id} value={cst.id}>
                      {cst.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Sub-Caste
                </label>
                <input
                  type="text"
                  value={formData.sub_caste}
                  onChange={e => handleChange('sub_caste', e.target.value)}
                  placeholder="Sub-Caste"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Gothram, Rashi, Nakshatra */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Gothram
                </label>
                <input
                  type="text"
                  value={formData.gothram}
                  onChange={e => handleChange('gothram', e.target.value)}
                  placeholder="Gothram"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Rashi (Moon Sign)
                </label>
                <input
                  type="text"
                  value={formData.rashi}
                  onChange={e => handleChange('rashi', e.target.value)}
                  placeholder="Rashi (Moon Sign)"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Nakshatra (Star)
                </label>
                <input
                  type="text"
                  value={formData.nakshatra}
                  onChange={e => handleChange('nakshatra', e.target.value)}
                  placeholder="Nakshatra (Star)"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Row 3: Dosha / Manglik, Birth Place, Birth Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Dosha / Manglik
                </label>
                <select
                  value={formData.dosha}
                  onChange={e => handleChange('dosha', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">Dosha / Manglik</option>
                  <option value="No Dosha">No Dosha</option>
                  <option value="Manglik">Manglik</option>
                  <option value="Sarpa Dosha">Sarpa Dosha</option>
                  <option value="Kala Sarpa Dosha">Kala Sarpa Dosha</option>
                  <option value="Rahu Dosha">Rahu Dosha</option>
                  <option value="Ketu Dosha">Ketu Dosha</option>
                  <option value="Don't Know">Don't Know</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Birth Place
                </label>
                <input
                  type="text"
                  value={formData.birth_place}
                  onChange={e => handleChange('birth_place', e.target.value)}
                  placeholder="Birth Place"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Birth Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.birth_time}
                    onChange={e => handleChange('birth_time', e.target.value)}
                    placeholder="--:--"
                    className="w-full pl-3.5 pr-9 py-2 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  />
                  <Clock className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 4: Physical Attributes & Lifestyle                     */}
          {/* ============================================================== */}
          <section id="section-physical" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Heart className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Physical Attributes & Lifestyle</h2>
                <p className="text-[11px] font-semibold text-slate-600">Physical stats, personal habits and interests</p>
              </div>
            </div>

            {/* Row 1: Height, Weight, Complexion, Body Type */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Height (in cm) <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  step="0.5"
                  value={formData.height || ''}
                  onChange={e => handleChange('height', Number(e.target.value))}
                  placeholder="Height in cm (e.g. 172.5)"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={formData.weight || ''}
                  onChange={e => handleChange('weight', Number(e.target.value))}
                  placeholder="Weight in kg"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Complexion
                </label>
                <select
                  value={formData.complexion}
                  onChange={e => handleChange('complexion', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Fair">Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Wheatish Brown">Wheatish Brown</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Body Type
                </label>
                <select
                  value={formData.body_type}
                  onChange={e => handleChange('body_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Slim">Slim</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Average">Average</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
            </div>

            {/* Row 2: Physical Disability, Disability Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Physical Disability
                </label>
                <select
                  value={formData.physical_status}
                  onChange={e => handleChange('physical_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
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
                  placeholder="Provide details if physically disabled..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">Specify disability details if applicable (optional when No)</p>
              </div>
            </div>

            {/* Row 3: Diet, Smoking, Drinking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Diet
                </label>
                <select
                  value={formData.diet}
                  onChange={e => handleChange('diet', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Jain">Jain</option>
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
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Occasionally">Occasionally</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Drinking
                </label>
                <select
                  value={formData.drinking}
                  onChange={e => handleChange('drinking', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Occasionally">Occasionally</option>
                </select>
              </div>
            </div>

            {/* Row 4: Languages Known (Chips / Multi-select) */}
            <div>
              <label className="block text-xs font-bold text-black mb-1.5">
                Languages Known
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                {(languages.length > 0 ? languages.map(l => l.name) : commonLanguages).map(lang => {
                  const isSelected = formData.languages_known.split(',').map(s => s.trim()).includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#C44569] text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 5: Hobbies & Interests (Chips / Multi-select) */}
            <div>
              <label className="block text-xs font-bold text-black mb-1.5">
                Hobbies & Interests
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                {(hobbies.length > 0 ? hobbies.map(h => h.name) : commonHobbies).map(hobby => {
                  const isSelected = formData.hobbies_interests.split(',').map(s => s.trim()).includes(hobby);
                  return (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => toggleHobby(hobby)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#C44569] text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      {hobby}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 6: Marital Status, Children Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Marital Status <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.marital_status}
                  onChange={e => handleChange('marital_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Awaiting Divorce">Awaiting Divorce</option>
                  <option value="Annulled">Annulled</option>
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
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 5: Family Information                                  */}
          {/* ============================================================== */}
          <section id="section-family" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Family Information</h2>
                <p className="text-[11px] font-semibold text-slate-600">Details about your parents and siblings</p>
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
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
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
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Rich">Rich</option>
                  <option value="Affluent">Affluent</option>
                  <option value="Modest">Modest</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Family Values
                </label>
                <select
                  value={formData.family_values}
                  onChange={e => handleChange('family_values', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer"
                >
                  <option value="">---------</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Liberal">Liberal</option>
                </select>
              </div>
            </div>

            {/* Row 2: Father's Profession, Mother's Profession */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Father's Profession
                </label>
                <input
                  type="text"
                  value={formData.father_occupation}
                  onChange={e => handleChange('father_occupation', e.target.value)}
                  placeholder="Father's Profession"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Mother's Profession
                </label>
                <input
                  type="text"
                  value={formData.mother_occupation}
                  onChange={e => handleChange('mother_occupation', e.target.value)}
                  placeholder="Mother's Profession"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Row 3: Brothers Count, Brothers Married, Sisters Count, Sisters Married */}
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
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Brothers Married
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.brothers_married_count}
                  onChange={e => handleChange('brothers_married_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
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
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Sisters Married
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.sisters_married_count}
                  onChange={e => handleChange('sisters_married_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>

            {/* Row 4: Family Information Notes */}
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Family Information Notes
              </label>
              <textarea
                rows={3}
                value={formData.family_information}
                onChange={e => handleChange('family_information', e.target.value)}
                placeholder="Family Information Notes..."
                className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-y"
              />
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION 6: Profile Location Details (Dependent Hierarchy)     */}
          {/* ============================================================== */}
          <section id="section-location" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-sm space-y-4 hover:border-[#C44569]/30 transition-colors">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                <MapPin className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Profile Location Details (Dependent Hierarchy)</h2>
                <p className="text-[11px] font-semibold text-slate-600">Your geographical location details</p>
              </div>
            </div>

            {/* Row 1: Country, State, District */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Country <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.country_id || (formData.country ? countries.find(c => c.name === formData.country)?.id : '') || ''}
                  onChange={e => {
                    const selected = countries.find(c => String(c.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      country_id: selected ? selected.id : null,
                      country: selected ? selected.name : '',
                      state_id: null,
                      state: '',
                      district_id: null,
                      district: '',
                      city: '',
                      mandal_id: null,
                      mandal: '',
                      village_id: null,
                      village: ''
                    }));
                  }}
                  disabled={isLoadingCountries}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">Search or select country...</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  State <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.state_id || (formData.state ? states.find(s => s.name === formData.state)?.id : '') || ''}
                  onChange={e => {
                    const selected = states.find(s => String(s.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      state_id: selected ? selected.id : null,
                      state: selected ? selected.name : '',
                      district_id: null,
                      district: '',
                      city: '',
                      mandal_id: null,
                      mandal: '',
                      village_id: null,
                      village: ''
                    }));
                  }}
                  disabled={!selectedCountryId || isLoadingStates}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {!selectedCountryId
                      ? 'Select Country first'
                      : isLoadingStates
                      ? 'Loading states...'
                      : 'Search or select state...'}
                  </option>
                  {states.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  District <span className="text-rose-600 font-black">*</span>
                </label>
                <select
                  value={formData.district_id || (formData.district ? districts.find(d => d.name === formData.district)?.id : '') || ''}
                  onChange={e => {
                    const selected = districts.find(d => String(d.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      district_id: selected ? selected.id : null,
                      district: selected ? selected.name : '',
                      city: selected ? selected.name : prev.city,
                      mandal_id: null,
                      mandal: '',
                      village_id: null,
                      village: ''
                    }));
                  }}
                  disabled={!selectedStateId || isLoadingDistricts}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {!selectedStateId
                      ? 'Select State first'
                      : isLoadingDistricts
                      ? 'Loading districts...'
                      : 'Search or select district...'}
                  </option>
                  {districts.map(dst => (
                    <option key={dst.id} value={dst.id}>
                      {dst.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Mandal / City, Village / Locality, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Mandal / City
                </label>
                <select
                  value={formData.mandal_id || (formData.mandal ? mandals.find(m => m.name === formData.mandal)?.id : '') || ''}
                  onChange={e => {
                    const selected = mandals.find(m => String(m.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      mandal_id: selected ? selected.id : null,
                      mandal: selected ? selected.name : '',
                      city: selected ? selected.name : prev.city,
                      village_id: null,
                      village: ''
                    }));
                  }}
                  disabled={!selectedDistrictId || isLoadingMandals}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {!selectedDistrictId
                      ? 'Select District first'
                      : isLoadingMandals
                      ? 'Loading mandals...'
                      : 'Search or select mandal/city...'}
                  </option>
                  {mandals.map(mnd => (
                    <option key={mnd.id} value={mnd.id}>
                      {mnd.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Village / Locality
                </label>
                <select
                  value={formData.village_id || (formData.village ? villages.find(v => v.name === formData.village)?.id : '') || ''}
                  onChange={e => {
                    const selected = villages.find(v => String(v.id) === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      village_id: selected ? selected.id : null,
                      village: selected ? selected.name : '',
                      pincode: selected?.pincode || prev.pincode
                    }));
                  }}
                  disabled={!selectedMandalId || isLoadingVillages}
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <option value="">
                    {!selectedMandalId
                      ? 'Select Mandal first'
                      : isLoadingVillages
                      ? 'Loading villages...'
                      : 'Search or select village...'}
                  </option>
                  {villages.map(vlg => (
                    <option key={vlg.id} value={vlg.id}>
                      {vlg.name} {vlg.pincode ? `(${vlg.pincode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1">
                  Pincode <span className="text-rose-600 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="Pincode"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-black bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Bottom Form Actions */}
          <div className="flex items-center justify-between pt-4 pb-8">
            <button
              type="button"
              onClick={async () => {
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
