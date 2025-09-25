"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationControls = exports.SecurityLevel = exports.NavigationAction = void 0;
const events_1 = require("events");
const url_1 = require("url");
/**
 * Navigation action types
 */
var NavigationAction;
(function (NavigationAction) {
    NavigationAction["NAVIGATE"] = "navigate";
    NavigationAction["RELOAD"] = "reload";
    NavigationAction["GO_BACK"] = "go_back";
    NavigationAction["GO_FORWARD"] = "go_forward";
    NavigationAction["STOP"] = "stop";
    NavigationAction["REDIRECT"] = "redirect";
})(NavigationAction || (exports.NavigationAction = NavigationAction = {}));
/**
 * Navigation security levels
 */
var SecurityLevel;
(function (SecurityLevel) {
    SecurityLevel["STRICT"] = "strict";
    SecurityLevel["MODERATE"] = "moderate";
    SecurityLevel["PERMISSIVE"] = "permissive";
})(SecurityLevel || (exports.SecurityLevel = SecurityLevel = {}));
/**
 * Comprehensive navigation controls manager
 */
class NavigationControls extends events_1.EventEmitter {
    browserViews = new Map();
    configurations = new Map();
    navigationHistory = new Map();
    redirectCounts = new Map();
    navigationTimeouts = new Map();
    DEFAULT_TIMEOUT = 30000; // 30 seconds
    MAX_HISTORY_ENTRIES = 100;
    MALICIOUS_DOMAINS = new Set([
        'malware.example.com',
        'phishing.example.com',
        'suspicious.example.com',
    ]);
    constructor() {
        super();
    }
    /**
     * Register BrowserView with navigation controls
     */
    registerBrowserView(serviceId, browserView, config) {
        // Validate configuration
        if (!serviceId || !browserView) {
            throw new Error('Service ID and BrowserView are required');
        }
        // Store references
        this.browserViews.set(serviceId, browserView);
        this.configurations.set(serviceId, config);
        this.navigationHistory.set(serviceId, []);
        // Set up WebContents event handlers
        this.setupNavigationHandlers(serviceId, browserView.webContents);
    }
    /**
     * Unregister BrowserView from navigation controls
     */
    unregisterBrowserView(serviceId) {
        // Clear navigation timeout
        const timeoutId = this.navigationTimeouts.get(serviceId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.navigationTimeouts.delete(serviceId);
        }
        // Remove from maps
        this.browserViews.delete(serviceId);
        this.configurations.delete(serviceId);
        this.navigationHistory.delete(serviceId);
        this.redirectCounts.delete(serviceId);
    }
    /**
     * Navigate to URL with security checks
     */
    async navigateToUrl(serviceId, url, userInitiated = false) {
        const browserView = this.browserViews.get(serviceId);
        const config = this.configurations.get(serviceId);
        if (!browserView || !config) {
            return false;
        }
        const attempt = {
            serviceId,
            action: NavigationAction.NAVIGATE,
            url,
            timestamp: new Date(),
            allowed: false,
            redirectCount: this.redirectCounts.get(serviceId) || 0,
            userInitiated,
        };
        try {
            // Validate URL
            const validationResult = await this.validateNavigation(url, config);
            if (!validationResult.allowed) {
                if (validationResult.reason) {
                    attempt.reason = validationResult.reason;
                }
                this.emit('navigation-blocked', attempt);
                return false;
            }
            // Update attempt
            attempt.allowed = true;
            this.emit('navigation-started', attempt);
            // Set navigation timeout
            this.setNavigationTimeout(serviceId, config.navigationTimeout || this.DEFAULT_TIMEOUT);
            // Perform navigation
            const loadOptions = {};
            if (config.userAgent) {
                loadOptions.userAgent = config.userAgent;
            }
            await browserView.webContents.loadURL(url, loadOptions);
            return true;
        }
        catch (error) {
            this.emit('navigation-failed', attempt, error);
            return false;
        }
    }
    /**
     * Reload current page
     */
    reloadPage(serviceId, ignoreCache = false) {
        const browserView = this.browserViews.get(serviceId);
        if (!browserView) {
            return false;
        }
        try {
            const attempt = {
                serviceId,
                action: NavigationAction.RELOAD,
                url: browserView.webContents.getURL(),
                timestamp: new Date(),
                allowed: true,
                redirectCount: 0,
                userInitiated: true,
            };
            this.emit('navigation-started', attempt);
            if (ignoreCache) {
                browserView.webContents.reloadIgnoringCache();
            }
            else {
                browserView.webContents.reload();
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Navigate back in history
     */
    goBack(serviceId) {
        const browserView = this.browserViews.get(serviceId);
        if (!browserView || !browserView.webContents.canGoBack()) {
            return false;
        }
        try {
            const attempt = {
                serviceId,
                action: NavigationAction.GO_BACK,
                url: browserView.webContents.getURL(),
                timestamp: new Date(),
                allowed: true,
                redirectCount: 0,
                userInitiated: true,
            };
            this.emit('navigation-started', attempt);
            browserView.webContents.goBack();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Navigate forward in history
     */
    goForward(serviceId) {
        const browserView = this.browserViews.get(serviceId);
        if (!browserView || !browserView.webContents.canGoForward()) {
            return false;
        }
        try {
            const attempt = {
                serviceId,
                action: NavigationAction.GO_FORWARD,
                url: browserView.webContents.getURL(),
                timestamp: new Date(),
                allowed: true,
                redirectCount: 0,
                userInitiated: true,
            };
            this.emit('navigation-started', attempt);
            browserView.webContents.goForward();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Stop current navigation
     */
    stopNavigation(serviceId) {
        const browserView = this.browserViews.get(serviceId);
        if (!browserView) {
            return false;
        }
        try {
            browserView.webContents.stop();
            this.clearNavigationTimeout(serviceId);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get navigation history for service
     */
    getNavigationHistory(serviceId) {
        return this.navigationHistory.get(serviceId) || [];
    }
    /**
     * Get current navigation state
     */
    getNavigationState(serviceId) {
        const browserView = this.browserViews.get(serviceId);
        if (!browserView) {
            return null;
        }
        const webContents = browserView.webContents;
        return {
            url: webContents.getURL(),
            title: webContents.getTitle(),
            timestamp: new Date(),
            canGoBack: webContents.canGoBack(),
            canGoForward: webContents.canGoForward(),
            isLoading: webContents.isLoading(),
            loadingProgress: webContents.isLoading() ? 0.5 : 1.0, // Simplified progress
        };
    }
    /**
     * Execute JavaScript in BrowserView
     */
    async executeJavaScript(serviceId, code, userInitiated = false) {
        const browserView = this.browserViews.get(serviceId);
        const config = this.configurations.get(serviceId);
        if (!browserView || !config) {
            throw new Error('BrowserView or configuration not found');
        }
        // Check if JavaScript execution is allowed
        if (!config.allowJavaScript) {
            throw new Error('JavaScript execution is not allowed for this service');
        }
        // Validate JavaScript code for security
        if (this.containsSuspiciousJavaScript(code)) {
            this.emit('security-violation', serviceId, `Suspicious JavaScript execution attempt: ${code.substring(0, 100)}`);
            throw new Error('JavaScript code contains potentially dangerous operations');
        }
        try {
            return await browserView.webContents.executeJavaScript(code, userInitiated);
        }
        catch (error) {
            throw new Error(`JavaScript execution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Update navigation configuration
     */
    updateConfiguration(serviceId, config) {
        const currentConfig = this.configurations.get(serviceId);
        if (currentConfig) {
            this.configurations.set(serviceId, { ...currentConfig, ...config });
        }
    }
    /**
     * Validate navigation attempt
     */
    async validateNavigation(url, config) {
        try {
            // Parse URL
            const parsedUrl = new url_1.URL(url);
            // Check protocol
            if (config.allowedProtocols && !config.allowedProtocols.includes(parsedUrl.protocol)) {
                return { allowed: false, reason: `Protocol ${parsedUrl.protocol} not allowed` };
            }
            // Check for malicious domains
            if (this.MALICIOUS_DOMAINS.has(parsedUrl.hostname)) {
                return { allowed: false, reason: 'Domain is known to be malicious' };
            }
            // Check blocked domains
            if (config.blockedDomains?.includes(parsedUrl.hostname)) {
                return { allowed: false, reason: 'Domain is explicitly blocked' };
            }
            // Security level checks
            switch (config.securityLevel) {
                case SecurityLevel.STRICT:
                    if (!config.allowedDomains?.includes(parsedUrl.hostname)) {
                        return { allowed: false, reason: 'Domain not in whitelist (strict mode)' };
                    }
                    break;
                case SecurityLevel.MODERATE:
                    if (this.isSuspiciousDomain(parsedUrl.hostname)) {
                        return { allowed: false, reason: 'Domain appears suspicious' };
                    }
                    break;
                case SecurityLevel.PERMISSIVE:
                    // Basic checks already performed above
                    break;
            }
            // Check redirect limits
            const redirectCount = this.redirectCounts.get(config.serviceId) || 0;
            if (redirectCount >= (config.maxRedirects || 10)) {
                return { allowed: false, reason: 'Too many redirects' };
            }
            return { allowed: true };
        }
        catch (error) {
            return { allowed: false, reason: 'Invalid URL format' };
        }
    }
    /**
     * Setup navigation event handlers
     */
    setupNavigationHandlers(serviceId, webContents) {
        // Navigation start
        webContents.on('did-start-loading', () => {
            this.updateNavigationHistory(serviceId);
        });
        // Navigation complete
        webContents.on('did-finish-load', () => {
            this.clearNavigationTimeout(serviceId);
            this.updateNavigationHistory(serviceId);
            const attempt = {
                serviceId,
                action: NavigationAction.NAVIGATE,
                url: webContents.getURL(),
                timestamp: new Date(),
                allowed: true,
                redirectCount: 0,
                userInitiated: false,
            };
            this.emit('navigation-completed', attempt);
        });
        // Navigation failed
        webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
            this.clearNavigationTimeout(serviceId);
            const attempt = {
                serviceId,
                action: NavigationAction.NAVIGATE,
                url: validatedURL,
                timestamp: new Date(),
                allowed: false,
                reason: errorDescription,
                redirectCount: 0,
                userInitiated: false,
            };
            this.emit('navigation-failed', attempt, new Error(`${errorCode}: ${errorDescription}`));
        });
        // Handle redirects
        webContents.on('will-redirect', (_event, navigationUrl) => {
            const currentCount = this.redirectCounts.get(serviceId) || 0;
            this.redirectCounts.set(serviceId, currentCount + 1);
            const attempt = {
                serviceId,
                action: NavigationAction.REDIRECT,
                url: webContents.getURL(),
                timestamp: new Date(),
                allowed: true,
                redirectCount: currentCount + 1,
                userInitiated: false,
            };
            this.emit('navigation-redirected', attempt, navigationUrl);
        });
        // Handle new window attempts
        webContents.setWindowOpenHandler(_details => {
            // Block all popup windows for security
            return { action: 'deny' };
        });
        // Certificate errors
        webContents.on('certificate-error', (_event, url, _error, _certificate, callback) => {
            // Reject invalid certificates
            callback(false);
            this.emit('security-violation', serviceId, `Certificate error for ${url}`);
        });
    }
    /**
     * Update navigation history
     */
    updateNavigationHistory(serviceId) {
        const browserView = this.browserViews.get(serviceId);
        if (!browserView) {
            return;
        }
        const currentState = this.getNavigationState(serviceId);
        if (!currentState) {
            return;
        }
        const history = this.navigationHistory.get(serviceId) || [];
        // Add to history
        history.push(currentState);
        // Limit history size
        if (history.length > this.MAX_HISTORY_ENTRIES) {
            history.shift();
        }
        this.navigationHistory.set(serviceId, history);
        this.emit('history-updated', serviceId, currentState);
    }
    /**
     * Set navigation timeout
     */
    setNavigationTimeout(serviceId, timeoutMs) {
        // Clear existing timeout
        this.clearNavigationTimeout(serviceId);
        // Set new timeout
        const timeoutId = setTimeout(() => {
            this.stopNavigation(serviceId);
        }, timeoutMs);
        this.navigationTimeouts.set(serviceId, timeoutId);
    }
    /**
     * Clear navigation timeout
     */
    clearNavigationTimeout(serviceId) {
        const timeoutId = this.navigationTimeouts.get(serviceId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.navigationTimeouts.delete(serviceId);
        }
        // Reset redirect count on successful navigation
        this.redirectCounts.set(serviceId, 0);
    }
    /**
     * Check if domain appears suspicious
     */
    isSuspiciousDomain(hostname) {
        // Basic heuristics for suspicious domains
        const suspiciousPatterns = [
            /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
            /[a-z0-9]{10,}\.com/, // Random character domains
            /[0-9]+[a-z]+[0-9]+/, // Mixed numbers and letters
            /^[a-z]-[a-z]/, // Hyphen separated single letters
        ];
        return suspiciousPatterns.some(pattern => pattern.test(hostname));
    }
    /**
     * Check if JavaScript contains suspicious operations
     */
    containsSuspiciousJavaScript(code) {
        const suspiciousPatterns = [
            /eval\s*\(/i,
            /Function\s*\(/i,
            /setTimeout\s*\(\s*["']/i,
            /setInterval\s*\(\s*["']/i,
            /document\.write/i,
            /innerHTML\s*=/i,
            /outerHTML\s*=/i,
            /location\s*=/i,
            /window\.open/i,
        ];
        return suspiciousPatterns.some(pattern => pattern.test(code));
    }
    /**
     * Clean up navigation controls
     */
    destroy() {
        // Clear all timeouts
        for (const timeoutId of this.navigationTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        // Clear all maps
        this.browserViews.clear();
        this.configurations.clear();
        this.navigationHistory.clear();
        this.redirectCounts.clear();
        this.navigationTimeouts.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
exports.NavigationControls = NavigationControls;
exports.default = NavigationControls;
//# sourceMappingURL=NavigationControls.js.map