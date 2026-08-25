import React from 'react';
import { useShortlist } from '../../hooks/useMatching';
import { ShortlistCard } from '../../components/matching/ShortlistCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Star, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export const ShortlistPage: React.FC = () => {
  const { data: shortlist, isLoading, isError, refetch, isFetching } = useShortlist();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="gold" className="mb-1">Saved Profiles</Badge>
          <h1 className="font-serif text-3xl font-bold text-foreground">Shortlisted Profiles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage the matrimonial profiles you have saved for further consideration.</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="border-stone-200 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 h-10 px-4 rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Shortlist
        </Button>
      </div>

      {/* Grid of Shortlisted Cards (3rd Loading State) */}
      {isLoading ? (
        <LoadingScreen title="Saved Profiles" message="Loading your shortlisted matrimonial profiles..." />
      ) : isError ? (
        <Card className="p-12 text-center border-stone-200/80 rounded-3xl space-y-4 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900">Failed to Load Shortlist</h3>
            <p className="text-xs text-stone-500">Could not retrieve shortlisted profiles. Please check your connection or try again.</p>
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
      ) : !shortlist || shortlist.length === 0 ? (
        <Card className="p-16 text-center border-stone-200/80 rounded-3xl space-y-3 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">No Shortlisted Profiles</h3>
            <p className="text-xs text-stone-500 mt-1">Your shortlist is currently empty. Explore match recommendations and click the heart icon on profiles to save them here.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortlist.map(profile => (
            <ShortlistCard key={profile.user_id} profile={profile} />
          ))}
        </div>
      )}

    </div>
  );
};
