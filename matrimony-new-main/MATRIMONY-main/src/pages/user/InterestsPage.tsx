import React, { useState } from 'react';
import { useSentInterests, useReceivedInterests } from '../../hooks/useMatching';
import { InterestCard } from '../../components/matching/InterestCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Heart, RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export const InterestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const { data: sentInterests, isLoading: isSentLoading, isError: isSentError, refetch: refetchSent, isFetching: isSentFetching } = useSentInterests();
  const { data: receivedInterests, isLoading: isRecvLoading, isError: isRecvError, refetch: refetchRecv, isFetching: isRecvFetching } = useReceivedInterests();

  const handleRefresh = () => {
    if (activeTab === 'received') refetchRecv();
    else refetchSent();
  };

  const isLoading = activeTab === 'received' ? isRecvLoading : isSentLoading;
  const isFetching = activeTab === 'received' ? isRecvFetching : isSentFetching;
  const isError = activeTab === 'received' ? isRecvError : isSentError;
  const interestList = activeTab === 'received' ? receivedInterests || [] : sentInterests || [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="gold" className="mb-1">Expressions</Badge>
          <h1 className="font-serif text-3xl font-bold text-foreground">Interest Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track and respond to sent, received, and accepted interest expressions.</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading || isFetching}
          className="border-stone-200 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 h-10 px-4 rounded-xl"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        {[
          { id: 'received', label: `Received Interests (${receivedInterests?.length || 0})` },
          { id: 'sent', label: `Sent Interests (${sentInterests?.length || 0})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-2xl transition-all ${
              activeTab === tab.id
                ? 'bg-[#8B1E3F] text-white shadow-sm'
                : 'bg-white text-muted-foreground hover:bg-muted border border-border/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List (3rd Loading State) */}
      {isLoading ? (
        <LoadingScreen title="Interest Expressions" message="Fetching sent and received interest expressions..." />
      ) : isError ? (
        <Card className="p-12 text-center border-stone-200/80 rounded-3xl space-y-4 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-stone-900">Failed to Load Interests</h3>
            <p className="text-xs text-stone-500">Could not retrieve interest details from the server. Please check your network or try again.</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={handleRefresh}
            className="bg-[#8B1E3F] hover:bg-[#721733] text-white px-6 font-bold"
          >
            Retry Fetching
          </Button>
        </Card>
      ) : interestList.length === 0 ? (
        <Card className="p-16 text-center border-stone-200/80 rounded-3xl space-y-3 max-w-xl mx-auto bg-white shadow-2xs">
          <div className="h-12 w-12 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {activeTab === 'received' ? 'No Received Interests' : 'No Sent Interests'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {activeTab === 'received'
                ? "You haven't received any interest requests yet. Complete your profile details to boost visibility!"
                : 'You have not expressed interest in any matching profiles yet. Go to matches page to get started.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {interestList.map(item => (
            <InterestCard key={item.id} interest={item} type={activeTab} />
          ))}
        </div>
      )}

    </div>
  );
};
