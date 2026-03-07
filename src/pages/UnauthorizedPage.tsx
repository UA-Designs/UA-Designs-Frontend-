import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';

/**
 * 403 / Access Denied landing page.
 * Shown when a user navigates directly to a route they don't have permission for.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)',
      }}
    >
      <Result
        status="403"
        title={<span style={{ color: '#ffffff' }}>Access Denied</span>}
        subTitle={
          <span style={{ color: '#9ca3af' }}>
            You don't have permission to view this page. Contact your administrator if you believe this is a mistake.
          </span>
        }
        extra={
          <Button
            type="primary"
            onClick={() => navigate('/dashboard')}
            style={{ background: '#009944', borderColor: '#009944' }}
          >
            Back to Dashboard
          </Button>
        }
      />
    </div>
  );
}
