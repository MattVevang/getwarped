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
import { BrowserView, BrowserWindow } from 'electron';
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
export declare enum BrowserViewState {
    INITIALIZING = "initializing",
    LOADING = "loading",
    READY = "ready",
    ERROR = "error",
    DESTROYED = "destroyed"
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
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
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
export declare class BrowserViewLifecycle extends EventEmitter {
    private browserViews;
    private viewMetadata;
    private parentWindow?;
    private memoryCheckInterval?;
    private readonly MEMORY_WARNING_THRESHOLD;
    private readonly MEMORY_CHECK_INTERVAL;
    private readonly MAX_ERROR_COUNT;
    constructor(parentWindow?: BrowserWindow);
    /**
     * Create a new BrowserView with comprehensive lifecycle management
     */
    createBrowserView(config: BrowserViewConfiguration): Promise<BrowserView>;
    /**
     * Get BrowserView by service ID
     */
    getBrowserView(serviceId: string): BrowserView | undefined;
    /**
     * Get BrowserView metadata
     */
    getMetadata(serviceId: string): BrowserViewMetadata | undefined;
    /**
     * Get all active BrowserViews
     */
    getAllBrowserViews(): Map<string, BrowserView>;
    /**
     * Get all metadata
     */
    getAllMetadata(): Map<string, BrowserViewMetadata>;
    /**
     * Destroy a specific BrowserView
     */
    destroyBrowserView(serviceId: string): boolean;
    /**
     * Destroy all BrowserViews
     */
    destroyAllBrowserViews(): void;
    /**
     * Show/hide BrowserView
     */
    setBrowserViewVisibility(serviceId: string, visible: boolean): boolean;
    /**
     * Resize BrowserView
     */
    resizeBrowserView(serviceId: string, bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): boolean;
    /**
     * Navigate BrowserView to URL
     */
    navigateBrowserView(serviceId: string, url: string): Promise<boolean>;
    /**
     * Clean up lifecycle manager
     */
    destroy(): void;
    /**
     * Configure session security settings
     */
    private configureSessionSecurity;
    /**
     * Set up BrowserView event handlers
     */
    private setupBrowserViewEvents;
    /**
     * Clean up BrowserView references
     */
    private cleanupBrowserView;
    /**
     * Start memory monitoring
     */
    private startMemoryMonitoring;
    /**
     * Check memory usage for all BrowserViews
     */
    private checkMemoryUsage;
}
export default BrowserViewLifecycle;
//# sourceMappingURL=BrowserViewLifecycle.d.ts.map