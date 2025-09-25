"use strict";
/**
 * IPCContracts: Type-safe IPC communication interfaces
 *
 * Defines all request/response interfaces for Electron main-renderer communication.
 * These contracts ensure type safety and consistent error handling across all IPC channels.
 * Each channel has strictly typed request/response pairs with comprehensive validation.
 *
 * @fileoverview Complete IPC contract definitions for GetWarped application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.IPCErrorCode = void 0;
/**
 * Common error codes used across IPC channels
 */
var IPCErrorCode;
(function (IPCErrorCode) {
    IPCErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    IPCErrorCode["SERVICE_NOT_FOUND"] = "SERVICE_NOT_FOUND";
    IPCErrorCode["WORKSPACE_NOT_FOUND"] = "WORKSPACE_NOT_FOUND";
    IPCErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    IPCErrorCode["STORAGE_ERROR"] = "STORAGE_ERROR";
    IPCErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    IPCErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    IPCErrorCode["BROWSER_VIEW_ERROR"] = "BROWSER_VIEW_ERROR";
    IPCErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    IPCErrorCode["EXPORT_ERROR"] = "EXPORT_ERROR";
    IPCErrorCode["IMPORT_ERROR"] = "IMPORT_ERROR";
    IPCErrorCode["SESSION_ERROR"] = "SESSION_ERROR";
})(IPCErrorCode || (exports.IPCErrorCode = IPCErrorCode = {}));
/**
 * IPC channel registry for type-safe communication
 */
exports.IPC_CHANNELS = {
    // Service management
    SERVICE_CREATE: 'service:create',
    SERVICE_UPDATE: 'service:update',
    SERVICE_DELETE: 'service:delete',
    SERVICE_LIST: 'service:list',
    SERVICE_REORDER: 'service:reorder',
    // Workspace management
    WORKSPACE_CREATE: 'workspace:create',
    WORKSPACE_UPDATE: 'workspace:update',
    WORKSPACE_DELETE: 'workspace:delete',
    WORKSPACE_LIST: 'workspace:list',
    WORKSPACE_ACTIVATE: 'workspace:activate',
    // Session management
    SESSION_CLEAR: 'session:clear',
    SESSION_CLEAR_ALL: 'session:clear-all',
    // BrowserView management
    BROWSERVIEW_CREATE: 'browserview:create',
    BROWSERVIEW_NAVIGATE: 'browserview:navigate',
    BROWSERVIEW_RESIZE: 'browserview:resize',
    BROWSERVIEW_DESTROY: 'browserview:destroy',
    // Configuration management
    CONFIG_EXPORT: 'config:export',
    CONFIG_IMPORT: 'config:import',
    CONFIG_VALIDATE: 'config:validate',
    // Settings management
    SETTINGS_GET: 'settings:get',
    SETTINGS_UPDATE: 'settings:update',
    // Event notifications (Main → Renderer)
    SERVICE_STATE_CHANGED: 'service:state-changed',
    WORKSPACE_CHANGED: 'workspace:changed',
    SESSION_EXPIRED: 'session:expired',
    NOTIFICATION_RECEIVED: 'notification:received',
};
//# sourceMappingURL=IPCContracts.js.map