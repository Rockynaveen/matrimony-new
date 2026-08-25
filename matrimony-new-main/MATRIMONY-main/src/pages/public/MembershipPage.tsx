import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, XCircle, Crown, Sparkles, Loader2 } from 'lucide-react';
import { membershipApi } from '../../api/membershipApi';
import type { ApiMembershipPlan } from '../../types/membershipTypes';

export const MembershipPage: React.FC = () => {
  const { setMembershipTier } = useApp();
  const navigate = useNavigate();

  const [apiPlans, setApiPlans] = useState<ApiMembershipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    membershipApi
      .getPlans()
      .then(plans => {
        if (isMounted) {
          setApiPlans(plans);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn('[MembershipPage] Error loading plans from API:', err);
          setError('Unable to load subscription plans. Please try again later.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChoosePlan = (planId: number | string, planObj?: ApiMembershipPlan) => {
    if (String(planId).toUpperCase() === 'FREE' || planId === 0) {
      setMembershipTier('FREE');
      navigate('/dashboard');
    } else {
      navigate('/checkout', { state: { planId, apiPlan: planObj } });
    }
  };

  const displayPlans = apiPlans.map(p => ({
    rawId: p.id,
    id: String(p.id),
    name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    period: `${p.validity_days} Days`,
    popular: p.is_featured_profile || p.name.toLowerCase().includes('gold'),
    features: [
      `${p.profile_credits} Profile Contact Unlocks`,
      `${p.validity_days} Days Full Validity`,
      p.unlimited_messaging ? 'Unlimited Direct Messaging' : 'Standard Messaging',
      p.profile_boost_count > 0 ? `${p.profile_boost_count}x Profile Ranking Boost` : 'Standard Profile Ranking',
      p.is_featured_profile ? 'Featured VIP Profile Spotlight' : 'Regular Search Placement'
    ],
    contactUnlocks: `${p.profile_credits} Contact Credits`,
    profileBoost: p.profile_boost_count > 0 ? `${p.profile_boost_count}x Rank Boost` : 'Standard',
    featuredProfile: p.is_featured_profile,
    validityDays: p.validity_days,
    originalObj: p
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="gold" className="bg-[#D4AF37]/15 text-[#8B1E3F] border-[#D4AF37]/30 font-bold px-4 py-1">
          <Crown className="h-3.5 w-3.5 mr-1.5 text-[#D4AF37]" /> Premium Subscriptions
        </Badge>
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Choose the Right Plan for You
        </h1>
        <p className="text-base text-stone-600 font-medium max-w-2xl mx-auto">
          Unlock verified phone numbers, direct chats, AI horoscope reports, and dedicated relationship managers.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B1E3F]" />
          <p className="text-sm font-semibold text-stone-600">Loading live subscription packages...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry Loading
          </Button>
        </div>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {displayPlans.map(plan => {
            const isPopular = plan.popular;
            const isVIP = plan.name.toLowerCase().includes('platinum') || plan.name.toLowerCase().includes('royal');
            const isFree = plan.price === 0 || plan.id === 'FREE';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between relative transition-all duration-300 ${
                  isPopular
                    ? 'bg-gradient-to-b from-[#8B1E3F] via-[#A0234A] to-[#8B1E3F] text-white shadow-2xl scale-105 ring-4 ring-[#D4AF37]/40 z-20'
                    : isVIP
                    ? 'bg-stone-900 text-white shadow-xl border border-stone-800 hover:border-amber-400/50'
                    : 'bg-white text-stone-900 shadow-lg border border-stone-200/90 hover:border-[#8B1E3F]/30 hover:shadow-2xl'
                }`}
              >
                {/* Floating Badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-amber-300">
                    <Sparkles className="h-3 w-3 text-stone-950" /> Most Popular Choice
                  </div>
                )}

                {isVIP && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400/20 backdrop-blur-md border border-amber-400/40 text-amber-300 font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" /> Executive Concierge
                  </div>
                )}

                <div>
                  {/* Header Banner */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/15">
                    <div>
                      <h3 className={`font-serif text-xl font-bold ${isPopular || isVIP ? 'text-white' : 'text-stone-900'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-[11px] mt-0.5 font-medium ${isPopular || isVIP ? 'text-stone-200' : 'text-stone-500'}`}>
                        Validity: {plan.period}
                      </p>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="my-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-serif text-3xl sm:text-4xl font-extrabold ${
                        isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-[#8B1E3F]'
                      }`}>
                        {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 font-semibold ${isPopular || isVIP ? 'text-stone-300' : 'text-stone-500'}`}>
                      All-Inclusive Matrimonial Package
                    </p>
                  </div>

                  {/* Key Perks Highlight */}
                  <div className={`p-3 rounded-xl mb-5 text-[11px] font-semibold space-y-1 ${
                    isPopular
                      ? 'bg-white/10 border border-white/20 text-stone-100'
                      : isVIP
                      ? 'bg-stone-800/80 border border-stone-700 text-amber-200'
                      : 'bg-stone-50 border border-stone-200/70 text-stone-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>Contact Unlocks:</span>
                      <span className="font-extrabold">{plan.contactUnlocks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Profile Ranking:</span>
                      <span className="font-extrabold">{plan.profileBoost}</span>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <ul className="space-y-2.5 text-xs pt-1">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${
                          isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-emerald-600'
                        }`} />
                        <span className={isPopular || isVIP ? 'text-stone-100' : 'text-stone-700'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-4">
                  <Button
                    variant={isPopular ? 'gold' : isVIP ? 'primary' : isFree ? 'outline' : 'gold'}
                    size="lg"
                    onClick={() => handleChoosePlan(plan.rawId, plan.originalObj)}
                    className={`w-full font-bold shadow-xl h-11 text-xs uppercase tracking-wider ${
                      isPopular
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:opacity-95 border border-amber-300'
                        : isVIP
                        ? 'bg-gradient-to-r from-[#8B1E3F] to-[#C44569] text-white hover:opacity-95'
                        : isFree
                        ? 'border-stone-300 text-stone-800 hover:bg-stone-100'
                        : 'bg-[#8B1E3F] text-white hover:opacity-90'
                    }`}
                  >
                    {isFree ? 'Current Basic Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="space-y-6 pt-6">
        <h3 className="font-serif text-2xl font-bold text-center">Detailed Feature Comparison</h3>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/70 text-foreground font-serif text-sm">
                <tr>
                  <th className="p-4">Feature</th>
                  {apiPlans.map(p => (
                    <th key={p.id} className="p-4 text-center font-bold capitalize">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-4 font-semibold">Contact Unlocks</td>
                  {apiPlans.map(p => (
                    <td key={p.id} className="p-4 text-center text-emerald-700 font-bold">
                      {p.profile_credits} Contacts
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Validity Period</td>
                  {apiPlans.map(p => (
                    <td key={p.id} className="p-4 text-center font-semibold">
                      {p.validity_days} Days
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Unlimited Direct Messaging</td>
                  {apiPlans.map(p => (
                    <td key={p.id} className="p-4 text-center">
                      {p.unlimited_messaging ? (
                        <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 mx-auto text-muted-foreground/50" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold">Featured Spotlight Tag</td>
                  {apiPlans.map(p => (
                    <td key={p.id} className="p-4 text-center">
                      {p.is_featured_profile ? (
                        <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 mx-auto text-muted-foreground/50" />
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
};
