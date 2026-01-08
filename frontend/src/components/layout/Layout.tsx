import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => (
  <div className="flex h-screen bg-dark-950">
    <Sidebar />
    <main className="flex-1 overflow-auto">
      <Outlet />
    </main>
  </div>
);
