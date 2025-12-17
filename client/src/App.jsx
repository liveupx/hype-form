import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/HomePage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import TemplatesPage from './pages/TemplatesPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import FormsListPage from './pages/dashboard/FormsListPage';
import FormBuilderPage from './pages/dashboard/FormBuilderPage';
import FormResultsPage from './pages/dashboard/FormResultsPage';
import FormSharePage from './pages/dashboard/FormSharePage';
import FormSettingsPage from './pages/dashboard/FormSettingsPage';
import TemplatesListPage from './pages/dashboard/TemplatesListPage';
import IntegrationsPage from './pages/dashboard/IntegrationsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import BillingPage from './pages/dashboard/BillingPage';

// Public Form
import PublicFormPage from './pages/PublicFormPage';
import FormSubmittedPage from './pages/FormSubmittedPage';

// Error Pages
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guest Route Component (redirect if logged in)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
      </Route>

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="forms" element={<FormsListPage />} />
        <Route path="forms/:formId" element={<FormBuilderPage />} />
        <Route path="forms/:formId/results" element={<FormResultsPage />} />
        <Route path="forms/:formId/share" element={<FormSharePage />} />
        <Route path="forms/:formId/settings" element={<FormSettingsPage />} />
        <Route path="templates" element={<TemplatesListPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>

      {/* Public Form Routes */}
      <Route path="/f/:publicId" element={<PublicFormPage />} />
      <Route path="/f/:publicId/submitted" element={<FormSubmittedPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
