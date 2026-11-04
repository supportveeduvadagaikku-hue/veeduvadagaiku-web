import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './config/firebase';
import { authService } from './services/auth.service';
import { useAuth } from './hooks/useAuth';
import { usePostLoginNotifications } from './hooks/usePostLoginNotifications';
import toast from 'react-hot-toast';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { UserLayout } from './layouts/UserLayout';
import { OwnerLayout } from './layouts/OwnerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { PropertiesPage } from './pages/public/PropertiesPage';
import { HousesPage } from './pages/public/HousesPage';
import { ShopsPage } from './pages/public/ShopsPage';
import { HostelsPage } from './pages/public/HostelsPage';
import { MarriageHallsPage } from './pages/public/MarriageHallsPage';
import { PropertyDetailPage } from './pages/public/PropertyDetailPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { HomeServicesPage } from './pages/public/HomeServicesPage';
import { AddServicePage } from './pages/public/AddServicePage';
import { AuthCallbackPage } from './pages/public/AuthCallbackPage';
import { OffersPage } from './pages/public/OffersPage';

// Wanted Spaces Pages
import WantedSpecifyPage from './pages/public/WantedSpecifyPage';
import WantedSpacesDirectoryPage from './pages/public/WantedSpacesDirectoryPage';
import WantedSpaceDetailPage from './pages/public/WantedSpaceDetailPage';
import WantedSpacePaymentPage from './pages/user/WantedSpacePaymentPage';
import WantedSpacePaymentResultPage from './pages/user/WantedSpacePaymentResultPage';
import MyWantedSpacesPage from './pages/user/MyWantedSpacesPage';

// Tenant / User Pages
import { UserDashboardPage } from './pages/user/UserDashboardPage';
import { UserProfilePage } from './pages/user/UserProfilePage';
import { FavouritesPage } from './pages/user/FavouritesPage';
import { UserEnquiriesPage } from './pages/user/UserEnquiriesPage';

// Owner Pages
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerProfilePage } from './pages/owner/OwnerProfilePage';
import { MyPropertiesPage } from './pages/owner/MyPropertiesPage';
import { AddPropertyPage } from './pages/owner/AddPropertyPage';
import { EditPropertyPage } from './pages/owner/EditPropertyPage';
import { ListingPlansPage } from './pages/owner/ListingPlansPage';
import { PaymentPage } from './pages/owner/PaymentPage';
import { PaymentResultPage } from './pages/owner/PaymentResultPage';
import { PropertyStatusPage } from './pages/owner/PropertyStatusPage';
import { OwnerEnquiriesPage } from './pages/owner/OwnerEnquiriesPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ManageUsersPage } from './pages/admin/ManageUsersPage';
import { ManageOwnersPage } from './pages/admin/ManageOwnersPage';
import { ManagePropertiesPage } from './pages/admin/ManagePropertiesPage';
import { PendingApprovalsPage } from './pages/admin/PendingApprovalsPage';
import { ManagePaymentsPage } from './pages/admin/ManagePaymentsPage';
import { ManagePlansPage } from './pages/admin/ManagePlansPage';
import { ManageEnquiriesPage } from './pages/admin/ManageEnquiriesPage';

export const App: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Auto-request push notification permission right after login
  usePostLoginNotifications();

  // ─── ROOT-LEVEL Firebase redirect result handler ───────────────────────────
  // This runs on EVERY page load. It doesn't matter which URL Firebase
  // redirects back to after Google OAuth — we always catch it here.
  // Using localStorage (not sessionStorage) because mobile browsers wipe
  // sessionStorage during cross-origin redirects.
  React.useEffect(() => {
    let cancelled = false;

    getRedirectResult(auth)
      .then(async (credential) => {
        if (cancelled || !credential?.user) return; // no redirect result

        const savedRole =
          (localStorage.getItem('vv_auth_role') as 'USER' | 'OWNER') || 'USER';
        const savedRedirect = localStorage.getItem('vv_auth_redirect') || null;

        try {
          // Force-refresh token — mobile cached tokens sometimes get rejected
          const idToken = await credential.user.getIdToken(true);
          const response = await authService.firebaseLogin(
            idToken,
            savedRole,
            credential.user.displayName || undefined
          );

          // Clean up before navigating
          localStorage.removeItem('vv_auth_role');
          localStorage.removeItem('vv_auth_redirect');

          if (response.success && response.data) {
            const { user, token } = response.data;
            setUser(user, token);
            toast.success(`Welcome, ${user.name || 'back'}!`);

            const dest =
              savedRedirect ||
              (user.role === 'ADMIN'
                ? '/admin/dashboard'
                : user.role === 'OWNER'
                ? '/owner/dashboard'
                : '/user/dashboard');

            if (!cancelled) navigate(dest, { replace: true });
          }
        } catch (err: any) {
          if (cancelled) return;
          localStorage.removeItem('vv_auth_role');
          localStorage.removeItem('vv_auth_redirect');
          console.error('[App] getRedirectResult error:', err);
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              'Google sign-in failed. Please try again.'
          );
        }
      })
      .catch((err: any) => {
        // Swallow popup-closed / cancelled — those are not errors
        if (
          err?.code === 'auth/popup-closed-by-user' ||
          err?.code === 'auth/cancelled-popup-request'
        )
          return;
        console.error('[App] getRedirectResult catch:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ──────────────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const mountTime = Date.now();
    const MIN_DISPLAY = 3000; // hold for at least 3 seconds
    const ANIM_DURATION = 1500; // matches CSS preloaderSlideUp duration

    const dismiss = () => {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('preloader-exit');
        setTimeout(() => preloader.remove(), ANIM_DURATION);
      }
    };

    const elapsed = Date.now() - mountTime;
    const delay = Math.max(0, MIN_DISPLAY - elapsed);
    const timer = setTimeout(dismiss, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      {/* ─── Public Routes ─── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/houses" element={<HousesPage />} />
        <Route path="/shops" element={<ShopsPage />} />
        <Route path="/hostels" element={<HostelsPage />} />
        <Route path="/marriage-halls" element={<MarriageHallsPage />} />
        <Route path="/home-services" element={<HomeServicesPage />} />
        <Route path="/home-services/list" element={<AddServicePage />} />
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/plans" element={<OffersPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        {/* ─── Wanted Spaces (public) ─── */}
        <Route path="/wanted-spaces" element={<WantedSpacesDirectoryPage />} />
        <Route path="/wanted-spaces/specify" element={<WantedSpecifyPage />} />
        <Route path="/wanted-spaces/pay" element={<WantedSpacePaymentPage />} />
        <Route path="/wanted-spaces/:id" element={<WantedSpaceDetailPage />} />
      </Route>

      {/* ─── Top-level Payment Result (Cashfree return_url lands here) ─── */}
      <Route path="/payment-result" element={<PaymentResultPage />} />
      <Route path="/wanted-spaces/payment-result" element={<WantedSpacePaymentResultPage />} />

      {/* ─── Auth Callback (Firebase redirect result handler) ─── */}
      {/* This route is intentionally OUTSIDE PublicLayout so no Navbar/Footer shows during processing */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* ─── Tenant / User Portal ─── */}
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="favourites" element={<FavouritesPage />} />
        <Route path="enquiries" element={<UserEnquiriesPage />} />
        {/* ─── Wanted Spaces (user) ─── */}
        <Route path="wanted-spaces" element={<MyWantedSpacesPage />} />
        <Route path="wanted-spaces/payment" element={<WantedSpacePaymentPage />} />
      </Route>

      {/* ─── Property Owner Portal ─── */}
      <Route path="/owner" element={<OwnerLayout />}>
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboardPage />} />
        <Route path="profile" element={<OwnerProfilePage />} />
        <Route path="properties" element={<MyPropertiesPage />} />
        <Route path="properties/add" element={<AddPropertyPage />} />
        <Route path="properties/:id/edit" element={<EditPropertyPage />} />
        <Route path="listing-plans" element={<ListingPlansPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="payment/result" element={<PaymentResultPage />} />
        <Route path="property-status" element={<PropertyStatusPage />} />
        <Route path="enquiries" element={<OwnerEnquiriesPage />} />
      </Route>

      {/* ─── Admin Portal ─── */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="owners" element={<ManageOwnersPage />} />
        <Route path="properties" element={<ManagePropertiesPage />} />
        <Route path="pending" element={<PendingApprovalsPage />} />
        <Route path="payments" element={<ManagePaymentsPage />} />
        <Route path="plans" element={<ManagePlansPage />} />
        <Route path="enquiries" element={<ManageEnquiriesPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
