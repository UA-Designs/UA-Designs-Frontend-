import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Primary colors - Matching UA Designs logo
    colorPrimary: '#009944', // Darker, more sophisticated green
    colorSuccess: '#009944', // Darker green for success states
    colorWarning: '#ffaa00', // Orange for warnings
    colorError: '#ff0040', // Red for errors
    colorInfo: '#00aaff', // Blue for info

    // Background colors - Dark theme matching logo
    colorBgContainer: '#1a1a1a', // Dark grey containers
    colorBgElevated: '#2a2a2a', // Slightly lighter for elevated elements
    colorBgLayout: '#0d0d0d', // Very dark background
    colorBgSpotlight: '#333333', // Spotlight background

    // Text colors - Light text on dark background
    colorText: '#ffffff', // White primary text
    colorTextSecondary: '#b3b3b3', // Light grey secondary text
    colorTextTertiary: '#808080', // Medium grey tertiary text
    colorTextQuaternary: '#4d4d4d', // Dark grey quaternary text

    // Border colors - Subtle borders with neon accents
    colorBorder: '#333333', // Dark borders
    colorBorderSecondary: '#1a1a1a', // Even darker borders

    // Font - Modern, geometric typography matching logo
    fontFamily:
      "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 42, // Larger, more impactful headings
    fontSizeHeading2: 32,
    fontSizeHeading3: 26,
    fontSizeHeading4: 22,
    fontSizeHeading5: 18,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 22,

    // Border radius - Sharp, geometric edges matching logo
    borderRadius: 4, // More angular, less rounded
    borderRadiusLG: 6,
    borderRadiusSM: 2,

    // Spacing - Consistent geometric spacing
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

    // Height - Consistent control heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Box shadow - Glowing effects matching neon aesthetic
    boxShadow: '0 4px 16px rgba(0, 255, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 2px 8px rgba(0, 255, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.2)',

    // Animation - Smooth, modern transitions
    motionDurationFast: '0.15s',
    motionDurationMid: '0.25s',
    motionDurationSlow: '0.35s',
  },
  components: {
    Layout: {
      headerBg: '#1a1a1a', // Dark header matching logo
      siderBg: '#0d0d0d', // Very dark sidebar
      bodyBg: '#0d0d0d', // Dark body background
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#009944', // Darker green selection
      itemSelectedColor: '#000000', // Black text on green
      itemHoverBg: 'rgba(0, 153, 68, 0.1)', // Subtle green hover
      itemHoverColor: '#009944', // Darker green hover text
      itemActiveBg: '#009944', // Darker green active
      itemActiveColor: '#000000', // Black text on green
      itemColor: '#ffffff', // White text
      subMenuItemBg: 'transparent',
      darkItemBg: 'transparent',
      darkItemSelectedBg: '#00ff00',
      darkItemSelectedColor: '#000000',
      darkItemHoverBg: 'rgba(0, 255, 0, 0.1)',
      darkItemHoverColor: '#00ff00',
      darkItemActiveBg: '#00ff00',
      darkItemActiveColor: '#000000',
      darkItemColor: '#ffffff',
    },
    Button: {
      borderRadius: 4, // Sharp, geometric edges
      controlHeight: 40,
      fontWeight: 600, // Bolder text
      primaryShadow: '0 4px 16px rgba(0, 255, 0, 0.3)', // Neon glow
    },
    Card: {
      borderRadius: 6, // Slightly rounded but still geometric
      boxShadow: '0 4px 16px rgba(0, 255, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3)',
      headerBg: '#2a2a2a', // Dark card header
    },
    Table: {
      borderRadius: 6,
      headerBg: '#2a2a2a', // Dark table header
      headerColor: '#ffffff', // White header text
      rowHoverBg: 'rgba(0, 153, 68, 0.05)', // Subtle green hover
      borderColor: '#333333', // Dark borders
    },
    Form: {
      labelColor: '#ffffff', // White labels
      labelFontSize: 14,
      labelRequiredMarkColor: '#009944', // Darker green for required
    },
    Input: {
      borderRadius: 4, // Sharp edges
      controlHeight: 40,
      colorBgContainer: '#1a1a1a', // Dark input background
      colorBorder: '#333333', // Dark border
      colorText: '#ffffff', // White text
      colorTextPlaceholder: '#808080', // Grey placeholder
    },
    Select: {
      borderRadius: 4,
      controlHeight: 40,
      colorBgContainer: '#1a1a1a',
      colorBorder: '#333333',
      colorText: '#ffffff',
    },
    DatePicker: {
      borderRadius: 4,
      controlHeight: 40,
      colorBgContainer: '#1a1a1a',
      colorBorder: '#333333',
      colorText: '#ffffff',
    },
    Modal: {
      borderRadius: 6,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    Drawer: {
      borderRadius: 6,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    Notification: {
      borderRadius: 6,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    Message: {
      borderRadius: 4,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    Tooltip: {
      borderRadius: 4,
      colorBgSpotlight: '#2a2a2a',
      colorText: '#ffffff',
    },
    Popover: {
      borderRadius: 6,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    Dropdown: {
      borderRadius: 4,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    Tabs: {
      borderRadius: 4,
      colorText: '#ffffff',
      colorTextSecondary: '#b3b3b3',
    },
    Steps: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Progress: {
      borderRadius: 4,
      colorSuccess: '#00ff00',
    },
    Badge: {
      borderRadius: 2,
      colorSuccess: '#00ff00',
    },
    Tag: {
      borderRadius: 2,
      colorSuccess: '#00ff00',
    },
    Alert: {
      borderRadius: 4,
      colorInfo: '#00aaff',
      colorSuccess: '#00ff00',
      colorWarning: '#ffaa00',
      colorError: '#ff0040',
    },
    Skeleton: {
      borderRadius: 4,
      colorFill: '#2a2a2a',
    },
    Spin: {
      colorPrimary: '#00ff00',
    },
    Switch: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    Checkbox: {
      borderRadius: 2,
      colorPrimary: '#00ff00',
    },
    Radio: {
      borderRadius: 2,
      colorPrimary: '#00ff00',
    },
    Slider: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    Rate: {
      colorPrimary: '#00ff00',
    },
    Upload: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    Avatar: {
      borderRadius: 4,
    },
    Timeline: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Collapse: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Carousel: {
      borderRadius: 6,
    },
    Pagination: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    Breadcrumb: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Anchor: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    BackTop: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    Affix: {
      borderRadius: 4,
    },
    FloatButton: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    Segmented: {
      borderRadius: 4,
      colorPrimary: '#00ff00',
    },
    QRCode: {
      borderRadius: 4,
    },
    Watermark: {
      borderRadius: 4,
    },
    Tour: {
      borderRadius: 6,
      colorBgElevated: '#1a1a1a',
      colorText: '#ffffff',
    },
    App: {
      borderRadius: 4,
    },
    ConfigProvider: {
      borderRadius: 4,
    },
    Space: {
      borderRadius: 4,
    },
    Divider: {
      borderRadius: 4,
    },
    Flex: {
      borderRadius: 4,
    },
    Grid: {
      borderRadius: 4,
    },
    Row: {
      borderRadius: 4,
    },
    Col: {
      borderRadius: 4,
    },
    Statistic: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Descriptions: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Empty: {
      borderRadius: 4,
      colorText: '#b3b3b3',
    },
    Result: {
      borderRadius: 6,
      colorText: '#ffffff',
    },
    PageHeader: {
      borderRadius: 6,
      colorText: '#ffffff',
    },
    List: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Tree: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Transfer: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    TreeSelect: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Cascader: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    AutoComplete: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    Mentions: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
    InputNumber: {
      borderRadius: 4,
      colorText: '#ffffff',
    },
  },
};
