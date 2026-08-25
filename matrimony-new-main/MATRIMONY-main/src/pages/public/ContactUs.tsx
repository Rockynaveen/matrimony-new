import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../context/AppContext';
import { PhoneCall, Mail, MapPin, Send } from 'lucide-react';

export const ContactUs: React.FC = () => {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Membership Inquiry');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Your message has been sent to our relationship team! We will contact you shortly.');
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary">Get In Touch</Badge>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
          We Are Here For You
        </h1>
        <p className="text-base text-muted-foreground">
          Have questions about membership, profile verification, or relationship services? Reach out today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 space-y-6">
            <h3 className="font-serif text-2xl font-bold text-[#8B1E3F]">Corporate Headquarters</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#8B1E3F] shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">Vivah Matrimony Services Ltd.</p>
                  <p className="text-muted-foreground">Vivah Towers, Level 8, BKC Financial Center, Bandra Kurla Complex, Mumbai, Maharashtra 400051</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <PhoneCall className="h-5 w-5 text-[#8B1E3F] shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Toll Free Phone</p>
                  <p className="text-muted-foreground">+91 1800-889-2020 (Mon - Sun, 9am - 9pm)</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#8B1E3F] shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Email Support</p>
                  <p className="text-muted-foreground">support@vivahmatch.com / vip@vivahmatch.com</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60">
              <h4 className="font-serif font-bold text-sm mb-2">Regional Offices</h4>
              <p className="text-xs text-muted-foreground">Delhi NCR • Bengaluru • Chennai • Hyderabad • Ahmedabad • London UK • San Jose USA</p>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-serif text-2xl font-bold text-foreground">Send Us a Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Inquiry Topic</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Membership Inquiry">Membership Inquiry</option>
                    <option value="Verification Assistance">Verification Assistance</option>
                    <option value="Matchmaking Consultation">Matchmaking Consultation</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Bureau Partnership">Bureau Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we assist you with your matrimonial search?"
                  className="w-full bg-muted/30 border border-border rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full font-semibold">
                <Send className="h-4 w-4 mr-2" /> Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
