import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserManagement: React.FC = () => {
  const { profiles, showToast } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const usersList = profiles.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">User Account Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Filter, suspend, activate or delete registered user accounts.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-foreground font-serif text-sm">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Gender</th>
                <th className="p-4">Location</th>
                <th className="p-4">Membership</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="p-4 flex items-center gap-3">
                    <img src={u.profileImage} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    <div>
                      <h5 className="font-bold text-foreground">{u.name}</h5>
                      <span className="text-[10px] text-muted-foreground">{u.id}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.gender} • {u.age} yrs</td>
                  <td className="p-4 text-muted-foreground">{u.location.city}</td>
                  <td className="p-4 font-semibold text-[#8B1E3F]">GOLD Premier</td>
                  <td className="p-4">
                    {u.verified ? <Badge variant="verified">Verified</Badge> : <Badge variant="gold">Pending</Badge>}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/profile/${u.id}`)} className="text-xs h-7">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => showToast(`User ${u.name} status updated`)} className="text-xs h-7">
                      Suspend
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
