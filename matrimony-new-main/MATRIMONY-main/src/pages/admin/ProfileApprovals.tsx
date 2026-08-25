import React, { useState } from 'react';
import { MOCK_PROFILE_APPROVALS } from '../../data/mockAdminData';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Check, X } from 'lucide-react';

export const ProfileApprovals: React.FC = () => {
  const { showToast } = useApp();
  const [approvals, setApprovals] = useState(MOCK_PROFILE_APPROVALS);

  const handleAction = (id: string, action: 'Approve' | 'Reject') => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    showToast(`Profile approval queue: ${action}d request ${id}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Pending Profile Approvals</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Review newly registered profiles before enabling search visibility.</p>
      </div>

      <div className="space-y-4">
        {approvals.map(item => (
          <Card key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={item.profileImage} className="h-16 w-16 rounded-2xl object-cover shrink-0" />
              <div>
                <h4 className="font-serif text-lg font-bold text-foreground">{item.name}, {item.age}</h4>
                <p className="text-xs text-muted-foreground">{item.profession} • {item.location}</p>
                <span className="text-[10px] text-muted-foreground/70 mt-1 block">Submitted: {item.submittedAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => handleAction(item.id, 'Approve')}>
                <Check className="h-4 w-4 mr-1" /> Approve Profile
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleAction(item.id, 'Reject')}>
                <X className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
