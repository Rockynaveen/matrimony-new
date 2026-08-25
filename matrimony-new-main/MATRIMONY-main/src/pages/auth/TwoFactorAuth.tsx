import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Smartphone, CheckCircle2, QrCode, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

export const TwoFactorAuth: React.FC = () => {
  const { currentUser, showToast } = useApp();
  const [enabled, setEnabled] = useState(currentUser.is2FAEnabled);

  const handleToggle = () => {
    setEnabled(!enabled);
    showToast(!enabled ? 'Two-Factor Authentication Enabled 🔒' : 'Two-Factor Authentication Disabled');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <Badge variant="gold">Enhanced Account Security</Badge>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Two-Factor Security (2FA)</h1>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Protect your matrimony profile with extra login verification layer via SMS or Authenticator App.
        </p>
      </div>

      <Card className="p-8 shadow-2xl bg-white rounded-3xl space-y-6">
        
        {/* Toggle Switch Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border border-border/80 rounded-2xl bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-foreground">Authenticator / SMS 2FA</h4>
              <p className="text-xs text-muted-foreground">Require 6-digit security token whenever logging in from unrecognized devices.</p>
            </div>
          </div>

          <Button
            variant={enabled ? 'secondary' : 'primary'}
            onClick={handleToggle}
            className="shrink-0 font-bold text-xs"
          >
            {enabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
          </Button>
        </div>

        {/* 2FA Details Section */}
        {enabled && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-2 border-t border-border/60"
          >
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Two-Factor Authentication is currently <strong>ACTIVE</strong> for mobile ending in *3210.</span>
            </div>

            {/* Simulated Authenticator QR Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-border/80 rounded-2xl bg-stone-50/50">
              <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-white border border-border rounded-xl">
                <QrCode className="h-32 w-32 text-foreground" />
                <span className="text-[10px] font-mono text-muted-foreground">Scan with Google Authenticator</span>
              </div>

              <div className="space-y-3 text-xs">
                <h5 className="font-serif font-bold text-sm text-[#8B1E3F]">Setup Authenticator App</h5>
                <p className="text-muted-foreground leading-relaxed">
                  1. Scan the QR code using Google Authenticator, Authy, or Microsoft Authenticator.<br />
                  2. Enter 6-digit security token on login.
                </p>

                <div className="pt-2">
                  <span className="text-[10px] text-muted-foreground block mb-1 font-semibold">Backup Secret Key</span>
                  <div className="flex items-center gap-2 bg-white p-2 border border-border rounded-xl font-mono text-xs">
                    <span className="font-bold">VIVAH-8920-X841-K992</span>
                    <button
                      onClick={() => showToast('Backup key copied to clipboard!')}
                      className="ml-auto p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </Card>
    </div>
  );
};
