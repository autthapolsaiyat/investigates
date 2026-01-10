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
import { ForensicReportPage } from './pages/forensic-report/ForensicReport';
import { ImportData } from './pages/import/ImportData';
import { ReportGenerator } from './pages/report/ReportGenerator';
import { SilkRoadDemo } from "./pages/silk-road-demo";
import { CryptoTracker } from './pages/crypto/CryptoTracker';
import { CallAnalysis } from './pages/call-analysis/CallAnalysis';

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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="money-flow" element={<MoneyFlowPage />} />
          <Route path="forensic-report" element={<ForensicReportPage />} />
          <Route path="import" element={<ImportData />} />
          <Route path="report" element={<ReportGenerator />} />
          <Route path="call-analysis" element={<CallAnalysis />} />
          <Route path="silk-road-demo" element={<SilkRoadDemo />} />
          <Route path="crypto" element={<CryptoTracker />} />
          <Route path="admin/organizations" element={<OrganizationsPage />} />
          <Route path="admin/users" element={<UsersPage />} />
          <Route path="admin/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
