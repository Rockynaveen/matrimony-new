import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, PhoneCall, Mail, MapPin, Heart, Building2, Headphones } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#6B0F2B] text-white overflow-hidden pt-12 pb-8">
      {/* Top Smooth Wave Curve Transition */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none -translate-y-[99%]">
        <svg
          viewBox="0 0 1440 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 sm:h-16 text-[#6B0F2B] preserve-3d"
        >
          <path
            d="M0 64C240 18 480 0 720 0C960 0 1200 18 1440 64V64H0Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Subtle Corner Flourishes */}
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent pointer-events-none rounded-tr-full" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#D4AF37]/10 to-transparent pointer-events-none rounded-tl-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/15">
          
          {/* Brand Info (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-block group">
              <div className="bg-white/95 px-4 py-2 rounded-2xl border border-amber-300/40 shadow-sm inline-flex items-center group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/images/logo final.png"
                  alt="Vivah Matrimony Logo"
                  className="h-10 sm:h-12 w-auto object-contain max-h-12"
                />
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-rose-100/80 max-w-sm leading-relaxed">
              India's premier matrimony platform dedicated to bringing compatible life partners together through verified profiles, privacy control, and AI-powered compatibility algorithms.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-200 bg-[#78350F]/70 px-3 py-1.5 rounded-full border border-amber-400/40 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                <span>100% ID Verified Profiles</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-pink-200 bg-[#831843]/70 px-3 py-1.5 rounded-full border border-pink-400/40 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-pink-300" />
                <span>ISO Security Standard</span>
              </div>
            </div>
          </div>

          {/* Discover Matches (col-span-2) */}
          <div className="lg:col-span-2">
            <h4 className="flex items-center gap-2 font-serif text-sm font-semibold text-white mb-3.5">
              <Heart className="h-3.5 w-3.5 text-rose-300" />
              <span>Discover Matches</span>
            </h4>
            <ul className="space-y-2 text-xs text-rose-100/75">
              <li><Link to="/search" className="hover:text-amber-300 transition-colors">Advanced Search</Link></li>
              <li><Link to="/matches" className="hover:text-amber-300 transition-colors">Recommended Matches</Link></li>
              <li><Link to="/preferences" className="hover:text-amber-300 transition-colors">Partner Preferences</Link></li>
              <li><Link to="/search?caste=Brahmin" className="hover:text-amber-300 transition-colors">Brahmin Matrimony</Link></li>
              <li><Link to="/search?caste=Rajput" className="hover:text-amber-300 transition-colors">Rajput Matrimony</Link></li>
              <li><Link to="/search?country=USA" className="hover:text-amber-300 transition-colors">NRI Matrimony USA</Link></li>
            </ul>
          </div>

          {/* Company (col-span-2) */}
          <div className="lg:col-span-2">
            <h4 className="flex items-center gap-2 font-serif text-sm font-semibold text-white mb-3.5">
              <Building2 className="h-3.5 w-3.5 text-rose-300" />
              <span>Company</span>
            </h4>
            <ul className="space-y-2 text-xs text-rose-100/75">
              <li><Link to="/about" className="hover:text-amber-300 transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-amber-300 transition-colors">How It Works</Link></li>
              <li><Link to="/membership" className="hover:text-amber-300 transition-colors">Membership Plans</Link></li>
              <li><Link to="/success-stories" className="hover:text-amber-300 transition-colors">Success Stories</Link></li>
              <li><Link to="/faqs" className="hover:text-amber-300 transition-colors">FAQs & Help</Link></li>
              <li><Link to="/privacy-settings" className="hover:text-amber-300 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Customer Support (col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="flex items-center gap-2 font-serif text-sm font-semibold text-white mb-3.5">
              <Headphones className="h-3.5 w-3.5 text-rose-300" />
              <span>Customer Support</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-rose-100/80">
              <li className="flex items-center gap-2">
                <PhoneCall className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span>+91 1800-889-2020 (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                <span>support@vivahmatich.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span>Vivah Towers, Bandra Kurla Complex, Mumbai, MH 400051</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-rose-200/70">
          <p>© 2026 Vivah Matrimony Services Ltd. All rights reserved. Designed with precision for Indian families worldwide.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/help" className="hover:text-amber-300 hover:underline">Help Center</Link>
            <span className="text-rose-300/40">|</span>
            <Link to="/faqs" className="hover:text-amber-300 hover:underline">FAQs</Link>
            <span className="text-rose-300/40">|</span>
            <Link to="/contact" className="hover:text-amber-300 hover:underline">Contact Support</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
