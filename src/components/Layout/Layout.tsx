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
  BarChartOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  UsergroupAddOutlined,
  ToolOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useProject } from '../../contexts/ProjectContext';
import Logo from '../Logo/Logo';
import { TierBadge } from '../ui/TierBadge';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
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

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/pmbok/schedule',
      icon: <CalendarOutlined />,
      label: 'Schedule',
    },
    {
      key: '/pmbok/cost',
      icon: <DollarOutlined />,
      label: 'Cost Management',
    },
    {
      key: '/pmbok/resources',
      icon: <ToolOutlined />,
      label: 'Resources',
    },
    {
      key: '/pmbok/risk',
      icon: <ExclamationCircleOutlined />,
      label: 'Risk Management',
    },
    {
      key: '/pmbok/stakeholders',
      icon: <UsergroupAddOutlined />,
      label: 'Stakeholders',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
    },
    ...(can('ENGINEER_AND_ABOVE') ? [
      {
        key: '/users',
        icon: <TeamOutlined />,
        label: 'Users',
      },
      {
        key: '/audit-log',
        icon: <AuditOutlined />,
        label: 'Audit Log',
      },
    ] : []),
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
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
    }
  };

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
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={256}
        collapsedWidth={64}
        style={{
          background: 'rgba(13, 13, 13, 0.95)',
          borderRight: '1px solid rgba(0, 204, 102, 0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(0, 204, 102, 0.2)',
            background: 'rgba(0, 204, 102, 0.05)',
            padding: '8px',
            margin: '8px',
            borderRadius: '12px',
          }}
        >
          <Logo 
            size={collapsed ? 'small' : 'medium'} 
            showText={!collapsed}
            className="sidebar-logo"
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            background: 'transparent',
            margin: '8px',
          }}
        />
      </Sider>

      <AntLayout>
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
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
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
            margin: '24px 16px',
            padding: 0,
            background: 'transparent',
            borderRadius: '16px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'hidden',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
