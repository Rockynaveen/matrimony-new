import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useRecommendations, useShortlist, useSentInterests, useReceivedInterests, useIgnoredProfiles } from '../../hooks/useMatching';
import { RecommendationCard } from '../../components/matching/RecommendationCard';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import type { MatchResponseSchema } from '../../types/matching.types';

export const MatchesPage: React.FC = () => {
  const { currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'match' | 'age_asc' | 'age_desc'>('match');

  const { data: recommendations, isLoading, isError, refetch, isFetching } = useRecommendations();
  const { data: shortlist } = useShortlist();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: ignoredList } = useIgnoredProfiles();

  const shortlistedIds = shortlist?.map(s => s.user_id) || [];
  const sentInterestUserIds = (sentInterests || []).map(i => Number(i.to_user || (i as any).user_id));
  const ignoredUserIds = ignoredList?.map(i => i.user_id) || [];

  const acceptedUserIds = new Set([
    ...(receivedInterests || []).filter(i => i.status?.toLowerCase() === 'accepted').map(i => i.from_user),
    ...(sentInterests || []).filter(i => i.status?.toLowerCase() === 'accepted').map(i => i.to_user)
  ]);

  const userGender = (currentUser?.gender || localStorage.getItem('logged_in_gender') || '').toLowerCase();
  const targetGender = (userGender === 'male' || userGender === 'm') ? 'female' : ((userGender === 'female' || userGender === 'f') ? 'male' : '');

  // Live recommendations from the backend matching API
  const rawList: (MatchResponseSchema & { gender?: string })[] = (recommendations || []) as (MatchResponseSchema & { gender?: string })[];

  // Filter out ignored profiles, wrong gender, and duplicates
  const cleanedList = useMemo(() => {
    return rawList
      .filter(item => !ignoredUserIds.includes(item.user_id))
      .filter(item => {
        if (!targetGender || !item.gender) return true;
        const itemGender = item.gender.toLowerCase();
        if (targetGender === 'female') return itemGender.startsWith('f') || itemGender === 'woman' || itemGender === 'female';
        if (targetGender === 'male') return itemGender.startsWith('m') || itemGender === 'man' || itemGender === 'male';
        return true;
      })
      .filter((item, index, self) =>
        index === self.findIndex(t => t.user_id === item.user_id)
      );
  }, [rawList, ignoredUserIds, targetGender]);

  // Search and Sort Filtering
  const finalMatches = useMemo(() => {
    let result = cleanedList;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
        const loc = `${p.city || ''} ${p.state || ''}`.toLowerCase();
        const occ = (p.occupation || '').toLowerCase();
        const edu = (p.education || '').toLowerCase();
        const relCaste = `${p.religion || ''} ${p.caste || ''}`.toLowerCase();
        return fullName.includes(q) || loc.includes(q) || occ.includes(q) || edu.includes(q) || relCaste.includes(q);
      });
    }

    if (sortBy === 'match') {
      result = [...result].sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));
    } else if (sortBy === 'age_asc') {
      result = [...result].sort((a, b) => (a.age || 0) - (b.age || 0));
    } else if (sortBy === 'age_desc') {
      result = [...result].sort((a, b) => (b.age || 0) - (a.age || 0));
    }

    return result;
  }, [cleanedList, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-transparent text-black pb-16 font-sans antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#C44569] flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C44569] bg-pink-50 border border-pink-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Match Engine
                </span>
                {cleanedList.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">
                    {cleanedList.length} Verified Recommendations
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mt-1">
                Intelligent Match Recommendations
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Live compatibility recommendations from our AI engine based on your partner preferences and horoscope profile.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-black font-bold text-xs flex items-center justify-center gap-2 h-10 px-4 rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 text-[#C44569] ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Matches
          </Button>
        </div>

        {/* Single Integrated Matches Toolbar Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left: Live Match Count and Status */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-700">
              Showing <strong className="text-black font-bold">{finalMatches.length}</strong> matching profiles
            </span>
            {searchQuery && (
              <span className="text-[11px] font-semibold text-[#C44569] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-md">
                Filtered
              </span>
            )}
          </div>

          {/* Right: Search Input & Sort Filter */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by name, city, caste..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#C44569]/30 focus:border-[#C44569] text-black placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black p-0.5 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-xs font-bold text-black bg-transparent border-none focus:outline-hidden cursor-pointer"
              >
                <option value="match">Highest Match</option>
                <option value="age_asc">Age (Younger First)</option>
                <option value="age_desc">Age (Older First)</option>
              </select>
            </div>
          </div>

        </div>

        {/* Grid of Profile Cards / Loading / Error / Empty */}
        {isLoading ? (
          <LoadingScreen title="AI Match Engine" message="Finding live compatibility match recommendations based on your preferences..." />
        ) : isError ? (
          <div className="p-10 text-center border border-slate-200/90 rounded-2xl space-y-4 max-w-md mx-auto bg-white shadow-sm">
            <div className="h-12 w-12 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-black">Failed to Load Recommendations</h3>
              <p className="text-xs text-slate-600">
                We encountered an issue communicating with the live matching engine. Please try again.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => refetch()}
              className="bg-gradient-to-r from-[#C83259] to-[#E11D48] hover:from-[#A82547] hover:to-[#BE123C] text-white px-6 font-bold rounded-xl shadow-xs"
            >
              Retry Fetching
            </Button>
          </div>
        ) : finalMatches.length === 0 ? (
          <div className="p-12 text-center border border-slate-200/90 rounded-2xl space-y-3.5 max-w-md mx-auto bg-white shadow-sm">
            <div className="h-12 w-12 bg-pink-50 border border-pink-200 rounded-xl flex items-center justify-center mx-auto text-[#C44569]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-black">No Matches Available</h3>
              <p className="text-xs text-slate-600 mt-1">
                {searchQuery
                  ? `No profiles matched "${searchQuery}". Try clearing the search filter.`
                  : 'There are no match recommendations matching your criteria currently.'}
              </p>
            </div>
            {searchQuery && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="border-slate-300 text-black font-bold text-xs rounded-xl"
              >
                Clear Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {finalMatches.map(match => (
              <RecommendationCard
                key={match.user_id}
                match={match}
                isShortlisted={shortlistedIds.includes(match.user_id)}
                isInterestSent={sentInterestUserIds.includes(match.user_id)}
                isInterestAccepted={acceptedUserIds.has(match.user_id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
