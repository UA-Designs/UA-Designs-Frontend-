import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout as AntLayout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Button,
  Space,
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
  CheckCircleOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  ExclamationCircleOutlined,
  UsergroupAddOutlined,
  ToolOutlined,
  BankOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Logo from '../Logo/Logo';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const { notifications, unreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Add debugging
  console.log('Layout rendering - isLoading:', isLoading, 'user:', user);

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
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: 'pmbok',
      icon: <ProjectOutlined />,
      label: 'PMBOK Knowledge Areas',
      children: [
        {
          key: '/pmbok/integration',
          icon: <GlobalOutlined />,
          label: 'Integration Management',
        },
        {
          key: '/pmbok/scope',
          icon: <FileTextOutlined />,
          label: 'Scope Management',
        },
        {
          key: '/pmbok/schedule',
          icon: <CalendarOutlined />,
          label: 'Schedule Management',
        },
        {
          key: '/pmbok/cost',
          icon: <DollarOutlined />,
          label: 'Cost Management',
        },
        {
          key: '/pmbok/quality',
          icon: <CheckCircleOutlined />,
          label: 'Quality Management',
        },
        {
          key: '/pmbok/resources',
          icon: <ToolOutlined />,
          label: 'Resource Management',
        },
        {
          key: '/pmbok/communications',
          icon: <MessageOutlined />,
          label: 'Communications Management',
        },
        {
          key: '/pmbok/risk',
          icon: <ExclamationCircleOutlined />,
          label: 'Risk Management',
        },
        {
          key: '/pmbok/procurement',
          icon: <ShoppingCartOutlined />,
          label: 'Procurement Management',
        },
        {
          key: '/pmbok/stakeholders',
          icon: <UsergroupAddOutlined />,
          label: 'Stakeholder Management',
        },
      ],
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Users',
    },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ 
                fontSize: '16px', 
                width: 48, 
                height: 48,
                color: '#009944',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                flexShrink: 0,
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
            <Logo 
              size="small" 
              showText={false}
              className="header-logo"
            />
          </div>

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
              <div style={{ 
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: '200px',
                minWidth: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 204, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  size="small"
                  style={{ 
                    backgroundColor: '#009944',
                    border: '2px solid rgba(0, 204, 102, 0.3)',
                    boxShadow: '0 2px 8px rgba(0, 204, 102, 0.3)',
                    flexShrink: 0,
                  }}
                />
                {!collapsed && (
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ 
                      color: '#ffffff', 
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ 
                      color: '#009944', 
                      fontSize: '11px', 
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {user?.role?.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                )}
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
