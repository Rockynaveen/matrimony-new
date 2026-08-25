import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, Database, Save, Key } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { showToast } = useApp();

  const [gstRate, setGstRate] = useState('18');
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [cashfreeEnabled, setCashfreeEnabled] = useState(true);

  const [rolesState] = useState([
    { role: 'Super Admin', viewUsers: true, editUsers: true, deleteUsers: true, managePayments: true, systemSettings: true },
    { role: 'Admin', viewUsers: true, editUsers: true, deleteUsers: false, managePayments: true, systemSettings: false },
    { role: 'Moderator', viewUsers: true, editUsers: true, deleteUsers: false, managePayments: false, systemSettings: false },
    { role: 'Support', viewUsers: true, editUsers: false, deleteUsers: false, managePayments: false, systemSettings: false },
    { role: 'Marriage Bureau', viewUsers: true, editUsers: false, deleteUsers: false, managePayments: false, systemSettings: false }
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Super Admin System Configuration Saved!');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Super Admin Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white p-8 rounded-3xl shadow-2xl">
        <div>
          <Badge variant="gold" className="bg-amber-400/20 text-amber-300 border-amber-400/40 mb-2">
            <Key className="h-3.5 w-3.5 mr-1" /> Root Super Admin Master Control
          </Badge>
          <h1 className="font-serif text-3xl font-bold">System Infrastructure & Roles</h1>
          <p className="text-xs text-stone-300 mt-1">Configure global application parameters, role matrix, tax rates & backup routines.</p>
        </div>
        <Button variant="gold" size="lg" onClick={() => showToast('Full System Diagnostic Report Generated')} className="font-bold shrink-0">
          <ActivityIcon className="h-4 w-4 mr-1" /> System Health Diagnostics
        </Button>
      </div>

      {/* Health Monitoring Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">Database Latency</span>
          <h3 className="font-serif text-2xl font-bold text-emerald-700">14 ms</h3>
          <span className="text-[11px] text-emerald-600 font-semibold">PostgreSQL Healthy</span>
        </Card>

        <Card className="p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">API Server Uptime</span>
          <h3 className="font-serif text-2xl font-bold text-foreground">99.99%</h3>
          <span className="text-[11px] text-muted-foreground">AWS Cluster Mumbai</span>
        </Card>

        <Card className="p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">SMS Gateway</span>
          <h3 className="font-serif text-2xl font-bold text-emerald-700">Active</h3>
          <span className="text-[11px] text-muted-foreground">Twilio / DLT Verified</span>
        </Card>

        <Card className="p-5 space-y-2">
          <span className="text-xs text-muted-foreground font-semibold">Last Backup</span>
          <h3 className="font-serif text-2xl font-bold text-purple-700">2 Hours Ago</h3>
          <span className="text-[11px] text-muted-foreground">S3 Encrypted Storage</span>
        </Card>
      </div>

      {/* Role Matrix */}
      <Card className="p-6 space-y-4">
        <h3 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#8B1E3F]" /> Roles & Access Control Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-foreground font-serif text-sm">
              <tr>
                <th className="p-3">Role Title</th>
                <th className="p-3 text-center">View Users</th>
                <th className="p-3 text-center">Edit Users</th>
                <th className="p-3 text-center">Delete Users</th>
                <th className="p-3 text-center">Manage Payments</th>
                <th className="p-3 text-center">System Config</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rolesState.map(r => (
                <tr key={r.role}>
                  <td className="p-3 font-bold text-foreground">{r.role}</td>
                  <td className="p-3 text-center"><input type="checkbox" checked={r.viewUsers} onChange={() => {}} className="accent-[#8B1E3F]" /></td>
                  <td className="p-3 text-center"><input type="checkbox" checked={r.editUsers} onChange={() => {}} className="accent-[#8B1E3F]" /></td>
                  <td className="p-3 text-center"><input type="checkbox" checked={r.deleteUsers} onChange={() => {}} className="accent-[#8B1E3F]" /></td>
                  <td className="p-3 text-center"><input type="checkbox" checked={r.managePayments} onChange={() => {}} className="accent-[#8B1E3F]" /></td>
                  <td className="p-3 text-center"><input type="checkbox" checked={r.systemSettings} onChange={() => {}} className="accent-[#8B1E3F]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Global Config Settings */}
      <Card className="p-6 space-y-6">
        <h3 className="font-serif text-xl font-bold text-foreground">Application Payment & Tax Configurations</h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">GST Tax Rate (%)</label>
              <input
                type="number"
                value={gstRate}
                onChange={e => setGstRate(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-xl p-2.5 text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-xl">
              <span className="text-xs font-semibold">Razorpay UPI Gateway</span>
              <input type="checkbox" checked={razorpayEnabled} onChange={e => setRazorpayEnabled(e.target.checked)} className="accent-[#8B1E3F]" />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-xl">
              <span className="text-xs font-semibold">Cashfree Direct Gateway</span>
              <input type="checkbox" checked={cashfreeEnabled} onChange={e => setCashfreeEnabled(e.target.checked)} className="accent-[#8B1E3F]" />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-between items-center">
            <Button type="button" variant="outline" size="sm" onClick={() => showToast('Automated Database Backup initiated')}>
              <Database className="h-4 w-4 mr-2 text-primary" /> Trigger Backup Now
            </Button>

            <Button type="submit" variant="primary" size="md" className="font-bold">
              <Save className="h-4 w-4 mr-2" /> Save Super Admin Configuration
            </Button>
          </div>
        </form>
      </Card>

    </div>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
