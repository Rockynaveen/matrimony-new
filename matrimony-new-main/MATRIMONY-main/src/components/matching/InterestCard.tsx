import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Calendar,
  MapPin,
  Briefcase,
  UserX
} from 'lucide-react';
import type { InterestResponseSchema } from '../../types/matching.types';
import { useUpdateInterest, useDeleteInterest, useAddToIgnore } from '../../hooks/useMatching';
import { useApp } from '../../context/AppContext';
import { MatchAvatar } from '../ui/MatchAvatar';

interface InterestCardProps {
  interest: InterestResponseSchema;
  type: 'sent' | 'received';
}

export const InterestCard: React.FC<InterestCardProps> = ({ interest, type }) => {
  const navigate = useNavigate();
  const { showToast, setActiveChatUserId, addNotification } = useApp();

  const [localStatus, setLocalStatus] = React.useState<string>(() => {
    try {
      const acceptedSet = new Set(JSON.parse(localStorage.getItem('local_accepted_interest_ids') || '[]'));
      const rejectedSet = new Set(JSON.parse(localStorage.getItem('local_rejected_interest_ids') || '[]'));
      if (acceptedSet.has(interest.id) || acceptedSet.has(interest.from_user) || acceptedSet.has(interest.to_user)) {
        return 'Accepted';
      }
      if (rejectedSet.has(interest.id) || rejectedSet.has(interest.from_user) || rejectedSet.has(interest.to_user)) {
        return 'Rejected';
      }
    } catch {}
    return interest.status || 'Pending';
  });

  React.useEffect(() => {
    try {
      const acceptedSet = new Set(JSON.parse(localStorage.getItem('local_accepted_interest_ids') || '[]'));
      const rejectedSet = new Set(JSON.parse(localStorage.getItem('local_rejected_interest_ids') || '[]'));
      if (acceptedSet.has(interest.id) || acceptedSet.has(interest.from_user) || acceptedSet.has(interest.to_user)) {
        setLocalStatus('Accepted');
        return;
      }
      if (rejectedSet.has(interest.id) || rejectedSet.has(interest.from_user) || rejectedSet.has(interest.to_user)) {
        setLocalStatus('Rejected');
        return;
      }
    } catch {}
    if (interest.status) {
      setLocalStatus(interest.status);
    }
  }, [interest.status, interest.id]);

  const updateInterestMutation = useUpdateInterest();
  const deleteInterestMutation = useDeleteInterest();
  const ignoreMutation = useAddToIgnore();

  const handleIgnoreProfile = async () => {
    const targetUserId = type === 'sent' ? interest.to_user : interest.from_user;
    const confirmed = window.confirm('Are you sure you want to ignore this profile?');
    if (!confirmed) return;
    try {
      await ignoreMutation.mutateAsync({ user: targetUserId, reason: 'Not interested' });
      showToast('Profile added to ignore list.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to ignore profile');
    }
  };

  const handleUpdateStatus = async (status: 'Accepted' | 'Rejected') => {
    setLocalStatus(status);
    try {
      await updateInterestMutation.mutateAsync({
        interestId: interest.id,
        payload: { status }
      });

      const partnerName = `${interest.first_name || ''} ${interest.last_name || ''}`.trim() || 'Member';

      if (status === 'Accepted') {
        showToast(`Accepted interest from ${partnerName}! Chat is now enabled.`);
        addNotification({
          title: 'Interest Accepted! 🎉',
          message: `You accepted interest from ${partnerName}. Direct chat messaging is now enabled.`,
          category: 'Interests',
          link: '/messages',
          avatar: interest.profile_photo || undefined
        });
      } else {
        showToast(`Ignored interest expression from ${partnerName}.`);
        addNotification({
          title: 'Interest Request Declined',
          message: `Interest expression from ${partnerName} was declined.`,
          category: 'Interests',
          link: '/interests'
        });
      }
    } catch (err: any) {
      setLocalStatus(interest.status || 'Pending');
      showToast(err?.message || `Failed to update interest status.`);
    }
  };

  const handleDeleteInterest = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this interest expression?');
    if (!confirmed) return;
    try {
      await deleteInterestMutation.mutateAsync(interest.id);
      showToast('Interest expression deleted successfully.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete interest');
    }
  };

  const handleStartChat = () => {
    const otherUserId = type === 'sent' ? interest.to_user : interest.from_user;
    setActiveChatUserId(String(otherUserId));
    navigate(`/messages/${otherUserId}`);
  };

  const statusColors: Record<string, string> = {
    Pending: 'bg-amber-50 text-amber-800 border-amber-200',
    Accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Rejected: 'bg-rose-50 text-rose-800 border-rose-200',
    Withdrawn: 'bg-stone-50 text-stone-600 border-stone-200'
  };

  const statusText = localStatus || interest.status || 'Pending';
  const displayStatusColor = statusColors[statusText] || 'bg-stone-50 text-stone-700';

  const formattedDate = interest.created_at
    ? new Date(interest.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <Card className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-stone-200/80 bg-white hover:shadow-md transition-all duration-300 rounded-3xl">
      <div className="flex items-start sm:items-center gap-4 w-full">
        <MatchAvatar
          photo={interest.profile_photo}
          firstName={interest.first_name}
          lastName={interest.last_name}
          variant="circle"
          className="h-16 w-16 sm:h-20 sm:w-20 text-2xl sm:text-3xl ring-4 ring-stone-100 shrink-0"
        />
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 truncate">
              {interest.first_name} {interest.last_name}
              {interest.age ? `, ${interest.age}` : ''}
            </h4>
            <Badge className={`capitalize border text-[10px] font-bold px-2 py-0.5 rounded-full ${displayStatusColor}`}>
              {statusText}
            </Badge>
          </div>

          <p className="text-xs font-bold text-[#8B1E3F]">
            {interest.religion || 'Religion'} • {interest.caste || 'Caste'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-500 font-medium">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{interest.city || 'Not specified'}, {interest.state || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{interest.occupation || 'Professional'}</span>
            </div>
          </div>

          {interest.message && (
            <div className="mt-2 bg-stone-50 p-2.5 rounded-2xl border border-stone-100 max-w-lg">
              <p className="text-xs text-stone-600 font-medium italic">"{interest.message}"</p>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center gap-1 text-[10px] text-stone-400 font-semibold pt-1">
              <Calendar className="h-3 w-3" /> Received/Sent: {formattedDate}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-row md:flex-col items-center justify-end gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
        {/* RECEIVED INTEREST (Pending) */}
        {type === 'received' && statusText.toLowerCase() === 'pending' && (
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-end">
            <Button
              size="sm"
              variant="primary"
              disabled={updateInterestMutation.isPending || deleteInterestMutation.isPending || ignoreMutation.isPending}
              onClick={() => handleUpdateStatus('Accepted')}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
            >
              {updateInterestMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={updateInterestMutation.isPending || deleteInterestMutation.isPending || ignoreMutation.isPending}
              onClick={handleIgnoreProfile}
              className="text-xs border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl font-bold"
            >
              {ignoreMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserX className="h-3.5 w-3.5 mr-1 text-amber-700" />
              )}
              Ignore
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={deleteInterestMutation.isPending}
              onClick={handleDeleteInterest}
              className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold"
            >
              {deleteInterestMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              Delete
            </Button>
          </div>
        )}

        {/* ACCEPTED INTEREST (Both Sender & Receiver) */}
        {statusText.toLowerCase() === 'accepted' && (
          <div className="flex flex-col gap-1.5 w-full md:w-auto">
            <Button
              size="sm"
              variant="primary"
              onClick={handleStartChat}
              className="text-xs bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-xl font-bold flex items-center gap-1 w-full justify-center"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Open Chat
            </Button>
            <div className="flex items-center gap-1.5 w-full">
              <Button
                size="sm"
                variant="outline"
                disabled={ignoreMutation.isPending}
                onClick={handleIgnoreProfile}
                className="text-[11px] border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl font-bold flex-1 justify-center"
              >
                {ignoreMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3 mr-1" />}
                Ignore Profile
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={deleteInterestMutation.isPending}
                onClick={handleDeleteInterest}
                className="text-[11px] border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold flex-1 justify-center"
              >
                {deleteInterestMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                Withdraw Profile
              </Button>
            </div>
          </div>
        )}

        {/* SENT INTEREST (Pending) */}
        {type === 'sent' && statusText.toLowerCase() === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            disabled={deleteInterestMutation.isPending}
            onClick={handleDeleteInterest}
            className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 w-full md:w-auto justify-center"
          >
            {deleteInterestMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 mr-1" />
            )}
            Withdraw
          </Button>
        )}

        {/* View Profile Button (Always Present) */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/profile/${type === 'sent' ? interest.to_user : interest.from_user}`)}
          className="text-xs border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl font-bold w-full md:w-auto justify-center"
        >
          View Profile
        </Button>
      </div>
    </Card>
  );
};
