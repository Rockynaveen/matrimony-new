import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, CreditCard, UserCheck, MessageSquare, PhoneCall } from 'lucide-react';

export const HelpCenter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary">Support Portal</Badge>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          How Can We Help You?
        </h1>
        <div className="relative max-w-xl mx-auto mt-4">
          <Search className="h-5 w-5 text-muted-foreground absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search topics: verification, billing, privacy settings..."
            className="w-full bg-white border border-border rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 space-y-3 cursor-pointer hover:border-primary/40" onClick={() => navigate('/faqs')}>
          <UserCheck className="h-8 w-8 text-[#8B1E3F]" />
          <h3 className="font-serif text-lg font-bold">Profile Creation</h3>
          <p className="text-xs text-muted-foreground">Guidelines on photos, education, partner preferences and completion rate.</p>
        </Card>

        <Card className="p-6 space-y-3 cursor-pointer hover:border-primary/40" onClick={() => navigate('/faqs')}>
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
          <h3 className="font-serif text-lg font-bold">Account Verification</h3>
          <p className="text-xs text-muted-foreground">Government ID upload, face selfie check and verified badge rules.</p>
        </Card>

        <Card className="p-6 space-y-3 cursor-pointer hover:border-primary/40" onClick={() => navigate('/faqs')}>
          <CreditCard className="h-8 w-8 text-[#D4AF37]" />
          <h3 className="font-serif text-lg font-bold">Membership & Invoices</h3>
          <p className="text-xs text-muted-foreground">UPI / Card billing queries, refund policy, GST invoices & package upgrades.</p>
        </Card>

        <Card className="p-6 space-y-3 cursor-pointer hover:border-primary/40" onClick={() => navigate('/faqs')}>
          <MessageSquare className="h-8 w-8 text-[#C44569]" />
          <h3 className="font-serif text-lg font-bold">Privacy & Blocking</h3>
          <p className="text-xs text-muted-foreground">Hiding phone numbers, blocking abusive users & reporting fake profiles.</p>
        </Card>
      </div>

      <div className="bg-[#8B1E3F]/5 border border-[#8B1E3F]/20 rounded-3xl p-8 text-center space-y-4">
        <h3 className="font-serif text-2xl font-bold text-[#8B1E3F]">Need Direct Assistance?</h3>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Our customer support specialists are available 7 days a week from 9:00 AM to 9:00 PM IST.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="primary" onClick={() => navigate('/contact')}>
            <PhoneCall className="h-4 w-4 mr-2" /> Contact Support Team
          </Button>
        </div>
      </div>
    </div>
  );
};
