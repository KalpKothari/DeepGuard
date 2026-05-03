import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminEmail } from '@/lib/admin';

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isAdminEmail(user.email)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-destructive">Restricted</p>
          <h1 className="text-2xl font-bold text-foreground">Unauthorized Access</h1>
          <p className="text-sm text-muted-foreground">Only the admin account can access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;