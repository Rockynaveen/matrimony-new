import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { ProfileCard } from '../../components/profile/ProfileCard';
import { useRecommendations } from '../../hooks/useMatching';
import { membershipApi } from '../../api/membershipApi';
import type { ApiMembershipPlan } from '../../types/membershipTypes';
import { MOCK_SUCCESS_STORIES } from '../../data/mockSuccessStories';
import {
  Search,
  ShieldCheck,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Crown,
  Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Accordion, type AccordionItemData } from '../../components/ui/Accordion';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { Carousel } from '../../components/ui/Carousel';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

const HOME_FAQS: AccordionItemData[] = [
  {
    id: 'faq-1',
    question: 'How does profile verification work on Vivah?',
    answer: 'We mandate a 4-step verification process: Email verification, Mobile OTP check, Government ID card upload (Aadhaar/Passport/Driving License), and a live Face Selfie match. Verified profiles display a green verified badge.'
  },
  {
    id: 'faq-2',
    question: 'Is my personal phone number and photo safe on the platform?',
    answer: 'Yes, absolutely. Under Privacy Settings, you can choose to hide your mobile number, email address, and photos. You can grant access individually when a match requests photo view permissions.'
  },
  {
    id: 'faq-3',
    question: 'What is the difference between Free and Paid Gold/Platinum plans?',
    answer: 'Free profiles can search and express limited interests. Paid Gold & Platinum members unlock unlimited direct chats, 30+ verified phone number unlocks, priority ranking on search results, and personalized Relationship Managers.'
  },
  {
    id: 'faq-4',
    question: 'How does the AI Compatibility Score work?',
    answer: 'Our proprietary algorithm evaluates horoscope dosha match, education levels, annual income expectations, lifestyle choices (diet/smoking), family values, and mutual partner preferences to output a 0-100% compatibility score.'
  },
  {
    id: 'faq-5',
    question: 'Can parents or siblings create a profile on behalf of a candidate?',
    answer: 'Yes! Over 40% of profiles on Vivah are managed by parents or relatives. During registration, simply select "Profile created by: Parent / Sibling".'
  }
];

export const Home: React.FC = () => {
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();
  const { data: recommendations } = useRecommendations();
  const [plans, setPlans] = React.useState<ApiMembershipPlan[]>([]);

  React.useEffect(() => {
    membershipApi.getPlans().then(res => {
      if (Array.isArray(res)) setPlans(res);
    }).catch(() => {});
  }, []);

  const realProfiles = (recommendations && recommendations.length > 0)
    ? recommendations.slice(0, 4).map((rec: any) => {
        const matchName = rec.full_name || rec.name || `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || 'Verified Candidate';
        return {
          id: String(rec.user_id || rec.id || '1'),
          name: matchName,
          age: rec.age || 26,
          height: rec.height || "5'6\"",
          religion: rec.religion || 'Hindu',
          caste: rec.caste || 'Brahmin',
          location: rec.location || rec.city || 'India',
          profession: rec.profession || rec.occupation || 'Professional',
          education: rec.education || rec.highest_education || 'Graduate',
          avatar: rec.profile_photo || rec.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchName)}&background=8B1E3F&color=ffffff&bold=true`,
          verified: Boolean(rec.is_verified ?? true),
          compatibility: rec.compatibility_score || 92
        };
      })
    : [];

  const handleProtectedNavigate = (targetPath: string) => {
    if (!isAuthenticated) {
      navigate(`/register?redirect=${encodeURIComponent(targetPath)}`);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <div className="space-y-0 pb-12 overflow-x-hidden">

      {/* ================= HERO SECTION (CINEMATIC SUNSET BACKGROUND WITHOUT SEARCH BAR) ================= */}
      <section className="relative min-h-[95vh] h-[95vh] flex items-center overflow-hidden py-12">

        {/* Cinematic Sunset Couple Background Image */}
        <img
          src="/images/sunset_hero_couple.png"
          alt="Vivah Royal Matrimony Sunset Couple"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Elegant Left-to-Right Dark Gradient Mask for Crisp Readable Text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/3 left-10 w-[500px] h-[300px] bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl text-left space-y-6">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-extrabold uppercase tracking-widest shadow-xl">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>India's Premier Royal Matrimony Service</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12]">
                Find Your Perfect <br />
                <span className="gold-gradient-text">Life Partner</span>
              </h1>

              <p className="text-base sm:text-xl text-stone-200 font-sans leading-relaxed pt-2">
                Discover meaningful connections with people who share your values, interests, and dreams.
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              <Button
                variant="gold"
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 font-bold text-sm h-12 shadow-2xl"
              >
                Register Free Profile
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => handleProtectedNavigate('/search')}
                className="w-full sm:w-auto px-8 font-bold text-xs h-12 bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md"
              >
                <Search className="h-4 w-4 mr-2" /> Find Matches Now
              </Button>
            </motion.div>

            {/* Trust Metrics Pill Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-6 flex flex-wrap items-center gap-6 text-xs text-stone-300 font-semibold"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% ID Verified Profiles
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-amber-300" /> Privacy Controlled
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400" /> AI Horoscope Matchmaking
              </span>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ================= PLATFORM STATISTICS ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-md border border-amber-900/10 text-center">
            <div>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
                <AnimatedCounter target={100000} suffix="+" />
              </h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Verified Profiles</p>
            </div>
            <div>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
                <AnimatedCounter target={45000} suffix="+" />
              </h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Happy Marriages</p>
            </div>
            <div>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
                <AnimatedCounter target={99.4} decimals={1} suffix="%" />
              </h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Privacy Protection</p>
            </div>
            <div>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#8B1E3F]">
                <AnimatedCounter target={100} suffix="+" />
              </h3>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Communities Served</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <Badge variant="primary">Why Choose Vivah</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
              Crafted with Trust, Honor & Technology
            </h2>
            <p className="text-sm text-muted-foreground">
              We combine high-tech algorithmic precision with traditional Indian matrimonial sensibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center space-y-4 hover:border-primary/40 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold">100% ID Verified</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every profile undergoes strict government ID and mobile OTP verification before going live.
              </p>
            </Card>

            <Card className="p-6 text-center space-y-4 hover:border-primary/40 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-700 flex items-center justify-center mx-auto">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold">AI Compatibility</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deep algorithms match horoscope, values, career trajectory, and lifestyle compatibility.
              </p>
            </Card>

            <Card className="p-6 text-center space-y-4 hover:border-primary/40 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center mx-auto">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold">Privacy Control</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hide contact details, watermarked photos, and restrict access only to approved interests.
              </p>
            </Card>

            <Card className="p-6 text-center space-y-4 hover:border-primary/40 transition-colors">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-bold">Family Assistance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dedicated matchmaking advisor option and dual family login support for parents.
              </p>
            </Card>
          </div>

          {/* Stepper Steps */}
          <div className="mt-16 bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-border/80">
            <h3 className="font-serif text-2xl font-bold text-center mb-8">Four Simple Steps to Soulmate Connection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center space-y-3 relative">
                <div className="h-16 w-16 rounded-full bg-[#8B1E3F] text-white font-serif text-xl font-bold flex items-center justify-center mx-auto shadow-lg">
                  1
                </div>
                <h4 className="font-serif text-lg font-bold">Create Free Profile</h4>
                <p className="text-xs text-muted-foreground">Register with basic details, upload photos, and complete verification.</p>
              </div>

              <div className="text-center space-y-3 relative">
                <div className="h-16 w-16 rounded-full bg-[#C44569] text-white font-serif text-xl font-bold flex items-center justify-center mx-auto shadow-lg">
                  2
                </div>
                <h4 className="font-serif text-lg font-bold">Set Preferences</h4>
                <p className="text-xs text-muted-foreground">Define age, religion, community, education, and career expectations.</p>
              </div>

              <div className="text-center space-y-3 relative">
                <div className="h-16 w-16 rounded-full bg-[#D4AF37] text-white font-serif text-xl font-bold flex items-center justify-center mx-auto shadow-lg">
                  3
                </div>
                <h4 className="font-serif text-lg font-bold">Express Interest</h4>
                <p className="text-xs text-muted-foreground">Send interests, start direct chat or request verified photo access.</p>
              </div>

              <div className="text-center space-y-3 relative">
                <div className="h-16 w-16 rounded-full bg-emerald-700 text-white font-serif text-xl font-bold flex items-center justify-center mx-auto shadow-lg">
                  4
                </div>
                <h4 className="font-serif text-lg font-bold">Connect & Marry</h4>
                <p className="text-xs text-muted-foreground">Initiate family meetings and begin a lifelong fulfilling marriage.</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ================= FEATURED PROFILES ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <Badge variant="primary" className="mb-2">Recommended Profiles</Badge>
              <h2 className="font-serif text-3xl font-bold text-foreground">Featured Matrimonial Profiles</h2>
            </div>
            <Button variant="outline" onClick={() => navigate('/search')}>
              View All Matches <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {realProfiles.length > 0 ? (
              realProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile as any} />
              ))
            ) : (
              <div className="col-span-full bg-stone-50 border border-stone-200/90 rounded-3xl p-8 sm:p-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="max-w-xl mx-auto space-y-2">
                  <h3 className="font-serif text-2xl font-extrabold text-stone-900">
                    Thousands of Verified Profiles Await You
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                    Create your free account today to browse 100% ID-verified profiles filtered by your location, community, education, and lifestyle preferences.
                  </p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => navigate('/register')}
                    className="px-8 font-bold text-xs shadow-md"
                  >
                    Register Free Profile & Find Matches <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ================= MEMBERSHIP PLANS PREVIEW (LUXURY REDESIGN) ================= */}
      <section className="bg-transparent py-12 relative overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#8B1E3F]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <Badge variant="gold" className="bg-[#D4AF37]/15 text-[#8B1E3F] border-[#D4AF37]/40 font-bold px-4 py-1">
                <Crown className="h-4 w-4 mr-1.5 text-[#D4AF37]" /> Premium Subscriptions
              </Badge>
              <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
                Invest in Your <span className="text-[#8B1E3F]">Happily Ever After</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-600 font-medium max-w-2xl mx-auto">
                Upgrade your membership to unlock verified contact numbers, direct messaging, priority search boost, and personalized matchmaking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              {plans.map(plan => {
                const isPopular = plan.is_featured_profile || plan.name.toLowerCase().includes('gold');
                const isVIP = plan.name.toLowerCase().includes('platinum') || plan.name.toLowerCase().includes('royal');
                const price = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl flex flex-col justify-between relative transition-all duration-500 overflow-hidden ${isPopular
                      ? 'bg-gradient-to-b from-[#8B1E3F] via-[#A0234A] to-[#8B1E3F] text-white shadow-none scale-105 ring-4 ring-[#D4AF37]/50 z-20 p-8'
                      : isVIP
                        ? 'bg-stone-950 text-white shadow-none border border-stone-800 hover:border-amber-400/60 p-8'
                        : 'bg-white/80 backdrop-blur-md text-stone-900 shadow-none border border-stone-200/90 hover:border-[#8B1E3F]/40 p-8'
                      }`}
                  >
                    {/* Floating Highlight Badges */}
                    {isPopular && (
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 font-extrabold text-[11px] uppercase tracking-widest text-center py-1.5 shadow-md flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-stone-950" /> Most Popular Choice
                      </div>
                    )}

                    {isVIP && (
                      <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 text-amber-300 font-extrabold text-[11px] uppercase tracking-widest text-center py-1.5 border-b border-amber-400/30 flex items-center justify-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-amber-400" /> Concierge Matchmaking
                      </div>
                    )}

                    <div className={isPopular || isVIP ? 'pt-3' : ''}>
                      {/* Header */}
                      <div className="flex items-start justify-between pb-5 border-b border-current/15">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-serif text-2xl font-extrabold capitalize ${isPopular || isVIP ? 'text-white' : 'text-stone-900'}`}>
                              {plan.name}
                            </h3>
                          </div>
                          <p className={`text-xs mt-1 font-semibold ${isPopular || isVIP ? 'text-stone-200' : 'text-stone-500'}`}>
                            Validity: <span className="font-extrabold text-amber-300">{plan.validity_days} Days</span>
                          </p>
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="my-6">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-serif text-4xl sm:text-5xl font-black tracking-tight ${isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-[#8B1E3F]'
                            }`}>
                            {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 font-medium ${isPopular || isVIP ? 'text-stone-300' : 'text-stone-500'}`}>
                          All-Inclusive Premium Access
                        </p>
                      </div>

                      {/* Feature Highlight Pill Box */}
                      <div className={`p-3.5 rounded-2xl mb-6 text-xs font-semibold space-y-2 border ${isPopular
                        ? 'bg-white/10 border-white/20 text-white'
                        : isVIP
                          ? 'bg-stone-900 border-stone-800 text-amber-200'
                          : 'bg-stone-50 border-stone-200 text-stone-800'
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="opacity-90">Verified Contacts:</span>
                          <span className="font-extrabold text-amber-300">{plan.profile_credits} Unlocks</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="opacity-90">Messaging:</span>
                          <span className="font-extrabold text-amber-300">{plan.unlimited_messaging ? 'Unlimited' : 'Standard'}</span>
                        </div>
                      </div>

                      {/* Features List */}
                      <ul className="space-y-3 text-xs">
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-emerald-600'}`} />
                          <span className={isPopular || isVIP ? 'text-stone-100 font-medium' : 'text-stone-700 font-medium'}>
                            {plan.profile_credits} Contact Number Unlocks
                          </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-emerald-600'}`} />
                          <span className={isPopular || isVIP ? 'text-stone-100 font-medium' : 'text-stone-700 font-medium'}>
                            {plan.validity_days} Days Membership Validity
                          </span>
                        </li>
                        {plan.unlimited_messaging && (
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-emerald-600'}`} />
                            <span className={isPopular || isVIP ? 'text-stone-100 font-medium' : 'text-stone-700 font-medium'}>
                              Unlimited Direct Conversations
                            </span>
                          </li>
                        )}
                        {plan.is_featured_profile && (
                          <li className="flex items-start gap-2.5">
                            <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-emerald-600'}`} />
                            <span className={isPopular || isVIP ? 'text-stone-100 font-medium' : 'text-stone-700 font-medium'}>
                              Featured Profile Tag in Search
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8 pt-4">
                      <Button
                        variant={isPopular ? 'gold' : isVIP ? 'primary' : 'outline'}
                        size="lg"
                        onClick={() => navigate('/membership')}
                        className={`w-full font-extrabold shadow-xl h-12 text-xs uppercase tracking-wider transition-all duration-300 ${isPopular
                          ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 hover:brightness-110 border border-amber-300'
                          : isVIP
                            ? 'bg-gradient-to-r from-[#8B1E3F] to-[#C44569] text-white hover:opacity-95'
                            : 'border-stone-300 text-stone-800 hover:bg-stone-100'
                          }`}
                      >
                        Select {plan.name}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Guarantees */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-stone-600 text-xs font-semibold">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% Safe & Encrypted Payment
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8B1E3F]" /> Instant Membership Activation
              </span>
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[#D4AF37]" /> No Automatic Hidden Charges
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= SUCCESS STORIES ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <Badge variant="primary">Real Weddings</Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Thousands of Successful Unions
            </h2>
            <p className="text-sm text-stone-600 font-medium">
              Explore heartwarming journey stories from couples who found their lifetime partners on Vivah Matrimony.
            </p>
          </div>

          <Carousel autoPlay={true} autoPlayInterval={4500} itemsPerPage={{ mobile: 1, tablet: 2, desktop: 3 }}>
            {MOCK_SUCCESS_STORIES.map(story => (
              <Card key={story.id} className="overflow-hidden border border-stone-200/80 bg-white/95 backdrop-blur-md shadow-none hover:shadow-none transition-all h-full flex flex-col justify-between rounded-3xl group">
                <div>
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
                    <img
                      src={story.image}
                      alt={story.coupleName}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-[#8B1E3F] shadow-sm flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5 fill-[#8B1E3F]" /> Verified Wedding
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-serif text-xl font-bold text-[#8B1E3F] group-hover:text-[#C44569] transition-colors">{story.coupleName}</h3>
                    <p className="text-xs text-stone-600 flex items-center gap-1.5 font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-[#C44569]" /> Married: {story.weddingDate} • {story.location}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed italic line-clamp-3">
                      "{story.story}"
                    </p>
                  </CardContent>
                </div>
              </Card>
            ))}
          </Carousel>
        </ScrollReveal>
      </section>

      {/* ================= FAQ SECTION (SHADCN ACCORDION) ================= */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal direction="up">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <Badge variant="gold" className="bg-[#D4AF37]/15 text-[#8B1E3F] border-[#D4AF37]/30 font-bold px-4 py-1">
              Frequently Asked Questions
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-sm text-stone-600 font-medium">
              Have questions about profile verification, privacy controls, or AI matchmaking? We have answers.
            </p>
          </div>

          <Accordion items={HOME_FAQS} defaultOpenId="faq-1" />
        </ScrollReveal>
      </section>

      {/* ================= FINAL CTA (NO CONTAINER SHADOW WITH ORIGINAL LIGHT BACKGROUND) ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <ScrollReveal direction="up">
          <div className="rounded-3xl relative overflow-hidden min-h-[360px] sm:min-h-[380px] flex items-center justify-end p-6 sm:p-10 border border-amber-200/50 text-left group">

            {/* Background Image (Original Natural Light Cream/Bokeh Background) */}
            <img
              src="/images/cta_couple_bg.jpg?v=2"
              alt="Matrimony Wedding Couple CTA Background"
              className="absolute inset-0 w-full h-full object-cover object-[15%_30%] group-hover:scale-105 transition-transform duration-700"
            />

            {/* Soft Natural Light Backdrop on Right Side for Flawless Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-amber-50/80 md:w-3/5 md:left-auto md:right-0 backdrop-blur-[2px]" />

            {/* Subtle Golden Glow Spotlight */}
            <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[350px] h-[200px] bg-[#8B1E3F]/5 rounded-full blur-3xl pointer-events-none" />

            {/* Overlaid Content (Right Side Aligned with Website Brand Colors) */}
            <div className="relative z-10 max-w-lg space-y-3.5 ml-auto">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 text-[#8B1E3F] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest shadow-sm">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#8B1E3F]" />
                <span>Begin Your Forever Journey</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
                Your Soulmate Is Just <br className="hidden sm:inline" />
                <span className="text-[#8B1E3F]">A Click Away</span>
              </h2>

              <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
                Create your free matrimony profile today and connect with thousands of verified profiles tailored to your values and horoscope expectations.
              </p>

              <div className="pt-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-start">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="px-6 font-bold text-xs h-10 shadow-xl bg-[#8B1E3F] hover:bg-[#721733] text-white uppercase tracking-wider"
                >
                  Register Free Profile Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/search')}
                  className="px-6 font-bold text-xs h-10 border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white bg-white/70 backdrop-blur-md uppercase tracking-wider transition-all"
                >
                  <Search className="h-3.5 w-3.5 mr-1.5" /> Explore Matches
                </Button>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </section>

    </div>
  );
};
