import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit3,
  Sliders,
  MapPin,
  Briefcase,
  GraduationCap,
  Camera,
  Users,
  Copy,
  Check,
  Eye,
  Plus,
  RefreshCw,
  Heart,
  Sun,
  Shield,
  ArrowRight,
  X,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { useProfile, useProfileGallery } from '../../hooks/useProfile';
import { useMyMembership } from '../../hooks/useMembership';
import { usePartnerPreferences } from '../../hooks/usePartnerPreferences';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';

// ── Safe Text & Object Resolution Helpers ──────────────────────────
function toText(val: any, fallback = ''): string {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed ? trimmed : fallback;
  }
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    const items = val.map((item) => toText(item, '')).filter(Boolean);
    return items.length > 0 ? items.join(', ') : fallback;
  }
  if (typeof val === 'object') {
    return (
      val.name ||
      val.title ||
      val.label ||
      val.range_label ||
      val.value ||
      val.first_name ||
      val.description ||
      fallback
    );
  }
  return String(val);
}

function toTextArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item) => toText(item, '')).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [toText(val, '')].filter(Boolean);
}

export function isFilled(val: any): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const trimmed = val.trim().toLowerCase();
    return (
      trimmed !== '' &&
      trimmed !== 'not specified' &&
      trimmed !== 'not_specified' &&
      trimmed !== 'n/a' &&
      trimmed !== 'none' &&
      trimmed !== 'null' &&
      trimmed !== 'undefined'
    );
  }
  if (typeof val === 'number') {
    return !isNaN(val) && val > 0;
  }
  if (Array.isArray(val)) {
    return val.length > 0 && val.some((item) => isFilled(item));
  }
  if (typeof val === 'boolean') {
    return true;
  }
  return Boolean(val);
}

function formatHeight(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (str.includes("'") || str.includes('cm') || str.includes('ft')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str);
  if (isNaN(num) || num <= 0) return '';
  if (num > 100) {
    const feetTotal = num / 30.48;
    const feet = Math.floor(feetTotal);
    const inches = Math.round((feetTotal - feet) * 12);
    return `${feet}' ${inches}" (${Math.round(num)} cm)`;
  }
  if (num <= 10) {
    const feet = Math.floor(num);
    const inches = Math.round((num - feet) * 10);
    const totalCm = Math.round((feet * 12 + inches) * 2.54);
    return `${feet}' ${inches}" (${totalCm} cm)`;
  }
  return `${str} cm`;
}

const RAILWAY_BASE_ORIGIN = 'https://matrimony-production-4b00.up.railway.app';

function isDummyImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase().trim();
  if (!lower) return true;
  return (
    lower.includes('placeholder') ||
    lower.includes('dummy') ||
    lower.includes('ui-avatars.com') ||
    lower.includes('recommended_bride') ||
    lower.includes('recommended_groom')
  );
}

function formatMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (isDummyImage(trimmed)) return '';
  if (trimmed.startsWith('/images/') || trimmed.startsWith('images/')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${RAILWAY_BASE_ORIGIN}${cleanPath}`;
}

function formatWeight(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (str.toLowerCase().includes('kg') || str.toLowerCase().includes('lbs')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str);
  if (isNaN(num) || num <= 0) return '';
  return `${Math.round(num)} kg`;
}

function formatIncome(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (str.includes('Lakh') || str.includes('₹') || str.includes('Crore') || str.includes('INR')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str.replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return '';
  if (num >= 10000000) {
    return `₹ ${(num / 10000000).toFixed(1)} Crores / Year`;
  }
  if (num >= 100000) {
    return `₹ ${Math.round(num / 100000)} Lakhs / Year`;
  }
  return `₹ ${num} / Year`;
}

function calculateAge(dobStr: any): number | null {
  if (!dobStr) return null;
  try {
    const birthDate = new Date(dobStr);
    if (isNaN(birthDate.getTime())) return null;
    const diffMs = Date.now() - birthDate.getTime();
    const ageDt = new Date(diffMs);
    const age = Math.abs(ageDt.getUTCFullYear() - 1970);
    return age > 0 && age < 120 ? age : null;
  } catch {
    return null;
  }
}

interface ProfileFieldItem {
  label: string;
  value: string;
}

export const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, verificationStatus, profileStatus, showToast } = useApp();
  const { data: apiProfile, isFetching } = useProfile();
  const { data: membershipData } = useMyMembership();
  const { data: galleryImages } = useProfileGallery();
  const { data: partnerPrefs } = usePartnerPreferences();

  const [copiedId, setCopiedId] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // 1. Retrieve local draft backup if server returns empty or during cold start
  let localDraft: any = null;
  try {
    const localDraftRaw = localStorage.getItem('user_profile_draft');
    if (localDraftRaw) {
      localDraft = JSON.parse(localDraftRaw);
    }
  } catch {}

  let localMock: any = null;
  try {
    const localMockRaw = localStorage.getItem('vivah_mock_profile');
    if (localMockRaw) {
      localMock = JSON.parse(localMockRaw);
    }
  } catch {}

  const rawServer: any = (apiProfile as any)?.data || (apiProfile as any)?.profile || (apiProfile as any)?.user_profile || (apiProfile as any)?.result || apiProfile;

  // Seamless merge: local draft fallback overridden by local mock overridden by server data
  const apiData: any = {
    ...(localDraft || {}),
    ...(localMock || {}),
    ...(rawServer || {})
  };

  // 2. Resolve Member ID & Numeric ID
  const resolvedMemberId =
    apiData.member_id ||
    apiProfile?.member_id ||
    (currentUser as any)?.member_id ||
    localStorage.getItem('member_id');

  const resolvedUserId =
    apiData.user_id ||
    apiData.user?.id ||
    apiData.id ||
    apiProfile?.id ||
    currentUser?.id ||
    localStorage.getItem('user_id');

  const numericId = resolvedUserId ? parseInt(String(resolvedUserId).replace(/\D/g, ''), 10) : 0;
  const kmId = resolvedMemberId
    ? String(resolvedMemberId)
    : numericId > 0
    ? `KM${String(numericId).padStart(6, '0')}`
    : 'KM-MEMBER';

  // 3. Real Name Resolution (Prioritize genuine user name over placeholders)
  const serverFirst = toText(apiData.first_name || apiData.firstName, '');
  const serverLast = toText(apiData.last_name || apiData.lastName, '');
  const serverFullName = serverFirst ? `${serverFirst} ${serverLast}`.trim() : toText(apiData.profile_name || apiData.name, '');
  const storedName = localStorage.getItem('logged_in_name') || '';
  const emailName = extractNameFromEmail(currentUser.email || apiData.email || localStorage.getItem('logged_in_email'));

  let resolvedName = '';
  if (serverFullName && !isGenericName(serverFullName)) {
    resolvedName = serverFullName;
  } else if (storedName && !isGenericName(storedName)) {
    resolvedName = storedName;
  } else if (currentUser.name && !isGenericName(currentUser.name)) {
    resolvedName = currentUser.name;
  } else if (emailName) {
    resolvedName = emailName;
  } else {
    resolvedName = 'Member';
  }

  // 4. Real Avatar (No dummy photos)
  const resolvedAvatar =
    formatMediaUrl(
      apiData.profile_photo ||
      apiData.photo ||
      apiData.avatar ||
      apiData.primary_profile_photo ||
      apiData.profile_image ||
      localDraft?.profile_photo ||
      currentUser.avatar
    );

  const initialLetter = resolvedName ? resolvedName.charAt(0).toUpperCase() : 'M';

  // 5. Age calculation & Display
  const serverAge = typeof apiData.age === 'number' && apiData.age > 0 ? apiData.age : null;
  const rawDob = apiData.date_of_birth || apiData.dob || localDraft?.date_of_birth || localStorage.getItem('logged_in_dob');
  const calculatedAge = serverAge || calculateAge(rawDob);
  const displayAge = calculatedAge ? `${calculatedAge} Yrs` : null;

  // 6. Detailed Field Extractions
  const profile = {
    id: numericId,
    kmId,
    name: resolvedName,
    email: toText(currentUser.email || apiData.email || localStorage.getItem('logged_in_email'), ''),
    phone: toText(apiData.phone || currentUser.phone || localStorage.getItem('logged_in_phone'), ''),
    avatar: resolvedAvatar,
    about_me: toText(apiData.about_me || apiData.about || apiData.bio || localDraft?.about_me, ''),
    gender: toText(apiData.gender || localDraft?.gender || currentUser.gender || localStorage.getItem('logged_in_gender'), ''),
    marital_status: toText(apiData.marital_status || apiData.maritalStatus || localDraft?.marital_status, ''),
    height: apiData.formatted_height || formatHeight(apiData.height ?? localDraft?.height),
    weight: formatWeight(apiData.weight ?? localDraft?.weight),
    complexion: toText(apiData.complexion || localDraft?.complexion, ''),
    mother_tongue: toText(apiData.mother_tongue || apiData.motherTongue || localDraft?.mother_tongue, ''),
    physical_status: toText(apiData.physical_status || localDraft?.physical_status, ''),
    physical_disability: toText(apiData.physical_disability || apiData.disability_information || localDraft?.disability_information, ''),

    // Education & Career
    highest_education: toText(apiData.highest_education || apiData.education || apiData.qualification || localDraft?.highest_education, ''),
    education_detail: toText(apiData.education_detail || localDraft?.education_detail, ''),
    occupation: toText(apiData.occupation || apiData.profession || apiData.job_title || localDraft?.occupation, ''),
    company_name: toText(apiData.company_name || localDraft?.company_name, ''),
    annual_income: apiData.formatted_annual_income ||
      (apiData.annual_income_rel?.range_label) ||
      formatIncome(apiData.annual_income ?? apiData.income ?? apiData.annualIncome ?? localDraft?.annual_income),
    work_location: toText(
      apiData.work_location ||
      (apiData.city && apiData.state ? `${apiData.city}, ${apiData.state}` : apiData.city || apiData.state || ''),
      ''
    ),

    // Location
    city: toText(apiData.city || localDraft?.city, ''),
    district: toText(apiData.district_rel?.name || apiData.district || localDraft?.district, ''),
    state: toText(apiData.state_rel?.name || apiData.state || localDraft?.state, ''),
    country: toText(apiData.country_rel?.name || apiData.country || localDraft?.country, ''),
    pincode: toText(apiData.pincode || localDraft?.pincode, ''),

    // Religion & Horoscope
    religion: toText(apiData.religion_rel?.name || apiData.religion || localDraft?.religion, ''),
    caste: toText(apiData.caste_rel?.name || apiData.caste || localDraft?.caste, ''),
    sub_caste: toText(apiData.sub_caste || localDraft?.sub_caste, ''),
    gothram: toText(apiData.gothram || localDraft?.gothram, ''),
    rashi: toText(apiData.rashi || localDraft?.rashi, ''),
    nakshatra: toText(apiData.nakshatra || localDraft?.nakshatra, ''),
    dosha: toText(apiData.dosha || localDraft?.dosha, ''),
    birth_place: toText(apiData.birth_place || apiData.birthPlace || apiData.place_of_birth || localDraft?.birth_place, ''),
    birth_time: toText(apiData.birth_time || apiData.birthTime || apiData.time_of_birth || localDraft?.birth_time, ''),

    // Family
    family_type: toText(apiData.family_type || localDraft?.family_type, ''),
    family_values: toText(apiData.family_values || localDraft?.family_values, ''),
    family_status: toText(apiData.family_status || localDraft?.family_status, ''),
    father_occupation: toText(apiData.father_occupation || apiData.father_profession || localDraft?.father_occupation, ''),
    mother_occupation: toText(apiData.mother_occupation || apiData.mother_profession || localDraft?.mother_occupation, ''),
    family_information: toText(apiData.family_information || apiData.family_details || apiData.family || localDraft?.family_information, ''),
    brothers_count: typeof apiData.brothers_count === 'number' ? apiData.brothers_count : (parseInt(apiData.brothers_count, 10) || 0),
    brothers_married: typeof apiData.brothers_married_count === 'number' ? apiData.brothers_married_count : (parseInt(apiData.brothers_married ?? apiData.brothers_married_count, 10) || 0),
    sisters_count: typeof apiData.sisters_count === 'number' ? apiData.sisters_count : (parseInt(apiData.sisters_count, 10) || 0),
    sisters_married: typeof apiData.sisters_married_count === 'number' ? apiData.sisters_married_count : (parseInt(apiData.sisters_married ?? apiData.sisters_married_count, 10) || 0),
    living_with_parents: apiData.living_with_parents !== undefined && apiData.living_with_parents !== null ? Boolean(apiData.living_with_parents) : null,
    family_location: toText(apiData.family_location || apiData.familyLocation || localDraft?.family_location, ''),

    // Personal & Additional
    children_count: typeof apiData.children_count === 'number' ? apiData.children_count : (parseInt(apiData.children_count, 10) || 0),
    children_living_status: toText(apiData.children_living_status || apiData.childrenLivingStatus || localDraft?.children_living_status, ''),

    // Lifestyle
    diet: toText(apiData.diet ?? localDraft?.diet, ''),
    smoking: toText(apiData.smoking ?? localDraft?.smoking, ''),
    drinking: toText(apiData.drinking ?? localDraft?.drinking, ''),
    languages_known: toTextArray(apiData.languages_known ?? apiData.languages ?? localDraft?.languages_known),
    hobbies_interests: toTextArray(apiData.hobbies_interests ?? apiData.hobbies ?? localDraft?.hobbies_interests),

    completion_percentage:
      apiData.profile_completion_percentage ||
      profileStatus.completion_percentage ||
      (apiProfile?.is_basic_complete ? 95 : 50),
  };

  const isVerified =
    verificationStatus === 'VERIFIED' ||
    Boolean((apiProfile as any)?.is_verified) ||
    Boolean(currentUser.verified);

  const planName = membershipData?.plan_name || 'Free Member';

  const locationParts = [profile.city, profile.district, profile.state, profile.country].filter((p) => isFilled(p));
  const hasLocation = locationParts.length > 0;
  const locationString = locationParts.slice(0, 2).join(', ');

  const handleCopyId = () => {
    navigator.clipboard.writeText(kmId);
    setCopiedId(true);
    showToast(`Copied Matrimony ID ${kmId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const realGalleryImages = (galleryImages || []).filter((img) => !isDummyImage(img.image_url));

  // ── DYNAMIC SECTIONS: COMPOSE ONLY FILLED FIELDS ─────────────────────

  // 1. Personal & Lifestyle Fields
  const personalItems: ProfileFieldItem[] = [
    isFilled(profile.gender) && { label: 'Gender', value: profile.gender },
    isFilled(profile.marital_status) && { label: 'Marital Status', value: profile.marital_status },
    profile.marital_status !== 'Never Married' && profile.children_count > 0 && {
      label: 'No. of Children',
      value: String(profile.children_count)
    },
    profile.marital_status !== 'Never Married' && isFilled(profile.children_living_status) && {
      label: 'Children Living Status',
      value: profile.children_living_status
    },
    isFilled(profile.height) && { label: 'Height', value: profile.height },
    isFilled(profile.weight) && { label: 'Weight', value: profile.weight },
    isFilled(profile.complexion) && { label: 'Complexion', value: profile.complexion },
    isFilled(profile.mother_tongue) && { label: 'Mother Tongue', value: profile.mother_tongue },
    isFilled(profile.diet) && { label: 'Diet', value: profile.diet },
    isFilled(profile.physical_status) && { label: 'Physical Status', value: profile.physical_status },
    isFilled(profile.physical_disability) && { label: 'Disability Details', value: profile.physical_disability },
    (isFilled(profile.smoking) || isFilled(profile.drinking)) && {
      label: 'Smoking / Drinking',
      value: [
        isFilled(profile.smoking) ? `Smoking: ${profile.smoking}` : null,
        isFilled(profile.drinking) ? `Drinking: ${profile.drinking}` : null
      ].filter(Boolean).join(' • ')
    }
  ].filter(Boolean) as ProfileFieldItem[];

  // 2. Education & Career Fields
  const educationCareerItems: ProfileFieldItem[] = [
    isFilled(profile.highest_education) && { label: 'Highest Degree', value: profile.highest_education },
    isFilled(profile.education_detail) && { label: 'Degree Detail', value: profile.education_detail },
    isFilled(profile.occupation) && { label: 'Occupation', value: profile.occupation },
    isFilled(profile.company_name) && { label: 'Company / Organization', value: profile.company_name },
    isFilled(profile.annual_income) && { label: 'Annual Income', value: profile.annual_income },
    isFilled(profile.work_location) && { label: 'Work Location', value: profile.work_location }
  ].filter(Boolean) as ProfileFieldItem[];

  // 3. Religion & Horoscope Fields
  const religionHoroscopeItems: ProfileFieldItem[] = [
    isFilled(profile.religion) && { label: 'Religion', value: profile.religion },
    isFilled(profile.caste) && { label: 'Caste', value: profile.caste },
    isFilled(profile.sub_caste) && { label: 'Sub-Caste', value: profile.sub_caste },
    isFilled(profile.gothram) && { label: 'Gothram', value: profile.gothram },
    isFilled(profile.rashi) && { label: 'Moon Sign (Rashi)', value: profile.rashi },
    isFilled(profile.nakshatra) && { label: 'Star (Nakshatra)', value: profile.nakshatra },
    isFilled(profile.dosha) && { label: 'Dosha / Manglik', value: profile.dosha },
    isFilled(profile.birth_place) && { label: 'Birth Place', value: profile.birth_place },
    isFilled(profile.birth_time) && { label: 'Birth Time', value: profile.birth_time }
  ].filter(Boolean) as ProfileFieldItem[];

  // 4. Family Background Fields
  const familyItems: ProfileFieldItem[] = [
    isFilled(profile.family_values) && { label: 'Family Values', value: profile.family_values },
    isFilled(profile.family_type) && { label: 'Family Type', value: profile.family_type },
    isFilled(profile.family_status) && { label: 'Family Status', value: profile.family_status },
    isFilled(profile.father_occupation) && { label: "Father's Profession", value: profile.father_occupation },
    isFilled(profile.mother_occupation) && { label: "Mother's Profession", value: profile.mother_occupation },
    profile.brothers_count > 0 && {
      label: 'Brothers',
      value: `${profile.brothers_count}${profile.brothers_married > 0 ? ` (${profile.brothers_married} married)` : ''}`
    },
    profile.sisters_count > 0 && {
      label: 'Sisters',
      value: `${profile.sisters_count}${profile.sisters_married > 0 ? ` (${profile.sisters_married} married)` : ''}`
    },
    profile.living_with_parents !== null && {
      label: 'Living with Parents',
      value: profile.living_with_parents ? 'Yes' : 'No'
    },
    isFilled(profile.family_location) && { label: 'Family Location', value: profile.family_location }
  ].filter(Boolean) as ProfileFieldItem[];

  // 5. Location & Residence Fields
  const locationItems: ProfileFieldItem[] = [
    isFilled(profile.city) && { label: 'City', value: profile.city },
    isFilled(profile.district) && { label: 'District', value: profile.district },
    isFilled(profile.state) && { label: 'State', value: profile.state },
    isFilled(profile.country) && { label: 'Country', value: profile.country },
    isFilled(profile.pincode) && { label: 'Pincode', value: profile.pincode }
  ].filter(Boolean) as ProfileFieldItem[];

  // 6. Partner Preferences Fields
  const partnerPrefItems: ProfileFieldItem[] = [
    (partnerPrefs?.minimum_age || partnerPrefs?.maximum_age) && {
      label: 'Preferred Age',
      value:
        partnerPrefs.minimum_age && partnerPrefs.maximum_age
          ? `${partnerPrefs.minimum_age} - ${partnerPrefs.maximum_age} Yrs`
          : partnerPrefs?.minimum_age
          ? `${partnerPrefs.minimum_age}+ Yrs`
          : `${partnerPrefs.maximum_age} Yrs Max`
    },
    (partnerPrefs?.minimum_height || partnerPrefs?.maximum_height) && {
      label: 'Preferred Height',
      value:
        partnerPrefs.minimum_height && partnerPrefs.maximum_height
          ? `${formatHeight(partnerPrefs.minimum_height)} - ${formatHeight(partnerPrefs.maximum_height)}`
          : partnerPrefs?.minimum_height
          ? `${formatHeight(partnerPrefs.minimum_height)}+`
          : `${formatHeight(partnerPrefs.maximum_height)} Max`
    },
    (isFilled(partnerPrefs?.religion) || isFilled(partnerPrefs?.caste)) && {
      label: 'Religion & Caste',
      value: [partnerPrefs?.religion, partnerPrefs?.caste].filter((v) => isFilled(v)).join(', ')
    },
    isFilled(partnerPrefs?.education) && { label: 'Education', value: String(partnerPrefs?.education) },
    (isFilled(partnerPrefs?.city) || isFilled(partnerPrefs?.state) || isFilled(partnerPrefs?.country)) && {
      label: 'Preferred Location',
      value: [partnerPrefs?.city, partnerPrefs?.state, partnerPrefs?.country].filter((v) => isFilled(v)).join(', ')
    },
    (partnerPrefs?.minimum_income || (partnerPrefs as any)?.formatted_annual_income) && {
      label: 'Preferred Income',
      value:
        (partnerPrefs as any)?.formatted_annual_income ||
        (partnerPrefs?.minimum_income
          ? `₹ ${(partnerPrefs.minimum_income / 100000).toFixed(0)} Lakhs${
              partnerPrefs.maximum_income ? ` - ₹ ${(partnerPrefs.maximum_income / 100000).toFixed(0)} Lakhs` : '+'
            }`
          : '')
    },
    ((Array.isArray(partnerPrefs?.preferred_marital_statuses) && partnerPrefs.preferred_marital_statuses.length > 0) ||
      (isFilled(partnerPrefs?.marital_status) && partnerPrefs?.marital_status !== 'Any')) && {
      label: 'Marital Status',
      value:
        Array.isArray(partnerPrefs?.preferred_marital_statuses) && partnerPrefs.preferred_marital_statuses.length > 0
          ? partnerPrefs.preferred_marital_statuses.join(', ')
          : String(partnerPrefs?.marital_status || '')
    },
    ((Array.isArray(partnerPrefs?.preferred_diets) && partnerPrefs.preferred_diets.length > 0) || isFilled(partnerPrefs?.diet)) && {
      label: 'Diet',
      value:
        (Array.isArray(partnerPrefs?.preferred_diets) && partnerPrefs.preferred_diets[0]) ||
        String(partnerPrefs?.diet || '')
    }
  ].filter(Boolean) as ProfileFieldItem[];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans text-stone-900 pb-16 profile-root" data-profile="true">

      {/* Sync Status Banner */}
      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-[#8B1E3F] bg-[#8B1E3F]/5 border border-[#8B1E3F]/15 px-3 py-1.5 rounded-lg w-fit">
          <RefreshCw className="h-3 w-3 animate-spin text-[#8B1E3F]" />
          <span>Syncing latest profile data...</span>
        </div>
      )}

      {/* ── SINGLE UNIFIED PROFILE CARD / PAGE ── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs divide-y divide-stone-100 overflow-hidden">

        {/* ── 1. SIMPLE CLEAN PROFILE HEADER ── */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="relative shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    onClick={() => setSelectedPhoto(profile.avatar)}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border border-stone-200 cursor-pointer hover:opacity-95 transition-opacity"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-stone-100 border border-stone-200 text-[#8B1E3F] font-bold text-2xl flex flex-col items-center justify-center select-none">
                    <span>{initialLetter}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/photos')}
                  title="Manage Photo"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-white text-stone-700 border border-stone-200 rounded-lg shadow-2xs hover:text-[#8B1E3F] transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Name & Basic Line */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden max-w-full">
                  <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight truncate">
                    {profile.name}
                  </h1>
                  {isVerified && (
                    <span
                      title="Verified Profile"
                      className="inline-flex items-center cursor-default shrink-0"
                      aria-label="Verified Profile"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#0A66C2] drop-shadow-2xs"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zm3.707 6.763a.75.75 0 00-1.06-1.06l-3.9 3.9-1.447-1.448a.75.75 0 00-1.06 1.06l1.977 1.978a.75.75 0 001.06 0l4.43-4.43z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  {displayAge && (
                    <span className="text-stone-500 text-xs font-medium shrink-0">
                      • {displayAge}
                    </span>
                  )}
                </div>

                {/* ID & Plan line */}
                <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                  <span className="font-mono font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                    {profile.kmId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                    title="Copy Profile ID"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <span>•</span>
                  <span className="font-medium text-stone-600">{planName}</span>
                  {hasLocation && (
                    <>
                      <span>•</span>
                      <span className="text-stone-600">{locationString}</span>
                    </>
                  )}
                </div>

                {/* Occupation & Education Summary (Only if filled) */}
                {(isFilled(profile.occupation) || isFilled(profile.highest_education)) && (
                  <p className="text-xs text-stone-600">
                    {isFilled(profile.occupation) && <span>{profile.occupation}</span>}
                    {isFilled(profile.occupation) && isFilled(profile.highest_education) && <span> • </span>}
                    {isFilled(profile.highest_education) && <span>{profile.highest_education}</span>}
                  </p>
                )}
              </div>

            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-[#8B1E3F] hover:bg-[#721833] text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/profile/${(profile as any).uuid || (profile as any).member_id || (profile as any).user_uuid || profile.id}`)}
                className="p-2 text-stone-500 hover:text-stone-900 border border-stone-200 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
                title="Public Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Profile Completeness Simple Meter */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <span>Profile Completeness:</span>
              <span className="font-bold text-stone-900">{profile.completion_percentage}%</span>
            </div>
            <div className="flex-1 max-w-xs h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B1E3F] rounded-full transition-all duration-300"
                style={{ width: `${profile.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── 2. ABOUT MYSELF ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              About Myself
            </h2>
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          </div>

          {isFilled(profile.about_me) ? (
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {profile.about_me}
            </p>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 p-4 text-center bg-stone-50/40 space-y-1.5">
              <p className="text-xs text-stone-400 italic">No description added yet.</p>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B1E3F] hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add About Yourself
              </button>
            </div>
          )}

          {/* Languages & Hobbies: Dynamic (Render only if filled) */}
          {(profile.languages_known.length > 0 || profile.hobbies_interests.length > 0) && (
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100">
              {profile.languages_known.length > 0 && (
                <div className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl">
                  <span className="text-[11px] font-medium text-stone-400 block mb-1">Languages Known</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.languages_known.map((lang, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-stone-200 rounded-md text-xs font-semibold text-stone-800">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.hobbies_interests.length > 0 && (
                <div className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl">
                  <span className="text-[11px] font-medium text-stone-400 block mb-1">Hobbies & Interests</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.hobbies_interests.map((hobby, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-stone-200 rounded-md text-xs font-semibold text-stone-800">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. PERSONAL & LIFESTYLE DETAILS (Dynamic - Filled values only) ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              Personal & Lifestyle Details
            </h2>
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          </div>

          {personalItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              {personalItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl hover:bg-stone-50 transition-colors">
                  <span className="text-stone-400 text-[11px] font-medium block mb-0.5">{item.label}</span>
                  <span className="font-semibold text-stone-800 text-xs break-words">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 p-5 text-center bg-stone-50/40 space-y-1.5">
              <p className="text-xs text-stone-500 font-medium">No personal & lifestyle details added yet.</p>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Personal Details
              </button>
            </div>
          )}
        </div>

        {/* ── 4. EDUCATION & CAREER (Dynamic - Filled values only) ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              Education & Career
            </h2>
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          </div>

          {educationCareerItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {educationCareerItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl hover:bg-stone-50 transition-colors">
                  <span className="text-stone-400 text-[11px] font-medium block mb-0.5">{item.label}</span>
                  <span className="font-semibold text-stone-800 text-xs break-words">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 p-5 text-center bg-stone-50/40 space-y-1.5">
              <p className="text-xs text-stone-500 font-medium">No education & career details added yet.</p>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Education & Career
              </button>
            </div>
          )}
        </div>

        {/* ── 5. RELIGION & HOROSCOPE (Dynamic - Filled values only) ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              Religion & Horoscope
            </h2>
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          </div>

          {religionHoroscopeItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              {religionHoroscopeItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl hover:bg-stone-50 transition-colors">
                  <span className="text-stone-400 text-[11px] font-medium block mb-0.5">{item.label}</span>
                  <span className="font-semibold text-stone-800 text-xs break-words">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 p-5 text-center bg-stone-50/40 space-y-1.5">
              <p className="text-xs text-stone-500 font-medium">No religion & horoscope details added yet.</p>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Religion & Horoscope
              </button>
            </div>
          )}
        </div>

        {/* ── 6. FAMILY BACKGROUND (Dynamic - Filled values only) ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              Family Background
            </h2>
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
          </div>

          {familyItems.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {familyItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl hover:bg-stone-50 transition-colors">
                    <span className="text-stone-400 text-[11px] font-medium block mb-0.5">{item.label}</span>
                    <span className="font-semibold text-stone-800 text-xs break-words">{item.value}</span>
                  </div>
                ))}
              </div>

              {isFilled(profile.family_information) && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-400 text-[11px] font-medium block mb-1">About Family</span>
                  <p className="text-xs text-stone-700 leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    {profile.family_information}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 p-5 text-center bg-stone-50/40 space-y-1.5">
              <p className="text-xs text-stone-500 font-medium">No family background details added yet.</p>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Family Background
              </button>
            </div>
          )}
        </div>

        {/* ── 7. RESIDENCE & LOCATION (Dynamic - Filled values only) ── */}
        {locationItems.length > 0 && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
                Location & Residence
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              {locationItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl hover:bg-stone-50 transition-colors">
                  <span className="text-stone-400 text-[11px] font-medium block mb-0.5">{item.label}</span>
                  <span className="font-semibold text-stone-800 text-xs break-words">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 8. PARTNER PREFERENCES (Dynamic - Filled values only) ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              Partner Preferences
            </h2>
            <button
              type="button"
              onClick={() => navigate('/preferences')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" /> Edit Preferences
            </button>
          </div>

          {partnerPrefItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {partnerPrefItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50/70 border border-stone-200/60 rounded-xl hover:bg-stone-50 transition-colors">
                  <span className="text-stone-400 text-[11px] font-medium block mb-0.5">{item.label}</span>
                  <span className="font-semibold text-stone-800 text-xs break-words">{item.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 p-5 text-center bg-stone-50/40 space-y-1.5">
              <p className="text-xs text-stone-500 font-medium">No partner preferences set yet.</p>
              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors cursor-pointer"
              >
                <Sliders className="h-3 w-3" /> Set Partner Preferences
              </button>
            </div>
          )}
        </div>

        {/* ── 9. PHOTOS & MEDIA ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2 className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider">
              Photos ({ (profile.avatar ? 1 : 0) + realGalleryImages.length })
            </h2>
            <button
              type="button"
              onClick={() => navigate('/photos')}
              className="text-xs font-medium text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Manage Photos
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {profile.avatar && (
              <div
                onClick={() => setSelectedPhoto(profile.avatar)}
                className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 cursor-pointer group"
              >
                <img src={profile.avatar} alt="Primary" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#8B1E3F] text-white text-[9px] rounded font-bold">
                  Primary
                </span>
              </div>
            )}

            {realGalleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPhoto(img.image_url)}
                className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 cursor-pointer"
              >
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}

            <button
              type="button"
              onClick={() => navigate('/photos')}
              className="aspect-square rounded-xl border border-dashed border-stone-300 hover:border-[#8B1E3F] flex flex-col items-center justify-center text-xs text-stone-500 hover:text-[#8B1E3F] transition-colors cursor-pointer bg-stone-50/50"
            >
              <Plus className="h-4 w-4" />
              <span className="text-[10px] mt-1 font-medium">Add Photo</span>
            </button>
          </div>
        </div>

        {/* ── 10. PRIVACY & SECURITY ── */}
        <div className="p-6 sm:p-8 bg-stone-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-semibold text-stone-800">
              Contact Details:{' '}
              <span className="font-normal text-stone-600">
                {[profile.phone, profile.email].filter((v) => isFilled(v)).join(' • ') || 'Verified matches only'}
              </span>
            </p>
            <p className="text-stone-400">
              Shared only with verified matches you accept.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/privacy-settings')}
            className="text-xs font-semibold text-[#8B1E3F] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Privacy Settings</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

      </div>

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-xl max-h-[85vh]">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 transition-colors cursor-pointer p-1"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};
