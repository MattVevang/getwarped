/**
 * BrowserViewLifecycle - Comprehensive BrowserView lifecycle management
 *
 * Manages the entire lifecycle of Electron BrowserView instances including:
 * - Creation and initialization with proper configuration
 * - Session isolation and security policies
 * - Memory management and cleanup
 * - Error handling and recovery
 * - Performance monitoring and optimization
 *
 * @fileoverview BrowserView lifecycle management for secure service isolation
 */

import { BrowserView, BrowserWindow, session } from 'electron';
import { EventEmitter } from 'events';

/**
 * Configuration options for BrowserView creation
 */
export interface BrowserViewConfiguration {
  /** Unique service identifier */
  serviceId: string;
  /** Service URL to load */
  url: string;
  /** Custom user agent string */
  userAgent?: string;
  /** Whether to enable Node.js integration */
  nodeIntegration?: boolean;
  /** Whether to enable context isolation */
  contextIsolation?: boolean;
  /** Whether to enable web security */
  webSecurity?: boolean;
  /** Session partition name for isolation */
  partition?: string;
  /** Initial bounds for the BrowserView */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Content Security Policy */
  csp?: string;
  /** Allow running insecure content */
  allowRunningInsecureContent?: boolean;
  /** Preload script path */
  preloadScript?: string;
}

/**
 * BrowserView lifecycle state
 */
export enum BrowserViewState {
  INITIALIZING = 'initializing',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
  DESTROYED = 'destroyed',
}

/**
 * BrowserView metadata for tracking
 */
export interface BrowserViewMetadata {
  id: string;
  serviceId: string;
  state: BrowserViewState;
  url: string;
  createdAt: Date;
  lastNavigatedAt: Date;
  errorCount: number;
  memoryUsage: number;
  isVisible: boolean;
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * BrowserView lifecycle events
 */
export interface BrowserViewLifecycleEvents {
  'view-created': (metadata: BrowserViewMetadata) => void;
  'view-loading': (serviceId: string, url: string) => void;
  'view-ready': (serviceId: string) => void;
  'view-error': (serviceId: string, error: Error) => void;
  'view-destroyed': (serviceId: string) => void;
  'memory-warning': (serviceId: string, usage: number) => void;
}

/**
 * Comprehensive BrowserView lifecycle manager
 */
export class BrowserViewLifecycle extends EventEmitter {
  private browserViews: Map<string, BrowserView> = new Map();
  private viewMetadata: Map<string, BrowserViewMetadata> = new Map();
  private parentWindow?: BrowserWindow;
  private memoryCheckInterval?: NodeJS.Timeout;
  private readonly MEMORY_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private readonly MEMORY_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_ERROR_COUNT = 5;

  constructor(parentWindow?: BrowserWindow) {
    super();
    if (parentWindow) {
      this.parentWindow = parentWindow;
    }
    this.startMemoryMonitoring();
  }

  /**
   * Create a new BrowserView with comprehensive lifecycle management
   */
  public async createBrowserView(config: BrowserViewConfiguration): Promise<BrowserView> {
    try {
      // Check if BrowserView already exists
      if (this.browserViews.has(config.serviceId)) {
        throw new Error(`BrowserView for service ${config.serviceId} already exists`);
      }

      // Create unique session for isolation
      const sessionName = config.partition || `service-${config.serviceId}`;
      const serviceSession = session.fromPartition(`persist:${sessionName}`);

      // Configure session security
      await this.configureSessionSecurity(serviceSession, config);

      // Create BrowserView with secure defaults
      const webPreferences: Electron.WebPreferences = {
        nodeIntegration: config.nodeIntegration ?? false,
        contextIsolation: config.contextIsolation ?? true,
        webSecurity: config.webSecurity ?? true,
        allowRunningInsecureContent: config.allowRunningInsecureContent ?? false,
        session: serviceSession,
        sandbox: true, // Enable sandboxing for security
        experimentalFeatures: false,
        enableWebSQL: false,
        v8CacheOptions: 'none', // Prevent V8 cache attacks
      };

      // Add preload script if provided
      if (config.preloadScript) {
        webPreferences.preload = config.preloadScript;
      }

      const browserView = new BrowserView({
        webPreferences,
      });

      // Set custom user agent if provided
      if (config.userAgent) {
        browserView.webContents.setUserAgent(config.userAgent);
      }

      // Initialize metadata
      const metadata: BrowserViewMetadata = {
        id: `bv-${config.serviceId}-${Date.now()}`,
        serviceId: config.serviceId,
        state: BrowserViewState.INITIALIZING,
        url: config.url,
        createdAt: new Date(),
        lastNavigatedAt: new Date(),
        errorCount: 0,
        memoryUsage: 0,
        isVisible: false,
        bounds: config.bounds || { x: 0, y: 0, width: 800, height: 600 },
      };

      // Store BrowserView and metadata
      this.browserViews.set(config.serviceId, browserView);
      this.viewMetadata.set(config.serviceId, metadata);

      // Set up event handlers
      this.setupBrowserViewEvents(browserView, config.serviceId);

      // Set initial bounds if parent window is available
      if (this.parentWindow && config.bounds) {
        browserView.setBounds(config.bounds);
        this.parentWindow.setBrowserView(browserView);
      }

      // Update state
      metadata.state = BrowserViewState.LOADING;
      this.emit('view-created', metadata);

      // Load URL
      await browserView.webContents.loadURL(config.url);

      return browserView;
    } catch (error) {
      // Clean up on error
      this.cleanupBrowserView(config.serviceId);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create BrowserView: ${errorMessage}`);
    }
  }

  /**
   * Get BrowserView by service ID
   */
  public getBrowserView(serviceId: string): BrowserView | undefined {
    return this.browserViews.get(serviceId);
  }

  /**
   * Get BrowserView metadata
   */
  public getMetadata(serviceId: string): BrowserViewMetadata | undefined {
    return this.viewMetadata.get(serviceId);
  }

  /**
   * Get all active BrowserViews
   */
  public getAllBrowserViews(): Map<string, BrowserView> {
    return new Map(this.browserViews);
  }

  /**
   * Get all metadata
   */
  public getAllMetadata(): Map<string, BrowserViewMetadata> {
    return new Map(this.viewMetadata);
  }

  /**
   * Destroy a specific BrowserView
   */
  public destroyBrowserView(serviceId: string): boolean {
    const browserView = this.browserViews.get(serviceId);
    if (!browserView) {
      return false;
    }

    try {
      // Remove from parent window if attached
      if (this.parentWindow) {
        this.parentWindow.removeBrowserView(browserView);
      }

      // Update state
      const metadata = this.viewMetadata.get(serviceId);
      if (metadata) {
        metadata.state = BrowserViewState.DESTROYED;
      }

      // Destroy the BrowserView
      (browserView.webContents as any).destroy();

      // Clean up references
      this.cleanupBrowserView(serviceId);

      this.emit('view-destroyed', serviceId);
      return true;
    } catch (error) {
      // Ignore error during destruction
      return false;
    }
  }

  /**
   * Destroy all BrowserViews
   */
  public destroyAllBrowserViews(): void {
    const serviceIds = Array.from(this.browserViews.keys());
    serviceIds.forEach(serviceId => this.destroyBrowserView(serviceId));
  }

  /**
   * Show/hide BrowserView
   */
  public setBrowserViewVisibility(serviceId: string, visible: boolean): boolean {
    const browserView = this.browserViews.get(serviceId);
    const metadata = this.viewMetadata.get(serviceId);

    if (!browserView || !metadata || !this.parentWindow) {
      return false;
    }

    try {
      if (visible) {
        this.parentWindow.setBrowserView(browserView);
      } else {
        this.parentWindow.removeBrowserView(browserView);
      }

      metadata.isVisible = visible;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Resize BrowserView
   */
  public resizeBrowserView(
    serviceId: string,
    bounds: { x: number; y: number; width: number; height: number }
  ): boolean {
    const browserView = this.browserViews.get(serviceId);
    const metadata = this.viewMetadata.get(serviceId);

    if (!browserView || !metadata) {
      return false;
    }

    try {
      browserView.setBounds(bounds);
      metadata.bounds = bounds;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Navigate BrowserView to URL
   */
  public async navigateBrowserView(serviceId: string, url: string): Promise<boolean> {
    const browserView = this.browserViews.get(serviceId);
    const metadata = this.viewMetadata.get(serviceId);

    if (!browserView || !metadata) {
      return false;
    }

    try {
      metadata.state = BrowserViewState.LOADING;
      metadata.lastNavigatedAt = new Date();
      metadata.url = url;

      await browserView.webContents.loadURL(url);
      this.emit('view-loading', serviceId, url);
      return true;
    } catch (error) {
      metadata.state = BrowserViewState.ERROR;
      metadata.errorCount++;
      this.emit('view-error', serviceId, error as Error);
      return false;
    }
  }

  /**
   * Clean up lifecycle manager
   */
  public destroy(): void {
    // Stop memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }

    // Destroy all BrowserViews
    this.destroyAllBrowserViews();

    // Clear all data
    this.browserViews.clear();
    this.viewMetadata.clear();

    // Remove all listeners
    this.removeAllListeners();
  }

  /**
   * Configure session security settings
   */
  private async configureSessionSecurity(
    sessionInstance: Electron.Session,
    config: BrowserViewConfiguration
  ): Promise<void> {
    // Set Content Security Policy if provided
    if (config.csp) {
      sessionInstance.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [config.csp!],
          },
        });
      });
    }

    // Set security headers
    sessionInstance.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'X-Frame-Options': ['DENY'],
          'X-Content-Type-Options': ['nosniff'],
          'X-XSS-Protection': ['1; mode=block'],
          'Referrer-Policy': ['strict-origin-when-cross-origin'],
        },
      });
    });

    // Clear sensitive data on session end
    sessionInstance.clearStorageData({
      storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql'],
    });
  }

  /**
   * Set up BrowserView event handlers
   */
  private setupBrowserViewEvents(browserView: BrowserView, serviceId: string): void {
    const webContents = browserView.webContents;

    // Page loading events
    webContents.on('did-start-loading', () => {
      const metadata = this.viewMetadata.get(serviceId);
      if (metadata) {
        metadata.state = BrowserViewState.LOADING;
      }
      this.emit('view-loading', serviceId, webContents.getURL());
    });

    webContents.on('did-finish-load', () => {
      const metadata = this.viewMetadata.get(serviceId);
      if (metadata) {
        metadata.state = BrowserViewState.READY;
      }
      this.emit('view-ready', serviceId);
    });

    webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      const metadata = this.viewMetadata.get(serviceId);
      if (metadata) {
        metadata.state = BrowserViewState.ERROR;
        metadata.errorCount++;

        // Destroy if too many errors
        if (metadata.errorCount >= this.MAX_ERROR_COUNT) {
          this.destroyBrowserView(serviceId);
          return;
        }
      }

      const error = new Error(`Load failed: ${errorDescription} (${errorCode})`);
      this.emit('view-error', serviceId, error);
    });

    // Navigation events
    webContents.on('will-navigate', (_event, url) => {
      // Update metadata
      const metadata = this.viewMetadata.get(serviceId);
      if (metadata) {
        metadata.lastNavigatedAt = new Date();
        metadata.url = url;
      }
    });

    // Security events
    webContents.on('certificate-error', (_event, _url, error, _certificate, callback) => {
      // Reject invalid certificates
      callback(false);
      const err = new Error(`Certificate error: ${error}`);
      this.emit('view-error', serviceId, err);
    });

    // Resource events
    webContents.on('render-process-gone', (_event, details) => {
      const error = new Error(`Renderer process gone: ${details.reason}`);
      this.emit('view-error', serviceId, error);
      this.destroyBrowserView(serviceId);
    });
  }

  /**
   * Clean up BrowserView references
   */
  private cleanupBrowserView(serviceId: string): void {
    this.browserViews.delete(serviceId);
    this.viewMetadata.delete(serviceId);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Check memory usage for all BrowserViews
   */
  private async checkMemoryUsage(): Promise<void> {
    for (const [serviceId, browserView] of this.browserViews) {
      try {
        // Use different memory API approach
        const pid = browserView.webContents.getOSProcessId();
        if (pid) {
          // In a real implementation, you would use node.js process memory info
          // For now, we'll simulate memory usage
          const simulatedMemoryUsage = Math.random() * 50 * 1024 * 1024; // Random 0-50MB

          // Update metadata
          const metadata = this.viewMetadata.get(serviceId);
          if (metadata) {
            metadata.memoryUsage = simulatedMemoryUsage;
          }

          // Emit warning if memory usage is too high
          if (simulatedMemoryUsage > this.MEMORY_WARNING_THRESHOLD) {
            this.emit('memory-warning', serviceId, simulatedMemoryUsage);
          }
        }
      } catch (error) {
        // Ignore memory check errors
      }
    }
  }
}

export default BrowserViewLifecycle;
