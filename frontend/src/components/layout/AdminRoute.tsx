/**
 * Admin Route Component
 * Route guard for admin-only pages
 */
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

// Roles that can access admin panel
const ADMIN_ROLES = ['super_admin', 'admin'];

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  const hasAdminAccess = user?.role && ADMIN_ROLES.includes(user.role);

  // Not admin - redirect to app dashboard with message
  if (!hasAdminAccess) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
