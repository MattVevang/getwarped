/**
 * ApplicationState: Redux Toolkit store structure and state management
 *
 * Defines the complete application state structure for Redux Toolkit.
 * This is the root state interface that encompasses all application data
 * including workspaces, services, UI preferences, and settings.
 *
 * @fileoverview ApplicationState and related state interfaces for Redux store
 */
import { Workspace } from './Workspace';
import { ServiceConfiguration } from './ServiceConfiguration';
import { ServiceTemplate } from './ServiceTemplate';
/**
 * Root application state managed by Redux Toolkit
 *
 * This is the top-level state structure that contains all application data.
 * Each major feature area has its own state slice with loading and error states.
 */
export interface ApplicationState {
    /** Workspace management state */
    workspaces: WorkspacesState;
    /** Service management state */
    services: ServicesState;
    /** UI preferences and temporary state */
    ui: UIState;
    /** Application settings and configuration */
    settings: SettingsState;
}
/**
 * State for workspace management
 * Handles workspace CRUD operations, selection, and organization
 */
export interface WorkspacesState {
    /** Workspaces indexed by ID for efficient lookup */
    items: Record<string, Workspace>;
    /** Currently selected workspace ID */
    activeWorkspaceId: string | null;
    /** Loading state for workspace operations */
    loading: boolean;
    /** Error message for failed workspace operations */
    error: string | null;
    /** Workspace creation/edit form state */
    workspaceFormOpen: boolean;
    /** ID of workspace being edited (null for creation) */
    editingWorkspaceId: string | null;
    /** Workspace reorder mode active */
    reorderMode: boolean;
}
/**
 * State for service management
 * Handles service CRUD operations, templates, and service selection
 */
export interface ServicesState {
    /** Services indexed by ID for efficient lookup */
    items: Record<string, ServiceConfiguration>;
    /** Currently active/displayed service ID */
    activeServiceId: string | null;
    /** Available service templates for quick setup */
    templates: Record<string, ServiceTemplate>;
    /** Loading state for service operations */
    loading: boolean;
    /** Error message for failed service operations */
    error: string | null;
    /** Service creation/edit form state */
    serviceFormOpen: boolean;
    /** ID of service being edited (null for creation) */
    editingServiceId: string | null;
    /** Template selection modal state */
    templateModalOpen: boolean;
    /** Service health check results */
    healthStatus: Record<string, ServiceHealthStatus>;
}
/**
 * Service health status for monitoring
 */
export interface ServiceHealthStatus {
    /** Service ID */
    serviceId: string;
    /** Health check status */
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    /** Last health check timestamp */
    lastChecked: Date;
    /** Response time in milliseconds */
    responseTime?: number;
    /** Error message if unhealthy */
    error?: string;
}
/**
 * UI state and preferences
 * Manages global UI settings, theme, and temporary display state
 */
export interface UIState {
    /** Sidebar collapsed/expanded state */
    sidebarCollapsed: boolean;
    /** Global theme preference */
    theme: 'light' | 'dark' | 'system';
    /** UI zoom level (0.5 - 2.0) */
    zoom: number;
    /** Interface language (ISO language code) */
    language: string;
    /** Global notification preference */
    notifications: boolean;
    /** Window state */
    window: WindowState;
    /** Modal and dialog states */
    modals: ModalState;
    /** Search and filter states */
    search: SearchState;
    /** Toast notification queue */
    toasts: ToastNotification[];
}
/**
 * Window state management
 */
export interface WindowState {
    /** Window width */
    width: number;
    /** Window height */
    height: number;
    /** Window maximized state */
    maximized: boolean;
    /** Window fullscreen state */
    fullscreen: boolean;
    /** Window always on top */
    alwaysOnTop: boolean;
    /** Window position */
    x?: number;
    /** Window position */
    y?: number;
}
/**
 * Modal and dialog states
 */
export interface ModalState {
    /** Settings modal open */
    settingsOpen: boolean;
    /** About modal open */
    aboutOpen: boolean;
    /** Export configuration modal open */
    exportModalOpen: boolean;
    /** Import configuration modal open */
    importModalOpen: boolean;
    /** Confirmation dialog state */
    confirmDialog: ConfirmDialogState | null;
}
/**
 * Confirmation dialog state
 */
export interface ConfirmDialogState {
    /** Dialog title */
    title: string;
    /** Dialog message */
    message: string;
    /** Confirm button text */
    confirmText: string;
    /** Cancel button text */
    cancelText: string;
    /** Callback function identifier */
    onConfirm: string;
    /** Cancel callback function identifier */
    onCancel?: string;
    /** Dialog type for styling */
    type: 'info' | 'warning' | 'error' | 'success' | 'delete';
    /** Additional details text */
    details?: string;
    /** Consequences warning text */
    consequences?: string;
    /** Require confirmation input for dangerous actions */
    requireConfirmation?: boolean;
    /** Text that must be typed to confirm */
    confirmationText?: string;
    /** Dialog width */
    width?: number;
    /** List of affected items to display */
    affectedItems?: string[];
    /** Label for affected items list */
    affectedItemsLabel?: string;
}
/**
 * Search and filter state
 */
export interface SearchState {
    /** Global search query */
    query: string;
    /** Active filters */
    filters: {
        category?: string;
        workspace?: string;
        status?: string;
    };
    /** Search results */
    results: SearchResult[];
    /** Search in progress */
    searching: boolean;
}
/**
 * Search result item
 */
export interface SearchResult {
    /** Result type */
    type: 'workspace' | 'service' | 'template';
    /** Item ID */
    id: string;
    /** Display title */
    title: string;
    /** Match description */
    description: string;
    /** Search relevance score */
    score: number;
}
/**
 * Toast notification for user feedback
 */
export interface ToastNotification {
    /** Notification ID */
    id: string;
    /** Notification type */
    type: 'info' | 'success' | 'warning' | 'error';
    /** Notification title */
    title: string;
    /** Notification message */
    message: string;
    /** Auto-dismiss timeout in ms */
    timeout?: number;
    /** Creation timestamp */
    createdAt: Date;
    /** Actions available on notification */
    actions?: ToastAction[];
}
/**
 * Toast notification action
 */
export interface ToastAction {
    /** Action label */
    label: string;
    /** Action callback identifier */
    action: string;
    /** Action style */
    style?: 'primary' | 'secondary' | 'danger';
}
/**
 * Application settings and configuration
 * Persistent settings that survive app restarts
 */
export interface SettingsState {
    /** General application settings */
    general: GeneralSettings;
    /** Privacy and security settings */
    privacy: PrivacySettings;
    /** Advanced technical settings */
    advanced: AdvancedSettings;
    /** Export/import preferences */
    exportImport: ExportImportSettings;
}
/**
 * General application settings
 */
export interface GeneralSettings {
    /** Start app minimized to system tray */
    startMinimized: boolean;
    /** Minimize to system tray instead of taskbar */
    minimizeToTray: boolean;
    /** Enable automatic updates */
    autoUpdate: boolean;
    /** Default workspace ID to open on startup */
    defaultWorkspace: string;
    /** Check for updates on startup */
    checkUpdatesOnStartup: boolean;
    /** Show in system tray */
    showInSystemTray: boolean;
    /** Launch on system startup */
    launchOnStartup: boolean;
}
/**
 * Privacy and security settings
 */
export interface PrivacySettings {
    /** Clear session data when app exits */
    clearDataOnExit: boolean;
    /** Enable global ad blocking */
    blockAdsGlobally: boolean;
    /** Enable global tracker blocking */
    blockTrackersGlobally: boolean;
    /** Send anonymous usage analytics */
    sendAnalytics: boolean;
    /** Send crash reports */
    sendCrashReports: boolean;
    /** Enable error reporting */
    errorReporting: boolean;
    /** Session timeout in minutes */
    sessionTimeout: number;
    /** Require authentication on wake */
    requireAuthOnWake: boolean;
}
/**
 * Advanced technical settings
 */
export interface AdvancedSettings {
    /** Enable hardware acceleration */
    hardwareAcceleration: boolean;
    /** Enable debug mode and logging */
    debugMode: boolean;
    /** Maximum memory usage limit in MB */
    maxMemoryUsage: number;
    /** Proxy configuration */
    proxySettings?: ProxySettings;
    /** Custom user data directory */
    customDataPath?: string;
    /** Enable dev tools in production */
    enableDevTools: boolean;
    /** Performance monitoring */
    performanceMonitoring: boolean;
}
/**
 * Proxy configuration settings
 */
export interface ProxySettings {
    /** Proxy type */
    type: 'http' | 'https' | 'socks4' | 'socks5';
    /** Proxy host */
    host: string;
    /** Proxy port */
    port: number;
    /** Proxy username */
    username?: string;
    /** Proxy password (stored in OS credentials) */
    password?: string;
    /** Enable proxy */
    enabled: boolean;
    /** Bypass proxy for local addresses */
    bypassLocal: boolean;
    /** Bypass rules */
    bypassRules: string[];
}
/**
 * Export/import preferences
 */
export interface ExportImportSettings {
    /** Default export location */
    defaultExportPath?: string;
    /** Include themes in exports */
    includeThemes: boolean;
    /** Include preferences in exports */
    includePreferences: boolean;
    /** Automatic backup enabled */
    autoBackup: boolean;
    /** Backup frequency in hours */
    backupFrequency: number;
    /** Maximum backup files to keep */
    maxBackups: number;
    /** Compress exports */
    compressExports: boolean;
}
/**
 * Default initial state for new applications
 */
export declare const INITIAL_APPLICATION_STATE: ApplicationState;
/**
 * Type guards for runtime state validation
 */
export declare function isApplicationState(obj: unknown): obj is ApplicationState;
export declare function isWorkspacesState(obj: unknown): obj is WorkspacesState;
export declare function isServicesState(obj: unknown): obj is ServicesState;
//# sourceMappingURL=ApplicationState.d.ts.map