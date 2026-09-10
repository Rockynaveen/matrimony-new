import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../context/AppContext';
import { profileService } from '../../services/profile.service';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
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
  GraduationCap
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

  // Merge all available data sources so that details from recommendations, shortlist, interests, or profile API combine seamlessly
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

  // If still empty or contains generic "Member #", check full profile_name or full_name:
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

  // If still empty, check if email exists and extract readable name
  if (!fullDisplayName || fullDisplayName.toLowerCase().startsWith('member #') || fullDisplayName.toLowerCase().startsWith('member')) {
    const email = apiFetchedProfile?.email || activeSource?.email || activeSource?.user?.email;
    if (email && email.includes('@')) {
      const emailName = email.split('@')[0].replace(/[0-9._-]/g, ' ').trim();
      if (emailName) {
        fullDisplayName = emailName.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }

  // Final fallback if truly no name exists in any backend field:
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
    name: fullDisplayName,
    firstName: resolvedFirstName || (fullDisplayName ? fullDisplayName.split(' ')[0] : 'Profile'),
    lastName: resolvedLastName || (fullDisplayName ? fullDisplayName.split(' ').slice(1).join(' ') : ''),
    age: typeof activeSource.age === 'number' ? activeSource.age : (Number(activeSource.age) || 26),
    gender: toText(activeSource.gender, 'Female'),
    height: activeSource.height ? (typeof activeSource.height === 'number' ? `${activeSource.height} cm` : toText(activeSource.height)) : "5'5\"",
    religion: toText(activeSource.religion, 'Hindu'),
    caste: toText(activeSource.caste, 'Member'),
    subcaste: toText(activeSource.sub_caste || activeSource.subcaste, ''),
    motherTongue: toText(activeSource.mother_tongue || activeSource.motherTongue || (Array.isArray(activeSource.languages_known) ? activeSource.languages_known[0] : activeSource.languages_known), 'Hindi'),
    maritalStatus: toText(activeSource.marital_status || activeSource.maritalStatus, 'Never Married'),
    location: {
      city: toText(activeSource.city || activeSource.location?.city, 'City'),
      state: toText(activeSource.state || activeSource.location?.state, 'State'),
      country: toText(activeSource.country || activeSource.location?.country, 'India')
    },
    profession: toText(activeSource.occupation || activeSource.profession || activeSource.job_title, 'Professional'),
    education: toText(activeSource.highest_education || activeSource.education, 'Graduate'),
    annualIncome: typeof activeSource.annual_income === 'number'
      ? `₹${activeSource.annual_income} Lakhs`
      : toText(activeSource.annual_income, 'Not specified'),
    profileImage: toImageUrl(activeSource.profile_photo || activeSource.profileImage || activeSource.avatar) || null,
    gallery: Array.isArray(activeSource.gallery)
      ? activeSource.gallery.map(toImageUrl).filter(Boolean)
      : (activeSource.profile_photo ? [toImageUrl(activeSource.profile_photo)] : []),
    about: toText(
      activeSource.about_me || activeSource.bio || activeSource.about,
      `Namaste! I am working as a ${toText(activeSource.occupation, 'professional')}. Looking for a compatible partner who values traditions and family.`
    ),
    verified: Boolean(activeSource.is_verified === true || activeSource.is_verified === 1 || String(activeSource.verification_status || '').toUpperCase() === 'VERIFIED'),
    compatibilityScore: typeof activeSource.match_percentage === 'number' ? activeSource.match_percentage : (Number(activeSource.compatibilityScore) || 90),
    physicalAttributes: {
      height: activeSource.height ? (typeof activeSource.height === 'number' ? `${activeSource.height} cm` : toText(activeSource.height)) : "5'5\"",
      weight: activeSource.weight ? `${toText(activeSource.weight)} kg` : 'N/A'
    },
    lifestyle: {
      diet: toText(activeSource.diet, 'Vegetarian')
    },
    horoscope: {
      rashi: toText(activeSource.rashi, 'Not specified'),
      nakshatra: toText(activeSource.nakshatra, 'Not specified'),
      dosha: toText(activeSource.dosha, 'No Dosha')
    },
    family: {
      type: toText(activeSource.family?.type || activeSource.family_type, 'Nuclear Family'),
      values: toText(activeSource.family?.values || activeSource.family_values, 'Traditional'),
      status: toText(activeSource.family?.status || activeSource.family_status, 'Upper Middle Class'),
      fatherOccupation: toText(activeSource.family?.fatherOccupation || activeSource.father_occupation, 'N/A'),
      motherOccupation: toText(activeSource.family?.motherOccupation || activeSource.mother_occupation, 'N/A')
    },
    partnerPreferences: {
      ageMin: Number(activeSource.partnerPreferences?.ageMin || activeSource.partner_preferences?.age_min || 22),
      ageMax: Number(activeSource.partnerPreferences?.ageMax || activeSource.partner_preferences?.age_max || 35),
      heightMin: toText(activeSource.partnerPreferences?.heightMin || activeSource.partner_preferences?.height_min, "5'2\""),
      heightMax: toText(activeSource.partnerPreferences?.heightMax || activeSource.partner_preferences?.height_max, "6'2\""),
      religions: toTextArray(activeSource.partnerPreferences?.religions || activeSource.partner_preferences?.religions, [toText(activeSource.religion, 'Hindu')]),
      educations: toTextArray(activeSource.partnerPreferences?.educations || activeSource.partner_preferences?.educations, ['Graduate'])
    },
    languages: toTextArray(activeSource.languages_known || activeSource.languages, ['Hindi', 'English']),
    hobbies: toTextArray(activeSource.hobbies_interests || activeSource.hobbies, ['Reading', 'Travel']),
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
      showToast(`Interest expression sent to ${profile?.name || 'member'}!`);
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
    const confirmed = window.confirm(`Are you sure you want to block this profile?`);
    if (!confirmed) return;
    try {
      await blockMutation.mutateAsync({ user: numericUserId, reason: 'Blocked from profile page' });
      showToast(`Profile has been blocked.`);
      navigate('/matches');
    } catch (err: any) {
      showToast(err?.message || 'Failed to block profile');
    }
  };

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Fake Profile / Impersonation');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const createReportMutation = useCreatePrivacyReport();

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingReport(true);
      await createReportMutation.mutateAsync({
        reporter_id: 0,
        reported_user_id: numericUserId,
        reason: reportReason,
        description: reportDescription
      });
      showToast(`✓ Report submitted. Our safety team is reviewing it.`);
      setIsReportModalOpen(false);
      setReportDescription('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const { data: photoRequests } = usePhotoRequests();
  const createPhotoRequestMutation = useCreatePhotoRequest();
  const [isPhotoReqSent, setIsPhotoReqSent] = useState(false);

  const isPhotoRequestSent =
    isPhotoReqSent ||
    (photoRequests || []).some(
      r => Number(r.profile_owner?.id || (r as any).profile_owner_id) === numericUserId
    );

  const handleRequestPhotoAccess = async () => {
    try {
      await createPhotoRequestMutation.mutateAsync({
        requester_id: 0,
        profile_owner_id: numericUserId
      });
      setIsPhotoReqSent(true);
      showToast(`✓ Photo view request sent to ${profile?.name || 'member'}!`);
    } catch (err: any) {
      showToast(err?.message || `Failed to request photo access.`);
    }
  };

  const handleMessageClick = () => {
    if (profile) {
      setActiveChatUserId(profile.id);
      navigate(`/messages/${profile.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingScreen title="Member Profile" message="Loading profile details..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-6 text-center">
        <div className="h-16 w-16 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <UserX className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Profile Not Found</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            The profile you are looking for does not exist or has been removed. Browse other verified matches below.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/matches')} className="font-bold text-xs px-6">
          Browse Verified Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Matches
      </button>

      {/* Main Profile Header Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Photos & Video Intro */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="overflow-hidden border-stone-200/90 shadow-sm rounded-3xl">
            
            {/* Main Photo Display */}
            <div className="relative aspect-4/5 w-full bg-stone-100">
              <MatchAvatar
                photo={activePhoto || profile.profileImage}
                firstName={profile.firstName || profile.name}
                lastName={profile.lastName}
                variant="card"
                imgClassName="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                {profile.verified && (
                  <Badge variant="verified" className="bg-white/95 text-emerald-800 backdrop-blur-xs font-bold shadow-xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 fill-emerald-100" /> ID Verified Profile
                  </Badge>
                )}
                {profile.videoIntro && (
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="text-xs font-bold h-8 px-3"
                  >
                    <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Video Intro
                  </Button>
                )}
              </div>

              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-xs font-semibold text-white/90">Profile ID: KM{profile.id}</span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {profile.gallery && profile.gallery.length > 1 && (
              <div className="p-3 bg-stone-50 flex items-center gap-2 overflow-x-auto border-t border-stone-100">
                {profile.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(imgUrl)}
                    className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activePhoto === imgUrl ? 'border-[#8B1E3F] ring-2 ring-[#8B1E3F]/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Key Details & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 rounded-3xl border-stone-200/90 shadow-xs">
            
            {/* Title & Top Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">{profile.name}, {profile.age}</h1>
                  {profile.verified && <ShieldCheck className="h-6 w-6 text-emerald-600 fill-emerald-100 shrink-0" />}
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#8B1E3F] mt-1">
                  {[profile.religion, profile.caste, profile.subcaste].filter(Boolean).join(' • ')} {profile.motherTongue ? `• ${profile.motherTongue}` : ''}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium mt-2">
                  <MapPin className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                  <span>{[profile.location.city, profile.location.state, profile.location.country].filter(Boolean).join(', ')}</span>
                </div>
              </div>

              {/* Compatibility Pill */}
              <div className="bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 p-3.5 rounded-2xl text-center shrink-0 min-w-[100px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Match Score</span>
                {isAuthenticated ? (
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#8B1E3F]">{profile.compatibilityScore}%</span>
                ) : (
                  <span className="font-bold text-xs text-stone-400 block pt-1">🔒 Locked</span>
                )}
              </div>
            </div>

            {/* Core Info Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-0.5">
                <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Profession</span>
                <span className="font-bold text-stone-900 truncate block">{profile.profession}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-0.5">
                <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Education</span>
                <span className="font-bold text-stone-900 truncate block">{profile.education}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-0.5">
                <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Annual Income</span>
                <span className={`font-bold text-[#8B1E3F] truncate block ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.annualIncome : '₹XX,XX,XXX'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-0.5">
                <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Marital Status</span>
                <span className="font-bold text-stone-900 truncate block">{profile.maritalStatus}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-0.5">
                <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Height & Weight</span>
                <span className="font-bold text-stone-900 truncate block">{profile.physicalAttributes.height} • {profile.physicalAttributes.weight}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-0.5">
                <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Diet</span>
                <span className="font-bold text-stone-900 truncate block">{profile.lifestyle.diet}</span>
              </div>
            </div>

            {/* Profile Action Buttons Toolbar */}
            {isAuthenticated ? (
              <div className="flex flex-wrap gap-2.5 pt-4 border-t border-stone-100">
                {isInterestAccepted ? (
                  <Button size="md" variant="gold" onClick={handleMessageClick} className="font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-sm rounded-xl">
                    <MessageSquare className="h-4 w-4 mr-1.5" /> Open Chat
                  </Button>
                ) : isInterestDeclined ? (
                  <Button size="md" variant="secondary" disabled className="text-rose-700 bg-rose-50 border border-rose-200 font-bold rounded-xl">
                    <XCircle className="h-4 w-4 mr-1.5" /> Interest Declined
                  </Button>
                ) : hasSentInterest ? (
                  <Button size="md" variant="secondary" disabled className="text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold rounded-xl">
                    <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" /> Interest Sent
                  </Button>
                ) : (
                  <Button
                    size="md"
                    variant="primary"
                    onClick={handleExpressInterest}
                    disabled={sendInterestMutation.isPending}
                    className="bg-[#8B1E3F] hover:bg-[#721733] text-white font-bold rounded-xl shadow-xs"
                  >
                    {sendInterestMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin text-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-1.5 fill-white/30" />
                        Express Interest
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="md"
                  variant="outline"
                  onClick={handleShortlistToggle}
                  disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
                  className="rounded-xl border-stone-200 font-bold"
                >
                  {addShortlistMutation.isPending || removeShortlistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-1.5 ${isShortlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                  )}
                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </Button>

                {createPhotoRequestMutation.isPending ? (
                  <Button
                    size="md"
                    variant="outline"
                    disabled
                    className="border-stone-200 text-stone-600 font-bold rounded-xl"
                  >
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin text-stone-600" /> Sending...
                  </Button>
                ) : isPhotoRequestSent ? (
                  <Button
                    size="md"
                    variant="secondary"
                    disabled
                    className="text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold rounded-xl"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" /> Photo Requested
                  </Button>
                ) : (
                  <Button
                    size="md"
                    variant="outline"
                    onClick={handleRequestPhotoAccess}
                    className="rounded-xl border-stone-200 font-bold"
                  >
                    <Lock className="h-4 w-4 mr-1.5 text-[#8B1E3F]" /> Request Photo Access
                  </Button>
                )}

                <Button
                  size="md"
                  variant="outline"
                  onClick={() => setIsReportModalOpen(true)}
                  className="border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl font-bold"
                >
                  <Flag className="h-4 w-4 mr-1.5 text-amber-600" /> Report
                </Button>
              </div>
            ) : (
              <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-center mt-4">
                <h4 className="font-serif font-bold text-sm text-[#8B1E3F]">
                  🔒 Unlock Full Details & Contact
                </h4>
                <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Log in to view complete contact info, horoscope alignment, and family background.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/login?redirect=/profile/${id}`)}
                    className="bg-[#8B1E3F] hover:bg-[#721733] text-white px-5 font-bold text-xs rounded-xl"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/register?redirect=/profile/${id}`)}
                    className="border-stone-200 text-stone-700 hover:bg-stone-50 px-5 font-bold text-xs rounded-xl"
                  >
                    Register Free
                  </Button>
                </div>
              </div>
            )}

            {/* Moderation Controls */}
            {isAuthenticated && (
              <div className="flex items-center gap-4 text-xs text-stone-500 pt-2 border-t border-stone-100">
                <button
                  onClick={handleIgnore}
                  disabled={ignoreMutation.isPending}
                  className="hover:text-amber-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" /> Ignore Profile
                </button>
                <button
                  onClick={handleBlock}
                  disabled={blockMutation.isPending}
                  className="hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <UserX className="h-3.5 w-3.5" /> Block Profile
                </button>
              </div>
            )}

          </Card>
        </div>

      </div>

      {/* Comprehensive Profile Sections */}
      <div className="space-y-6">
        
        {/* About Me */}
        <Card className="p-6 space-y-2 rounded-3xl border-stone-200/90 shadow-2xs">
          <h3 className="font-serif text-lg font-bold text-[#8B1E3F]">About Me</h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">{profile.about}</p>
        </Card>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Horoscope & Astrological Info */}
          <Card className="p-6 space-y-3 rounded-3xl border-stone-200/90 shadow-2xs">
            <h3 className="font-serif text-lg font-bold text-[#8B1E3F] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" /> Horoscope & Astrological Details
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Rashi (Moon Sign)</span>
                <span className={`font-bold text-stone-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.horoscope.rashi : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Nakshatra</span>
                <span className={`font-bold text-stone-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.horoscope.nakshatra : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Dosha Status</span>
                <span className={`font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.horoscope.dosha : '🔒 Restricted'}
                </span>
              </div>
            </div>
          </Card>

          {/* Family Background */}
          <Card className="p-6 space-y-3 rounded-3xl border-stone-200/90 shadow-2xs">
            <h3 className="font-serif text-lg font-bold text-[#8B1E3F]">Family Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Family Type & Values</span>
                <span className={`font-bold text-stone-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? `${profile.family.type} • ${profile.family.values}` : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Family Status</span>
                <span className={`font-bold text-stone-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.status : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Father's Occupation</span>
                <span className={`font-bold text-stone-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.fatherOccupation : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Mother's Occupation</span>
                <span className={`font-bold text-stone-800 ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.family.motherOccupation : '🔒 Restricted'}
                </span>
              </div>
            </div>
          </Card>

          {/* Lifestyle & Hobbies */}
          <Card className="p-6 space-y-3 rounded-3xl border-stone-200/90 shadow-2xs">
            <h3 className="font-serif text-lg font-bold text-[#8B1E3F]">Languages & Hobbies</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-500 font-medium block mb-1.5">Languages Spoken</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((l, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-stone-100 text-stone-800 rounded-lg text-xs font-semibold">
                      {toText(l)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-stone-500 font-medium block mb-1.5">Hobbies & Interests</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map((h, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold">
                      {toText(h)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Partner Preferences Summary */}
          <Card className="p-6 space-y-3 bg-stone-50/60 border-stone-200/90 rounded-3xl shadow-2xs">
            <h3 className="font-serif text-lg font-bold text-[#8B1E3F]">Desired Partner Preferences</h3>
            <div className="space-y-2 text-xs text-stone-700">
              <p>
                <span className="text-stone-500 font-medium">Age Range:</span>{' '}
                <span className="font-bold">{profile.partnerPreferences.ageMin} - {profile.partnerPreferences.ageMax} yrs</span>
              </p>
              <p>
                <span className="text-stone-500 font-medium">Height Range:</span>{' '}
                <span className="font-bold">{profile.partnerPreferences.heightMin} to {profile.partnerPreferences.heightMax}</span>
              </p>
              <p>
                <span className="text-stone-500 font-medium">Religions:</span>{' '}
                <span className="font-bold">{profile.partnerPreferences.religions.join(', ')}</span>
              </p>
              <p>
                <span className="text-stone-500 font-medium">Education:</span>{' '}
                <span className="font-bold">{profile.partnerPreferences.educations.join(', ')}</span>
              </p>
            </div>
          </Card>

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
