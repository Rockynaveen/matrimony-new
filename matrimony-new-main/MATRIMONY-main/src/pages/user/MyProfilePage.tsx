import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Edit3,
  Sliders,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Loader2,
  Camera,
  FileText,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useProfile } from '../../hooks/useProfile';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { DotsLoader } from '../../components/ui/LoadingScreen';

export const MyProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, verificationStatus } = useApp();
  const { data: apiProfile, isLoading, refetch } = useProfile();

  // Retrieve local draft backup if server returns empty or during cold start
  const localDraftRaw = localStorage.getItem('user_profile_draft');
  const localDraft = localDraftRaw ? JSON.parse(localDraftRaw) : null;

  const apiFullName = (apiProfile as any)?.first_name ? `${(apiProfile as any).first_name} ${(apiProfile as any).last_name || ''}`.trim() : '';
  const emailName = extractNameFromEmail(currentUser.email || (apiProfile as any)?.email || localStorage.getItem('logged_in_email'));

  let resolvedProfileName = '';
  if (currentUser.name && !isGenericName(currentUser.name)) {
    resolvedProfileName = currentUser.name;
  } else if (apiFullName && !isGenericName(apiFullName)) {
    resolvedProfileName = apiFullName;
  } else {
    resolvedProfileName = emailName;
  }

  // Synthesize displayed profile values from API -> localDraft -> currentUser context
  const profile = {
    name: resolvedProfileName,
    email: currentUser.email || (apiProfile as any)?.email || '',
    avatar: apiProfile?.profile_photo || localDraft?.profile_photo || currentUser.avatar || '',
    about_me: apiProfile?.about_me || localDraft?.about_me || 'No description provided yet. Click edit to add your bio.',
    height: apiProfile?.height || (localDraft?.height ? String(localDraft.height) : 'Not Specified'),
    weight: apiProfile?.weight || (localDraft?.weight ? String(localDraft.weight) : 'Not Specified'),
    complexion: apiProfile?.complexion || localDraft?.complexion || 'Not Specified',
    highest_education: apiProfile?.highest_education || localDraft?.highest_education || 'Not Specified',
    occupation: apiProfile?.occupation || localDraft?.occupation || 'Not Specified',
    annual_income: apiProfile?.annual_income || (localDraft?.annual_income ? `₹${localDraft.annual_income} Lakhs` : 'Not Specified'),
    religion: apiProfile?.religion || localDraft?.religion || 'Not Specified',
    caste: apiProfile?.caste || localDraft?.caste || 'Not Specified',
    rashi: apiProfile?.rashi || localDraft?.rashi || 'Not Specified',
    nakshatra: apiProfile?.nakshatra || localDraft?.nakshatra || 'Not Specified',
    dosha: apiProfile?.dosha || localDraft?.dosha || 'Not Specified',
    family_information: apiProfile?.family_information || localDraft?.family_information || 'No family details provided.',
    diet: apiProfile?.diet || localDraft?.diet || 'Not Specified',
    smoking: apiProfile?.smoking || localDraft?.smoking || 'Not Specified',
    drinking: apiProfile?.drinking || localDraft?.drinking || 'Not Specified',
    languages_known: apiProfile?.languages_known || localDraft?.languages_known || 'Not Specified',
    hobbies_interests: apiProfile?.hobbies_interests || localDraft?.hobbies_interests || 'Not Specified',
    marital_status: apiProfile?.marital_status || localDraft?.marital_status || 'Not Specified',
    disability_information: apiProfile?.disability_information || localDraft?.disability_information || 'None',
    country: apiProfile?.country || localDraft?.country || 'India',
    state: apiProfile?.state || localDraft?.state || '',
    city: apiProfile?.city || localDraft?.city || '',
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Loading Bar Indicator (3rd Loading State) */}
      {isLoading && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-3">
            <DotsLoader size="sm" />
            <span>Syncing latest profile data from backend server...</span>
          </div>
          <button onClick={() => refetch()} className="font-bold underline hover:text-[#8B1E3F]">
            Refresh
          </button>
        </div>
      )}

      {/* Hero Profile Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5B1028] via-[#8B1E3F] to-[#2C0A15] p-5 sm:p-8 text-white shadow-2xl border border-[#D4AF37]/30"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#C44569]/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
          {/* Avatar & Main Headings */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div className="relative group shrink-0">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl object-cover ring-4 ring-[#D4AF37] shadow-xl"
                />
              ) : (
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-amber-100/20 text-[#D4AF37] border-2 border-[#D4AF37] flex items-center justify-center font-bold text-3xl shadow-xl">
                  {profile.name && !isGenericName(profile.name) ? profile.name.charAt(0).toUpperCase() : <User className="h-12 w-12" />}
                </div>
              )}
              <button
                onClick={() => navigate('/profile/edit')}
                className="absolute -bottom-2 -right-2 p-2 bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-full shadow-md border-2 border-white transition-all cursor-pointer"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 w-full">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {verificationStatus === 'VERIFIED' ? (
                  <>
                    <Badge variant="gold" className="bg-[#D4AF37] text-stone-950 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-2.5 py-0.5">
                      Verified Member
                    </Badge>
                    <span className="text-[10px] sm:text-xs text-amber-200 font-semibold flex items-center gap-1 bg-black/30 px-2.5 py-0.5 rounded-full border border-amber-300/30">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> ID & Photo Verified
                    </span>
                  </>
                ) : verificationStatus === 'PENDING' ? (
                  <span className="text-[10px] sm:text-xs text-amber-200 font-semibold flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-amber-400/40">
                    <Clock className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> Verification Pending Admin Review
                  </span>
                ) : verificationStatus === 'REJECTED' ? (
                  <button
                    onClick={() => navigate('/verification')}
                    className="text-[10px] sm:text-xs text-rose-200 font-semibold flex items-center gap-1.5 bg-rose-950/60 hover:bg-rose-900 px-3 py-1 rounded-full border border-rose-400/40 transition-colors"
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" /> Verification Rejected (Click to Re-submit)
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/verification')}
                    className="text-[10px] sm:text-xs text-stone-300 font-semibold flex items-center gap-1.5 bg-black/40 hover:bg-black/60 px-3 py-1 rounded-full border border-white/20 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-300" /> Complete Verification
                  </button>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {profile.name}
              </h1>

              <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs text-stone-200 flex-wrap font-medium">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-amber-300" /> {profile.occupation}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-amber-300" /> {profile.highest_education}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-300" /> {profile.city}, {profile.state}
                </span>
              </div>

              {/* Profile Completion Meter */}
              <div className="pt-2 max-w-sm mx-auto md:mx-0 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-amber-200">
                  <span>Profile Completion</span>
                  <span>95% Completed</span>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/20">
                  <div className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-[#D4AF37] w-[95%] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-stone-950 hover:brightness-105 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile ✏️
            </button>

            <button
              type="button"
              onClick={() => navigate('/preferences')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-extrabold bg-white/20 hover:bg-white/30 text-white border border-white/40 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Sliders className="h-4 w-4" /> Match Preferences ⚙️
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Overview & Detailed Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Key Highlights & Quick Info Cards */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Summary Card */}
          <Card className="p-4 sm:p-6 bg-white border border-stone-200/90 shadow-lg rounded-3xl space-y-4">
            <h3 className="font-serif text-base sm:text-lg font-extrabold text-[#8B1E3F] flex items-center gap-2">
              <User className="h-5 w-5 text-[#8B1E3F]" /> Quick Overview
            </h3>

            <div className="space-y-3 text-xs divide-y divide-stone-200/70">
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Marital Status</span>
                <span className="font-extrabold text-stone-950 text-xs">{profile.marital_status}</span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Religion & Caste</span>
                <span className="font-extrabold text-[#8B1E3F] text-xs">{profile.religion} ({profile.caste})</span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Height & Weight</span>
                <span className="font-extrabold text-stone-950 text-xs">{profile.height} / {profile.weight}</span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Annual Income</span>
                <span className="font-extrabold text-emerald-800 text-xs">{profile.annual_income}</span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Diet Habit</span>
                <span className="font-extrabold text-stone-950 text-xs">{profile.diet}</span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Smoking / Drinking</span>
                <span className="font-extrabold text-stone-950 text-xs">{profile.smoking} / {profile.drinking}</span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="text-stone-700 font-extrabold uppercase tracking-wider text-[10px] sm:text-[11px]">Rashi / Nakshatra</span>
                <span className="font-extrabold text-[#8B1E3F] text-xs">{profile.rashi} / {profile.nakshatra}</span>
              </div>
            </div>
          </Card>

          {/* Partner Match Quick Link Banner */}
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-[#8B1E3F]/10 via-white to-amber-500/10 border border-[#8B1E3F]/30 shadow-lg rounded-3xl space-y-3">
            <div className="flex items-center gap-2 text-[#8B1E3F]">
              <Sparkles className="h-5 w-5" />
              <h4 className="font-serif font-extrabold text-base text-stone-950">Partner Expectations</h4>
            </div>
            <p className="text-xs text-stone-800 leading-relaxed font-bold">
              Update age range, location, caste, and salary parameters to find your ideal life match.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/preferences')}
              className="w-full text-xs font-extrabold bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-xl py-3 shadow-md"
            >
              Update Partner Preferences →
            </Button>
          </Card>
        </div>

        {/* Right Column: Detailed Profile Sections */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* About Me Section */}
          <Card className="p-4 sm:p-6 md:p-8 bg-white border border-stone-200/90 shadow-lg rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 sm:pb-4">
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#8B1E3F]" /> About Me
              </h3>
              <button
                onClick={() => navigate('/profile/edit')}
                className="text-xs font-extrabold text-[#8B1E3F] hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-4 w-4" /> Edit Bio
              </button>
            </div>
            <p className="text-xs sm:text-sm text-stone-900 leading-relaxed whitespace-pre-line font-bold">
              {profile.about_me}
            </p>
          </Card>

          {/* Education & Career Details */}
          <Card className="p-4 sm:p-6 md:p-8 bg-white border border-stone-200/90 shadow-lg rounded-3xl space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 sm:pb-4">
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#8B1E3F]" /> Education & Profession
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Highest Qualification</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.highest_education}</p>
              </div>

              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Occupation / Profession</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.occupation}</p>
              </div>

              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Annual Income</span>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-800">{profile.annual_income}</p>
              </div>

              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Current Location</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.city}, {profile.state}, {profile.country}</p>
              </div>
            </div>
          </Card>

          {/* Family & Cultural Background */}
          <Card className="p-4 sm:p-6 md:p-8 bg-white border border-stone-200/90 shadow-lg rounded-3xl space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 sm:pb-4">
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#8B1E3F]" /> Family & Religion Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Religion</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.religion}</p>
              </div>

              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Caste / Community</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.caste}</p>
              </div>

              <div className="sm:col-span-2 space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Family Information</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950 leading-relaxed">{profile.family_information}</p>
              </div>
            </div>
          </Card>

          {/* Horoscope & Lifestyle */}
          <Card className="p-4 sm:p-6 md:p-8 bg-white border border-stone-200/90 shadow-lg rounded-3xl space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 sm:pb-4">
              <h3 className="font-serif text-lg sm:text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#8B1E3F]" /> Astrology & Lifestyle Choices
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 sm:p-4 bg-amber-100/60 border border-amber-300 rounded-2xl space-y-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-900 uppercase tracking-wider block">Moon Sign (Rashi)</span>
                <p className="text-xs sm:text-sm font-extrabold text-[#8B1E3F]">{profile.rashi}</p>
              </div>

              <div className="p-3.5 sm:p-4 bg-amber-100/60 border border-amber-300 rounded-2xl space-y-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-900 uppercase tracking-wider block">Star (Nakshatra)</span>
                <p className="text-xs sm:text-sm font-extrabold text-[#8B1E3F]">{profile.nakshatra}</p>
              </div>

              <div className="p-3.5 sm:p-4 bg-amber-100/60 border border-amber-300 rounded-2xl space-y-1">
                <span className="text-[10px] sm:text-[11px] font-extrabold text-stone-900 uppercase tracking-wider block">Dosha Status</span>
                <p className="text-xs sm:text-sm font-extrabold text-[#8B1E3F]">{profile.dosha}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 pt-2">
              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Languages Known</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.languages_known}</p>
              </div>

              <div className="space-y-1 p-3.5 sm:p-4 bg-stone-50 rounded-2xl border border-stone-200/90 hover:border-[#8B1E3F]/40 transition-all">
                <span className="text-[10px] sm:text-[11px] text-stone-700 font-extrabold uppercase tracking-wider block">Hobbies & Interests</span>
                <p className="text-xs sm:text-sm font-extrabold text-stone-950">{profile.hobbies_interests}</p>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};
