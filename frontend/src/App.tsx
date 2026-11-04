import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth } from './config/firebase';
import { authService } from './services/auth.service';
import { useAuth } from './hooks/useAuth';
import { usePostLoginNotifications } from './hooks/usePostLoginNotifications';
import toast from 'react-hot-toast';

// Layouts (loaded upfront)
import { PublicLayout } from './layouts/PublicLayout';
import { UserLayout } from './layouts/UserLayout';
import { OwnerLayout } from './layouts/OwnerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Core Landing Page (loaded upfront for instant first paint)
import { HomePage } from './pages/public/HomePage';

// Lazy-loaded Public Pages (loaded on demand)
const PropertiesPage = lazy(() => import('./pages/public/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const HousesPage = lazy(() => import('./pages/public/HousesPage').then(m => ({ default: m.HousesPage })));
const ShopsPage = lazy(() => import('./pages/public/ShopsPage').then(m => ({ default: m.ShopsPage })));
const HostelsPage = lazy(() => import('./pages/public/HostelsPage').then(m => ({ default: m.HostelsPage })));
const MarriageHallsPage = lazy(() => import('./pages/public/MarriageHallsPage').then(m => ({ default: m.MarriageHallsPage })));
const PropertyDetailPage = lazy(() => import('./pages/public/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })));
const AboutPage = lazy(() => import('./pages/public/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/public/ContactPage').then(m => ({ default: m.ContactPage })));
const LoginPage = lazy(() => import('./pages/public/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage').then(m => ({ default: m.RegisterPage })));
const TermsPage = lazy(() => import('./pages/public/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const HomeServicesPage = lazy(() => import('./pages/public/HomeServicesPage').then(m => ({ default: m.HomeServicesPage })));
const AddServicePage = lazy(() => import('./pages/public/AddServicePage').then(m => ({ default: m.AddServicePage })));
const AuthCallbackPage = lazy(() => import('./pages/public/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const OffersPage = lazy(() => import('./pages/public/OffersPage').then(m => ({ default: m.OffersPage })));

// Lazy-loaded Wanted Spaces Pages
const WantedSpecifyPage = lazy(() => import('./pages/public/WantedSpecifyPage'));
const WantedSpacesDirectoryPage = lazy(() => import('./pages/public/WantedSpacesDirectoryPage'));
const WantedSpaceDetailPage = lazy(() => import('./pages/public/WantedSpaceDetailPage'));
const WantedSpacePaymentPage = lazy(() => import('./pages/user/WantedSpacePaymentPage'));
const WantedSpacePaymentResultPage = lazy(() => import('./pages/user/WantedSpacePaymentResultPage'));
const MyWantedSpacesPage = lazy(() => import('./pages/user/MyWantedSpacesPage'));

// Lazy-loaded User Pages
const UserDashboardPage = lazy(() => import('./pages/user/UserDashboardPage').then(m => ({ default: m.UserDashboardPage })));
const UserProfilePage = lazy(() => import('./pages/user/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const FavouritesPage = lazy(() => import('./pages/user/FavouritesPage').then(m => ({ default: m.FavouritesPage })));
const UserEnquiriesPage = lazy(() => import('./pages/user/UserEnquiriesPage').then(m => ({ default: m.UserEnquiriesPage })));

// Lazy-loaded Owner Pages
const OwnerDashboardPage = lazy(() => import('./pages/owner/OwnerDashboardPage').then(m => ({ default: m.OwnerDashboardPage })));
const OwnerProfilePage = lazy(() => import('./pages/owner/OwnerProfilePage').then(m => ({ default: m.OwnerProfilePage })));
const MyPropertiesPage = lazy(() => import('./pages/owner/MyPropertiesPage').then(m => ({ default: m.MyPropertiesPage })));
const AddPropertyPage = lazy(() => import('./pages/owner/AddPropertyPage').then(m => ({ default: m.AddPropertyPage })));
const EditPropertyPage = lazy(() => import('./pages/owner/EditPropertyPage').then(m => ({ default: m.EditPropertyPage })));
const ListingPlansPage = lazy(() => import('./pages/owner/ListingPlansPage').then(m => ({ default: m.ListingPlansPage })));
const PaymentPage = lazy(() => import('./pages/owner/PaymentPage').then(m => ({ default: m.PaymentPage })));
const PaymentResultPage = lazy(() => import('./pages/owner/PaymentResultPage').then(m => ({ default: m.PaymentResultPage })));
const PropertyStatusPage = lazy(() => import('./pages/owner/PropertyStatusPage').then(m => ({ default: m.PropertyStatusPage })));
const OwnerEnquiriesPage = lazy(() => import('./pages/owner/OwnerEnquiriesPage').then(m => ({ default: m.OwnerEnquiriesPage })));

// Lazy-loaded Admin Pages
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage').then(m => ({ default: m.ManageUsersPage })));
const ManageOwnersPage = lazy(() => import('./pages/admin/ManageOwnersPage').then(m => ({ default: m.ManageOwnersPage })));
const ManagePropertiesPage = lazy(() => import('./pages/admin/ManagePropertiesPage').then(m => ({ default: m.ManagePropertiesPage })));
const PendingApprovalsPage = lazy(() => import('./pages/admin/PendingApprovalsPage').then(m => ({ default: m.PendingApprovalsPage })));
const ManagePaymentsPage = lazy(() => import('./pages/admin/ManagePaymentsPage').then(m => ({ default: m.ManagePaymentsPage })));
const ManagePlansPage = lazy(() => import('./pages/admin/ManagePlansPage').then(m => ({ default: m.ManagePlansPage })));
const ManageEnquiriesPage = lazy(() => import('./pages/admin/ManageEnquiriesPage').then(m => ({ default: m.ManageEnquiriesPage })));

// Elegant fallback spinner for route transitions
const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 rounded-full border-3 border-orange-100 border-t-orange-600 animate-spin" />
    <span className="text-xs font-semibold text-gray-400">Loading page...</span>
  </div>
);

export const App: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Auto-request push notification permission right after login
  usePostLoginNotifications();

  // ─── ROOT-LEVEL Firebase redirect result handler ───────────────────────────
  React.useEffect(() => {
    let cancelled = false;

    getRedirectResult(auth)
      .then(async (credential) => {
        if (cancelled || !credential?.user) return;

        const savedRole =
          (localStorage.getItem('vv_auth_role') as 'USER' | 'OWNER') || 'USER';
        const savedRedirect = localStorage.getItem('vv_auth_redirect') || null;

        try {
          const idToken = await credential.user.getIdToken(true);
          const response = await authService.firebaseLogin(
            idToken,
            savedRole,
            credential.user.displayName || undefined
          );

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

  // Fast splash dismiss: shows for max 350ms so first paint feels instant
  React.useEffect(() => {
    const mountTime = Date.now();
    const MIN_DISPLAY = 350;
    const ANIM_DURATION = 300;

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
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
  );
};

export default App;
