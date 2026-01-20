/**
 * Admin Layout Component
 * Layout wrapper for Admin Panel pages
 */
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = () => (
  <div className="flex h-screen bg-dark-950">
    <AdminSidebar />
    <main className="flex-1 overflow-auto">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
