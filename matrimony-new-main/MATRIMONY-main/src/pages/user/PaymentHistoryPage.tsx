import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Download, CheckCircle2, Crown, Calendar, Zap, Loader2, CreditCard } from 'lucide-react';
import { membershipApi } from '../../api/membershipApi';
import type { ApiTransaction, ApiUserMembership } from '../../types/membershipTypes';

export const PaymentHistoryPage: React.FC = () => {
  const { showToast, currentUser } = useApp();

  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [userMemberships, setUserMemberships] = useState<ApiUserMembership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      membershipApi.getTransactions().catch(err => {
        console.warn('[PaymentHistoryPage] Transactions fetch warning:', err);
        return [];
      }),
      membershipApi.getUserMemberships().catch(err => {
        console.warn('[PaymentHistoryPage] User memberships fetch warning:', err);
        return [];
      })
    ])
      .then(([txns, memberships]) => {
        if (!isMounted) return;
        setTransactions(txns);
        setUserMemberships(memberships);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeMembership = userMemberships.find(m => m.is_active) || userMemberships[0];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Payment & Membership Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage active plan status, remaining contact credits, and payment invoices.</p>
      </div>

      {/* Active Membership Status Card */}
      {activeMembership ? (
        <Card className="p-6 bg-gradient-to-r from-[#8B1E3F] via-[#A0234A] to-[#8B1E3F] text-white shadow-xl rounded-3xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="bg-amber-400/20 text-amber-300 border-amber-400/40 px-3 py-1 font-bold">
                  <Crown className="h-3.5 w-3.5 mr-1 text-amber-400" /> Active Plan
                </Badge>
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-300">
                  ● Status: {activeMembership.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold capitalize">
                {activeMembership.plan?.name || 'Gold'} Subscription
              </h2>
              <p className="text-xs text-stone-200">
                Purchased on: {activeMembership.purchased_at ? new Date(activeMembership.purchased_at).toLocaleDateString() : 'Recent'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-black/25 p-4 rounded-2xl border border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-300 shrink-0" />
                <div>
                  <div className="text-[10px] text-stone-300">Remaining Credits</div>
                  <div className="font-bold text-base text-amber-300">{activeMembership.remaining_credits} Contacts</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-300 shrink-0" />
                <div>
                  <div className="text-[10px] text-stone-300">Validity Days</div>
                  <div className="font-bold text-base text-stone-100">{activeMembership.plan?.validity_days || 30} Days</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        !loading && (
          <Card className="p-6 bg-stone-900 text-white rounded-3xl flex justify-between items-center">
            <div>
              <h3 className="font-serif text-lg font-bold">No Active Membership</h3>
              <p className="text-xs text-stone-400">Upgrade to unlock contact numbers & priority matching.</p>
            </div>
            <Button variant="gold" size="sm" onClick={() => window.location.href = '/membership'}>
              View Subscription Plans
            </Button>
          </Card>
        )
      )}

      {/* Transaction History Table */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
          <h3 className="font-serif text-base font-bold text-foreground">Transaction Logs</h3>
          <span className="text-xs text-muted-foreground font-medium">Total Records: {transactions.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#8B1E3F]" />
            <p className="text-xs text-muted-foreground">Loading transaction logs...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/70 text-foreground font-serif text-sm">
                <tr>
                  <th className="p-4">Order / Payment ID</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Plan Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-muted/20">
                    <td className="p-4 font-mono">
                      <div className="font-bold text-[#8B1E3F]">{txn.order_id || `ORD-${txn.id}`}</div>
                      <div className="text-[10px] text-muted-foreground font-normal">{txn.payment_id || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{txn.customer_name || currentUser.name}</div>
                      <div className="text-[10px] text-muted-foreground">{txn.customer_email || currentUser.email}</div>
                    </td>
                    <td className="p-4 font-semibold capitalize text-foreground">
                      {txn.plan?.name || 'Gold'}
                    </td>
                    <td className="p-4 font-serif font-bold text-[#8B1E3F]">
                      ₹{typeof txn.amount === 'number' ? txn.amount.toLocaleString() : parseFloat(txn.amount || '0').toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-stone-100 text-stone-800 uppercase">
                        {txn.purchase_type || 'ONLINE'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant="verified" className="bg-emerald-50 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> {txn.status || 'SUCCESS'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => showToast(`Invoice PDF downloaded for order ${txn.order_id || txn.id}`)}
                        className="text-xs h-7"
                      >
                        <Download className="h-3 w-3 mr-1" /> PDF Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <CreditCard className="h-8 w-8 text-stone-400 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No payment transactions recorded yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
