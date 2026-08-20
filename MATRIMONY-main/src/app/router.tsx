import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Toast } from '../components/ui/Toast';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Public Pages
import { Home } from '../pages/public/Home';
import { AboutUs } from '../pages/public/AboutUs';
import { HowItWorks } from '../pages/public/HowItWorks';
import { MembershipPage } from '../pages/public/MembershipPage';
import { SuccessStoriesPage } from '../pages/public/SuccessStoriesPage';
import { HelpCenter } from '../pages/public/HelpCenter';
import { FAQs } from '../pages/public/FAQs';
import { ContactUs } from '../pages/public/ContactUs';

// Authentication Pages
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { CompleteBasicProfile } from '../pages/CompleteBasicProfile';
import { CompleteProfile } from '../pages/CompleteProfile';
import { VerifyOtp } from '../pages/auth/VerifyOtp';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { TwoFactorAuth } from '../pages/auth/TwoFactorAuth';
import { GoogleCallback } from '../pages/auth/GoogleCallback';

// User Pages
import { Dashboard } from '../pages/user/Dashboard';
import { SearchPage } from '../pages/user/Search';
import { MatchesPage } from '../pages/user/Matches';
import { ViewProfile } from '../pages/user/ViewProfile';
import { EditProfile } from '../pages/user/EditProfile';
import { MyProfilePage } from '../pages/user/MyProfilePage';
import { PreferencesPage } from '../pages/user/PreferencesPage';
import { InterestsPage } from '../pages/user/InterestsPage';
import { MessagesPage } from '../pages/user/MessagesPage';
import { ShortlistPage } from '../pages/user/Shortlist';
import { IgnoredProfilesPage } from '../pages/user/IgnoredProfiles';
import { BlockedProfilesPage } from '../pages/user/BlockedProfiles';
import { PhotosPage } from '../pages/user/PhotosPage';
import { VerificationPage } from '../pages/user/VerificationPage';
import { CheckoutPage } from '../pages/user/CheckoutPage';
import { PaymentHistoryPage } from '../pages/user/PaymentHistoryPage';
import { NotificationsPage } from '../pages/user/NotificationsPage';
import { PrivacySettingsPage } from '../pages/user/PrivacySettingsPage';

// Bureau Pages
import { BureauDashboard } from '../pages/bureau/BureauDashboard';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagement } from '../pages/admin/UserManagement';
import { ProfileApprovals } from '../pages/admin/ProfileApprovals';
import { PhotoModeration } from '../pages/admin/PhotoModeration';

// Super Admin
import { SuperAdminDashboard } from '../pages/super-admin/SuperAdminDashboard';

import { LoadingScreen } from '../components/ui/LoadingScreen';

const MainLayout: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-foreground">
      <Navbar />
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
      </div>
      <main className="flex-1">
        <React.Suspense fallback={<LoadingScreen message="Navigating to page..." />}>
          <Outlet />
        </React.Suspense>
      </main>
      <Footer />
      <Toast />
    </div>
  );
};

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/success-stories" element={<SuccessStoriesPage />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/complete-basic-profile"
          element={
            <ProtectedRoute requireBasicComplete={false}>
              <CompleteBasicProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/complete"
          element={
            <ProtectedRoute requireBasicComplete={false}>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* User Dashboard & Feature Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/profile" element={<MyProfilePage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/profile/:id" element={<ViewProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/preferences" element={<PreferencesPage />} />
        <Route path="/interests" element={<InterestsPage />} />
        <Route
          path="/matching/shortlist"
          element={
            <ProtectedRoute>
              <ShortlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching/ignored"
          element={
            <ProtectedRoute>
              <IgnoredProfilesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matching/blocked"
          element={
            <ProtectedRoute>
              <BlockedProfilesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:id" element={<MessagesPage />} />
        <Route path="/photos" element={<PhotosPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment-history" element={<PaymentHistoryPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/privacy-settings" element={<PrivacySettingsPage />} />
        <Route path="/settings" element={<PrivacySettingsPage />} />

        {/* Marriage Bureau Portal */}
        <Route path="/bureau/dashboard" element={<BureauDashboard />} />
        <Route path="/bureau/clients" element={<BureauDashboard />} />
        <Route path="/bureau/clients/:id" element={<ViewProfile />} />
        <Route path="/bureau/create-profile" element={<Register />} />
        <Route path="/bureau/matches" element={<MatchesPage />} />
        <Route path="/bureau/leads" element={<BureauDashboard />} />
        <Route path="/bureau/commissions" element={<BureauDashboard />} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/profile-approvals" element={<ProfileApprovals />} />
        <Route path="/admin/photo-moderation" element={<PhotoModeration />} />
        <Route path="/admin/memberships" element={<MembershipPage />} />
        <Route path="/admin/payments" element={<PaymentHistoryPage />} />
        <Route path="/admin/reports" element={<AdminDashboard />} />
        <Route path="/admin/cms" element={<AdminDashboard />} />
        <Route path="/admin/banners" element={<AdminDashboard />} />
        <Route path="/admin/email-templates" element={<AdminDashboard />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
        <Route path="/admin/audit-logs" element={<AdminDashboard />} />
        <Route path="/admin/roles" element={<SuperAdminDashboard />} />

        {/* Super Admin */}
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
