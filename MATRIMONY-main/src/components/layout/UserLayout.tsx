import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UserSidebar } from './UserSidebar';
import { Menu, X } from 'lucide-react';

export const UserLayout: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 select-none">
      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Permanent Left Sidebar - Always Visible */}
        <div className="w-full md:col-span-4 lg:col-span-3 sticky top-24 z-20">
          <UserSidebar />
        </div>

        {/* Main Content Area on Right */}
        <div className="w-full md:col-span-8 lg:col-span-9">
          <Outlet />
        </div>

      </div>
    </div>
  );
};
