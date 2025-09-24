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

import { BrowserView, WebContents } from 'electron';
import { EventEmitter } from 'events';
import { URL } from 'url';

/**
 * Navigation action types
 */
export enum NavigationAction {
  NAVIGATE = 'navigate',
  RELOAD = 'reload',
  GO_BACK = 'go_back',
  GO_FORWARD = 'go_forward',
  STOP = 'stop',
  REDIRECT = 'redirect',
}

/**
 * Navigation security levels
 */
export enum SecurityLevel {
  STRICT = 'strict', // Only allow whitelisted domains
  MODERATE = 'moderate', // Block known malicious domains
  PERMISSIVE = 'permissive', // Allow most navigation with basic checks
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
export class NavigationControls extends EventEmitter {
  private browserViews: Map<string, BrowserView> = new Map();
  private configurations: Map<string, NavigationConfiguration> = new Map();
  private navigationHistory: Map<string, NavigationHistoryEntry[]> = new Map();
  private redirectCounts: Map<string, number> = new Map();
  private navigationTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_HISTORY_ENTRIES = 100;
  private readonly MALICIOUS_DOMAINS = new Set([
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
  public registerBrowserView(
    serviceId: string,
    browserView: BrowserView,
    config: NavigationConfiguration
  ): void {
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
  public unregisterBrowserView(serviceId: string): void {
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
  public async navigateToUrl(
    serviceId: string,
    url: string,
    userInitiated = false
  ): Promise<boolean> {
    const browserView = this.browserViews.get(serviceId);
    const config = this.configurations.get(serviceId);

    if (!browserView || !config) {
      return false;
    }

    const attempt: NavigationAttempt = {
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
      const loadOptions: Electron.LoadURLOptions = {};
      if (config.userAgent) {
        loadOptions.userAgent = config.userAgent;
      }
      await browserView.webContents.loadURL(url, loadOptions);

      return true;
    } catch (error) {
      this.emit('navigation-failed', attempt, error as Error);
      return false;
    }
  }

  /**
   * Reload current page
   */
  public reloadPage(serviceId: string, ignoreCache = false): boolean {
    const browserView = this.browserViews.get(serviceId);
    if (!browserView) {
      return false;
    }

    try {
      const attempt: NavigationAttempt = {
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
      } else {
        browserView.webContents.reload();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Navigate back in history
   */
  public goBack(serviceId: string): boolean {
    const browserView = this.browserViews.get(serviceId);
    if (!browserView || !browserView.webContents.canGoBack()) {
      return false;
    }

    try {
      const attempt: NavigationAttempt = {
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Navigate forward in history
   */
  public goForward(serviceId: string): boolean {
    const browserView = this.browserViews.get(serviceId);
    if (!browserView || !browserView.webContents.canGoForward()) {
      return false;
    }

    try {
      const attempt: NavigationAttempt = {
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop current navigation
   */
  public stopNavigation(serviceId: string): boolean {
    const browserView = this.browserViews.get(serviceId);
    if (!browserView) {
      return false;
    }

    try {
      browserView.webContents.stop();
      this.clearNavigationTimeout(serviceId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get navigation history for service
   */
  public getNavigationHistory(serviceId: string): NavigationHistoryEntry[] {
    return this.navigationHistory.get(serviceId) || [];
  }

  /**
   * Get current navigation state
   */
  public getNavigationState(serviceId: string): NavigationHistoryEntry | null {
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
  public async executeJavaScript(
    serviceId: string,
    code: string,
    userInitiated = false
  ): Promise<any> {
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
      this.emit(
        'security-violation',
        serviceId,
        `Suspicious JavaScript execution attempt: ${code.substring(0, 100)}`
      );
      throw new Error('JavaScript code contains potentially dangerous operations');
    }

    try {
      return await browserView.webContents.executeJavaScript(code, userInitiated);
    } catch (error) {
      throw new Error(
        `JavaScript execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update navigation configuration
   */
  public updateConfiguration(serviceId: string, config: Partial<NavigationConfiguration>): void {
    const currentConfig = this.configurations.get(serviceId);
    if (currentConfig) {
      this.configurations.set(serviceId, { ...currentConfig, ...config });
    }
  }

  /**
   * Validate navigation attempt
   */
  private async validateNavigation(
    url: string,
    config: NavigationConfiguration
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Parse URL
      const parsedUrl = new URL(url);

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
    } catch (error) {
      return { allowed: false, reason: 'Invalid URL format' };
    }
  }

  /**
   * Setup navigation event handlers
   */
  private setupNavigationHandlers(serviceId: string, webContents: WebContents): void {
    // Navigation start
    webContents.on('did-start-loading', () => {
      this.updateNavigationHistory(serviceId);
    });

    // Navigation complete
    webContents.on('did-finish-load', () => {
      this.clearNavigationTimeout(serviceId);
      this.updateNavigationHistory(serviceId);

      const attempt: NavigationAttempt = {
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

      const attempt: NavigationAttempt = {
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

      const attempt: NavigationAttempt = {
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
  private updateNavigationHistory(serviceId: string): void {
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
  private setNavigationTimeout(serviceId: string, timeoutMs: number): void {
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
  private clearNavigationTimeout(serviceId: string): void {
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
  private isSuspiciousDomain(hostname: string): boolean {
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
  private containsSuspiciousJavaScript(code: string): boolean {
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
  public destroy(): void {
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

export default NavigationControls;
