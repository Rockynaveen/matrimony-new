import React from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="gold">About Vivah Matrimony</Badge>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          Connecting Hearts & Families Across the World
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Founded with a passion for preserving traditional matrimonial harmony while leveraging state-of-the-art matchmaking AI, Vivah is India’s most trusted matrimonial network.
        </p>
      </div>

      {/* Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <Badge variant="primary">Our Mission</Badge>
          <h2 className="font-serif text-3xl font-bold text-[#8B1E3F]">
            Redefining Matchmaking with Trust & Respect
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We believe marriage is not just a union of two individuals, but a lifelong bond between two families. Our platform provides a safe, dignified, and intelligent space where people can find life partners who match their cultural values, career goals, lifestyle, and horoscope alignment.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="border border-border/80 rounded-2xl p-4 bg-white shadow-2xs">
              <h4 className="font-serif text-2xl font-bold text-[#8B1E3F]">100%</h4>
              <p className="text-xs text-muted-foreground mt-1">Manual Verification</p>
            </div>
            <div className="border border-border/80 rounded-2xl p-4 bg-white shadow-2xs">
              <h4 className="font-serif text-2xl font-bold text-[#8B1E3F]">4.9 / 5</h4>
              <p className="text-xs text-muted-foreground mt-1">Trust Score Rating</p>
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
          <img src="/images/hero_couple.png" alt="About Vivah Matrimony" className="w-full h-[400px] object-cover" />
        </div>
      </div>

      {/* Core Pillars */}
      <div className="space-y-8">
        <h3 className="font-serif text-2xl font-bold text-center">Our Core Values</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <ShieldCheck className="h-8 w-8 text-[#8B1E3F]" />
            <h4 className="font-serif text-lg font-bold">Absolute Security</h4>
            <p className="text-xs text-muted-foreground">Rigorous identity checks and strict data encryption standards for maximum family peace of mind.</p>
          </Card>
          <Card className="p-6 space-y-3">
            <Sparkles className="h-8 w-8 text-[#D4AF37]" />
            <h4 className="font-serif text-lg font-bold">Algorithmic Excellence</h4>
            <p className="text-xs text-muted-foreground">AI matching based on horoscope dosha alignment, diet, education, and mutual partner preferences.</p>
          </Card>
          <Card className="p-6 space-y-3">
            <Heart className="h-8 w-8 text-[#C44569]" />
            <h4 className="font-serif text-lg font-bold">Compassionate Support</h4>
            <p className="text-xs text-muted-foreground">Relationship managers and 24/7 customer care to assist you at every step of your partner search.</p>
          </Card>
        </div>
      </div>

    </div>
  );
};
