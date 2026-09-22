import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useProfile, useUpdateProfile, useCreateProfile } from '../../hooks/useProfile';
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
} from '../../hooks/useProfileOptions';
import type { ProfileUpdateRequest } from '../../types/profile.types';
import { MediaUploadSection } from '../../components/profile/MediaUploadSection';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DotsLoader } from '../../components/ui/LoadingScreen';
import {
  User,
  GraduationCap,
  Sparkles,
  Heart,
  MapPin,
  Camera,
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Users,
  Clock
} from 'lucide-react';

interface FormState {
  profile_name: string;
  date_of_birth: string;
  gender: string;
  height: string;
  weight: string;
  complexion: string;
  marital_status: string;
  about_me: string;

  // Children & Disability
  children_count: number;
  children_living_status: string;
  physical_status: string;
  physical_disability: string;
  disability_information: string;

  // Education & Career
  education_id: number | null;
  highest_education: string;
  education_detail: string;
  profession_id: number | null;
  occupation: string;
  job_title: string;
  annual_income: string;
  annual_income_id: number | null;

  // Religion, Community & Horoscope
  religion_id: number | null;
  religion: string;
  caste_id: number | null;
  caste: string;
  sub_caste: string;
  gothram: string;
  rashi: string;
  nakshatra: string;
  dosha: string;
  birth_place: string;
  birth_time: string;

  // Family Background
  family_type: string;
  family_status: string;
  family_values: string;
  father_occupation: string;
  mother_occupation: string;
  brothers_count: number;
  brothers_married_count: number;
  sisters_count: number;
  sisters_married_count: number;
  living_with_parents: boolean | null;
  family_location: string;
  family_information: string;

  // Languages & Interests
  languages_known: string;
  language_ids: number[];
  hobbies_interests: string;
  hobby_ids: number[];

  // Location
  country_id: number | null;
  country: string;
  state_id: number | null;
  state: string;
  district_id: number | null;
  city: string;
  mandal_id: number | null;
  village_id: number | null;
  pincode: string;
  address_line: string;

  // Media
  profile_photo: string;
  video_introduction: string;
}

const initialFormState: FormState = {
  profile_name: '',
  date_of_birth: '',
  gender: '',
  height: '',
  weight: '',
  complexion: '',
  marital_status: '',
  about_me: '',

  children_count: 0,
  children_living_status: '',
  physical_status: '',
  physical_disability: '',
  disability_information: '',

  education_id: null,
  highest_education: '',
  education_detail: '',
  profession_id: null,
  occupation: '',
  job_title: '',
  annual_income: '',
  annual_income_id: null,

  religion_id: null,
  religion: '',
  caste_id: null,
  caste: '',
  sub_caste: '',
  gothram: '',
  rashi: '',
  nakshatra: '',
  dosha: '',
  birth_place: '',
  birth_time: '',

  family_type: '',
  family_status: '',
  family_values: '',
  father_occupation: '',
  mother_occupation: '',
  brothers_count: 0,
  brothers_married_count: 0,
  sisters_count: 0,
  sisters_married_count: 0,
  living_with_parents: null,
  family_location: '',
  family_information: '',

  languages_known: '',
  language_ids: [],
  hobbies_interests: '',
  hobby_ids: [],

  country_id: null,
  country: '',
  state_id: null,
  state: '',
  district_id: null,
  city: '',
  mandal_id: null,
  village_id: null,
  pincode: '',
  address_line: '',

  profile_photo: '',
  video_introduction: '',
};

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, checkProfileStatus, currentUser, updateCurrentUserAvatar } = useApp();

  // Queries & Mutations
  const { data: profile, isLoading: isProfileLoading, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const createProfileMutation = useCreateProfile();

  // Master Data Queries
  const { data: incomeRanges = [], isLoading: isLoadingIncomes } = useIncomeRanges();
  const { data: educations = [], isLoading: isLoadingEducations } = useEducations();
  const { data: professions = [], isLoading: isLoadingProfessions } = useProfessions();
  const { data: religions = [], isLoading: isLoadingReligions } = useReligions();
  const { data: languages = [] } = useLanguages();
  const { data: hobbies = [] } = useHobbies();
  const { data: countries = [], isLoading: isLoadingCountries } = useCountries();

  // Form State
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  // Dependent Dropdowns
  const { data: castes = [], isLoading: isLoadingCastes } = useCastes(formData.religion_id);
  const { data: states = [], isLoading: isLoadingStates } = useStates(formData.country_id);
  const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(formData.state_id);
  const { data: mandals = [], isLoading: isLoadingMandals } = useMandals(formData.district_id);
  const { data: villages = [], isLoading: isLoadingVillages } = useVillages(formData.mandal_id);

  // Populate form with existing profile data when available
  useEffect(() => {
    const rawSource: any = profile;
    const source = rawSource?.data || rawSource?.profile || rawSource;

    if (source) {
      const photo = source.profile_photo || source.photo || source.avatar || currentUser.avatar || '';
      const sourceName = source.profile_name || source.name || (source.first_name ? `${source.first_name} ${source.last_name || ''}`.trim() : '') || currentUser.name || '';

      // Match religion ID if object or ID provided
      let relId: number | null = source.religion_id || source.religion_rel?.id || null;
      if (!relId && source.religion && religions.length > 0) {
        const match = religions.find(r => r.name.toLowerCase() === String(source.religion).toLowerCase());
        if (match) relId = match.id;
      }

      // Match caste ID if provided
      let cstId: number | null = source.caste_id || source.caste_rel?.id || null;

      // Match education ID
      let eduId: number | null = source.education_id || source.education?.id || null;
      if (!eduId && source.highest_education && educations.length > 0) {
        const match = educations.find(e => e.name.toLowerCase() === String(source.highest_education).toLowerCase());
        if (match) eduId = match.id;
      }

      // Match profession ID
      let profId: number | null = source.profession_id || source.profession?.id || null;
      if (!profId && source.occupation && professions.length > 0) {
        const match = professions.find(p => p.name.toLowerCase() === String(source.occupation).toLowerCase());
        if (match) profId = match.id;
      }

      // Match country ID
      let cntryId: number | null = source.country_id || source.country_rel?.id || null;
      if (!cntryId && source.country && countries.length > 0) {
        const match = countries.find(c => c.name.toLowerCase() === String(source.country).toLowerCase());
        if (match) cntryId = match.id;
      }

      // Match language IDs
      let langIds: number[] = Array.isArray(source.language_ids) ? source.language_ids : [];
      if (langIds.length === 0 && Array.isArray(source.languages)) {
        langIds = source.languages.map((l: any) => l.id).filter(Boolean);
      }

      // Match hobby IDs
      let hbIds: number[] = Array.isArray(source.hobby_ids) ? source.hobby_ids : [];
      if (hbIds.length === 0 && Array.isArray(source.hobbies)) {
        hbIds = source.hobbies.map((h: any) => h.id).filter(Boolean);
      }

      setFormData(prev => ({
        ...prev,
        profile_name: sourceName || prev.profile_name,
        date_of_birth: source.date_of_birth || (currentUser as any)?.dob || (currentUser as any)?.date_of_birth || prev.date_of_birth || '',
        gender: source.gender || prev.gender,
        height: source.height ? String(source.height) : prev.height,
        weight: source.weight ? String(source.weight) : prev.weight,
        complexion: source.complexion || prev.complexion,
        marital_status: source.marital_status || prev.marital_status,
        about_me: source.about_me || source.about || prev.about_me,

        // Children & Disability
        children_count: source.children_count !== undefined && source.children_count !== null ? Number(source.children_count) : prev.children_count,
        children_living_status: source.children_living_status || prev.children_living_status,
        physical_status: source.physical_status === 'Physically Challenged' || source.physical_disability === 'YES'
          ? 'Yes'
          : (source.physical_status === 'Normal' || source.physical_disability === 'NO' ? 'No' : (source.physical_status || prev.physical_status || '')),
        physical_disability: source.physical_disability || (source.physical_status === 'Physically Challenged' ? 'YES' : (source.physical_status === 'Normal' ? 'NO' : (prev.physical_disability || ''))),
        disability_information: source.disability_information || (source as any).disability_info || prev.disability_information,

        education_id: eduId ?? prev.education_id,
        highest_education: source.highest_education || source.education || prev.highest_education,
        education_detail: source.education_detail || prev.education_detail,
        profession_id: profId ?? prev.profession_id,
        occupation: source.occupation || source.profession || prev.occupation,
        job_title: source.job_title || prev.job_title,
        annual_income: source.annual_income ? String(source.annual_income) : (source.formatted_annual_income || prev.annual_income),
        annual_income_id: source.annual_income_id ?? prev.annual_income_id,

        religion_id: relId ?? prev.religion_id,
        religion: source.religion || source.religion_rel?.name || prev.religion,
        caste_id: cstId ?? prev.caste_id,
        caste: source.caste || source.caste_rel?.name || prev.caste,
        sub_caste: source.sub_caste || prev.sub_caste,
        gothram: source.gothram || prev.gothram,
        rashi: source.rashi || prev.rashi,
        nakshatra: source.nakshatra || prev.nakshatra,
        dosha: source.dosha || prev.dosha,
        birth_place: source.birth_place || prev.birth_place,
        birth_time: source.birth_time || prev.birth_time,

        // Family Background
        family_type: source.family_type || prev.family_type,
        family_status: source.family_status || prev.family_status,
        family_values: source.family_values || prev.family_values,
        father_occupation: source.father_occupation || prev.father_occupation,
        mother_occupation: source.mother_occupation || prev.mother_occupation,
        brothers_count: source.brothers_count !== undefined ? Number(source.brothers_count) : prev.brothers_count,
        brothers_married_count: source.brothers_married_count !== undefined ? Number(source.brothers_married_count) : prev.brothers_married_count,
        sisters_count: source.sisters_count !== undefined ? Number(source.sisters_count) : prev.sisters_count,
        sisters_married_count: source.sisters_married_count !== undefined ? Number(source.sisters_married_count) : prev.sisters_married_count,
        living_with_parents: source.living_with_parents !== undefined ? Boolean(source.living_with_parents) : prev.living_with_parents,
        family_location: source.family_location || prev.family_location,
        family_information: source.family_information || prev.family_information,

        languages_known: Array.isArray(source.languages_known) ? source.languages_known.join(', ') : (source.languages_known || prev.languages_known),
        language_ids: langIds.length > 0 ? langIds : prev.language_ids,
        hobbies_interests: Array.isArray(source.hobbies_interests) ? source.hobbies_interests.join(', ') : (source.hobbies_interests || prev.hobbies_interests),
        hobby_ids: hbIds.length > 0 ? hbIds : prev.hobby_ids,

        country_id: cntryId ?? prev.country_id,
        country: source.country || source.country_rel?.name || prev.country,
        state_id: source.state_id || source.state_rel?.id || prev.state_id,
        state: source.state || source.state_rel?.name || prev.state,
        district_id: source.district_id || source.district_rel?.id || prev.district_id,
        city: source.city || prev.city,
        mandal_id: source.mandal_id || source.mandal_rel?.id || prev.mandal_id,
        village_id: source.village_id || source.village_rel?.id || prev.village_id,
        pincode: source.pincode || prev.pincode,
        address_line: source.address_line || prev.address_line,

        profile_photo: photo || prev.profile_photo,
        video_introduction: source.video_introduction || source.video_url || prev.video_introduction,
      }));

      if (photo) {
        updateCurrentUserAvatar(photo);
      }
    }
  }, [profile, religions, educations, professions, countries]);

  // Handle generic field changes
  const handleFieldChange = (field: keyof FormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (apiErrorMessage) {
      setApiErrorMessage(null);
    }
  };

  // Religion change with Caste reset
  const handleReligionChange = (religionIdStr: string) => {
    const id = religionIdStr ? Number(religionIdStr) : null;
    const selected = religions.find(r => r.id === id);
    setFormData(prev => ({
      ...prev,
      religion_id: id,
      religion: selected ? selected.name : '',
      caste_id: null,
      caste: '',
    }));
  };

  // Caste change
  const handleCasteChange = (casteIdStr: string) => {
    const id = casteIdStr ? Number(casteIdStr) : null;
    const selected = castes.find(c => c.id === id);
    setFormData(prev => ({
      ...prev,
      caste_id: id,
      caste: selected ? selected.name : '',
    }));
  };

  // Education change
  const handleEducationChange = (eduIdStr: string) => {
    const id = eduIdStr ? Number(eduIdStr) : null;
    const selected = educations.find(e => e.id === id);
    setFormData(prev => ({
      ...prev,
      education_id: id,
      highest_education: selected ? selected.name : '',
    }));
  };

  // Profession change
  const handleProfessionChange = (profIdStr: string) => {
    const id = profIdStr ? Number(profIdStr) : null;
    const selected = professions.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      profession_id: id,
      occupation: selected ? selected.name : '',
    }));
  };

  // Income Range change
  const handleIncomeChange = (val: string) => {
    const matched = incomeRanges.find(i => i.label === val);
    setFormData(prev => ({
      ...prev,
      annual_income: val,
      annual_income_id: matched ? matched.id : prev.annual_income_id
    }));
  };

  // Cascading Location Handlers
  const handleCountryChange = (countryIdStr: string) => {
    const id = countryIdStr ? Number(countryIdStr) : null;
    const selected = countries.find(c => c.id === id);
    setFormData(prev => ({
      ...prev,
      country_id: id,
      country: selected ? selected.name : '',
      state_id: null,
      state: '',
      district_id: null,
      city: '',
      mandal_id: null,
      village_id: null,
    }));
  };

  const handleStateChange = (stateIdStr: string) => {
    const id = stateIdStr ? Number(stateIdStr) : null;
    const selected = states.find(s => s.id === id);
    setFormData(prev => ({
      ...prev,
      state_id: id,
      state: selected ? selected.name : '',
      district_id: null,
      city: '',
      mandal_id: null,
      village_id: null,
    }));
  };

  const handleDistrictChange = (districtIdStr: string) => {
    const id = districtIdStr ? Number(districtIdStr) : null;
    const selected = districts.find(d => d.id === id);
    setFormData(prev => ({
      ...prev,
      district_id: id,
      city: selected ? selected.name : '',
      mandal_id: null,
      village_id: null,
    }));
  };

  const handleMandalChange = (mandalIdStr: string) => {
    const id = mandalIdStr ? Number(mandalIdStr) : null;
    setFormData(prev => ({
      ...prev,
      mandal_id: id,
      village_id: null,
    }));
  };

  const handleVillageChange = (villageIdStr: string) => {
    const id = villageIdStr ? Number(villageIdStr) : null;
    const selected = villages.find(v => v.id === id);
    setFormData(prev => ({
      ...prev,
      village_id: id,
      pincode: selected?.pincode || prev.pincode
    }));
  };

  // Multi-select for languages
  const toggleLanguage = (lang: { id: number; name: string }) => {
    setFormData(prev => {
      const exists = prev.language_ids.includes(lang.id);
      const newIds = exists
        ? prev.language_ids.filter(id => id !== lang.id)
        : [...prev.language_ids, lang.id];
      const selectedNames = languages
        .filter(l => newIds.includes(l.id))
        .map(l => l.name);

      return {
        ...prev,
        language_ids: newIds,
        languages_known: selectedNames.join(', ')
      };
    });
  };

  // Multi-select for hobbies
  const toggleHobby = (hobby: { id: number; name: string }) => {
    setFormData(prev => {
      const exists = prev.hobby_ids.includes(hobby.id);
      const newIds = exists
        ? prev.hobby_ids.filter(id => id !== hobby.id)
        : [...prev.hobby_ids, hobby.id];
      const selectedNames = hobbies
        .filter(h => newIds.includes(h.id))
        .map(h => h.name);

      return {
        ...prev,
        hobby_ids: newIds,
        hobbies_interests: selectedNames.join(', ')
      };
    });
  };

  // Calculate dynamic Profile Completion Percentage
  const completionPercentage = useMemo(() => {
    const checks = [
      Boolean(formData.profile_name),
      Boolean(formData.gender),
      Boolean(formData.height),
      Boolean(formData.marital_status),
      Boolean(formData.about_me && formData.about_me.length >= 10),
      Boolean(formData.highest_education || formData.education_id),
      Boolean(formData.occupation || formData.profession_id),
      Boolean(formData.annual_income),
      Boolean(formData.religion || formData.religion_id),
      Boolean(formData.caste || formData.caste_id),
      Boolean(formData.language_ids.length > 0 || formData.languages_known),
      Boolean(formData.country_id || formData.country),
      Boolean(formData.state_id || formData.state),
      Boolean(formData.profile_photo),
    ];
    const filledCount = checks.filter(Boolean).length;
    return Math.min(100, Math.round((filledCount / checks.length) * 100));
  }, [formData]);

  // Validation before save
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.profile_name.trim()) {
      errors.profile_name = 'Profile name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Height parse helper
  const parseHeight = (val: string): number | null => {
    if (!val) return null;
    const n = parseFloat(val);
    if (isNaN(n)) return null;
    if (n > 30) {
      return parseFloat((n / 30.48).toFixed(1));
    }
    return n;
  };

  // Income parse helper
  const parseIncome = (val: any): number | null => {
    if (!val) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const str = String(val);
    const nums = str.match(/(\d+(\.\d+)?)/g);
    if (!nums || nums.length === 0) return null;
    const valFloat = parseFloat(nums[0]);
    if (str.toLowerCase().includes('lakh')) {
      return Math.round(valFloat * 100000);
    }
    if (str.toLowerCase().includes('crore')) {
      return Math.round(valFloat * 10000000);
    }
    if (valFloat > 1000) return Math.round(valFloat);
    return Math.round(valFloat * 100000);
  };

  // Save changes handler (PUT /api/profile/update/ or POST /api/profile/create/)
  const handleSaveChanges = async () => {
    setApiErrorMessage(null);

    if (!validateForm()) {
      showToast('Please fill in the required fields before saving.');
      return;
    }

    try {
      setIsSubmitting(true);

      const matchedIncome = incomeRanges.find(i => i.label === formData.annual_income || String(i.id) === String(formData.annual_income_id));
      const incomeId = matchedIncome ? matchedIncome.id : (formData.annual_income_id ? Number(formData.annual_income_id) : null);
      const parsedIncomeVal = matchedIncome && matchedIncome.min_value ? parseInt(matchedIncome.min_value, 10) : parseIncome(formData.annual_income);

      const payload: ProfileUpdateRequest = {
        profile_name: formData.profile_name.trim() || undefined,
        about_me: formData.about_me.trim() || '',
        height: parseHeight(formData.height),
        weight: formData.weight ? parseFloat(formData.weight) || null : null,
        complexion: formData.complexion || null,
        marital_status: formData.marital_status || null,
        children_count: formData.children_count !== undefined && formData.children_count !== null ? Number(formData.children_count) : 0,
        children_living_status: formData.children_living_status || '',
        physical_status: formData.physical_status === 'Yes' || formData.physical_status === 'Physically Challenged'
          ? 'Physically Challenged'
          : (formData.physical_status === 'No' ? 'Normal' : (formData.physical_status || null)),
        physical_disability: formData.physical_status === 'Yes' || formData.physical_status === 'Physically Challenged'
          ? 'YES'
          : (formData.physical_status === 'No' ? 'NO' : null),
        disability_information: formData.disability_information || '',

        // Education & Career
        education_id: formData.education_id,
        highest_education: formData.highest_education || '',
        education_detail: formData.education_detail || '',
        profession_id: formData.profession_id,
        occupation: formData.occupation || '',
        job_title: formData.job_title || '',
        annual_income: parsedIncomeVal,
        annual_income_id: incomeId,

        // Religion & Horoscope
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

        // Family Background
        family_type: formData.family_type || '',
        family_status: formData.family_status || '',
        family_values: formData.family_values || '',
        father_occupation: formData.father_occupation || '',
        mother_occupation: formData.mother_occupation || '',
        brothers_count: Number(formData.brothers_count) || 0,
        brothers_married_count: Number(formData.brothers_married_count) || 0,
        sisters_count: Number(formData.sisters_count) || 0,
        sisters_married_count: Number(formData.sisters_married_count) || 0,
        living_with_parents: formData.living_with_parents !== null ? Boolean(formData.living_with_parents) : null,
        family_location: formData.family_location || '',
        family_information: formData.family_information || '',

        // Languages & Hobbies
        languages_known: formData.languages_known || '',
        language_ids: formData.language_ids.length > 0 ? formData.language_ids : undefined,
        hobbies_interests: formData.hobbies_interests || '',
        hobby_ids: formData.hobby_ids.length > 0 ? formData.hobby_ids : undefined,

        // Location
        country_id: formData.country_id,
        country: formData.country || '',
        state_id: formData.state_id,
        state: formData.state || '',
        district_id: formData.district_id,
        city: formData.city || '',
        mandal_id: formData.mandal_id,
        village_id: formData.village_id,
        pincode: formData.pincode || '',
        address_line: formData.address_line || '',

        // Media
        profile_photo: formData.profile_photo || null,
        video_introduction: formData.video_introduction || null,
      };

      try {
        if (profile?.id) {
          await updateProfileMutation.mutateAsync(payload);
        } else {
          // If no profile exists yet, call create
          await createProfileMutation.mutateAsync(payload as any);
        }

        await checkProfileStatus();
        refetch();
        showToast('Profile updated successfully! ✨');
      } catch (err: any) {
        // Safe user-friendly error message without raw backend dumps
        const safeMsg = err?.message?.replace(/AxiosError.*?:/i, '').trim() ||
          'Failed to update profile. Please review entered details.';
        setApiErrorMessage(safeMsg);
        showToast(safeMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center text-xs font-bold text-stone-600 hover:text-[#8B1E3F] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to My Profile
          </button>

          {isProfileLoading && (
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <DotsLoader size="sm" />
              <span>Loading profile...</span>
            </div>
          )}
        </div>

        {/* HEADER & PROGRESS BAR */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Edit Profile
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Update your matrimonial details and preferences
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="bg-[#8B1E3F] hover:bg-[#721733] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>

          {/* Profile Completion Bar */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-stone-700">Profile Completion</span>
              <span className="text-[#8B1E3F] font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B1E3F] to-amber-600 transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* API Error Notification Banner */}
          {apiErrorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Unable to save profile</p>
                <p className="text-rose-700 mt-0.5">{apiErrorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* ─── SECTION 1: BASIC INFORMATION ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
          <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <User className="h-4 w-4 text-[#8B1E3F]" /> Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Profile Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Profile Name / Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formData.profile_name}
                onChange={e => handleFieldChange('profile_name', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={e => handleFieldChange('date_of_birth', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={e => handleFieldChange('gender', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Height
              </label>
              <select
                value={formData.height}
                onChange={e => handleFieldChange('height', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Height</option>
                <option value="5.0">5' 0" (152 cm)</option>
                <option value="5.1">5' 1" (155 cm)</option>
                <option value="5.2">5' 2" (157 cm)</option>
                <option value="5.3">5' 3" (160 cm)</option>
                <option value="5.4">5' 4" (162 cm)</option>
                <option value="5.5">5' 5" (165 cm)</option>
                <option value="5.6">5' 6" (168 cm)</option>
                <option value="5.7">5' 7" (170 cm)</option>
                <option value="5.8">5' 8" (173 cm)</option>
                <option value="5.9">5' 9" (175 cm)</option>
                <option value="5.10">5' 10" (178 cm)</option>
                <option value="5.11">5' 11" (180 cm)</option>
                <option value="6.0">6' 0" (183 cm)</option>
                <option value="6.1">6' 1" (185 cm)</option>
                <option value="6.2">6' 2" (188 cm)</option>
                <option value="6.3">6' 3" (190 cm)</option>
              </select>
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Marital Status
              </label>
              <select
                value={formData.marital_status}
                onChange={e => handleFieldChange('marital_status', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Marital Status</option>
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
            </div>

            {/* Complexion */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Complexion
              </label>
              <select
                value={formData.complexion}
                onChange={e => handleFieldChange('complexion', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Complexion</option>
                <option value="Fair">Fair</option>
                <option value="Very Fair">Very Fair</option>
                <option value="Wheatish">Wheatish</option>
                <option value="Dark">Dark</option>
              </select>
            </div>

            {/* Children Count */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Children Count
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.children_count}
                onChange={e => handleFieldChange('children_count', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Children Living Status */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Children Living Status
              </label>
              <select
                value={formData.children_living_status}
                onChange={e => handleFieldChange('children_living_status', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Living Status</option>
                <option value="Living with me">Living with me</option>
                <option value="Not living with me">Not living with me</option>
                <option value="Shared custody">Shared custody</option>
                <option value="None">None</option>
              </select>
            </div>

            {/* Physical Disability */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Physical Disability
              </label>
              <select
                value={formData.physical_status}
                onChange={e => handleFieldChange('physical_status', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Physical Status</option>
                <option value="No">No (Normal)</option>
                <option value="Yes">Yes (Physically Challenged)</option>
              </select>
            </div>

            {/* Disability Information */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Disability Information (If applicable)
              </label>
              <input
                type="text"
                placeholder="Provide details if any..."
                value={formData.disability_information}
                onChange={e => handleFieldChange('disability_information', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>
          </div>

          {/* About Me */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              About Me / Bio
            </label>
            <textarea
              rows={3}
              placeholder="Tell prospective matches about your personality, family values, and what kind of partner you are looking for..."
              value={formData.about_me}
              onChange={e => handleFieldChange('about_me', e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
            />
          </div>
        </Card>

        {/* ─── SECTION 2: EDUCATION & CAREER ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
          <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <GraduationCap className="h-4 w-4 text-[#8B1E3F]" /> Education & Career
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education (API Driven) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Education <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.education_id || ''}
                  onChange={e => handleEducationChange(e.target.value)}
                  disabled={isLoadingEducations}
                  className={`w-full bg-stone-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none ${
                    formErrors.highest_education ? 'border-rose-500' : 'border-stone-300'
                  }`}
                >
                  <option value="">{isLoadingEducations ? 'Loading educations...' : 'Select Education'}</option>
                  {educations.map(edu => (
                    <option key={edu.id} value={edu.id}>
                      {edu.name} {edu.degree_level ? `(${edu.degree_level})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {formErrors.highest_education && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.highest_education}</p>
              )}
            </div>

            {/* Education Detail / Degree */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Education Detail / Specialization
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech in Computer Science"
                value={formData.education_detail}
                onChange={e => handleFieldChange('education_detail', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Profession (API Driven) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Profession / Occupation <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.profession_id || ''}
                  onChange={e => handleProfessionChange(e.target.value)}
                  disabled={isLoadingProfessions}
                  className={`w-full bg-stone-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none ${
                    formErrors.occupation ? 'border-rose-500' : 'border-stone-300'
                  }`}
                >
                  <option value="">{isLoadingProfessions ? 'Loading professions...' : 'Select Profession'}</option>
                  {professions.map(prof => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name} {prof.category ? `• ${prof.category}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {formErrors.occupation && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.occupation}</p>
              )}
            </div>

            {/* Income Range (API Driven) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Annual Income
              </label>
              <div className="relative">
                <select
                  value={formData.annual_income}
                  onChange={e => handleIncomeChange(e.target.value)}
                  disabled={isLoadingIncomes}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none"
                >
                  <option value="">{isLoadingIncomes ? 'Loading income ranges...' : 'Select Income Range'}</option>
                  {incomeRanges.map(inc => (
                    <option key={inc.id} value={inc.label}>
                      {inc.label}
                    </option>
                  ))}
                  {/* Fallback option if custom value */}
                  {formData.annual_income && !incomeRanges.some(i => i.label === formData.annual_income) && (
                    <option value={formData.annual_income}>{formData.annual_income}</option>
                  )}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Job Title / Role */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Job Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Full Stack Architect"
                value={formData.job_title}
                onChange={e => handleFieldChange('job_title', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>
          </div>
        </Card>

        {/* ─── SECTION 3: RELIGION, COMMUNITY & HOROSCOPE ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
          <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <Sparkles className="h-4 w-4 text-[#8B1E3F]" /> Religion, Community & Horoscope
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Religion (API Driven) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Religion <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.religion_id || ''}
                  onChange={e => handleReligionChange(e.target.value)}
                  disabled={isLoadingReligions}
                  className={`w-full bg-stone-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none ${
                    formErrors.religion ? 'border-rose-500' : 'border-stone-300'
                  }`}
                >
                  <option value="">{isLoadingReligions ? 'Loading religions...' : 'Select Religion'}</option>
                  {religions.map(rel => (
                    <option key={rel.id} value={rel.id}>
                      {rel.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              {formErrors.religion && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">{formErrors.religion}</p>
              )}
            </div>

            {/* Caste (Dependent on Religion) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Caste (Dependent on Religion)
              </label>
              <div className="relative">
                <select
                  value={formData.caste_id || ''}
                  onChange={e => handleCasteChange(e.target.value)}
                  disabled={!formData.religion_id || isLoadingCastes}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none disabled:opacity-60"
                >
                  <option value="">
                    {!formData.religion_id
                      ? 'Select Religion first'
                      : isLoadingCastes
                      ? 'Loading castes...'
                      : castes.length === 0
                      ? 'No castes listed (optional)'
                      : 'Select Caste'}
                  </option>
                  {castes.map(cst => (
                    <option key={cst.id} value={cst.id}>
                      {cst.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Sub-caste */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Sub-Caste (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Smartha, Kapu, etc."
                value={formData.sub_caste}
                onChange={e => handleFieldChange('sub_caste', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Gothram */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Gothram (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Kashyapa, Bharadwaja"
                value={formData.gothram}
                onChange={e => handleFieldChange('gothram', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Birth Place */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Birth Place
              </label>
              <input
                type="text"
                placeholder="City, State"
                value={formData.birth_place}
                onChange={e => handleFieldChange('birth_place', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Birth Time */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Birth Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.birth_time}
                  onChange={e => handleFieldChange('birth_time', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-3.5 pr-9 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
                />
                <Clock className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Moon Sign (Rashi) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Moon Sign (Rashi)
              </label>
              <input
                type="text"
                placeholder="e.g. Mesha, Vrishabha, Mithuna"
                value={formData.rashi}
                onChange={e => handleFieldChange('rashi', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Star (Nakshatra) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Star (Nakshatra)
              </label>
              <input
                type="text"
                placeholder="e.g. Rohini, Ashwini"
                value={formData.nakshatra}
                onChange={e => handleFieldChange('nakshatra', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Dosha / Manglik */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Dosha / Manglik
              </label>
              <select
                value={formData.dosha}
                onChange={e => handleFieldChange('dosha', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Dosha</option>
                <option value="No Dosha">No Dosha</option>
                <option value="Manglik">Manglik</option>
                <option value="Sarpa Dosha">Sarpa Dosha</option>
                <option value="Kala Sarpa Dosha">Kala Sarpa Dosha</option>
                <option value="Rahu Dosha">Rahu Dosha</option>
                <option value="Ketu Dosha">Ketu Dosha</option>
                <option value="Don't Know">Don't Know</option>
              </select>
            </div>
          </div>
        </Card>

        {/* ─── SECTION 4: FAMILY BACKGROUND ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
          <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <Users className="h-4 w-4 text-[#8B1E3F]" /> Family Background
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Family Type */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Family Type
              </label>
              <select
                value={formData.family_type}
                onChange={e => handleFieldChange('family_type', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Family Type</option>
                <option value="Nuclear">Nuclear</option>
                <option value="Joint">Joint</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Family Status */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Family Status
              </label>
              <select
                value={formData.family_status}
                onChange={e => handleFieldChange('family_status', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Family Status</option>
                <option value="Middle Class">Middle Class</option>
                <option value="Upper Middle Class">Upper Middle Class</option>
                <option value="Rich">Rich</option>
                <option value="Affluent">Affluent</option>
                <option value="Modest">Modest</option>
              </select>
            </div>

            {/* Family Values */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Family Values
              </label>
              <select
                value={formData.family_values}
                onChange={e => handleFieldChange('family_values', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Family Values</option>
                <option value="Traditional">Traditional</option>
                <option value="Moderate">Moderate</option>
                <option value="Liberal">Liberal</option>
              </select>
            </div>

            {/* Father's Profession */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Father's Profession
              </label>
              <input
                type="text"
                placeholder="e.g. Business, Government Service, Retired"
                value={formData.father_occupation}
                onChange={e => handleFieldChange('father_occupation', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Mother's Profession */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Mother's Profession
              </label>
              <input
                type="text"
                placeholder="e.g. Homemaker, Teacher, Doctor"
                value={formData.mother_occupation}
                onChange={e => handleFieldChange('mother_occupation', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Living with Parents */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Living with Parents
              </label>
              <select
                value={formData.living_with_parents === true ? 'Yes' : (formData.living_with_parents === false ? 'No' : '')}
                onChange={e => handleFieldChange('living_with_parents', e.target.value === '' ? null : e.target.value === 'Yes')}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              >
                <option value="">Select Status</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Brothers Count */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Brothers Count
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.brothers_count}
                onChange={e => handleFieldChange('brothers_count', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Sisters Count */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Sisters Count
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={formData.sisters_count}
                onChange={e => handleFieldChange('sisters_count', Number(e.target.value))}
                placeholder="0"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>

            {/* Family Location / Native */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Family Native Location
              </label>
              <input
                type="text"
                placeholder="e.g. Hyderabad, Telangana"
                value={formData.family_location}
                onChange={e => handleFieldChange('family_location', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>
          </div>

          {/* Family Information */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              About Family / Background Details
            </label>
            <textarea
              rows={3}
              placeholder="Additional information about family traditions, values, or background..."
              value={formData.family_information}
              onChange={e => handleFieldChange('family_information', e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
            />
          </div>
        </Card>

        {/* ─── SECTION 5: LANGUAGES & INTERESTS ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-6">
          <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <Heart className="h-4 w-4 text-[#8B1E3F]" /> Languages & Interests
          </h2>

          {/* Languages Known (Multi-select) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              Languages Known (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {languages.map(lang => {
                const isSelected = formData.language_ids.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#8B1E3F] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                    {lang.name}
                  </button>
                );
              })}
            </div>
            {formData.languages_known && (
              <p className="text-[11px] text-stone-500 mt-1">Selected: {formData.languages_known}</p>
            )}
          </div>

          {/* Hobbies / Interests (Multi-select) */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700">
              Hobbies & Interests (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {hobbies.map(hobby => {
                const isSelected = formData.hobby_ids.includes(hobby.id);
                return (
                  <button
                    key={hobby.id}
                    type="button"
                    onClick={() => toggleHobby(hobby)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                    {hobby.name}
                  </button>
                );
              })}
            </div>
            {formData.hobbies_interests && (
              <p className="text-[11px] text-stone-500 mt-1">Selected: {formData.hobbies_interests}</p>
            )}
          </div>
        </Card>

        {/* ─── SECTION 5: LOCATION HIERARCHY ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
          <div>
            <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-1 border-b border-stone-100">
              <MapPin className="h-4 w-4 text-[#8B1E3F]" /> Location
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Cascading location hierarchy: Country → State → District → Mandal → Village
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Country */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Country
              </label>
              <div className="relative">
                <select
                  value={formData.country_id || ''}
                  onChange={e => handleCountryChange(e.target.value)}
                  disabled={isLoadingCountries}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none"
                >
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                State
              </label>
              <div className="relative">
                <select
                  value={formData.state_id || ''}
                  onChange={e => handleStateChange(e.target.value)}
                  disabled={!formData.country_id || isLoadingStates}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none disabled:opacity-60"
                >
                  <option value="">
                    {!formData.country_id ? 'Select Country first' : isLoadingStates ? 'Loading states...' : 'Select State'}
                  </option>
                  {states.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                District
              </label>
              <div className="relative">
                <select
                  value={formData.district_id || ''}
                  onChange={e => handleDistrictChange(e.target.value)}
                  disabled={!formData.state_id || isLoadingDistricts}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none disabled:opacity-60"
                >
                  <option value="">
                    {!formData.state_id ? 'Select State first' : isLoadingDistricts ? 'Loading districts...' : 'Select District'}
                  </option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Mandal */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Mandal
              </label>
              <div className="relative">
                <select
                  value={formData.mandal_id || ''}
                  onChange={e => handleMandalChange(e.target.value)}
                  disabled={!formData.district_id || isLoadingMandals}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none disabled:opacity-60"
                >
                  <option value="">
                    {!formData.district_id ? 'Select District first' : isLoadingMandals ? 'Loading mandals...' : 'Select Mandal'}
                  </option>
                  {mandals.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Village */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Village
              </label>
              <div className="relative">
                <select
                  value={formData.village_id || ''}
                  onChange={e => handleVillageChange(e.target.value)}
                  disabled={!formData.mandal_id || isLoadingVillages}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F] appearance-none disabled:opacity-60"
                >
                  <option value="">
                    {!formData.mandal_id ? 'Select Mandal first' : isLoadingVillages ? 'Loading villages...' : 'Select Village'}
                  </option>
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.pincode ? `(${v.pincode})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="h-4 w-4 text-stone-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Pincode
              </label>
              <input
                type="text"
                placeholder="e.g. 500001"
                value={formData.pincode}
                onChange={e => handleFieldChange('pincode', e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              />
            </div>
          </div>
        </Card>

        {/* ─── SECTION 6: PHOTOS & MEDIA ─── */}
        <Card className="p-5 sm:p-7 bg-white border border-stone-200 rounded-2xl shadow-xs space-y-5">
          <h2 className="text-[0.95rem] font-bold text-stone-900 flex items-center gap-2 pb-3 border-b border-stone-100">
            <Camera className="h-4 w-4 text-[#8B1E3F]" /> Photos & Media
          </h2>

          <MediaUploadSection
            photoUrl={formData.profile_photo}
            onPhotoChange={url => handleFieldChange('profile_photo', url)}
            videoUrl={formData.video_introduction}
            onVideoChange={url => handleFieldChange('video_introduction', url)}
          />
        </Card>

        {/* BOTTOM SAVE ACTIONS */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500 font-medium text-center sm:text-left">
            Profile Completion: <span className="font-bold text-[#8B1E3F]">{completionPercentage}%</span> completed.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold text-xs cursor-pointer transition-all"
            >
              Cancel
            </button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveChanges}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-[#8B1E3F] hover:bg-[#721733] text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
