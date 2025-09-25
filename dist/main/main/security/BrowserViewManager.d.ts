/**
 * Browser View Manager
 *
 * Manages Electron BrowserView instances with complete session isolation.
 * Handles BrowserView lifecycle, positioning, navigation, and security
 * controls for isolated service workspaces.
 *
 * @fileoverview BrowserView management with session isolation and security
 */
import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
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
export declare enum BrowserViewEvent {
    /** View created */
    CREATED = "view:created",
    /** View destroyed */
    DESTROYED = "view:destroyed",
    /** View attached to window */
    ATTACHED = "view:attached",
    /** View detached from window */
    DETACHED = "view:detached",
    /** Navigation started */
    NAVIGATION_STARTED = "navigation:started",
    /** Navigation completed */
    NAVIGATION_COMPLETED = "navigation:completed",
    /** Navigation failed */
    NAVIGATION_FAILED = "navigation:failed",
    /** Navigation blocked */
    NAVIGATION_BLOCKED = "navigation:blocked",
    /** Page title changed */
    TITLE_CHANGED = "title:changed",
    /** Page favicon changed */
    FAVICON_CHANGED = "favicon:changed",
    /** Console message */
    CONSOLE_MESSAGE = "console:message",
    /** Security state changed */
    SECURITY_CHANGED = "security:changed"
}
/**
 * BrowserView Manager class for isolated service views
 */
export declare class BrowserViewManager extends EventEmitter {
    private views;
    private viewStates;
    private viewSessions;
    private attachedViews;
    private readonly defaultUserAgent;
    constructor();
    /**
     * Create a new browser view
     */
    createBrowserView(config: BrowserViewConfig): Promise<{
        success: boolean;
        viewId?: string;
        error?: string;
    }>;
    /**
     * Destroy a browser view
     */
    destroyBrowserView(viewId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Attach browser view to window
     */
    attachViewToWindow(viewId: string, window: BrowserWindow): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Detach browser view from window
     */
    detachViewFromWindow(viewId: string, windowId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Navigate browser view to URL
     */
    navigateToUrl(viewId: string, url: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Update browser view bounds
     */
    updateViewBounds(viewId: string, bounds: BrowserViewConfig['bounds']): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get browser view state
     */
    getViewState(viewId: string): BrowserViewState | null;
    /**
     * Get all browser views for a service
     */
    getViewsForService(serviceId: string): BrowserViewState[];
    /**
     * Get all browser views for a user
     */
    getViewsForUser(userId: string): BrowserViewState[];
    /**
     * Clear all browser views for a service
     */
    clearServiceViews(serviceId: string): Promise<{
        success: boolean;
        clearedCount?: number;
        error?: string;
    }>;
    /**
     * Setup view event handlers
     */
    private setupViewEventHandlers;
    /**
     * Configure session for isolation
     */
    private configureSession;
    /**
     * Check if navigation to URL is allowed
     */
    private checkNavigationAllowed;
    /**
     * Check if URL hostname is allowed
     */
    private isUrlAllowed;
    /**
     * Generate session ID for isolation
     */
    private generateSessionId;
    /**
     * Get attached window ID for view
     */
    private getAttachedWindowId;
    /**
     * Cleanup session resources
     */
    private cleanupSession;
    /**
     * Setup IPC handlers for browser view management
     */
    private setupIpcHandlers;
    /**
     * Validate browser view configuration
     */
    private validateBrowserViewConfig;
    /**
     * Cleanup all resources
     */
    destroy(): void;
}
export default BrowserViewManager;
//# sourceMappingURL=BrowserViewManager.d.ts.map