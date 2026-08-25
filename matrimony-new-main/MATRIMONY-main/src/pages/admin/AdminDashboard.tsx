import React from 'react';
import {
  ADMIN_KPI_STATS,
  REVENUE_GROWTH_DATA,
  GENDER_RATIO_DATA,
  RELIGION_BREAKDOWN_DATA,
  CITY_STATISTICS_DATA
} from '../../data/mockAdminData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="mb-1">Platform Operations</Badge>
          <h1 className="font-serif text-3xl font-bold text-foreground">SaaS Admin Control Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time system health, revenue growth analytics, and moderation queues.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/admin/verifications"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B1E3F] hover:bg-[#721733] text-white text-xs font-bold shadow-md transition-colors"
          >
            Identity Verifications Queue
          </a>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV Report
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-5 space-y-2 border-l-4 border-l-[#8B1E3F]">
          <span className="text-xs text-muted-foreground font-semibold">Total Registered Users</span>
          <h3 className="font-serif text-3xl font-bold text-foreground">{ADMIN_KPI_STATS.totalUsers.toLocaleString()}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +420 registered today
          </span>
        </Card>

        <Card className="p-5 space-y-2 border-l-4 border-l-[#D4AF37]">
          <span className="text-xs text-muted-foreground font-semibold">Total Platform Revenue</span>
          <h3 className="font-serif text-3xl font-bold text-[#8B1E3F]">{ADMIN_KPI_STATS.totalRevenue}</h3>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +24% YoY Growth
          </span>
        </Card>

        <Card className="p-5 space-y-2 border-l-4 border-l-emerald-600">
          <span className="text-xs text-muted-foreground font-semibold">Active Premium Members</span>
          <h3 className="font-serif text-3xl font-bold text-emerald-800">{ADMIN_KPI_STATS.premiumUsers.toLocaleString()}</h3>
          <span className="text-[11px] text-muted-foreground">Gold & Platinum Subscriptions</span>
        </Card>

        <Card className="p-5 space-y-2 border-l-4 border-l-rose-500">
          <span className="text-xs text-muted-foreground font-semibold">Pending Approvals</span>
          <h3 className="font-serif text-3xl font-bold text-rose-600">{ADMIN_KPI_STATS.pendingApprovals}</h3>
          <span className="text-[11px] text-amber-700 font-semibold">Profile & Photo queue</span>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Revenue Growth Area Chart */}
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Revenue Growth & Subscription Conversion (Lakhs)</h3>
              <p className="text-xs text-muted-foreground">Monthly subscription income trajectory over past 7 months</p>
            </div>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_GROWTH_DATA}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B1E3F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B1E3F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" style={{ fontSize: 12 }} />
                <YAxis style={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8B1E3F" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gender Ratio Pie Chart */}
        <Card className="lg:col-span-4 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-foreground">Gender Demographics</h3>
            <p className="text-xs text-muted-foreground">Bride vs. Groom ratio</p>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={GENDER_RATIO_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {GENDER_RATIO_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs font-semibold">
            <span className="flex items-center gap-2 text-[#8B1E3F]"><span className="h-3 w-3 rounded-full bg-[#8B1E3F]" /> Male (Groom) 54%</span>
            <span className="flex items-center gap-2 text-[#C44569]"><span className="h-3 w-3 rounded-full bg-[#C44569]" /> Female (Bride) 46%</span>
          </div>
        </Card>

      </div>

      {/* Secondary Bar Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* City Demographics Bar Chart */}
        <Card className="lg:col-span-6 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground">Top Metro & NRI Member Hubs</h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CITY_STATISTICS_DATA}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="city" style={{ fontSize: 10 }} />
                <YAxis style={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="profiles" fill="#C44569" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Religion Breakdown Table / Chart */}
        <Card className="lg:col-span-6 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground">Community & Religion Share</h3>
          <div className="space-y-3 pt-2 text-xs">
            {RELIGION_BREAKDOWN_DATA.map(r => (
              <div key={r.name} className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>{r.name} Community</span>
                  <span className="text-[#8B1E3F]">{r.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8B1E3F] to-[#D4AF37]" style={{ width: `${r.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
};
