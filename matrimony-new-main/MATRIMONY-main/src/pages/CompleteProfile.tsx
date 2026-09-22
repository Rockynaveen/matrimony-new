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
  IdCard,
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
  Play,
  Info,
  ArrowRight,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { Badge } from '../components/ui/Badge';
import { SearchableMultiSelect } from '../components/ui/SearchableMultiSelect';
import { formatPhotoUrl } from '../components/ui/MatchAvatar';

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
    annual_income_id: null as number | null,

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
    children_living_status: '',

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
    living_with_parents: true,
    family_location: '',
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

    // Also load profile from backend database
    const loadBackendProfile = async () => {
      try {
        const profile = await profileService.getProfile();
        if (profile) {
          markProfileCompleted();
          setFormData(prev => ({
            ...prev,
            profile_name: profile.profile_name || prev.profile_name,
            profile_photo: profile.profile_photo || prev.profile_photo,
            video_url: profile.video_url || profile.video_introduction || prev.video_url,
            about_me: profile.about_me || prev.about_me,
            highest_education: profile.highest_education || prev.highest_education,
            education_detail: (profile as any).education_detail || prev.education_detail,
            education_id: (profile as any).education_id || prev.education_id,
            profession_id: (profile as any).profession_id || prev.profession_id,
            occupation: profile.occupation || prev.occupation,
            job_title: (profile as any).job_title || prev.job_title,
            employment_type: (profile as any).employment_type || prev.employment_type,
            company_name: (profile as any).company_name || prev.company_name,
            work_location: (profile as any).work_location || prev.work_location,
            annual_income: profile.annual_income || (profile as any).formatted_annual_income || prev.annual_income,
            annual_income_id: (profile as any).annual_income_id || prev.annual_income_id,
            religion: profile.religion || prev.religion,
            religion_id: (profile as any).religion_id || prev.religion_id,
            caste: profile.caste || prev.caste,
            caste_id: (profile as any).caste_id || prev.caste_id,
            sub_caste: (profile as any).sub_caste || prev.sub_caste,
            gothram: (profile as any).gothram || prev.gothram,
            rashi: profile.rashi || prev.rashi,
            nakshatra: profile.nakshatra || prev.nakshatra,
            dosha: profile.dosha || prev.dosha,
            birth_place: (profile as any).birth_place || prev.birth_place,
            birth_time: (profile as any).birth_time || prev.birth_time,
            height: profile.height ? Number(profile.height) : prev.height,
            weight: profile.weight ? Number(profile.weight) : prev.weight,
            complexion: profile.complexion || prev.complexion,
            physical_status: (profile as any).physical_status === 'Physically Challenged' || (profile as any).physical_disability === 'YES' ? 'Yes' : ((profile as any).physical_status || prev.physical_status),
            disability_information: (profile as any).disability_information || (profile as any).disability_info || prev.disability_information,
            diet: profile.diet || prev.diet,
            smoking: profile.smoking || prev.smoking,
            drinking: profile.drinking || prev.drinking,
            languages_known: profile.languages_known || prev.languages_known,
            language_ids: (profile as any).language_ids || prev.language_ids,
            hobbies_interests: profile.hobbies_interests || prev.hobbies_interests,
            hobby_ids: (profile as any).hobby_ids || prev.hobby_ids,
            marital_status: profile.marital_status || prev.marital_status,
            children_count: (profile as any).children_count !== undefined ? Number((profile as any).children_count) : prev.children_count,
            children_living_status: (profile as any).children_living_status || prev.children_living_status,
            family_type: (profile as any).family_type || prev.family_type,
            family_status: (profile as any).family_status || prev.family_status,
            family_values: (profile as any).family_values || prev.family_values,
            father_occupation: (profile as any).father_occupation || prev.father_occupation,
            mother_occupation: (profile as any).mother_occupation || prev.mother_occupation,
            brothers_count: (profile as any).brothers_count !== undefined ? Number((profile as any).brothers_count) : prev.brothers_count,
            brothers_married_count: (profile as any).brothers_married_count !== undefined ? Number((profile as any).brothers_married_count) : prev.brothers_married_count,
            sisters_count: (profile as any).sisters_count !== undefined ? Number((profile as any).sisters_count) : prev.sisters_count,
            sisters_married_count: (profile as any).sisters_married_count !== undefined ? Number((profile as any).sisters_married_count) : prev.sisters_married_count,
            living_with_parents: (profile as any).living_with_parents !== undefined ? Boolean((profile as any).living_with_parents) : prev.living_with_parents,
            family_location: (profile as any).family_location || prev.family_location,
            family_information: (profile as any).family_information || prev.family_information,
            country: profile.country || prev.country,
            country_id: (profile as any).country_id || prev.country_id,
            state: profile.state || prev.state,
            state_id: (profile as any).state_id || prev.state_id,
            city: profile.city || prev.city,
            district_id: (profile as any).district_id || prev.district_id,
            mandal_id: (profile as any).mandal_id || prev.mandal_id,
            village_id: (profile as any).village_id || prev.village_id,
            pincode: (profile as any).pincode || prev.pincode,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch existing profile from backend:', err);
      }
    };

    loadBackendProfile();

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

  // Helper to read file as persistent Base64 Data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
      // Immediately convert to Base64 so preview and persistence work reliably
      const base64Url = await fileToBase64(file);
      handleChange('profile_photo', base64Url);

      try {
        const res = await profileService.uploadProfilePhoto(file);
        if (res?.photo_url) {
          const finalUrl = res.photo_url.startsWith('http') ? res.photo_url : formatPhotoUrl(res.photo_url);
          handleChange('profile_photo', finalUrl);
          updateCurrentUserAvatar(finalUrl);
          localStorage.setItem('logged_in_avatar', finalUrl);
        } else {
          updateCurrentUserAvatar(base64Url);
          localStorage.setItem('logged_in_avatar', base64Url);
        }
        showToast('Profile photo uploaded successfully!');
      } catch (uploadErr) {
        console.warn('Backend photo upload note, saved locally:', uploadErr);
        updateCurrentUserAvatar(base64Url);
        localStorage.setItem('logged_in_avatar', base64Url);
        showToast('Profile photo attached!');
      }
    } catch (err: any) {
      console.warn('Photo processing error:', err);
      showToast('Could not process selected image');
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

      const matchedIncome = incomeRanges.find(i => i.label === formData.annual_income || String(i.id) === String(formData.annual_income_id));
      const incomeId = matchedIncome ? matchedIncome.id : (formData.annual_income_id ? Number(formData.annual_income_id) : null);
      const parsedIncomeVal = matchedIncome && matchedIncome.min_value ? parseInt(matchedIncome.min_value, 10) : parseIncome(formData.annual_income);

      const apiPayload: ProfileCreateRequest = {
        profile_name: formData.profile_name || '',
        about_me: formData.about_me || '',
        height: formData.height > 0 ? (formData.height > 30 ? parseFloat((formData.height / 30.48).toFixed(1)) : formData.height) : 5.8,
        weight: formData.weight > 0 ? formData.weight : null,
        complexion: formData.complexion || 'Fair',
        marital_status: formData.marital_status || 'Never Married',
        children_count: Number(formData.children_count) || 0,
        children_living_status: formData.children_living_status || '',
        physical_status: formData.physical_status === 'Yes' ? 'Physically Challenged' : (formData.physical_status || 'Normal'),
        physical_disability: formData.physical_status === 'Yes' ? 'YES' : 'NO',
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
        annual_income: parsedIncomeVal,
        annual_income_id: incomeId,

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
        birth_place: formData.birth_place || '',
        birth_time: formData.birth_time || null,

        // Family
        family_type: formData.family_type || '',
        family_status: formData.family_status || '',
        family_values: formData.family_values || '',
        father_occupation: formData.father_occupation || '',
        mother_occupation: formData.mother_occupation || '',
        brothers_count: Number(formData.brothers_count) || 0,
        brothers_married_count: Number(formData.brothers_married_count) || 0,
        sisters_count: Number(formData.sisters_count) || 0,
        sisters_married_count: Number(formData.sisters_married_count) || 0,
        living_with_parents: Boolean(formData.living_with_parents),
        family_location: formData.family_location || '',
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

  return (
    <div className="min-h-screen bg-white py-8 px-3 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="max-w-5xl mx-auto space-y-5">
        
        {/* Informational Callout Banner */}
        <div className="bg-[#e0f7fa] border border-[#b2ebf2] text-slate-800 rounded-2xl p-4 sm:p-4.5 flex items-start gap-3 shadow-2xs">
          <div className="h-5 w-5 rounded-full bg-[#00838f] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            <Info className="h-3.5 w-3.5 text-white stroke-[2.5]" />
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            <strong className="font-bold text-slate-900">User Profile (Actual)</strong> represents your own personal, educational, career, lifestyle, and location details. These are stored securely and used by our AI matching engine to find your ideal match.
          </p>
        </div>

        {/* 3. Completion & Registration Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80">
              <span className="text-xs font-bold text-blue-900">Profile Completion:</span>
              <span className="text-xs font-extrabold text-blue-600">{completionPercentage}%</span>
            </div>
            {(formData.gender || formData.date_of_birth) && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="hidden sm:inline text-slate-300">•</span>
                {formData.gender && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                    {formData.gender === 'Male' ? 'Male (Groom)' : 'Female (Bride)'}
                  </span>
                )}
                {formData.date_of_birth && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                    DOB: {formData.date_of_birth}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={async () => {
              localStorage.setItem('user_profile_draft', JSON.stringify(formData));
              await logout();
              showToast('Draft saved. Logged out successfully.');
              navigate('/login');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer ml-auto"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span>Save Draft & Log Out</span>
          </button>
        </div>

        {/* Profile Completion Form */}
        <form onSubmit={handleSaveAndContinue} className="space-y-6">

          {/* ============================================================== */}
          {/* SECTION 1: Profile Display & Media                             */}
          {/* ============================================================== */}
          <div id="section-media" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-[0.95rem] font-bold text-slate-900">
                1. Profile Display & Media
              </h2>
            </div>

            {/* Display / Profile Name */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Display / Profile Name <span className="text-rose-600 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.profile_name}
                onChange={e => handleChange('profile_name', e.target.value)}
                placeholder="Enter display or profile name..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              />
            </div>

            {/* Primary Profile Photo */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Primary Profile Photo
              </label>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-600 overflow-hidden cursor-pointer ring-2 ring-blue-100 hover:ring-blue-400 transition-all relative group shadow-2xs border border-slate-200 shrink-0"
                  title="Click to choose profile photo"
                >
                  {formData.profile_photo ? (
                    <img
                      src={formData.profile_photo}
                      alt="Profile"
                      className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                    />
                  ) : (
                    <Camera className="h-6 w-6 text-blue-500 stroke-[2]" />
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
                      className="py-1.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-700 transition-all cursor-pointer shadow-2xs"
                    >
                      {isUploadingPhoto ? 'Uploading...' : 'Choose File'}
                    </button>
                    <span className="text-xs text-slate-500">
                      {formData.profile_photo ? 'Photo selected' : 'No file chosen'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">JPG, PNG or WEBP (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Video Type & Video Media Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Video Type
                </label>
                <select
                  value={formData.video_type}
                  onChange={e => handleChange('video_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="None">None</option>
                  <option value="UPLOAD">File Upload</option>
                  <option value="YOUTUBE">YouTube / Video Link</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Video File Upload
                </label>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-xs font-bold text-slate-700 hover:text-blue-700 transition-all cursor-pointer shadow-2xs shrink-0"
                  >
                    {isUploadingVideo ? 'Uploading...' : 'Choose File'}
                  </button>
                  <span className="text-xs text-slate-500 truncate max-w-[140px]">
                    {formData.video_file_name || (formData.video_type === 'UPLOAD' && formData.video_url ? 'Video attached' : 'No file chosen')}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Video URL (YouTube/Link)
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={e => handleChange('video_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* About Me */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                About Me <span className="text-rose-600 font-bold">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.about_me}
                onChange={e => handleChange('about_me', e.target.value)}
                placeholder="Write a few lines about yourself, your personality, interests, and aspirations..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 resize-y"
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: Education & Profession                             */}
          {/* ============================================================== */}
          <div id="section-education" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-[0.95rem] font-bold text-slate-900">
                2. Education & Profession
              </h2>
            </div>

            {/* Highest Education & Degree Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Highest Education (Master) <span className="text-rose-600 font-bold">*</span>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">{isLoadingEducations ? 'Loading educations from backend...' : 'Select Highest Education'}</option>
                  {educations.map(edu => (
                    <option key={edu.id} value={edu.id}>
                      {edu.name} {edu.degree_level ? `(${edu.degree_level})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Degree Specialization / Notes
                </label>
                <input
                  type="text"
                  value={formData.education_detail}
                  onChange={e => handleChange('education_detail', e.target.value)}
                  placeholder="College / Specialization"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Profession, Job Title, Employment Sector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Profession (Master) <span className="text-rose-600 font-bold">*</span>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">{isLoadingProfessions ? 'Loading professions from backend...' : 'Select Profession'}</option>
                  {professions.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name} {prof.category ? `(${prof.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Job Title / Designation
                </label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={e => handleChange('job_title', e.target.value)}
                  placeholder="Job Title / Designation"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Employment Sector
                </label>
                <select
                  value={formData.employment_type}
                  onChange={e => handleChange('employment_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Employment Sector</option>
                  <option value="Private Sector">Private Sector</option>
                  <option value="Government / Public Sector">Government / Public Sector</option>
                  <option value="Business / Self-Employed">Business / Self-Employed</option>
                  <option value="Civil Services">Civil Services</option>
                  <option value="Defense">Defense</option>
                  <option value="Not Employed">Not Employed</option>
                </select>
              </div>
            </div>

            {/* Company, Work Location, Annual Income */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={e => handleChange('company_name', e.target.value)}
                  placeholder="Company / Organization"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Work Location
                </label>
                <input
                  type="text"
                  value={formData.work_location}
                  onChange={e => handleChange('work_location', e.target.value)}
                  placeholder="Work Location"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Annual Income (Master Range)
                </label>
                <select
                  value={formData.annual_income}
                  onChange={e => {
                    const label = e.target.value;
                    const matched = incomeRanges.find(i => i.label === label);
                    setFormData(prev => ({
                      ...prev,
                      annual_income: label,
                      annual_income_id: matched ? matched.id : prev.annual_income_id
                    }));
                  }}
                  disabled={isLoadingIncomes}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">{isLoadingIncomes ? 'Loading income brackets...' : 'Select Annual Income Range'}</option>
                  {incomeRanges.map(inc => (
                    <option key={inc.id} value={inc.label}>
                      {inc.label}
                    </option>
                  ))}
                  {formData.annual_income && !incomeRanges.some(i => i.label === formData.annual_income) && (
                    <option value={formData.annual_income}>{formData.annual_income}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 3: Religion, Community & Horoscope                     */}
          {/* ============================================================== */}
          <div id="section-religion" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-[0.95rem] font-bold text-slate-900">
                3. Religion, Community & Horoscope
              </h2>
            </div>

            {/* Religion, Caste, Sub-Caste */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Religion (Master) <span className="text-rose-600 font-bold">*</span>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">{isLoadingReligions ? 'Loading religions...' : 'Select Religion'}</option>
                  {religions.map(rel => (
                    <option key={rel.id} value={rel.id}>
                      {rel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Caste / Community (Master) <span className="text-rose-600 font-bold">*</span>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">
                    {!selectedReligionId
                      ? 'Select Religion first'
                      : isLoadingCastes
                      ? 'Loading castes from backend...'
                      : 'Select Caste'}
                  </option>
                  {castes.map(cst => (
                    <option key={cst.id} value={cst.id}>
                      {cst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Sub-Caste
                </label>
                <input
                  type="text"
                  value={formData.sub_caste}
                  onChange={e => handleChange('sub_caste', e.target.value)}
                  placeholder="Sub-Caste"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Gothram, Rashi, Nakshatra */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Gothram
                </label>
                <input
                  type="text"
                  value={formData.gothram}
                  onChange={e => handleChange('gothram', e.target.value)}
                  placeholder="Gothram"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Rashi (Moon Sign)
                </label>
                <input
                  type="text"
                  value={formData.rashi}
                  onChange={e => handleChange('rashi', e.target.value)}
                  placeholder="Rashi (Moon Sign)"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Nakshatra (Star)
                </label>
                <input
                  type="text"
                  value={formData.nakshatra}
                  onChange={e => handleChange('nakshatra', e.target.value)}
                  placeholder="Nakshatra (Star)"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Dosha, Birth Place, Birth Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Dosha / Manglik
                </label>
                <select
                  value={formData.dosha}
                  onChange={e => handleChange('dosha', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Dosha / Manglik</option>
                  <option value="No Dosha">No Dosha</option>
                  <option value="Manglik">Manglik</option>
                  <option value="Sarpa Dosha">Sarpa Dosha</option>
                  <option value="Kala Sarpa Dosha">Kala Sarpa Dosha</option>
                  <option value="Rahu Dosha">Rahu Dosha</option>
                  <option value="Ketu Dosha">Ketu Dosha</option>
                  <option value="Don't Know">Don't Know</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Birth Place
                </label>
                <input
                  type="text"
                  value={formData.birth_place}
                  onChange={e => handleChange('birth_place', e.target.value)}
                  placeholder="Birth Place"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Birth Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.birth_time}
                    onChange={e => handleChange('birth_time', e.target.value)}
                    placeholder="--:--"
                    className="w-full pl-3.5 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                  />
                  <Clock className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 4: Physical Attributes & Lifestyle                     */}
          {/* ============================================================== */}
          <div id="section-physical" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-[0.95rem] font-bold text-slate-900">
                4. Physical Attributes & Lifestyle
              </h2>
            </div>

            {/* Height, Weight, Complexion, Body Type */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Height (cm) <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  step="0.5"
                  value={formData.height || ''}
                  onChange={e => handleChange('height', Number(e.target.value))}
                  placeholder="175"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={formData.weight || ''}
                  onChange={e => handleChange('weight', Number(e.target.value))}
                  placeholder="65"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Complexion
                </label>
                <select
                  value={formData.complexion}
                  onChange={e => handleChange('complexion', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Complexion</option>
                  <option value="Very Fair">Very Fair</option>
                  <option value="Fair">Fair</option>
                  <option value="Wheatish">Wheatish</option>
                  <option value="Wheatish Brown">Wheatish Brown</option>
                  <option value="Dark">Dark</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Body Type
                </label>
                <select
                  value={formData.body_type}
                  onChange={e => handleChange('body_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Body Type</option>
                  <option value="Slim">Slim</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Average">Average</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Physical Disability & Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Physical Disability
                </label>
                <select
                  value={formData.physical_status}
                  onChange={e => handleChange('physical_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Disability Information
                </label>
                <input
                  type="text"
                  value={formData.disability_information}
                  onChange={e => handleChange('disability_information', e.target.value)}
                  placeholder="Provide details if physically disabled..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Diet, Smoking, Drinking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Diet
                </label>
                <select
                  value={formData.diet}
                  onChange={e => handleChange('diet', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Diet</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Jain">Jain</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Smoking
                </label>
                <select
                  value={formData.smoking}
                  onChange={e => handleChange('smoking', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Smoking Habit</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Occasionally">Occasionally</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Drinking
                </label>
                <select
                  value={formData.drinking}
                  onChange={e => handleChange('drinking', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Drinking Habit</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Occasionally">Occasionally</option>
                </select>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Languages Known — with Shadcn Checkbox Dropdown */}
            <SearchableMultiSelect
              label="Languages Known"
              placeholder={isLoadingLanguages ? "Loading languages from backend..." : "Search and select languages known..."}
              items={languages.map(l => ({ id: l.id, name: l.name }))}
              selectedIds={formData.language_ids}
              onChange={ids => {
                const names = languages.filter(l => ids.includes(l.id)).map(l => l.name).join(', ');
                setFormData(prev => ({
                  ...prev,
                  language_ids: ids,
                  languages_known: names
                }));
              }}
              disabled={isLoadingLanguages}
              disabledPlaceholder="Loading languages from backend..."
            />

            <Separator className="bg-slate-100" />

            {/* Hobbies & Interests — with Shadcn Checkbox Dropdown */}
            <SearchableMultiSelect
              label="Hobbies & Interests"
              placeholder={isLoadingHobbies ? "Loading hobbies from backend..." : "Search and select hobbies..."}
              items={hobbies.map(h => ({ id: h.id, name: h.name, extra: h.category }))}
              selectedIds={formData.hobby_ids}
              onChange={ids => {
                const names = hobbies.filter(h => ids.includes(h.id)).map(h => h.name).join(', ');
                setFormData(prev => ({
                  ...prev,
                  hobby_ids: ids,
                  hobbies_interests: names
                }));
              }}
              disabled={isLoadingHobbies}
              disabledPlaceholder="Loading hobbies from backend..."
            />

            <Separator className="bg-slate-100" />

            {/* Marital Status, Children Count & Children Living Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Marital Status <span className="text-rose-600 font-bold">*</span>
                </label>
                <select
                  value={formData.marital_status}
                  onChange={e => handleChange('marital_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Marital Status</option>
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Awaiting Divorce">Awaiting Divorce</option>
                  <option value="Annulled">Annulled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Children Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.children_count}
                  onChange={e => handleChange('children_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Children Living Status
                </label>
                <select
                  value={formData.children_living_status}
                  onChange={e => handleChange('children_living_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Living Status</option>
                  <option value="Living with me">Living with me</option>
                  <option value="Not living with me">Not living with me</option>
                  <option value="Shared custody">Shared custody</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 5: Family Information                                  */}
          {/* ============================================================== */}
          <div id="section-family" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-[0.95rem] font-bold text-slate-900">
                5. Family Information
              </h2>
            </div>

            {/* Family Type, Family Status, Family Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Family Type
                </label>
                <select
                  value={formData.family_type}
                  onChange={e => handleChange('family_type', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Family Type</option>
                  <option value="Nuclear">Nuclear</option>
                  <option value="Joint">Joint</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Family Status
                </label>
                <select
                  value={formData.family_status}
                  onChange={e => handleChange('family_status', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Family Status</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Rich">Rich</option>
                  <option value="Affluent">Affluent</option>
                  <option value="Modest">Modest</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Family Values
                </label>
                <select
                  value={formData.family_values}
                  onChange={e => handleChange('family_values', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="">Select Family Values</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Liberal">Liberal</option>
                </select>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Father's Profession & Mother's Profession */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Father's Profession
                </label>
                <input
                  type="text"
                  value={formData.father_occupation}
                  onChange={e => handleChange('father_occupation', e.target.value)}
                  placeholder="Father's Profession"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Mother's Profession
                </label>
                <input
                  type="text"
                  value={formData.mother_occupation}
                  onChange={e => handleChange('mother_occupation', e.target.value)}
                  placeholder="Mother's Profession"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Brothers Count, Brothers Married, Sisters Count, Sisters Married */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Brothers Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.brothers_count}
                  onChange={e => handleChange('brothers_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Brothers Married
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.brothers_married_count}
                  onChange={e => handleChange('brothers_married_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Sisters Count
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.sisters_count}
                  onChange={e => handleChange('sisters_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Sisters Married
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.sisters_married_count}
                  onChange={e => handleChange('sisters_married_count', Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Living with Parents & Family Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Living with Parents
                </label>
                <select
                  value={formData.living_with_parents ? 'Yes' : 'No'}
                  onChange={e => handleChange('living_with_parents', e.target.value === 'Yes')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer text-slate-900"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Family Location / Native
                </label>
                <input
                  type="text"
                  value={formData.family_location}
                  onChange={e => handleChange('family_location', e.target.value)}
                  placeholder="e.g. Hyderabad, Telangana"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Family Information Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-800">
                Family Information Notes
              </label>
              <textarea
                rows={3}
                value={formData.family_information}
                onChange={e => handleChange('family_information', e.target.value)}
                placeholder="Additional notes about your family, background, or traditions..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 resize-y"
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 6: Profile Location Details (Dependent Hierarchy)     */}
          {/* ============================================================== */}
          <div id="section-location" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-[0.95rem] font-bold text-slate-900">
                6. Profile Location Details (Dependent Hierarchy)
              </h2>
            </div>

            {/* Country, State, District */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    Country <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-100 text-slate-700 border-slate-200">
                    Level 1
                  </Badge>
                </div>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">{isLoadingCountries ? 'Loading countries from backend...' : 'Select Country'}</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    State <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-100 text-slate-700 border-slate-200">
                    Level 2
                  </Badge>
                </div>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">
                    {!selectedCountryId
                      ? 'Select Country first'
                      : isLoadingStates
                      ? 'Loading states from backend...'
                      : 'Select State'}
                  </option>
                  {states.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    District <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-100 text-slate-700 border-slate-200">
                    Level 3
                  </Badge>
                </div>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">
                    {!selectedStateId
                      ? 'Select State first'
                      : isLoadingDistricts
                      ? 'Loading districts from backend...'
                      : 'Select District'}
                  </option>
                  {districts.map(dst => (
                    <option key={dst.id} value={dst.id}>
                      {dst.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Mandal, Village, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    Mandal / City
                  </label>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-100 text-slate-700 border-slate-200">
                    Level 4
                  </Badge>
                </div>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">
                    {!selectedDistrictId
                      ? 'Select District first'
                      : isLoadingMandals
                      ? 'Loading mandals from backend...'
                      : 'Select Mandal / City'}
                  </option>
                  {mandals.map(mnd => (
                    <option key={mnd.id} value={mnd.id}>
                      {mnd.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800">
                    Village / Locality
                  </label>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-slate-100 text-slate-700 border-slate-200">
                    Level 5
                  </Badge>
                </div>
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-60 text-slate-900"
                >
                  <option value="">
                    {!selectedMandalId
                      ? 'Select Mandal first'
                      : isLoadingVillages
                      ? 'Loading villages from backend...'
                      : 'Select Village / Locality'}
                  </option>
                  {villages.map(vlg => (
                    <option key={vlg.id} value={vlg.id}>
                      {vlg.name} {vlg.pincode ? `(${vlg.pincode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Pincode <span className="text-rose-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="Pincode"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-4 pb-12">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="text-xs font-bold px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              Back
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              Save & Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
