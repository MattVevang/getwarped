"use strict";
/**
 * ApplicationState: Redux Toolkit store structure and state management
 *
 * Defines the complete application state structure for Redux Toolkit.
 * This is the root state interface that encompasses all application data
 * including workspaces, services, UI preferences, and settings.
 *
 * @fileoverview ApplicationState and related state interfaces for Redux store
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_APPLICATION_STATE = void 0;
exports.isApplicationState = isApplicationState;
exports.isWorkspacesState = isWorkspacesState;
exports.isServicesState = isServicesState;
/**
 * Default initial state for new applications
 */
exports.INITIAL_APPLICATION_STATE = {
    workspaces: {
        items: {},
        activeWorkspaceId: null,
        loading: false,
        error: null,
        workspaceFormOpen: false,
        editingWorkspaceId: null,
        reorderMode: false,
    },
    services: {
        items: {},
        activeServiceId: null,
        templates: {},
        loading: false,
        error: null,
        serviceFormOpen: false,
        editingServiceId: null,
        templateModalOpen: false,
        healthStatus: {},
    },
    ui: {
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
            filters: {},
            results: [],
            searching: false,
        },
        toasts: [],
    },
    settings: {
        general: {
            startMinimized: false,
            minimizeToTray: true,
            autoUpdate: true,
            defaultWorkspace: '',
            checkUpdatesOnStartup: true,
            showInSystemTray: true,
            launchOnStartup: false,
        },
        privacy: {
            clearDataOnExit: false,
            blockAdsGlobally: true,
            blockTrackersGlobally: true,
            sendAnalytics: false,
            sendCrashReports: true,
            errorReporting: true,
            sessionTimeout: 480, // 8 hours
            requireAuthOnWake: false,
        },
        advanced: {
            hardwareAcceleration: true,
            debugMode: false,
            maxMemoryUsage: 1024, // 1GB
            enableDevTools: false,
            performanceMonitoring: false,
        },
        exportImport: {
            includeThemes: true,
            includePreferences: false,
            autoBackup: true,
            backupFrequency: 24, // Daily
            maxBackups: 7,
            compressExports: true,
        },
    },
};
/**
 * Type guards for runtime state validation
 */
function isApplicationState(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const state = obj;
    return (state.workspaces !== undefined &&
        state.services !== undefined &&
        state.ui !== undefined &&
        state.settings !== undefined);
}
function isWorkspacesState(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const state = obj;
    return (typeof state.items === 'object' &&
        typeof state.loading === 'boolean' &&
        (state.error === null || typeof state.error === 'string'));
}
function isServicesState(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const state = obj;
    return (typeof state.items === 'object' &&
        typeof state.templates === 'object' &&
        typeof state.loading === 'boolean' &&
        (state.error === null || typeof state.error === 'string'));
}
//# sourceMappingURL=ApplicationState.js.map