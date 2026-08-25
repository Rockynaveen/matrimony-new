import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Save,
  Loader2,
  UserCheck,
  GraduationCap,
  Sparkles,
  Coffee,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Compass,
  Heart,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Check,
  Sliders,
  Award,
  Globe,
  Briefcase,
  DollarSign,
  LogOut
} from 'lucide-react';
import type { PartnerPreference } from '../../types';
import {
  usePartnerPreferences,
  useCreatePartnerPreferences,
  useUpdatePartnerPreferences,
  useDeletePartnerPreferences
} from '../../hooks/usePartnerPreferences';
import type { PartnerPreferenceAPI } from '../../types/partnerPreferences.types';

const INITIAL_PREFERENCES: PartnerPreference = {
  ageMin: 22,
  ageMax: 30,
  heightMin: "5' 2\"",
  heightMax: "6' 0\"",
  religions: ['Hindu'],
  castes: ['Brahmin', 'Kshatriya', 'Open to All'],
  educations: ['B.Tech / B.E', 'M.Tech', 'MBA', 'MD / MBBS'],
  professions: ['Software Engineer', 'Doctor', 'Product Manager', 'Civil Services'],
  incomeMin: '₹15 Lakhs',
  incomeMax: 'Above ₹50 Lakhs',
  countries: ['India', 'USA', 'UK'],
  states: ['Karnataka', 'Maharashtra', 'Delhi NCR', 'Telangana'],
  cities: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'],
  maritalStatuses: ['Never Married'],
  diet: ['Vegetarian', 'Eggetarian'],
  smoking: ['No'],
  drinking: ['No', 'Occasionally'],
  rashi: ['Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Kanya'],
  nakshatra: ['Rohini', 'Mrigashirsha', 'Uttara Phalguni'],
  dosha: 'No Major Dosha',
  manglik: 'Non-Manglik or Soft Manglik'
};

const HEIGHT_OPTIONS = [
  "4' 6\"", "4' 8\"", "4' 10\"", "5' 0\"", "5' 2\"", "5' 4\"", "5' 6\"",
  "5' 8\"", "5' 10\"", "6' 0\"", "6' 2\"", "6' 4\"", "6' 6\""
];

const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Open to All'];
// Backend choices: only these exact values accepted
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed'] as const;
const DIET_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'] as const;
const SMOKING_OPTIONS = ['No', 'Occasionally', 'Yes'] as const;
const DRINKING_OPTIONS = ['No', 'Occasionally', 'Yes'] as const;
const MANGLIK_OPTIONS = ['Non-Manglik Only', 'Manglik Only', 'Soft Manglik Accepted', 'Doesn\'t Matter'];

// Height: DecimalField(max_digits=4, decimal_places=2) → max 99.99 → stored in FEET as decimal
// e.g. 5' 6" → 5.50, 6' 0" → 6.00
function parseHeightToNum(hStr: string): number {
  if (!hStr) return 5.20;
  // Already a decimal feet value like 5.50
  const direct = parseFloat(hStr);
  if (!isNaN(direct) && direct < 10) return parseFloat(direct.toFixed(2));
  // Feet/inches format: 5' 6"
  const feetMatch = hStr.match(/(\d+)'/);
  const inchMatch = hStr.match(/(\d+)"/);
  if (feetMatch) {
    const feet = parseInt(feetMatch[1]) || 5;
    const inches = inchMatch ? parseInt(inchMatch[1]) || 0 : 0;
    return parseFloat((feet + inches / 12).toFixed(2));
  }
  return 5.20;
}

// Salary: DecimalField(max_digits=12, decimal_places=2) → large decimals fine
// "₹15 Lakhs" → 1500000.00
function parseSalaryToNum(sStr: string): number {
  if (!sStr) return 0;
  // Already a plain number > 100000
  const plain = parseFloat(sStr.replace(/[^0-9.]/g, ''));
  if (!isNaN(plain) && plain > 100000) return plain;
  // "₹15 Lakhs" / "15 Lakhs" → match first number × 100000
  const match = sStr.match(/(\d+)/);
  if (match) return parseInt(match[1]) * 100000;
  return 0;
}

// Map any frontend value to the closest valid Django choice
function toSingleChoice<T extends string>(arr: string[], choices: readonly T[], fallback: T): T {
  for (const v of arr) {
    const match = choices.find(c => c.toLowerCase() === v.toLowerCase());
    if (match) return match;
  }
  return fallback;
}

export const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, markProfileCompleted, markPreferencesCompleted, onboardingStatus, logout } = useApp();
  const [activeTab, setActiveTab] = useState<'basic' | 'religion' | 'education' | 'location' | 'lifestyle'>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (onboardingStatus.registration_method === 'google' && !onboardingStatus.basic_profile_completed) {
      navigate('/complete-basic-profile', { replace: true });
      return;
    }
    if (!onboardingStatus.complete_profile_completed) {
      navigate('/profile/complete', { replace: true });
    }
  }, [navigate, onboardingStatus]);

  const handleLogoutAndResumeLater = () => {
    localStorage.setItem('user_partner_preferences', JSON.stringify(prefs));
    logout();
    showToast('Preferences progress saved! You can log in anytime to resume.');
    navigate('/login');
  };

  // TanStack Query API hooks
  const { data: apiPreferences, refetch } = usePartnerPreferences();
  const createMutation = useCreatePartnerPreferences();
  const updateMutation = useUpdatePartnerPreferences();
  const deleteMutation = useDeletePartnerPreferences();

  const stepsConfig = [
    { id: 'basic', num: 1, title: 'Basic & Physical', desc: 'Age, Height, Marital Status', icon: UserCheck },
    { id: 'religion', num: 2, title: 'Religion & Caste', desc: 'Community & Traditions', icon: Sparkles },
    { id: 'education', num: 3, title: 'Education & Career', desc: 'Degree, Occupation & Salary', icon: GraduationCap },
    { id: 'location', num: 4, title: 'Location', desc: 'Country, State & City', icon: MapPin },
    { id: 'lifestyle', num: 5, title: 'Lifestyle & Astrology', desc: 'Diet, Habits & Horoscope', icon: Coffee },
  ] as const;

  const tabsList: Array<'basic' | 'religion' | 'education' | 'location' | 'lifestyle'> = [
    'basic',
    'religion',
    'education',
    'location',
    'lifestyle'
  ];

  const currentTabIndex = tabsList.indexOf(activeTab);
  const progressPercentage = Math.round(((currentTabIndex + 1) / tabsList.length) * 100);

  const handleNextTab = () => {
    if (currentTabIndex < tabsList.length - 1) {
      setActiveTab(tabsList[currentTabIndex + 1]);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabsList[currentTabIndex - 1]);
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  // Partner Preferences Form State
  const [prefs, setPrefs] = useState<PartnerPreference>(() => {
    const saved = localStorage.getItem('user_partner_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.manglik && parsed.manglik.includes(';')) {
          parsed.manglik = parsed.manglik.split(';')[0].trim();
        }
        return parsed;
      } catch (e) {
        return INITIAL_PREFERENCES;
      }
    }
    return INITIAL_PREFERENCES;
  });

  // Synchronize state when API preferences load
  useEffect(() => {
    if (apiPreferences) {
      let parsedManglik = prefs.manglik;
      let parsedRashi = prefs.rashi;
      let parsedNakshatra = prefs.nakshatra;

      if (apiPreferences.horoscope_preferences) {
        const parts = apiPreferences.horoscope_preferences.split(';').map(s => s.trim());
        if (parts[0]) parsedManglik = parts[0];
        if (parts[1]) parsedRashi = parts[1].split('/').map(s => s.trim()).filter(Boolean);
        if (parts[2]) parsedNakshatra = parts[2].split('/').map(s => s.trim()).filter(Boolean);
      }

      setPrefs(prev => ({
        ...prev,
        ageMin: apiPreferences.minimum_age || prev.ageMin,
        ageMax: apiPreferences.maximum_age || prev.ageMax,
        heightMin: apiPreferences.minimum_height ? `${apiPreferences.minimum_height}` : prev.heightMin,
        heightMax: apiPreferences.maximum_height ? `${apiPreferences.maximum_height}` : prev.heightMax,
        religions: apiPreferences.religion ? apiPreferences.religion.split(',').map(s => s.trim()) : prev.religions,
        castes: apiPreferences.caste ? apiPreferences.caste.split(',').map(s => s.trim()) : prev.castes,
        educations: apiPreferences.education ? apiPreferences.education.split(',').map(s => s.trim()) : prev.educations,
        professions: apiPreferences.profession ? apiPreferences.profession.split(',').map(s => s.trim()) : prev.professions,
        incomeMin: apiPreferences.minimum_salary ? `₹${Math.round(apiPreferences.minimum_salary / 100000)} Lakhs` : prev.incomeMin,
        incomeMax: apiPreferences.maximum_salary ? `Above ₹${Math.round(apiPreferences.maximum_salary / 100000)} Lakhs` : prev.incomeMax,
        countries: apiPreferences.country ? apiPreferences.country.split(',').map(s => s.trim()) : prev.countries,
        states: apiPreferences.state ? apiPreferences.state.split(',').map(s => s.trim()) : prev.states,
        cities: apiPreferences.city ? apiPreferences.city.split(',').map(s => s.trim()) : prev.cities,
        diet: apiPreferences.diet ? apiPreferences.diet.split(',').map(s => s.trim()) : prev.diet,
        smoking: apiPreferences.smoking ? apiPreferences.smoking.split(',').map(s => s.trim()) : prev.smoking,
        drinking: apiPreferences.drinking ? apiPreferences.drinking.split(',').map(s => s.trim()) : prev.drinking,
        maritalStatuses: apiPreferences.marital_status ? apiPreferences.marital_status.split(',').map(s => s.trim()) : prev.maritalStatuses,
        manglik: parsedManglik,
        rashi: parsedRashi,
        nakshatra: parsedNakshatra
      }));
    }
  }, [apiPreferences]);

  useEffect(() => {
    localStorage.setItem('user_partner_preferences', JSON.stringify(prefs));
  }, [prefs]);

  const handleArrayToggle = (key: keyof PartnerPreference, value: string) => {
    setPrefs(prev => {
      const currentList = (prev[key] as string[]) || [];
      const exists = currentList.includes(value);
      const updated = exists
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const cleanManglik = (prefs.manglik || '').split(';')[0].trim();

      // Build exact payload matching Railway DB schema (17 fields, no marital_status)
      const payload: PartnerPreferenceAPI = {
        minimum_age: prefs.ageMin,
        maximum_age: prefs.ageMax,
        minimum_height: parseHeightToNum(prefs.heightMin),
        maximum_height: parseHeightToNum(prefs.heightMax),
        religion: prefs.religions.join(', ') || 'Any',
        caste: prefs.castes.join(', ') || 'Any',
        education: prefs.educations.join(', ') || 'Any',
        profession: prefs.professions.join(', ') || 'Any',
        minimum_salary: parseSalaryToNum(prefs.incomeMin),
        maximum_salary: parseSalaryToNum(prefs.incomeMax),
        country: prefs.countries.join(', ') || 'India',
        state: (prefs.states || []).join(', ') || 'All',
        city: (prefs.cities || []).join(', ') || 'All',
        // Diet: single choice — "Vegetarian" | "Non-Vegetarian" | "Eggetarian" (max 20 chars)
        diet: toSingleChoice(prefs.diet, DIET_OPTIONS, 'Vegetarian'),
        // Smoking: single choice — "Yes" | "No" | "Occasionally" (max 20 chars)
        smoking: toSingleChoice(prefs.smoking || [], SMOKING_OPTIONS, 'No'),
        // Drinking: single choice — "Yes" | "No" | "Occasionally" (max 20 chars)
        drinking: toSingleChoice(prefs.drinking || [], DRINKING_OPTIONS, 'No'),
        // Marital status: single choice — "Never Married" | "Divorced" | "Widowed" (max 20 chars)
        marital_status: toSingleChoice(prefs.maritalStatuses || [], MARITAL_OPTIONS, 'Never Married'),
        horoscope_preferences: [
          cleanManglik,
          (prefs.rashi || []).join('/'),
          (prefs.nakshatra || []).join('/')
        ].filter(Boolean).join('; ') || ''
      };

      // If apiPreferences exists -> PUT update; else -> POST create
      if (apiPreferences) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      showToast('Partner preferences saved successfully! ✨ Redirecting to your matches...');
      localStorage.setItem('user_partner_preferences', JSON.stringify(prefs));
      markPreferencesCompleted();
      refetch();
      // Flow rule: Preferences Saved -> Matching Profiles (/matches)
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');
      setTimeout(() => navigate(redirectUrl || '/matches'), 1000);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save partner preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePreferences = async () => {
    if (window.confirm('Are you sure you want to delete your partner preferences from the server?')) {
      try {
        setIsDeleting(true);
        await deleteMutation.mutateAsync();
        setPrefs(INITIAL_PREFERENCES);
        localStorage.removeItem('user_partner_preferences');
        showToast('Partner preferences deleted via DELETE /api/partner-preferences/!');
        refetch();
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete partner preferences');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleReset = () => {
    const defaultCopy: PartnerPreference = {
      ageMin: 22,
      ageMax: 30,
      heightMin: "5' 2\"",
      heightMax: "6' 0\"",
      religions: ['Hindu'],
      castes: ['Brahmin', 'Kshatriya', 'Open to All'],
      educations: ['B.Tech / B.E', 'M.Tech', 'MBA', 'MD / MBBS'],
      professions: ['Software Engineer', 'Doctor', 'Product Manager', 'Civil Services'],
      incomeMin: '₹15 Lakhs',
      incomeMax: 'Above ₹50 Lakhs',
      countries: ['India', 'USA', 'UK'],
      states: ['Karnataka', 'Maharashtra', 'Delhi NCR', 'Telangana'],
      cities: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad'],
      maritalStatuses: ['Never Married'],
      diet: ['Vegetarian', 'Eggetarian'],
      smoking: ['No'],
      drinking: ['No', 'Occasionally'],
      rashi: ['Mesh', 'Vrishabh', 'Mithun', 'Kark', 'Kanya'],
      nakshatra: ['Rohini', 'Mrigashirsha', 'Uttara Phalguni'],
      dosha: 'No Major Dosha',
      manglik: 'Non-Manglik or Soft Manglik'
    };

    setPrefs({ ...defaultCopy });
    localStorage.setItem('user_partner_preferences', JSON.stringify(defaultCopy));
    setActiveTab('basic');
    showToast('Partner preferences reset to default values! ✨');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dynamic Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5B1028] via-[#8B1E3F] to-[#2C0A15] p-8 text-white shadow-2xl border border-[#D4AF37]/30"
      >
        {/* Glow Spheres */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#C44569]/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gold" className="bg-[#D4AF37] text-stone-950 font-extrabold text-[11px] uppercase tracking-wider px-3 py-0.5">
                <Sliders className="h-3.5 w-3.5 mr-1" /> AI Match Criteria Setup
              </Badge>
              <span className="text-xs text-amber-200 font-semibold flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full border border-amber-300/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Active Matching Engine
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Partner Match Expectations
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 max-w-2xl leading-relaxed">
              Define exact criteria for AI compatibility scoring, daily candidate discovery, and automated horoscope matching algorithms.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleLogoutAndResumeLater}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-white/15 hover:bg-white/25 text-white border border-white/30 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Save & Log Out
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-white/20 hover:bg-white/30 text-white border border-white/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Default
            </button>

            <button
              type="button"
              onClick={handleDeletePreferences}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-rose-500/25 hover:bg-rose-500/40 text-white border border-rose-400/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-rose-300" />}
              Clear Preferences
            </button>
          </div>
        </div>
      </motion.div>

      {/* Visual Stepper & Progress Navigation Bar */}
      <Card className="p-6 bg-white border border-border/80 shadow-md rounded-3xl space-y-5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#8B1E3F] uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-[#D4AF37]" /> Step {currentTabIndex + 1} of 5 — {stepsConfig[currentTabIndex].title}
          </span>
          <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-bold">
            {progressPercentage}% Configured
          </span>
        </div>

        {/* Gradient Progress Bar */}
        <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#8B1E3F] via-[#C44569] to-[#D4AF37] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Stepper Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {stepsConfig.map(s => {
            const Icon = s.icon;
            const isActive = activeTab === s.id;
            const isCompleted = s.num - 1 < currentTabIndex;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(s.id as any)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border text-center group focus:outline-none ${
                  isActive
                    ? 'bg-[#8B1E3F] text-white border-[#8B1E3F] shadow-lg scale-[1.02]'
                    : isCompleted
                    ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70'
                    : 'bg-stone-50/80 text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-[#8B1E3F] shadow-md'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-700 group-hover:bg-stone-300'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold truncate max-w-[120px]">{s.title}</p>
                  <p className={`text-[10px] truncate max-w-[120px] ${isActive ? 'text-amber-200' : 'text-stone-500'}`}>
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="w-full max-w-5xl mx-auto space-y-6">
        <Card className="p-8 border border-border/80 shadow-md rounded-3xl bg-white">
            <form onSubmit={handleSavePreferences} className="space-y-6">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >

                  {/* STEP 1: BASIC & PHYSICAL */}
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-[#8B1E3F]" /> Basic & Physical Expectations
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Set preferred age range, height parameters, and marital status.</p>
                        </div>
                        <Badge variant="gold" className="text-[10px]">Step 1 of 5</Badge>
                      </div>

                      {/* Age Range Slider Box */}
                      <div className="space-y-4 p-5 bg-gradient-to-br from-[#8B1E3F]/5 to-white border border-[#8B1E3F]/20 rounded-2xl shadow-2xs">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <label className="text-stone-900 font-extrabold flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-[#8B1E3F]" /> Preferred Age Window
                          </label>
                          <span className="text-[#8B1E3F] font-extrabold text-sm bg-white border border-[#8B1E3F]/30 px-3.5 py-1 rounded-full shadow-2xs">
                            {prefs.ageMin} - {prefs.ageMax} Years Old
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-stone-600">
                              <span>Minimum Age</span>
                              <span className="font-bold text-[#8B1E3F]">{prefs.ageMin} yrs</span>
                            </div>
                            <input
                              type="range"
                              min="18"
                              max="50"
                              value={prefs.ageMin}
                              onChange={e => setPrefs({ ...prefs, ageMin: parseInt(e.target.value) || 18 })}
                              className="w-full accent-[#8B1E3F] cursor-pointer h-2 bg-stone-200 rounded-lg"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-stone-600">
                              <span>Maximum Age</span>
                              <span className="font-bold text-[#8B1E3F]">{prefs.ageMax} yrs</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="65"
                              value={prefs.ageMax}
                              onChange={e => setPrefs({ ...prefs, ageMax: parseInt(e.target.value) || 20 })}
                              className="w-full accent-[#8B1E3F] cursor-pointer h-2 bg-stone-200 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Height Range Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground block">Minimum Height</label>
                          <select
                            value={prefs.heightMin}
                            onChange={e => setPrefs({ ...prefs, heightMin: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#8B1E3F]/40"
                          >
                            {HEIGHT_OPTIONS.map(h => (
                              <option key={`min-${h}`} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground block">Maximum Height</label>
                          <select
                            value={prefs.heightMax}
                            onChange={e => setPrefs({ ...prefs, heightMax: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-bold text-stone-800 focus:ring-2 focus:ring-[#8B1E3F]/40"
                          >
                            {HEIGHT_OPTIONS.map(h => (
                              <option key={`max-${h}`} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Marital Status Tiles */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground block">Preferred Marital Status</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {MARITAL_OPTIONS.map(m => {
                            const active = (prefs.maritalStatuses || []).includes(m);
                            return (
                              <button
                                type="button"
                                key={m}
                                onClick={() => handleArrayToggle('maritalStatuses', m)}
                                className={`p-3 rounded-2xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                                  active
                                    ? 'bg-[#8B1E3F] text-white border-[#8B1E3F] shadow-sm'
                                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                }`}
                              >
                                <span>{m}</span>
                                {active && <Check className="h-4 w-4 text-amber-300 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: RELIGION & CASTE */}
                  {activeTab === 'religion' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#8B1E3F]" /> Religion & Caste Expectations
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Specify community traditions, religion alignment, and caste choices.</p>
                        </div>
                        <Badge variant="gold" className="text-[10px]">Step 2 of 5</Badge>
                      </div>

                      {/* Religions Multi-select Grid */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground block">Preferred Religion</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {RELIGION_OPTIONS.map(r => {
                            const active = prefs.religions.includes(r);
                            return (
                              <button
                                type="button"
                                key={r}
                                onClick={() => handleArrayToggle('religions', r)}
                                className={`p-3 rounded-2xl text-xs font-extrabold transition-all border text-left flex items-center justify-between ${
                                  active
                                    ? 'bg-[#8B1E3F] text-white border-[#8B1E3F] shadow-md'
                                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                }`}
                              >
                                <span>{r}</span>
                                {active && <Check className="h-4 w-4 text-amber-300 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Preferred Caste */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground block">Preferred Caste</label>
                        <input
                          type="text"
                          placeholder="e.g. Brahmin, Kshatriya, Agarwal, Maratha, Open to All"
                          value={prefs.castes.join(', ')}
                          onChange={e => setPrefs({
                            ...prefs,
                            castes: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#8B1E3F]/40"
                        />
                        <p className="text-[11px] text-muted-foreground">Separate multiple preferred castes with commas, or type 'Open to All'.</p>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: EDUCATION & CAREER */}
                  {activeTab === 'education' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-[#8B1E3F]" /> Education & Career Parameters
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Select required academic background, professional fields, and salary range.</p>
                        </div>
                        <Badge variant="gold" className="text-[10px]">Step 3 of 5</Badge>
                      </div>

                      {/* Education Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-[#8B1E3F]" /> Preferred Degrees
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. B.Tech, M.Tech, MBA, MD, MBBS, CA, MS"
                          value={prefs.educations.join(', ')}
                          onChange={e => setPrefs({
                            ...prefs,
                            educations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#8B1E3F]/40"
                        />
                      </div>

                      {/* Profession Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-[#8B1E3F]" /> Preferred Occupations
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Software Engineer, Doctor, Investment Banker, IAS/Civil Services, Business"
                          value={prefs.professions.join(', ')}
                          onChange={e => setPrefs({
                            ...prefs,
                            professions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#8B1E3F]/40"
                        />
                      </div>

                      {/* Salary Range */}
                      <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-amber-700" />
                          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Annual Income Expectations</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-stone-800 block mb-1">Minimum Salary</label>
                            <select
                              value={prefs.incomeMin}
                              onChange={e => setPrefs({ ...prefs, incomeMin: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-[#8B1E3F]/40"
                            >
                              <option value="No Minimum">No Minimum Requirement</option>
                              <option value="₹5 Lakhs">₹5 Lakhs / yr (500,000)</option>
                              <option value="₹10 Lakhs">₹10 Lakhs / yr (1,000,000)</option>
                              <option value="₹15 Lakhs">₹15 Lakhs / yr (1,500,000)</option>
                              <option value="₹25 Lakhs">₹25 Lakhs / yr (2,500,000)</option>
                              <option value="₹35 Lakhs">₹35 Lakhs / yr (3,500,000)</option>
                              <option value="₹50 Lakhs">₹50+ Lakhs / yr (5,000,000)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-800 block mb-1">Maximum Salary</label>
                            <select
                              value={prefs.incomeMax}
                              onChange={e => setPrefs({ ...prefs, incomeMax: e.target.value })}
                              className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-[#8B1E3F]/40"
                            >
                              <option value="No Upper Cap">No Upper Limit</option>
                              <option value="₹20 Lakhs">Up to ₹20 Lakhs (2,000,000)</option>
                              <option value="₹35 Lakhs">Up to ₹35 Lakhs (3,500,000)</option>
                              <option value="₹50 Lakhs">Up to ₹50 Lakhs (5,000,000)</option>
                              <option value="Above ₹50 Lakhs">Above ₹50 Lakhs / No Limit</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: LOCATION */}
                  {activeTab === 'location' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-[#8B1E3F]" /> Location Preferences
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Filter candidates based on preferred Country, State, and City of residence.</p>
                        </div>
                        <Badge variant="gold" className="text-[10px]">Step 4 of 5</Badge>
                      </div>

                      {/* Country */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Globe className="h-4 w-4 text-[#8B1E3F]" /> Preferred Country(s)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. India, USA, UK, Canada, Australia"
                          value={prefs.countries.join(', ')}
                          onChange={e => setPrefs({
                            ...prefs,
                            countries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#8B1E3F]/40"
                        />
                      </div>

                      {/* State */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground block">Preferred State(s)</label>
                        <input
                          type="text"
                          placeholder="e.g. Karnataka, Maharashtra, Delhi NCR, Telangana, Tamil Nadu"
                          value={(prefs.states || []).join(', ')}
                          onChange={e => setPrefs({
                            ...prefs,
                            states: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#8B1E3F]/40"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground block">Preferred City(s)</label>
                        <input
                          type="text"
                          placeholder="e.g. Bengaluru, Mumbai, Delhi, Hyderabad, Pune, Chennai"
                          value={(prefs.cities || []).join(', ')}
                          onChange={e => setPrefs({
                            ...prefs,
                            cities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#8B1E3F]/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 5: LIFESTYLE & ASTROLOGY */}
                  {activeTab === 'lifestyle' && (
                    <div className="space-y-6">
                      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif text-xl font-extrabold text-[#8B1E3F] flex items-center gap-2">
                            <Coffee className="h-5 w-5 text-[#8B1E3F]" /> Lifestyle & Horoscope Preferences
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Configure diet choices, lifestyle habits, and horoscope match preferences.</p>
                        </div>
                        <Badge variant="gold" className="text-[10px]">Step 5 of 5</Badge>
                      </div>

                      {/* Diet Tiles */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground block">Preferred Diet</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {DIET_OPTIONS.map(d => {
                            const active = prefs.diet.includes(d);
                            return (
                              <button
                                type="button"
                                key={d}
                                onClick={() => handleArrayToggle('diet', d)}
                                className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                                  active
                                    ? 'bg-[#8B1E3F] text-white border-[#8B1E3F] shadow-sm'
                                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                }`}
                              >
                                {active ? '✓ ' : '+ '}{d}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Smoking & Drinking */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-foreground block">Smoking</label>
                          <div className="flex flex-wrap gap-2">
                            {SMOKING_OPTIONS.map(s => {
                              const active = (prefs.smoking || []).includes(s);
                              return (
                                <button
                                  type="button"
                                  key={s}
                                  onClick={() => handleArrayToggle('smoking', s)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    active
                                      ? 'bg-[#8B1E3F] text-white border-[#8B1E3F]'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {active ? '✓ ' : '+ '}{s}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-foreground block">Drinking</label>
                          <div className="flex flex-wrap gap-2">
                            {DRINKING_OPTIONS.map(dr => {
                              const active = (prefs.drinking || []).includes(dr);
                              return (
                                <button
                                  type="button"
                                  key={dr}
                                  onClick={() => handleArrayToggle('drinking', dr)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    active
                                      ? 'bg-[#8B1E3F] text-white border-[#8B1E3F]'
                                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                  }`}
                                >
                                  {active ? '✓ ' : '+ '}{dr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Astrology Card */}
                      <div className="p-5 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/80 border border-amber-300/60 rounded-2xl space-y-4 shadow-sm">
                        <h4 className="font-serif text-sm font-bold text-amber-900 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#D4AF37]" /> Horoscope Preferences
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Preferred Rashi (Moon Sign)</label>
                            <input
                              type="text"
                              placeholder="e.g. Mesh, Vrishabh, Mithun, Kark, Any"
                              value={(prefs.rashi || []).join(', ')}
                              onChange={e => setPrefs({
                                ...prefs,
                                rashi: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              })}
                              className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">Preferred Nakshatra</label>
                            <input
                              type="text"
                              placeholder="e.g. Rohini, Mrigashirsha, Uttara Phalguni, Any"
                              value={(prefs.nakshatra || []).join(', ')}
                              onChange={e => setPrefs({
                                ...prefs,
                                nakshatra: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              })}
                              className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-stone-700 block mb-1">Manglik Requirement</label>
                          <select
                            value={prefs.manglik || 'Soft Manglik Accepted'}
                            onChange={e => setPrefs({ ...prefs, manglik: e.target.value })}
                            className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                          >
                            {MANGLIK_OPTIONS.map(mo => (
                              <option key={mo} value={mo}>{mo}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* Stepper Navigation Buttons & Save Action Bar */}
              <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handlePrevTab}
                    disabled={currentTabIndex === 0}
                    className="text-xs font-bold border-stone-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Previous Step
                  </Button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-stone-700" /> Reset Defaults
                  </button>

                  <span className="text-xs font-bold text-stone-600 hidden md:inline-block ml-1">
                    Step {currentTabIndex + 1} of {tabsList.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {currentTabIndex < tabsList.length - 1 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={handleNextTab}
                      className="bg-[#8B1E3F] hover:bg-[#721733] text-white px-7 font-bold text-xs shadow-md"
                    >
                      Next Step <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-[#8B1E3F] via-[#C44569] to-[#8B1E3F] hover:opacity-95 text-[#FFF9F5] px-8 font-bold text-xs shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Preferences...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Save Partner Preferences ✨
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

            </form>
        </Card>
      </div>
    </div>
  );
};
