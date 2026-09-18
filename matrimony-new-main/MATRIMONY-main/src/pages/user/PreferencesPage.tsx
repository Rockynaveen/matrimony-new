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

import {
  UserCheck,
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
  ArrowRight
} from 'lucide-react';

// Reusable Required Toggle Component using Shadcn Switch & Badge
interface RequiredToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}

const RequiredToggle: React.FC<RequiredToggleProps> = ({ checked, onChange, label = 'Required' }) => (
  <div className="flex items-center gap-2 select-none">
    <span className="text-xs font-semibold text-slate-700">{label}</span>
    <Switch checked={checked} onCheckedChange={onChange} />
    {checked ? (
      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-bold bg-[#C44569]/10 text-[#C44569] border-[#C44569]/20">
        Strict
      </Badge>
    ) : (
      <span className="text-[10px] text-muted-foreground font-medium">Optional</span>
    )}
  </div>
);

// Reusable Searchable Multi-Select Component using Shadcn UI standards
interface SearchableMultiSelectProps {
  label: string;
  placeholder: string;
  items: { id: number; name: string; extra?: string }[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  isRequired?: boolean;
  onRequiredChange?: (val: boolean) => void;
  levelBadge?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  label,
  placeholder,
  items,
  selectedIds,
  onChange,
  isRequired,
  onRequiredChange,
  levelBadge,
  disabled = false,
  disabledPlaceholder
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      item => item.name.toLowerCase().includes(lower) || (item.extra && item.extra.toLowerCase().includes(lower))
    );
  }, [items, query]);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const toggleItem = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(itemId => itemId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(itemId => itemId !== id));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-bold text-foreground">{label}</Label>
          {levelBadge && (
            <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold bg-muted/30">
              {levelBadge}
            </Badge>
          )}
        </div>
        {onRequiredChange !== undefined && (
          <RequiredToggle checked={Boolean(isRequired)} onChange={onRequiredChange} />
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-muted/30 border border-border/60">
          {selectedItems.map(item => (
            <Badge
              key={item.id}
              variant="outline"
              className="pl-2.5 pr-1 py-1 bg-background text-foreground border-border flex items-center gap-1 text-xs shadow-2xs"
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={e => removeItem(item.id, e)}
                className="h-3.5 w-3.5 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline self-center px-1.5 cursor-pointer ml-auto"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search & Trigger Box */}
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(prev => !prev)}
          className={`flex items-center gap-2 w-full px-3 py-2 text-xs rounded-xl border bg-background transition-all cursor-pointer ${
            disabled
              ? 'opacity-60 bg-muted/40 border-border cursor-not-allowed'
              : isOpen
              ? 'border-[#C44569] ring-2 ring-[#C44569]/20'
              : 'border-input hover:border-slate-400'
          }`}
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            disabled={disabled}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onClick={e => e.stopPropagation()}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={disabled ? disabledPlaceholder || placeholder : placeholder}
            className="w-full bg-transparent text-xs text-foreground focus:outline-none placeholder:text-muted-foreground"
          />
          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {/* Dropdown Options */}
        {isOpen && !disabled && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-popover border border-border rounded-xl shadow-lg p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95">
            {filteredItems.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                {items.length === 0 ? 'No options available' : 'No matches found'}
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors text-left cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 text-[#C44569] font-bold'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>
                      {item.name}
                      {item.extra && <span className="text-[11px] text-muted-foreground font-normal ml-1.5">({item.extra})</span>}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-[#C44569] stroke-[2.5]" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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

  // Dynamic Master Queries
  const { data: incomeRanges = [], isLoading: isLoadingIncomes } = useIncomeRanges();
  const { data: educations = [] } = useEducations();
  const { data: professions = [] } = useProfessions();
  const { data: religions = [] } = useReligions();
  const { data: languagesList = [] } = useLanguages();
  const { data: countries = [] } = useCountries();

  // Location Hierarchy Queries
  const selectedCountryId = formData.country_ids.length > 0 ? formData.country_ids[0] : null;
  const { data: states = [] } = useStates(selectedCountryId);

  const selectedStateId = formData.state_ids.length > 0 ? formData.state_ids[0] : null;
  const { data: districts = [] } = useDistricts(selectedStateId);

  const selectedDistrictId = formData.district_ids.length > 0 ? formData.district_ids[0] : null;
  const { data: mandals = [] } = useMandals(selectedDistrictId);

  const selectedMandalId = formData.mandal_ids.length > 0 ? formData.mandal_ids[0] : null;
  const { data: villages = [] } = useVillages(selectedMandalId);

  // Castes Query
  const selectedReligionId = formData.religion_ids.length > 0 ? formData.religion_ids[0] : null;
  const { data: castes = [] } = useCastes(selectedReligionId);

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
        navigate('/matches');
      }
    } catch (err: any) {
      console.error('Failed to save partner preferences:', err);
      // Fallback save to draft
      localStorage.setItem('partner_preferences_draft', JSON.stringify(formData));
      showToast(err.message || 'Preferences saved locally', 'info');
      markPreferencesCompleted();
      if (redirectUrl) navigate(redirectUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="h-8 w-8 text-[#C44569] animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-border/70 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="bg-[#C44569]/10 text-[#C44569] border-[#C44569]/20 font-bold px-2.5 py-0.5 text-xs">
                  Step 2 of 2
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground">Matchmaking Setup</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-serif">
                Partner Preferences
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Customize your ideal match criteria across demographics, lifestyle, horoscope, and location.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(redirectUrl || '/matches')}
                className="text-xs"
              >
                Skip for now
              </Button>
            </div>
          </div>
        </div>

        {/* The Preferences Form */}
        <form onSubmit={handleSavePreferences} className="space-y-6">

          {/* ============================================================== */}
          {/* 1. Basic Preferences                                           */}
          {/* ============================================================== */}
          <Card className="border-border/80 shadow-xs hover:border-[#C44569]/30 transition-all">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground font-sans">
                    1. Basic Preferences
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Age range, height range, and annual income criteria
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Age Range & Required */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Preferred Age</Label>
                  <RequiredToggle
                    checked={formData.is_age_required}
                    onChange={val => handleChange('is_age_required', val)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Preferred Age (Min)</Label>
                    <Input
                      type="number"
                      min={18}
                      max={80}
                      value={formData.minimum_age}
                      onChange={e => handleChange('minimum_age', Number(e.target.value))}
                      placeholder="18"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Preferred Age (Max)</Label>
                    <Input
                      type="number"
                      min={18}
                      max={80}
                      value={formData.maximum_age}
                      onChange={e => handleChange('maximum_age', Number(e.target.value))}
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Height Range & Required */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Preferred Height (cm)</Label>
                  <RequiredToggle
                    checked={formData.is_height_required}
                    onChange={val => handleChange('is_height_required', val)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Preferred Height (Min cm)</Label>
                    <Input
                      type="number"
                      value={formData.minimum_height}
                      onChange={e => handleChange('minimum_height', e.target.value ? Number(e.target.value) : '')}
                      placeholder="Min cm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Preferred Height (Max cm)</Label>
                    <Input
                      type="number"
                      value={formData.maximum_height}
                      onChange={e => handleChange('maximum_height', e.target.value ? Number(e.target.value) : '')}
                      placeholder="Max cm"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Annual Income Brackets & Required */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Preferred Annual Income Brackets</Label>
                  <RequiredToggle
                    checked={formData.is_income_required}
                    onChange={val => handleChange('is_income_required', val)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                  {isLoadingIncomes ? (
                    <p className="text-xs text-muted-foreground">Loading income brackets...</p>
                  ) : (
                    incomeRanges.map(inc => {
                      const isSelected = formData.income_range_ids.includes(inc.id);
                      return (
                        <button
                          key={inc.id}
                          type="button"
                          onClick={() => toggleIncomeRangeId(inc.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#C44569] text-white shadow-2xs'
                              : 'bg-background text-foreground border border-border hover:border-rose-300 hover:bg-rose-50/50'
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          {inc.label}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* 2. Education & Profession                                      */}
          {/* ============================================================== */}
          <Card className="border-border/80 shadow-xs hover:border-[#C44569]/30 transition-all">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground font-sans">
                    2. Education & Profession
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Educational background and career qualifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Preferred Educations */}
              <SearchableMultiSelect
                label="Preferred Educations"
                placeholder="Search and select educations..."
                items={educations.map(e => ({ id: e.id, name: e.name, extra: e.degree_level }))}
                selectedIds={formData.education_ids}
                onChange={ids => handleChange('education_ids', ids)}
                isRequired={formData.is_education_required}
                onRequiredChange={val => handleChange('is_education_required', val)}
              />

              <Separator className="bg-border/60" />

              {/* Preferred Professions */}
              <SearchableMultiSelect
                label="Preferred Professions"
                placeholder="Search and select professions..."
                items={professions.map(p => ({ id: p.id, name: p.name, extra: p.category }))}
                selectedIds={formData.profession_ids}
                onChange={ids => handleChange('profession_ids', ids)}
                isRequired={formData.is_profession_required}
                onRequiredChange={val => handleChange('is_profession_required', val)}
              />
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* 3. Religion & Caste                                            */}
          {/* ============================================================== */}
          <Card className="border-border/80 shadow-xs hover:border-[#C44569]/30 transition-all">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground font-sans">
                    3. Religion & Caste
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Community and religious background criteria
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Preferred Religions */}
              <SearchableMultiSelect
                label="Preferred Religions"
                placeholder="Search and select religions..."
                items={religions.map(r => ({ id: r.id, name: r.name }))}
                selectedIds={formData.religion_ids}
                onChange={ids => {
                  handleChange('religion_ids', ids);
                  handleChange('caste_ids', []); // reset downstream castes
                }}
                isRequired={formData.is_religion_required}
                onRequiredChange={val => handleChange('is_religion_required', val)}
              />

              <Separator className="bg-border/60" />

              {/* Preferred Castes */}
              <SearchableMultiSelect
                label="Preferred Castes"
                placeholder="Search and select castes..."
                items={castes.map(c => ({ id: c.id, name: c.name }))}
                selectedIds={formData.caste_ids}
                onChange={ids => handleChange('caste_ids', ids)}
                isRequired={formData.is_caste_required}
                onRequiredChange={val => handleChange('is_caste_required', val)}
                disabled={formData.religion_ids.length === 0}
                disabledPlaceholder="Select religion first to load castes..."
              />
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* 4. Lifestyle & Languages                                       */}
          {/* ============================================================== */}
          <Card className="border-border/80 shadow-xs hover:border-[#C44569]/30 transition-all">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Heart className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground font-sans">
                      4. Lifestyle & Languages
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Manage diet, smoking, drinking habits and language preferences.
                    </CardDescription>
                  </div>
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
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Preferred Diets */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Preferred Diets</Label>
                <div className="flex flex-wrap gap-2">
                  {['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain'].map(diet => {
                    const isSelected = formData.preferred_diets.includes(diet);
                    return (
                      <button
                        key={diet}
                        type="button"
                        onClick={() => toggleArrayValue('preferred_diets', diet)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C44569] text-white shadow-2xs'
                            : 'bg-background text-foreground border border-border hover:border-rose-300 hover:bg-rose-50/50'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        {diet}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Preferred Smoking Habits */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Preferred Smoking Habits</Label>
                <div className="flex flex-wrap gap-2">
                  {['No', 'Occasionally', 'Yes'].map(smoke => {
                    const isSelected = formData.preferred_smoking.includes(smoke);
                    return (
                      <button
                        key={smoke}
                        type="button"
                        onClick={() => toggleArrayValue('preferred_smoking', smoke)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C44569] text-white shadow-2xs'
                            : 'bg-background text-foreground border border-border hover:border-rose-300 hover:bg-rose-50/50'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        {smoke}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Preferred Drinking Habits */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">Preferred Drinking Habits</Label>
                <div className="flex flex-wrap gap-2">
                  {['No', 'Occasionally', 'Yes'].map(drink => {
                    const isSelected = formData.preferred_drinking.includes(drink);
                    return (
                      <button
                        key={drink}
                        type="button"
                        onClick={() => toggleArrayValue('preferred_drinking', drink)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C44569] text-white shadow-2xs'
                            : 'bg-background text-foreground border border-border hover:border-rose-300 hover:bg-rose-50/50'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        {drink}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Preferred Languages */}
              <SearchableMultiSelect
                label="Preferred Languages"
                placeholder="Search and select languages..."
                items={languagesList.map(l => ({ id: l.id, name: l.name }))}
                selectedIds={formData.language_ids}
                onChange={ids => handleChange('language_ids', ids)}
              />
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* 5. Marital Status & Horoscope                                  */}
          {/* ============================================================== */}
          <Card className="border-border/80 shadow-xs hover:border-[#C44569]/30 transition-all">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Compass className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground font-sans">
                    5. Marital Status & Horoscope
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Set marital status and astrological compatibility criteria.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Preferred Marital Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Preferred Marital Status</Label>
                  <RequiredToggle
                    checked={formData.is_marital_status_required}
                    onChange={val => handleChange('is_marital_status_required', val)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Never Married', 'Divorced', 'Widowed', 'Separated', 'Awaiting Divorce'].map(status => {
                    const isSelected = formData.preferred_marital_statuses.includes(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleArrayValue('preferred_marital_statuses', status)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C44569] text-white shadow-2xs'
                            : 'bg-background text-foreground border border-border hover:border-rose-300 hover:bg-rose-50/50'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-border/60" />

              {/* Preferred Manglik Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Preferred Manglik Status</Label>
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
            </CardContent>
          </Card>

          {/* ============================================================== */}
          {/* 6. Preferred Locations (Dependent Hierarchy)                   */}
          {/* ============================================================== */}
          <Card className="border-border/80 shadow-xs hover:border-[#C44569]/30 transition-all">
            <CardHeader className="pb-4 border-b border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#C44569] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MapPin className="h-5 w-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground font-sans">
                      6. Preferred Locations (Dependent Hierarchy)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Country → State → District → Mandal → Village. Options load progressively based on selected parents.
                    </CardDescription>
                  </div>
                </div>

                <RequiredToggle
                  checked={formData.is_location_required}
                  onChange={val => handleChange('is_location_required', val)}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Level 1: Preferred Countries */}
              <SearchableMultiSelect
                label="Preferred Countries"
                levelBadge="Level 1"
                placeholder="Select Countries..."
                items={countries.map(c => ({ id: c.id, name: c.name }))}
                selectedIds={formData.country_ids}
                onChange={ids => {
                  handleChange('country_ids', ids);
                  handleChange('state_ids', []);
                  handleChange('district_ids', []);
                  handleChange('mandal_ids', []);
                  handleChange('village_ids', []);
                }}
              />

              <Separator className="bg-border/60" />

              {/* Level 2: Preferred States */}
              <SearchableMultiSelect
                label="Preferred States"
                levelBadge="Level 2"
                placeholder="Select States..."
                items={states.map(s => ({ id: s.id, name: s.name }))}
                selectedIds={formData.state_ids}
                onChange={ids => {
                  handleChange('state_ids', ids);
                  handleChange('district_ids', []);
                  handleChange('mandal_ids', []);
                  handleChange('village_ids', []);
                }}
                disabled={formData.country_ids.length === 0}
                disabledPlaceholder="Select country first to load states..."
              />

              <Separator className="bg-border/60" />

              {/* Level 3: Preferred Districts */}
              <SearchableMultiSelect
                label="Preferred Districts"
                levelBadge="Level 3"
                placeholder="Select Districts..."
                items={districts.map(d => ({ id: d.id, name: d.name }))}
                selectedIds={formData.district_ids}
                onChange={ids => {
                  handleChange('district_ids', ids);
                  handleChange('mandal_ids', []);
                  handleChange('village_ids', []);
                }}
                disabled={formData.state_ids.length === 0}
                disabledPlaceholder="Select state first to load districts..."
              />

              <Separator className="bg-border/60" />

              {/* Level 4: Preferred Mandals / Cities */}
              <SearchableMultiSelect
                label="Preferred Mandals / Cities"
                levelBadge="Level 4"
                placeholder="Select Mandals..."
                items={mandals.map(m => ({ id: m.id, name: m.name }))}
                selectedIds={formData.mandal_ids}
                onChange={ids => {
                  handleChange('mandal_ids', ids);
                  handleChange('village_ids', []);
                }}
                disabled={formData.district_ids.length === 0}
                disabledPlaceholder="Select district first to load mandals/cities..."
              />

              <Separator className="bg-border/60" />

              {/* Level 5: Preferred Villages / Localities */}
              <SearchableMultiSelect
                label="Preferred Villages / Localities"
                levelBadge="Level 5"
                placeholder="Select Villages..."
                items={villages.map(v => ({ id: v.id, name: v.name, extra: v.pincode }))}
                selectedIds={formData.village_ids}
                onChange={ids => handleChange('village_ids', ids)}
                disabled={formData.mandal_ids.length === 0}
                disabledPlaceholder="Select mandal/city first to load villages..."
              />
            </CardContent>
          </Card>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-4 pb-12">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="text-xs"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="px-8 shadow-md hover:shadow-lg text-xs font-bold"
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
