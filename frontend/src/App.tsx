import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout';
import { LoginPage } from './pages/auth/Login';
import { DashboardPage } from './pages/dashboard/Dashboard';
import { CasesPage } from './pages/cases/Cases';
import { MoneyFlowPage } from './pages/money-flow/MoneyFlow';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-dark-400">Coming Soon...</p>
    </div>
  </div>
);

function App() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    if (localStorage.getItem('access_token')) fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="money-flow" element={<MoneyFlowPage />} />
          <Route path="call-analysis" element={<ComingSoon title="Call Analysis" />} />
          <Route path="crypto" element={<ComingSoon title="Crypto Tracker" />} />
          <Route path="admin/*" element={<ComingSoon title="Admin Panel" />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
