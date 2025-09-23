/**
 * UI State Redux Slice
 *
 * Manages global UI state including theme, layout preferences, modal states,
 * window management, notifications, and user interface settings.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  UIState,
  WindowState,
  ModalState,
  ConfirmDialogState,
  SearchState,
  ToastNotification,
} from '../../../shared/types/ApplicationState';

/**
 * Toast notification interface for the UI slice
 */
interface CreateToastPayload {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Initial UI state with sensible defaults
 */
const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'system',
  zoom: 1.0,
  language: 'en',
  notifications: true,
  window: {
    width: 1200,
    height: 800,
    maximized: false,
    fullscreen: false,
    alwaysOnTop: false,
    x: undefined,
    y: undefined,
  },
  modals: {
    settingsOpen: false,
    aboutOpen: false,
    exportModalOpen: false,
    importModalOpen: false,
    confirmDialog: null,
  },
  search: {
    query: '',
    filters: {
      category: undefined,
      workspace: undefined,
      status: undefined,
    },
    results: [],
    searching: false,
  },
  toasts: [],
};

/**
 * UI slice definition
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar management
    toggleSidebar: state => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },

    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    // Zoom management
    setZoom: (state, action: PayloadAction<number>) => {
      // Clamp zoom between 0.5 and 2.0
      state.zoom = Math.max(0.5, Math.min(2.0, action.payload));
    },

    zoomIn: state => {
      state.zoom = Math.min(2.0, state.zoom + 0.1);
    },

    zoomOut: state => {
      state.zoom = Math.max(0.5, state.zoom - 0.1);
    },

    resetZoom: state => {
      state.zoom = 1.0;
    },

    // Language management
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },

    // Notifications management
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload;
    },

    // Window management
    updateWindowState: (state, action: PayloadAction<Partial<WindowState>>) => {
      state.window = { ...state.window, ...action.payload };
    },

    setWindowSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.window.width = action.payload.width;
      state.window.height = action.payload.height;
    },

    setWindowPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.window.x = action.payload.x;
      state.window.y = action.payload.y;
    },

    setWindowMaximized: (state, action: PayloadAction<boolean>) => {
      state.window.maximized = action.payload;
    },

    setWindowFullscreen: (state, action: PayloadAction<boolean>) => {
      state.window.fullscreen = action.payload;
    },

    setWindowAlwaysOnTop: (state, action: PayloadAction<boolean>) => {
      state.window.alwaysOnTop = action.payload;
    },

    // Modal management
    openSettingsModal: state => {
      state.modals.settingsOpen = true;
    },

    closeSettingsModal: state => {
      state.modals.settingsOpen = false;
    },

    openAboutModal: state => {
      state.modals.aboutOpen = true;
    },

    closeAboutModal: state => {
      state.modals.aboutOpen = false;
    },

    openExportModal: state => {
      state.modals.exportModalOpen = true;
    },

    closeExportModal: state => {
      state.modals.exportModalOpen = false;
    },

    openImportModal: state => {
      state.modals.importModalOpen = true;
    },

    closeImportModal: state => {
      state.modals.importModalOpen = false;
    },

    // Confirmation dialog management
    showConfirmDialog: (state, action: PayloadAction<ConfirmDialogState>) => {
      state.modals.confirmDialog = action.payload;
    },

    hideConfirmDialog: state => {
      state.modals.confirmDialog = null;
    },

    // Search management
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.search.query = action.payload;
    },

    setSearchActive: (state, action: PayloadAction<boolean>) => {
      if (!action.payload) {
        state.search.query = '';
        state.search.results = [];
      }
    },

    setSearchLoading: (state, action: PayloadAction<boolean>) => {
      state.search.searching = action.payload;
    },

    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.search.results = action.payload;
      state.search.searching = false;
    },

    clearSearch: state => {
      state.search.query = '';
      state.search.results = [];
      state.search.searching = false;
    },

    updateSearchFilters: (state, action: PayloadAction<Partial<SearchState['filters']>>) => {
      state.search.filters = { ...state.search.filters, ...action.payload };
    },

    // Toast notifications management
    addToast: (state, action: PayloadAction<CreateToastPayload>) => {
      const toast: ToastNotification = {
        id: action.payload.id || `toast-${Date.now()}-${Math.random()}`,
        type: action.payload.type,
        title: '', // We'll use message as both title and message for simplicity
        message: action.payload.message,
        timeout: action.payload.duration || (action.payload.type === 'error' ? 6000 : 4000),
        createdAt: new Date(),
        actions: action.payload.action
          ? [
              {
                label: action.payload.action.label,
                action: 'custom-action',
                style: 'primary',
              },
            ]
          : undefined,
      };

      state.toasts.push(toast);

      // Limit to 5 toasts maximum
      if (state.toasts.length > 5) {
        state.toasts = state.toasts.slice(-5);
      }
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },

    clearAllToasts: state => {
      state.toasts = [];
    },

    // Keyboard shortcuts management
    handleKeyboardShortcut: (state, action: PayloadAction<string>) => {
      const shortcut = action.payload;

      switch (shortcut) {
        case 'toggle-sidebar':
          state.sidebarCollapsed = !state.sidebarCollapsed;
          break;
        case 'zoom-in':
          state.zoom = Math.min(2.0, state.zoom + 0.1);
          break;
        case 'zoom-out':
          state.zoom = Math.max(0.5, state.zoom - 0.1);
          break;
        case 'reset-zoom':
          state.zoom = 1.0;
          break;
        case 'toggle-search':
          // Toggle search by clearing or setting a default state
          if (state.search.query) {
            state.search.query = '';
            state.search.results = [];
          }
          break;
        case 'open-settings':
          state.modals.settingsOpen = true;
          break;
        default:
          break;
      }
    },

    // Bulk state updates for initialization
    initializeUIState: (state, action: PayloadAction<Partial<UIState>>) => {
      Object.assign(state, action.payload);
    },

    // Reset to defaults
    resetUIState: state => {
      Object.assign(state, initialState);
    },
  },
});

// Export actions
export const {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  setZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  setLanguage,
  setNotifications,
  updateWindowState,
  setWindowSize,
  setWindowPosition,
  setWindowMaximized,
  setWindowFullscreen,
  setWindowAlwaysOnTop,
  openSettingsModal,
  closeSettingsModal,
  openAboutModal,
  closeAboutModal,
  openExportModal,
  closeExportModal,
  openImportModal,
  closeImportModal,
  showConfirmDialog,
  hideConfirmDialog,
  setSearchQuery,
  setSearchActive,
  setSearchLoading,
  setSearchResults,
  clearSearch,
  updateSearchFilters,
  addToast,
  removeToast,
  clearAllToasts,
  handleKeyboardShortcut,
  initializeUIState,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectZoom = (state: { ui: UIState }) => state.ui.zoom;
export const selectLanguage = (state: { ui: UIState }) => state.ui.language;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectWindowState = (state: { ui: UIState }) => state.ui.window;
export const selectModalState = (state: { ui: UIState }) => state.ui.modals;
export const selectSearchState = (state: { ui: UIState }) => state.ui.search;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectConfirmDialog = (state: { ui: UIState }) => state.ui.modals.confirmDialog;

// Computed selectors
export const selectEffectiveTheme = (state: { ui: UIState }) => {
  const theme = state.ui.theme;
  if (theme === 'system') {
    // In a real app, this would check the system theme
    // For now, default to light
    return 'light';
  }
  return theme;
};

export const selectIsAnyModalOpen = (state: { ui: UIState }) => {
  const modals = state.ui.modals;
  return (
    modals.settingsOpen ||
    modals.aboutOpen ||
    modals.exportModalOpen ||
    modals.importModalOpen ||
    modals.confirmDialog !== null
  );
};

export default uiSlice.reducer;
