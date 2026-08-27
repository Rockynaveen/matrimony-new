import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyMembership } from '../../hooks/useMembership';
import { Crown, Sparkles, Lock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const ProfileCreditsBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { data: membershipData, isLoading } = useMyMembership();

  const planName = membershipData?.plan_name || 'Free';
  const remainingCredits = membershipData?.remaining_credits ?? 3;
  const totalCredits = membershipData?.profile_credits ?? 4;
  const usedCredits = membershipData?.used_credits ?? Math.max(0, totalCredits - remainingCredits);

  const percentUsed = Math.min(100, Math.max(0, (usedCredits / Math.max(1, totalCredits)) * 100));

  return (
    <div className={`w-full bg-gradient-to-r from-stone-900 via-[#3B0A18] to-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
      
      {/* Left Info Section */}
      <div className="flex items-center gap-3.5 min-w-0 w-full md:w-auto">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center shrink-0 shadow-md font-bold">
          <Crown className="h-6 w-6 fill-current" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {planName} Plan Active
            </span>
            <Badge variant="gold" className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border-amber-400/30">
              {remainingCredits > 0 ? `${remainingCredits} Credits Available` : '0 Credits Left (Locked)'}
            </Badge>
          </div>

          <h3 className="font-extrabold text-sm sm:text-base text-white truncate mt-0.5">
            {remainingCredits > 0 ? (
              <span>You have <span className="text-amber-400 font-extrabold">{remainingCredits} profile unlock credits</span> remaining.</span>
            ) : (
              <span className="text-rose-300">Matching profiles are locked. Take a membership to unlock more.</span>
            )}
          </h3>
        </div>
      </div>

      {/* Right Action & Progress Bar */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
        
        {/* Compact Progress Indicator */}
        <div className="hidden lg:flex flex-col gap-1 w-36">
          <div className="flex justify-between items-center text-[10px] font-bold text-stone-300">
            <span>Credits Used</span>
            <span className="text-amber-400">{usedCredits} / {totalCredits}</span>
          </div>
          <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden border border-stone-700">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/membership')}
          className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 font-extrabold text-xs py-2 px-4 hover:brightness-110 transition-all shadow-md shrink-0 w-full sm:w-auto text-center justify-center"
        >
          {remainingCredits > 0 ? (
            <>
              Upgrade Plan <ChevronRight className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 mr-1 text-stone-950 fill-stone-950" /> Buy Credits / Unlock Profiles
            </>
          )}
        </Button>
      </div>

    </div>
  );
};
