import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { Toast } from '../components/ui/Toast';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { UserLayout } from '../components/layout/UserLayout';

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
import { AdminVerificationQueue } from '../pages/admin/AdminVerificationQueue';

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
        {/* Public Routes (Accessible without login) */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
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
            <ProtectedRoute>
              <CompleteBasicProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/complete"
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* User Workspace Routes (Requires Login) */}
        <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/my-profile" element={<MyProfilePage />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/interests" element={<InterestsPage />} />
          <Route path="/matching/shortlist" element={<ShortlistPage />} />
          <Route path="/matching/ignored" element={<IgnoredProfilesPage />} />
          <Route path="/matching/blocked" element={<BlockedProfilesPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/privacy-settings" element={<PrivacySettingsPage />} />
          <Route path="/settings" element={<PrivacySettingsPage />} />
        </Route>

        {/* Protected App Pages (Requires Login -> Redirects to /login if unauthenticated) */}
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/preferences" element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
        <Route path="/membership" element={<ProtectedRoute><MembershipPage /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
        <Route path="/photos" element={<ProtectedRoute><PhotosPage /></ProtectedRoute>} />
        <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/payment-history" element={<ProtectedRoute><PaymentHistoryPage /></ProtectedRoute>} />

        {/* Admin Workspace Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerificationQueue /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute><ProfileApprovals /></ProtectedRoute>} />
        <Route path="/admin/moderation" element={<ProtectedRoute><PhotoModeration /></ProtectedRoute>} />
        <Route path="/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />

        {/* Catch-all redirect to Home */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
