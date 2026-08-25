import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_BUREAU_CLIENTS } from '../../data/mockBureauData';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Building2, Plus } from 'lucide-react';

export const BureauDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#8B1E3F] to-[#C44569] text-white p-8 rounded-3xl shadow-xl">
        <div>
          <Badge variant="gold" className="bg-amber-400/20 text-amber-200 border-amber-400/30 mb-2">
            <Building2 className="h-3.5 w-3.5 mr-1" /> Royal Alliance Marriage Bureau Partner
          </Badge>
          <h1 className="font-serif text-3xl font-bold">Marriage Bureau Agent Portal</h1>
          <p className="text-xs text-rose-100 mt-1">Manage family client profiles, matchmaking leads & earned commissions.</p>
        </div>
        <Button variant="gold" size="lg" onClick={() => navigate('/bureau/create-profile')} className="font-bold shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Add New Client Profile
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">Total Bureau Clients</span>
          <h3 className="font-serif text-3xl font-bold text-[#8B1E3F]">34</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">+4 added this month</p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">Matched Clients</span>
          <h3 className="font-serif text-3xl font-bold text-emerald-700">18</h3>
          <p className="text-[11px] text-muted-foreground">Successful engagements</p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">Active Leads</span>
          <h3 className="font-serif text-3xl font-bold text-purple-700">12</h3>
          <p className="text-[11px] text-muted-foreground">Family consultations</p>
        </Card>

        <Card className="p-6 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">Total Earnings</span>
          <h3 className="font-serif text-3xl font-bold text-amber-700">₹48,500</h3>
          <p className="text-[11px] text-emerald-600 font-semibold">20% commission tier</p>
        </Card>
      </div>

      {/* Clients Management Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-foreground">Managed Client Profiles</h3>
          <Button size="sm" variant="outline" onClick={() => navigate('/bureau/clients')}>
            View All Clients
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/70 text-foreground font-serif text-sm">
                <tr>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Age / Gender</th>
                  <th className="p-4">Religion / Caste</th>
                  <th className="p-4">Budget Plan</th>
                  <th className="p-4">Matches</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {MOCK_BUREAU_CLIENTS.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20">
                    <td className="p-4 font-bold text-foreground">{c.name}</td>
                    <td className="p-4 text-muted-foreground">{c.age} yrs • {c.gender}</td>
                    <td className="p-4 text-muted-foreground">{c.religion} • {c.caste}</td>
                    <td className="p-4 font-semibold text-[#8B1E3F]">{c.budget}</td>
                    <td className="p-4 font-bold text-emerald-700">{c.matchesFound} Matches</td>
                    <td className="p-4"><Badge variant="verified">{c.status}</Badge></td>
                    <td className="p-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/bureau/clients/${c.id}`)} className="text-xs h-7">
                        View Client
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
};
