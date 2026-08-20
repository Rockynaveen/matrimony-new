import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
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
  XCircle
} from 'lucide-react';
import {
  useAddToShortlist,
  useRemoveFromShortlist,
  useShortlist,
  useSendInterest,
  useSentInterests,
  useAddToIgnore,
  useBlockProfile
} from '../../hooks/useMatching';
import { useCreatePrivacyReport, useCreatePhotoRequest } from '../../hooks/usePrivacyReports';

export const ViewProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profiles, showToast, setActiveChatUserId, isAuthenticated } = useApp();
  const navigate = useNavigate();

  const numericUserId = Number(id || 0);

  // Live queries for shortlist and sent interests
  const { data: shortlist } = useShortlist();
  const { data: sentInterests } = useSentInterests();

  const addShortlistMutation = useAddToShortlist();
  const removeShortlistMutation = useRemoveFromShortlist();
  const sendInterestMutation = useSendInterest();
  const ignoreMutation = useAddToIgnore();
  const blockMutation = useBlockProfile();

  const isShortlisted = shortlist?.some(s => s.user_id === numericUserId) || false;
  const isInterestSent = sentInterests?.some(i => i.to_user === numericUserId) || false;

  const profile = profiles.find(p => p.id === id || String(p.id) === String(id));

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-6 text-center">
        <div className="h-16 w-16 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <UserX className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Profile Not Found</h2>
          <p className="text-xs text-stone-500 max-w-md mx-auto">The requested profile could not be located or may have been updated. Please browse active verified profiles.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/matches')} className="font-bold text-xs px-6">
          Browse Verified Matches
        </Button>
      </div>
    );
  }

  const [activePhoto, setActivePhoto] = useState(profile.profileImage);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleExpressInterest = async () => {
    try {
      await sendInterestMutation.mutateAsync({ to_user: numericUserId, message: 'Hi, I am interested in your profile.' });
      showToast(`Interest expression sent to ${profile.name}!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to express interest');
    }
  };

  const handleShortlistToggle = async () => {
    try {
      if (isShortlisted) {
        await removeShortlistMutation.mutateAsync(numericUserId);
        showToast(`Removed ${profile.name} from shortlist.`);
      } else {
        await addShortlistMutation.mutateAsync({ user: numericUserId });
        showToast(`Added ${profile.name} to shortlist!`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update shortlist status');
    }
  };

  const handleIgnore = async () => {
    try {
      await ignoreMutation.mutateAsync({ user: numericUserId, reason: 'Skipped from profile page' });
      showToast(`Profile ${profile.name} added to ignored profiles.`);
      navigate('/matching/ignored');
    } catch (err: any) {
      showToast(err?.message || 'Failed to ignore profile');
    }
  };

  const handleBlock = async () => {
    const confirmed = window.confirm(`Are you sure you want to block ${profile.name}?`);
    if (!confirmed) return;
    try {
      await blockMutation.mutateAsync({ user: numericUserId, reason: 'Blocked from profile page' });
      showToast(`${profile.name} has been blocked.`);
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
      showToast(`✓ Report submitted for ${profile.name}. Our safety team is reviewing it.`);
      setIsReportModalOpen(false);
      setReportDescription('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const createPhotoRequestMutation = useCreatePhotoRequest();

  const handleRequestPhotoAccess = async () => {
    try {
      await createPhotoRequestMutation.mutateAsync({
        requester_id: 0,
        profile_owner_id: numericUserId
      });
      showToast(`✓ Photo view request sent to ${profile.name}!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to send photo access request.');
    }
  };

  const handleMessageClick = () => {
    setActiveChatUserId(profile.id);
    navigate(`/messages/${profile.id}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Matches
      </button>

      {/* Main Profile Header Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Photos & Video Intro */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="overflow-hidden border-border/80 shadow-lg">
            
            {/* Main Photo Display */}
            <div className="relative aspect-4/5 w-full bg-muted">
              <img
                src={activePhoto}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                {profile.verified && (
                  <Badge variant="verified" className="bg-white/95 text-emerald-800 backdrop-blur-xs font-bold">
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
                <span className="text-xs font-semibold text-white/80">Profile ID: {profile.id}</span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {profile.gallery && profile.gallery.length > 0 && (
              <div className="p-3 bg-muted/30 flex items-center gap-2 overflow-x-auto">
                {profile.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto(imgUrl)}
                    className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activePhoto === imgUrl ? 'border-[#8B1E3F] ring-2 ring-[#8B1E3F]/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </Card>
        </div>

        {/* Right Column: Key Details & Quick Actions */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-8 space-y-6">
            
            {/* Title & Top Meta */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-3xl font-bold text-foreground">{profile.name}, {profile.age}</h1>
                  {profile.verified && <ShieldCheck className="h-6 w-6 text-emerald-600 fill-emerald-100" />}
                </div>
                <p className="text-sm font-semibold text-[#8B1E3F] mt-1">
                  {profile.religion} • {profile.caste} {profile.subcaste ? `(${profile.subcaste})` : ''} • {profile.motherTongue}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <MapPin className="h-3.5 w-3.5 text-[#8B1E3F]" /> {profile.location.city}, {profile.location.state}, {profile.location.country}
                </div>
              </div>

              {/* Compatibility Pill */}
              <div className="bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 p-4 rounded-2xl text-center shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">Match Score</span>
                {isAuthenticated ? (
                  <span className="font-serif text-3xl font-bold text-[#8B1E3F]">{profile.compatibilityScore}%</span>
                ) : (
                  <span className="font-serif text-base font-bold text-stone-400 block pt-1.5">🔒 Locked</span>
                )}
              </div>
            </div>

            {/* Core Info Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1">
                <span className="text-stone-800 block text-[11px] font-extrabold uppercase tracking-wider">Profession</span>
                <span className="font-extrabold text-stone-950">{profile.profession}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1">
                <span className="text-stone-800 block text-[11px] font-extrabold uppercase tracking-wider">Education</span>
                <span className="font-extrabold text-stone-950">{profile.education}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1">
                <span className="text-stone-800 block text-[11px] font-extrabold uppercase tracking-wider">Annual Income</span>
                <span className={`font-extrabold text-[#8B1E3F] ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? profile.annualIncome : '₹XX,XX,XXX'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1">
                <span className="text-stone-800 block text-[11px] font-extrabold uppercase tracking-wider">Marital Status</span>
                <span className="font-extrabold text-stone-950">{profile.maritalStatus}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1">
                <span className="text-stone-800 block text-[11px] font-extrabold uppercase tracking-wider">Height & Weight</span>
                <span className="font-extrabold text-stone-950">{profile.physicalAttributes.height} • {profile.physicalAttributes.weight}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-1">
                <span className="text-stone-800 block text-[11px] font-extrabold uppercase tracking-wider">Diet</span>
                <span className="font-extrabold text-stone-950">{profile.lifestyle.diet}</span>
              </div>
            </div>

            {/* Profile Action Buttons Toolbar */}
            {isAuthenticated ? (
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border/60">
                {isInterestSent ? (
                  <Button size="lg" variant="secondary" disabled className="text-emerald-700 bg-emerald-50">
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Interest Sent
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={handleExpressInterest}
                    disabled={sendInterestMutation.isPending}
                  >
                    {sendInterestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2 fill-white/30" />
                    )}
                    Express Interest
                  </Button>
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleShortlistToggle}
                  disabled={addShortlistMutation.isPending || removeShortlistMutation.isPending}
                >
                  {addShortlistMutation.isPending || removeShortlistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Heart className={`h-4 w-4 mr-2 ${isShortlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                  )}
                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </Button>

                <Button size="lg" variant="gold" onClick={handleMessageClick}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Start Chat
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRequestPhotoAccess}
                  disabled={createPhotoRequestMutation.isPending}
                >
                  {createPhotoRequestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2 text-primary" />
                  )}
                  Request Photo Access
                </Button>

                <Button size="lg" variant="outline" onClick={() => setIsReportModalOpen(true)} className="border-amber-300 text-amber-900 hover:bg-amber-50">
                  <Flag className="h-4 w-4 mr-2 text-amber-600" /> Report Profile
                </Button>
              </div>
            ) : (
              <div className="p-6 bg-stone-50 border border-stone-200 rounded-3xl space-y-3.5 text-center mt-4 shadow-sm">
                <h4 className="font-serif font-bold text-sm text-[#8B1E3F] flex items-center justify-center gap-1.5">
                  🔒 Unlock Full Details & Matching
                </h4>
                <p className="text-[11px] text-stone-500 font-medium max-w-sm mx-auto leading-relaxed">
                  To protect member security, direct contact details, horoscope indicators, compatibility analysis, and family information are visible only to verified logged-in members.
                </p>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/login?redirect=/profile/${id}`)}
                    className="bg-[#8B1E3F] hover:bg-[#721733] text-white px-5 font-bold text-xs rounded-xl h-9"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/register?redirect=/profile/${id}`)}
                    className="border-stone-200 text-stone-700 hover:bg-stone-50 px-5 font-bold text-xs rounded-xl h-9"
                  >
                    Register Free
                  </Button>
                </div>
              </div>
            )}

            {/* Moderation Controls */}
            {isAuthenticated && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                <button onClick={() => showToast('Profile reported to moderation team')} className="hover:text-destructive flex items-center gap-1">
                  <Flag className="h-3.5 w-3.5" /> Report Profile
                </button>
                <button onClick={handleIgnore} disabled={ignoreMutation.isPending} className="hover:text-amber-700 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Ignore Profile
                </button>
                <button onClick={handleBlock} disabled={blockMutation.isPending} className="hover:text-destructive flex items-center gap-1">
                  <UserX className="h-3.5 w-3.5" /> Block Profile
                </button>
              </div>
            )}

          </Card>
        </div>

      </div>

      {/* Comprehensive Profile Sections */}
      <div className="space-y-8">
        
        {/* About Me */}
        <Card className="p-6 space-y-3">
          <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">About Me</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-sans">{profile.about}</p>
        </Card>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Horoscope & Astrological Info */}
          <Card className="p-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#8B1E3F] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" /> Horoscope & Kundali Details
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Rashi (Moon Sign)</span>
                <span className={`font-bold text-foreground ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? (profile.horoscope?.rashi || 'Not Specified') : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Nakshatra</span>
                <span className={`font-bold text-foreground ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? (profile.horoscope?.nakshatra || 'Not Specified') : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Manglik / Dosha Status</span>
                <span className={`font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? (profile.horoscope?.dosha || 'Not Specified') : '🔒 Restricted'}
                </span>
              </div>
            </div>
          </Card>

          {/* Family Background */}
          <Card className="p-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">Family Details</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Family Type & Values</span>
                <span className={`font-bold text-foreground ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? `${profile.family?.type || 'Not Specified'} • ${profile.family?.values || 'Traditional'}` : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Family Status</span>
                <span className={`font-bold text-foreground ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? (profile.family?.status || 'Not Specified') : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Father's Occupation</span>
                <span className={`font-bold text-foreground ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? (profile.family?.fatherOccupation || 'Not Specified') : '🔒 Restricted'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Mother's Occupation</span>
                <span className={`font-bold text-foreground ${!isAuthenticated ? 'blur-[4px] select-none' : ''}`}>
                  {isAuthenticated ? (profile.family?.motherOccupation || 'Not Specified') : '🔒 Restricted'}
                </span>
              </div>
            </div>
          </Card>

          {/* Lifestyle & Hobbies */}
          <Card className="p-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">Lifestyle & Hobbies</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Languages Spoken</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map(l => (
                    <Badge key={l} variant="outline">{l}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Hobbies & Passions</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.hobbies.map(h => (
                    <Badge key={h} variant="secondary">{h}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Partner Preferences Summary */}
          <Card className="p-6 space-y-4 bg-muted/20 border-border/80">
            <h3 className="font-serif text-xl font-bold text-[#8B1E3F]">Desired Partner Preferences</h3>
            <div className="space-y-2 text-xs">
              <p><span className="text-muted-foreground">Age Range:</span> <span className="font-bold">{profile.partnerPreferences.ageMin} - {profile.partnerPreferences.ageMax} yrs</span></p>
              <p><span className="text-muted-foreground">Height Range:</span> <span className="font-bold">{profile.partnerPreferences.heightMin} to {profile.partnerPreferences.heightMax}</span></p>
              <p><span className="text-muted-foreground">Religions:</span> <span className="font-bold">{profile.partnerPreferences.religions.join(', ')}</span></p>
              <p><span className="text-muted-foreground">Educations:</span> <span className="font-bold">{profile.partnerPreferences.educations.join(', ')}</span></p>
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

      {/* Privacy & Safety Report Modal (POST /api/privacy/reports/) */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={`Report Profile: ${profile.name}`}>
        <form onSubmit={handleReportSubmit} className="space-y-4 text-xs font-sans">
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px]">
            <span className="font-bold block">100% Confidential Report</span>
            <span>Your report will be submitted directly to safety moderation via <code className="font-mono text-amber-950">POST /api/privacy/reports/</code>. Your identity is protected.</span>
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
              className="font-bold border-stone-300"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingReport}
              className="font-bold shadow-md bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5 mr-1.5" />
                  Submit Safety Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
