"use strict";
/**
 * Browser View Manager
 *
 * Manages Electron BrowserView instances with complete session isolation.
 * Handles BrowserView lifecycle, positioning, navigation, and security
 * controls for isolated service workspaces.
 *
 * @fileoverview BrowserView management with session isolation and security
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserViewManager = exports.BrowserViewEvent = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const events_1 = require("events");
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * Browser view events
 */
var BrowserViewEvent;
(function (BrowserViewEvent) {
    /** View created */
    BrowserViewEvent["CREATED"] = "view:created";
    /** View destroyed */
    BrowserViewEvent["DESTROYED"] = "view:destroyed";
    /** View attached to window */
    BrowserViewEvent["ATTACHED"] = "view:attached";
    /** View detached from window */
    BrowserViewEvent["DETACHED"] = "view:detached";
    /** Navigation started */
    BrowserViewEvent["NAVIGATION_STARTED"] = "navigation:started";
    /** Navigation completed */
    BrowserViewEvent["NAVIGATION_COMPLETED"] = "navigation:completed";
    /** Navigation failed */
    BrowserViewEvent["NAVIGATION_FAILED"] = "navigation:failed";
    /** Navigation blocked */
    BrowserViewEvent["NAVIGATION_BLOCKED"] = "navigation:blocked";
    /** Page title changed */
    BrowserViewEvent["TITLE_CHANGED"] = "title:changed";
    /** Page favicon changed */
    BrowserViewEvent["FAVICON_CHANGED"] = "favicon:changed";
    /** Console message */
    BrowserViewEvent["CONSOLE_MESSAGE"] = "console:message";
    /** Security state changed */
    BrowserViewEvent["SECURITY_CHANGED"] = "security:changed";
})(BrowserViewEvent || (exports.BrowserViewEvent = BrowserViewEvent = {}));
/**
 * BrowserView Manager class for isolated service views
 */
class BrowserViewManager extends events_1.EventEmitter {
    views = new Map();
    viewStates = new Map();
    viewSessions = new Map();
    attachedViews = new Map(); // windowId -> viewId
    defaultUserAgent = 'GetWarped/1.0.0';
    constructor() {
        super();
        this.setupIpcHandlers();
    }
    /**
     * Create a new browser view
     */
    async createBrowserView(config) {
        try {
            // Validate configuration
            const validation = this.validateBrowserViewConfig(config);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Configuration validation failed' };
            }
            // Check if view already exists
            if (this.views.has(config.viewId)) {
                return { success: false, error: 'View ID already exists' };
            }
            // Create isolated session
            const sessionId = this.generateSessionId(config.serviceId, config.userId);
            const isolatedSession = electron_1.session.fromPartition(`persist:${sessionId}`);
            // Configure session
            await this.configureSession(isolatedSession, config);
            // Create browser view
            const browserView = new electron_1.BrowserView({
                webPreferences: {
                    session: isolatedSession,
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true,
                    webSecurity: !config.sessionOptions?.disableWebSecurity,
                    allowRunningInsecureContent: config.sessionOptions?.allowRunningInsecureContent || false,
                    preload: path.join(__dirname, '..', '..', 'preload', 'isolated-preload.js'),
                },
            });
            // Set initial bounds
            browserView.setBounds(config.bounds);
            // Setup view event handlers
            this.setupViewEventHandlers(browserView, config);
            // Store view and session
            this.views.set(config.viewId, browserView);
            this.viewSessions.set(config.viewId, isolatedSession);
            // Create view state
            const viewState = {
                viewId: config.viewId,
                serviceId: config.serviceId,
                userId: config.userId,
                currentUrl: config.url,
                isLoading: false,
                isReady: false,
                hasError: false,
                createdAt: new Date(),
                lastActivityAt: new Date(),
                bounds: config.bounds,
            };
            this.viewStates.set(config.viewId, viewState);
            // Load initial URL
            await browserView.webContents.loadURL(config.url);
            // Emit event
            this.emit(BrowserViewEvent.CREATED, { viewId: config.viewId, config });
            return { success: true, viewId: config.viewId };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create browser view',
            };
        }
    }
    /**
     * Destroy a browser view
     */
    async destroyBrowserView(viewId) {
        try {
            // Validate view ID
            const validation = InputValidator_1.Validators.validateUUID
                ? InputValidator_1.Validators.validateUUID(viewId)
                : { valid: true };
            if (!validation.valid) {
                return { success: false, error: 'Invalid view ID format' };
            }
            const browserView = this.views.get(viewId);
            if (!browserView) {
                return { success: false, error: 'Browser view not found' };
            }
            // Detach from window if attached
            const attachedWindowId = this.getAttachedWindowId(viewId);
            if (attachedWindowId) {
                await this.detachViewFromWindow(viewId, attachedWindowId);
            }
            // Clean up web contents
            if (!browserView.webContents.isDestroyed()) {
                browserView.webContents.close();
            }
            // Clean up session
            const session = this.viewSessions.get(viewId);
            if (session) {
                await this.cleanupSession(session);
                this.viewSessions.delete(viewId);
            }
            // Remove from maps
            this.views.delete(viewId);
            this.viewStates.delete(viewId);
            // Emit event
            this.emit(BrowserViewEvent.DESTROYED, { viewId });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to destroy browser view',
            };
        }
    }
    /**
     * Attach browser view to window
     */
    async attachViewToWindow(viewId, window) {
        try {
            const browserView = this.views.get(viewId);
            if (!browserView) {
                return { success: false, error: 'Browser view not found' };
            }
            // Detach any existing view from this window
            const existingViewId = this.attachedViews.get(window.id.toString());
            if (existingViewId) {
                await this.detachViewFromWindow(existingViewId, window.id.toString());
            }
            // Attach view to window
            window.setBrowserView(browserView);
            // Update attachment mapping
            this.attachedViews.set(window.id.toString(), viewId);
            // Update view state
            const viewState = this.viewStates.get(viewId);
            if (viewState) {
                viewState.lastActivityAt = new Date();
            }
            // Emit event
            this.emit(BrowserViewEvent.ATTACHED, { viewId, windowId: window.id });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to attach view to window',
            };
        }
    }
    /**
     * Detach browser view from window
     */
    async detachViewFromWindow(viewId, windowId) {
        try {
            const browserView = this.views.get(viewId);
            if (!browserView) {
                return { success: false, error: 'Browser view not found' };
            }
            // Find the window if not provided
            if (!windowId) {
                windowId = this.getAttachedWindowId(viewId);
                if (!windowId) {
                    return { success: false, error: 'View is not attached to any window' };
                }
            }
            // Get window instance
            const window = electron_1.BrowserWindow.fromId(parseInt(windowId));
            if (!window) {
                return { success: false, error: 'Window not found' };
            }
            // Detach view
            window.setBrowserView(null);
            // Remove attachment mapping
            this.attachedViews.delete(windowId);
            // Emit event
            this.emit(BrowserViewEvent.DETACHED, { viewId, windowId });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to detach view from window',
            };
        }
    }
    /**
     * Navigate browser view to URL
     */
    async navigateToUrl(viewId, url) {
        try {
            const browserView = this.views.get(viewId);
            const viewState = this.viewStates.get(viewId);
            if (!browserView || !viewState) {
                return { success: false, error: 'Browser view not found' };
            }
            // Validate URL
            const urlValidation = InputValidator_1.InputValidator.validateUrl(url);
            if (!urlValidation.valid) {
                return { success: false, error: 'Invalid URL format' };
            }
            // Check navigation restrictions
            const navigationResult = await this.checkNavigationAllowed(viewId, url);
            if (!navigationResult.allowed) {
                this.emit(BrowserViewEvent.NAVIGATION_BLOCKED, {
                    viewId,
                    url,
                    error: navigationResult.error,
                });
                return { success: false, error: navigationResult.error || 'Navigation blocked' };
            }
            // Update state
            viewState.isLoading = true;
            viewState.hasError = false;
            viewState.lastActivityAt = new Date();
            // Navigate
            await browserView.webContents.loadURL(url);
            // Emit event
            this.emit(BrowserViewEvent.NAVIGATION_STARTED, { viewId, url });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Navigation failed',
            };
        }
    }
    /**
     * Update browser view bounds
     */
    async updateViewBounds(viewId, bounds) {
        try {
            const browserView = this.views.get(viewId);
            const viewState = this.viewStates.get(viewId);
            if (!browserView || !viewState) {
                return { success: false, error: 'Browser view not found' };
            }
            // Validate bounds
            if (bounds.width < 0 || bounds.height < 0) {
                return { success: false, error: 'Invalid bounds - width and height must be positive' };
            }
            // Update bounds
            browserView.setBounds(bounds);
            // Update state
            viewState.bounds = bounds;
            viewState.lastActivityAt = new Date();
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update view bounds',
            };
        }
    }
    /**
     * Get browser view state
     */
    getViewState(viewId) {
        return this.viewStates.get(viewId) || null;
    }
    /**
     * Get all browser views for a service
     */
    getViewsForService(serviceId) {
        const views = [];
        for (const viewState of this.viewStates.values()) {
            if (viewState.serviceId === serviceId) {
                views.push(viewState);
            }
        }
        return views;
    }
    /**
     * Get all browser views for a user
     */
    getViewsForUser(userId) {
        const views = [];
        for (const viewState of this.viewStates.values()) {
            if (viewState.userId === userId) {
                views.push(viewState);
            }
        }
        return views;
    }
    /**
     * Clear all browser views for a service
     */
    async clearServiceViews(serviceId) {
        try {
            const serviceViews = this.getViewsForService(serviceId);
            let clearedCount = 0;
            for (const viewState of serviceViews) {
                const result = await this.destroyBrowserView(viewState.viewId);
                if (result.success) {
                    clearedCount++;
                }
            }
            return { success: true, clearedCount };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear service views',
            };
        }
    }
    /**
     * Setup view event handlers
     */
    setupViewEventHandlers(browserView, config) {
        const webContents = browserView.webContents;
        const viewId = config.viewId;
        // Navigation events
        webContents.on('did-start-loading', () => {
            const viewState = this.viewStates.get(viewId);
            if (viewState) {
                viewState.isLoading = true;
                viewState.lastActivityAt = new Date();
            }
        });
        webContents.on('did-finish-load', () => {
            const viewState = this.viewStates.get(viewId);
            if (viewState) {
                viewState.isLoading = false;
                viewState.isReady = true;
                viewState.hasError = false;
                viewState.currentUrl = webContents.getURL();
                viewState.lastActivityAt = new Date();
            }
            this.emit(BrowserViewEvent.NAVIGATION_COMPLETED, {
                viewId,
                url: webContents.getURL(),
            });
        });
        webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
            const viewState = this.viewStates.get(viewId);
            if (viewState) {
                viewState.isLoading = false;
                viewState.hasError = true;
                viewState.lastError = errorDescription;
                viewState.lastActivityAt = new Date();
            }
            this.emit(BrowserViewEvent.NAVIGATION_FAILED, {
                viewId,
                url: validatedURL,
                errorCode,
                errorDescription,
            });
        });
        // Page events
        webContents.on('page-title-updated', (_event, title) => {
            this.emit(BrowserViewEvent.TITLE_CHANGED, { viewId, title });
        });
        webContents.on('page-favicon-updated', (_event, favicons) => {
            this.emit(BrowserViewEvent.FAVICON_CHANGED, { viewId, favicons });
        });
        // Console events
        webContents.on('console-message', (_event, level, message, line, sourceId) => {
            this.emit(BrowserViewEvent.CONSOLE_MESSAGE, {
                viewId,
                level,
                message,
                line,
                sourceId,
            });
        });
        // Security events
        webContents.on('certificate-error', (_event, url, error, _certificate, callback) => {
            this.emit(BrowserViewEvent.SECURITY_CHANGED, {
                viewId,
                type: 'certificate-error',
                url,
                error,
            });
            // Block untrusted certificates by default
            callback(false);
        });
    }
    /**
     * Configure session for isolation
     */
    async configureSession(session, config) {
        // Set user agent
        const userAgent = config.sessionOptions?.userAgent || this.defaultUserAgent;
        session.setUserAgent(userAgent);
        // Configure permissions
        session.setPermissionRequestHandler((_webContents, _permission, callback) => {
            // Block all permissions by default for security
            callback(false);
        });
        // Block external resource loading if configured
        if (config.navigationRestrictions?.blockExternalLinks) {
            session.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
                const url = new URL(details.url);
                const allowed = this.isUrlAllowed(url.hostname, config.navigationRestrictions?.allowedDomains);
                callback({ cancel: !allowed });
            });
        }
        // Set security headers
        session.webRequest.onHeadersReceived((details, callback) => {
            const responseHeaders = details.responseHeaders || {};
            // Add security headers
            responseHeaders['X-Frame-Options'] = ['DENY'];
            responseHeaders['X-Content-Type-Options'] = ['nosniff'];
            responseHeaders['X-XSS-Protection'] = ['1; mode=block'];
            responseHeaders['Strict-Transport-Security'] = ['max-age=31536000; includeSubDomains'];
            callback({ responseHeaders });
        });
    }
    /**
     * Check if navigation to URL is allowed
     */
    async checkNavigationAllowed(viewId, url) {
        try {
            // Get view configuration from state
            const viewState = this.viewStates.get(viewId);
            if (!viewState) {
                return { allowed: false, error: 'View not found' };
            }
            // Parse URL
            const parsedUrl = new URL(url);
            // Check file URLs
            if (parsedUrl.protocol === 'file:') {
                // File URLs are blocked by default for security
                return { allowed: false, error: 'File URLs are not allowed' };
            }
            // Check allowed domains (this would need to be stored in view config)
            // For now, allow all HTTPS URLs
            if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
                return { allowed: true };
            }
            return { allowed: false, error: 'Protocol not allowed' };
        }
        catch (error) {
            return { allowed: false, error: 'Invalid URL' };
        }
    }
    /**
     * Check if URL hostname is allowed
     */
    isUrlAllowed(hostname, allowedDomains) {
        if (!allowedDomains || allowedDomains.length === 0) {
            return true; // No restrictions
        }
        return allowedDomains.some(domain => {
            if (domain.startsWith('*.')) {
                // Wildcard subdomain
                const baseDomain = domain.substring(2);
                return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
            }
            return hostname === domain;
        });
    }
    /**
     * Generate session ID for isolation
     */
    generateSessionId(serviceId, userId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${serviceId}_${userId}_${timestamp}_${random}`;
    }
    /**
     * Get attached window ID for view
     */
    getAttachedWindowId(viewId) {
        for (const [windowId, attachedViewId] of this.attachedViews.entries()) {
            if (attachedViewId === viewId) {
                return windowId;
            }
        }
        return undefined;
    }
    /**
     * Cleanup session resources
     */
    async cleanupSession(session) {
        try {
            // Clear storage data
            await session.clearStorageData({
                storages: [
                    'cookies',
                    'filesystem',
                    'indexdb',
                    'localstorage',
                    'shadercache',
                    'websql',
                    'serviceworkers',
                    'cachestorage',
                ],
            });
            // Clear cache
            await session.clearCache();
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
    /**
     * Setup IPC handlers for browser view management
     */
    setupIpcHandlers() {
        electron_1.ipcMain.handle('browser-view:create', async (_event, config) => {
            return await this.createBrowserView(config);
        });
        electron_1.ipcMain.handle('browser-view:destroy', async (_event, viewId) => {
            return await this.destroyBrowserView(viewId);
        });
        electron_1.ipcMain.handle('browser-view:navigate', async (_event, viewId, url) => {
            return await this.navigateToUrl(viewId, url);
        });
        electron_1.ipcMain.handle('browser-view:get-state', (_event, viewId) => {
            return this.getViewState(viewId);
        });
        electron_1.ipcMain.handle('browser-view:update-bounds', async (_event, viewId, bounds) => {
            return await this.updateViewBounds(viewId, bounds);
        });
    }
    /**
     * Validate browser view configuration
     */
    validateBrowserViewConfig(config) {
        // Validate view ID
        if (!config.viewId || typeof config.viewId !== 'string') {
            return { valid: false, error: 'Invalid view ID' };
        }
        // Validate service ID
        const serviceValidation = InputValidator_1.Validators.validateUUID
            ? InputValidator_1.Validators.validateUUID(config.serviceId)
            : { valid: true };
        if (!serviceValidation.valid) {
            return { valid: false, error: 'Invalid service ID format' };
        }
        // Validate user ID
        const userValidation = InputValidator_1.InputValidator.validateText(config.userId, { minLength: 1 });
        if (!userValidation.valid) {
            return { valid: false, error: 'Invalid user ID' };
        }
        // Validate URL
        const urlValidation = InputValidator_1.InputValidator.validateUrl(config.url);
        if (!urlValidation.valid) {
            return { valid: false, error: 'Invalid URL format' };
        }
        // Validate bounds
        if (!config.bounds || typeof config.bounds !== 'object') {
            return { valid: false, error: 'Invalid bounds' };
        }
        const { x, y, width, height } = config.bounds;
        if (typeof x !== 'number' ||
            typeof y !== 'number' ||
            typeof width !== 'number' ||
            typeof height !== 'number') {
            return { valid: false, error: 'Invalid bounds - all values must be numbers' };
        }
        if (width <= 0 || height <= 0) {
            return { valid: false, error: 'Invalid bounds - width and height must be positive' };
        }
        return { valid: true };
    }
    /**
     * Cleanup all resources
     */
    destroy() {
        // Destroy all views
        const viewIds = Array.from(this.views.keys());
        for (const viewId of viewIds) {
            this.destroyBrowserView(viewId);
        }
        // Remove IPC handlers
        electron_1.ipcMain.removeHandler('browser-view:create');
        electron_1.ipcMain.removeHandler('browser-view:destroy');
        electron_1.ipcMain.removeHandler('browser-view:navigate');
        electron_1.ipcMain.removeHandler('browser-view:get-state');
        electron_1.ipcMain.removeHandler('browser-view:update-bounds');
        // Clear all maps
        this.views.clear();
        this.viewStates.clear();
        this.viewSessions.clear();
        this.attachedViews.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
exports.BrowserViewManager = BrowserViewManager;
exports.default = BrowserViewManager;
//# sourceMappingURL=BrowserViewManager.js.map