import { create } from 'zustand';
import { Notification } from '../types';

interface UIStore {
  // Sidebar state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Theme state
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Modal states
  modals: {
    createProject: boolean;
    createTask: boolean;
    createRisk: boolean;
    createResource: boolean;
    userProfile: boolean;
    settings: boolean;
  };
  openModal: (modalName: keyof UIStore['modals']) => void;
  closeModal: (modalName: keyof UIStore['modals']) => void;
  closeAllModals: () => void;

  // Breadcrumb
  breadcrumbs: Array<{ title: string; path?: string }>;
  setBreadcrumbs: (
    breadcrumbs: Array<{ title: string; path?: string }>
  ) => void;

  // Page title
  pageTitle: string;
  setPageTitle: (title: string) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Filters
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;

  // Sort
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSort: (by: string, order: 'asc' | 'desc') => void;

  // Pagination
  currentPage: number;
  pageSize: number;
  setPagination: (page: number, size: number) => void;

  // Selected items
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  toggleSelectedItem: (itemId: string) => void;
  clearSelectedItems: () => void;
}

export const useUIStore = create<UIStore>(set => ({
  // Sidebar state
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Theme state
  theme: 'light',
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
  toggleTheme: () =>
    set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  // Loading states
  globalLoading: false,
  setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),

  // Notifications
  notifications: [],
  addNotification: notification => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },
  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },
  markNotificationAsRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
  },
  clearAllNotifications: () => set({ notifications: [] }),

  // Modal states
  modals: {
    createProject: false,
    createTask: false,
    createRisk: false,
    createResource: false,
    userProfile: false,
    settings: false,
  },
  openModal: modalName => {
    set(state => ({
      modals: { ...state.modals, [modalName]: true },
    }));
  },
  closeModal: modalName => {
    set(state => ({
      modals: { ...state.modals, [modalName]: false },
    }));
  },
  closeAllModals: () => {
    set(state => ({
      modals: Object.keys(state.modals).reduce(
        (acc, key) => {
          acc[key as keyof UIStore['modals']] = false;
          return acc;
        },
        {} as UIStore['modals']
      ),
    }));
  },

  // Breadcrumb
  breadcrumbs: [],
  setBreadcrumbs: breadcrumbs => set({ breadcrumbs }),

  // Page title
  pageTitle: 'Dashboard',
  setPageTitle: title => set({ pageTitle: title }),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: open => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () =>
    set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  // Search
  searchQuery: '',
  setSearchQuery: query => set({ searchQuery: query }),

  // Filters
  filters: {},
  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value },
    }));
  },
  clearFilters: () => set({ filters: {} }),

  // Sort
  sortBy: 'createdAt',
  sortOrder: 'desc',
  setSort: (by, order) => set({ sortBy: by, sortOrder: order }),

  // Pagination
  currentPage: 1,
  pageSize: 10,
  setPagination: (page, size) => set({ currentPage: page, pageSize: size }),

  // Selected items
  selectedItems: [],
  setSelectedItems: items => set({ selectedItems: items }),
  toggleSelectedItem: itemId => {
    set(state => {
      const isSelected = state.selectedItems.includes(itemId);
      return {
        selectedItems: isSelected
          ? state.selectedItems.filter(id => id !== itemId)
          : [...state.selectedItems, itemId],
      };
    });
  },
  clearSelectedItems: () => set({ selectedItems: [] }),
}));
