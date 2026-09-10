import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit3,
  Sliders,
  MapPin,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Camera,
  FileText,
  Users,
  Copy,
  Check,
  Eye,
  Plus,
  RefreshCw,
  Award,
  Heart,
  Phone,
  Mail,
  Lock
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { useMyMembership } from '../../hooks/useMembership';
import { useProfileGallery } from '../../hooks/useProfile';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';

// ── Safe Text & Object Resolution Helpers ──────────────────────────
function toText(val: any, fallback = 'Not Specified'): string {
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

function formatHeight(val: any): string {
  if (!val) return 'Not Specified';
  const str = String(val).trim();
  if (str.includes("'") || str.includes('cm') || str.includes('ft')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str);
  if (isNaN(num) || num <= 0) return str || 'Not Specified';
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

function formatWeight(val: any): string {
  if (!val) return 'Not Specified';
  const str = String(val).trim();
  if (str.toLowerCase().includes('kg') || str.toLowerCase().includes('lbs')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str);
  if (isNaN(num) || num <= 0) return str || 'Not Specified';
  return `${Math.round(num)} kg`;
}

function formatIncome(val: any): string {
  if (!val) return 'Not Specified';
  const str = String(val).trim();
  if (str.includes('Lakh') || str.includes('₹') || str.includes('Crore') || str.includes('INR')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str.replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return str || 'Not Specified';
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

export const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, verificationStatus, profileStatus, showToast } = useApp();
  const { data: apiProfile, isFetching, refetch } = useProfile();
  const { data: membershipData } = useMyMembership();
  const { data: galleryImages } = useProfileGallery();

  const [copiedId, setCopiedId] = useState(false);

  // Retrieve local draft backup if server returns empty or during cold start
  let localDraft: any = null;
  try {
    const localDraftRaw = localStorage.getItem('user_profile_draft');
    if (localDraftRaw) {
      localDraft = JSON.parse(localDraftRaw);
    }
  } catch {}

  const apiData: any = (apiProfile as any)?.data || (apiProfile as any)?.profile || apiProfile || {};

  // Numeric ID & KM ID
  const numericId =
    apiData.id ||
    apiProfile?.id ||
    (currentUser?.id ? parseInt(String(currentUser.id).replace(/\D/g, ''), 10) : 0) ||
    24;
  const kmId = `KM${String(numericId).padStart(6, '0')}`;

  // Name Resolution
  const apiFirstName = toText(apiData.first_name || apiData.firstName, '');
  const apiLastName = toText(apiData.last_name || apiData.lastName, '');
  const apiFullName = apiFirstName ? `${apiFirstName} ${apiLastName}`.trim() : toText(apiData.name || apiData.profile_name, '');
  const emailName = extractNameFromEmail(currentUser.email || apiData.email || localStorage.getItem('logged_in_email'));

  let resolvedName = '';
  if (currentUser.name && !isGenericName(currentUser.name)) {
    resolvedName = currentUser.name;
  } else if (apiFullName && !isGenericName(apiFullName)) {
    resolvedName = apiFullName;
  } else {
    resolvedName = emailName || 'Kalyan Member';
  }

  // Age calculation
  const rawDob = apiData.date_of_birth || apiData.dob || localDraft?.date_of_birth;
  const calculatedAge = calculateAge(rawDob);
  const displayAge = calculatedAge ? `${calculatedAge} Yrs` : null;

  const profile = {
    id: numericId,
    kmId,
    name: resolvedName,
    email: currentUser.email || apiData.email || localStorage.getItem('logged_in_email') || 'Not Specified',
    phone: apiData.phone || currentUser.phone || 'Not Specified',
    avatar:
      apiData.profile_photo ||
      apiData.photo ||
      apiData.avatar ||
      apiData.profile_image ||
      localDraft?.profile_photo ||
      currentUser.avatar ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    about_me:
      toText(apiData.about_me || apiData.about || apiData.bio || localDraft?.about_me, '') ||
      'I am a warm, ambitious, and family-oriented individual looking for an understanding life partner to share life’s beautiful journey with trust, mutual respect, and friendship.',
    gender: toText(apiData.gender || localDraft?.gender, 'Not Specified'),
    marital_status: toText(apiData.marital_status || apiData.maritalStatus || localDraft?.marital_status, 'Never Married'),
    height: formatHeight(apiData.height ?? localDraft?.height),
    weight: formatWeight(apiData.weight ?? localDraft?.weight),
    complexion: toText(apiData.complexion || localDraft?.complexion, 'Fair'),
    mother_tongue: toText(apiData.mother_tongue || apiData.motherTongue || localDraft?.mother_tongue || 'Telugu'),
    physical_status: toText(apiData.disability_information || apiData.physical_status || localDraft?.disability_information, 'Normal'),

    // Education & Career
    highest_education: toText(apiData.highest_education || apiData.education || apiData.qualification || localDraft?.highest_education, 'Graduate Degree'),
    education_detail: toText(apiData.education_detail || localDraft?.education_detail, 'B.Tech / Professional Degree'),
    occupation: toText(apiData.occupation || apiData.profession || apiData.job_title || localDraft?.occupation, 'Software Professional'),
    company_name: toText(apiData.company_name || localDraft?.company_name, 'Private Firm'),
    annual_income: formatIncome(apiData.annual_income ?? apiData.income ?? apiData.annualIncome ?? localDraft?.annual_income),
    work_location: toText(apiData.work_location || (apiData.city ? `${apiData.city}, ${apiData.state || ''}` : ''), 'Hyderabad, Telangana'),

    // Location
    city: toText(apiData.city || localDraft?.city, 'Hyderabad'),
    state: toText(apiData.state || localDraft?.state, 'Telangana'),
    country: toText(apiData.country || localDraft?.country, 'India'),

    // Religion & Horoscope
    religion: toText(apiData.religion || localDraft?.religion, 'Hindu'),
    caste: toText(apiData.caste || localDraft?.caste, 'Not Specified'),
    sub_caste: toText(apiData.sub_caste || localDraft?.sub_caste, 'Not Specified'),
    gothram: toText(apiData.gothram || localDraft?.gothram, 'Not Specified'),
    rashi: toText(apiData.rashi || localDraft?.rashi, 'Not Specified'),
    nakshatra: toText(apiData.nakshatra || localDraft?.nakshatra, 'Not Specified'),
    dosha: toText(apiData.dosha || localDraft?.dosha, 'None / No Dosha'),

    // Family
    family_type: toText(apiData.family_type || localDraft?.family_type, 'Nuclear Family'),
    family_values: toText(apiData.family_values || localDraft?.family_values, 'Moderate'),
    family_status: toText(apiData.family_status || localDraft?.family_status, 'Upper Middle Class'),
    father_occupation: toText(apiData.father_occupation || localDraft?.father_occupation, 'Business / Employed'),
    mother_occupation: toText(apiData.mother_occupation || localDraft?.mother_occupation, 'Homemaker'),
    family_information: toText(apiData.family_information || apiData.family_details || apiData.family || localDraft?.family_information, 'Respectable and affectionate family with traditional roots and progressive values.'),

    // Lifestyle
    diet: toText(apiData.diet ?? localDraft?.diet, 'Vegetarian'),
    smoking: toText(apiData.smoking ?? localDraft?.smoking, 'No'),
    drinking: toText(apiData.drinking ?? localDraft?.drinking, 'No'),
    languages_known: toTextArray(apiData.languages_known ?? apiData.languages ?? localDraft?.languages_known),
    hobbies_interests: toTextArray(apiData.hobbies_interests ?? apiData.hobbies ?? localDraft?.hobbies_interests),

    completion_percentage:
      apiData.profile_completion_percentage ||
      profileStatus.completion_percentage ||
      (apiProfile?.is_basic_complete ? 95 : 80),
  };

  const isVerified =
    verificationStatus === 'VERIFIED' ||
    Boolean((apiProfile as any)?.is_verified) ||
    Boolean(currentUser.verified);

  const planName = membershipData?.plan_name || 'Kalyan Member';

  const handleCopyId = () => {
    navigator.clipboard.writeText(kmId);
    setCopiedId(true);
    showToast(`Copied Matrimony ID ${kmId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 font-sans text-stone-900 space-y-8">
      
      {/* Background sync hint (unobtrusive) */}
      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg w-fit">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-600" />
          <span>Syncing latest profile data...</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SINGLE UNIFIED PROFILE SHEET (NO MULTIPLE BOXES/CARDS)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* 1. Profile Header Strip */}
        <div className="p-6 sm:p-8 border-b border-stone-200 bg-stone-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Avatar & Core Identity */}
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-2 border-stone-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigate('/photos')}
                  title="Manage Photos"
                  className="absolute bottom-0 right-0 p-1.5 bg-[#8B1E3F] text-white rounded-full shadow-sm hover:bg-[#701832] transition-colors cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                    {profile.name}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium flex-wrap">
                  <span className="font-mono text-stone-700 font-semibold bg-stone-200/70 px-2 py-0.5 rounded text-[11px]">
                    {profile.kmId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-stone-500 hover:text-stone-800 text-[11px] underline flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedId ? 'Copied' : 'Copy'}
                  </button>
                  <span>•</span>
                  <span>{planName}</span>
                </div>

                <p className="text-xs text-stone-600 pt-0.5">
                  {displayAge ? `${displayAge}, ` : ''}{profile.height} • {profile.marital_status} • {profile.mother_tongue}
                </p>
                <p className="text-xs text-stone-600">
                  {profile.occupation} • {profile.city}, {profile.state}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="w-full sm:w-36 px-4 py-2 text-xs font-semibold bg-[#8B1E3F] hover:bg-[#731834] text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>

              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="w-full sm:w-36 px-4 py-2 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-stone-500" /> Preferences
              </button>

              <button
                type="button"
                onClick={() => navigate(`/profile/${profile.id}`)}
                className="w-full sm:w-36 px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> Public View
              </button>
            </div>

          </div>

          {/* Profile Strength Indicator */}
          <div className="mt-6 pt-4 border-t border-stone-200/80 flex items-center justify-between gap-4 text-xs text-stone-600">
            <span className="font-medium">Profile Completeness: <strong className="text-stone-900">{profile.completion_percentage}%</strong></span>
            <div className="h-1.5 w-40 sm:w-60 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B1E3F] rounded-full"
                style={{ width: `${profile.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Main Content Flow with Clean Dividing Rules */}
        <div className="divide-y divide-stone-200">

          {/* Section: About Me */}
          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                About Myself
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit Bio
              </button>
            </div>
            <p className="text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
              {profile.about_me}
            </p>
          </div>

          {/* Section: Basic & Personal Details */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Personal & Basic Details
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
              <div>
                <dt className="text-xs text-stone-500 font-medium">Marital Status</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.marital_status}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Height</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.height}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Weight</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.weight}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Complexion</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.complexion}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Mother Tongue</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.mother_tongue}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Physical Status</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.physical_status}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Diet</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.diet}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Smoking / Drinking</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.smoking} / {profile.drinking}</dd>
              </div>
            </dl>

            {/* Languages & Hobbies */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-stone-500 font-medium block mb-1">Languages Spoken</span>
                <p className="text-sm text-stone-800">
                  {profile.languages_known.length > 0 ? profile.languages_known.join(', ') : 'Telugu, English'}
                </p>
              </div>
              <div>
                <span className="text-stone-500 font-medium block mb-1">Hobbies & Interests</span>
                <p className="text-sm text-stone-800">
                  {profile.hobbies_interests.length > 0 ? profile.hobbies_interests.join(', ') : 'Reading, Music, Travel'}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Education & Career */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Education & Career
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
              <div>
                <dt className="text-xs text-stone-500 font-medium">Highest Degree</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.highest_education}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Education Details</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.education_detail}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Occupation</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.occupation}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Company</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.company_name}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Annual Income</dt>
                <dd className="text-sm text-stone-900 font-semibold mt-0.5 text-emerald-800">{profile.annual_income}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Work Location</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.work_location}</dd>
              </div>
            </dl>
          </div>

          {/* Section: Religion & Horoscope */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Religion & Horoscope Details
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
              <div>
                <dt className="text-xs text-stone-500 font-medium">Religion</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.religion}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Caste</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.caste}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Sub-Caste</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.sub_caste}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Gothram</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.gothram}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Moon Sign (Rashi)</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.rashi}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Star (Nakshatra)</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.nakshatra}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Dosha / Manglik</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.dosha}</dd>
              </div>
            </dl>
          </div>

          {/* Section: Family Details */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Family Details
              </h2>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
              <div>
                <dt className="text-xs text-stone-500 font-medium">Family Values</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.family_values}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Family Type</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.family_type}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Family Status</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.family_status}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Father's Occupation</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.father_occupation}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Mother's Occupation</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.mother_occupation}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Native Place</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.city}, {profile.state}</dd>
              </div>
            </dl>

            <div className="pt-2">
              <span className="text-xs text-stone-500 font-medium block mb-1">About Family</span>
              <p className="text-sm text-stone-800 leading-relaxed font-normal">
                {profile.family_information}
              </p>
            </div>
          </div>

          {/* Section: Photo Gallery Strip */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Photos & Media
              </h2>
              <button
                type="button"
                onClick={() => navigate('/photos')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Upload Photos
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <div className="relative shrink-0 h-24 w-24 rounded-lg overflow-hidden border border-stone-300">
                <img src={profile.avatar} alt="Primary" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-stone-900/80 text-white text-[9px] rounded font-medium">
                  Primary
                </span>
              </div>

              {galleryImages && galleryImages.length > 0 ? (
                galleryImages.map((img, idx) => (
                  <div key={idx} className="shrink-0 h-24 w-24 rounded-lg overflow-hidden border border-stone-200">
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/photos')}
                  className="shrink-0 h-24 w-24 rounded-lg border border-dashed border-stone-300 hover:border-stone-500 flex flex-col items-center justify-center text-xs text-stone-500 gap-1 transition-colors cursor-pointer bg-stone-50/50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Section: Partner Expectations */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Partner Preferences
              </h2>
              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="text-xs text-[#8B1E3F] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> Edit Preferences
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-4 gap-x-6">
              <div>
                <dt className="text-xs text-stone-500 font-medium">Preferred Age</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">23 - 29 Years</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Preferred Height</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">5' 2" - 5' 8"</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Religion & Caste</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">{profile.religion}, Same Caste / Open</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Education</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">Graduate / Professional</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Location</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">Telangana, Andhra Pradesh</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500 font-medium">Diet</dt>
                <dd className="text-sm text-stone-900 font-medium mt-0.5">Vegetarian / Open</dd>
              </div>
            </dl>
          </div>

          {/* Section: Contact & Privacy */}
          <div className="p-6 sm:p-8 bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-600">
            <div className="space-y-1">
              <span className="font-semibold text-stone-800 block">Contact & Privacy Details</span>
              <p>
                Mobile: <span className="font-mono text-stone-700">{profile.phone}</span> • Email: <span className="font-mono text-stone-700">{profile.email}</span>
              </p>
              <p className="text-[11px] text-stone-500">
                Contact information is private and visible only to verified matches you accept.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/privacy-settings')}
              className="text-xs font-semibold text-[#8B1E3F] hover:underline shrink-0 cursor-pointer"
            >
              Privacy Settings →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
