import React, { useState } from 'react';
import { useRecommendations, useShortlist, useSentInterests, useReceivedInterests, useIgnoredProfiles } from '../../hooks/useMatching';
import { RecommendationCard } from '../../components/matching/RecommendationCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Sparkles, Heart, Compass, Clock, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export const MatchesPage: React.FC = () => {
  const [matchTab, setMatchTab] = useState<'recommended' | 'compatible' | 'new' | 'nearby' | 'horoscope'>('recommended');

  const { data: recommendations, isLoading, isError, refetch, isFetching } = useRecommendations();
  const { data: shortlist } = useShortlist();
  const { data: sentInterests } = useSentInterests();
  const { data: receivedInterests } = useReceivedInterests();
  const { data: ignoredList } = useIgnoredProfiles();

  const shortlistedIds = shortlist?.map(s => s.user_id) || [];
  const sentInterestUserIds = sentInterests?.map(i => i.to_user) || [];
  const ignoredUserIds = ignoredList?.map(i => i.user_id) || [];

  const acceptedUserIds = new Set([
    ...(receivedInterests || []).filter(i => i.status?.toLowerCase() === 'accepted').map(i => i.from_user),
    ...(sentInterests || []).filter(i => i.status?.toLowerCase() === 'accepted').map(i => i.to_user)
  ]);

  const getFilteredMatches = () => {
    if (!recommendations || !Array.isArray(recommendations)) return [];
    
    switch (matchTab) {
      case 'compatible':
        return [...recommendations].sort((a, b) => (b.match_percentage || 0) - (a.match_percentage || 0));
      case 'new':
        return recommendations.slice(0, 6);
      case 'nearby':
        // Filter by state or city if specified
        return recommendations.filter(p => Boolean(p.city || p.state));
      case 'horoscope':
        // Filter those containing matching horoscope fields
        return recommendations.filter(p =>
          p.matched_fields?.some(f => ['horoscope', 'rashi', 'nakshatra', 'dosha', 'astrology'].includes(f.toLowerCase()))
        );
      default:
        return recommendations;
    }
  };

  // Filter out ignored profiles and duplicates by user_id
  const matchesList = getFilteredMatches()
    .filter(item => !ignoredUserIds.includes(item.user_id))
    .filter((item, index, self) =>
      index === self.findIndex(t => t.user_id === item.user_id)
    );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <Badge variant="gold" className="mb-1">AI Match Engine</Badge>
          <h1 className="font-serif text-3xl font-bold text-foreground">Intelligent Match Recommendations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Profiles handpicked based on your partner preferences & horoscope score</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="border-stone-200 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 h-10 px-4 rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Recommendations
        </Button>
      </div>

      {/* Matches Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60">
        {[
          { id: 'recommended', label: 'Recommended', icon: Sparkles },
          { id: 'compatible', label: 'Most Compatible (90%+)', icon: Star },
          { id: 'new', label: 'New Matches', icon: Clock },
          { id: 'nearby', label: 'Nearby Matches', icon: Compass },
          { id: 'horoscope', label: 'Horoscope Matches', icon: Heart }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = matchTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMatchTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#8B1E3F] text-white shadow-md'
                  : 'bg-white text-muted-foreground hover:bg-muted border border-border/60'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Breakdown Teaser Card */}
      <Card className="p-6 bg-gradient-to-r from-[#8B1E3F]/10 via-[#FFF9F5] to-amber-50 border border-[#8B1E3F]/20 flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl">
        <div className="space-y-1">
          <h4 className="font-serif font-bold text-lg text-[#8B1E3F] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#D4AF37]" /> Your Compatibility Breakdown Standard
          </h4>
          <p className="text-xs text-muted-foreground">Every match card displays individual breakdown parameters for maximum transparency.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full md:w-auto">
          <div className="bg-white p-2.5 rounded-xl border border-border/60 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">Education</span>
            <span className="font-serif font-bold text-sm text-[#8B1E3F]">90%</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-border/60 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">Lifestyle</span>
            <span className="font-serif font-bold text-sm text-[#8B1E3F]">85%</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-border/60 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">Location</span>
            <span className="font-serif font-bold text-sm text-[#8B1E3F]">95%</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-border/60 text-center shadow-2xs">
            <span className="text-[10px] text-muted-foreground font-semibold block">Horoscope</span>
            <span className="font-serif font-bold text-sm text-[#8B1E3F]">92%</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-border/60 text-center shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted-foreground font-semibold block">Interests</span>
            <span className="font-serif font-bold text-sm text-[#8B1E3F]">88%</span>
          </div>
        </div>
      </Card>

      {/* Grid of Profile Cards (3rd Loading State) */}
      {isLoading ? (
        <LoadingScreen title="AI Match Engine" message="Finding compatibility match recommendations based on your preferences..." />
      ) : isError ? (
        <Card className="p-12 text-center border-stone-200/80 rounded-3xl space-y-4 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900">Failed to Load Recommendations</h3>
            <p className="text-xs text-stone-500">We encountered an issue communicating with the live matching engine. Please verify your credentials or try again.</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => refetch()}
            className="bg-[#8B1E3F] hover:bg-[#721733] text-white px-6 font-bold"
          >
            Retry Fetching
          </Button>
        </Card>
      ) : matchesList.length === 0 ? (
        <Card className="p-16 text-center border-stone-200/80 rounded-3xl space-y-3 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">No Recommendations Available</h3>
            <p className="text-xs text-stone-500 mt-1">There are no matches matching your active partner preference criteria currently. Try updating your filters.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {matchesList.map(match => (
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
  );
};
