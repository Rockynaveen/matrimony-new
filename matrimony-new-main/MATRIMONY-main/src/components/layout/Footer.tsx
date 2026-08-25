import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PhoneCall, Mail, MapPin, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#D4AF37]/30 traditional-mandala-bg text-[#F5ECE5] pt-16 pb-12 overflow-hidden relative">
      {/* Decorative Gold Radial Blur */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group">
              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-400/40 shadow-md inline-flex items-center group-hover:scale-[1.03] transition-transform duration-300">
                <img
                  src="/images/logo.png"
                  alt="Matrimony Logo"
                  className="h-12 sm:h-14 w-auto object-contain max-h-14"
                />
              </div>
            </Link>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              India's premier matrimonial platform dedicated to bringing compatible life partners together through verified profiles, privacy control, and AI-powered compatibility algorithms.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                <ShieldCheck className="h-4 w-4" /> 100% ID Verified Profiles
              </div>
              <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">
                <Lock className="h-4 w-4" /> ISO Security Standard
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-base font-semibold text-white mb-4">Discover Matches</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li><Link to="/search" className="hover:text-amber-400 transition-colors">Advanced Search</Link></li>
              <li><Link to="/matches" className="hover:text-amber-400 transition-colors">Recommended Matches</Link></li>
              <li><Link to="/preferences" className="hover:text-amber-400 transition-colors">Partner Preferences</Link></li>
              <li><Link to="/search?caste=Brahmin" className="hover:text-amber-400 transition-colors">Brahmin Matrimony</Link></li>
              <li><Link to="/search?caste=Rajput" className="hover:text-amber-400 transition-colors">Rajput Matrimony</Link></li>
              <li><Link to="/search?country=USA" className="hover:text-amber-400 transition-colors">NRI Matrimony USA</Link></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="font-serif text-base font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              <li><Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-amber-400 transition-colors">How It Works</Link></li>
              <li><Link to="/membership" className="hover:text-amber-400 transition-colors">Membership Plans</Link></li>
              <li><Link to="/success-stories" className="hover:text-amber-400 transition-colors">Success Stories</Link></li>
              <li><Link to="/faqs" className="hover:text-amber-400 transition-colors">FAQs & Help</Link></li>
              <li><Link to="/privacy-settings" className="hover:text-amber-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="font-serif text-base font-semibold text-white mb-4">Customer Support</h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-center gap-2.5">
                <PhoneCall className="h-4 w-4 text-[#C44569]" />
                <span>+91 1800-889-2020 (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#C44569]" />
                <span>support@vivahmatch.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#C44569] shrink-0 mt-1" />
                <span>Vivah Towers, Bandra Kurla Complex, Mumbai, MH 400051</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 Vivah Matrimony Services Ltd. All rights reserved. Designed with precision for Indian families worldwide.</p>
          <div className="flex gap-6">
            <Link to="/help" className="hover:underline">Help Center</Link>
            <Link to="/faqs" className="hover:underline">FAQs</Link>
            <Link to="/contact" className="hover:underline">Contact Support</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
