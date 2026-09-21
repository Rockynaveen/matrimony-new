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
  Maximize2
} from 'lucide-react';
import { useProfile, useProfileGallery } from '../../hooks/useProfile';
import { useMyMembership } from '../../hooks/useMembership';
import { usePartnerPreferences } from '../../hooks/usePartnerPreferences';
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
  if (!str) return 'Not Specified';
  if (str.includes("'") || str.includes('cm') || str.includes('ft')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str);
  if (isNaN(num) || num <= 0) return 'Not Specified';
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
  if (!val) return 'Not Specified';
  const str = String(val).trim();
  if (!str) return 'Not Specified';
  if (str.toLowerCase().includes('kg') || str.toLowerCase().includes('lbs')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str);
  if (isNaN(num) || num <= 0) return 'Not Specified';
  return `${Math.round(num)} kg`;
}

function formatIncome(val: any): string {
  if (!val) return 'Not Specified';
  const str = String(val).trim();
  if (!str) return 'Not Specified';
  if (str.includes('Lakh') || str.includes('₹') || str.includes('Crore') || str.includes('INR')) return str;
  const num = typeof val === 'number' ? val : parseFloat(str.replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return 'Not Specified';
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
  const { data: apiProfile, isFetching } = useProfile();
  const { data: membershipData } = useMyMembership();
  const { data: galleryImages } = useProfileGallery();
  const { data: partnerPrefs } = usePartnerPreferences();

  const [copiedId, setCopiedId] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Retrieve local draft backup if server returns empty or during cold start
  let localDraft: any = null;
  try {
    const localDraftRaw = localStorage.getItem('user_profile_draft');
    if (localDraftRaw) {
      localDraft = JSON.parse(localDraftRaw);
    }
  } catch {}

  const apiData: any = (apiProfile as any)?.data || (apiProfile as any)?.profile || apiProfile || {};

  // Resolve Member ID & Numeric ID
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

  // Real Name Resolution (No fake Kalyan Member)
  const apiFirstName = toText(apiData.first_name || apiData.firstName, '');
  const apiLastName = toText(apiData.last_name || apiData.lastName, '');
  const apiFullName = apiFirstName ? `${apiFirstName} ${apiLastName}`.trim() : toText(apiData.name || apiData.profile_name, '');
  const emailName = extractNameFromEmail(currentUser.email || apiData.email || localStorage.getItem('logged_in_email'));

  let resolvedName = '';
  if (currentUser.name && !isGenericName(currentUser.name)) {
    resolvedName = currentUser.name;
  } else if (apiFullName && !isGenericName(apiFullName)) {
    resolvedName = apiFullName;
  } else if (emailName) {
    resolvedName = emailName;
  } else {
    resolvedName = 'Member';
  }

  // Real Avatar (No dummy photos)
  const resolvedAvatar =
    formatMediaUrl(
      apiData.profile_photo ||
      apiData.photo ||
      apiData.avatar ||
      apiData.profile_image ||
      localDraft?.profile_photo ||
      currentUser.avatar
    );

  const initialLetter = resolvedName ? resolvedName.charAt(0).toUpperCase() : 'M';

  // Age calculation
  const rawDob = apiData.date_of_birth || apiData.dob || localDraft?.date_of_birth;
  const calculatedAge = calculateAge(rawDob);
  const displayAge = calculatedAge ? `${calculatedAge} Yrs` : null;

  // Real User Data Profile Object (Zero Dummy Fallbacks)
  const profile = {
    id: numericId,
    kmId,
    name: resolvedName,
    email: currentUser.email || apiData.email || localStorage.getItem('logged_in_email') || 'Not Specified',
    phone: apiData.phone || currentUser.phone || 'Not Specified',
    avatar: resolvedAvatar,
    about_me: toText(apiData.about_me || apiData.about || apiData.bio || localDraft?.about_me, ''),
    gender: toText(apiData.gender || localDraft?.gender || currentUser.gender, 'Not Specified'),
    marital_status: toText(apiData.marital_status || apiData.maritalStatus || localDraft?.marital_status, 'Not Specified'),
    height: formatHeight(apiData.height ?? localDraft?.height),
    weight: formatWeight(apiData.weight ?? localDraft?.weight),
    complexion: toText(apiData.complexion || localDraft?.complexion, 'Not Specified'),
    mother_tongue: toText(apiData.mother_tongue || apiData.motherTongue || localDraft?.mother_tongue, 'Not Specified'),
    physical_status: toText(apiData.disability_information || apiData.physical_status || localDraft?.disability_information, 'Not Specified'),

    // Education & Career
    highest_education: toText(apiData.highest_education || apiData.education || apiData.qualification || localDraft?.highest_education, 'Not Specified'),
    education_detail: toText(apiData.education_detail || localDraft?.education_detail, 'Not Specified'),
    occupation: toText(apiData.occupation || apiData.profession || apiData.job_title || localDraft?.occupation, 'Not Specified'),
    company_name: toText(apiData.company_name || localDraft?.company_name, 'Not Specified'),
    annual_income: formatIncome(apiData.annual_income ?? apiData.income ?? apiData.annualIncome ?? localDraft?.annual_income),
    work_location: toText(
      apiData.work_location ||
      (apiData.city && apiData.state ? `${apiData.city}, ${apiData.state}` : apiData.city || apiData.state || ''),
      'Not Specified'
    ),

    // Location
    city: toText(apiData.city || localDraft?.city, 'Not Specified'),
    state: toText(apiData.state || localDraft?.state, 'Not Specified'),
    country: toText(apiData.country || localDraft?.country, 'Not Specified'),

    // Religion & Horoscope
    religion: toText(apiData.religion || localDraft?.religion, 'Not Specified'),
    caste: toText(apiData.caste || localDraft?.caste, 'Not Specified'),
    sub_caste: toText(apiData.sub_caste || localDraft?.sub_caste, 'Not Specified'),
    gothram: toText(apiData.gothram || localDraft?.gothram, 'Not Specified'),
    rashi: toText(apiData.rashi || localDraft?.rashi, 'Not Specified'),
    nakshatra: toText(apiData.nakshatra || localDraft?.nakshatra, 'Not Specified'),
    dosha: toText(apiData.dosha || localDraft?.dosha, 'Not Specified'),
    birth_place: toText(apiData.birth_place || apiData.birthPlace || localDraft?.birth_place, 'Not Specified'),
    birth_time: toText(apiData.birth_time || apiData.birthTime || localDraft?.birth_time, 'Not Specified'),

    // Family
    family_type: toText(apiData.family_type || localDraft?.family_type, 'Not Specified'),
    family_values: toText(apiData.family_values || localDraft?.family_values, 'Not Specified'),
    family_status: toText(apiData.family_status || localDraft?.family_status, 'Not Specified'),
    father_occupation: toText(apiData.father_occupation || localDraft?.father_occupation, 'Not Specified'),
    mother_occupation: toText(apiData.mother_occupation || localDraft?.mother_occupation, 'Not Specified'),
    family_information: toText(apiData.family_information || apiData.family_details || apiData.family || localDraft?.family_information, ''),
    brothers_count: apiData.brothers_count ?? apiData.brothersCount ?? localDraft?.brothers_count ?? 0,
    brothers_married: apiData.brothers_married ?? apiData.brothersMarried ?? localDraft?.brothers_married ?? 0,
    sisters_count: apiData.sisters_count ?? apiData.sistersCount ?? localDraft?.sisters_count ?? 0,
    sisters_married: apiData.sisters_married ?? apiData.sistersMarried ?? localDraft?.sisters_married ?? 0,
    living_with_parents: apiData.living_with_parents ?? apiData.livingWithParents ?? localDraft?.living_with_parents ?? null,
    family_location: toText(apiData.family_location || apiData.familyLocation || localDraft?.family_location, 'Not Specified'),

    // Personal & Additional
    children_count: apiData.children_count ?? apiData.childrenCount ?? localDraft?.children_count ?? 0,
    children_living_status: toText(apiData.children_living_status || apiData.childrenLivingStatus || localDraft?.children_living_status, 'Not Specified'),
    physical_disability: toText(apiData.physical_disability || apiData.physicalDisability || localDraft?.physical_disability, 'None'),

    // Lifestyle
    diet: toText(apiData.diet ?? localDraft?.diet, 'Not Specified'),
    smoking: toText(apiData.smoking ?? localDraft?.smoking, 'Not Specified'),
    drinking: toText(apiData.drinking ?? localDraft?.drinking, 'Not Specified'),
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

  const hasLocation = profile.city !== 'Not Specified' || profile.state !== 'Not Specified';
  const locationString = [
    profile.city !== 'Not Specified' ? profile.city : null,
    profile.state !== 'Not Specified' ? profile.state : null
  ].filter(Boolean).join(', ');

  const handleCopyId = () => {
    navigator.clipboard.writeText(kmId);
    setCopiedId(true);
    showToast(`Copied Matrimony ID ${kmId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const realGalleryImages = (galleryImages || []).filter((img) => !isDummyImage(img.image_url));

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
                    className="text-stone-400 hover:text-stone-700 transition-colors"
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

                {profile.occupation !== 'Not Specified' && (
                  <p className="text-xs text-stone-600">
                    {profile.occupation}
                    {profile.highest_education !== 'Not Specified' && ` • ${profile.highest_education}`}
                  </p>
                )}
              </div>

            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-[#8B1E3F] hover:bg-[#721833] text-white rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

          {profile.about_me ? (
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
              {profile.about_me}
            </p>
          ) : (
            <p className="text-xs text-stone-400 italic">No description added yet.</p>
          )}

          {/* Languages & Hobbies */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-100">
            <div>
              <span className="text-[11px] font-medium text-stone-500 block mb-1">Languages Known</span>
              {profile.languages_known.length > 0 ? (
                <p className="text-xs font-semibold text-stone-800">{profile.languages_known.join(', ')}</p>
              ) : (
                <p className="text-xs text-stone-400 italic">Not Specified</p>
              )}
            </div>
            <div>
              <span className="text-[11px] font-medium text-stone-500 block mb-1">Hobbies & Interests</span>
              {profile.hobbies_interests.length > 0 ? (
                <p className="text-xs font-semibold text-stone-800">{profile.hobbies_interests.join(', ')}</p>
              ) : (
                <p className="text-xs text-stone-400 italic">Not Specified</p>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. BASIC & PERSONAL DETAILS ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Marital Status</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.marital_status}</span>
            </div>
            {profile.marital_status !== 'Never Married' && profile.marital_status !== 'Not Specified' && (
              <>
                <div>
                  <span className="text-stone-400 text-[11px] block mb-0.5">No. of Children</span>
                  <span className="font-semibold text-stone-800 text-xs">{profile.children_count}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[11px] block mb-0.5">Children Living Status</span>
                  <span className="font-semibold text-stone-800 text-xs">{profile.children_living_status}</span>
                </div>
              </>
            )}
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Height</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.height}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Weight</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.weight}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Complexion</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.complexion}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Mother Tongue</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.mother_tongue}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Diet</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.diet}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Physical Status</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.physical_status}</span>
            </div>
            {profile.physical_disability && profile.physical_disability !== 'None' && (
              <div>
                <span className="text-stone-400 text-[11px] block mb-0.5">Disability Details</span>
                <span className="font-semibold text-stone-800 text-xs">{profile.physical_disability}</span>
              </div>
            )}
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Smoking / Drinking</span>
              <span className="font-semibold text-stone-800 text-xs">
                {profile.smoking !== 'Not Specified' || profile.drinking !== 'Not Specified'
                  ? `${profile.smoking} / ${profile.drinking}`
                  : 'Not Specified'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. EDUCATION & CAREER ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Highest Degree</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.highest_education}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Degree Detail</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.education_detail}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Occupation</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.occupation}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Company / Organization</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.company_name}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Annual Income</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.annual_income}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Work Location</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.work_location}</span>
            </div>
          </div>
        </div>

        {/* ── 5. RELIGION & HOROSCOPE ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Religion</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.religion}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Caste</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.caste}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Sub-Caste</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.sub_caste}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Gothram</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.gothram}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Moon Sign (Rashi)</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.rashi}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Star (Nakshatra)</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.nakshatra}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Dosha / Manglik</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.dosha}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Birth Place</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.birth_place}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Birth Time</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.birth_time}</span>
            </div>
          </div>
        </div>

        {/* ── 6. FAMILY DETAILS ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Family Values</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.family_values}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Family Type</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.family_type}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Family Status</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.family_status}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Father's Profession</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.father_occupation}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Mother's Profession</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.mother_occupation}</span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Brothers</span>
              <span className="font-semibold text-stone-800 text-xs">
                {profile.brothers_count > 0 ? `${profile.brothers_count} (${profile.brothers_married} married)` : 'None'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Sisters</span>
              <span className="font-semibold text-stone-800 text-xs">
                {profile.sisters_count > 0 ? `${profile.sisters_count} (${profile.sisters_married} married)` : 'None'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Living with Parents</span>
              <span className="font-semibold text-stone-800 text-xs">
                {profile.living_with_parents === true ? 'Yes' : profile.living_with_parents === false ? 'No' : 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Family Location</span>
              <span className="font-semibold text-stone-800 text-xs">{profile.family_location}</span>
            </div>
          </div>

          {profile.family_information && (
            <div className="pt-2 border-t border-stone-100">
              <span className="text-stone-400 text-[11px] block mb-1">About Family</span>
              <p className="text-xs text-stone-700 leading-relaxed">{profile.family_information}</p>
            </div>
          )}
        </div>

        {/* ── 7. PARTNER PREFERENCES ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Preferred Age</span>
              <span className="font-semibold text-stone-800 text-xs">
                {partnerPrefs?.minimum_age && partnerPrefs?.maximum_age
                  ? `${partnerPrefs.minimum_age} - ${partnerPrefs.maximum_age} Yrs`
                  : partnerPrefs?.minimum_age
                  ? `${partnerPrefs.minimum_age}+ Yrs`
                  : 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Preferred Height</span>
              <span className="font-semibold text-stone-800 text-xs">
                {partnerPrefs?.minimum_height && partnerPrefs?.maximum_height
                  ? `${formatHeight(partnerPrefs.minimum_height)} - ${formatHeight(partnerPrefs.maximum_height)}`
                  : partnerPrefs?.minimum_height
                  ? `${formatHeight(partnerPrefs.minimum_height)}+`
                  : 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Religion & Caste</span>
              <span className="font-semibold text-stone-800 text-xs">
                {partnerPrefs?.religion || partnerPrefs?.caste
                  ? `${partnerPrefs.religion || 'Any'}, ${partnerPrefs.caste || 'Any'}`
                  : 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Education</span>
              <span className="font-semibold text-stone-800 text-xs">
                {partnerPrefs?.education || 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Preferred Location</span>
              <span className="font-semibold text-stone-800 text-xs">
                {[partnerPrefs?.city, partnerPrefs?.state, partnerPrefs?.country].filter(Boolean).join(', ') || 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Preferred Income</span>
              <span className="font-semibold text-stone-800 text-xs">
                {partnerPrefs?.minimum_income
                  ? `₹ ${(partnerPrefs.minimum_income / 100000).toFixed(0)} Lakhs${partnerPrefs.maximum_income ? ` - ₹ ${(partnerPrefs.maximum_income / 100000).toFixed(0)} Lakhs` : '+'}`
                  : (partnerPrefs as any)?.formatted_annual_income || 'Not Specified'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Marital Status</span>
              <span className="font-semibold text-stone-800 text-xs">
                {(Array.isArray(partnerPrefs?.preferred_marital_statuses) && partnerPrefs.preferred_marital_statuses.length > 0)
                  ? partnerPrefs.preferred_marital_statuses.join(', ')
                  : partnerPrefs?.marital_status || 'Any'}
              </span>
            </div>
            <div>
              <span className="text-stone-400 text-[11px] block mb-0.5">Diet</span>
              <span className="font-semibold text-stone-800 text-xs">
                {(Array.isArray(partnerPrefs?.preferred_diets) && partnerPrefs.preferred_diets[0]) || partnerPrefs?.diet || 'Not Specified'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 8. PHOTOS & MEDIA ── */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h2
              className="text-[0.95rem] font-bold text-stone-800 uppercase tracking-wider"
              style={{ fontSize: '0.95rem' }}
            >
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

        {/* ── 9. PRIVACY & SECURITY ── */}
        <div className="p-6 sm:p-8 bg-stone-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-semibold text-stone-800">
              Contact Details: <span className="font-normal text-stone-600">{profile.phone} • {profile.email}</span>
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
