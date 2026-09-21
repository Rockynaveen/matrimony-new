import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../context/AppContext';
import { membershipApi } from '../../api/membershipApi';
import type {
  ApiMembershipPlan,
  ApiUserMembership,
  ApiTransaction,
  CreatePlanPayload,
  CreateOfflineTransactionPayload
} from '../../types/membershipTypes';
import {
  Crown,
  CreditCard,
  Users,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Zap,
  ArrowRight,
  Receipt,
  FileText
} from 'lucide-react';

export const AdminMembershipManagement: React.FC = () => {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'plans' | 'userMemberships' | 'transactions' | 'recordOffline'>('plans');

  // Data States
  const [plans, setPlans] = useState<ApiMembershipPlan[]>([]);
  const [userMemberships, setUserMemberships] = useState<ApiUserMembership[]>([]);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search / Lookup User ID State
  const [searchUserId, setSearchUserId] = useState<string>('');
  const [userLookupResult, setUserLookupResult] = useState<ApiUserMembership | ApiUserMembership[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Create Plan Modal / Form State
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState<boolean>(false);
  const [creatingPlan, setCreatingPlan] = useState<boolean>(false);
  const [planForm, setPlanForm] = useState<CreatePlanPayload>({
    name: '',
    price: 999,
    profile_credits: 5,
    validity_days: 30,
    profile_boost_count: 1,
    is_featured_profile: false,
    unlimited_messaging: true,
    is_active: true
  });

  // Record Offline Transaction Form State
  const [offlineForm, setOfflineForm] = useState<CreateOfflineTransactionPayload>({
    user_id: 1,
    plan_id: 1,
    amount: 1999,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    notes: ''
  });
  const [submittingOffline, setSubmittingOffline] = useState<boolean>(false);

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      const [plansData, membershipsData, txnsData] = await Promise.all([
        membershipApi.getAllPlans().catch(err => {
          console.warn('[AdminMembership] getAllPlans warning:', err);
          return membershipApi.getPlans().catch(() => []);
        }),
        membershipApi.getUserMemberships().catch(err => {
          console.warn('[AdminMembership] getUserMemberships warning:', err);
          return [];
        }),
        membershipApi.getTransactions().catch(err => {
          console.warn('[AdminMembership] getTransactions warning:', err);
          return [];
        })
      ]);

      setPlans(plansData);
      setUserMemberships(membershipsData);
      setTransactions(txnsData);

      if (plansData.length > 0 && (!offlineForm.plan_id || offlineForm.plan_id === 1)) {
        setOfflineForm(prev => ({
          ...prev,
          plan_id: plansData[0].id,
          amount: Number(plansData[0].price) || 1999
        }));
      }
    } catch (err: any) {
      console.error('[AdminMembership] Failed to load initial data:', err);
      showToast('Failed to load some membership data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      showToast('Please enter a plan name');
      return;
    }
    setCreatingPlan(true);
    try {
      const newPlan = await membershipApi.createPlan({
        name: planForm.name.trim(),
        price: Number(planForm.price) || 0,
        profile_credits: Number(planForm.profile_credits) || 0,
        validity_days: Number(planForm.validity_days) || 30,
        profile_boost_count: Number(planForm.profile_boost_count) || 0,
        is_featured_profile: Boolean(planForm.is_featured_profile),
        unlimited_messaging: Boolean(planForm.unlimited_messaging),
        is_active: Boolean(planForm.is_active)
      });
      showToast(`Plan "${newPlan.name}" created successfully!`);
      setIsCreatePlanOpen(false);
      setPlanForm({
        name: '',
        price: 999,
        profile_credits: 5,
        validity_days: 30,
        profile_boost_count: 1,
        is_featured_profile: false,
        unlimited_messaging: true,
        is_active: true
      });
      loadAllData();
    } catch (err: any) {
      console.error('[AdminMembership] Error creating plan:', err);
      showToast(err.message || 'Failed to create plan');
    } finally {
      setCreatingPlan(false);
    }
  };

  // Handle Lookup by User ID
  const handleLookupUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchUserId.trim();
    if (!id) {
      setUserLookupResult(null);
      setLookupError(null);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await membershipApi.getUserMembershipByUserId(id);
      if (!res || (Array.isArray(res) && res.length === 0)) {
        setUserLookupResult(null);
        setLookupError(`No active membership found for User ID ${id}`);
      } else {
        setUserLookupResult(res);
      }
    } catch (err: any) {
      console.warn('[AdminMembership] Lookup error:', err);
      setUserLookupResult(null);
      setLookupError(err?.message || `User ID ${id} not found or unauthorized`);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Record Offline Transaction
  const handleRecordOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineForm.user_id || !offlineForm.plan_id || !offlineForm.amount) {
      showToast('Please fill all required fields');
      return;
    }
    setSubmittingOffline(true);
    try {
      const createdTxn = await membershipApi.createOfflineTransaction(offlineForm);
      showToast(`Offline transaction created for order #${createdTxn.id || 'new'}`);
      setOfflineForm({
        user_id: 1,
        plan_id: plans[0]?.id || 1,
        amount: Number(plans[0]?.price) || 1999,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        notes: ''
      });
      await loadAllData();
      setActiveTab('transactions');
    } catch (err: any) {
      console.error('[AdminMembership] Error recording offline transaction:', err);
      showToast(err.message || 'Failed to record offline transaction');
    } finally {
      setSubmittingOffline(false);
    }
  };

  const totalRevenue = transactions
    .filter(t => t.status === 'SUCCESS' || !t.status)
    .reduce((acc, t) => acc + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0') || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold" className="bg-amber-500/15 text-amber-800 border-amber-500/30 font-bold px-3 py-0.5">
              <Crown className="h-3.5 w-3.5 mr-1 text-amber-600" /> Membership Management
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Backend API Live</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground mt-1">
            Membership Plans & Transactions
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure subscription tiers, monitor user memberships, review transaction logs, and record offline payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsCreatePlanOpen(true)}
            className="flex items-center gap-1.5 bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold shadow-md"
          >
            <PlusCircle className="h-4 w-4" /> Create New Plan
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-5 border-l-4 border-l-[#8B1E3F]">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground">Active Plans</span>
            <Crown className="h-4 w-4 text-[#8B1E3F]" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mt-1">
            {plans.length}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {plans.filter(p => p.is_active).length} published live
          </span>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground">User Memberships</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mt-1">
            {userMemberships.length}
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {userMemberships.filter(m => m.is_active).length} currently active
          </span>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground">Total Transactions</span>
            <Receipt className="h-4 w-4 text-emerald-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-foreground mt-1">
            {transactions.length}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {transactions.filter(t => t.purchase_type === 'OFFLINE').length} offline /{' '}
            {transactions.filter(t => t.purchase_type === 'ONLINE').length} online
          </span>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-purple-600">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-muted-foreground">Recorded Revenue</span>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#8B1E3F] mt-1">
            ₹{totalRevenue.toLocaleString()}
          </h3>
          <span className="text-[11px] text-purple-700 font-semibold">
            Total receipts logged
          </span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto text-sm font-semibold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'plans'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Crown className="h-4 w-4" /> Subscription Plans ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('userMemberships')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'userMemberships'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" /> User Memberships ({userMemberships.length})
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'transactions'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4" /> Transactions Log ({transactions.length})
        </button>

        <button
          onClick={() => setActiveTab('recordOffline')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'recordOffline'
              ? 'border-[#8B1E3F] text-[#8B1E3F] font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PlusCircle className="h-4 w-4" /> Record Offline Payment
        </button>
      </div>

      {/* TAB 1: Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#8B1E3F]" />
              <p className="text-xs text-muted-foreground">Loading subscription plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <Crown className="h-10 w-10 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">No membership plans created yet.</p>
              <Button size="sm" onClick={() => setIsCreatePlanOpen(true)}>
                Create First Plan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(p => {
                const numericPrice = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
                return (
                  <Card
                    key={p.id}
                    className={`p-6 flex flex-col justify-between relative transition-all border ${
                      p.is_active ? 'border-border shadow-sm' : 'border-dashed border-stone-300 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge
                            variant={p.is_active ? 'verified' : 'outline'}
                            className="text-[10px] uppercase font-bold"
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <h3 className="font-serif text-xl font-bold text-foreground mt-1 capitalize">
                            {p.name}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold bg-muted px-2 py-1 rounded">
                          ID: {p.id}
                        </span>
                      </div>

                      <div className="my-4">
                        <span className="font-serif text-3xl font-extrabold text-[#8B1E3F]">
                          {numericPrice === 0 ? 'Free' : `₹${numericPrice.toLocaleString()}`}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1.5 font-medium">
                          / {p.validity_days ? `${p.validity_days} Days` : 'Lifetime'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs divide-y divide-border/60">
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Profile Credits</span>
                          <span className="font-bold text-foreground">{p.profile_credits} Contacts</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Direct Messaging</span>
                          <span className="font-bold text-foreground">
                            {p.unlimited_messaging ? 'Unlimited' : 'Standard'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Profile Rank Boost</span>
                          <span className="font-bold text-foreground">
                            {p.profile_boost_count > 0 ? `${p.profile_boost_count}x Boost` : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-muted-foreground">Featured Spotlight</span>
                          <span className="font-bold text-foreground">
                            {p.is_featured_profile ? 'Included' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Slug: <code className="text-foreground font-mono">{p.slug || p.name.toLowerCase()}</code></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOfflineForm(prev => ({
                            ...prev,
                            plan_id: p.id,
                            amount: numericPrice || 0
                          }));
                          setActiveTab('recordOffline');
                        }}
                        className="text-xs h-7"
                      >
                        Record Offline Sale
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: User Memberships */}
      {activeTab === 'userMemberships' && (
        <div className="space-y-6">
          {/* Lookup By User ID Form */}
          <Card className="p-4 sm:p-6 bg-muted/20 border-border">
            <form onSubmit={handleLookupUser} className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-[#8B1E3F]" /> Lookup User Membership by User ID (GET /api/membership/user-memberships/by-user/:id)
                </label>
                <input
                  type="text"
                  placeholder="Enter User ID (e.g. 70, 62, 1)..."
                  value={searchUserId}
                  onChange={e => setSearchUserId(e.target.value)}
                  className="w-full bg-white border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={lookupLoading} className="h-9 px-4 text-xs font-bold">
                  {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Find Membership'}
                </Button>
                {searchUserId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchUserId('');
                      setUserLookupResult(null);
                      setLookupError(null);
                    }}
                    className="h-9 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </form>

            {/* Lookup Result Box */}
            {lookupLoading && (
              <div className="pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-[#8B1E3F]" /> Querying membership record...
              </div>
            )}

            {lookupError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {lookupError}
              </div>
            )}

            {userLookupResult && (
              <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Membership Record Found
                  </span>
                  <Badge variant="verified">Active</Badge>
                </div>
                <pre className="p-3 bg-white rounded-xl border border-emerald-100 text-[11px] overflow-x-auto font-mono text-emerald-950">
                  {JSON.stringify(userLookupResult, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* User Memberships Table */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted/40 border-b border-border flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-foreground">All Subscribed Users</h3>
              <span className="text-xs text-muted-foreground">Total: {userMemberships.length} Users</span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#8B1E3F]" />
              </div>
            ) : userMemberships.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/70 text-foreground font-serif text-sm">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Phone / Email</th>
                      <th className="p-4">Plan Name</th>
                      <th className="p-4">Credits Remaining</th>
                      <th className="p-4">Purchased On</th>
                      <th className="p-4">Expires On</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {userMemberships.map(m => (
                      <tr key={m.id} className="hover:bg-muted/20">
                        <td className="p-4 font-semibold text-foreground">
                          <div>
                            {m.user?.first_name ? `${m.user.first_name} ${m.user.last_name || ''}` : `User #${m.id}`}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">User ID: {m.user?.id || m.id}</div>
                        </td>
                        <td className="p-4 text-muted-foreground font-mono">
                          <div>{m.user?.phone || 'N/A'}</div>
                          <div className="text-[10px]">{m.user?.email || ''}</div>
                        </td>
                        <td className="p-4 font-bold capitalize text-[#8B1E3F]">
                          {m.plan?.name || 'Free'}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-foreground">{m.remaining_credits}</span> Contacts
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {m.purchased_at ? new Date(m.purchased_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {m.expires_at ? new Date(m.expires_at).toLocaleDateString() : 'Lifetime / Null'}
                        </td>
                        <td className="p-4 text-right">
                          <Badge variant={m.is_active ? 'verified' : 'outline'}>
                            {m.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <Users className="h-8 w-8 text-stone-300 mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">No user memberships found.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: Transactions Log */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted/40 border-b border-border flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-foreground">System Transaction Records</h3>
              <span className="text-xs text-muted-foreground">Total: {transactions.length} Transactions</span>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#8B1E3F]" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/70 text-foreground font-serif text-sm">
                    <tr>
                      <th className="p-4">Order / Txn ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="p-4 font-mono">
                          <div className="font-bold text-[#8B1E3F]">{t.order_id || `TXN-${t.id}`}</div>
                          <div className="text-[10px] text-muted-foreground">{t.payment_id || 'Direct'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{t.customer_name || 'Member'}</div>
                          <div className="text-[10px] text-muted-foreground">{t.customer_email || t.customer_phone || 'N/A'}</div>
                        </td>
                        <td className="p-4 font-semibold capitalize text-foreground">
                          {t.plan?.name || 'Gold'}
                        </td>
                        <td className="p-4 font-serif font-bold text-[#8B1E3F]">
                          ₹{typeof t.amount === 'number' ? t.amount.toLocaleString() : parseFloat(t.amount || '0').toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.purchase_type === 'OFFLINE'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {t.purchase_type || 'ONLINE'}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant="verified">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> {t.status || 'SUCCESS'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right text-muted-foreground">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <Receipt className="h-8 w-8 text-stone-300 mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">No transactions recorded yet.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: Record Offline Payment */}
      {activeTab === 'recordOffline' && (
        <Card className="p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="font-serif text-xl font-bold text-foreground">Record Offline Membership Payment</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              POST /api/membership/transactions/offline - Activates plan credits and records revenue for cash, bank transfers, or manual UPI payments.
            </p>
          </div>

          <form onSubmit={handleRecordOffline} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">User ID *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={offlineForm.user_id}
                  onChange={e => setOfflineForm(prev => ({ ...prev, user_id: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Select Plan *</label>
                <select
                  value={offlineForm.plan_id}
                  onChange={e => {
                    const selId = parseInt(e.target.value, 10);
                    const matchedPlan = plans.find(p => p.id === selId);
                    setOfflineForm(prev => ({
                      ...prev,
                      plan_id: selId,
                      amount: matchedPlan ? Number(matchedPlan.price) : prev.amount
                    }));
                  }}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={offlineForm.amount}
                  onChange={e => setOfflineForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={offlineForm.customer_name || ''}
                  onChange={e => setOfflineForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Customer Email</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={offlineForm.customer_email || ''}
                  onChange={e => setOfflineForm(prev => ({ ...prev, customer_email: e.target.value }))}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Customer Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={offlineForm.customer_phone || ''}
                  onChange={e => setOfflineForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Payment Notes / Reference</label>
              <textarea
                rows={2}
                placeholder="e.g. Paid via GPay / Cheque Ref #12345"
                value={offlineForm.notes || ''}
                onChange={e => setOfflineForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
              />
            </div>

            <Button
              type="submit"
              disabled={submittingOffline}
              className="w-full bg-[#8B1E3F] hover:bg-[#721733] text-white font-bold h-10 shadow-md flex items-center justify-center gap-2"
            >
              {submittingOffline ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Submit Offline Payment & Activate Plan
            </Button>
          </form>
        </Card>
      )}

      {/* CREATE PLAN MODAL */}
      {isCreatePlanOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="font-serif text-xl font-bold text-foreground">Create Membership Plan</h3>
                <p className="text-[11px] text-muted-foreground">POST /api/membership/plans/</p>
              </div>
              <button
                onClick={() => setIsCreatePlanOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 rounded-full hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Plan Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diamond VIP"
                    value={planForm.name}
                    onChange={e => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={planForm.price}
                    onChange={e => setPlanForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Profile Credits *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={planForm.profile_credits}
                    onChange={e => setPlanForm(prev => ({ ...prev, profile_credits: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Validity Days</label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.validity_days || 30}
                    onChange={e => setPlanForm(prev => ({ ...prev, validity_days: parseInt(e.target.value, 10) || 30 }))}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Profile Boosts</label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.profile_boost_count || 0}
                    onChange={e => setPlanForm(prev => ({ ...prev, profile_boost_count: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.unlimited_messaging}
                    onChange={e => setPlanForm(prev => ({ ...prev, unlimited_messaging: e.target.checked }))}
                    className="accent-[#8B1E3F] rounded"
                  />
                  <span className="text-foreground font-medium">Allow Unlimited Direct Messaging</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_featured_profile}
                    onChange={e => setPlanForm(prev => ({ ...prev, is_featured_profile: e.target.checked }))}
                    className="accent-[#8B1E3F] rounded"
                  />
                  <span className="text-foreground font-medium">Highlight as Featured Spotlight Profile</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={e => setPlanForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="accent-[#8B1E3F] rounded"
                  />
                  <span className="text-foreground font-medium">Set Plan as Active (Visible to users)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreatePlanOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingPlan}
                  className="bg-[#8B1E3F] hover:bg-[#721733] text-white font-bold px-4"
                >
                  {creatingPlan ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Publish Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
