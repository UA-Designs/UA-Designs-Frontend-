import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Typography,
  theme,
  Spin,
  Drawer,
  Grid,
  ConfigProvider,
} from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  UsergroupAddOutlined,
  ToolOutlined,
  AuditOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useProject } from '../../contexts/ProjectContext';
import Logo from '../Logo/Logo';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const SIDEBAR_BG = '#0f1f14';
const SIDEBAR_ACCENT = '#009944';
const SIDEBAR_HEADING = '#7a9b85';

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { user, logout, isLoading, can } = useAuth();
  const { notifications, unreadCount } = useNotification();
  const { projects, loadProjects } = useProject();

  // Re-trigger project load after auth confirms (fixes login→navigate race condition)
  useEffect(() => {
    if (!isLoading && user && projects.length === 0) {
      loadProjects();
    }
  }, [isLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Show loading state if still loading or no user
  if (isLoading || !user) {
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

  const navigationItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/projects', icon: <ProjectOutlined />, label: 'Projects' },
    { key: '/materials', icon: <AppstoreOutlined />, label: 'Materials' },
    { key: '/pmbok/cost', icon: <DollarOutlined />, label: 'Expenses' },
    { key: '/pmbok/schedule', icon: <CalendarOutlined />, label: 'Schedule' },
    { key: '/pmbok/risk', icon: <ExclamationCircleOutlined />, label: 'Risk Management' },
    { key: '/pmbok/stakeholders', icon: <UsergroupAddOutlined />, label: 'Stakeholders' },
    { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const administrationItems = [
    ...(can('ENGINEER_AND_ABOVE') ? [
      { key: '/users', icon: <TeamOutlined />, label: 'User Management' as const },
      { key: '/audit-log', icon: <AuditOutlined />, label: 'Activity Log' as const },
    ] : []),
  ];

  const menuItems: any[] = [
    { key: 'nav', type: 'group', label: <span style={{ color: SIDEBAR_HEADING, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 16px', marginBottom: 4 }}>Navigation</span>, children: navigationItems },
    ...(administrationItems.length > 0 ? [{ key: 'admin', type: 'group' as const, label: <span style={{ color: SIDEBAR_HEADING, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 16px', marginBottom: 4 }}>Administration</span>, children: administrationItems }] : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  const notificationMenuItems = notifications.slice(0, 5).map(notification => ({
    key: notification.id,
    label: (
      <div style={{ padding: '8px 0' }}>
        <Text strong>{notification.title}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {notification.message}
        </Text>
      </div>
    ),
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key);
      if (isMobile) setMobileMenuOpen(false);
    }
  };

  const sidebarContent = (
    <ConfigProvider theme={{ token: { colorPrimary: SIDEBAR_ACCENT } }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: SIDEBAR_BG }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="sidebar-logo" style={{ flexShrink: 0 }}>
              <Logo size="small" showText={false} />
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ minWidth: 0 }}>
                <Text strong style={{ color: 'rgba(255,255,255,0.95)', fontSize: 16, display: 'block', lineHeight: 1.2 }}>{import.meta.env.VITE_APP_NAME || 'UA Designs PMS'}</Text>
                {user && (
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{(user as any).role ?? 'User'}</Text>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', paddingTop: 8 }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ borderRight: 0, background: 'transparent' }}
          />
        </div>
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          {user && (user as any).email && (
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'block', marginBottom: 8 }}>{(user as any).email}</Text>
          )}
          <button
            type="button"
            onClick={() => logout()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', fontSize: 14, padding: 0 }}
          >
            <LogoutOutlined />
            Sign Out
          </button>
        </div>
      </div>
    </ConfigProvider>
  );

  return (
    <AntLayout 
      style={{ 
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 50%, rgba(0, 204, 102, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 204, 102, 0.03) 0%, transparent 50%),
          linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
        `,
      }}
    >
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={256}
          collapsedWidth={64}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            height: '100vh',
            overflow: 'auto',
            background: SIDEBAR_BG,
            borderRight: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {sidebarContent}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          placement="left"
          width={280}
          styles={{
            body: {
              padding: 0,
              background: SIDEBAR_BG,
            },
            header: { display: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>
      )}

      <AntLayout
        style={{
          marginLeft: !isMobile ? (collapsed ? 64 : 256) : 0,
          minHeight: '100vh',
        }}
      >
        <Header
          style={{
            padding: '0 16px',
            background: 'rgba(26, 26, 26, 0.95)',
            borderBottom: '1px solid rgba(0, 204, 102, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            minHeight: '64px',
            maxHeight: '64px',
            overflow: 'hidden',
          }}
        >
          <Button
              type="text"
              icon={isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={() => (isMobile ? setMobileMenuOpen(true) : setCollapsed(!collapsed))}
              style={{ 
                fontSize: '16px', 
                width: 40, 
                height: 40,
                color: '#009944',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 204, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <Dropdown
              menu={{ items: notificationMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Badge count={unreadCount} size="small" color="#009944">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ 
                    fontSize: '16px',
                    color: '#009944',
                    borderRadius: '8px',
                    width: 40,
                    height: 40,
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 204, 102, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </Badge>
            </Dropdown>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px 4px 4px',
                  borderRadius: 8,
                  background: 'transparent',
                  transition: 'all 0.2s ease',
                  maxWidth: 200,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 204, 102, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size={28}
                  style={{
                    backgroundColor: '#009944',
                    flexShrink: 0,
                  }}
                />
                
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: isMobile ? '12px 8px' : '24px 16px',
            padding: 0,
            background: 'transparent',
            borderRadius: '16px',
            minHeight: isMobile ? 'calc(100vh - 88px)' : 'calc(100vh - 112px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
