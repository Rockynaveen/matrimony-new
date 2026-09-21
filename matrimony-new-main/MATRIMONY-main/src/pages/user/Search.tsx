import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Search as SearchIcon,
  Filter,
  Sparkles,
  Bookmark,
  ChevronDown,
  ChevronUp,
  MapPin,
  Heart,
  Eye,
  Check,
  Briefcase,
  GraduationCap,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Utensils,
  Ruler,
  ShieldCheck,
  RotateCcw,
  Globe
} from 'lucide-react';

import { useSearchStore } from '../../store/useSearchStore';
import { useIgnoredProfiles } from '../../hooks/useMatching';
import { useShortlistStore } from '../../store/useShortlistStore';
import { searchApi, mapRawToProfile } from '../../api/searchApi';
import { matchingApi } from '../../api/matchingApi';
import { MatchAvatar } from '../../components/ui/MatchAvatar';
import {
  useFilterOptions,
  useRecordRecentlyViewed
} from '../../hooks/useSearchQueries';
import {
  useReligions,
  useCastes,
  useEducations,
  useProfessions,
  useLanguages,
  useIncomeRanges,
  useStates
} from '../../hooks/useProfileOptions';
import type { Profile } from '../../types';
import type { AdvancedSearchParams } from '../../types/searchTypes';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, isAuthenticated } = useApp();
  const resetSearchFilter = useSearchStore((state) => state.resetSearchFilter);

  const shortlistedIds = useShortlistStore((state) => state.shortlistedIds);
  const toggleShortlist = useShortlistStore((state) => state.toggleShortlist);

  const { data: ignoredList } = useIgnoredProfiles();
  const ignoredUserIds = ignoredList?.map(i => i.user_id) || [];

  // ─────────────────────────────────────────────────────────────────
  // 1. Live Dynamic Master Data & Filter Options from Backend APIs
  // ─────────────────────────────────────────────────────────────────
  const { data: filterOptions, isLoading: isLoadingFilterOptions } = useFilterOptions();
  const { data: religionsData = [], isLoading: isLoadingReligions } = useReligions();
  const { data: educationsData = [], isLoading: isLoadingEducations } = useEducations();
  const { data: professionsData = [], isLoading: isLoadingProfessions } = useProfessions();
  const { data: languagesData = [], isLoading: isLoadingLanguages } = useLanguages();
  const { data: incomeRangesData = [], isLoading: isLoadingIncomes } = useIncomeRanges();
  const { data: statesData = [] } = useStates(1);

  const recordViewMutation = useRecordRecentlyViewed();

  // View Mode: 'list' matches design; user can toggle 'grid'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'Latest Online' | 'Most Relevant' | 'Age: Low to High' | 'Age: High to Low'>('Latest Online');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // ─────────────────────────────────────────────────────────────────
  // 2. State for Backend-supported Matrimony Search Fields
  // ─────────────────────────────────────────────────────────────────
  const [lookingFor, setLookingFor] = useState<'Bride' | 'Groom'>('Bride');
  const [quickAgeRange, setQuickAgeRange] = useState<string>('Any');
  const [sidebarAgeMin, setSidebarAgeMin] = useState<number>(18);
  const [sidebarAgeMax, setSidebarAgeMax] = useState<number>(55);
  const [heightMin, setHeightMin] = useState<string>('Any');
  const [heightMax, setHeightMax] = useState<string>('Any');
  const [maritalStatus, setMaritalStatus] = useState<string>('Any');
  const [religion, setReligion] = useState<string>('Any');
  const [caste, setCaste] = useState<string>('Any');
  const [motherTongue, setMotherTongue] = useState<string>('Any');
  const [educationFilter, setEducationFilter] = useState<string>('Any');
  const [professionFilter, setProfessionFilter] = useState<string>('Any');
  const [incomeFilter, setIncomeFilter] = useState<string>('Any');
  const [locationFilter, setLocationFilter] = useState<string>('Any');
  const [dietFilter, setDietFilter] = useState<string>('Any');
  const [manglikFilter, setManglikFilter] = useState<string>('Any');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Accordion Sections Expand/Collapse State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    age: true,
    height: true,
    marital: true,
    religion: true,
    caste: true,
    motherTongue: true,
    education: true,
    profession: true,
    income: true,
    location: true,
    diet: true,
    manglik: true,
    verifiedOnly: true
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─────────────────────────────────────────────────────────────────
  // 3. Dynamically Fetch Castes when Selected Religion Changes
  // ─────────────────────────────────────────────────────────────────
  const selectedReligionObj = useMemo(() => {
    if (!religion || religion === 'Any') return null;
    return religionsData.find(r => r.name.toLowerCase() === religion.toLowerCase()) || null;
  }, [religion, religionsData]);

  const { data: castesData = [], isLoading: isLoadingCastes } = useCastes(selectedReligionObj?.id);

  // Reset caste filter whenever religion changes to prevent invalid criteria
  const handleReligionChange = (newReligion: string) => {
    setReligion(newReligion);
    setCaste('Any');
  };

  // ─────────────────────────────────────────────────────────────────
  // 4. Extract Dynamic Option Lists with Seamless Fallbacks
  // ─────────────────────────────────────────────────────────────────
  const getOptionList = (list?: any[] | Record<string, any>): string[] => {
    if (!list) return [];
    if (Array.isArray(list)) {
      return list.map(item => {
        if (typeof item === 'string') return item;
        return item?.label || item?.name || item?.value || String(item);
      }).filter(Boolean);
    }
    if (typeof list === 'object') {
      return Object.keys(list);
    }
    return [];
  };

  const religionOptions = useMemo(() => {
    const fromApi = getOptionList(filterOptions?.religions);
    const fromMaster = religionsData.map(r => r.name);
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Parsi', 'Jewish'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(r => r.toLowerCase() !== 'any')];
  }, [filterOptions, religionsData]);

  const casteOptions = useMemo(() => {
    const fromMaster = castesData.map(c => c.name);
    let fromApi: string[] = [];
    if (filterOptions?.castes) {
      if (Array.isArray(filterOptions.castes)) {
        fromApi = getOptionList(filterOptions.castes);
      } else if (typeof filterOptions.castes === 'object') {
        if (religion !== 'Any' && (filterOptions.castes as Record<string, string[]>)[religion]) {
          fromApi = (filterOptions.castes as Record<string, string[]>)[religion];
        } else {
          fromApi = Object.values(filterOptions.castes).flat() as string[];
        }
      }
    }
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['Reddy', 'Brahmin', 'Kamma', 'Kapu', 'Arya Vysya', 'Naidu', 'Yadava', 'Mudaliar', 'Gounder', 'Nadar', 'Maratha', 'Rajput', 'Agarwal', 'Kayastha'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(c => c.toLowerCase() !== 'any')];
  }, [filterOptions, castesData, religion]);

  const motherTongueOptions = useMemo(() => {
    const fromApi = getOptionList(filterOptions?.mother_tongues || filterOptions?.languages);
    const fromMaster = languagesData.map(l => l.name);
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi', 'Odia', 'Urdu', 'English'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(l => l.toLowerCase() !== 'any')];
  }, [filterOptions, languagesData]);

  const educationOptions = useMemo(() => {
    const fromApi = getOptionList(filterOptions?.educations);
    const fromMaster = educationsData.map(e => e.name);
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['B.Tech / B.E.', 'M.Tech / M.E.', 'MCA', 'MBA', 'MS / M.Sc', 'MBBS / MD', 'Chartered Accountant (CA)', 'Ph.D', 'B.Com / M.Com', 'B.Sc / BCA', 'Law (LLB / LLM)'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(e => e.toLowerCase() !== 'any')];
  }, [filterOptions, educationsData]);

  const professionOptions = useMemo(() => {
    const fromApi = getOptionList(filterOptions?.professions || filterOptions?.occupations);
    const fromMaster = professionsData.map(p => p.name);
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['Software Professional', 'Data Scientist / Analyst', 'Doctor / Healthcare', 'Chartered Accountant', 'Banking / Finance', 'Business / Entrepreneur', 'Civil Services / Govt', 'Teacher / Professor', 'Manager / Executive'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(p => p.toLowerCase() !== 'any')];
  }, [filterOptions, professionsData]);

  const incomeOptions = useMemo(() => {
    const fromApi = getOptionList(filterOptions?.income_ranges);
    const fromMaster = incomeRangesData.map(i => i.label);
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['₹3 - 5 Lakhs', '₹5 - 10 Lakhs', '₹10 - 15 Lakhs', '₹15 - 25 Lakhs', '₹25 - 50 Lakhs', 'Above ₹50 Lakhs'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(i => i.toLowerCase() !== 'any')];
  }, [filterOptions, incomeRangesData]);

  const locationOptions = useMemo(() => {
    const fromApi = getOptionList(filterOptions?.cities || filterOptions?.states);
    const fromMaster = statesData.map(s => s.name);
    const combined = Array.from(new Set([...fromMaster, ...fromApi])).filter(Boolean);
    const fallback = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Delhi NCR', 'Kerala', 'Gujarat', 'West Bengal'];
    const finalList = combined.length > 0 ? combined : fallback;
    return ['Any', ...finalList.filter(l => l.toLowerCase() !== 'any')];
  }, [filterOptions, statesData]);

  const maritalStatusOptions = ['Any', 'Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'];
  const dietOptions = ['Any', 'Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'];
  const manglikOptions = ['Any', 'Non-Manglik', 'Manglik', 'Anshik Manglik', "Don't Know"];

  const heightOptions = [
    'Any',
    "4'5\"", "4'6\"", "4'7\"", "4'8\"", "4'9\"", "4'10\"", "4'11\"",
    "5'0\"", "5'1\"", "5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\"", "5'8\"", "5'9\"", "5'10\"", "5'11\"",
    "6'0\"", "6'1\"", "6'2\"", "6'3\"", "6'4\"", "6'5\""
  ];

  // Helper parsing utilities
  const parseHeightToFloat = (hStr: string): number | undefined => {
    if (!hStr || hStr === 'Any') return undefined;
    const match = hStr.match(/(\d+)'\s*(\d+)/);
    if (match) return parseFloat(`${match[1]}.${match[2]}`);
    const num = parseFloat(hStr);
    return isNaN(num) ? undefined : num;
  };

  const parseIncomeToNumber = (incStr: string): number | undefined => {
    if (!incStr || incStr === 'Any') return undefined;
    const nums = incStr.match(/(\d+)/g);
    if (nums && nums.length > 0) {
      const first = parseInt(nums[0], 10);
      if (incStr.toLowerCase().includes('lakh')) return first * 100000;
      if (incStr.toLowerCase().includes('crore')) return first * 10000000;
      return first;
    }
    return undefined;
  };

  // ─────────────────────────────────────────────────────────────────
  // 5. Active Filters Count Indicator
  // ─────────────────────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sidebarAgeMin > 18 || sidebarAgeMax < 55) count++;
    if (heightMin !== 'Any' || heightMax !== 'Any') count++;
    if (maritalStatus !== 'Any') count++;
    if (religion !== 'Any') count++;
    if (caste !== 'Any') count++;
    if (motherTongue !== 'Any') count++;
    if (educationFilter !== 'Any') count++;
    if (professionFilter !== 'Any') count++;
    if (incomeFilter !== 'Any') count++;
    if (locationFilter !== 'Any') count++;
    if (dietFilter !== 'Any') count++;
    if (manglikFilter !== 'Any') count++;
    if (verifiedOnly) count++;
    return count;
  }, [
    sidebarAgeMin, sidebarAgeMax, heightMin, heightMax, maritalStatus,
    religion, caste, motherTongue, educationFilter, professionFilter,
    incomeFilter, locationFilter, dietFilter, manglikFilter, verifiedOnly
  ]);

  // ─────────────────────────────────────────────────────────────────
  // 6. Live Backend Search Execution with Intelligent Fallback
  // ─────────────────────────────────────────────────────────────────
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const handleExecuteSearch = useCallback(async (pageOverride?: number, overrides?: any) => {
    setIsSearching(true);
    try {
      const activePage = pageOverride ?? currentPage;
      const targetGender = (overrides?.lookingFor || lookingFor) === 'Bride' ? 'Female' : 'Male';
      const ageMinVal = overrides?.ageMin ?? sidebarAgeMin;
      const ageMaxVal = overrides?.ageMax ?? sidebarAgeMax;
      const relVal = overrides?.religion ?? religion;
      const casteVal = overrides?.caste ?? caste;
      const mtVal = overrides?.motherTongue ?? motherTongue;
      const msVal = overrides?.maritalStatus ?? maritalStatus;
      const eduVal = overrides?.education ?? educationFilter;
      const profVal = overrides?.profession ?? professionFilter;
      const incVal = overrides?.income ?? incomeFilter;
      const locVal = overrides?.location ?? locationFilter;
      const dietVal = overrides?.diet ?? dietFilter;
      const mangVal = overrides?.manglik ?? manglikFilter;
      const verVal = overrides?.verifiedOnly ?? verifiedOnly;

      const payload: AdvancedSearchParams = {
        page: activePage,
        page_size: pageSize,
        gender: targetGender,
        age_min: ageMinVal,
        age_max: ageMaxVal,
        verified_only: verVal ? true : undefined
      };

      if (relVal !== 'Any') payload.religion = relVal;
      if (casteVal !== 'Any') payload.caste = casteVal;
      if (mtVal !== 'Any') payload.mother_tongue = mtVal;
      if (msVal !== 'Any') payload.marital_status = msVal;
      if (eduVal !== 'Any') payload.education = eduVal;
      if (profVal !== 'Any') payload.profession = profVal;
      if (locVal !== 'Any') payload.city = locVal;
      if (dietVal !== 'Any') payload.diet = dietVal;
      if (mangVal !== 'Any') payload.manglik = mangVal;
      if (heightMin !== 'Any') payload.height_min = parseHeightToFloat(heightMin);
      if (heightMax !== 'Any') payload.height_max = parseHeightToFloat(heightMax);
      if (incVal !== 'Any') payload.annual_income_min = parseIncomeToNumber(incVal);

      let results: Profile[] = [];
      let total = 0;

      // 1. Try advanced backend search API
      try {
        const res = await searchApi.advancedSearch(payload);
        if (res && Array.isArray(res.results) && res.results.length > 0) {
          results = res.results;
          total = typeof res.count === 'number' ? res.count : res.results.length;
        }
      } catch {
        // 2. Try basic backend search API
        try {
          const basicRes = await searchApi.basicSearch(payload);
          if (basicRes && Array.isArray(basicRes.results) && basicRes.results.length > 0) {
            results = basicRes.results;
            total = typeof basicRes.count === 'number' ? basicRes.count : basicRes.results.length;
          }
        } catch {}
      }

      // 3. Fallback to live AI recommended profiles or recommendations from backend if specific filters yielded no matches
      if (results.length === 0) {
        try {
          const aiRes = await searchApi.aiRecommendedSearch({ page: activePage, page_size: pageSize });
          if (aiRes && Array.isArray(aiRes.results) && aiRes.results.length > 0) {
            const filtered = aiRes.results.filter(p => !targetGender || !p.gender || p.gender.toLowerCase() === targetGender.toLowerCase());
            if (filtered.length > 0) {
              results = filtered;
              total = filtered.length;
            }
          }
        } catch {
          try {
            const recs = await matchingApi.getRecommendations();
            if (Array.isArray(recs) && recs.length > 0) {
              const mapped = recs.map(mapRawToProfile);
              const filtered = mapped.filter(p => !targetGender || !p.gender || p.gender.toLowerCase() === targetGender.toLowerCase());
              if (filtered.length > 0) {
                results = filtered;
                total = filtered.length;
              }
            }
          } catch {}
        }
      }

      setSearchResults(results);
      setTotalCount(total);
    } catch {
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsSearching(false);
    }
  }, [
    currentPage, pageSize, lookingFor, sidebarAgeMin, sidebarAgeMax,
    religion, caste, motherTongue, maritalStatus, educationFilter,
    professionFilter, incomeFilter, locationFilter, dietFilter,
    manglikFilter, heightMin, heightMax, verifiedOnly
  ]);

  // Execute search on mount
  useEffect(() => {
    handleExecuteSearch(1);
  }, []);

  // Clear All Filters Handler
  const handleClearAll = () => {
    setLookingFor('Bride');
    setQuickAgeRange('Any');
    setSidebarAgeMin(18);
    setSidebarAgeMax(55);
    setHeightMin('Any');
    setHeightMax('Any');
    setMaritalStatus('Any');
    setReligion('Any');
    setCaste('Any');
    setMotherTongue('Any');
    setEducationFilter('Any');
    setProfessionFilter('Any');
    setIncomeFilter('Any');
    setLocationFilter('Any');
    setDietFilter('Any');
    setManglikFilter('Any');
    setVerifiedOnly(false);
    resetSearchFilter();
    setTimeout(() => {
      handleExecuteSearch(1, {
        lookingFor: 'Bride',
        ageMin: 18,
        ageMax: 55,
        religion: 'Any',
        caste: 'Any',
        motherTongue: 'Any',
        maritalStatus: 'Any',
        education: 'Any',
        profession: 'Any',
        income: 'Any',
        location: 'Any',
        diet: 'Any',
        manglik: 'Any',
        verifiedOnly: false
      });
    }, 0);
  };

  // Filter profiles based on current user ignore list and sorting
  const displayedProfiles = useMemo(() => {
    const list = searchResults.filter(p => !ignoredUserIds.includes(Number(p.id)));

    return [...list].sort((a, b) => {
      if (sortBy === 'Latest Online') {
        return (b.online === true ? 1 : 0) - (a.online === true ? 1 : 0);
      }
      if (sortBy === 'Most Relevant') {
        return (b.compatibilityScore || (b as any).matchScore || 0) - (a.compatibilityScore || (a as any).matchScore || 0);
      }
      if (sortBy === 'Age: Low to High') {
        return (a.age || 0) - (b.age || 0);
      }
      if (sortBy === 'Age: High to Low') {
        return (b.age || 0) - (a.age || 0);
      }
      return 0;
    });
  }, [searchResults, ignoredUserIds, sortBy]);

  const totalProfiles = totalCount || displayedProfiles.length;
  const totalPages = Math.max(1, Math.ceil(totalProfiles / pageSize));

  // Navigate & Record view
  const handleViewProfile = (profile: Profile) => {
    recordViewMutation.mutate({ profile_id: profile.id, user_id: profile.id });
    navigate(`/profile/${profile.id}`);
  };

  // Shortlist toggle
  const handleToggleShortlist = (profile: Profile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleShortlist(profile.id);
    const isNow = !shortlistedIds.includes(profile.id);
    showToast(isNow ? `${profile.name} added to your shortlist ✓` : `${profile.name} removed from shortlist`);
  };

  // Safe string helper for location formatting
  const resolveLocationString = (profile: Profile): string => {
    if (typeof profile.city === 'string' && profile.city.trim()) {
      return `${profile.city}${profile.state ? `, ${profile.state}` : ''}`;
    }
    if (typeof profile.location === 'string' && profile.location.trim()) {
      return profile.location.trim();
    }
    if (profile.location && typeof profile.location === 'object') {
      return [profile.location.city, profile.location.state].filter(Boolean).join(', ') || 'India';
    }
    return 'India';
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-stone-900 pb-16">
      
      {/* ─────────────────────────────────────────────────────────────
          1. Hero Header Banner
      ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#FDF6F3] via-[#FAF0EA] to-[#FCEEEA] border-b border-rose-100/60 pt-8 pb-14 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#B81D4F] block">
                FIND YOUR PERFECT MATCH
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
                Search Bride or Groom
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Use dynamic filters aligned with your matrimonial preferences.
              </p>
            </div>

            {/* Right side decorative visual */}
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-2/5 lg:w-1/3 overflow-hidden pointer-events-none">
              <img
                src="/images/matches_header_banner.jpg"
                alt="Wedding Visual"
                className="w-full h-full object-cover object-right opacity-90"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF0EA] via-[#FAF0EA]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF0EA]/40 via-transparent to-transparent" />
              <div className="absolute right-8 top-10 transform rotate-[-6deg]">
                <span className="font-serif italic text-2xl lg:text-3xl font-bold text-[#B81D4F]/90 drop-shadow-xs block leading-tight">
                  Better
                </span>
                <span className="font-serif italic text-2xl lg:text-3xl font-bold text-[#B81D4F]/90 drop-shadow-xs block leading-tight ml-2">
                  Together ♡
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. Floating Quick Search Bar (Synchronized with Backend Fields)
          ────────────────────────────────────────────────────────────── */}
          <div className="mt-8 bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-lg p-2.5 sm:p-3 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-center gap-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200/80">
              
              {/* Segment 1: Looking for (gender) */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-full bg-rose-50 text-[#B81D4F] flex items-center justify-center shrink-0 border border-rose-100">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                    Looking for
                  </span>
                  <div className="relative">
                    <select
                      value={lookingFor}
                      onChange={(e) => {
                        const newLookingFor = e.target.value as 'Bride' | 'Groom';
                        setLookingFor(newLookingFor);
                      }}
                      className="w-full bg-transparent text-xs font-bold text-stone-900 appearance-none pr-5 py-0.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Bride">Bride (Female)</option>
                      <option value="Groom">Groom (Male)</option>
                    </select>
                    <ChevronDown className="absolute right-0 top-1 h-3 w-3 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Segment 2: Age Range (age_min, age_max) */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-full bg-rose-50 text-[#B81D4F] flex items-center justify-center shrink-0 border border-rose-100">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                    Age Range
                  </span>
                  <div className="relative">
                    <select
                      value={quickAgeRange}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickAgeRange(val);
                        if (val === '18 - 25') { setSidebarAgeMin(18); setSidebarAgeMax(25); }
                        else if (val === '21 - 30') { setSidebarAgeMin(21); setSidebarAgeMax(30); }
                        else if (val === '25 - 35') { setSidebarAgeMin(25); setSidebarAgeMax(35); }
                        else if (val === '30 - 45') { setSidebarAgeMin(30); setSidebarAgeMax(45); }
                        else if (val === 'Any') { setSidebarAgeMin(18); setSidebarAgeMax(55); }
                      }}
                      className="w-full bg-transparent text-xs font-bold text-stone-900 appearance-none pr-5 py-0.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Age</option>
                      <option value="18 - 25">18 - 25 Years</option>
                      <option value="21 - 30">21 - 30 Years</option>
                      <option value="25 - 35">25 - 35 Years</option>
                      <option value="30 - 45">30 - 45 Years</option>
                    </select>
                    <ChevronDown className="absolute right-0 top-1 h-3 w-3 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Segment 3: Religion (dynamic from backend) */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-full bg-rose-50 text-[#B81D4F] flex items-center justify-center shrink-0 border border-rose-100">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                    Religion
                  </span>
                  <div className="relative">
                    <select
                      value={religion}
                      onChange={(e) => handleReligionChange(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-stone-900 appearance-none pr-5 py-0.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Any">All Religions</option>
                      {religionOptions.filter(r => r !== 'Any').map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1 h-3 w-3 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Segment 4: Location (city / state) */}
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-full bg-rose-50 text-[#B81D4F] flex items-center justify-center shrink-0 border border-rose-100">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">
                    Location
                  </span>
                  <div className="relative">
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-stone-900 appearance-none pr-5 py-0.5 focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Location</option>
                      {locationOptions.filter(l => l !== 'Any').map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1 h-3 w-3 text-stone-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Segment 5: Search Action Button */}
              <div className="px-2 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleExecuteSearch(1)}
                  disabled={isSearching}
                  className="w-full bg-[#B81D4F] hover:bg-[#9B1842] active:scale-[0.99] text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <SearchIcon className="h-4 w-4 text-white" />
                  )}
                  <span>Search</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. Main Content: 2-Column Layout (Sidebar + Results)
      ────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ─────────────────────────────────────────────────────────
              Left Column: Dynamic Backend Filters Sidebar
          ────────────────────────────────────────────────────────── */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 space-y-5">
              
              {/* Sidebar Header with Active Count & Reset */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#B81D4F]" />
                  <h3 className="font-bold text-sm text-stone-900">Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-50 text-[#B81D4F] rounded-full border border-rose-200">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-[#B81D4F] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* 1. Age Range (age_min, age_max) */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => toggleSection('age')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Age Range</span>
                  </div>
                  {openSections.age ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.age && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="number"
                        min="18"
                        max={sidebarAgeMax}
                        value={sidebarAgeMin}
                        onChange={(e) => setSidebarAgeMin(Math.max(18, Number(e.target.value)))}
                        className="w-14 h-8 text-center text-xs font-bold border border-stone-200 rounded-lg bg-stone-50 text-stone-900 focus:ring-1 focus:ring-[#B81D4F] focus:outline-none"
                      />
                      <div className="flex-1 relative flex items-center">
                        <input
                          type="range"
                          min="18"
                          max="65"
                          value={sidebarAgeMax}
                          onChange={(e) => setSidebarAgeMax(Number(e.target.value))}
                          className="w-full accent-[#B81D4F] cursor-pointer"
                        />
                      </div>
                      <input
                        type="number"
                        min={sidebarAgeMin}
                        max="70"
                        value={sidebarAgeMax}
                        onChange={(e) => setSidebarAgeMax(Math.min(70, Number(e.target.value)))}
                        className="w-14 h-8 text-center text-xs font-bold border border-stone-200 rounded-lg bg-stone-50 text-stone-900 focus:ring-1 focus:ring-[#B81D4F] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Height Range (height_min, height_max) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('height')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Ruler className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Height Range</span>
                  </div>
                  {openSections.height ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.height && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="relative">
                      <select
                        value={heightMin}
                        onChange={(e) => setHeightMin(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                      >
                        <option value="Any">Min Height</option>
                        {heightOptions.filter(h => h !== 'Any').map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-stone-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={heightMax}
                        onChange={(e) => setHeightMax(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                      >
                        <option value="Any">Max Height</option>
                        {heightOptions.filter(h => h !== 'Any').map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Marital Status (marital_status) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('marital')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Marital Status</span>
                  </div>
                  {openSections.marital ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.marital && (
                  <div className="relative pt-1">
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      {maritalStatusOptions.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 4. Religion (religion) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('religion')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Religion</span>
                  </div>
                  {openSections.religion ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.religion && (
                  <div className="relative pt-1">
                    <select
                      value={religion}
                      onChange={(e) => handleReligionChange(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Religion</option>
                      {religionOptions.filter(r => r !== 'Any').map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 5. Caste (caste - dynamic based on religion) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('caste')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Caste / Community</span>
                  </div>
                  {openSections.caste ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.caste && (
                  <div className="relative pt-1">
                    <select
                      value={caste}
                      onChange={(e) => setCaste(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">
                        {isLoadingCastes ? 'Loading Castes...' : 'Any Caste'}
                      </option>
                      {casteOptions.filter(c => c !== 'Any').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 6. Mother Tongue (mother_tongue) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('motherTongue')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Mother Tongue</span>
                  </div>
                  {openSections.motherTongue ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.motherTongue && (
                  <div className="relative pt-1">
                    <select
                      value={motherTongue}
                      onChange={(e) => setMotherTongue(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Mother Tongue</option>
                      {motherTongueOptions.filter(m => m !== 'Any').map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 7. Education (education) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('education')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Education</span>
                  </div>
                  {openSections.education ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.education && (
                  <div className="relative pt-1">
                    <select
                      value={educationFilter}
                      onChange={(e) => setEducationFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Education</option>
                      {educationOptions.filter(e => e !== 'Any').map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 8. Profession (profession / occupation) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('profession')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Profession</span>
                  </div>
                  {openSections.profession ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.profession && (
                  <div className="relative pt-1">
                    <select
                      value={professionFilter}
                      onChange={(e) => setProfessionFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Profession</option>
                      {professionOptions.filter(p => p !== 'Any').map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 9. Annual Income (annual_income_min) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('income')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-rose-50 text-[#B81D4F] border border-rose-200 flex items-center justify-center text-[10px] font-bold">
                      ₹
                    </span>
                    <span>Annual Income</span>
                  </div>
                  {openSections.income ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.income && (
                  <div className="relative pt-1">
                    <select
                      value={incomeFilter}
                      onChange={(e) => setIncomeFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Income</option>
                      {incomeOptions.filter(i => i !== 'Any').map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 10. Location (city / state) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('location')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Location (State / City)</span>
                  </div>
                  {openSections.location ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.location && (
                  <div className="relative pt-1">
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Any">Any Location</option>
                      {locationOptions.filter(l => l !== 'Any').map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 11. Diet (diet) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('diet')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Diet / Food Habit</span>
                  </div>
                  {openSections.diet ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.diet && (
                  <div className="relative pt-1">
                    <select
                      value={dietFilter}
                      onChange={(e) => setDietFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      {dietOptions.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 12. Manglik Status (manglik) */}
              <div className="space-y-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => toggleSection('manglik')}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-900 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#B81D4F]" />
                    <span>Manglik Status</span>
                  </div>
                  {openSections.manglik ? <ChevronUp className="h-3.5 w-3.5 text-stone-400" /> : <ChevronDown className="h-3.5 w-3.5 text-stone-400" />}
                </button>

                {openSections.manglik && (
                  <div className="relative pt-1">
                    <select
                      value={manglikFilter}
                      onChange={(e) => setManglikFilter(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 appearance-none focus:outline-none cursor-pointer"
                    >
                      {manglikOptions.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* 13. Verified Profiles Only (verified_only) */}
              <div className="pt-3 border-t border-stone-100">
                <label className="flex items-center justify-between p-2 rounded-xl bg-stone-50 hover:bg-stone-100/80 transition-colors cursor-pointer border border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-stone-800">Verified Profiles Only</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-[#B81D4F] accent-[#B81D4F] cursor-pointer"
                  />
                </label>
              </div>

              {/* Apply Filters Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteSearch(1)}
                  disabled={isSearching}
                  className="w-full bg-[#B81D4F] hover:bg-[#9B1842] active:scale-[0.99] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <SearchIcon className="h-4 w-4 text-white" />
                  )}
                  <span>Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </button>
              </div>

            </div>
          </aside>

          {/* ─────────────────────────────────────────────────────────
              Right Column: Results Header + Profile Cards List
          ────────────────────────────────────────────────────────── */}
          <section className="lg:col-span-8 xl:col-span-9 space-y-4">
            
            {/* Results Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-transparent pb-1">
              <span className="text-xs sm:text-sm font-semibold text-stone-600">
                Showing {displayedProfiles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalProfiles)} of {totalProfiles} profiles
              </span>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {/* Sort By Dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold bg-white border border-stone-200 px-3 py-1.5 rounded-xl shadow-2xs">
                  <span>Sort by:</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-bold text-stone-900 pr-4 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="Latest Online">Latest Online</option>
                      <option value="Most Relevant">Most Relevant</option>
                      <option value="Age: Low to High">Age: Low to High</option>
                      <option value="Age: High to Low">Age: High to Low</option>
                    </select>
                    <ChevronDown className="absolute right-0 top-0.5 h-3 w-3 text-stone-400 pointer-events-none" />
                  </div>
                </div>

                {/* View Mode Toggle: Grid / List */}
                <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#B81D4F] text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#B81D4F] text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="List View (Default)"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading / Empty / Results States */}
            {isSearching ? (
              <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center space-y-3 shadow-2xs">
                <Loader2 className="h-8 w-8 text-[#B81D4F] animate-spin mx-auto" />
                <h4 className="font-serif text-base font-bold text-stone-900">Searching Profiles</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Fetching live matches from the database...
                </p>
              </div>
            ) : displayedProfiles.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
                <Sparkles className="h-10 w-10 text-stone-300 mx-auto" />
                <h4 className="font-serif text-lg font-bold text-stone-900">No Profiles Found</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  There are no profiles matching your search criteria. Try adjusting the filters.
                </p>
                <Button
                  size="sm"
                  onClick={handleClearAll}
                  className="bg-[#B81D4F] text-white text-xs font-bold mt-2"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : viewMode === 'list' ? (
              /* ─────────────────────────────────────────────────────
                 List View (Horizontal Card Layout)
              ────────────────────────────────────────────────────── */
              <div className="space-y-3.5">
                {displayedProfiles.map((profile) => {
                  const isShortlisted = shortlistedIds.includes(profile.id);
                  const isOnline = profile.online === true || profile.lastActive === 'Online';
                  const locationText = resolveLocationString(profile);
                  const incomeText = profile.annualIncome || (profile as any).income || '';
                  const complexionText = profile.physicalAttributes?.complexion || (profile as any).complexion || '';
                  const maritalStatusText = profile.maritalStatus || (profile as any).marital_status || '';
                  const bioText = profile.about || (profile as any).aboutMe || (profile as any).bio || '';

                  return (
                    <div
                      key={profile.id}
                      className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative group"
                    >
                      {/* Left: Profile Image with Heart & Online Pill */}
                      <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100">
                        <MatchAvatar
                          photo={profile.profileImage || (profile as any).profile_photo || (profile as any).photo}
                          name={profile.name}
                          variant="card"
                          imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top-Right Heart Icon inside Photo */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/30 backdrop-blur-xs text-white hover:bg-black/50 flex items-center justify-center transition-all cursor-pointer z-10"
                          title="Shortlist"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 transition-transform ${
                              isShortlisted ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white'
                            }`}
                          />
                        </button>

                        {/* Top-Left Online / Offline Pill inside Photo */}
                        <div className="absolute top-2 left-2 z-10">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-2xs ${
                              isOnline
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-black/50 text-stone-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isOnline ? 'bg-white animate-pulse' : 'bg-stone-300'
                              }`}
                            />
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Center Info Column */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + Verified Check Badge + Online Status Badge */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3
                              onClick={() => handleViewProfile(profile)}
                              className="font-bold text-base sm:text-lg text-stone-900 hover:text-[#B81D4F] transition-colors cursor-pointer truncate"
                              title={profile.name}
                            >
                              {profile.name}
                            </h3>
                            {profile.verified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold shrink-0">
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          {/* Neat Online / Offline Status Badge */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 transition-all ${
                              isOnline
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                                : 'bg-stone-50 text-stone-500 border-stone-200'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                              }`}
                            />
                            <span>{isOnline ? 'Active Now' : 'Offline'}</span>
                          </div>
                        </div>

                        {/* Sub-row 1: Age | Height | Religion | Caste | Education */}
                        <div className="text-xs text-stone-600 font-medium flex items-center gap-2 flex-wrap">
                          {profile.age ? (
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                              <span>{profile.age} Years</span>
                            </span>
                          ) : null}
                          {profile.height && (
                            <>
                              <span className="text-stone-300">|</span>
                              <span>{profile.height}</span>
                            </>
                          )}
                          {profile.religion && (
                            <>
                              <span className="text-stone-300">|</span>
                              <span>{profile.religion}{profile.caste ? `, ${profile.caste}` : ''}</span>
                            </>
                          )}
                          {profile.education && (
                            <>
                              <span className="text-stone-300">|</span>
                              <span>{profile.education}</span>
                            </>
                          )}
                        </div>

                        {/* Sub-row 2: Profession | Location */}
                        {(profile.profession || locationText) && (
                          <div className="text-xs text-stone-600 font-medium flex items-center gap-2 flex-wrap">
                            {profile.profession && (
                              <span className="flex items-center gap-1.5">
                                <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                <span>{profile.profession}</span>
                              </span>
                            )}
                            {profile.profession && locationText && <span className="text-stone-300">|</span>}
                            {locationText && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                <span>{locationText}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sub-row 3: Tags / Pills */}
                        {(complexionText || maritalStatusText || incomeText) && (
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            {complexionText && (
                              <span className="px-3 py-1 bg-stone-100/90 rounded-full text-xs font-semibold text-stone-700 flex items-center gap-1.5 border border-stone-200/50">
                                <User className="h-3.5 w-3.5 text-stone-400" />
                                <span>{complexionText}</span>
                              </span>
                            )}
                            {maritalStatusText && (
                              <span className="px-3 py-1 bg-stone-100/90 rounded-full text-xs font-semibold text-stone-700 flex items-center gap-1.5 border border-stone-200/50">
                                <Heart className="h-3.5 w-3.5 text-rose-400" />
                                <span>{maritalStatusText}</span>
                              </span>
                            )}
                            {incomeText && (
                              <span className="px-3 py-1 bg-stone-100/90 rounded-full text-xs font-semibold text-stone-700 flex items-center gap-1.5 border border-stone-200/50">
                                <span className="h-4 w-4 rounded-full bg-rose-50 text-[#B81D4F] border border-rose-200 flex items-center justify-center text-[10px] font-bold">
                                  ₹
                                </span>
                                <span>{incomeText}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Sub-row 4: Bio / About */}
                        {bioText ? (
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed pt-0.5">
                            {bioText}
                          </p>
                        ) : null}
                      </div>

                      {/* Right Action Column */}
                      <div className="flex flex-col items-end justify-between gap-4 shrink-0 w-full md:w-auto self-stretch md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                        {/* Bookmark Ribbon Icon */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="hidden md:block text-stone-400 hover:text-[#B81D4F] p-1 rounded-lg transition-colors cursor-pointer"
                          title="Bookmark"
                        >
                          <Bookmark className={`h-4 w-4 ${isShortlisted ? 'fill-[#B81D4F] text-[#B81D4F]' : ''}`} />
                        </button>

                        {/* Stacked Action Buttons */}
                        <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-36">
                          <button
                            type="button"
                            onClick={() => handleViewProfile(profile)}
                            className="flex-1 md:w-full bg-[#B81D4F] hover:bg-[#9B1842] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleShortlist(profile, e)}
                            className={`flex-1 md:w-full border text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isShortlisted
                                ? 'border-[#B81D4F] bg-rose-50 text-[#B81D4F]'
                                : 'border-rose-200 text-[#B81D4F] hover:bg-rose-50/70'
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${isShortlisted ? 'fill-current' : ''}`} />
                            <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* ─────────────────────────────────────────────────────
                 Grid View (Alternative Grid Cards Layout)
              ────────────────────────────────────────────────────── */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {displayedProfiles.map((profile) => {
                  const isShortlisted = shortlistedIds.includes(profile.id);
                  const isOnline = profile.online === true || profile.lastActive === 'Online';
                  const locationText = resolveLocationString(profile);

                  return (
                    <div
                      key={profile.id}
                      className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-4/3 bg-stone-100">
                        <MatchAvatar
                          photo={profile.profileImage || (profile as any).profile_photo || (profile as any).photo}
                          name={profile.name}
                          variant="card"
                          imgClassName="w-full h-full object-cover object-top"
                        />
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/40 backdrop-blur-xs text-white flex items-center justify-center cursor-pointer z-10"
                        >
                          <Heart className={`h-4 w-4 ${isShortlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                        {/* Top-Left Online Presence Pill */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-2xs ${
                              isOnline
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-black/50 text-stone-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isOnline ? 'bg-white animate-pulse' : 'bg-stone-300'
                              }`}
                            />
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          {/* Name + Verified + Online Status Badge Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4
                                onClick={() => handleViewProfile(profile)}
                                className="font-bold text-base text-stone-900 hover:text-[#B81D4F] transition-colors cursor-pointer truncate"
                                title={profile.name}
                              >
                                {profile.name}
                              </h4>
                              {profile.verified && (
                                <div className="h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0" title="Verified Member">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            {/* Online Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                isOnline
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-stone-50 text-stone-500 border-stone-200'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                              <span>{isOnline ? 'Online' : 'Offline'}</span>
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1">
                            {[
                              profile.age ? `${profile.age} Yrs` : null,
                              profile.height,
                              profile.religion
                            ].filter(Boolean).join(' • ')}
                          </p>
                          <p className="text-xs text-stone-600 font-medium truncate mt-0.5">
                            {[
                              profile.profession,
                              locationText
                            ].filter(Boolean).join(' • ')}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                          <button
                            type="button"
                            onClick={() => handleViewProfile(profile)}
                            className="bg-[#B81D4F] text-white text-xs font-bold py-2 rounded-xl"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleShortlist(profile, e)}
                            className="border border-rose-200 text-[#B81D4F] text-xs font-bold py-2 rounded-xl"
                          >
                            Shortlist
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────
                Pagination Controls
            ────────────────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-8 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, currentPage - 1);
                    setCurrentPage(next);
                    handleExecuteSearch(next);
                  }}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => {
                      setCurrentPage(page);
                      handleExecuteSearch(page);
                    }}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#B81D4F] text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(next);
                    handleExecuteSearch(next);
                  }}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </section>

        </div>
      </main>

    </div>
  );
};
