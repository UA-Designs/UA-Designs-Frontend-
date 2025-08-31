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
  const { user, logout } = useAuth();
  const { notifications, unreadCount } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

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
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorder}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: `1px solid ${token.colorBorder}`,
            background: 'transparent',
            padding: '8px',
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
          style={{ borderRight: 0 }}
        />
      </Sider>

      <AntLayout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Logo 
              size="small" 
              showText={false}
              className="header-logo"
            />
          </div>

          <Space size="middle">
            <Dropdown
              menu={{ items: notificationMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={{ fontSize: '16px' }}
                />
              </Badge>
            </Dropdown>

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: token.colorPrimary }}
                />
                {!collapsed && (
                  <div>
                    <Text strong>
                      {user?.firstName} {user?.lastName}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {user?.role?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: token.colorBgContainer,
            borderRadius: token.borderRadius,
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
