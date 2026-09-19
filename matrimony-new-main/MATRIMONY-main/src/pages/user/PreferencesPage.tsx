import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { partnerPreferencesService } from '../../services/partnerPreferences.service';
import type { PartnerPreferenceAPI } from '../../types/partnerPreferences.types';
import {
  useIncomeRanges,
  useEducations,
  useProfessions,
  useReligions,
  useCastes,
  useLanguages,
  useCountries,
  useStates,
  useDistricts,
  useMandals,
  useVillages
} from '../../hooks/useProfileOptions';

// Shadcn UI Components
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Separator } from '../../components/ui/Separator';
import { Switch } from '../../components/ui/Switch';
import { Checkbox } from '../../components/ui/Checkbox';

import {
  User,
  IdCard,
  GraduationCap,
  Sparkles,
  Heart,
  MapPin,
  Loader2,
  Search,
  X,
  Check,
  Compass,
  ChevronDown,
  ArrowRight,
  Info,
  ShieldCheck
} from 'lucide-react';

import {
  RequiredToggle,
  SearchableMultiSelect,
  StringMultiSelectDropdown
} from '../../components/ui/SearchableMultiSelect';

export const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { showToast, markPreferencesCompleted } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form State adhering strictly to the user's requirements
  const [formData, setFormData] = useState({
    // 1. Basic Preferences
    minimum_age: 18,
    maximum_age: 60,
    is_age_required: false,
    minimum_height: '' as number | string,
    maximum_height: '' as number | string,
    is_height_required: false,
    income_range_ids: [] as number[],
    is_income_required: false,

    // 2. Education & Profession
    education_ids: [] as number[],
    is_education_required: false,
    profession_ids: [] as number[],
    is_profession_required: false,

    // 3. Religion & Caste
    religion_ids: [] as number[],
    is_religion_required: false,
    caste_ids: [] as number[],
    is_caste_required: false,

    // 4. Lifestyle & Languages
    is_diet_required: false,
    is_lifestyle_required: false,
    preferred_diets: [] as string[],
    preferred_smoking: [] as string[],
    preferred_drinking: [] as string[],
    language_ids: [] as number[],

    // 5. Marital Status & Horoscope
    preferred_marital_statuses: [] as string[],
    is_marital_status_required: false,
    preferred_manglik: 'Does Not Matter / Any',
    is_horoscope_required: false,

    // 6. Preferred Locations (Dependent Hierarchy)
    is_location_required: false,
    country_ids: [] as number[],
    state_ids: [] as number[],
    district_ids: [] as number[],
    mandal_ids: [] as number[],
    village_ids: [] as number[]
  });

  // Dynamic Master Queries — strictly using live backend database data
  const { data: incomeRanges = [], isLoading: isLoadingIncomes } = useIncomeRanges();
  const { data: educations = [], isLoading: isLoadingEducations } = useEducations();
  const { data: professions = [], isLoading: isLoadingProfessions } = useProfessions();
  const { data: religions = [], isLoading: isLoadingReligions } = useReligions();
  const { data: languagesList = [], isLoading: isLoadingLanguages } = useLanguages();
  const { data: countries = [], isLoading: isLoadingCountries } = useCountries();

  // Location Hierarchy Queries
  const selectedCountryId = formData.country_ids.length > 0 ? formData.country_ids[0] : null;
  const { data: states = [], isLoading: isLoadingStates } = useStates(selectedCountryId);

  const selectedStateId = formData.state_ids.length > 0 ? formData.state_ids[0] : null;
  const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(selectedStateId);

  const selectedDistrictId = formData.district_ids.length > 0 ? formData.district_ids[0] : null;
  const { data: mandals = [], isLoading: isLoadingMandals } = useMandals(selectedDistrictId);

  const selectedMandalId = formData.mandal_ids.length > 0 ? formData.mandal_ids[0] : null;
  const { data: villages = [], isLoading: isLoadingVillages } = useVillages(selectedMandalId);

  // Castes Query
  const selectedReligionId = formData.religion_ids.length > 0 ? formData.religion_ids[0] : null;
  const { data: castes = [], isLoading: isLoadingCastes } = useCastes(selectedReligionId);

  // Load existing saved preferences from backend API on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);

        // Try local draft first if available
        const savedDraft = localStorage.getItem('partner_preferences_draft');
        if (savedDraft) {
          try {
            setFormData(prev => ({ ...prev, ...JSON.parse(savedDraft) }));
          } catch {}
        }

        // Fetch from backend API
        const apiData = await partnerPreferencesService.getPreferences();
        if (apiData) {
          markPreferencesCompleted();
          setFormData(prev => ({
            ...prev,
            minimum_age: apiData.minimum_age ?? prev.minimum_age,
            maximum_age: apiData.maximum_age ?? prev.maximum_age,
            is_age_required: Boolean(apiData.is_age_required),
            minimum_height: apiData.minimum_height ?? prev.minimum_height,
            maximum_height: apiData.maximum_height ?? prev.maximum_height,
            is_height_required: Boolean(apiData.is_height_required),
            income_range_ids: Array.isArray(apiData.income_range_ids) ? apiData.income_range_ids : prev.income_range_ids,
            is_income_required: Boolean(apiData.is_income_required),

            education_ids: Array.isArray(apiData.education_ids) ? apiData.education_ids : prev.education_ids,
            is_education_required: Boolean(apiData.is_education_required),
            profession_ids: Array.isArray(apiData.profession_ids) ? apiData.profession_ids : prev.profession_ids,
            is_profession_required: Boolean(apiData.is_profession_required),

            religion_ids: Array.isArray(apiData.religion_ids) ? apiData.religion_ids : prev.religion_ids,
            is_religion_required: Boolean(apiData.is_religion_required),
            caste_ids: Array.isArray(apiData.caste_ids) ? apiData.caste_ids : prev.caste_ids,
            is_caste_required: Boolean(apiData.is_caste_required),

            is_diet_required: Boolean(apiData.is_diet_required),
            is_lifestyle_required: Boolean(apiData.is_lifestyle_required),
            preferred_diets: Array.isArray(apiData.preferred_diets) ? apiData.preferred_diets : prev.preferred_diets,
            preferred_smoking: Array.isArray(apiData.preferred_smoking) ? apiData.preferred_smoking : prev.preferred_smoking,
            preferred_drinking: Array.isArray(apiData.preferred_drinking) ? apiData.preferred_drinking : prev.preferred_drinking,
            language_ids: Array.isArray(apiData.language_ids) ? apiData.language_ids : prev.language_ids,

            preferred_marital_statuses: Array.isArray(apiData.preferred_marital_statuses) ? apiData.preferred_marital_statuses : prev.preferred_marital_statuses,
            is_marital_status_required: Boolean(apiData.is_marital_status_required),
            preferred_manglik: apiData.preferred_manglik || prev.preferred_manglik,
            is_horoscope_required: Boolean(apiData.is_horoscope_required),

            is_location_required: Boolean(apiData.is_location_required),
            country_ids: Array.isArray(apiData.country_ids) ? apiData.country_ids : prev.country_ids,
            state_ids: Array.isArray(apiData.state_ids) ? apiData.state_ids : prev.state_ids,
            district_ids: Array.isArray(apiData.district_ids) ? apiData.district_ids : prev.district_ids,
            mandal_ids: Array.isArray(apiData.mandal_ids) ? apiData.mandal_ids : prev.mandal_ids,
            village_ids: Array.isArray(apiData.village_ids) ? apiData.village_ids : prev.village_ids
          }));
        }
      } catch (err) {
        console.warn('Could not load existing partner preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle helpers for string chip arrays
  const toggleArrayValue = (field: 'preferred_diets' | 'preferred_smoking' | 'preferred_drinking' | 'preferred_marital_statuses', val: string) => {
    setFormData(prev => {
      const current = prev[field];
      const next = current.includes(val) ? current.filter(item => item !== val) : [...current, val];
      return { ...prev, [field]: next };
    });
  };

  const toggleIncomeRangeId = (id: number) => {
    setFormData(prev => {
      const current = prev.income_range_ids;
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      return { ...prev, income_range_ids: next };
    });
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const apiPayload: PartnerPreferenceAPI = {
        minimum_age: Number(formData.minimum_age) || 18,
        maximum_age: Number(formData.maximum_age) || 60,
        is_age_required: Boolean(formData.is_age_required),

        minimum_height: Number(formData.minimum_height) || 0,
        maximum_height: Number(formData.maximum_height) || 0,
        is_height_required: Boolean(formData.is_height_required),

        income_range_ids: formData.income_range_ids,
        minimum_salary: 0,
        maximum_salary: 0,
        is_income_required: Boolean(formData.is_income_required),

        education_ids: formData.education_ids,
        is_education_required: Boolean(formData.is_education_required),

        profession_ids: formData.profession_ids,
        is_profession_required: Boolean(formData.is_profession_required),

        religion_ids: formData.religion_ids,
        is_religion_required: Boolean(formData.is_religion_required),

        caste_ids: formData.caste_ids,
        is_caste_required: Boolean(formData.is_caste_required),

        preferred_diets: formData.preferred_diets,
        preferred_smoking: formData.preferred_smoking,
        preferred_drinking: formData.preferred_drinking,
        language_ids: formData.language_ids,
        is_diet_required: Boolean(formData.is_diet_required),
        is_lifestyle_required: Boolean(formData.is_lifestyle_required),

        preferred_marital_statuses: formData.preferred_marital_statuses,
        is_marital_status_required: Boolean(formData.is_marital_status_required),

        preferred_manglik: formData.preferred_manglik,
        is_horoscope_required: Boolean(formData.is_horoscope_required),

        country_ids: formData.country_ids,
        state_ids: formData.state_ids,
        district_ids: formData.district_ids,
        mandal_ids: formData.mandal_ids,
        village_ids: formData.village_ids,
        is_location_required: Boolean(formData.is_location_required)
      };

      await partnerPreferencesService.savePreferences(apiPayload);
      localStorage.removeItem('partner_preferences_draft');
      markPreferencesCompleted();
      showToast('Partner preferences saved successfully!', 'success');

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/verification');
      }
    } catch (err: any) {
      console.error('Failed to save partner preferences:', err);
      // Fallback save to draft
      localStorage.setItem('partner_preferences_draft', JSON.stringify(formData));
      showToast(err.message || 'Preferences saved locally', 'info');
      markPreferencesCompleted();
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/verification');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-8 w-8 text-[#C44569] animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] py-8 px-3 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Informational Callout Banner */}
        <div className="bg-[#e0f7fa] border border-[#b2ebf2] text-slate-800 rounded-2xl p-4 sm:p-4.5 flex items-start gap-3 shadow-2xs">
          <div className="h-5 w-5 rounded-full bg-[#00838f] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
            <Info className="h-3.5 w-3.5 text-white stroke-[2.5]" />
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
            <strong className="font-bold text-slate-900">Partner Preferences</strong> represent what the user is looking for in a partner. They are stored separately and use structured options and required vs preferred toggles for future AI matching.
          </p>
        </div>

        {/* The Preferences Form */}
        <form onSubmit={handleSavePreferences} className="space-y-6">

          {/* ============================================================== */}
          {/* 1. Basic Preferences                                           */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                1. Basic Preferences
              </h2>
            </div>

            {/* Preferred Age (Min) & (Max) with Required Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Preferred Age (Min)
                </label>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={formData.minimum_age}
                  onChange={e => handleChange('minimum_age', e.target.value ? Number(e.target.value) : '')}
                  placeholder="18"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Preferred Age (Max)
                </label>
                <input
                  type="number"
                  min={18}
                  max={80}
                  value={formData.maximum_age}
                  onChange={e => handleChange('maximum_age', e.target.value ? Number(e.target.value) : '')}
                  placeholder="60"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-start md:justify-end pb-2 sm:pb-3">
                <RequiredToggle
                  checked={formData.is_age_required}
                  onChange={val => handleChange('is_age_required', val)}
                />
              </div>
            </div>

            {/* Preferred Height (Min cm) & (Max cm) with Required Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Preferred Height (Min cm)
                </label>
                <input
                  type="number"
                  value={formData.minimum_height}
                  onChange={e => handleChange('minimum_height', e.target.value ? Number(e.target.value) : '')}
                  placeholder="Min cm"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  Preferred Height (Max cm)
                </label>
                <input
                  type="number"
                  value={formData.maximum_height}
                  onChange={e => handleChange('maximum_height', e.target.value ? Number(e.target.value) : '')}
                  placeholder="Max cm"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-start md:justify-end pb-2 sm:pb-3">
                <RequiredToggle
                  checked={formData.is_height_required}
                  onChange={val => handleChange('is_height_required', val)}
                />
              </div>
            </div>

            {/* Preferred Annual Income Brackets with Dropdown & Checkboxes */}
            <div className="pt-1">
              <SearchableMultiSelect
                label="Preferred Annual Income Brackets"
                placeholder={isLoadingIncomes ? "Loading income brackets from backend..." : "Select income brackets..."}
                items={incomeRanges.map(inc => ({ id: inc.id, name: inc.label }))}
                selectedIds={formData.income_range_ids}
                onChange={ids => handleChange('income_range_ids', ids)}
                isRequired={formData.is_income_required}
                onRequiredChange={val => handleChange('is_income_required', val)}
                disabled={isLoadingIncomes}
                disabledPlaceholder="Loading income brackets from backend..."
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. Education & Profession                                      */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                2. Education & Profession
              </h2>
            </div>

            {/* Preferred Educations */}
            <SearchableMultiSelect
              label="Preferred Educations"
              placeholder={isLoadingEducations ? "Loading educations from backend..." : "Search and select educations..."}
              items={educations.map(e => ({ id: e.id, name: e.name, extra: e.degree_level }))}
              selectedIds={formData.education_ids}
              onChange={ids => handleChange('education_ids', ids)}
              isRequired={formData.is_education_required}
              onRequiredChange={val => handleChange('is_education_required', val)}
              disabled={isLoadingEducations}
              disabledPlaceholder="Loading educations from backend..."
            />

            <Separator className="bg-slate-100" />

            {/* Preferred Professions */}
            <SearchableMultiSelect
              label="Preferred Professions"
              placeholder={isLoadingProfessions ? "Loading professions from backend..." : "Search and select professions..."}
              items={professions.map(p => ({ id: p.id, name: p.name, extra: p.category }))}
              selectedIds={formData.profession_ids}
              onChange={ids => handleChange('profession_ids', ids)}
              isRequired={formData.is_profession_required}
              onRequiredChange={val => handleChange('is_profession_required', val)}
              disabled={isLoadingProfessions}
              disabledPlaceholder="Loading professions from backend..."
            />
          </div>

          {/* ============================================================== */}
          {/* 3. Religion & Caste                                            */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                3. Religion & Caste
              </h2>
            </div>

            {/* Preferred Religions */}
            <SearchableMultiSelect
              label="Preferred Religions"
              placeholder={isLoadingReligions ? "Loading religions from backend..." : "Search and select religions..."}
              items={religions.map(r => ({ id: r.id, name: r.name }))}
              selectedIds={formData.religion_ids}
              onChange={ids => {
                handleChange('religion_ids', ids);
                handleChange('caste_ids', []);
              }}
              isRequired={formData.is_religion_required}
              onRequiredChange={val => handleChange('is_religion_required', val)}
              disabled={isLoadingReligions}
              disabledPlaceholder="Loading religions from backend..."
            />

            <Separator className="bg-slate-100" />

            {/* Preferred Castes */}
            <SearchableMultiSelect
              label="Preferred Castes"
              placeholder={isLoadingCastes ? "Loading castes from backend..." : "Search and select castes..."}
              items={castes.map(c => ({ id: c.id, name: c.name }))}
              selectedIds={formData.caste_ids}
              onChange={ids => handleChange('caste_ids', ids)}
              isRequired={formData.is_caste_required}
              onRequiredChange={val => handleChange('is_caste_required', val)}
              disabled={formData.religion_ids.length === 0 || isLoadingCastes}
              disabledPlaceholder={formData.religion_ids.length === 0 ? "Select religion first to load castes..." : "Loading castes from backend..."}
            />
          </div>

          {/* ============================================================== */}
          {/* 4. Lifestyle & Languages                                       */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-blue-600" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  4. Lifestyle & Languages
                </h2>
              </div>

              {/* Requirement toggles */}
              <div className="flex items-center gap-4">
                <RequiredToggle
                  label="Diet Required"
                  checked={formData.is_diet_required}
                  onChange={val => handleChange('is_diet_required', val)}
                />
                <RequiredToggle
                  label="Lifestyle Required"
                  checked={formData.is_lifestyle_required}
                  onChange={val => handleChange('is_lifestyle_required', val)}
                />
              </div>
            </div>

            {/* Preferred Diets with Dropdown & Checkboxes */}
            <StringMultiSelectDropdown
              label="Preferred Diets"
              placeholder="Select preferred diets..."
              options={['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain']}
              selectedValues={formData.preferred_diets}
              onChange={vals => handleChange('preferred_diets', vals)}
            />

            <Separator className="bg-slate-100" />

            {/* Preferred Smoking Habits with Dropdown & Checkboxes */}
            <StringMultiSelectDropdown
              label="Preferred Smoking Habits"
              placeholder="Select smoking preferences..."
              options={['No', 'Occasionally', 'Yes']}
              selectedValues={formData.preferred_smoking}
              onChange={vals => handleChange('preferred_smoking', vals)}
            />

            <Separator className="bg-slate-100" />

            {/* Preferred Drinking Habits with Dropdown & Checkboxes */}
            <StringMultiSelectDropdown
              label="Preferred Drinking Habits"
              placeholder="Select drinking preferences..."
              options={['No', 'Occasionally', 'Yes']}
              selectedValues={formData.preferred_drinking}
              onChange={vals => handleChange('preferred_drinking', vals)}
            />

            <Separator className="bg-slate-100" />

            {/* Preferred Languages */}
            <SearchableMultiSelect
              label="Preferred Languages"
              placeholder={isLoadingLanguages ? "Loading languages from backend..." : "Search and select languages..."}
              items={languagesList.map(l => ({ id: l.id, name: l.name }))}
              selectedIds={formData.language_ids}
              onChange={ids => handleChange('language_ids', ids)}
              disabled={isLoadingLanguages}
              disabledPlaceholder="Loading languages from backend..."
            />
          </div>

          {/* ============================================================== */}
          {/* 5. Marital Status & Horoscope                                  */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                5. Marital Status & Horoscope
              </h2>
            </div>

            {/* Preferred Marital Status with Dropdown & Checkboxes */}
            <StringMultiSelectDropdown
              label="Preferred Marital Status"
              placeholder="Select marital statuses..."
              options={['Never Married', 'Divorced', 'Widowed', 'Separated', 'Awaiting Divorce']}
              selectedValues={formData.preferred_marital_statuses}
              onChange={vals => handleChange('preferred_marital_statuses', vals)}
              isRequired={formData.is_marital_status_required}
              onRequiredChange={val => handleChange('is_marital_status_required', val)}
            />

            <Separator className="bg-slate-100" />

            {/* Preferred Manglik Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">Preferred Manglik Status</label>
                <RequiredToggle
                  checked={formData.is_horoscope_required}
                  onChange={val => handleChange('is_horoscope_required', val)}
                />
              </div>
              <Select
                value={formData.preferred_manglik}
                onChange={e => handleChange('preferred_manglik', e.target.value)}
                options={[
                  { value: 'Does Not Matter / Any', label: 'Does Not Matter / Any' },
                  { value: 'Manglik', label: 'Manglik' },
                  { value: 'Non-Manglik', label: 'Non-Manglik' }
                ]}
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Defines strictness of horoscope/dosha matching filter.
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 6. Preferred Locations (Dependent Hierarchy)                   */}
          {/* ============================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  6. Preferred Locations (Dependent Hierarchy)
                </h2>
              </div>

              <RequiredToggle
                checked={formData.is_location_required}
                onChange={val => handleChange('is_location_required', val)}
              />
            </div>

            {/* Level 1: Preferred Countries */}
            <SearchableMultiSelect
              label="Preferred Countries"
              levelBadge="Level 1"
              placeholder={isLoadingCountries ? "Loading countries from backend..." : "Select Countries..."}
              items={countries.map(c => ({ id: c.id, name: c.name }))}
              selectedIds={formData.country_ids}
              onChange={ids => {
                handleChange('country_ids', ids);
                handleChange('state_ids', []);
                handleChange('district_ids', []);
                handleChange('mandal_ids', []);
                handleChange('village_ids', []);
              }}
              disabled={isLoadingCountries}
              disabledPlaceholder="Loading countries from backend..."
            />

            <Separator className="bg-slate-100" />

            {/* Level 2: Preferred States */}
            <SearchableMultiSelect
              label="Preferred States"
              levelBadge="Level 2"
              placeholder={isLoadingStates ? "Loading states from backend..." : "Select States..."}
              items={states.map(s => ({ id: s.id, name: s.name }))}
              selectedIds={formData.state_ids}
              onChange={ids => {
                handleChange('state_ids', ids);
                handleChange('district_ids', []);
                handleChange('mandal_ids', []);
                handleChange('village_ids', []);
              }}
              disabled={formData.country_ids.length === 0 || isLoadingStates}
              disabledPlaceholder={formData.country_ids.length === 0 ? "Select country first to load states..." : "Loading states from backend..."}
            />

            <Separator className="bg-slate-100" />

            {/* Level 3: Preferred Districts */}
            <SearchableMultiSelect
              label="Preferred Districts"
              levelBadge="Level 3"
              placeholder={isLoadingDistricts ? "Loading districts from backend..." : "Select Districts..."}
              items={districts.map(d => ({ id: d.id, name: d.name }))}
              selectedIds={formData.district_ids}
              onChange={ids => {
                handleChange('district_ids', ids);
                handleChange('mandal_ids', []);
                handleChange('village_ids', []);
              }}
              disabled={formData.state_ids.length === 0 || isLoadingDistricts}
              disabledPlaceholder={formData.state_ids.length === 0 ? "Select state first to load districts..." : "Loading districts from backend..."}
            />

            <Separator className="bg-slate-100" />

            {/* Level 4: Preferred Mandals / Cities */}
            <SearchableMultiSelect
              label="Preferred Mandals / Cities"
              levelBadge="Level 4"
              placeholder={isLoadingMandals ? "Loading mandals from backend..." : "Select Mandals..."}
              items={mandals.map(m => ({ id: m.id, name: m.name }))}
              selectedIds={formData.mandal_ids}
              onChange={ids => {
                handleChange('mandal_ids', ids);
                handleChange('village_ids', []);
              }}
              disabled={formData.district_ids.length === 0 || isLoadingMandals}
              disabledPlaceholder={formData.district_ids.length === 0 ? "Select district first to load mandals/cities..." : "Loading mandals from backend..."}
            />

            <Separator className="bg-slate-100" />

            {/* Level 5: Preferred Villages / Localities */}
            <SearchableMultiSelect
              label="Preferred Villages / Localities"
              levelBadge="Level 5"
              placeholder={isLoadingVillages ? "Loading villages from backend..." : "Select Villages..."}
              items={villages.map(v => ({ id: v.id, name: v.name, extra: v.pincode }))}
              selectedIds={formData.village_ids}
              onChange={ids => handleChange('village_ids', ids)}
              disabled={formData.mandal_ids.length === 0 || isLoadingVillages}
              disabledPlaceholder={formData.mandal_ids.length === 0 ? "Select mandal/city first to load villages..." : "Loading villages from backend..."}
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-4 pb-12">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs font-bold px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              Back
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Save Preferences
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
