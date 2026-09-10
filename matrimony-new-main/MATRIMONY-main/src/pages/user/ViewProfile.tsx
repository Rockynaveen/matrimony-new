import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../context/AppContext';
import { profileService } from '../../services/profile.service';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Sparkles,
  MessageSquare,
  Lock,
  Play,
  Flag,
  UserX,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  XCircle,
  Crown,
  Briefcase,
  GraduationCap,
  Star,
  Copy,
  Check,
  Camera,
  Eye,
  User,
  Users,
  Sun,
  HeartHandshake
} from 'lucide-react';
import {
  useAddToShortlist,
  useRemoveFromShortlist,
  useShortlist,
  useSendInterest,
  useSentInterests,
  useReceivedInterests,
  useAddToIgnore,
  useBlockProfile,
  useRecommendations
} from '../../hooks/useMatching';
import { useCreatePrivacyReport, useCreatePhotoRequest, usePhotoRequests } from '../../hooks/usePrivacyReports';
import { MatchAvatar } from '../../components/ui/MatchAvatar';

// ─── Safe conversion helpers to prevent React Child Object Crashes ───
const toText = (val: any, fallback = ''): string => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) {
    return val.map(item => toText(item)).filter(Boolean).join(', ') || fallback;
  }
  if (typeof val === 'object') {
    return toText(val.name || val.title || val.label || val.value || val.city || val.state || fallback);
  }
  return String(val);
};

const toTextArray = (val: any, fallback: string[] = []): string[] => {
  if (!val) return fallback;
  if (Array.isArray(val)) {
    return val.map(item => toText(item)).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return fallback;
};

const toImageUrl = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.image || val.image_url || val.url || val.profile_photo || '';
  }
  return '';
};

export const ViewProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profiles, showToast, setActiveChatUserId, isAuthenticated } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const numericUserId = Number(id || 0);
  const kmId = `KM${String(numericUserId).padStart(6, '0')}`;

  // Live queries for recommendations, shortlist, and interests
  const { data: recommendations } = useRecommendations();
  const { data: shortlist } = useShortlist();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();

  const addShortlistMutation = useAddToShortlist();
  const removeShortlistMutation = useRemoveFromShortlist();
  const sendInterestMutation = useSendInterest();
  const ignoreMutation = useAddToIgnore();
  const blockMutation = useBlockProfile();

  const [isLoading, setIsLoading] = useState(true);
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);
  const [lockErrorMessage, setLockErrorMessage] = useState<string | null>(null);
  const [apiFetchedProfile, setApiFetchedProfile] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!numericUserId || numericUserId <= 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    profileService.getProfileByUserId(numericUserId)
      .then((data) => {
        if (data) {
          setApiFetchedProfile(data);
        }
        queryClient.invalidateQueries({ queryKey: ['membership'] });
      })
      .catch((err: any) => {
        if (err.status === 403 || err.lock_reason === 'NO_PROFILE_CREDITS') {
          setLockErrorMessage(err.message || 'Profile Locked. You have used all your matching profile credits. Take a membership to view more profiles.');
          setIsLockedModalOpen(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [numericUserId]);

  const isShortlisted = shortlist?.some(s => s.user_id === numericUserId) || false;

  const receivedMatch = receivedInterests?.find(i => i.from_user === numericUserId);
  const sentMatch = sentInterests?.find(i => i.to_user === numericUserId);

  const isInterestAccepted =
    receivedMatch?.status?.toLowerCase() === 'accepted' ||
    sentMatch?.status?.toLowerCase() === 'accepted';

  const isInterestDeclined =
    receivedMatch?.status?.toLowerCase() === 'rejected' ||
    receivedMatch?.status?.toLowerCase() === 'declined' ||
    sentMatch?.status?.toLowerCase() === 'rejected' ||
    sentMatch?.status?.toLowerCase() === 'declined';

  // Resolve profile from fetched API data, AppContext profiles, or recommendations/shortlist
  const foundInProfiles = profiles.find(
    p => p.id === id || String(p.id) === String(id) || String(p.id) === String(numericUserId)
  );
  const foundInRecommendations = recommendations?.find(
    r => r.user_id === numericUserId || String(r.user_id) === String(id)
  );
  const foundInShortlist = shortlist?.find(
    s => s.user_id === numericUserId || String(s.user_id) === String(id)
  );
  const foundInSent = sentInterests?.find(
    i => Number(i.to_user || (i as any).user_id) === numericUserId || String(i.to_user) === String(id)
  );
  const foundInReceived = receivedInterests?.find(
    i => Number(i.from_user || (i as any).user_id) === numericUserId || String(i.from_user) === String(id)
  );

  // Merge all available data sources
  const mergedSource: any = {
    ...(foundInProfiles || {}),
    ...(foundInSent || {}),
    ...(foundInReceived || {}),
    ...(foundInShortlist || {}),
    ...(foundInRecommendations || {}),
    ...(apiFetchedProfile || {})
  };

  const activeSource = apiFetchedProfile || foundInRecommendations || (foundInShortlist as any) || foundInSent || foundInReceived || foundInProfiles;

  // Resolve First Name
  const resolvedFirstName = toText(
    apiFetchedProfile?.first_name ||
    apiFetchedProfile?.firstName ||
    foundInRecommendations?.first_name ||
    foundInShortlist?.first_name ||
    foundInSent?.first_name ||
    foundInReceived?.first_name ||
    foundInProfiles?.firstName ||
    apiFetchedProfile?.user?.first_name ||
    (typeof apiFetchedProfile?.profile_name === 'string' ? apiFetchedProfile.profile_name.split(' ')[0] : '') ||
    (typeof foundInRecommendations?.name === 'string' ? foundInRecommendations.name.split(' ')[0] : '') ||
    (typeof foundInProfiles?.name === 'string' ? foundInProfiles.name.split(' ')[0] : '')
  );

  // Resolve Last Name
  const resolvedLastName = toText(
    apiFetchedProfile?.last_name ||
    apiFetchedProfile?.lastName ||
    foundInRecommendations?.last_name ||
    foundInShortlist?.last_name ||
    foundInSent?.last_name ||
    foundInReceived?.last_name ||
    foundInProfiles?.lastName ||
    apiFetchedProfile?.user?.last_name ||
    (typeof apiFetchedProfile?.profile_name === 'string' ? apiFetchedProfile.profile_name.split(' ').slice(1).join(' ') : '') ||
    (typeof foundInRecommendations?.name === 'string' ? foundInRecommendations.name.split(' ').slice(1).join(' ') : '') ||
    (typeof foundInProfiles?.name === 'string' ? foundInProfiles.name.split(' ').slice(1).join(' ') : '')
  );

  let fullDisplayName = [resolvedFirstName, resolvedLastName].filter(Boolean).join(' ').trim();

  if (!fullDisplayName || fullDisplayName.toLowerCase().startsWith('member #') || fullDisplayName.toLowerCase().startsWith('member')) {
    const rawFullName = toText(
      apiFetchedProfile?.profile_name ||
      apiFetchedProfile?.full_name ||
      foundInRecommendations?.full_name ||
      foundInRecommendations?.name ||
      foundInShortlist?.name ||
      foundInProfiles?.name ||
      apiFetchedProfile?.name ||
      apiFetchedProfile?.user?.name ||
      apiFetchedProfile?.target_name
    );
    if (rawFullName && !rawFullName.toLowerCase().startsWith('member #') && !rawFullName.toLowerCase().startsWith('member')) {
      fullDisplayName = rawFullName;
    }
  }

  if (!fullDisplayName || fullDisplayName.toLowerCase().startsWith('member #') || fullDisplayName.toLowerCase().startsWith('member')) {
    const email = apiFetchedProfile?.email || activeSource?.email || activeSource?.user?.email;
    if (email && email.includes('@')) {
      const emailName = email.split('@')[0].replace(/[0-9._-]/g, ' ').trim();
      if (emailName) {
        fullDisplayName = emailName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }

  if (!fullDisplayName || fullDisplayName.toLowerCase().startsWith('member #')) {
    const caste = toText(mergedSource.caste);
    const occupation = toText(mergedSource.occupation || mergedSource.profession);
    if (caste && occupation) {
      fullDisplayName = `${caste} ${occupation}`;
    } else {
      fullDisplayName = `Profile ${numericUserId}`;
    }
  }

  const profile = activeSource ? {
    id: String(activeSource.user_id || activeSource.id || numericUserId),
    kmId,
    name: fullDisplayName,
    firstName: resolvedFirstName || (fullDisplayName ? fullDisplayName.split(' ')[0] : 'Profile'),
    lastName: resolvedLastName || (fullDisplayName ? fullDisplayName.split(' ').slice(1).join(' ') : ''),
    age: typeof activeSource.age === 'number' ? activeSource.age : (Number(activeSource.age) || 26),
    gender: toText(activeSource.gender, 'Female'),
    height: activeSource.height ? (typeof activeSource.height === 'number' ? `${activeSource.height} cm` : toText(activeSource.height)) : "5'5\"",
    religion: toText(activeSource.religion, 'Hindu'),
    caste: toText(activeSource.caste, 'Member'),
    subcaste: toText(activeSource.sub_caste || activeSource.subcaste, ''),
    gothram: toText(activeSource.gothram || activeSource.gotra, 'Not Specified'),
    motherTongue: toText(activeSource.mother_tongue || activeSource.motherTongue || (Array.isArray(activeSource.languages_known) ? activeSource.languages_known[0] : activeSource.languages_known), 'Telugu'),
    maritalStatus: toText(activeSource.marital_status || activeSource.maritalStatus, 'Never Married'),
    location: {
      city: toText(activeSource.city || activeSource.location?.city, 'City'),
      state: toText(activeSource.state || activeSource.location?.state, 'State'),
      country: toText(activeSource.country || activeSource.location?.country, 'India')
    },
    profession: toText(activeSource.occupation || activeSource.profession || activeSource.job_title, 'Professional'),
    company: toText(activeSource.company_name || activeSource.company, 'Private Firm'),
    education: toText(activeSource.highest_education || activeSource.education, 'Graduate'),
    educationDetail: toText(activeSource.education_detail || activeSource.qualification, 'Degree Details Not Specified'),
    annualIncome: typeof activeSource.annual_income === 'number'
      ? `₹${activeSource.annual_income} Lakhs`
      : toText(activeSource.annual_income, 'Not specified'),
    profileImage: toImageUrl(activeSource.profile_photo || activeSource.profileImage || activeSource.avatar) || null,
    gallery: Array.isArray(activeSource.gallery)
      ? activeSource.gallery.map(toImageUrl).filter(Boolean)
      : (activeSource.profile_photo ? [toImageUrl(activeSource.profile_photo)] : []),
    about: toText(
      activeSource.about_me || activeSource.bio || activeSource.about,
      `Namaste! I am working as a ${toText(activeSource.occupation, 'professional')}. Looking for an understanding and compatible life partner who values traditions, trust, and shared family values.`
    ),
    verified: Boolean(activeSource.is_verified === true || activeSource.is_verified === 1 || String(activeSource.verification_status || '').toUpperCase() === 'VERIFIED'),
    compatibilityScore: typeof activeSource.match_percentage === 'number' ? activeSource.match_percentage : (Number(activeSource.compatibilityScore) || 92),
    physicalAttributes: {
      height: activeSource.height ? (typeof activeSource.height === 'number' ? `${activeSource.height} cm` : toText(activeSource.height)) : "5'5\"",
      weight: activeSource.weight ? `${toText(activeSource.weight)} kg` : 'Not Specified',
      complexion: toText(activeSource.complexion, 'Fair'),
      physicalStatus: toText(activeSource.disability_information || activeSource.physical_status, 'Normal')
    },
    lifestyle: {
      diet: toText(activeSource.diet, 'Vegetarian'),
      smoking: toText(activeSource.smoking, 'No'),
      drinking: toText(activeSource.drinking, 'No')
    },
    horoscope: {
      rashi: toText(activeSource.rashi, 'Not specified'),
      nakshatra: toText(activeSource.nakshatra, 'Not specified'),
      dosha: toText(activeSource.dosha, 'No Dosha / Clear')
    },
    family: {
      type: toText(activeSource.family?.type || activeSource.family_type, 'Nuclear Family'),
      values: toText(activeSource.family?.values || activeSource.family_values, 'Traditional / Moderate'),
      status: toText(activeSource.family?.status || activeSource.family_status, 'Upper Middle Class'),
      fatherOccupation: toText(activeSource.family?.fatherOccupation || activeSource.father_occupation, 'Business / Employed'),
      motherOccupation: toText(activeSource.family?.motherOccupation || activeSource.mother_occupation, 'Homemaker'),
      information: toText(activeSource.family_information || activeSource.family_details || activeSource.family?.details, 'Respectable and affectionate family with traditional roots.')
    },
    partnerPreferences: {
      ageMin: Number(activeSource.partnerPreferences?.ageMin || activeSource.partner_preferences?.age_min || 22),
      ageMax: Number(activeSource.partnerPreferences?.ageMax || activeSource.partner_preferences?.age_max || 32),
      heightMin: toText(activeSource.partnerPreferences?.heightMin || activeSource.partner_preferences?.height_min, "5'2\""),
      heightMax: toText(activeSource.partnerPreferences?.heightMax || activeSource.partner_preferences?.height_max, "6'0\""),
      religions: toTextArray(activeSource.partnerPreferences?.religions || activeSource.partner_preferences?.religions, [toText(activeSource.religion, 'Hindu')]),
      educations: toTextArray(activeSource.partnerPreferences?.educations || activeSource.partner_preferences?.educations, ['Graduate Degree']),
      location: toText(activeSource.partnerPreferences?.location, 'Telangana / Andhra Pradesh')
    },
    languages: toTextArray(activeSource.languages_known || activeSource.languages, ['Telugu', 'English']),
    hobbies: toTextArray(activeSource.hobbies_interests || activeSource.hobbies, ['Music', 'Travel', 'Reading']),
    videoIntro: toText(activeSource.video_url || activeSource.video_introduction || activeSource.videoIntro)
  } : null;

  const [activePhoto, setActivePhoto] = useState<string | null>(profile?.profileImage || null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isJustSent, setIsJustSent] = useState(false);

  useEffect(() => {
    if (profile?.profileImage && !activePhoto) {
      setActivePhoto(profile.profileImage);
    }
  }, [profile?.profileImage]);

  const hasSentInterest = isJustSent || (sentInterests?.some(i => Number(i.to_user || (i as any).user_id) === numericUserId) || false);

  const handleExpressInterest = async () => {
    try {
      await sendInterestMutation.mutateAsync({ to_user: numericUserId, message: 'Hi, I am interested in your profile.' });
      setIsJustSent(true);
      showToast(`Interest sent to ${profile?.name || 'member'}`);
    } catch (err: any) {
      showToast(err?.message || `Failed to express interest.`);
    }
  };

  const handleShortlistToggle = async () => {
    try {
      if (isShortlisted) {
        await removeShortlistMutation.mutateAsync(numericUserId);
        showToast(`Removed from shortlist.`);
      } else {
        await addShortlistMutation.mutateAsync({ user: numericUserId });
        showToast(`Added to shortlist!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shortlist status');
    }
  };

  const handleIgnore = async () => {
    try {
      await ignoreMutation.mutateAsync({ user: numericUserId, reason: 'Skipped from profile page' });
      showToast(`Profile added to ignored profiles.`);
      navigate('/matching/ignored');
    } catch (err: any) {
      showToast(err?.message || 'Failed to ignore profile');
    }
  };

  const handleBlock = async () => {
    const confirmed = window.confirm(`Are you sure you want to block ${profile?.name}?`);
    if (!confirmed) return;
    try {
      await blockMutation.mutateAsync({ user: numericUserId, reason: 'Blocked by user' });
      showToast(`${profile?.name} has been blocked.`);
      navigate('/matches');
    } catch (err: any) {
      showToast(err?.message || 'Failed to block profile');
    }
  };

  const handleMessageClick = () => {
    setActiveChatUserId(numericUserId);
    navigate(`/messages/${numericUserId}`);
  };

  // Privacy Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fake Profile / Impersonation');
  const [reportDescription, setReportDescription] = useState('');
  const createPrivacyReportMutation = useCreatePrivacyReport();
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      await createPrivacyReportMutation.mutateAsync({
        reported_user_id: numericUserId,
        reason: reportReason,
        description: reportDescription
      });
      showToast('Safety report submitted to moderation.');
      setIsReportModalOpen(false);
      setReportDescription('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Photo Request Access State
  const createPhotoRequestMutation = useCreatePhotoRequest();
  const { data: photoRequests } = usePhotoRequests();
  const isPhotoRequestSent = photoRequests?.some(r => r.target_user_id === numericUserId);

  const handleRequestPhotoAccess = async () => {
    try {
      await createPhotoRequestMutation.mutateAsync({ target_user_id: numericUserId });
      showToast(`Photo access requested from ${profile?.name}.`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to request photo access');
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(kmId);
    setCopiedId(true);
    showToast(`Copied Matrimony ID ${kmId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading) {
    return <LoadingScreen title="Member Profile" message="Loading profile details..." />;
  }

  if (!profile) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Profile Not Found</h2>
        <p className="text-sm text-stone-500">The profile you are looking for may have been deactivated or removed.</p>
        <Button onClick={() => navigate('/matches')} variant="primary" className="bg-[#8B1E3F] text-white">
          Back to Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans text-stone-900 space-y-6">
      
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between gap-4 text-xs">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md text-[11px] font-mono text-stone-700">
            <span>{profile.kmId}</span>
            <button
              type="button"
              onClick={handleCopyId}
              title="Copy ID"
              className="text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B1E3F] bg-[#8B1E3F]/10 px-2 py-0.5 rounded-md">
            <Sparkles className="h-3 w-3 text-[#8B1E3F]" /> {profile.compatibilityScore}% Match
          </span>
        </div>
      </div>

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
          
          <div className="absolute top-4 right-4 sm:right-8 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white/95 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/25 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Kalyan Matrimony Verified
            </span>
          </div>
        </div>

        {/* 2. Hero Content Strip (Overlapping Banner) */}
        <div className="px-6 sm:px-10 pb-8 pt-0 bg-white border-b border-stone-200/80 relative">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            
            {/* Avatar & Core Headings */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative shrink-0">
                <img
                  src={activePhoto || profile.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'}
                  alt={profile.name}
                  className="h-32 w-32 sm:h-36 sm:w-36 rounded-2xl object-cover border-4 border-white shadow-lg ring-2 ring-rose-200/80"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                {profile.videoIntro && (
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="absolute bottom-2 right-2 p-2 bg-gradient-to-r from-[#8B1E3F] to-rose-600 text-white rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer"
                    title="Watch Video Introduction"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-2 sm:pt-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                    {profile.name}, <span className="text-[#8B1E3F]">{profile.age}</span>
                  </h1>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Member
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 rounded-full shadow-xs">
                    <Sparkles className="h-3 w-3 text-amber-300" /> {profile.compatibilityScore}% Match
                  </span>
                </div>

                {/* Colorful Quick Info Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-900 bg-rose-50 border border-rose-200/90 px-3 py-1 rounded-lg">
                    {[profile.religion, profile.caste, profile.subcaste].filter(Boolean).join(' • ')} {profile.motherTongue ? `(${profile.motherTongue})` : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-lg">
                    <Briefcase className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    {profile.profession}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-900 bg-sky-50 border border-sky-200/90 px-3 py-1 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    {[profile.location.city, profile.location.state].filter(Boolean).join(', ')}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-lg">
                    {profile.height} • {profile.maritalStatus} • {profile.physicalAttributes.diet}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex sm:flex-row lg:flex-col items-center gap-2.5 w-full lg:w-48 shrink-0">
              {isInterestAccepted ? (
                <button
                  type="button"
                  onClick={handleMessageClick}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-[#8B1E3F] to-rose-600 hover:from-[#721833] hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Open Chat
                </button>
              ) : isInterestDeclined ? (
                <button
                  type="button"
                  disabled
                  className="w-full px-4 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" /> Declined
                </button>
              ) : hasSentInterest ? (
                <button
                  type="button"
                  disabled
                  className="w-full px-4 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Interest Sent
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExpressInterest}
                  disabled={sendInterestMutation.isPending}
                  className="w-full px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-[#8B1E3F] via-rose-600 to-pink-600 hover:from-[#721833] hover:to-pink-700 text-white rounded-xl shadow-md shadow-rose-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  {sendInterestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4 fill-white" />
                  )}
                  Express Interest
                </button>
              )}

              {/* Shortlist Button (Golden Amber Gradient) */}
              <button
                type="button"
                onClick={handleShortlistToggle}
                disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
                className={`w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isShortlisted
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 ring-2 ring-amber-300 shadow-md shadow-amber-400/30'
                    : 'bg-white hover:bg-amber-50 text-stone-700 border border-stone-300 hover:border-amber-300 hover:text-amber-700'
                }`}
              >
                {addShortlistMutation.isPending || removeShortlistMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className={`h-4 w-4 ${isShortlisted ? 'fill-stone-950 text-stone-950' : 'text-amber-500'}`} />
                )}
                {isShortlisted ? 'Shortlisted' : 'Shortlist Profile'}
              </button>

              {/* Request Photo Button */}
              <button
                type="button"
                onClick={handleRequestPhotoAccess}
                disabled={createPhotoRequestMutation.isPending || isPhotoRequestSent}
                className="w-full px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isPhotoRequestSent ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Photo Requested
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5 text-indigo-600" /> Request Photos
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Photo Gallery Thumbnails Strip */}
          {profile.gallery && profile.gallery.length > 1 && (
            <div className="flex items-center gap-3 pt-5 mt-5 border-t border-stone-100 overflow-x-auto pb-1">
              <span className="text-xs text-stone-700 font-bold shrink-0">Photo Gallery:</span>
              {profile.gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(imgUrl)}
                  className={`h-14 w-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activePhoto === imgUrl
                      ? 'border-[#8B1E3F] ring-2 ring-rose-400 scale-105 shadow-sm'
                      : 'border-stone-200 opacity-75 hover:opacity-100 hover:border-rose-300'
                  }`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Detailed Profile Sections with Distinct Thematic Colors */}
        <div className="divide-y divide-stone-200/70">

          {/* Section: About Myself (Rose Accent) */}
          <div className="p-6 sm:p-8 space-y-3 bg-gradient-to-b from-rose-50/20 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shadow-xs">
                <User className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                About Myself
              </h2>
            </div>
            <div className="bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 border border-rose-200/70 rounded-2xl p-5 sm:p-6 shadow-xs">
              <p className="text-sm text-stone-800 leading-relaxed font-normal whitespace-pre-line">
                {profile.about}
              </p>
            </div>
          </div>

          {/* Section: Personal & Basic Details (Violet Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-violet-100 text-violet-700 shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Personal & Basic Details
              </h2>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Marital Status</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.maritalStatus}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Height</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.height}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Weight</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.physicalAttributes.weight}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Complexion</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.physicalAttributes.complexion}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Mother Tongue</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.motherTongue}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Physical Status</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.physicalAttributes.physicalStatus}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Diet</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.physicalAttributes.diet}</dd>
              </div>
              <div className="bg-violet-50/40 hover:bg-violet-50/70 border border-violet-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">Smoking / Drinking</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.lifestyle.smoking} / {profile.lifestyle.drinking}</dd>
              </div>
            </dl>

            {/* Languages & Hobbies with colorful cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <span className="text-xs font-bold text-indigo-900 block mb-1.5 uppercase tracking-wider">Languages Spoken</span>
                <p className="text-sm font-semibold text-stone-900">
                  {profile.languages.length > 0 ? profile.languages.join(', ') : 'Telugu, English'}
                </p>
              </div>
              <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4">
                <span className="text-xs font-bold text-pink-900 block mb-1.5 uppercase tracking-wider">Hobbies & Interests</span>
                <p className="text-sm font-semibold text-stone-900">
                  {profile.hobbies.length > 0 ? profile.hobbies.join(', ') : 'Reading, Music, Travel'}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Education & Career (Emerald Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                <GraduationCap className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Education & Career
              </h2>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Highest Degree</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.education}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Education Details</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.educationDetail}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Occupation</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.profession}</dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Company</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.company}</dd>
              </div>
              <div className="bg-gradient-to-br from-emerald-100/90 to-teal-50 border-2 border-emerald-300 rounded-xl p-3.5 transition-all shadow-xs">
                <dt className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">Annual Income</dt>
                <dd className={`text-base font-extrabold mt-1 text-emerald-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.annualIncome : '₹XX Lakhs'}
                </dd>
              </div>
              <div className="bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 transition-all col-span-2 sm:col-span-1">
                <dt className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Work Location</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(', ')}</dd>
              </div>
            </dl>
          </div>

          {/* Section: Religion & Horoscope Details (Amber Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shadow-xs">
                <Sun className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Religion & Horoscope Details
              </h2>
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
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.subcaste || 'Not Specified'}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Gothram</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.gothram}</dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Moon Sign (Rashi)</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.horoscope.rashi : 'Restricted'}
                </dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Star (Nakshatra)</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.horoscope.nakshatra : 'Restricted'}
                </dd>
              </div>
              <div className="bg-amber-50/40 hover:bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Dosha Status</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.horoscope.dosha : 'Restricted'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Section: Family Details (Sky Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shadow-xs">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Family Details
              </h2>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Family Values</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.values : 'Restricted'}
                </dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Family Type</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.type : 'Restricted'}
                </dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Family Status</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.status : 'Restricted'}
                </dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Father's Occupation</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.fatherOccupation : 'Restricted'}
                </dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Mother's Occupation</dt>
                <dd className={`text-sm font-bold text-stone-900 mt-1 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.motherOccupation : 'Restricted'}
                </dd>
              </div>
              <div className="bg-sky-50/40 hover:bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Native Location</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.location.city}, {profile.location.state}</dd>
              </div>
            </dl>

            <div className="bg-sky-50/40 border border-sky-100 rounded-xl p-4">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block mb-1">About Family</span>
              <p className={`text-sm text-stone-800 leading-relaxed font-normal ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                {isAuthenticated ? profile.family.information : 'Sign in to view detailed family background information.'}
              </p>
            </div>
          </div>

          {/* Section: Partner Preferences (Pink/Rose Accent) */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-100 text-[#8B1E3F] shadow-xs">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Desired Partner Preferences
              </h2>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Age</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.partnerPreferences.ageMin} - {profile.partnerPreferences.ageMax} Yrs</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Height</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.partnerPreferences.heightMin} - {profile.partnerPreferences.heightMax}</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Religion</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.partnerPreferences.religions.join(', ')}</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Education</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.partnerPreferences.educations.join(', ')}</dd>
              </div>
              <div className="bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100 rounded-xl p-3.5 transition-all">
                <dt className="text-[11px] font-bold text-pink-800 uppercase tracking-wider">Preferred Location</dt>
                <dd className="text-sm font-bold text-stone-900 mt-1">{profile.partnerPreferences.location}</dd>
              </div>
            </dl>
          </div>

          {/* Section: Safety & Moderation Bar */}
          <div className="p-4 sm:p-6 bg-stone-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="hover:text-stone-900 flex items-center gap-1 font-semibold text-stone-600 transition-colors cursor-pointer"
              >
                <Flag className="h-3.5 w-3.5 text-stone-400" /> Report Profile
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleIgnore}
                disabled={ignoreMutation.isPending}
                className="hover:text-amber-700 flex items-center gap-1 font-semibold text-stone-600 transition-colors cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5 text-stone-400" /> Ignore Profile
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleBlock}
                disabled={blockMutation.isPending}
                className="hover:text-rose-700 flex items-center gap-1 font-semibold text-stone-600 transition-colors cursor-pointer"
              >
                <UserX className="h-3.5 w-3.5 text-stone-400" /> Block Profile
              </button>
            </div>

            <span className="text-[11px] text-stone-400 font-medium">
              Verified by Kalyan Matrimony Safety Moderation
            </span>
          </div>

        </div>

      </div>

      {/* Video Intro Modal */}
      <Modal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} title={`${profile.name} - Video Introduction`}>
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-stone-800 shadow-inner">
            {profile.videoIntro ? (
              <video src={profile.videoIntro} controls autoPlay className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <p className="text-white text-xs font-semibold">No Video Introduction Available</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsVideoModalOpen(false)} className="w-full font-bold">
            Close Video
          </Button>
        </div>
      </Modal>

      {/* Privacy & Safety Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Report Profile: ${profile.name}`}>
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-sans">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px]">
            <span className="font-bold block">100% Confidential Report</span>
            <span>Your report will be submitted directly to safety moderation. Your identity is protected.</span>
          </div>

          <div>
            <label className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Reason for Reporting
            </label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
            >
              <option value="Fake Profile / Impersonation">Fake Profile / Impersonation</option>
              <option value="Inappropriate Messages / Offensive Content">Inappropriate Messages / Offensive Content</option>
              <option value="Harassment / Stalking">Harassment / Stalking</option>
              <option value="Commercial Spam / Financial Scam">Commercial Spam / Financial Scam</option>
              <option value="Privacy / Photo Violation">Privacy / Photo Violation</option>
              <option value="Other Safety Concern">Other Safety Concern</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Detailed Description (Optional)
            </label>
            <textarea
              rows={4}
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              placeholder={`Provide details regarding your report for ${profile.name}...`}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40 resize-none font-medium"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
              className="font-bold border-stone-300 rounded-xl"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingReport}
              className="font-bold shadow-md bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5 mr-1.5" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Profile Locked Modal */}
      <Modal
        isOpen={isLockedModalOpen}
        onClose={() => {
          setIsLockedModalOpen(false);
          navigate('/membership');
        }}
        title="🔒 Profile Locked"
      >
        <div className="space-y-5 p-1 text-stone-900 text-center">
          <div className="h-16 w-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>

          <div className="space-y-2">
            <Badge variant="gold" className="bg-amber-100 text-amber-900 border-amber-300 font-extrabold px-3 py-1 text-xs">
              0 Credits Remaining
            </Badge>
            <h3 className="font-serif font-extrabold text-xl text-stone-900">Profile Access Restricted</h3>
            <p className="text-xs font-semibold text-stone-600 max-w-sm mx-auto leading-relaxed">
              {lockErrorMessage || 'Profile Locked. You have used all your matching profile credits. Take a membership to view more profiles.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsLockedModalOpen(false);
                navigate('/matches');
              }}
              className="w-full sm:w-1/2 font-bold text-xs border-stone-300 rounded-xl"
            >
              Back to Matches
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setIsLockedModalOpen(false);
                navigate('/membership');
              }}
              className="w-full sm:w-1/2 font-extrabold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md hover:brightness-105 rounded-xl"
            >
              <Crown className="h-4 w-4 mr-1 text-stone-950 fill-stone-950" /> Take Membership
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ViewProfile;
