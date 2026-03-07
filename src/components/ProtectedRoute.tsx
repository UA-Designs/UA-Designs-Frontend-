import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import type { AccessLevel } from '../lib/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Named access level — if set, users below this tier are redirected to /unauthorized. */
  access?: AccessLevel;
  /** Redirect destination when access is denied (defaults to /unauthorized). */
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  access,
  redirectTo = '/unauthorized',
}) => {
  const { isAuthenticated, isLoading, can } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: `
            radial-gradient(circle at 20% 50%, rgba(0, 204, 102, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 204, 102, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
          `,
          position: 'relative',
        }}
      >
        <div
          style={{
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(0, 204, 102, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
          }}
        >
          <Spin size="large" style={{ color: '#009944', marginBottom: '20px' }} />
          <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>
            Loading UA Designs PMS...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access check (only if an access level is specified)
  if (access && !can(access)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
