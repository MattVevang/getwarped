/**
 * NavigationControls - Comprehensive BrowserView navigation management
 *
 * Provides secure and controlled navigation capabilities for BrowserView instances:
 * - URL validation and filtering before navigation
 * - Navigation history management and controls
 * - Security checks and malicious URL blocking
 * - JavaScript execution controls and sandboxing
 * - Custom protocol handling and redirection
 * - Navigation event tracking and logging
 *
 * @fileoverview Secure navigation controls for BrowserView instances
 */
import { BrowserView } from 'electron';
import { EventEmitter } from 'events';
/**
 * Navigation action types
 */
export declare enum NavigationAction {
    NAVIGATE = "navigate",
    RELOAD = "reload",
    GO_BACK = "go_back",
    GO_FORWARD = "go_forward",
    STOP = "stop",
    REDIRECT = "redirect"
}
/**
 * Navigation security levels
 */
export declare enum SecurityLevel {
    STRICT = "strict",// Only allow whitelisted domains
    MODERATE = "moderate",// Block known malicious domains
    PERMISSIVE = "permissive"
}
/**
 * Navigation configuration
 */
export interface NavigationConfiguration {
    /** Service identifier */
    serviceId: string;
    /** Security level for navigation */
    securityLevel: SecurityLevel;
    /** Allowed domains (for strict mode) */
    allowedDomains?: string[];
    /** Blocked domains */
    blockedDomains?: string[];
    /** Allowed protocols */
    allowedProtocols?: string[];
    /** Whether to allow external navigation */
    allowExternalNavigation?: boolean;
    /** Whether to allow JavaScript execution */
    allowJavaScript?: boolean;
    /** Whether to allow redirects */
    allowRedirects?: boolean;
    /** Maximum redirect count */
    maxRedirects?: number;
    /** Custom user agent */
    userAgent?: string;
    /** Navigation timeout in milliseconds */
    navigationTimeout?: number;
}
/**
 * Navigation attempt information
 */
export interface NavigationAttempt {
    serviceId: string;
    action: NavigationAction;
    url: string;
    timestamp: Date;
    allowed: boolean;
    reason?: string;
    redirectCount: number;
    userInitiated: boolean;
}
/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
    url: string;
    title: string;
    timestamp: Date;
    canGoBack: boolean;
    canGoForward: boolean;
    isLoading: boolean;
    loadingProgress: number;
}
/**
 * Navigation events
 */
export interface NavigationControlsEvents {
    'navigation-started': (attempt: NavigationAttempt) => void;
    'navigation-completed': (attempt: NavigationAttempt) => void;
    'navigation-blocked': (attempt: NavigationAttempt) => void;
    'navigation-failed': (attempt: NavigationAttempt, error: Error) => void;
    'navigation-redirected': (attempt: NavigationAttempt, redirectUrl: string) => void;
    'history-updated': (serviceId: string, history: NavigationHistoryEntry) => void;
    'security-violation': (serviceId: string, violation: string) => void;
}
/**
 * Comprehensive navigation controls manager
 */
export declare class NavigationControls extends EventEmitter {
    private browserViews;
    private configurations;
    private navigationHistory;
    private redirectCounts;
    private navigationTimeouts;
    private readonly DEFAULT_TIMEOUT;
    private readonly MAX_HISTORY_ENTRIES;
    private readonly MALICIOUS_DOMAINS;
    constructor();
    /**
     * Register BrowserView with navigation controls
     */
    registerBrowserView(serviceId: string, browserView: BrowserView, config: NavigationConfiguration): void;
    /**
     * Unregister BrowserView from navigation controls
     */
    unregisterBrowserView(serviceId: string): void;
    /**
     * Navigate to URL with security checks
     */
    navigateToUrl(serviceId: string, url: string, userInitiated?: boolean): Promise<boolean>;
    /**
     * Reload current page
     */
    reloadPage(serviceId: string, ignoreCache?: boolean): boolean;
    /**
     * Navigate back in history
     */
    goBack(serviceId: string): boolean;
    /**
     * Navigate forward in history
     */
    goForward(serviceId: string): boolean;
    /**
     * Stop current navigation
     */
    stopNavigation(serviceId: string): boolean;
    /**
     * Get navigation history for service
     */
    getNavigationHistory(serviceId: string): NavigationHistoryEntry[];
    /**
     * Get current navigation state
     */
    getNavigationState(serviceId: string): NavigationHistoryEntry | null;
    /**
     * Execute JavaScript in BrowserView
     */
    executeJavaScript(serviceId: string, code: string, userInitiated?: boolean): Promise<any>;
    /**
     * Update navigation configuration
     */
    updateConfiguration(serviceId: string, config: Partial<NavigationConfiguration>): void;
    /**
     * Validate navigation attempt
     */
    private validateNavigation;
    /**
     * Setup navigation event handlers
     */
    private setupNavigationHandlers;
    /**
     * Update navigation history
     */
    private updateNavigationHistory;
    /**
     * Set navigation timeout
     */
    private setNavigationTimeout;
    /**
     * Clear navigation timeout
     */
    private clearNavigationTimeout;
    /**
     * Check if domain appears suspicious
     */
    private isSuspiciousDomain;
    /**
     * Check if JavaScript contains suspicious operations
     */
    private containsSuspiciousJavaScript;
    /**
     * Clean up navigation controls
     */
    destroy(): void;
}
export default NavigationControls;
//# sourceMappingURL=NavigationControls.d.ts.map