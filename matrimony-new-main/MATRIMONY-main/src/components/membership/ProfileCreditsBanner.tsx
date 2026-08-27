import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyMembership } from '../../hooks/useMembership';
import { Crown, Sparkles, Lock, ChevronRight, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export const ProfileCreditsBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { data: membershipData } = useMyMembership();

  const planName = membershipData?.plan_name || 'Free Tier';
  const remainingCredits = membershipData?.remaining_credits ?? 3;
  const totalCredits = membershipData?.profile_credits ?? 4;
  const usedCredits = membershipData?.used_credits ?? Math.max(0, totalCredits - remainingCredits);

  const percentUsed = Math.min(100, Math.max(0, (usedCredits / Math.max(1, totalCredits)) * 100));

  return (
    <div className={`w-full bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-[#8B1E3F]/20 text-stone-900 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden ${className}`}>
      
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#8B1E3F]/5 to-transparent pointer-events-none" />

      {/* Left Info Section */}
      <div className="flex items-center gap-4 min-w-0 w-full md:w-auto relative z-10">
        <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[#8B1E3F] via-[#A0234A] to-[#6e1531] text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-[#8B1E3F]/10">
          <Crown className="h-6 w-6 text-amber-300 fill-amber-300" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-[#8B1E3F]/10 text-[#8B1E3F] border border-[#8B1E3F]/20 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-[#8B1E3F]" /> {planName} Plan Active
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] px-3 py-0.5 font-extrabold uppercase tracking-wider rounded-full ${
              remainingCredits > 0 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {remainingCredits > 0 ? `${remainingCredits} Credits Available` : '0 Credits Left (Locked)'}
            </span>
          </div>

          <h3 className="font-bold text-base sm:text-lg text-stone-900 leading-snug">
            {remainingCredits > 0 ? (
              <span>You have <strong className="text-[#8B1E3F] font-extrabold">{remainingCredits} profile credits</strong> remaining to unlock full profile details.</span>
            ) : (
              <span className="text-rose-700 font-extrabold">Profile contact details are locked. Upgrade your plan to view unlimited profiles!</span>
            )}
          </h3>
          <p className="text-xs text-stone-500 font-medium hidden sm:block">
            Unlock verified phone numbers, direct messaging, and high-compatibility horoscope reports.
          </p>
        </div>
      </div>

      {/* Right Action & Progress Bar */}
      <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-200 relative z-10">
        
        {/* Compact Progress Indicator */}
        <div className="hidden lg:flex flex-col gap-1.5 w-36">
          <div className="flex justify-between items-center text-[11px] font-bold text-stone-600">
            <span>Credits Used</span>
            <span className="text-[#8B1E3F] font-extrabold">{usedCredits} / {totalCredits}</span>
          </div>
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200">
            <div
              className="h-full bg-gradient-to-r from-[#8B1E3F] to-[#C44569] rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/membership')}
          className="bg-[#8B1E3F] hover:bg-[#721733] text-white font-extrabold text-xs py-2.5 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all border border-[#8B1E3F] flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 cursor-pointer"
        >
          {remainingCredits > 0 ? (
            <>
              <Zap className="h-3.5 w-3.5 fill-white text-white" /> Upgrade Plan <ChevronRight className="h-4 w-4 ml-0.5" />
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5 fill-white text-white" /> Buy Credits <ChevronRight className="h-4 w-4 ml-0.5" />
            </>
          )}
        </Button>
      </div>

    </div>
  );
};
