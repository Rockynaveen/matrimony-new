import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyMembership } from '../../hooks/useMembership';
import { Crown, Sparkles, Lock, ChevronRight, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

export const ProfileCreditsBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { data: membershipData } = useMyMembership();

  if (!membershipData) {
    return null;
  }

  const planName = membershipData?.plan_name || 'Free Tier';
  const remainingCredits = membershipData?.remaining_credits ?? 0;
  const totalCredits = membershipData?.profile_credits ?? 0;
  const usedCredits = membershipData?.used_credits ?? Math.max(0, totalCredits - remainingCredits);

  const percentUsed = totalCredits > 0 ? Math.min(100, Math.max(0, (usedCredits / totalCredits) * 100)) : 0;

  return (
    <div className={`w-full bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/90 text-black flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden ${className}`}>
      
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#C70F4B]/10 to-transparent pointer-events-none" />

      {/* Left Info Section */}
      <div className="flex items-center gap-4 min-w-0 w-full md:w-auto relative z-10">
        <div className="h-12 w-12 rounded-xl bg-[#C70F4B] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Crown className="h-6 w-6 text-amber-300 fill-amber-300" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C70F4B]/10 text-[#C70F4B] border border-[#C70F4B]/25 uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-[#C70F4B]" /> {planName} Plan Active
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 font-bold uppercase tracking-wider rounded-full ${
              remainingCredits > 0 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {remainingCredits > 0 ? `${remainingCredits} Credits Available` : '0 Credits Left (Locked)'}
            </span>
          </div>

          <h3 className="font-bold text-base sm:text-lg text-black leading-snug">
            {remainingCredits > 0 ? (
              <span>You have <strong className="text-[#C70F4B] font-bold">{remainingCredits} profile credits</strong> remaining to unlock full profile details.</span>
            ) : (
              <span className="text-rose-600 font-bold">Profile contact details are locked. Upgrade your plan to view unlimited profiles!</span>
            )}
          </h3>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Unlock verified phone numbers, direct messaging, and high-compatibility horoscope reports.
          </p>
        </div>
      </div>

      {/* Right Action & Progress Bar */}
      <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 relative z-10">
        
        {/* Compact Progress Indicator */}
        <div className="hidden lg:flex flex-col gap-1.5 w-36">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
            <span>Credits Used</span>
            <span className="text-[#C70F4B] font-bold">{usedCredits} / {totalCredits}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-[#C70F4B] to-[#E01E5A] rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/membership')}
          className="bg-gradient-to-r from-[#C70F4B] to-[#E01E5A] hover:from-[#A80B3E] hover:to-[#C70F4B] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 w-full sm:w-auto shrink-0 cursor-pointer"
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
