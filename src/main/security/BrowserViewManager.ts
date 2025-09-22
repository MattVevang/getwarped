/**
 * Browser View Manager
 *
 * Manages Electron BrowserView instances with complete session isolation.
 * Handles BrowserView lifecycle, positioning, navigation, and security
 * controls for isolated service workspaces.
 *
 * @fileoverview BrowserView management with session isolation and security
 */

import { BrowserView, BrowserWindow, session, ipcMain } from 'electron';
import * as path from 'path';
import { EventEmitter } from 'events';
import { InputValidator, Validators } from '../../shared/validation/InputValidator';

/**
 * Browser view configuration
 */
export interface BrowserViewConfig {
  /** View identifier */
  viewId: string;
  /** Service identifier */
  serviceId: string;
  /** User identifier */
  userId: string;
  /** Initial URL to load */
  url: string;
  /** View bounds */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Session options */
  sessionOptions?: {
    /** Custom user agent */
    userAgent?: string;
    /** Disable web security (development only) */
    disableWebSecurity?: boolean;
    /** Allow running insecure content */
    allowRunningInsecureContent?: boolean;
  };
  /** Navigation restrictions */
  navigationRestrictions?: {
    /** Allowed domains */
    allowedDomains?: string[];
    /** Block external links */
    blockExternalLinks?: boolean;
    /** Allow file URLs */
    allowFileUrls?: boolean;
  };
}

/**
 * Browser view state
 */
export interface BrowserViewState {
  /** View identifier */
  viewId: string;
  /** Service identifier */
  serviceId: string;
  /** User identifier */
  userId: string;
  /** Current URL */
  currentUrl: string;
  /** Loading state */
  isLoading: boolean;
  /** Ready state */
  isReady: boolean;
  /** Error state */
  hasError: boolean;
  /** Last error message */
  lastError?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** View bounds */
  bounds: BrowserViewConfig['bounds'];
}

/**
 * Navigation result
 */
export interface NavigationResult {
  /** Whether navigation was allowed */
  allowed: boolean;
  /** Error message if not allowed */
  error?: string;
  /** Redirect URL if applicable */
  redirectUrl?: string;
}

/**
 * Browser view events
 */
export enum BrowserViewEvent {
  /** View created */
  CREATED = 'view:created',
  /** View destroyed */
  DESTROYED = 'view:destroyed',
  /** View attached to window */
  ATTACHED = 'view:attached',
  /** View detached from window */
  DETACHED = 'view:detached',
  /** Navigation started */
  NAVIGATION_STARTED = 'navigation:started',
  /** Navigation completed */
  NAVIGATION_COMPLETED = 'navigation:completed',
  /** Navigation failed */
  NAVIGATION_FAILED = 'navigation:failed',
  /** Navigation blocked */
  NAVIGATION_BLOCKED = 'navigation:blocked',
  /** Page title changed */
  TITLE_CHANGED = 'title:changed',
  /** Page favicon changed */
  FAVICON_CHANGED = 'favicon:changed',
  /** Console message */
  CONSOLE_MESSAGE = 'console:message',
  /** Security state changed */
  SECURITY_CHANGED = 'security:changed',
}

/**
 * BrowserView Manager class for isolated service views
 */
export class BrowserViewManager extends EventEmitter {
  private views: Map<string, BrowserView> = new Map();
  private viewStates: Map<string, BrowserViewState> = new Map();
  private viewSessions: Map<string, Electron.Session> = new Map();
  private attachedViews: Map<string, string> = new Map(); // windowId -> viewId
  private readonly defaultUserAgent = 'GetWarped/1.0.0';

  constructor() {
    super();
    this.setupIpcHandlers();
  }

  /**
   * Create a new browser view
   */
  async createBrowserView(
    config: BrowserViewConfig
  ): Promise<{ success: boolean; viewId?: string; error?: string }> {
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
      const isolatedSession = session.fromPartition(`persist:${sessionId}`);

      // Configure session
      await this.configureSession(isolatedSession, config);

      // Create browser view
      const browserView = new BrowserView({
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
      const viewState: BrowserViewState = {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create browser view',
      };
    }
  }

  /**
   * Destroy a browser view
   */
  async destroyBrowserView(viewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate view ID
      const validation = Validators.validateUUID
        ? Validators.validateUUID(viewId)
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to destroy browser view',
      };
    }
  }

  /**
   * Attach browser view to window
   */
  async attachViewToWindow(
    viewId: string,
    window: BrowserWindow
  ): Promise<{ success: boolean; error?: string }> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to attach view to window',
      };
    }
  }

  /**
   * Detach browser view from window
   */
  async detachViewFromWindow(
    viewId: string,
    windowId?: string
  ): Promise<{ success: boolean; error?: string }> {
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
      const window = BrowserWindow.fromId(parseInt(windowId));
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detach view from window',
      };
    }
  }

  /**
   * Navigate browser view to URL
   */
  async navigateToUrl(viewId: string, url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const browserView = this.views.get(viewId);
      const viewState = this.viewStates.get(viewId);

      if (!browserView || !viewState) {
        return { success: false, error: 'Browser view not found' };
      }

      // Validate URL
      const urlValidation = InputValidator.validateUrl(url);
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Navigation failed',
      };
    }
  }

  /**
   * Update browser view bounds
   */
  async updateViewBounds(
    viewId: string,
    bounds: BrowserViewConfig['bounds']
  ): Promise<{ success: boolean; error?: string }> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update view bounds',
      };
    }
  }

  /**
   * Get browser view state
   */
  getViewState(viewId: string): BrowserViewState | null {
    return this.viewStates.get(viewId) || null;
  }

  /**
   * Get all browser views for a service
   */
  getViewsForService(serviceId: string): BrowserViewState[] {
    const views: BrowserViewState[] = [];

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
  getViewsForUser(userId: string): BrowserViewState[] {
    const views: BrowserViewState[] = [];

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
  async clearServiceViews(
    serviceId: string
  ): Promise<{ success: boolean; clearedCount?: number; error?: string }> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear service views',
      };
    }
  }

  /**
   * Setup view event handlers
   */
  private setupViewEventHandlers(browserView: BrowserView, config: BrowserViewConfig): void {
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
  private async configureSession(
    session: Electron.Session,
    config: BrowserViewConfig
  ): Promise<void> {
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
        const allowed = this.isUrlAllowed(
          url.hostname,
          config.navigationRestrictions?.allowedDomains
        );

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
  private async checkNavigationAllowed(viewId: string, url: string): Promise<NavigationResult> {
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
    } catch (error) {
      return { allowed: false, error: 'Invalid URL' };
    }
  }

  /**
   * Check if URL hostname is allowed
   */
  private isUrlAllowed(hostname: string, allowedDomains?: string[]): boolean {
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
  private generateSessionId(serviceId: string, userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${serviceId}_${userId}_${timestamp}_${random}`;
  }

  /**
   * Get attached window ID for view
   */
  private getAttachedWindowId(viewId: string): string | undefined {
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
  private async cleanupSession(session: Electron.Session): Promise<void> {
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
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Setup IPC handlers for browser view management
   */
  private setupIpcHandlers(): void {
    ipcMain.handle('browser-view:create', async (_event, config: BrowserViewConfig) => {
      return await this.createBrowserView(config);
    });

    ipcMain.handle('browser-view:destroy', async (_event, viewId: string) => {
      return await this.destroyBrowserView(viewId);
    });

    ipcMain.handle('browser-view:navigate', async (_event, viewId: string, url: string) => {
      return await this.navigateToUrl(viewId, url);
    });

    ipcMain.handle('browser-view:get-state', (_event, viewId: string) => {
      return this.getViewState(viewId);
    });

    ipcMain.handle(
      'browser-view:update-bounds',
      async (_event, viewId: string, bounds: BrowserViewConfig['bounds']) => {
        return await this.updateViewBounds(viewId, bounds);
      }
    );
  }

  /**
   * Validate browser view configuration
   */
  private validateBrowserViewConfig(config: BrowserViewConfig): { valid: boolean; error?: string } {
    // Validate view ID
    if (!config.viewId || typeof config.viewId !== 'string') {
      return { valid: false, error: 'Invalid view ID' };
    }

    // Validate service ID
    const serviceValidation = Validators.validateUUID
      ? Validators.validateUUID(config.serviceId)
      : { valid: true };
    if (!serviceValidation.valid) {
      return { valid: false, error: 'Invalid service ID format' };
    }

    // Validate user ID
    const userValidation = InputValidator.validateText(config.userId, { minLength: 1 });
    if (!userValidation.valid) {
      return { valid: false, error: 'Invalid user ID' };
    }

    // Validate URL
    const urlValidation = InputValidator.validateUrl(config.url);
    if (!urlValidation.valid) {
      return { valid: false, error: 'Invalid URL format' };
    }

    // Validate bounds
    if (!config.bounds || typeof config.bounds !== 'object') {
      return { valid: false, error: 'Invalid bounds' };
    }

    const { x, y, width, height } = config.bounds;
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof width !== 'number' ||
      typeof height !== 'number'
    ) {
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
  destroy(): void {
    // Destroy all views
    const viewIds = Array.from(this.views.keys());
    for (const viewId of viewIds) {
      this.destroyBrowserView(viewId);
    }

    // Remove IPC handlers
    ipcMain.removeHandler('browser-view:create');
    ipcMain.removeHandler('browser-view:destroy');
    ipcMain.removeHandler('browser-view:navigate');
    ipcMain.removeHandler('browser-view:get-state');
    ipcMain.removeHandler('browser-view:update-bounds');

    // Clear all maps
    this.views.clear();
    this.viewStates.clear();
    this.viewSessions.clear();
    this.attachedViews.clear();

    // Remove all listeners
    this.removeAllListeners();
  }
}

export default BrowserViewManager;
