import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { UserPlus, Search, Heart, Handshake } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <ScrollReveal direction="up">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="gold">Matchmaking Process</Badge>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
            How Vivah Brings Perfect Partners Together
          </h1>
          <p className="text-base text-muted-foreground">
            A seamless 4-step path designed for trust, privacy, and meaningful relationship building.
          </p>
        </div>
      </ScrollReveal>

      <div className="space-y-8">
        
        {/* Step 1 */}
        <ScrollReveal direction="up" delay={0.1}>
          <Card className="p-8 flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-[#8B1E3F]">
            <div className="h-20 w-20 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0">
              <UserPlus className="h-10 w-10" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B1E3F]">Step 01</span>
              <h3 className="font-serif text-2xl font-bold">Create Your Detailed Profile</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Register for free and provide comprehensive information about your education, career, family values, horoscope details, lifestyle preferences, and profile photos.
              </p>
            </div>
          </Card>
        </ScrollReveal>

        {/* Step 2 */}
        <ScrollReveal direction="up" delay={0.2}>
          <Card className="p-8 flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-[#C44569]">
            <div className="h-20 w-20 rounded-2xl bg-[#C44569]/10 text-[#C44569] flex items-center justify-center shrink-0">
              <Search className="h-10 w-10" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C44569]">Step 02</span>
              <h3 className="font-serif text-2xl font-bold">Discover AI Recommended Matches</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use our advanced filters to search by religion, caste, profession, income, city, or NRI location. Our AI compatibility engine highlights profiles with high match scores.
              </p>
            </div>
          </Card>
        </ScrollReveal>

        {/* Step 3 */}
        <ScrollReveal direction="up" delay={0.3}>
          <Card className="p-8 flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-[#D4AF37]">
            <div className="h-20 w-20 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0">
              <Heart className="h-10 w-10" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Step 03</span>
              <h3 className="font-serif text-2xl font-bold">Connect & Communicate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send free interest requests. Once accepted, start instant chat messaging, exchange verified contact details, or request photo access while enjoying full privacy protection.
              </p>
            </div>
          </Card>
        </ScrollReveal>

        {/* Step 4 */}
        <ScrollReveal direction="up" delay={0.4}>
          <Card className="p-8 flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-emerald-600">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <Handshake className="h-10 w-10" />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Step 04</span>
              <h3 className="font-serif text-2xl font-bold">Family Intro & Marriage</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Initiate family meetings with confidence. Our relationship managers assist in coordinating initial family calls to ensure a smooth transition to marriage.
              </p>
            </div>
          </Card>
        </ScrollReveal>

      </div>

      <ScrollReveal direction="up">
        <div className="text-center pt-6">
          <Button size="lg" variant="primary" onClick={() => navigate('/register')}>
            Start Your Journey - Register Free Profile
          </Button>
        </div>
      </ScrollReveal>

    </div>
  );
};
