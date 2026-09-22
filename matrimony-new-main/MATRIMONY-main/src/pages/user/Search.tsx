import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
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
  const { showToast, isAuthenticated, currentUser } = useApp();
  const resetSearchFilter = useSearchStore((state) => state.resetSearchFilter);

  const shortlistedIds = useShortlistStore((state) => state.shortlistedIds);
  const toggleShortlist = useShortlistStore((state) => state.toggleShortlist);

  const getSearchPhoto = (profile: any) => {
    const isSelf = Boolean(
      (currentUser?.id && String(profile.id || profile.user_id) === String(currentUser.id)) ||
      (currentUser?.name && profile.name && profile.name.toLowerCase() === currentUser.name.toLowerCase())
    );
    if (isSelf) {
      return currentUser?.avatar || localStorage.getItem('logged_in_avatar') || profile.profileImage || (profile as any).profile_photo || (profile as any).avatar || (profile as any).photo;
    }
    return profile.profileImage || (profile as any).profile_photo || (profile as any).avatar || (profile as any).photo;
  };

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
    <div className="min-h-screen bg-[#FAF7F5] text-stone-900 pb-20 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ── 1. Royal Gold Luxury Search Hero Card ── */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-300/50 bg-gradient-to-br from-[#4A3008] via-[#7B5313] via-[#A67520] to-[#C99738] text-white shadow-[0_14px_45px_rgba(180,120,20,0.35)]">
          {/* Radiant Gold Ambient Glow Orbs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-yellow-300/30 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-amber-400/30 blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-yellow-500/25 blur-3xl pointer-events-none" />

          {/* Background Romantic Visual with Crisp Visibility */}
          <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
            <img
              src="/images/matches_romantic_banner.jpg"
              alt=""
              className="w-full h-full object-cover object-right md:object-[center_right] opacity-65 md:opacity-80"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          {/* Transparent Glass & Gold Tinted Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35 backdrop-blur-[1px] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#7B5313]/60 via-[#A67520]/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/15 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-center py-4 px-5 sm:px-8 max-w-4xl space-y-2">
            {/* Shimmering Gold Pill Eyebrow */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-300/25 to-yellow-400/25 border border-amber-200/60 text-amber-100 backdrop-blur-md shadow-xs w-fit">
              <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300/30 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 drop-shadow-xs">
                ADVANCED PROFILE SEARCH
              </span>
            </div>

            {/* Main Headline with Shimmering Gold Accent */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-extrabold tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
              Search{' '}
              <span className="font-serif italic font-extrabold bg-gradient-to-r from-[#FFFBEB] via-[#FDE047] via-[#F59E0B] to-[#FBBF24] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(253,224,71,0.55)]">
                Bride or Groom
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium leading-normal max-w-xl drop-shadow-xs">
              Explore authentic profiles with live multi-criteria filtering across community, location, education, and profession.
            </p>

            {/* Gold Frosted Quality & Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/35 border border-amber-300/40 text-[11px] font-semibold text-amber-100 shadow-sm backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>100% Verified Profiles</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/35 border border-amber-300/40 text-[11px] font-semibold text-amber-100 shadow-sm backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-yellow-300 shrink-0" />
                <span>AI Compatibility Scored</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/35 border border-amber-300/40 text-[11px] font-semibold text-amber-100 shadow-sm backdrop-blur-md">
                <User className="h-3 w-3 text-amber-300 shrink-0" />
                <span>{totalProfiles} Profiles Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Floating Quick Search Bar with Gold Accents ── */}
        <Card className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-center gap-3 divide-y lg:divide-y-0 lg:divide-x divide-stone-200/70">
            
            {/* Segment 1: Looking for (gender) */}
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-[#8B1E3F] flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
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
            <div className="flex items-center gap-3 px-2 py-1 pt-2 sm:pt-1">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-[#8B1E3F] flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
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
            <div className="flex items-center gap-3 px-2 py-1 pt-2 lg:pt-1">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-[#8B1E3F] flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
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
            <div className="flex items-center gap-3 px-2 py-1 pt-2 lg:pt-1">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-[#8B1E3F] flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
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
            <div className="px-1 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => handleExecuteSearch(1)}
                disabled={isSearching}
                className="w-full bg-gradient-to-r from-[#8B1E3F] via-[#A82A4D] to-[#B48128] hover:from-[#731834] hover:to-[#9E6E1F] active:scale-[0.99] text-white font-bold text-xs py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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
        </Card>

        {/* ── 3. Main Two-Column Content: Sidebar Filters + Results ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">

          {/* ── Left Column: Dynamic Backend Filters Sidebar Card ── */}
          <Card className="lg:col-span-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
            
            {/* Sidebar Header with Active Count & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#8B1E3F]" />
                <h3 className="font-bold text-sm text-stone-900">Filter Profiles</h3>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300/80 shadow-2xs">
                    {activeFilterCount} active
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-[#8B1E3F] hover:underline cursor-pointer flex items-center gap-1"
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
                    className="h-4 w-4 rounded text-[#8B1E3F] accent-[#8B1E3F] cursor-pointer"
                  />
                </label>
              </div>

              {/* Apply Filters Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteSearch(1)}
                  disabled={isSearching}
                  className="w-full bg-gradient-to-r from-[#8B1E3F] via-[#A82A4D] to-[#B48128] hover:from-[#731834] hover:to-[#9E6E1F] active:scale-[0.99] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <SearchIcon className="h-4 w-4 text-white" />
                  )}
                  <span>Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </button>
              </div>

          </Card>

          {/* ─────────────────────────────────────────────────────────
              Right Column: Results Header + Profile Cards List
          ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-9 space-y-4">
            
            {/* Top Bar: Count & Sorting Controls */}
            <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
              {/* Title Count */}
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  <span className="text-[#8B1E3F] font-extrabold mr-1.5">
                    {totalProfiles}
                  </span>
                  Profiles Found
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Showing {displayedProfiles.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} - {Math.min(currentPage * pageSize, totalProfiles)} based on your criteria
                </p>
              </div>

              {/* Controls: Sort Dropdown + View Toggle */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                  <span className="hidden sm:inline">Sort by</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-900 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl appearance-none focus:outline-none focus:border-[#8B1E3F]"
                    >
                      <option value="Latest Online">Latest Online</option>
                      <option value="Most Relevant">Most Relevant</option>
                      <option value="Age: Low to High">Age: Low to High</option>
                      <option value="Age: High to Low">Age: High to Low</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-stone-400 pointer-events-none" />
                  </div>
                </div>

                {/* Grid / List Mode Switcher */}
                <div className="flex items-center gap-1 border border-stone-200 p-0.5 rounded-xl bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#8B1E3F] text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#8B1E3F] text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                    title="List View"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>

            {/* Loading / Empty / Results States */}
            {isSearching ? (
              <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center space-y-3 shadow-2xs">
                <Loader2 className="h-8 w-8 text-[#8B1E3F] animate-spin mx-auto" />
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
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-gradient-to-r from-[#8B1E3F] via-[#A82A4D] to-[#B48128] hover:from-[#731834] hover:to-[#9E6E1F] text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs mt-2 cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              /* ── List View (Horizontal Card Layout with Matches Aesthetic) ── */
              <div className="space-y-3.5">
                {displayedProfiles.map((profile) => {
                  const isShortlisted = shortlistedIds.includes(profile.id);
                  const isOnline = profile.online === true || profile.lastActive === 'Online';
                  const locationText = resolveLocationString(profile);
                  const incomeText = profile.annualIncome || (profile as any).income || '';
                  const complexionText = profile.physicalAttributes?.complexion || (profile as any).complexion || '';
                  const maritalStatusText = profile.maritalStatus || (profile as any).marital_status || '';
                  const bioText = profile.about || (profile as any).aboutMe || (profile as any).bio || '';
                  const matchScoreVal = profile.compatibilityScore || (profile as any).matchScore;

                  return (
                    <Card
                      key={profile.id}
                      className="bg-white rounded-2xl border border-stone-200 hover:border-[#8B1E3F]/40 shadow-xs hover:shadow-md transition-all duration-300 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative group overflow-hidden"
                    >
                      {/* Left: Profile Image with Heart & Exact Match Pill */}
                      <div className="relative shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-white border border-stone-100 shadow-2xs">
                        <MatchAvatar
                          photo={getSearchPhoto(profile)}
                          name={profile.name}
                          variant="card"
                          imgClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top-Right Heart Icon inside Photo */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white hover:bg-stone-50 border border-stone-200 shadow-xs flex items-center justify-center transition-all cursor-pointer z-10 active:scale-90"
                          title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 transition-transform ${
                              isShortlisted ? 'fill-rose-500 text-rose-500 scale-110' : 'text-stone-600 stroke-[1.8]'
                            }`}
                          />
                        </button>

                        {/* Top-Left Exact Match Score Pill (if present) or Online Status */}
                        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                          {typeof matchScoreVal === 'number' && matchScoreVal > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-[#8B1E3F] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              <Sparkles className="h-2.5 w-2.5 text-amber-300 fill-amber-300 shrink-0" />
                              <span>{Math.round(matchScoreVal)}%</span>
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-md shadow-2xs ${
                                isOnline
                                  ? 'bg-emerald-600/90 text-white'
                                  : 'bg-black/50 text-stone-200'
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-stone-300'}`} />
                              <span>{isOnline ? 'Online' : 'Offline'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Center Info Column */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + Verified Check Badge + Online Status Badge */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3
                              onClick={() => handleViewProfile(profile)}
                              className="font-bold text-base sm:text-lg text-stone-900 hover:text-[#8B1E3F] transition-colors cursor-pointer truncate"
                              title={profile.name}
                            >
                              {profile.name}
                            </h3>
                            {profile.verified && (
                              <span className="inline-flex items-center gap-1 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                                <ShieldCheck className="h-3 w-3 text-emerald-200" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          {/* Online / Offline Status Badge */}
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition-all ${
                              isOnline
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'
                              }`}
                            />
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                          </div>
                        </div>

                        {/* Age • Height • Religion & Caste • Mother Tongue */}
                        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium flex-wrap">
                          {profile.age && <span>{profile.age} Yrs</span>}
                          {profile.height && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span>{profile.height}</span>
                            </>
                          )}
                          {(profile.religion || (profile as any).caste) && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span>{[profile.religion, (profile as any).caste].filter(Boolean).join(', ')}</span>
                            </>
                          )}
                          {profile.motherTongue && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span>{profile.motherTongue}</span>
                            </>
                          )}
                        </div>

                        {/* Education, Profession, Location Tags */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {profile.education && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-600 truncate bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 rounded-xl">
                              <GraduationCap className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                              <span className="truncate">{profile.education}</span>
                            </div>
                          )}

                          {profile.profession && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-600 truncate bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 rounded-xl">
                              <Briefcase className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                              <span className="truncate">{profile.profession}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-stone-600 truncate bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 rounded-xl">
                            <MapPin className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                            <span className="truncate">{locationText}</span>
                          </div>
                        </div>

                        {/* Bio snippet if available */}
                        {bioText ? (
                          <p className="text-xs text-stone-500 line-clamp-1 italic pt-0.5">
                            {bioText}
                          </p>
                        ) : null}
                      </div>

                      {/* Right Action Column */}
                      <div className="flex flex-row md:flex-col items-center justify-end gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                        <button
                          type="button"
                          onClick={() => handleViewProfile(profile)}
                          className="flex-1 md:flex-none w-full md:w-36 py-2 px-4 bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-[0.99]"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="flex-1 md:flex-none w-full md:w-36 py-2 px-4 border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-xl transition-all shadow-2xs text-center cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Heart className={`h-3.5 w-3.5 ${isShortlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
                          <span>{isShortlisted ? 'Shortlisted' : 'Shortlist'}</span>
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* ─────────────────────────────────────────────────────
                 Grid View (Alternative Grid Cards Layout)
              ────────────────────────────────────────────────────── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedProfiles.map((profile) => {
                  const isShortlisted = shortlistedIds.includes(profile.id);
                  const isOnline = profile.online === true || profile.lastActive === 'Online';
                  const locationText = resolveLocationString(profile);
                  const exactMatchPercentage = (() => {
                    const rawVal =
                      profile.compatibilityScore ??
                      (profile as any).matchScore ??
                      (profile as any).match_percentage;
                    if (rawVal === undefined || rawVal === null || rawVal === '') return null;
                    const num = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
                    if (isNaN(num) || num <= 0) return null;
                    if (num > 0 && num <= 1) return Math.round(num * 100);
                    return Math.round(num);
                  })();

                  return (
                    <Card
                      key={profile.id}
                      className="h-full flex flex-col justify-between bg-white rounded-2xl border border-stone-200 hover:border-[#8B1E3F]/40 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden group p-0 gap-0"
                    >
                      {/* Upper Visual Container: Photo with Badges & Action */}
                      <div
                        onClick={() => handleViewProfile(profile)}
                        className="relative aspect-[4/3.8] w-full overflow-hidden bg-white border-b border-stone-100 cursor-pointer select-none"
                      >
                        <MatchAvatar
                          photo={getSearchPhoto(profile)}
                          name={profile.name}
                          variant="card"
                          imgClassName="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                        />

                        {/* Top-Left: Exact AI Match Percentage (Only if authentic percentage from backend exists) */}
                        {exactMatchPercentage !== null && (
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className="inline-flex items-center gap-1 bg-[#8B1E3F] text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                              <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300 shrink-0" />
                              <span>{exactMatchPercentage}% Match</span>
                            </span>
                          </div>
                        )}

                        {/* Top-Right: Circular White Shortlist Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-white hover:bg-stone-50 shadow-xs flex items-center justify-center text-stone-600 hover:text-rose-500 border border-stone-200 transition-all active:scale-90 cursor-pointer"
                          title={isShortlisted ? 'Remove from Shortlist' : 'Add to Shortlist'}
                        >
                          <Heart
                            className={`h-4 w-4 transition-colors ${
                              isShortlisted
                                ? 'fill-rose-500 text-rose-500 scale-110'
                                : 'text-stone-600 stroke-[1.8]'
                            }`}
                          />
                        </button>

                        {/* Bottom-Left: Verified + Online Badge */}
                        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
                          {profile.verified && (
                            <span className="inline-flex items-center gap-1 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                              <ShieldCheck className="h-3 w-3 text-emerald-200" />
                              <span>Verified</span>
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-2xs ${
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

                      {/* Lower Info Details in Pure White */}
                      <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5 bg-white">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              onClick={() => handleViewProfile(profile)}
                              className="font-bold text-sm text-stone-900 group-hover:text-[#8B1E3F] transition-colors cursor-pointer truncate"
                              title={profile.name}
                            >
                              {profile.name}
                            </h4>
                            {exactMatchPercentage !== null && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#8B1E3F] bg-[#8B1E3F]/10 px-1.5 py-0.2 rounded-md shrink-0">
                                {exactMatchPercentage}%
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-stone-600 font-medium truncate">
                            {[
                              profile.age ? `${profile.age} Yrs` : null,
                              profile.height,
                              profile.religion
                            ].filter(Boolean).join(' • ')}
                          </div>

                          {profile.profession && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium truncate">
                              <Briefcase className="h-3.5 w-3.5 text-[#8B1E3F] shrink-0" />
                              <span className="truncate">{profile.profession}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium truncate">
                            <MapPin className="h-3.5 w-3.5 text-[#B48128] shrink-0" />
                            <span className="truncate">{locationText}</span>
                          </div>
                        </div>
                      </CardContent>

                      {/* Action Buttons: View Profile & Shortlist */}
                      <CardFooter className="p-3.5 pt-0 grid grid-cols-2 gap-2 bg-white">
                        <button
                          type="button"
                          onClick={() => handleViewProfile(profile)}
                          className="py-2 bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold rounded-xl transition-all shadow-xs text-center cursor-pointer active:scale-[0.99]"
                        >
                          View Profile
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleShortlist(profile, e)}
                          className="py-2 border border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-xl transition-all shadow-2xs text-center cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Heart className={`h-3.5 w-3.5 ${isShortlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-500'}`} />
                          <span>{isShortlisted ? 'Saved' : 'Shortlist'}</span>
                        </button>
                      </CardFooter>
                    </Card>
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
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:text-stone-900 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
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
                        ? 'bg-gradient-to-r from-[#8B1E3F] to-[#B83358] text-white shadow-xs border border-[#8B1E3F]'
                        : 'bg-white border border-stone-200 text-stone-700 hover:border-amber-300 hover:bg-amber-50/30'
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
                  className="h-8 w-8 rounded-lg border border-stone-200 bg-white text-stone-600 hover:border-amber-300 hover:text-stone-900 disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
};
