import React from 'react';
import { useIgnoredProfiles } from '../../hooks/useMatching';
import { IgnoredProfileCard } from '../../components/matching/IgnoredProfileCard';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EyeOff, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export const IgnoredProfilesPage: React.FC = () => {
  const { data: ignoredProfiles, isLoading, isError, refetch, isFetching } = useIgnoredProfiles();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="gold" className="mb-1">Filters</Badge>
          <h1 className="font-serif text-3xl font-bold text-foreground">Ignored Profiles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Profiles you have skipped or hidden from match recommendations.</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="border-stone-200 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 h-10 px-4 rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Ignored List
        </Button>
      </div>

      {/* List of Ignored Cards (3rd Loading State) */}
      {isLoading ? (
        <LoadingScreen title="Ignored Profiles" message="Fetching your ignored profile list..." />
      ) : isError ? (
        <Card className="p-12 text-center border-stone-200/80 rounded-3xl space-y-4 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900">Failed to Load Ignored List</h3>
            <p className="text-xs text-stone-500">Could not retrieve ignored profiles from matching service. Please try again.</p>
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
      ) : !ignoredProfiles || ignoredProfiles.length === 0 ? (
        <Card className="p-16 text-center border-stone-200/80 rounded-3xl space-y-3 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <EyeOff className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">No Ignored Profiles</h3>
            <p className="text-xs text-stone-500 mt-1">You haven't marked any match recommendations as ignored yet. Skipped profiles will accumulate here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {ignoredProfiles.map(profile => (
            <IgnoredProfileCard key={profile.user_id} profile={profile} />
          ))}
        </div>
      )}

    </div>
  );
};
