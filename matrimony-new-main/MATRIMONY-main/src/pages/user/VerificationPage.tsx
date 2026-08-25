import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Upload, Camera, Mail, Smartphone } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const { showToast } = useApp();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Profile Trust & Verification</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Complete verification steps to earn the verified badge and build trust with prospective families.</p>
      </div>

      <div className="space-y-4">
        
        {/* Step 1: Email */}
        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">1. Email Verification</h4>
              <p className="text-xs text-muted-foreground">Verification link sent to rahul.sharma@example.com</p>
            </div>
          </div>
          <Badge variant="verified">Verified</Badge>
        </Card>

        {/* Step 2: Mobile OTP */}
        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">2. Mobile OTP Verification</h4>
              <p className="text-xs text-muted-foreground">OTP code verified for +91 98765 43210</p>
            </div>
          </div>
          <Badge variant="verified">Verified</Badge>
        </Card>

        {/* Step 3: Govt ID */}
        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">3. Government ID Verification</h4>
              <p className="text-xs text-muted-foreground">Upload Aadhaar, Passport or Driving License for identity proof.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => showToast('ID Document uploaded! Moderation review pending.')}>
            Upload Govt ID
          </Button>
        </Card>

        {/* Step 4: Face Verification */}
        <Card className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base">4. Face Selfie Verification</h4>
              <p className="text-xs text-muted-foreground">Live selfie check matching your uploaded profile photo.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => showToast('Camera opened for selfie verification')}>
            Take Live Selfie
          </Button>
        </Card>

      </div>
    </div>
  );
};
