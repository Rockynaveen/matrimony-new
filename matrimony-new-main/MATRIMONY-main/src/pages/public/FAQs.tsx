import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ChevronDown } from 'lucide-react';

export const FAQs: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does profile verification work on Vivah?',
      a: 'We mandate a 4-step verification process: Email verification, Mobile OTP check, Government ID card upload (Aadhaar/Passport/Driving License), and a live Face Selfie match. Verified profiles display a green verified badge.'
    },
    {
      q: 'Is my personal phone number and photo safe on the platform?',
      a: 'Yes, absolutely. Under Privacy Settings, you can choose to hide your mobile number, email address, and photos. You can grant access individually when a match requests photo view permissions.'
    },
    {
      q: 'What is the difference between Free and Paid Gold/Platinum plans?',
      a: 'Free profiles can search and express limited interests. Paid Gold & Platinum members unlock unlimited direct chats, 30+ verified phone number unlocks, priority ranking on search results, and personalized Relationship Managers.'
    },
    {
      q: 'How does the AI Compatibility Score work?',
      a: 'Our proprietary algorithm evaluates horoscope dosha match, education levels, annual income expectations, lifestyle choices (diet/smoking), family values, and mutual partner preferences to output a 0-100% compatibility score.'
    },
    {
      q: 'Can parents or siblings create a profile on behalf of a candidate?',
      a: 'Yes! Over 40% of profiles on Vivah are managed by parents or relatives. During registration, simply select "Profile created by: Parent / Sibling".'
    }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <Badge variant="gold">Frequently Asked Questions</Badge>
        <h1 className="font-serif text-4xl font-bold text-foreground">
          Got Questions? We Have Answers.
        </h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card key={idx} className="overflow-hidden transition-all">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-6 text-left flex items-center justify-between font-serif text-lg font-bold text-foreground hover:text-[#8B1E3F]"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180 text-[#8B1E3F]' : 'text-muted-foreground'}`} />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4 bg-muted/20">
                  {faq.a}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
