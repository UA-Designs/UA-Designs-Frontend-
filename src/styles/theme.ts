import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Primary colors
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // Background colors
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgSpotlight: '#ffffff',

    // Text colors
    colorText: '#262626',
    colorTextSecondary: '#8c8c8c',
    colorTextTertiary: '#bfbfbf',
    colorTextQuaternary: '#d9d9d9',

    // Border colors
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // Font
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,

    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,

    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,

    // Height
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Box shadow
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.1)',

    // Animation
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#001529',
      bodyBg: '#f5f5f5',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#1890ff',
      itemSelectedColor: '#ffffff',
      itemHoverBg: '#f0f8ff',
      itemHoverColor: '#1890ff',
      itemActiveBg: '#1890ff',
      itemActiveColor: '#ffffff',
      itemColor: '#ffffff',
      subMenuItemBg: 'transparent',
      darkItemBg: 'transparent',
      darkItemSelectedBg: '#1890ff',
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: '#f0f8ff',
      darkItemHoverColor: '#1890ff',
      darkItemActiveBg: '#1890ff',
      darkItemActiveColor: '#ffffff',
      darkItemColor: '#ffffff',
    },
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      fontWeight: 500,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
      headerColor: '#262626',
      rowHoverBg: '#f5f5f5',
    },
    Form: {
      labelColor: '#262626',
      labelFontSize: 14,
      labelRequiredMarkColor: '#ff4d4f',
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 40,
    },
    DatePicker: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Modal: {
      borderRadius: 8,
    },
    Drawer: {
      borderRadius: 8,
    },
    Notification: {
      borderRadius: 8,
    },
    Message: {
      borderRadius: 6,
    },
    Tooltip: {
      borderRadius: 6,
    },
    Popover: {
      borderRadius: 8,
    },
    Dropdown: {
      borderRadius: 6,
    },
    Tabs: {
      borderRadius: 6,
    },
    Steps: {
      borderRadius: 6,
    },
    Progress: {
      borderRadius: 6,
    },
    Badge: {
      borderRadius: 4,
    },
    Tag: {
      borderRadius: 4,
    },
    Alert: {
      borderRadius: 6,
    },
    Skeleton: {
      borderRadius: 6,
    },
    Spin: {
      borderRadius: 6,
    },
    Switch: {
      borderRadius: 6,
    },
    Checkbox: {
      borderRadius: 4,
    },
    Radio: {
      borderRadius: 4,
    },
    Slider: {
      borderRadius: 6,
    },
    Rate: {
      borderRadius: 4,
    },
    Upload: {
      borderRadius: 6,
    },
    Avatar: {
      borderRadius: 6,
    },
    Timeline: {
      borderRadius: 6,
    },
    Collapse: {
      borderRadius: 6,
    },
    Carousel: {
      borderRadius: 8,
    },
    Pagination: {
      borderRadius: 6,
    },
    Breadcrumb: {
      borderRadius: 6,
    },
    Anchor: {
      borderRadius: 6,
    },
    BackTop: {
      borderRadius: 6,
    },
    Affix: {
      borderRadius: 6,
    },
    FloatButton: {
      borderRadius: 6,
    },
    Segmented: {
      borderRadius: 6,
    },
    QRCode: {
      borderRadius: 6,
    },
    Watermark: {
      borderRadius: 6,
    },
    Tour: {
      borderRadius: 8,
    },
    App: {
      borderRadius: 6,
    },
    ConfigProvider: {
      borderRadius: 6,
    },
    Space: {
      borderRadius: 6,
    },
    Divider: {
      borderRadius: 6,
    },
    Flex: {
      borderRadius: 6,
    },
    Grid: {
      borderRadius: 6,
    },
    Row: {
      borderRadius: 6,
    },
    Col: {
      borderRadius: 6,
    },
    Statistic: {
      borderRadius: 6,
    },
    Descriptions: {
      borderRadius: 6,
    },
    Empty: {
      borderRadius: 6,
    },
    Result: {
      borderRadius: 8,
    },
    PageHeader: {
      borderRadius: 8,
    },
    List: {
      borderRadius: 6,
    },
    Tree: {
      borderRadius: 6,
    },
    Transfer: {
      borderRadius: 6,
    },
    TreeSelect: {
      borderRadius: 6,
    },
    Cascader: {
      borderRadius: 6,
    },
    AutoComplete: {
      borderRadius: 6,
    },
    Mentions: {
      borderRadius: 6,
    },
    InputNumber: {
      borderRadius: 6,
    },
    Slider: {
      borderRadius: 6,
    },
    Rate: {
      borderRadius: 4,
    },
    Switch: {
      borderRadius: 6,
    },
    Checkbox: {
      borderRadius: 4,
    },
    Radio: {
      borderRadius: 4,
    },
    Upload: {
      borderRadius: 6,
    },
    Avatar: {
      borderRadius: 6,
    },
    Badge: {
      borderRadius: 4,
    },
    Tag: {
      borderRadius: 4,
    },
    Progress: {
      borderRadius: 6,
    },
    Skeleton: {
      borderRadius: 6,
    },
    Spin: {
      borderRadius: 6,
    },
    Alert: {
      borderRadius: 6,
    },
    Message: {
      borderRadius: 6,
    },
    Notification: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 8,
    },
    Drawer: {
      borderRadius: 8,
    },
    Popover: {
      borderRadius: 8,
    },
    Tooltip: {
      borderRadius: 6,
    },
    Dropdown: {
      borderRadius: 6,
    },
    Tabs: {
      borderRadius: 6,
    },
    Steps: {
      borderRadius: 6,
    },
    Timeline: {
      borderRadius: 6,
    },
    Collapse: {
      borderRadius: 6,
    },
    Carousel: {
      borderRadius: 8,
    },
    Pagination: {
      borderRadius: 6,
    },
    Breadcrumb: {
      borderRadius: 6,
    },
    Anchor: {
      borderRadius: 6,
    },
    BackTop: {
      borderRadius: 6,
    },
    Affix: {
      borderRadius: 6,
    },
    FloatButton: {
      borderRadius: 6,
    },
    Segmented: {
      borderRadius: 6,
    },
    QRCode: {
      borderRadius: 6,
    },
    Watermark: {
      borderRadius: 6,
    },
    Tour: {
      borderRadius: 8,
    },
    App: {
      borderRadius: 6,
    },
    ConfigProvider: {
      borderRadius: 6,
    },
    Space: {
      borderRadius: 6,
    },
    Divider: {
      borderRadius: 6,
    },
    Flex: {
      borderRadius: 6,
    },
    Grid: {
      borderRadius: 6,
    },
    Row: {
      borderRadius: 6,
    },
    Col: {
      borderRadius: 6,
    },
    Statistic: {
      borderRadius: 6,
    },
    Descriptions: {
      borderRadius: 6,
    },
    Empty: {
      borderRadius: 6,
    },
    Result: {
      borderRadius: 8,
    },
    PageHeader: {
      borderRadius: 8,
    },
    List: {
      borderRadius: 6,
    },
    Tree: {
      borderRadius: 6,
    },
    Transfer: {
      borderRadius: 6,
    },
    TreeSelect: {
      borderRadius: 6,
    },
    Cascader: {
      borderRadius: 6,
    },
    AutoComplete: {
      borderRadius: 6,
    },
    Mentions: {
      borderRadius: 6,
    },
    InputNumber: {
      borderRadius: 6,
    },
  },
};
