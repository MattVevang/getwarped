import { EventEmitter } from 'events';
import type { ApplicationLogger } from '../logging/ApplicationLogger';
/**
 * System performance metrics
 */
interface SystemMetrics {
    cpuUsagePercent: number;
    cpuLoadAverage: {
        oneMinute: number;
        fiveMinute: number;
        fifteenMinute: number;
    };
    cpuTemperature?: number;
    totalMemoryGB: number;
    freeMemoryGB: number;
    usedMemoryGB: number;
    memoryUsagePercent: number;
    availableMemoryGB: number;
    processMemoryMB: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers: number;
    };
    diskUsage?: {
        total: number;
        free: number;
        used: number;
        usagePercent: number;
    };
    networkInterfaces: {
        interface: string;
        address: string;
        family: string;
        internal: boolean;
    }[];
    platform: string;
    architecture: string;
    nodeVersion: string;
    electronVersion: string;
    chromeVersion: string;
    uptime: number;
    timestamp: Date;
}
/**
 * Application performance metrics
 */
interface ApplicationMetrics {
    windowCount: number;
    browserViewCount: number;
    webContentsCount: number;
    visibleWindows: number;
    v8HeapStatistics: {
        totalHeapSize: number;
        totalHeapSizeExecutable: number;
        totalPhysicalSize: number;
        totalAvailableSize: number;
        usedHeapSize: number;
        heapSizeLimit: number;
        mallocedMemory: number;
        peakMallocedMemory: number;
        doesZapGarbage: boolean;
        numberOfNativeContexts: number;
        numberOfDetachedContexts: number;
    };
    electronMetrics: {
        processId: number;
        type: string;
        cpu: {
            percentCPUUsage: number;
            idleWakeupsPerSecond: number;
        };
        creationTime: number;
        workingSetSize: number;
        peakWorkingSetSize: number;
        privateBytes: number | undefined;
    }[];
    performanceTiming: {
        responseStart: number | undefined;
        domContentLoaded: number | undefined;
        loadEventEnd: number | undefined;
        firstPaint: number | undefined;
        firstContentfulPaint: number | undefined;
    };
    eventLoopLag: number;
    timestamp: Date;
}
/**
 * Performance threshold configuration
 */
interface PerformanceThresholds {
    cpuUsage: {
        warning: number;
        critical: number;
    };
    memoryUsage: {
        warning: number;
        critical: number;
    };
    processMemory: {
        warning: number;
        critical: number;
    };
    diskUsage: {
        warning: number;
        critical: number;
    };
    eventLoopLag: {
        warning: number;
        critical: number;
    };
    heapUsage: {
        warning: number;
        critical: number;
    };
}
/**
 * Performance alert levels
 */
declare enum AlertLevel {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
/**
 * Performance alert
 */
interface PerformanceAlert {
    id: string;
    timestamp: Date;
    level: AlertLevel;
    metric: string;
    currentValue: number;
    threshold: number;
    message: string;
    resolved: boolean;
    resolvedAt?: Date;
    systemMetrics?: Partial<SystemMetrics>;
    applicationMetrics?: Partial<ApplicationMetrics>;
}
/**
 * Performance report configuration
 */
interface ReportConfig {
    includeSystemMetrics: boolean;
    includeApplicationMetrics: boolean;
    includeAlerts: boolean;
    includeHistoricalData: boolean;
    timeRange: {
        start: Date;
        end: Date;
    };
    format: 'json' | 'html' | 'csv';
}
/**
 * Performance report
 */
interface PerformanceReport {
    generatedAt: Date;
    timeRange: {
        start: Date;
        end: Date;
    };
    summary: {
        totalDataPoints: number;
        averageCpuUsage: number;
        averageMemoryUsage: number;
        peakCpuUsage: number;
        peakMemoryUsage: number;
        alertCount: {
            info: number;
            warning: number;
            critical: number;
        };
        uptime: number;
    };
    systemMetrics?: SystemMetrics[];
    applicationMetrics?: ApplicationMetrics[];
    alerts?: PerformanceAlert[];
    recommendations: string[];
}
/**
 * Performance monitoring events
 */
interface PerformanceMonitorEvents {
    'metrics-collected': {
        systemMetrics: SystemMetrics;
        applicationMetrics: ApplicationMetrics;
    };
    'alert-triggered': PerformanceAlert;
    'alert-resolved': PerformanceAlert;
    'threshold-exceeded': {
        metric: string;
        value: number;
        threshold: number;
        level: AlertLevel;
    };
    'report-generated': PerformanceReport;
    'monitoring-started': void;
    'monitoring-stopped': void;
    error: Error;
}
/**
 * Comprehensive performance monitoring system for GetWarped application.
 *
 * Features:
 * - System resource monitoring (CPU, memory, disk)
 * - Application-specific metrics (BrowserViews, memory usage)
 * - Real-time alerting with configurable thresholds
 * - Historical data storage and reporting
 * - Performance optimization recommendations
 * - Cross-platform compatibility
 */
export declare class PerformanceMonitor extends EventEmitter {
    private readonly logger;
    private readonly thresholds;
    private monitoringInterval;
    private alertCheckInterval;
    private isMonitoring;
    private readonly metricsHistory;
    private readonly alertHistory;
    private activeAlerts;
    private readonly maxHistorySize;
    private readonly monitoringIntervalMs;
    private readonly alertCheckIntervalMs;
    private eventLoopLagStart;
    private eventLoopLag;
    constructor(logger: ApplicationLogger, customThresholds?: Partial<PerformanceThresholds>);
    /**
     * Start performance monitoring
     */
    start(): void;
    /**
     * Stop performance monitoring
     */
    stop(): void;
    /**
     * Get current system metrics
     */
    getSystemMetrics(): Promise<SystemMetrics>;
    /**
     * Get current application metrics
     */
    getApplicationMetrics(): Promise<ApplicationMetrics>;
    /**
     * Collect both system and application metrics
     */
    private collectMetrics;
    /**
     * Check for performance alerts
     */
    private checkAlerts;
    /**
     * Check individual threshold
     */
    private checkThreshold;
    /**
     * Generate performance report
     */
    generateReport(config?: Partial<ReportConfig>): Promise<PerformanceReport>;
    /**
     * Get current performance status
     */
    getCurrentStatus(): {
        isMonitoring: boolean;
        activeAlerts: PerformanceAlert[];
        lastMetrics: {
            system: SystemMetrics;
            application: ApplicationMetrics;
        } | undefined;
    };
    /**
     * Clear metrics history
     */
    clearHistory(): void;
    /**
     * Update performance thresholds
     */
    updateThresholds(newThresholds: Partial<PerformanceThresholds>): void;
    /**
     * Initialize event loop lag monitoring
     */
    private initializeEventLoopMonitoring;
    /**
     * Get network interface information
     */
    private getNetworkInterfaces;
    /**
     * Get approximate BrowserView count
     */
    private getBrowserViewCount;
    /**
     * Convert bytes to MB
     */
    private bytesToMB;
    /**
     * Convert bytes to GB
     */
    private bytesToGB;
    /**
     * Calculate average of number array
     */
    private calculateAverage;
    /**
     * Generate performance recommendations
     */
    private generateRecommendations;
    /**
     * Handle cleanup
     */
    dispose(): Promise<void>;
    on<K extends keyof PerformanceMonitorEvents>(event: K, listener: (arg: PerformanceMonitorEvents[K]) => void): this;
    once<K extends keyof PerformanceMonitorEvents>(event: K, listener: (arg: PerformanceMonitorEvents[K]) => void): this;
    emit<K extends keyof PerformanceMonitorEvents>(event: K, arg: PerformanceMonitorEvents[K]): boolean;
}
export type { SystemMetrics, ApplicationMetrics, PerformanceThresholds, PerformanceAlert, PerformanceReport, ReportConfig, PerformanceMonitorEvents, };
export { AlertLevel };
export default PerformanceMonitor;
//# sourceMappingURL=PerformanceMonitor.d.ts.map