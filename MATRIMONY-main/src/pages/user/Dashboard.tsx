import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, extractNameFromEmail, isGenericName } from '../../context/AppContext';
import { useProfile } from '../../hooks/useProfile';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import {
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Crown,
  ChevronRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, profiles, interests, showToast } = useApp();
  const { data: apiProfile } = useProfile();
  const navigate = useNavigate();

  const recommendedMatches = profiles.slice(0, 3);
  const pendingInterests = interests.filter(i => i.status === 'pending');

  const displayName = (currentUser.name && !isGenericName(currentUser.name))
    ? currentUser.name
    : extractNameFromEmail(currentUser.email || localStorage.getItem('logged_in_email'));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      
      {/* ================= TOP HERO GREETING BANNER ================= */}
      <ScrollReveal direction="up">
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-none relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4 z-10">
            <div className="relative shrink-0">
              {currentUser.avatar || apiProfile?.profile_photo ? (
                <img
                  src={apiProfile?.profile_photo || currentUser.avatar}
                  alt={displayName}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl object-cover ring-4 ring-[#8B1E3F]/20"
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-[#8B1E3F] text-white flex items-center justify-center font-bold text-xl ring-4 ring-[#8B1E3F]/20">
                  {displayName && !isGenericName(displayName) ? displayName.charAt(0).toUpperCase() : <UserCheck className="h-8 w-8" />}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full ring-2 ring-white">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="gold" className="bg-[#D4AF37]/15 text-[#8B1E3F] border-[#D4AF37]/40 font-bold px-3 py-0.5 text-[11px]">
                  <Crown className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" /> {currentUser.membershipTier} VIP Member
                </Badge>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                  Profile Verified
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Welcome back, {displayName.split(' ')[0]}! 👋
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 font-medium">
                {apiProfile?.highest_education ? (
                  <span>Degree: <span className="font-bold text-stone-900">{apiProfile.highest_education}</span> • Religion: <span className="font-bold text-[#8B1E3F]">{apiProfile.religion}</span></span>
                ) : (
                  <span>You have <span className="font-bold text-[#8B1E3F]">3 new compatible matches</span> & <span className="font-bold text-[#8B1E3F]">2 pending interest requests</span>.</span>
                )}
              </p>
            </div>
          </div>

          {/* Profile Completion Meter Box */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 w-full md:w-72 shrink-0 space-y-2.5 z-10">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Profile Completion</span>
              <span className="text-[#8B1E3F]">{apiProfile ? '100%' : '20%'}</span>
            </div>
            <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#8B1E3F] via-[#C44569] to-[#D4AF37] rounded-full" style={{ width: apiProfile ? '100%' : '20%' }} />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/profile')}
                className="flex-1 text-xs font-bold h-8 bg-stone-100 hover:bg-[#8B1E3F] hover:text-white border-stone-300 text-stone-800"
              >
                View My Profile 👤
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/profile/complete')}
                className="flex-1 text-xs font-bold h-8 border-stone-300 text-stone-700 hover:bg-[#8B1E3F] hover:text-white"
              >
                Edit ✏️
              </Button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ================= KPI METRIC CARDS GRID ================= */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          
          <Card className="p-4 border-stone-200/80 bg-white/90 shadow-none hover:border-[#8B1E3F]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Profile Views</span>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <p className="font-serif text-2xl font-extrabold text-stone-900 mt-2">142</p>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-1">
              <TrendingUp className="h-3 w-3" /> +18% this week
            </span>
          </Card>

          <Card className="p-4 border-stone-200/80 bg-white/90 shadow-none hover:border-[#8B1E3F]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Interests Recd</span>
              <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Heart className="h-4 w-4" />
              </div>
            </div>
            <p className="font-serif text-2xl font-extrabold text-stone-900 mt-2">24</p>
            <span className="text-[10px] text-stone-500 font-semibold mt-1 block">5 pending review</span>
          </Card>

          <Card className="p-4 border-stone-200/80 bg-white/90 shadow-none hover:border-[#8B1E3F]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Interests Sent</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="font-serif text-2xl font-extrabold text-stone-900 mt-2">16</p>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 block">8 Accepted</span>
          </Card>

          <Card className="p-4 border-stone-200/80 bg-white/90 shadow-none hover:border-[#8B1E3F]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">AI Compatibility</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="font-serif text-2xl font-extrabold text-stone-900 mt-2">94%</p>
            <span className="text-[10px] text-amber-800 font-bold mt-1 block">34/36 Guna Match</span>
          </Card>

          <Card className="p-4 border-stone-200/80 bg-white/90 shadow-none hover:border-[#8B1E3F]/40 transition-colors col-span-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Unread Messages</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <p className="font-serif text-2xl font-extrabold text-stone-900 mt-2">3</p>
            <Link to="/messages" className="text-[10px] text-[#8B1E3F] font-bold hover:underline mt-1 block">
              Open Chat Inbox →
            </Link>
          </Card>

        </div>
      </ScrollReveal>

      {/* ================= MAIN DASHBOARD CONTENT (2 COLS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: RECOMMENDED MATCHES & INTERESTS (8 COLS) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Recommended Matches Section */}
          <ScrollReveal direction="up" delay={0.2}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#8B1E3F]" /> Highly Compatible Matches
                  </h2>
                  <p className="text-xs text-stone-500 font-medium">Curated by Vivah AI based on your horoscope and preferences</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/matches')} className="text-xs font-bold border-stone-200">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recommendedMatches.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* New Received Interests */}
          <ScrollReveal direction="up" delay={0.3}>
            <Card className="p-6 space-y-4 border-stone-200/80 bg-white/95 shadow-none rounded-3xl">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-[#C44569]" /> Recent Interests Received
                </h3>
                <Link to="/interests" className="text-xs font-bold text-[#8B1E3F] hover:underline">
                  View All Interests ({pendingInterests.length})
                </Link>
              </div>

              <div className="divide-y divide-stone-100">
                {pendingInterests.map(interest => (
                  <div key={interest.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={interest.senderImage} alt="" className="h-12 w-12 rounded-2xl object-cover ring-2 ring-[#8B1E3F]/20" />
                      <div>
                        <h4 className="font-serif font-bold text-xs text-stone-900">{interest.senderName}, {interest.senderAge}</h4>
                        <p className="text-[11px] text-stone-500 font-medium">{interest.senderProfession} • {interest.senderLocation}</p>
                        <span className="text-[10px] text-stone-400 font-medium">{interest.sentAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => showToast(`Accepted interest from ${interest.senderName}`)}
                        className="flex-1 sm:flex-none text-xs py-1.5 h-8 font-bold bg-[#8B1E3F] hover:bg-[#721733] text-white"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showToast(`Declined interest request`)}
                        className="flex-1 sm:flex-none text-xs py-1.5 h-8 font-semibold border-stone-200 text-stone-600"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </ScrollReveal>

        </div>

        {/* RIGHT SIDEBAR COLUMN (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Membership Status Card */}
          <ScrollReveal direction="up" delay={0.2}>
            <Card className="p-6 border border-[#8B1E3F]/20 bg-gradient-to-br from-white via-amber-50/30 to-rose-50/20 shadow-none rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="gold" className="bg-[#D4AF37]/20 text-[#8B1E3F] border-[#D4AF37]/30 font-bold px-2.5 py-0.5">
                  {currentUser.membershipTier} TIER
                </Badge>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Subscription
                </span>
              </div>
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">24 Contact Views Remaining</h4>
                <p className="text-xs text-stone-600 font-medium mt-1 leading-relaxed">
                  Directly call verified bride/groom profiles & family contacts.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/membership')}
                className="w-full font-bold text-xs h-9 bg-[#8B1E3F] hover:bg-[#721733] text-white"
              >
                Upgrade to Platinum VIP Tier
              </Button>
            </Card>
          </ScrollReveal>

          {/* Account Verification Checklist */}
          <ScrollReveal direction="up" delay={0.3}>
            <Card className="p-6 space-y-4 border-stone-200/80 bg-white/95 shadow-none rounded-3xl">
              <h4 className="font-serif font-bold text-base flex items-center gap-2 text-stone-900">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Account Verification Status
              </h4>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Email Verification
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800">Verified</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mobile OTP
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800">Verified</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-700" /> Govt ID Proof
                  </span>
                  <span className="text-[10px] font-bold text-amber-800">Pending Upload</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/verification')}
                className="w-full text-xs font-semibold h-8 border-stone-200 text-stone-700"
              >
                Complete ID Verification
              </Button>
            </Card>
          </ScrollReveal>

          {/* AI Kundali & Horoscope Teaser */}
          <ScrollReveal direction="up" delay={0.4}>
            <Card className="p-6 bg-gradient-to-br from-stone-50 to-[#8B1E3F]/5 border border-[#8B1E3F]/20 shadow-none rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-[#8B1E3F]">
                <Sparkles className="h-5 w-5" />
                <h4 className="font-serif font-bold text-base text-stone-900">AI Horoscope Matching</h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                View detailed 36 Guna compatibility breakdowns, Rashi alignment, and Manglik Dosha reports.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/preferences')}
                className="w-full text-xs font-bold bg-[#8B1E3F] hover:bg-[#721733] text-white"
              >
                View Match Preferences
              </Button>
            </Card>
          </ScrollReveal>

        </div>

      </div>

    </div>
  );
};
