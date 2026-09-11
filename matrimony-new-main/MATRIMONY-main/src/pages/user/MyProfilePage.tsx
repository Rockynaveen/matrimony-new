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
  Lock,
  Sun,
  Sparkles
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

const RAILWAY_BASE_ORIGIN = 'https://matrimony-production-4b00.up.railway.app';

function formatMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
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
      formatMediaUrl(
        apiData.profile_photo ||
        apiData.photo ||
        apiData.avatar ||
        apiData.profile_image ||
        localDraft?.profile_photo ||
        currentUser.avatar
      ) || (currentUser.gender?.toLowerCase() === 'female' ? '/images/profiles/recommended_bride.jpg' : '/images/profiles/recommended_groom.jpg'),
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans text-stone-900 space-y-6">
      
      {/* Background sync hint (unobtrusive) */}
      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-lg w-fit">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-600" />
          <span>Syncing latest profile data...</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SINGLE UNIFIED PROFILE SHEET (COLORFUL & VIBRANT UI)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200/90 rounded-3xl shadow-sm overflow-hidden">
        
        {/* 1. Colorful Decorative Cover Banner */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-[#8B1E3F] via-rose-600 to-amber-500 relative overflow-hidden">
          {/* Subtle glowing ambient circles */}
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-72 h-36 bg-amber-300/25 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-rose-400/20 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* 2. Profile Header Strip (Overlapping Banner) */}
        <div className="px-6 sm:px-10 pb-8 pt-0 bg-white border-b border-stone-200/80 relative">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            
            {/* Avatar & Core Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative shrink-0">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-32 w-32 sm:h-36 sm:w-36 rounded-2xl object-cover border-4 border-white shadow-lg ring-2 ring-rose-200/80"
                  onError={(e) => {
                    const fallback = currentUser.gender?.toLowerCase() === 'female'
                      ? '/images/profiles/recommended_bride.jpg'
                      : '/images/profiles/recommended_groom.jpg';
                    if ((e.currentTarget as HTMLImageElement).src !== window.location.origin + fallback) {
                      (e.currentTarget as HTMLImageElement).src = fallback;
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => navigate('/photos')}
                  title="Manage Photos"
                  className="absolute bottom-2 right-2 p-2 bg-gradient-to-r from-[#8B1E3F] to-rose-600 text-white rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 pt-2 sm:pt-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                    {profile.name}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Member
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
                  <span className="font-mono text-stone-800 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md text-[11px]">
                    {profile.kmId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="text-[#8B1E3F] hover:underline text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId ? 'Copied' : 'Copy ID'}
                  </button>
                  <span className="text-stone-300">•</span>
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold text-[11px]">{planName}</span>
                </div>

                {/* Colorful Quick Info Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-900 bg-rose-50 border border-rose-200/90 px-3 py-1 rounded-lg">
                    {profile.religion} • {profile.caste} ({profile.mother_tongue})
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-lg">
                    <Briefcase className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {profile.occupation}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-900 bg-sky-50 border border-sky-200/90 px-3 py-1 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    {profile.city}, {profile.state}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-lg">
                    {profile.height} • {profile.marital_status} • {profile.diet}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex sm:flex-row lg:flex-col items-center gap-2.5 w-full lg:w-44 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="w-full px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-[#8B1E3F] to-rose-600 hover:from-[#721833] hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>

              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="w-full px-4 py-2.5 text-xs font-bold bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-stone-500" /> Preferences
              </button>

              <button
                type="button"
                onClick={() => navigate(`/profile/${profile.id}`)}
                className="w-full px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> Public View
              </button>
            </div>

          </div>

          {/* Profile Strength Indicator with Colorful Gradient */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-4 text-xs text-stone-600">
            <span className="font-semibold">Profile Completeness: <strong className="text-emerald-700 font-extrabold">{profile.completion_percentage}%</strong></span>
            <div className="h-2 w-48 sm:w-72 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full bg-gradient-to-r from-[#8B1E3F] via-rose-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${profile.completion_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Detailed Profile Sections with Distinct Thematic Colors */}
        <div className="divide-y divide-stone-200/70">

          {/* Section: About Me (Rose Accent) */}
          <div className="p-6 sm:p-8 space-y-3 bg-gradient-to-b from-rose-50/20 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shadow-xs">
                  <User className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  About Myself
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Bio
              </button>
            </div>
            <div className="bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 border border-rose-200/70 rounded-2xl p-5 sm:p-6 shadow-xs">
              <p className="text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
                {profile.about_me}
              </p>
            </div>
          </div>

          {/* Section: Basic & Personal Details (Violet Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-700 shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Personal & Basic Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Marital Status</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.marital_status}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Height</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.height}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Weight</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.weight}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Complexion</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.complexion}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Mother Tongue</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.mother_tongue}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Physical Status</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.physical_status}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Diet</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.diet}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Smoking / Drinking</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.smoking} / {profile.drinking}</dd>
              </div>
            </dl>

            {/* Languages & Hobbies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <span className="text-xs font-bold text-indigo-900 block mb-1.5 uppercase tracking-wider">Languages Spoken</span>
                <p className="text-sm font-semibold text-stone-900">
                  {profile.languages_known.length > 0 ? profile.languages_known.join(', ') : 'Telugu, English'}
                </p>
              </div>
              <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4">
                <span className="text-xs font-bold text-pink-900 block mb-1.5 uppercase tracking-wider">Hobbies & Interests</span>
                <p className="text-sm font-semibold text-stone-900">
                  {profile.hobbies_interests.length > 0 ? profile.hobbies_interests.join(', ') : 'Reading, Music, Travel'}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Education & Career (Emerald Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Education & Career
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Highest Degree</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.highest_education}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Education Details</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.education_detail}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Occupation</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.occupation}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Company</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.company_name}</dd>
              </div>
              <div className="bg-gradient-to-br from-emerald-100/90 to-teal-50 border-2 border-emerald-300 rounded-xl p-3.5 transition-all shadow-xs">
                <dt className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">Annual Income</dt>
                <dd className="text-base font-extrabold mt-1 text-emerald-800">{profile.annual_income}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all col-span-2 sm:col-span-1">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Work Location</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.work_location}</dd>
              </div>
            </dl>
          </div>

          {/* Section: Religion & Horoscope (Amber Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shadow-xs">
                  <Sun className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Religion & Horoscope Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Religion</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.religion}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Caste</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.caste}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Sub-Caste</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.sub_caste}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Gothram</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.gothram}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Moon Sign (Rashi)</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.rashi}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Star (Nakshatra)</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.nakshatra}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Dosha / Manglik</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.dosha}</dd>
              </div>
            </dl>
          </div>

          {/* Section: Family Details (Sky Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shadow-xs">
                  <Users className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Family Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Family Values</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.family_values}</dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Family Type</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.family_type}</dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Family Status</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.family_status}</dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Father's Occupation</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.father_occupation}</dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Mother's Occupation</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.mother_occupation}</dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Native Place</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.city}, {profile.state}</dd>
              </div>
            </dl>

            <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-4 mt-2">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block mb-1">About Family</span>
              <p className="text-sm text-stone-800 leading-relaxed font-normal">
                {profile.family_information}
              </p>
            </div>
          </div>

          {/* Section: Photo Gallery Strip */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shadow-xs">
                  <Camera className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Photos & Media
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/photos')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Upload Photos
              </button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <div className="relative shrink-0 h-24 w-24 rounded-xl overflow-hidden border-2 border-[#8B1E3F] shadow-sm">
                <img src={profile.avatar} alt="Primary" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#8B1E3F] text-white text-[9px] rounded-md font-bold">
                  Primary
                </span>
              </div>

              {galleryImages && galleryImages.length > 0 ? (
                galleryImages.map((img, idx) => (
                  <div key={idx} className="shrink-0 h-24 w-24 rounded-xl overflow-hidden border border-stone-200 shadow-xs">
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/photos')}
                  className="shrink-0 h-24 w-24 rounded-xl border border-dashed border-rose-300 hover:border-[#8B1E3F] hover:bg-rose-50/50 flex flex-col items-center justify-center text-xs text-rose-700 font-semibold gap-1 transition-colors cursor-pointer bg-stone-50/50"
                >
                  <Plus className="h-5 w-5 text-[#8B1E3F]" />
                  <span>Add Photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Section: Partner Expectations (Pink/Rose Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-100 text-[#8B1E3F] shadow-xs">
                  <Heart className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  Partner Preferences
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/preferences')}
                className="text-xs text-[#8B1E3F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Preferences
              </button>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Age</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">23 - 29 Years</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Height</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">5' 2" - 5' 8"</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Religion & Caste</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.religion}, Same Caste / Open</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Education</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">Graduate / Professional</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Location</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">Telangana, Andhra Pradesh</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Diet</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">Vegetarian / Open</dd>
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
