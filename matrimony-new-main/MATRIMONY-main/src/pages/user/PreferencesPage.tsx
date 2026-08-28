import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { usePreferencesStore } from '../../store/usePreferencesStore';
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
  RotateCcw,
  Heart,
  Trash2,
  LogOut,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import type { PartnerPreference } from '../../types';
import {
  usePartnerPreferences,
  useCreatePartnerPreferences,
  useUpdatePartnerPreferences,
  useDeletePartnerPreferences
} from '../../hooks/usePartnerPreferences';
import type { PartnerPreferenceAPI } from '../../types/partnerPreferences.types';

import { BasicCriteriaSection } from '../../components/preferences/BasicCriteriaSection';
import { ReligionCasteSection } from '../../components/preferences/ReligionCasteSection';
import { LocationProfessionSection } from '../../components/preferences/LocationProfessionSection';
import { LifestyleSection } from '../../components/preferences/LifestyleSection';

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
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed'] as const;
const DIET_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'] as const;
const SMOKING_OPTIONS = ['No', 'Occasionally', 'Yes'] as const;
const DRINKING_OPTIONS = ['No', 'Occasionally', 'Yes'] as const;

function parseHeightToNum(hStr: string): number {
  if (!hStr) return 5.20;
  const direct = parseFloat(hStr);
  if (!isNaN(direct) && direct < 10) return parseFloat(direct.toFixed(2));
  const feetMatch = hStr.match(/(\d+)'/);
  const inchMatch = hStr.match(/(\d+)"/);
  if (feetMatch) {
    const feet = parseInt(feetMatch[1]) || 5;
    const inches = inchMatch ? parseInt(inchMatch[1]) || 0 : 0;
    return parseFloat((feet + inches / 12).toFixed(2));
  }
  return 5.20;
}

function parseSalaryToNum(sStr: string): number {
  if (!sStr) return 0;
  const plain = parseFloat(sStr.replace(/[^0-9.]/g, ''));
  if (!isNaN(plain) && plain > 100000) return plain;
  const match = sStr.match(/(\d+)/);
  if (match) return parseInt(match[1]) * 100000;
  return 0;
}

function toSingleChoice<T extends string>(arr: string[], choices: readonly T[], fallback: T): T {
  for (const v of arr) {
    const match = choices.find(c => c.toLowerCase() === v.toLowerCase());
    if (match) return match;
  }
  return fallback;
}

export const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, markPreferencesCompleted, onboardingStatus, logout } = useApp();
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

  // Form State
  const [prefs, setPrefs] = useState<PartnerPreference>(() => {
    const saved = localStorage.getItem('user_partner_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.manglik && parsed.manglik.includes(';')) {
          parsed.manglik = parsed.manglik.split(';')[0].trim();
        }
        return parsed;
      } catch {
        return INITIAL_PREFERENCES;
      }
    }
    return INITIAL_PREFERENCES;
  });

  useEffect(() => {
    if (apiPreferences) {
      setPrefs(prev => ({
        ...prev,
        ageMin: apiPreferences.minimum_age || prev.ageMin,
        ageMax: apiPreferences.maximum_age || prev.ageMax,
        religions: apiPreferences.religion ? apiPreferences.religion.split(',').map(s => s.trim()) : prev.religions,
        castes: apiPreferences.caste ? apiPreferences.caste.split(',').map(s => s.trim()) : prev.castes,
        educations: apiPreferences.education ? apiPreferences.education.split(',').map(s => s.trim()) : prev.educations,
        professions: apiPreferences.profession ? apiPreferences.profession.split(',').map(s => s.trim()) : prev.professions,
        countries: apiPreferences.country ? apiPreferences.country.split(',').map(s => s.trim()) : prev.countries,
        diet: apiPreferences.diet ? apiPreferences.diet.split(',').map(s => s.trim()) : prev.diet,
        smoking: apiPreferences.smoking ? apiPreferences.smoking.split(',').map(s => s.trim()) : prev.smoking,
        drinking: apiPreferences.drinking ? apiPreferences.drinking.split(',').map(s => s.trim()) : prev.drinking,
        maritalStatuses: apiPreferences.marital_status ? apiPreferences.marital_status.split(',').map(s => s.trim()) : prev.maritalStatuses
      }));
    }
  }, [apiPreferences]);

  useEffect(() => {
    localStorage.setItem('user_partner_preferences', JSON.stringify(prefs));
  }, [prefs]);

  const handleChange = (field: string, value: any) => {
    setPrefs(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiToggle = (key: string, value: string) => {
    setPrefs(prev => {
      const currentList = ((prev as any)[key] as string[]) || [];
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
        diet: toSingleChoice(prefs.diet, DIET_OPTIONS, 'Vegetarian'),
        smoking: toSingleChoice(prefs.smoking || [], SMOKING_OPTIONS, 'No'),
        drinking: toSingleChoice(prefs.drinking || [], DRINKING_OPTIONS, 'No'),
        marital_status: toSingleChoice(prefs.maritalStatuses || [], MARITAL_OPTIONS, 'Never Married'),
        horoscope_preferences: prefs.manglik || ''
      };

      if (apiPreferences) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      showToast('Partner preferences saved successfully! ✨ Proceeding to Member Verification...');
      markPreferencesCompleted();
      refetch();
      setTimeout(() => navigate('/verification'), 800);
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
        showToast('Partner preferences deleted successfully.');
        refetch();
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete partner preferences');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleReset = () => {
    setPrefs(INITIAL_PREFERENCES);
    localStorage.removeItem('user_partner_preferences');
    showToast('Preferences reset to default values.');
  };

  const handleLogoutAndResumeLater = () => {
    usePreferencesStore.getState().setPreferences(prefs as any);
    logout();
    showToast('Preferences progress saved! You can log in anytime to resume.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-rose-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-rose-100 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="gold">Onboarding Step 3 of 4</Badge>
              <Badge variant="outline">Partner Preferences</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-600 fill-current" />
              Partner Preferences
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define your ideal partner criteria to receive precise match recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-gray-600 border-rose-200 hover:bg-rose-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAndResumeLater}
              className="text-gray-600 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4 mr-1" /> Save & Pause
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1.5 bg-rose-50/60 rounded-2xl border border-rose-100">
          {stepsConfig.map((step) => {
            const Icon = step.icon;
            const isActive = activeTab === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-rose-100/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Section View */}
        <form onSubmit={handleSavePreferences} className="space-y-6">
          {activeTab === 'basic' && (
            <BasicCriteriaSection
              preferences={prefs}
              onChange={handleChange}
              onMultiToggle={handleMultiToggle}
              heightOptions={HEIGHT_OPTIONS}
              maritalOptions={MARITAL_OPTIONS}
            />
          )}

          {activeTab === 'religion' && (
            <ReligionCasteSection
              preferences={prefs}
              onMultiToggle={handleMultiToggle}
              religionOptions={RELIGION_OPTIONS}
            />
          )}

          {activeTab === 'education' && (
            <LocationProfessionSection
              preferences={prefs}
              onChange={handleChange}
            />
          )}

          {activeTab === 'location' && (
            <LocationProfessionSection
              preferences={prefs}
              onChange={handleChange}
            />
          )}

          {activeTab === 'lifestyle' && (
            <LifestyleSection
              preferences={prefs}
              onMultiToggle={handleMultiToggle}
              dietOptions={DIET_OPTIONS}
              smokingOptions={SMOKING_OPTIONS}
              drinkingOptions={DRINKING_OPTIONS}
            />
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
            <div className="flex items-center gap-2">
              {currentTabIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevTab}
                  className="border-rose-200 text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
              )}

              {currentTabIndex < tabsList.length - 1 && (
                <Button
                  type="button"
                  onClick={handleNextTab}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {apiPreferences && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeletePreferences}
                  disabled={isDeleting}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                  Delete Criteria
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-semibold shadow-md px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save & Continue to Verification
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreferencesPage;
