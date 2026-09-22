import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  CheckCircle2,
  XCircle,
  Crown,
  Sparkles,
  Loader2,
  Zap,
  CreditCard,
  Building,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Settings
} from 'lucide-react';
import { membershipApi } from '../../api/membershipApi';
import type {
  ApiMembershipPlan,
  MyMembershipOut,
  CreateOfflineTransactionPayload
} from '../../types/membershipTypes';

export const MembershipPage: React.FC = () => {
  const { setMembershipTier, currentUser, showToast } = useApp();
  const navigate = useNavigate();

  const [apiPlans, setApiPlans] = useState<ApiMembershipPlan[]>([]);
  const [showAllPlans, setShowAllPlans] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active User Membership state (GET /api/membership/my-membership/)
  const [myMembership, setMyMembership] = useState<MyMembershipOut | null>(null);
  const [loadingMyMembership, setLoadingMyMembership] = useState<boolean>(true);

  // Offline Payment Modal State
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [selectedPlanForOffline, setSelectedPlanForOffline] = useState<ApiMembershipPlan | null>(null);
  const [offlinePayload, setOfflinePayload] = useState<CreateOfflineTransactionPayload>({
    user_id: 1,
    plan_id: 1,
    amount: 1999,
    customer_name: currentUser?.name || '',
    customer_email: currentUser?.email || '',
    customer_phone: currentUser?.phone || '',
    notes: ''
  });
  const [submittingOffline, setSubmittingOffline] = useState<boolean>(false);

  // Load Plans (GET /api/membership/plans/ or /plans/all)
  const fetchPlans = async (all = false) => {
    setLoading(true);
    setError(null);
    try {
      const plans = all
        ? await membershipApi.getAllPlans()
        : await membershipApi.getPlans();
      setApiPlans(plans);
    } catch (err: any) {
      console.warn('[MembershipPage] Error loading plans:', err);
      setError('Unable to load subscription plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load My Membership (GET /api/membership/my-membership/)
  const fetchMyMembership = async () => {
    setLoadingMyMembership(true);
    try {
      const data = await membershipApi.getMyMembership();
      setMyMembership(data);
    } catch (err) {
      console.warn('[MembershipPage] Error loading my-membership:', err);
    } finally {
      setLoadingMyMembership(false);
    }
  };

  useEffect(() => {
    fetchPlans(showAllPlans);
    fetchMyMembership();
  }, [showAllPlans]);

  const handleChoosePlan = (planId: number | string, planObj?: ApiMembershipPlan) => {
    if (String(planId).toUpperCase() === 'FREE' || planId === 0) {
      membershipApi.activatePlanLocally({
        id: 0,
        name: 'Free',
        price: 0,
        profile_credits: 4,
        validity_days: 365,
        profile_boost_count: 0,
        is_featured_profile: false,
        unlimited_messaging: false,
        is_active: true
      }, { purchase_type: 'FREE' });
      setMembershipTier('FREE');
      navigate('/dashboard');
    } else {
      navigate('/checkout', { state: { planId, apiPlan: planObj } });
    }
  };

  const handleOpenOfflineModal = (plan: ApiMembershipPlan) => {
    const numericPrice = typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
    setSelectedPlanForOffline(plan);
    setOfflinePayload({
      user_id: parseInt(String(currentUser?.id).replace(/\D/g, ''), 10) || 1,
      plan_id: plan.id,
      amount: numericPrice || 0,
      customer_name: currentUser?.name || '',
      customer_email: currentUser?.email || '',
      customer_phone: currentUser?.phone || '',
      notes: 'Offline transfer / direct UPI'
    });
    setIsOfflineModalOpen(true);
  };

  const handleSubmitOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOffline(true);
    try {
      if (selectedPlanForOffline) {
        membershipApi.activatePlanLocally(selectedPlanForOffline, {
          customer_name: offlinePayload.customer_name,
          customer_email: offlinePayload.customer_email,
          customer_phone: offlinePayload.customer_phone,
          purchase_type: 'OFFLINE'
        });
      }
      try {
        await membershipApi.createOfflineTransaction(offlinePayload);
      } catch (err: any) {
        console.warn('[MembershipPage] Backend offline note:', err);
      }
      showToast('Offline payment recorded! Plan & credits activated.');
      setIsOfflineModalOpen(false);
      await fetchMyMembership();
    } catch (err: any) {
      console.error('[MembershipPage] Offline submit error:', err);
      showToast(err?.message || 'Failed to submit offline payment');
    } finally {
      setSubmittingOffline(false);
    }
  };

  const displayPlans = apiPlans.map(p => {
    const numericPrice = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
    return {
      rawId: p.id,
      id: String(p.id),
      name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      price: isNaN(numericPrice) ? 0 : numericPrice,
      period: p.validity_days ? `${p.validity_days} Days` : 'Lifetime',
      popular:
        !p.name.toLowerCase().includes('platinum') &&
        !p.name.toLowerCase().includes('royal') &&
        (p.is_featured_profile || p.name.toLowerCase().includes('gold') || p.name.toLowerCase().includes('silver')),
      features: [
        `${p.profile_credits} Verified Contact Unlocks`,
        p.validity_days ? `${p.validity_days} Days Full Validity` : 'Unlimited Lifetime Validity',
        p.unlimited_messaging ? 'Unlimited Direct Messaging' : 'Standard In-App Messaging',
        p.profile_boost_count > 0 ? `${p.profile_boost_count}x Profile Ranking Boost` : 'Standard Profile Ranking',
        p.is_featured_profile ? 'Featured VIP Profile Spotlight' : 'Standard Search Placement'
      ],
      contactUnlocks: `${p.profile_credits} Contact Credits`,
      profileBoost: p.profile_boost_count > 0 ? `${p.profile_boost_count}x Rank Boost` : 'Standard',
      featuredProfile: p.is_featured_profile,
      validityDays: p.validity_days,
      originalObj: p
    };
  });

  const remainingCredits = myMembership?.remaining_credits ?? 0;
  const totalCredits = myMembership?.profile_credits ?? 4;
  const usedCredits = myMembership?.used_credits ?? Math.max(0, totalCredits - remainingCredits);
  const percentUsed = totalCredits > 0 ? Math.min(100, Math.round((usedCredits / totalCredits) * 100)) : 0;
  const currentPlanName = myMembership?.plan_name || 'Free';

  const isAdminOrSuper = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="gold" className="bg-[#D4AF37]/15 text-[#8B1E3F] border-[#D4AF37]/30 font-bold px-4 py-1">
            <Crown className="h-3.5 w-3.5 mr-1.5 text-[#D4AF37]" /> Premium Subscriptions & Credits
          </Badge>
          {isAdminOrSuper && (
            <Link
              to="/admin/memberships"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/70 hover:bg-amber-200 px-3 py-1 rounded-full border border-amber-300 transition-colors"
            >
              <Settings className="h-3 w-3" /> Admin Plan Control
            </Link>
          )}
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
          Find Your Perfect Life Partner Faster
        </h1>
        <p className="text-sm sm:text-base text-stone-600 font-medium max-w-2xl mx-auto">
          Unlock verified phone numbers, direct messaging, astrology compatibility reports, and priority search rankings.
        </p>
      </div>

      {/* ACTIVE MEMBERSHIP STATUS CARD (GET /api/membership/my-membership/) */}
      {!loadingMyMembership && myMembership && (
        <Card className="p-6 bg-gradient-to-r from-[#8B1E3F] via-[#9B2349] to-[#701630] text-white shadow-xl rounded-3xl relative overflow-hidden border-0">
          <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-amber-400/10 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                  <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Current Plan: {currentPlanName}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active Status
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                {currentPlanName} Subscription Active
              </h2>
              <p className="text-xs text-stone-200 max-w-xl">
                You have access to contact details and priority matchmaking perks. Review your profile contact credits below.
              </p>
            </div>

            {/* Credits Counter & Progress */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-black/25 p-4 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 fill-amber-300" />
                </div>
                <div>
                  <div className="text-[11px] text-stone-300">Remaining Credits</div>
                  <div className="font-bold text-lg text-amber-300">
                    {remainingCredits} / {totalCredits} Contacts
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block" />

              <div className="w-full sm:w-44 space-y-1.5">
                <div className="flex justify-between text-[10px] text-stone-300 font-semibold">
                  <span>Usage Rate</span>
                  <span>{percentUsed}% Used</span>
                </div>
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>

              <div className="h-8 w-px bg-white/10 hidden sm:block" />

              <Button
                size="sm"
                variant="gold"
                onClick={() => navigate('/payment-history')}
                className="bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold text-xs shrink-0"
              >
                View Receipts
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Plan Filters & Toggle (GET /api/membership/plans/ vs /plans/all) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">Showing:</span>
          <button
            onClick={() => setShowAllPlans(false)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              !showAllPlans
                ? 'bg-[#8B1E3F] text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Public Plans
          </button>
          <button
            onClick={() => setShowAllPlans(true)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              showAllPlans
                ? 'bg-[#8B1E3F] text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All Plans (Includes Inactive)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Prefer Direct Bank / UPI Transfer?
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (apiPlans.length > 0) handleOpenOfflineModal(apiPlans[0]);
            }}
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <Building className="h-3.5 w-3.5 text-[#8B1E3F]" /> Pay via Offline / Bank
          </Button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B1E3F]" />
          <p className="text-sm font-semibold text-stone-600">Loading subscription plans...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchPlans(showAllPlans)}>
            Retry Loading
          </Button>
        </div>
      ) : (
        /* Plans Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {displayPlans.map(plan => {
            const isPopular = plan.popular;
            const isVIP =
              plan.name.toLowerCase().includes('platinum') ||
              plan.name.toLowerCase().includes('royal') ||
              plan.name.toLowerCase().includes('diamond');
            const isFree = plan.price === 0 || plan.id === 'FREE';
            const isCurrentActive =
              currentPlanName.toLowerCase() === plan.name.toLowerCase();

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

                {isVIP && !isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400/20 backdrop-blur-md border border-amber-400/40 text-amber-300 font-extrabold text-[10px] uppercase tracking-widest px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-400" /> Executive Concierge
                  </div>
                )}

                <div>
                  {/* Header Banner */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/15">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-serif text-xl font-bold ${
                            isPopular ? 'text-white' : isVIP ? 'text-amber-300' : 'text-stone-900'
                          }`}
                        >
                          {plan.name}
                        </h3>
                        {isCurrentActive && (
                          <Badge variant="verified" className="text-[10px] bg-emerald-500/20 text-emerald-300">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`text-[11px] mt-0.5 font-medium ${
                          isPopular || isVIP ? 'text-stone-200' : 'text-stone-500'
                        }`}
                      >
                        Validity: {plan.period}
                      </p>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="my-5">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`font-serif text-3xl sm:text-4xl font-extrabold ${
                          isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-[#8B1E3F]'
                        }`}
                      >
                        {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] mt-1 font-semibold ${
                        isPopular || isVIP ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      All-Inclusive Matrimonial Package
                    </p>
                  </div>

                  {/* Key Perks Highlight */}
                  <div
                    className={`p-3 rounded-xl mb-5 text-[11px] font-semibold space-y-1 ${
                      isPopular
                        ? 'bg-white/10 border border-white/20 text-stone-100'
                        : isVIP
                        ? 'bg-stone-800/80 border border-stone-700 text-amber-200'
                        : 'bg-stone-50 border border-stone-200/70 text-stone-800'
                    }`}
                  >
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
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            isPopular ? 'text-amber-300' : isVIP ? 'text-amber-400' : 'text-emerald-600'
                          }`}
                        />
                        <span className={isPopular || isVIP ? 'text-stone-100' : 'text-stone-700'}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Buttons */}
                <div className="mt-8 pt-4 space-y-2">
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
                    {isCurrentActive
                      ? 'Current Active Plan'
                      : isFree
                      ? 'Select Basic Plan'
                      : `Upgrade to ${plan.name}`}
                  </Button>

                  {!isFree && (
                    <button
                      onClick={() => handleOpenOfflineModal(plan.originalObj)}
                      className={`w-full text-center text-[11px] font-semibold underline underline-offset-2 py-1 transition-opacity ${
                        isPopular || isVIP ? 'text-amber-200 hover:text-white' : 'text-[#8B1E3F] hover:text-[#6c1430]'
                      }`}
                    >
                      Pay ₹{plan.price} via Bank Transfer / Offline
                    </button>
                  )}
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
                      {p.validity_days ? `${p.validity_days} Days` : 'Lifetime'}
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
                <tr>
                  <td className="p-4 font-semibold">Profile Search Boost</td>
                  {apiPlans.map(p => (
                    <td key={p.id} className="p-4 text-center font-semibold text-foreground">
                      {p.profile_boost_count > 0 ? `${p.profile_boost_count}x Rank` : 'Standard'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* OFFLINE PAYMENT MODAL (POST /api/membership/transactions/offline) */}
      {isOfflineModalOpen && selectedPlanForOffline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-foreground">
                  Offline / Bank Transfer Payment
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  POST /api/membership/transactions/offline
                </p>
              </div>
              <button
                onClick={() => setIsOfflineModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-full hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* Bank Details Banner */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/80 text-xs space-y-1.5 font-medium">
              <div className="font-bold text-foreground text-sm">Official Bank Account Information</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
                <div>Bank: <strong className="text-foreground">HDFC Bank Ltd.</strong></div>
                <div>Account: <strong className="text-foreground">50200088991122</strong></div>
                <div>IFSC Code: <strong className="text-foreground">HDFC0001234</strong></div>
                <div>UPI ID: <strong className="text-foreground">matrimony@hdfcbank</strong></div>
              </div>
            </div>

            <form onSubmit={handleSubmitOfflinePayment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Plan Selected</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedPlanForOffline.name} (₹${selectedPlanForOffline.price})`}
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs text-muted-foreground font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={offlinePayload.amount}
                    onChange={e =>
                      setOfflinePayload(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0
                      }))
                    }
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={offlinePayload.customer_name || ''}
                    onChange={e =>
                      setOfflinePayload(prev => ({ ...prev, customer_name: e.target.value }))
                    }
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={offlinePayload.customer_phone || ''}
                    onChange={e =>
                      setOfflinePayload(prev => ({ ...prev, customer_phone: e.target.value }))
                    }
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Email Address</label>
                <input
                  type="email"
                  value={offlinePayload.customer_email || ''}
                  onChange={e =>
                    setOfflinePayload(prev => ({ ...prev, customer_email: e.target.value }))
                  }
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Transaction Reference / UTR Number *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter UPI Reference ID / Bank UTR / Cheque number..."
                  value={offlinePayload.notes || ''}
                  onChange={e =>
                    setOfflinePayload(prev => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOfflineModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingOffline}
                  className="bg-[#8B1E3F] hover:bg-[#721733] text-white font-bold px-4"
                >
                  {submittingOffline ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : null}
                  Submit Offline Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
