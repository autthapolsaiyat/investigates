import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Layout, AdminLayout, AdminRoute } from './components/layout';
import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { PendingApprovalPage } from './pages/auth/PendingApproval';
import { DashboardPage } from './pages/dashboard/Dashboard';
import { CasesPage } from './pages/cases/Cases';
import { MoneyFlowPage } from './pages/money-flow/MoneyFlow';
import { ForensicReportV2 } from './pages/forensic-report/ForensicReportV2';
import SmartImport from './pages/import/SmartImport';
import { SilkRoadDemo } from "./pages/silk-road-demo";
import { LocationTimeline } from "./pages/location-timeline";
import { KYCRequestGenerator } from "./pages/kyc-request";
import { CryptoTracker } from './pages/crypto/CryptoTracker';
import { CallAnalysis } from './pages/call-analysis/CallAnalysis';
import { HashVerify } from './pages/verify';
import { UserGuide } from './pages/guide';
import { LandingPage } from './pages/landing';
import { MyTickets } from './pages/support/MyTickets';
import { Profile } from './pages/profile';
import { ActivateLicense } from './pages/activate';
import { UserSettings } from './pages/settings';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboard';
import { PendingRegistrationsPage } from './pages/admin/PendingRegistrations';
import { OrganizationsPage } from './pages/admin/Organizations';
import { UsersPage } from './pages/admin/Users';
import { SettingsPage } from './pages/admin/Settings';
import { ActivityLogPage } from './pages/admin/ActivityLog';
import { SubscriptionsPage } from './pages/admin/Subscriptions';
import { NotificationsPage } from './pages/admin/Notifications';
import { SystemReportsPage } from './pages/admin/SystemReports';
import { DeletedCases } from './pages/admin/DeletedCases';
import { SupportTickets } from './pages/admin/SupportTickets';
import { LoginMap } from './pages/admin/LoginMap';
import { LicenseManagement } from './pages/admin/LicenseManagement';
import { SalesDocumentation } from './pages/admin/SalesDocumentation';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    if (localStorage.getItem('access_token')) checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/verify" element={<HashVerify />} />
        
        {/* Protected App Routes (Investigator Interface) */}
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="money-flow" element={<MoneyFlowPage />} />
          <Route path="forensic-report" element={<ForensicReportV2 />} />
          <Route path="smart-import" element={<SmartImport />} />
          <Route path="call-analysis" element={<CallAnalysis />} />
          <Route path="silk-road-demo" element={<SilkRoadDemo />} />
          <Route path="location-timeline" element={<LocationTimeline />} />
          <Route path="kyc-request" element={<KYCRequestGenerator />} />
          <Route path="crypto" element={<CryptoTracker />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="guide" element={<UserGuide />} />
          <Route path="activate" element={<ActivateLicense />} />
        </Route>

        {/* Admin Panel Routes (Separated Admin Interface) */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="registrations" element={<PendingRegistrationsPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="deleted-cases" element={<DeletedCases />} />
          <Route path="licenses" element={<LicenseManagement />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="activity" element={<ActivityLogPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reports" element={<SystemReportsPage />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="login-map" element={<LoginMap />} />
          <Route path="sales-docs" element={<SalesDocumentation />} />
        </Route>
        
        {/* Legacy routes redirect to /app */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/cases" element={<Navigate to="/app/cases" replace />} />
        <Route path="/money-flow" element={<Navigate to="/app/money-flow" replace />} />
        <Route path="/forensic-report" element={<Navigate to="/app/forensic-report" replace />} />
        <Route path="/smart-import" element={<Navigate to="/app/smart-import" replace />} />
        <Route path="/call-analysis" element={<Navigate to="/app/call-analysis" replace />} />
        <Route path="/crypto" element={<Navigate to="/app/crypto" replace />} />
        <Route path="/location-timeline" element={<Navigate to="/app/location-timeline" replace />} />
        <Route path="/guide" element={<Navigate to="/app/guide" replace />} />
        
        {/* Legacy admin routes redirect to new /admin */}
        <Route path="/app/admin/*" element={<Navigate to="/admin" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
