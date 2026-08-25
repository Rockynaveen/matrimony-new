import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserSidebar } from './UserSidebar';
import { LayoutDashboard, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

export const UserLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 select-none">
      
      {/* Mobile Collapsible Navigation Menu Toggle Bar (Visible on mobile screens < md) */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-white border border-stone-200 rounded-2xl shadow-xs text-stone-900 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-xs font-extrabold">User Workspace Navigation</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#8B1E3F] bg-[#8B1E3F]/10 px-3 py-1.5 rounded-xl border border-[#8B1E3F]/20">
            <span>{isMobileMenuOpen ? 'Hide Menu' : 'Menu'}</span>
            {isMobileMenuOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </button>

        {/* Collapsible Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="mt-3 animate-fade-in">
            <UserSidebar onNavClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Desktop Permanent Left Sidebar (Hidden on mobile, block on md+) */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-24 z-20">
          <UserSidebar />
        </div>

        {/* Main Page Content Area (Full width on mobile, col-span-8/9 on desktop) */}
        <div className="w-full md:col-span-8 lg:col-span-9 min-w-0">
          <Outlet />
        </div>

      </div>
    </div>
  );
};
