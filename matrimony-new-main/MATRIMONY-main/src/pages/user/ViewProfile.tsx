import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../context/AppContext';
import { profileService } from '../../services/profile.service';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { MatchAvatar, isDummyImage } from '../../components/ui/MatchAvatar';
import {
  Heart,
  ShieldCheck,
  MapPin,
  Sparkles,
  MessageSquare,
  Lock,
  Play,
  Flag,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  GraduationCap,
  Star,
  Copy,
  Check,
  Camera,
  User,
  Users,
  Sun,
  Home,
  Send,
  Building2,
  ArrowUpDown,
  Utensils,
  CigaretteOff,
  Layers,
  Crown,
  Loader2
} from 'lucide-react';
import {
  useAddToShortlist,
  useRemoveFromShortlist,
  useShortlist,
  useSendInterest,
  useSentInterests,
  useReceivedInterests,
  useRecommendations
} from '../../hooks/useMatching';
import { useCreatePrivacyReport } from '../../hooks/usePrivacyReports';

// ─── Safe conversion helpers ───
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

const RAILWAY_BASE_ORIGIN = 'https://matrimony-production-4b00.up.railway.app';

export const toImageUrl = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || isDummyImage(trimmed)) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    if (trimmed.startsWith('/images/') || trimmed.startsWith('images/')) {
      return '';
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${RAILWAY_BASE_ORIGIN}${cleanPath}`;
  }
  if (typeof val === 'object') {
    const raw =
      val.photo_url ||
      val.photo ||
      val.profile_photo ||
      val.profile_image ||
      val.image ||
      val.image_url ||
      val.url ||
      val.file ||
      '';
    return toImageUrl(raw);
  }
  return '';
};

export const ViewProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profiles, showToast, setActiveChatUserId } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const numericUserId = Number(id || 0);
  const isNumeric = !isNaN(numericUserId) && numericUserId > 0;
  const rawIdentifier = id ? String(id).trim() : '';
  const kmId = isNumeric ? `KM${String(numericUserId).padStart(6, '0')}` : rawIdentifier;

  // Live queries for recommendations, shortlist, and interests
  const { data: recommendations, isLoading: isRecLoading } = useRecommendations();
  const { data: shortlist } = useShortlist();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();

  const addShortlistMutation = useAddToShortlist();
  const removeShortlistMutation = useRemoveFromShortlist();
  const sendInterestMutation = useSendInterest();

  const [isLoading, setIsLoading] = useState(true);
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);
  const [lockErrorMessage, setLockErrorMessage] = useState<string | null>(null);
  const [apiFetchedProfile, setApiFetchedProfile] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'education' | 'family' | 'lifestyle' | 'horoscope'>('overview');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (!rawIdentifier) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    profileService.getProfileByUserId(rawIdentifier)
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
  }, [rawIdentifier]);

  // Resolve profile from fetched API data, AppContext profiles, or recommendations/shortlist
  const foundInProfiles = profiles.find(
    p => p.id === rawIdentifier ||
         String(p.id) === rawIdentifier ||
         (p as any).uuid === rawIdentifier ||
         (p as any).user_uuid === rawIdentifier ||
         (p as any).member_id?.toLowerCase() === rawIdentifier.toLowerCase() ||
         (isNumeric && (Number(p.id) === numericUserId || (p as any).user_id === numericUserId))
  );
  const foundInRecommendations = recommendations?.find(
    r => String(r.user_id) === rawIdentifier ||
         String((r as any).id) === rawIdentifier ||
         (r as any).user_uuid === rawIdentifier ||
         (r as any).uuid === rawIdentifier ||
         (r as any).member_id?.toLowerCase() === rawIdentifier.toLowerCase() ||
         (isNumeric && (Number(r.user_id) === numericUserId || Number((r as any).id) === numericUserId))
  );
  const foundInShortlist = shortlist?.find(
    s => String(s.user_id) === rawIdentifier ||
         String((s as any).id) === rawIdentifier ||
         (s as any).user_uuid === rawIdentifier ||
         (s as any).uuid === rawIdentifier ||
         (s as any).member_id?.toLowerCase() === rawIdentifier.toLowerCase() ||
         (isNumeric && (Number(s.user_id) === numericUserId || Number((s as any).id) === numericUserId))
  );
  const foundInSent = sentInterests?.find(
    i => String(i.to_user) === rawIdentifier || (isNumeric && Number(i.to_user) === numericUserId)
  );
  const foundInReceived = receivedInterests?.find(
    i => String(i.from_user) === rawIdentifier || (isNumeric && Number(i.from_user) === numericUserId)
  );

  const activeSource = apiFetchedProfile || foundInRecommendations || (foundInShortlist as any) || foundInSent || foundInReceived || foundInProfiles;

  const targetUserId = Number(activeSource?.user_id || activeSource?.id || (isNumeric ? numericUserId : 0));

  const isShortlisted = shortlist?.some(s =>
    (targetUserId > 0 && s.user_id === targetUserId) ||
    String(s.user_id) === rawIdentifier ||
    (s as any).user_uuid === rawIdentifier ||
    (s as any).member_id === rawIdentifier
  ) || false;

  const receivedMatch = receivedInterests?.find(i =>
    (targetUserId > 0 && i.from_user === targetUserId) ||
    String(i.from_user) === rawIdentifier
  );
  const sentMatch = sentInterests?.find(i =>
    (targetUserId > 0 && i.to_user === targetUserId) ||
    String(i.to_user) === rawIdentifier
  );

  const isInterestAccepted =
    receivedMatch?.status?.toLowerCase() === 'accepted' ||
    sentMatch?.status?.toLowerCase() === 'accepted';

  // Resolve First Name & Last Name
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

  if (!fullDisplayName || fullDisplayName.toLowerCase().startsWith('member #') || fullDisplayName.toLowerCase().startsWith('profile')) {
    const rawFullName = toText(
      apiFetchedProfile?.profile_name ||
      apiFetchedProfile?.full_name ||
      foundInRecommendations?.full_name ||
      foundInRecommendations?.name ||
      foundInShortlist?.name ||
      foundInProfiles?.name ||
      apiFetchedProfile?.name ||
      apiFetchedProfile?.user?.name
    );
    if (rawFullName && !rawFullName.toLowerCase().startsWith('member #')) {
      fullDisplayName = rawFullName;
    }
  }

  if (!fullDisplayName) {
    fullDisplayName = `Member #${numericUserId}`;
  }

  // Build completely dynamic profile object without static fallback data
  const profile = useMemo(() => {
    if (!activeSource) return null;

    // Extract dynamic images from all possible API response properties
    const photoSources: any[] = [
      activeSource.profile_photo,
      activeSource.profile_image,
      activeSource.profileImage,
      activeSource.avatar,
      activeSource.photo,
      activeSource.photo_url,
      activeSource.user?.profile_photo,
      activeSource.user?.avatar,
      activeSource.user?.photo,
      activeSource.user?.photo_url
    ];

    let gallerySources: any[] = [];
    if (Array.isArray(activeSource.gallery)) {
      gallerySources.push(...activeSource.gallery);
    }
    if (Array.isArray(activeSource.gallery_images)) {
      gallerySources.push(...activeSource.gallery_images);
    }
    if (Array.isArray(activeSource.photos)) {
      gallerySources.push(...activeSource.photos);
    }
    if (Array.isArray(activeSource.images)) {
      gallerySources.push(...activeSource.images);
    }

    const dynamicImages = [
      ...photoSources.map(toImageUrl),
      ...gallerySources.map(toImageUrl)
    ].filter((url, index, self) => Boolean(url) && self.indexOf(url) === index);

    const resolvedAge = typeof activeSource.age === 'number' ? activeSource.age : (Number(activeSource.age) || null);

    const resolvedMemberId =
      activeSource.member_id ||
      activeSource.user_member_id ||
      activeSource.user?.member_id;

    const profileNumericId =
      (activeSource.user_id ? parseInt(String(activeSource.user_id).replace(/\D/g, ''), 10) : 0) ||
      (activeSource.id ? parseInt(String(activeSource.id).replace(/\D/g, ''), 10) : 0) ||
      numericUserId;

    const resolvedKmId = resolvedMemberId
      ? String(resolvedMemberId)
      : profileNumericId > 0
      ? `KM${String(profileNumericId).padStart(6, '0')}`
      : kmId;

    return {
      id: String(activeSource.user_id || activeSource.id || numericUserId),
      kmId: resolvedKmId,
      name: fullDisplayName,
      firstName: resolvedFirstName || (fullDisplayName ? fullDisplayName.split(' ')[0] : 'Member'),
      lastName: resolvedLastName || (fullDisplayName ? fullDisplayName.split(' ').slice(1).join(' ') : ''),
      age: resolvedAge,
      dob: activeSource.dob || (resolvedAge ? `${resolvedAge} years` : 'Not Specified'),
      height: activeSource.height
        ? (typeof activeSource.height === 'number' ? `${activeSource.height} cm` : toText(activeSource.height))
        : 'Not Specified',
      weight: activeSource.weight
        ? (typeof activeSource.weight === 'number' ? `${activeSource.weight} kg` : toText(activeSource.weight))
        : 'Not Specified',
      maritalStatus: toText(activeSource.marital_status || activeSource.maritalStatus, 'Not Specified'),
      religion: toText(activeSource.religion, 'Not Specified'),
      caste: toText(activeSource.caste, 'Not Specified'),
      subcaste: toText(activeSource.sub_caste || activeSource.subcaste, ''),
      gothram: toText(activeSource.gothram || activeSource.gotra, 'Not Specified'),
      motherTongue: toText(
        activeSource.mother_tongue ||
        activeSource.motherTongue ||
        (Array.isArray(activeSource.languages_known) ? activeSource.languages_known[0] : activeSource.languages_known),
        'Not Specified'
      ),
      location: {
        city: toText(activeSource.city || activeSource.location?.city, 'Not Specified'),
        state: toText(activeSource.state || activeSource.location?.state, ''),
        country: toText(activeSource.country || activeSource.location?.country, 'India')
      },
      profession: toText(activeSource.occupation || activeSource.profession || activeSource.job_title, 'Not Specified'),
      company: toText(activeSource.company_name || activeSource.company, 'Not Specified'),
      education: toText(activeSource.highest_education || activeSource.education, 'Not Specified'),
      educationDetail: toText(activeSource.education_detail || activeSource.qualification, ''),
      annualIncome: activeSource.formatted_annual_income || (typeof activeSource.annual_income === 'number'
        ? (activeSource.annual_income >= 100000 ? `₹ ${(activeSource.annual_income / 100000).toFixed(0)} Lakhs` : `₹ ${activeSource.annual_income}`)
        : (activeSource.annual_income ? toText(activeSource.annual_income) : 'Not Specified')),
      working: activeSource.working !== undefined
        ? (activeSource.working ? 'Yes' : 'No')
        : (activeSource.occupation && activeSource.occupation !== 'Not Specified' ? 'Yes' : 'Not Specified'),
      profileImage: dynamicImages[0] || '',
      gallery: dynamicImages,
      about: toText(
        activeSource.about_me || activeSource.bio || activeSource.about,
        'No description provided yet.'
      ),
      lookingFor: toText(
        activeSource.partner_preferences?.description ||
        activeSource.partnerPreferences?.description ||
        activeSource.desired_partner ||
        activeSource.looking_for ||
        activeSource.partner_preferences?.about_partner,
        'Looking for a compatible life partner who shares similar values and mutual respect.'
      ),
      verified: Boolean(
        activeSource.is_verified === true ||
        activeSource.is_verified === 1 ||
        String(activeSource.verification_status || '').toUpperCase() === 'VERIFIED'
      ),
      compatibilityScore: (() => {
        const rawVal =
          activeSource?.match_percentage ??
          foundInRecommendations?.match_percentage ??
          (activeSource as any)?.compatibility_score ??
          (activeSource as any)?.compatibility_percentage ??
          (foundInRecommendations as any)?.compatibility_score ??
          (foundInRecommendations as any)?.compatibility_percentage ??
          (activeSource as any)?.match_score ??
          (foundInRecommendations as any)?.match_score ??
          (activeSource as any)?.compatibilityScore ??
          (foundInRecommendations as any)?.compatibilityScore ??
          (activeSource as any)?.matchScore ??
          (foundInRecommendations as any)?.matchScore;

        if (rawVal === undefined || rawVal === null || rawVal === '') {
          return null;
        }

        const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
        if (isNaN(num) || num <= 0) {
          return null;
        }

        // If fraction between 0 and 1 (e.g. 0.07 -> 7%, 0.88 -> 88%), format as percentage
        if (num > 0 && num <= 1) {
          return Math.round(num * 100);
        }

        return Math.round(num);
      })(),
      diet: toText(activeSource.diet, 'Not Specified'),
      smoking: toText(activeSource.smoking, 'Not Specified'),
      drinking: toText(activeSource.drinking, 'Not Specified'),
      physicalStatus: toText(activeSource.disability_information || activeSource.physical_status, 'Normal'),
      physicalDisability: toText(activeSource.physical_disability || activeSource.physicalDisability, ''),
      disabilityInformation: toText(activeSource.disability_information || activeSource.disabilityInformation, ''),
      childrenCount: activeSource.children_count ?? activeSource.childrenCount ?? 0,
      childrenLivingStatus: toText(activeSource.children_living_status || activeSource.childrenLivingStatus, ''),
      interests: toText(
        Array.isArray(activeSource.hobbies_interests || activeSource.hobbies)
          ? (activeSource.hobbies_interests || activeSource.hobbies).join(', ')
          : (activeSource.hobbies_interests || activeSource.hobbies),
        'Not Specified'
      ),
      fatherOccupation: toText(
        activeSource.family?.fatherOccupation || activeSource.family?.father_occupation || activeSource.father_occupation,
        'Not Specified'
      ),
      motherOccupation: toText(
        activeSource.family?.motherOccupation || activeSource.family?.mother_occupation || activeSource.mother_occupation,
        'Not Specified'
      ),
      familyType: toText(
        activeSource.family?.type || activeSource.family?.family_type || activeSource.family_type,
        'Not Specified'
      ),
      brothers: toText(
        activeSource.family?.brothers || activeSource.family?.no_of_brothers || activeSource.brothers || activeSource.no_of_brothers,
        'None'
      ),
      sisters: toText(
        activeSource.family?.sisters || activeSource.family?.no_of_sisters || activeSource.sisters || activeSource.no_of_sisters,
        'None'
      ),
      familyValues: toText(
        activeSource.family?.values || activeSource.family?.family_values || activeSource.family_values,
        'Traditional & Modern'
      ),
      livingWithParents: activeSource.family?.livingWithParents ?? activeSource.family?.living_with_parents ?? activeSource.living_with_parents ?? activeSource.livingWithParents ?? null,
      familyLocation: toText(
        activeSource.family?.familyLocation || activeSource.family?.family_location || activeSource.family_location || activeSource.familyLocation,
        ''
      ),
      star: toText(activeSource.nakshatra || activeSource.horoscope?.nakshatra, 'Not Specified'),
      rashi: toText(activeSource.rashi || activeSource.horoscope?.rashi, 'Not Specified'),
      dosha: toText(activeSource.dosha || activeSource.horoscope?.dosha, 'Not Specified'),
      birthPlace: toText(activeSource.birth_place || activeSource.birthPlace || activeSource.horoscope?.birthPlace || activeSource.horoscope?.birth_place, ''),
      birthTime: toText(activeSource.birth_time || activeSource.birthTime || activeSource.horoscope?.birthTime || activeSource.horoscope?.birth_time, ''),
      videoIntro: toText(activeSource.video_url || activeSource.video_introduction || activeSource.videoIntro)
    };
  }, [activeSource, foundInRecommendations, numericUserId, kmId, fullDisplayName, resolvedFirstName, resolvedLastName]);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isJustSent, setIsJustSent] = useState(false);

  const galleryList = useMemo(() => {
    const rawList = profile?.gallery && profile.gallery.length > 0
      ? profile.gallery
      : (profile?.profileImage ? [profile.profileImage] : []);
    return rawList.filter(img => Boolean(img) && !isDummyImage(img));
  }, [profile]);

  const activePhoto = galleryList[currentPhotoIndex] || galleryList[0] || null;

  const handlePrevPhoto = () => {
    if (galleryList.length <= 1) return;
    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : galleryList.length - 1));
  };

  const handleNextPhoto = () => {
    if (galleryList.length <= 1) return;
    setCurrentPhotoIndex(prev => (prev < galleryList.length - 1 ? prev + 1 : 0));
  };

  const hasSentInterest = isJustSent || (sentInterests?.some(i => 
    (targetUserId > 0 && Number(i.to_user || (i as any).user_id) === targetUserId) ||
    String(i.to_user) === rawIdentifier
  ) || false);

  const handleExpressInterest = async () => {
    try {
      await sendInterestMutation.mutateAsync({ to_user: targetUserId || (numericUserId || rawIdentifier as any), message: 'Hi, I am interested in your profile.' });
      setIsJustSent(true);
      showToast(`Interest sent to ${profile?.name || 'member'}`);
    } catch (err: any) {
      showToast(err?.message || `Failed to express interest.`);
    }
  };

  const handleShortlistToggle = async () => {
    try {
      if (isShortlisted) {
        await removeShortlistMutation.mutateAsync(targetUserId || (numericUserId || rawIdentifier as any));
        showToast(`Removed from shortlist.`);
      } else {
        await addShortlistMutation.mutateAsync({ user: targetUserId || (numericUserId || rawIdentifier as any) });
        showToast(`Added to shortlist!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shortlist status');
    }
  };

  const handleMessageClick = () => {
    const dest = targetUserId || rawIdentifier;
    setActiveChatUserId(dest as any);
    navigate(`/messages/${dest}`);
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
        reported_user_id: targetUserId || numericUserId,
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

  const handleCopyId = () => {
    navigator.clipboard.writeText(kmId);
    setCopiedId(true);
    showToast(`Copied Matrimony ID ${kmId}`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleTabClick = (tabId: 'overview' | 'education' | 'family' | 'lifestyle' | 'horoscope') => {
    setActiveTab(tabId);
    const elem = document.getElementById(`section-${tabId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading || (isRecLoading && !apiFetchedProfile)) {
    return <LoadingScreen title="Member Profile" message="Loading profile details..." />;
  }

  if (!profile) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Profile Not Found</h2>
        <p className="text-sm text-stone-500">The profile you are looking for may have been deactivated or removed.</p>
        <Button onClick={() => navigate('/matches')} variant="primary" className="bg-[#9f1239] text-white">
          Back to Matches
        </Button>
      </div>
    );
  }

  // Build subtitle string from dynamic values
  const subtitleParts = [
    profile.age ? `${profile.age} years` : null,
    profile.height !== 'Not Specified' ? profile.height : null,
    profile.religion !== 'Not Specified' ? profile.religion : null
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#faf8f7] text-stone-900 font-sans pb-16 relative">
      
      {/* ── Top Subtle Floral Watermark Accent (Top-Right) ── */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-40 overflow-hidden w-64 h-64 z-0">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-rose-300">
          <path d="M190 10C160 30 140 80 160 130C170 155 190 170 190 170" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M165 50C140 40 120 50 115 65C110 80 125 95 150 85" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M155 100C130 95 110 110 105 125C100 140 115 155 140 145" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M130 20C110 25 95 45 105 60C115 75 135 70 145 50" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M185 85C195 90 200 105 195 115" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 relative z-10 space-y-6">

        {/* ── 1. Top Breadcrumbs ── */}
        <div className="flex items-center justify-between text-xs text-stone-500 py-1">
          <nav className="flex items-center gap-2">
            <Link to="/home" className="hover:text-stone-800 transition-colors">
              <Home className="h-3.5 w-3.5 text-stone-500 hover:text-stone-700" />
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
            <Link to="/matches" className="hover:text-stone-800 transition-colors font-medium">
              Matches
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
            <span className="text-stone-800 font-semibold">
              View Profile
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-stone-200/90 px-2.5 py-1 rounded-lg text-[11px] font-mono text-stone-600 shadow-2xs">
              <span>{profile.kmId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy ID"
                className="text-stone-400 hover:text-[#9f1239] cursor-pointer"
              >
                {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Top Profile Hero Card ── */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 lg:p-7 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Photo Carousel */}
            <div className="lg:col-span-4 w-full">
              <div className="relative aspect-square sm:aspect-[4/4.2] w-full rounded-2xl overflow-hidden bg-stone-100 shadow-sm group">
                {activePhoto && !isDummyImage(activePhoto) ? (
                  <img
                    src={activePhoto}
                    alt={profile.name}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover object-center transition-all duration-300"
                  />
                ) : (
                  <MatchAvatar
                    photo={null}
                    firstName={profile.firstName}
                    lastName={profile.lastName}
                    name={profile.name}
                    variant="card"
                    className="w-full h-full text-4xl"
                    imgClassName="w-full h-full object-cover object-center"
                  />
                )}

                {/* Top-Left Exact AI Match Badge (Only when authentic percentage exists - Never dummy fallback) */}
                {profile.compatibilityScore !== null && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-[#382104]/90 via-[#68430B]/90 to-[#8C5E13]/90 text-amber-200 border border-amber-300/60 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300/50 shrink-0" />
                    <span>{profile.compatibilityScore}% Match</span>
                  </div>
                )}

                {/* Left Carousel Arrow */}
                {galleryList.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-2xs shadow-md"
                    title="Previous photo"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                {/* Right Carousel Arrow */}
                {galleryList.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-2xs shadow-md"
                    title="Next photo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}

                {/* Bottom-Left Photo Counter */}
                {galleryList.length > 0 && (
                  <div className="absolute bottom-3 left-3 bg-black/55 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                    <Camera className="h-3.5 w-3.5 text-white" />
                    <span>{currentPhotoIndex + 1}/{galleryList.length}</span>
                  </div>
                )}

                {/* Video Intro Badge if Available */}
                {profile.videoIntro && (
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="absolute bottom-3 right-3 p-2 bg-[#9f1239] text-white rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer"
                    title="Watch Video Introduction"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Middle Column: Core Profile Details & Bio */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-stone-900">
                    {profile.name}
                  </h1>
                  {profile.verified && (
                    <div className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#8B1E3F] text-white shrink-0 shadow-2xs" title="Verified Profile">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                  {profile.compatibilityScore !== null && (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                      <Sparkles className="h-3 w-3 text-amber-600 fill-amber-500/40 shrink-0" />
                      <span>{profile.compatibilityScore}% Match</span>
                    </span>
                  )}
                </div>

                {subtitleParts.length > 0 && (
                  <p className="text-xs sm:text-sm font-medium text-stone-500 mt-1">
                    {subtitleParts.join(' • ')}
                  </p>
                )}
              </div>

              {/* 4 Icon Bullet Attributes */}
              <div className="space-y-2.5 text-xs sm:text-[13px] text-stone-700 pt-1">
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-stone-500 shrink-0" />
                  <span>
                    {[profile.location.city, profile.location.state].filter(s => s && s !== 'Not Specified').join(', ') || 'Location Not Specified'}
                  </span>
                </div>

                {(profile.educationDetail || profile.education !== 'Not Specified') && (
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 text-stone-500 shrink-0" />
                    <span>{profile.educationDetail || profile.education}</span>
                  </div>
                )}

                {profile.profession !== 'Not Specified' && (
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="h-4 w-4 text-stone-500 shrink-0" />
                    <span>{profile.profession}</span>
                  </div>
                )}

                {(profile.star !== 'Not Specified' || profile.rashi !== 'Not Specified') && (
                  <div className="flex items-center gap-2.5">
                    <Star className="h-4 w-4 text-stone-500 shrink-0" />
                    <span>
                      {profile.star !== 'Not Specified' ? `Star (${profile.star})` : `Rashi (${profile.rashi})`}
                    </span>
                  </div>
                )}
              </div>

              {/* About Me */}
              <div className="pt-2">
                <h3 className="font-bold text-xs sm:text-sm text-stone-900 mb-1.5">About Me</h3>
                <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed font-normal">
                  {profile.about}
                </p>
              </div>

              {/* Lifestyle Badges */}
              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                {profile.diet !== 'Not Specified' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 bg-rose-50/70 text-rose-900 shadow-2xs">
                    <Utensils className="h-3.5 w-3.5 text-rose-700" />
                    <span>{profile.diet}</span>
                  </span>
                )}

                {profile.smoking !== 'Not Specified' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 bg-rose-50/70 text-rose-900 shadow-2xs">
                    <CigaretteOff className="h-3.5 w-3.5 text-rose-700" />
                    <span>{profile.smoking}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Action Buttons Card */}
            <div className="lg:col-span-3 w-full bg-stone-50/60 lg:bg-transparent rounded-2xl p-4 lg:p-0 space-y-3">
              
              {/* Shortlist Button */}
              <button
                type="button"
                onClick={handleShortlistToggle}
                disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
                className="w-full py-2.5 px-4 bg-white hover:bg-rose-50/60 text-[#9f1239] border border-rose-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                {addShortlistMutation.isPending || removeShortlistMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#9f1239]" />
                ) : (
                  <Heart className={`h-4 w-4 ${isShortlisted ? 'fill-[#9f1239] text-[#9f1239]' : 'text-[#9f1239]'}`} />
                )}
                <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
              </button>

              {/* Send Interest Button */}
              <button
                type="button"
                onClick={handleExpressInterest}
                disabled={hasSentInterest || sendInterestMutation.isPending}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                  hasSentInterest
                    ? 'bg-rose-100 text-[#9f1239] cursor-not-allowed border border-rose-200'
                    : 'bg-[#9f1239] hover:bg-[#881337] active:bg-[#72102d] text-white'
                }`}
              >
                {sendInterestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
                <span>{hasSentInterest ? 'Interest Sent' : 'Send Interest'}</span>
              </button>

              {/* Message Button */}
              <button
                type="button"
                onClick={handleMessageClick}
                className="w-full py-2.5 px-4 bg-white hover:bg-rose-50/60 text-[#9f1239] border border-rose-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <MessageSquare className="h-4 w-4 text-[#9f1239]" />
                <span>Message</span>
              </button>

              {/* Trust Notice */}
              <div className="flex items-start gap-2 pt-2 text-[11px] text-stone-500 leading-tight">
                <ShieldCheck className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                <span>Your interest will be shared with the profile owner</span>
              </div>

              {/* Report Profile */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  <Flag className="h-3.5 w-3.5 text-rose-700" />
                  <span>Report Profile</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* ── 3. Horizontal Navigation Tabs ── */}
        <div className="bg-white border border-stone-200/90 rounded-xl px-4 py-1.5 flex items-center gap-2 sm:gap-6 overflow-x-auto shadow-2xs">
          <button
            type="button"
            onClick={() => handleTabClick('overview')}
            className={`py-2 px-2.5 flex items-center gap-2 text-xs font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'overview'
                ? 'border-[#9f1239] text-[#9f1239]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('education')}
            className={`py-2 px-2.5 flex items-center gap-2 text-xs font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'education'
                ? 'border-[#9f1239] text-[#9f1239]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Education & Career</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('family')}
            className={`py-2 px-2.5 flex items-center gap-2 text-xs font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'family'
                ? 'border-[#9f1239] text-[#9f1239]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Family Background</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('lifestyle')}
            className={`py-2 px-2.5 flex items-center gap-2 text-xs font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'lifestyle'
                ? 'border-[#9f1239] text-[#9f1239]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Lifestyle</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('horoscope')}
            className={`py-2 px-2.5 flex items-center gap-2 text-xs font-semibold transition-all border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'horoscope'
                ? 'border-[#9f1239] text-[#9f1239]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sun className="h-4 w-4" />
            <span>Horoscope</span>
          </button>
        </div>

        {/* ── 4. Main Two-Column Body Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ──── Left Column: Detailed Information Cards ──── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Card: Personal Details */}
            <div id="section-overview" className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[0.95rem] text-stone-900 tracking-tight">Personal Details</h3>
              </div>

              <div className="divide-y divide-stone-100 text-xs sm:text-[13px]">
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Date of Birth</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.dob}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Height</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.height}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Weight</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.weight}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Marital Status</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.maritalStatus}</span>
                </div>
                {profile.maritalStatus !== 'Never Married' && profile.maritalStatus !== 'Not Specified' && (
                  <>
                    <div className="grid grid-cols-12 py-2.5">
                      <span className="col-span-5 text-stone-500 font-medium">No. of Children</span>
                      <span className="col-span-7 text-stone-900 font-semibold">{profile.childrenCount}</span>
                    </div>
                    {profile.childrenLivingStatus && (
                      <div className="grid grid-cols-12 py-2.5">
                        <span className="col-span-5 text-stone-500 font-medium">Children Living Status</span>
                        <span className="col-span-7 text-stone-900 font-semibold">{profile.childrenLivingStatus}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Religion</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.religion}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Caste</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.caste}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Mother Tongue</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.motherTongue}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Location</span>
                  <span className="col-span-7 text-stone-900 font-semibold">
                    {[profile.location.city, profile.location.state].filter(s => s && s !== 'Not Specified').join(', ') || 'Not Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Education & Career */}
            <div id="section-education" className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[0.95rem] text-stone-900 tracking-tight">Education & Career</h3>
              </div>

              <div className="divide-y divide-stone-100 text-xs sm:text-[13px]">
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Highest Education</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.education}</span>
                </div>
                {profile.educationDetail && (
                  <div className="grid grid-cols-12 py-2.5">
                    <span className="col-span-5 text-stone-500 font-medium">Education Detail</span>
                    <span className="col-span-7 text-stone-900 font-semibold">{profile.educationDetail}</span>
                  </div>
                )}
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Occupation</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.profession}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Company Name</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.company}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Annual Income</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.annualIncome}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Working</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.working}</span>
                </div>
              </div>
            </div>

            {/* Card: Family Background */}
            <div id="section-family" className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[0.95rem] text-stone-900 tracking-tight">Family Background</h3>
              </div>

              <div className="divide-y divide-stone-100 text-xs sm:text-[13px]">
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Father's Occupation</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.fatherOccupation}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Mother's Occupation</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.motherOccupation}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Family Type</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.familyType}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">No. of Brothers</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.brothers}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">No. of Sisters</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.sisters}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Family Values</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.familyValues}</span>
                </div>
                {profile.livingWithParents !== null && (
                  <div className="grid grid-cols-12 py-2.5">
                    <span className="col-span-5 text-stone-500 font-medium">Living with Parents</span>
                    <span className="col-span-7 text-stone-900 font-semibold">
                      {profile.livingWithParents ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {profile.familyLocation && (
                  <div className="grid grid-cols-12 py-2.5">
                    <span className="col-span-5 text-stone-500 font-medium">Family Location</span>
                    <span className="col-span-7 text-stone-900 font-semibold">{profile.familyLocation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card: Lifestyle */}
            <div id="section-lifestyle" className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <Heart className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[0.95rem] text-stone-900 tracking-tight">Lifestyle</h3>
              </div>

              <div className="divide-y divide-stone-100 text-xs sm:text-[13px]">
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Diet</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.diet}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Smoking</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.smoking}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Drinking</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.drinking}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Physical Status</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.physicalStatus}</span>
                </div>
                {profile.physicalDisability && profile.physicalDisability !== 'None' && (
                  <div className="grid grid-cols-12 py-2.5">
                    <span className="col-span-5 text-stone-500 font-medium">Disability Details</span>
                    <span className="col-span-7 text-stone-900 font-semibold">{profile.physicalDisability}</span>
                  </div>
                )}
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Interests</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.interests}</span>
                </div>
              </div>
            </div>

            {/* Card: Horoscope */}
            <div id="section-horoscope" className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <Sun className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-[0.95rem] text-stone-900 tracking-tight">Horoscope Details</h3>
              </div>

              <div className="divide-y divide-stone-100 text-xs sm:text-[13px]">
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Star (Nakshatra)</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.star}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Moon Sign (Rashi)</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.rashi}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Dosha Status</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.dosha}</span>
                </div>
                <div className="grid grid-cols-12 py-2.5">
                  <span className="col-span-5 text-stone-500 font-medium">Gothram</span>
                  <span className="col-span-7 text-stone-900 font-semibold">{profile.gothram}</span>
                </div>
                {profile.birthPlace && (
                  <div className="grid grid-cols-12 py-2.5">
                    <span className="col-span-5 text-stone-500 font-medium">Birth Place</span>
                    <span className="col-span-7 text-stone-900 font-semibold">{profile.birthPlace}</span>
                  </div>
                )}
                {profile.birthTime && (
                  <div className="grid grid-cols-12 py-2.5">
                    <span className="col-span-5 text-stone-500 font-medium">Birth Time</span>
                    <span className="col-span-7 text-stone-900 font-semibold">{profile.birthTime}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ──── Right Column: Gallery, Quick Info & Looking For ──── */}
          <div className="lg:col-span-5 space-y-6">

            {/* 1. Photo Gallery Card */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <Camera className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Photo Gallery</h3>
              </div>

              {galleryList.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5 items-stretch">
                  {/* Large Left Photo */}
                  <div
                    onClick={() => setCurrentPhotoIndex(0)}
                    className="rounded-xl overflow-hidden aspect-[3/4.2] bg-stone-100 relative group cursor-pointer shadow-2xs ring-1 ring-black/5 hover:ring-[#9f1239]"
                  >
                    <img
                      src={galleryList[0]}
                      alt="Gallery 1"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Right 2x2 Grid of Thumbnails */}
                  <div className="grid grid-cols-2 gap-2">
                    {galleryList.slice(1, 5).map((imgUrl, idx) => {
                      const actualIdx = idx + 1;
                      const isLastSlot = idx === 3;
                      const extraCount = galleryList.length - 4;

                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentPhotoIndex(actualIdx)}
                          className="rounded-xl overflow-hidden aspect-square bg-stone-100 relative group cursor-pointer shadow-2xs ring-1 ring-black/5 hover:ring-[#9f1239]"
                        >
                          <img
                            src={imgUrl}
                            alt={`Gallery ${actualIdx + 1}`}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                          {isLastSlot && extraCount > 0 && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs text-white font-bold text-xs flex items-center justify-center">
                              +{extraCount}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 px-4 text-center rounded-xl bg-stone-50 border border-dashed border-stone-200">
                  <Camera className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 font-medium">No gallery photos uploaded</p>
                </div>
              )}
            </div>

            {/* 2. Quick Info Card */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-rose-50 text-[#9f1239]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Quick Info</h3>
              </div>

              <div className="space-y-3.5 text-xs sm:text-[13px]">
                {profile.age && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <User className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="w-24 text-stone-500 font-medium">Age</span>
                    <span className="font-semibold text-stone-900">{profile.age} years</span>
                  </div>
                )}

                {profile.height !== 'Not Specified' && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <ArrowUpDown className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="w-24 text-stone-500 font-medium">Height</span>
                    <span className="font-semibold text-stone-900">{profile.height}</span>
                  </div>
                )}

                {profile.religion !== 'Not Specified' && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <Building2 className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="w-24 text-stone-500 font-medium">Religion</span>
                    <span className="font-semibold text-stone-900">{profile.religion}</span>
                  </div>
                )}

                {profile.caste !== 'Not Specified' && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <Star className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="w-24 text-stone-500 font-medium">Caste</span>
                    <span className="font-semibold text-stone-900">{profile.caste}</span>
                  </div>
                )}

                {profile.education !== 'Not Specified' && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <GraduationCap className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="w-24 text-stone-500 font-medium">Education</span>
                    <span className="font-semibold text-stone-900">{profile.education}</span>
                  </div>
                )}

                {profile.profession !== 'Not Specified' && (
                  <div className="flex items-center gap-3 text-stone-700">
                    <Briefcase className="h-4 w-4 text-stone-400 shrink-0" />
                    <span className="w-24 text-stone-500 font-medium">Occupation</span>
                    <span className="font-semibold text-stone-900">{profile.profession}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-stone-700">
                  <MapPin className="h-4 w-4 text-stone-400 shrink-0" />
                  <span className="w-24 text-stone-500 font-medium">Location</span>
                  <span className="font-semibold text-stone-900">
                    {[profile.location.city, profile.location.state].filter(s => s && s !== 'Not Specified').join(', ') || 'Not Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Looking for Card */}
            <div className="bg-rose-50/25 border border-rose-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#e11d48] fill-[#e11d48]" />
                <h4 className="font-bold text-sm text-[#9f1239]">Looking for</h4>
              </div>
              <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-normal">
                {profile.lookingFor}
              </p>
            </div>

            {/* 4. Romantic Artwork: "Better Together" */}
            <div className="py-6 flex flex-col items-center justify-center text-center opacity-85 select-none pointer-events-none">
              <svg width="240" height="110" viewBox="0 0 240 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-rose-300">
                {/* Interwoven Rings */}
                <ellipse cx="105" cy="50" rx="20" ry="12" stroke="#e5b5c2" strokeWidth="1.5" fill="none" />
                <ellipse cx="125" cy="46" rx="22" ry="14" stroke="#d8849b" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
                {/* Left Bird */}
                <path d="M72 45 C75 35 85 35 90 40 C95 45 92 50 88 52 C82 55 75 52 72 45 Z" fill="#f5dce3" stroke="#d8849b" strokeWidth="1.2" />
                <circle cx="85" cy="39" r="1" fill="#9f1239" />
                <path d="M89 40 L93 41" stroke="#d8849b" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M72 48 C65 52 60 50 56 46" stroke="#d8849b" strokeWidth="1.2" strokeLinecap="round" />
                {/* Right Bird */}
                <path d="M110 38 C115 30 126 31 130 37 C133 42 130 48 124 50 C118 52 112 47 110 38 Z" fill="#f5dce3" stroke="#d8849b" strokeWidth="1.2" />
                <circle cx="116" cy="34" r="1" fill="#9f1239" />
                <path d="M112 36 L108 37" stroke="#d8849b" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M128 44 C135 46 142 43 146 39" stroke="#d8849b" strokeWidth="1.2" strokeLinecap="round" />
                {/* Love Swirl Line */}
                <path d="M45 88 C70 86 100 90 135 86 C165 83 195 86 215 92" stroke="#f1cbd5" strokeWidth="1.2" strokeLinecap="round" />
              </svg>

              <div className="-mt-8">
                <span className="font-serif italic text-2xl text-[#d46d88] tracking-wide block">
                  Better Together
                </span>
                <span className="text-[#e11d48] text-xs block mt-0.5">♥</span>
              </div>
            </div>

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
          <Button variant="outline" size="sm" onClick={() => setIsVideoModalOpen(false)} className="w-full font-bold border-stone-300 text-stone-700 hover:bg-stone-50">
            Close Video
          </Button>
        </div>
      </Modal>

      {/* Privacy & Safety Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Report Profile: ${profile.name}`}>
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-sans">
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 text-[11px]">
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
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#9f1239]/40"
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
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9f1239]/40 resize-none font-medium"
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
              className="font-bold shadow-md bg-[#9f1239] hover:bg-[#881337] text-white rounded-xl"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5 mr-1.5 text-white" />
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
          <div className="h-16 w-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-[#9f1239] shadow-sm">
            <Lock className="h-8 w-8 text-[#9f1239]" />
          </div>

          <div className="space-y-2">
            <Badge variant="gold" className="bg-[#D4AF37]/20 text-[#8B1E3F] border-[#D4AF37]/50 font-extrabold px-3 py-1 text-xs">
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
              className="w-full sm:w-1/2 font-extrabold text-xs bg-[#9f1239] hover:bg-[#881337] text-white shadow-md rounded-xl"
            >
              <Crown className="h-4 w-4 mr-1 text-white" /> Take Membership
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ViewProfile;
