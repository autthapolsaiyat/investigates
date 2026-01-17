import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from './layouts/MainLayout';
import {
  LoginPage,
  DashboardPage,
  DashboardDetailPage,
  ExecutiveDashboardPage,
  IntroPage, ProfilePage,
  UserManagementPage,
  ActivityLogPage,
  ProductsPage,
  CategoriesPage,
  CustomersPage,
  SuppliersPage,
  WarehousesPage,
  StockBalancePage,
  SalesInvoicesPage,
  PurchaseOrdersPage,
  GoodsReceiptsPage,
  StockIssuesPage,
  StockTransfersPage,
  StockAdjustmentsPage,
  StockCountsPage,
  QuotationList,
  QuotationForm,
  QuotationDetail,
  UserSettingsPage,
  CompanySettingsPage,
} from './pages';
import StockCardPage from './pages/StockCardPage';
import StockValuationPage from './pages/StockValuationPage';
import StockMovementPage from './pages/StockMovementPage';
import ReorderAlertPage from './pages/ReorderAlertPage';
import ExpiryAlertPage from './pages/ExpiryAlertPage';
import SerialNumberPage from './pages/SerialNumberPage';
import BarcodeScannerPage from './pages/BarcodeScannerPage';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './contexts/AuthContext';

// Accounting Pages
import {
  ChartOfAccountsPage,
  JournalEntriesPage,
  ARAPAgingPage,
  FinancialReportsPage,
  GeneralLedgerPage,
  PaymentReceiptPage,
  PaymentVoucherPage,
  BankReconciliationPage,
  ClosingPeriodPage,
  TaxInvoicePage,
  WithholdingTaxPage,
  VatReportPage,
  FixedAssetPage,
  CashFlowPage,
} from './pages/accounting';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Accounting Route Protection
const AccountRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasAccountAccess, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!hasAccountAccess()) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#020617',
        color: '#fff'
      }}>
        <h2 style={{ color: '#ef4444' }}>🔒 ไม่มีสิทธิ์เข้าถึง</h2>
        <p style={{ color: '#9ca3af' }}>คุณไม่มีสิทธิ์เข้าถึงระบบบัญชี กรุณาติดต่อผู้ดูแลระบบ</p>
        <a href="/" style={{ color: '#3b82f6', marginTop: 16 }}>← กลับหน้าหลัก</a>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Intro Page - No Layout */}
      <Route path="/intro" element={
        <ProtectedRoute>
          <IntroPage />
        </ProtectedRoute>
      } />

      {/* Dashboard Detail - No Layout */}
      <Route path="/dashboard-detail" element={
        <ProtectedRoute>
          <DashboardDetailPage />
        </ProtectedRoute>
      } />

      {/* Executive Dashboard - No Layout (for bank presentation) */}
      <Route path="/executive-dashboard" element={
        <ProtectedRoute>
          <ExecutiveDashboardPage />
        </ProtectedRoute>
      } />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        
        {/* Master Data */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />

        {/* Quotations */}
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new" element={<QuotationForm />} />
        <Route path="quotations/:id" element={<QuotationDetail />} />
        <Route path="quotations/:id/edit" element={<QuotationForm />} />

        {/* Sales */}
        <Route path="sales-invoices" element={<SalesInvoicesPage />} />

        {/* Purchase */}
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="goods-receipts" element={<GoodsReceiptsPage />} />

        {/* Stock */}
        <Route path="stock-balance" element={<StockBalancePage />} />
        <Route path="stock-card" element={<StockCardPage />} />
        <Route path="stock-valuation" element={<StockValuationPage />} />
        <Route path="stock-movement" element={<StockMovementPage />} />
        <Route path="reorder-alerts" element={<ReorderAlertPage />} />
        <Route path="expiry-alerts" element={<ExpiryAlertPage />} />
        <Route path="serial-numbers" element={<SerialNumberPage />} />
        <Route path="barcode-scanner" element={<BarcodeScannerPage />} />
        <Route path="stock-issues" element={<StockIssuesPage />} />
        <Route path="stock-transfers" element={<StockTransfersPage />} />
        <Route path="stock-adjustments" element={<StockAdjustmentsPage />} />
        <Route path="stock-counts" element={<StockCountsPage />} />

        {/* Accounting - Protected by AccountRoute */}
        <Route path="accounting/chart-of-accounts" element={<AccountRoute><ChartOfAccountsPage /></AccountRoute>} />
        <Route path="accounting/journal-entries" element={<AccountRoute><JournalEntriesPage /></AccountRoute>} />
        <Route path="accounting/general-ledger" element={<AccountRoute><GeneralLedgerPage /></AccountRoute>} />
        <Route path="accounting/payment-receipts" element={<AccountRoute><PaymentReceiptPage /></AccountRoute>} />
        <Route path="accounting/payment-vouchers" element={<AccountRoute><PaymentVoucherPage /></AccountRoute>} />
        <Route path="accounting/ar-ap-aging" element={<AccountRoute><ARAPAgingPage /></AccountRoute>} />
        <Route path="accounting/reports" element={<AccountRoute><FinancialReportsPage /></AccountRoute>} />
        <Route path="accounting/financial-reports" element={<AccountRoute><FinancialReportsPage /></AccountRoute>} />
        <Route path="accounting/bank-reconciliation" element={<AccountRoute><BankReconciliationPage /></AccountRoute>} />
        <Route path="accounting/closing-period" element={<AccountRoute><ClosingPeriodPage /></AccountRoute>} />
        <Route path="accounting/tax-invoices" element={<AccountRoute><TaxInvoicePage /></AccountRoute>} />
        <Route path="accounting/withholding-tax" element={<AccountRoute><WithholdingTaxPage /></AccountRoute>} />
        <Route path="accounting/vat-report" element={<AccountRoute><VatReportPage /></AccountRoute>} />
        <Route path="accounting/fixed-assets" element={<AccountRoute><FixedAssetPage /></AccountRoute>} />
        <Route path="accounting/cash-flow" element={<AccountRoute><CashFlowPage /></AccountRoute>} />
        
        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/user" element={<UserSettingsPage />} />
        <Route path="settings/company" element={<CompanySettingsPage />} />
        <Route path="admin/users" element={<UserManagementPage />} />
        <Route path="admin/activity-logs" element={<ActivityLogPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
