import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout';
import { LoginPage } from './pages/auth/Login';
import { DashboardPage } from './pages/dashboard/Dashboard';
import { CasesPage } from './pages/cases/Cases';
import { MoneyFlowPage } from './pages/money-flow/MoneyFlow';
import { OrganizationsPage } from './pages/admin/Organizations';
import { UsersPage } from './pages/admin/Users';
import { SettingsPage } from './pages/admin/Settings';
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
        <Route path="/verify" element={<HashVerify />} />
        <Route path="/guide" element={<UserGuide />} />
        
        {/* Protected Routes */}
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
          <Route path="admin/organizations" element={<OrganizationsPage />} />
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/settings" element={<SettingsPage />} />
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
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;