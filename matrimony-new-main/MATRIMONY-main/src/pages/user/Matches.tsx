import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  useRecommendations,
  useShortlist,
  useSentInterests,
  useReceivedInterests,
  useIgnoredProfiles
} from '../../hooks/useMatching';
import { RecommendationCard } from '../../components/matching/RecommendationCard';
import {
  Filter,
  Search,
  MapPin,
  ChevronDown,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Button } from '../../components/ui/Button';
import type { MatchResponseSchema } from '../../types/matching.types';

export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  // Determine user's looking-for default
  const userGender = (currentUser?.gender || localStorage.getItem('logged_in_gender') || '').toLowerCase();
  const defaultLookingFor = (userGender === 'female' || userGender === 'f') ? 'Groom' : 'Bride';

  // Filter States
  const [lookingFor, setLookingFor] = useState<'Bride' | 'Groom'>(defaultLookingFor);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [heightFilter, setHeightFilter] = useState<string>('Any');
  const [maritalStatus, setMaritalStatus] = useState<string>('Any');
  const [religion, setReligion] = useState<string>('Any');
  const [caste, setCaste] = useState<string>('Any');
  const [education, setEducation] = useState<string>('Any');
  const [locationQuery, setLocationQuery] = useState<string>('');

  // Search & Sorting States
  const [sortBy, setSortBy] = useState<string>('Most Relevant');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Live Matching Hooks (Real backend data)
  const { data: recommendations, isLoading, isError, refetch } = useRecommendations();
  const { data: shortlist } = useShortlist();
  const { data: sentInterests } = useSentInterests();
  const { data: ignoredList } = useIgnoredProfiles();

  const shortlistedIds = useMemo(() => shortlist?.map(s => s.user_id) || [], [shortlist]);
  const sentInterestUserIds = useMemo(() => (sentInterests || []).map(i => Number(i.to_user || (i as any).user_id)), [sentInterests]);
  const ignoredUserIds = useMemo(() => ignoredList?.map(i => i.user_id) || [], [ignoredList]);

  // Live Recommendations from Backend Matching API (ZERO DUMMY OR STATIC PROFILES)
  const allAuthenticMatches = useMemo(() => {
    const list: (MatchResponseSchema & { gender?: string })[] = [];

    // Backend recommendations ONLY
    if (Array.isArray(recommendations)) {
      recommendations.forEach(r => {
        if (!ignoredUserIds.includes(r.user_id)) {
          list.push(r);
        }
      });
    }

    // Deduplicate by user_id
    return list.filter((item, idx, self) => idx === self.findIndex(t => t.user_id === item.user_id));
  }, [recommendations, ignoredUserIds]);

  // Apply Sidebar Filters
  const filteredMatches = useMemo(() => {
    return allAuthenticMatches.filter(item => {
      // 1. Looking For (Bride = female, Groom = male)
      const targetGenderStr = lookingFor === 'Bride' ? 'f' : 'm';
      const itemGenderStr = (item.gender || '').toLowerCase();
      if (itemGenderStr && !itemGenderStr.startsWith(targetGenderStr)) {
        return false;
      }

      // 2. Age Range
      if (item.age && (item.age < ageRange[0] || item.age > ageRange[1])) {
        return false;
      }

      // 3. Religion
      if (religion !== 'Any' && item.religion) {
        if (!item.religion.toLowerCase().includes(religion.toLowerCase())) {
          return false;
        }
      }

      // 4. Caste
      if (caste !== 'Any' && item.caste) {
        if (!item.caste.toLowerCase().includes(caste.toLowerCase())) {
          return false;
        }
      }

      // 5. Education
      if (education !== 'Any' && item.education) {
        if (!item.education.toLowerCase().includes(education.toLowerCase())) {
          return false;
        }
      }

      // 6. Location Text
      if (locationQuery.trim()) {
        const q = locationQuery.toLowerCase().trim();
        const loc = `${item.city || ''} ${item.state || ''}`.toLowerCase();
        if (!loc.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allAuthenticMatches, lookingFor, ageRange, religion, caste, education, locationQuery]);

  // Apply Sorting
  const sortedMatches = useMemo(() => {
    const res = [...filteredMatches];
    if (sortBy === 'Most Relevant') {
      res.sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));
    } else if (sortBy === 'Age: Low to High') {
      res.sort((a, b) => (a.age || 0) - (b.age || 0));
    } else if (sortBy === 'Age: High to Low') {
      res.sort((a, b) => (b.age || 0) - (a.age || 0));
    } else if (sortBy === 'Name (A-Z)') {
      res.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
    }
    return res;
  }, [filteredMatches, sortBy]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setLookingFor(defaultLookingFor);
    setAgeRange([21, 35]);
    setHeightFilter('Any');
    setMaritalStatus('Never Married');
    setReligion('Hindu');
    setCaste('Any');
    setEducation('Any');
    setLocationQuery('');
    setSortBy('Most Relevant');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-stone-900 pb-20 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── 1. Romantic Hero Header Banner ── */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-rose-100/80 shadow-xs bg-[#FDF2F4]">
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[140px] sm:min-h-[160px] md:min-h-[185px] relative">
            
            {/* Background Image: Wedding Rings & Petals */}
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
              <img
                src="/images/matches_romantic_banner.jpg"
                alt=""
                className="w-full h-full object-cover object-right md:object-[center_right]"
              />
            </div>

            {/* Left Header Copy */}
            <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-xl space-y-1.5">
              <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#8B1E3F]">
                YOUR PERFECT MATCH AWAITS
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-[#8B1E3F]">
                Matches <span className="font-serif italic font-bold text-[#E5A910] drop-shadow-[0_1px_2px_rgba(139,30,63,0.15)]">for You</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 font-medium pt-0.5">
                Discover meaningful connections, one profile at a time.
              </p>
            </div>

            {/* Center Romantic Cursive Tagline */}
            <div className="hidden lg:flex relative z-10 pr-24 items-center justify-center pointer-events-none -rotate-3">
              <div className="font-['Caveat',_cursive] text-2xl lg:text-3xl text-[#8B1E3F] leading-tight text-center select-none font-semibold">
                <span>Good People</span><br />
                <span>Great Journeys ♡</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. Two-Column Layout: Sidebar Filters + Matches Listing ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── Left Column: Filter Matches Sidebar Card ── */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 space-y-4">
            {/* Header: Title & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#8B1E3F]" />
                <h3 className="font-bold text-sm text-stone-900">Filter Matches</h3>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#8B1E3F] hover:underline cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Looking For: Bride / Groom */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-800 block">Looking for</label>
              <div className="grid grid-cols-2 gap-2 bg-stone-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLookingFor('Bride')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    lookingFor === 'Bride'
                      ? 'bg-[#8B1E3F] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Bride
                </button>
                <button
                  type="button"
                  onClick={() => setLookingFor('Groom')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    lookingFor === 'Groom'
                      ? 'bg-[#8B1E3F] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Groom
                </button>
              </div>
            </div>

            {/* Age Range Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">Age Range</span>
                <span className="font-bold text-[#8B1E3F]">
                  {ageRange[0]} - {ageRange[1]} years
                </span>
              </div>
              <input
                type="range"
                min="18"
                max="50"
                value={ageRange[1]}
                onChange={e => setAgeRange([ageRange[0], Number(e.target.value)])}
                className="w-full accent-[#8B1E3F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-semibold text-stone-400">
                <span>18</span>
                <span>50</span>
              </div>
            </div>

            {/* Height Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Height</label>
              <div className="relative">
                <select
                  value={heightFilter}
                  onChange={e => setHeightFilter(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8B1E3F]"
                >
                  <option value="Any">Any Height</option>
                  <option value="4.5 ft - 5.0 ft">4.5 ft - 5.0 ft</option>
                  <option value="5.0 ft - 5.5 ft">5.0 ft - 5.5 ft</option>
                  <option value="5.5 ft - 6.0 ft">5.5 ft - 6.0 ft</option>
                  <option value="6.0 ft - 6.5 ft">6.0 ft - 6.5 ft</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Marital Status Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Marital Status</label>
              <div className="relative">
                <select
                  value={maritalStatus}
                  onChange={e => setMaritalStatus(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8B1E3F]"
                >
                  <option value="Never Married">Never Married</option>
                  <option value="Awaiting Divorce">Awaiting Divorce</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Any">Any</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Religion Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Religion</label>
              <div className="relative">
                <select
                  value={religion}
                  onChange={e => setReligion(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8B1E3F]"
                >
                  <option value="Hindu">Hindu</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Christian">Christian</option>
                  <option value="Sikh">Sikh</option>
                  <option value="Jain">Jain</option>
                  <option value="Any">Any</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Caste Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Caste</label>
              <div className="relative">
                <select
                  value={caste}
                  onChange={e => setCaste(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8B1E3F]"
                >
                  <option value="Any">Any</option>
                  <option value="Reddy">Reddy</option>
                  <option value="Brahmin">Brahmin</option>
                  <option value="Arya Vysya">Arya Vysya</option>
                  <option value="Kamma">Kamma</option>
                  <option value="Kapu">Kapu</option>
                  <option value="Naidu">Naidu</option>
                  <option value="Yadava">Yadava</option>
                  <option value="Mudaliar">Mudaliar</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Education Select */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Education</label>
              <div className="relative">
                <select
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 appearance-none focus:outline-none focus:border-[#8B1E3F]"
                >
                  <option value="Any">Any</option>
                  <option value="B.Tech">B.Tech / B.E</option>
                  <option value="M.Tech">M.Tech / M.E</option>
                  <option value="MBA">MBA / PGDM</option>
                  <option value="MCA">MCA / M.Sc IT</option>
                  <option value="BDS">BDS / MBBS / MD</option>
                  <option value="Chartered Accountant">Chartered Accountant</option>
                  <option value="Ph.D">Ph.D / Doctorate</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Location Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={locationQuery}
                  onChange={e => setLocationQuery(e.target.value)}
                  placeholder="Enter city or state"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8B1E3F]"
                />
              </div>
            </div>

            {/* Big Show Matches Button */}
            <button
              type="button"
              className="w-full py-2.5 bg-[#8B1E3F] hover:bg-[#721833] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.99]"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Show Matches</span>
            </button>
          </div>

          {/* ── Right Column: Matches Listing ── */}
          <div className="lg:col-span-9 space-y-4">
            
            {/* Top Bar: Count & Sorting Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
              {/* Title Count */}
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
                  <span className="text-[#8B1E3F] font-extrabold mr-1.5">
                    {sortedMatches.length}
                  </span>
                  Matches Found
                </h2>
                <p className="text-xs text-stone-500 font-medium">Based on your preferences</p>
              </div>

              {/* Controls: Sort Dropdown + View Toggle */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
                  <span className="hidden sm:inline">Sort by</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-stone-50 border border-stone-200 hover:border-stone-300 text-stone-900 text-xs font-semibold py-1.5 pl-3 pr-7 rounded-xl appearance-none focus:outline-none focus:border-[#8B1E3F]"
                    >
                      <option value="Most Relevant">Most Relevant</option>
                      <option value="Age: Low to High">Age: Low to High</option>
                      <option value="Age: High to Low">Age: High to Low</option>
                      <option value="Name (A-Z)">Name (A-Z)</option>
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
            </div>

            {/* Profile Cards Content */}
            {isLoading ? (
              <LoadingScreen title="Matches" message="Finding authentic matches tailored to you..." />
            ) : isError ? (
              <div className="p-8 text-center border border-stone-200 rounded-2xl bg-white space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                <h3 className="font-bold text-base text-stone-900">Failed to Load Matches</h3>
                <p className="text-xs text-stone-500">We could not fetch recommendations from the server.</p>
                <Button size="sm" onClick={() => refetch()} className="bg-[#8B1E3F] text-white">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                </Button>
              </div>
            ) : sortedMatches.length === 0 ? (
              <div className="p-12 text-center border border-stone-200 rounded-2xl bg-white space-y-3">
                <Sparkles className="h-8 w-8 text-[#8B1E3F] mx-auto" />
                <h3 className="font-bold text-base text-stone-900">No Matches Found for Current Filters</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try broadening your age, religion, or location criteria to see more compatible profiles.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#8B1E3F] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#721833] cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-4'
                }
              >
                {sortedMatches.map(match => (
                  <RecommendationCard
                    key={match.user_id}
                    match={match}
                    isShortlisted={shortlistedIds.includes(match.user_id)}
                    isInterestSent={sentInterestUserIds.includes(match.user_id)}
                    onViewProfile={id => navigate(`/profile/${id}`)}
                  />
                ))}
              </div>
            )}

          </div>

        </div>



      </div>
    </div>
  );
};

export default MatchesPage;
