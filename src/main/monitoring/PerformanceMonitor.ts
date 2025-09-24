import { EventEmitter } from 'events';
import * as os from 'os';
import * as process from 'process';
import { app, BrowserWindow, webContents } from 'electron';
import type { ApplicationLogger } from '../logging/ApplicationLogger';

/**
 * System performance metrics
 */
interface SystemMetrics {
  // CPU metrics
  cpuUsagePercent: number;
  cpuLoadAverage: {
    oneMinute: number;
    fiveMinute: number;
    fifteenMinute: number;
  };
  cpuTemperature?: number; // If available

  // Memory metrics
  totalMemoryGB: number;
  freeMemoryGB: number;
  usedMemoryGB: number;
  memoryUsagePercent: number;
  availableMemoryGB: number;

  // Process-specific memory
  processMemoryMB: {
    rss: number; // Resident Set Size
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };

  // Disk metrics
  diskUsage?: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };

  // Network metrics (basic)
  networkInterfaces: {
    interface: string;
    address: string;
    family: string;
    internal: boolean;
  }[];

  // System info
  platform: string;
  architecture: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  uptime: number;

  // Timestamp
  timestamp: Date;
}

/**
 * Application performance metrics
 */
interface ApplicationMetrics {
  // Window performance
  windowCount: number;
  browserViewCount: number;
  webContentsCount: number;
  visibleWindows: number;

  // JavaScript engine performance
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

  // Electron-specific metrics
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

  // Performance timing
  performanceTiming: {
    responseStart: number | undefined;
    domContentLoaded: number | undefined;
    loadEventEnd: number | undefined;
    firstPaint: number | undefined;
    firstContentfulPaint: number | undefined;
  };

  // Event loop metrics
  eventLoopLag: number;

  // Timestamp
  timestamp: Date;
}

/**
 * Performance threshold configuration
 */
interface PerformanceThresholds {
  // CPU thresholds
  cpuUsage: {
    warning: number; // %
    critical: number; // %
  };

  // Memory thresholds
  memoryUsage: {
    warning: number; // %
    critical: number; // %
  };

  processMemory: {
    warning: number; // MB
    critical: number; // MB
  };

  // Disk thresholds
  diskUsage: {
    warning: number; // %
    critical: number; // %
  };

  // Performance thresholds
  eventLoopLag: {
    warning: number; // ms
    critical: number; // ms
  };

  heapUsage: {
    warning: number; // %
    critical: number; // %
  };
}

/**
 * Performance alert levels
 */
enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
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

  // Context information
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
export class PerformanceMonitor extends EventEmitter {
  private readonly logger: ApplicationLogger;
  private readonly thresholds: PerformanceThresholds;

  private monitoringInterval: NodeJS.Timeout | undefined;
  private alertCheckInterval: NodeJS.Timeout | undefined;
  private isMonitoring = false;
  private readonly metricsHistory: Array<{
    system: SystemMetrics;
    application: ApplicationMetrics;
  }> = [];
  private readonly alertHistory: PerformanceAlert[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();

  private readonly maxHistorySize = 1000; // Keep last 1000 data points
  private readonly monitoringIntervalMs = 30000; // 30 seconds
  private readonly alertCheckIntervalMs = 5000; // 5 seconds

  // Event loop lag measurement
  private eventLoopLagStart: bigint = 0n;
  private eventLoopLag = 0;

  constructor(logger: ApplicationLogger, customThresholds?: Partial<PerformanceThresholds>) {
    super();
    this.logger = logger;

    // Default thresholds
    this.thresholds = {
      cpuUsage: {
        warning: 70,
        critical: 90,
      },
      memoryUsage: {
        warning: 80,
        critical: 95,
      },
      processMemory: {
        warning: 1024, // 1GB
        critical: 2048, // 2GB
      },
      diskUsage: {
        warning: 85,
        critical: 95,
      },
      eventLoopLag: {
        warning: 100, // 100ms
        critical: 500, // 500ms
      },
      heapUsage: {
        warning: 80,
        critical: 95,
      },
      ...customThresholds,
    };

    this.initializeEventLoopMonitoring();
    this.logger.info('Initialized PerformanceMonitor with thresholds', {
      thresholds: this.thresholds,
    });
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      this.logger.warn('PerformanceMonitor already monitoring');
      return;
    }

    this.isMonitoring = true;

    // Start metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics().catch(error => {
        this.logger.error('Error collecting performance metrics', error as Error);
        this.emit('error', error);
      });
    }, this.monitoringIntervalMs);

    // Start alert checking
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts().catch(error => {
        this.logger.error('Error checking performance alerts', error as Error);
        this.emit('error', error);
      });
    }, this.alertCheckIntervalMs);

    this.logger.info('Started performance monitoring');
    this.emit('monitoring-started', undefined);
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      this.logger.warn('PerformanceMonitor not currently monitoring');
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = undefined;
    }

    this.logger.info('Stopped performance monitoring');
    this.emit('monitoring-stopped', undefined);
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memUsage = process.memoryUsage();

    // Get CPU usage (approximation using load average)
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsagePercent = Math.min(((loadAvg[0] || 0) / cpuCount) * 100, 100);

    return {
      // CPU metrics
      cpuUsagePercent,
      cpuLoadAverage: {
        oneMinute: loadAvg[0] || 0,
        fiveMinute: loadAvg[1] || 0,
        fifteenMinute: loadAvg[2] || 0,
      },

      // Memory metrics
      totalMemoryGB: this.bytesToGB(totalMemory),
      freeMemoryGB: this.bytesToGB(freeMemory),
      usedMemoryGB: this.bytesToGB(usedMemory),
      memoryUsagePercent: (usedMemory / totalMemory) * 100,
      availableMemoryGB: this.bytesToGB(freeMemory),

      // Process memory
      processMemoryMB: {
        rss: this.bytesToMB(memUsage.rss),
        heapTotal: this.bytesToMB(memUsage.heapTotal),
        heapUsed: this.bytesToMB(memUsage.heapUsed),
        external: this.bytesToMB(memUsage.external),
        arrayBuffers: this.bytesToMB(memUsage.arrayBuffers),
      },

      // Network interfaces
      networkInterfaces: this.getNetworkInterfaces(),

      // System info
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron || 'unknown',
      chromeVersion: process.versions.chrome || 'unknown',
      uptime: os.uptime(),

      timestamp: new Date(),
    };
  }

  /**
   * Get current application metrics
   */
  async getApplicationMetrics(): Promise<ApplicationMetrics> {
    const allWindows = BrowserWindow.getAllWindows();
    const visibleWindows = allWindows.filter(win => win.isVisible()).length;
    const allWebContents = webContents.getAllWebContents();

    // Get V8 heap statistics
    const v8Stats = process.memoryUsage();

    // Get Electron process metrics
    const electronMetrics = app.getAppMetrics().map(metric => ({
      processId: metric.pid,
      type: metric.type as string,
      cpu: {
        percentCPUUsage: metric.cpu.percentCPUUsage,
        idleWakeupsPerSecond: metric.cpu.idleWakeupsPerSecond,
      },
      creationTime: metric.creationTime,
      workingSetSize: metric.memory ? metric.memory.workingSetSize : 0,
      peakWorkingSetSize: metric.memory ? metric.memory.peakWorkingSetSize : 0,
      privateBytes: metric.memory?.privateBytes,
    }));

    return {
      windowCount: allWindows.length,
      browserViewCount: this.getBrowserViewCount(),
      webContentsCount: allWebContents.length,
      visibleWindows,

      v8HeapStatistics: {
        totalHeapSize: v8Stats.heapTotal || 0,
        totalHeapSizeExecutable: 0, // Not directly available
        totalPhysicalSize: 0, // Not directly available
        totalAvailableSize: 0, // Not directly available
        usedHeapSize: v8Stats.heapUsed || 0,
        heapSizeLimit: 0, // Not directly available
        mallocedMemory: v8Stats.external || 0,
        peakMallocedMemory: 0, // Not directly available
        doesZapGarbage: false, // Not directly available
        numberOfNativeContexts: allWebContents.length,
        numberOfDetachedContexts: 0, // Not directly available
      },

      electronMetrics,

      performanceTiming: {
        // These would be collected from renderer processes
        responseStart: undefined,
        domContentLoaded: undefined,
        loadEventEnd: undefined,
        firstPaint: undefined,
        firstContentfulPaint: undefined,
      },

      eventLoopLag: this.eventLoopLag,
      timestamp: new Date(),
    };
  }

  /**
   * Collect both system and application metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const systemMetrics = await this.getSystemMetrics();
      const applicationMetrics = await this.getApplicationMetrics();

      // Store in history
      this.metricsHistory.push({ system: systemMetrics, application: applicationMetrics });

      // Maintain max history size
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      this.logger.debug('Metrics collected', {
        systemMetrics: {
          cpuUsage: systemMetrics.cpuUsagePercent,
          memoryUsage: systemMetrics.memoryUsagePercent,
          processMemory: systemMetrics.processMemoryMB.rss,
        },
        applicationMetrics: {
          windowCount: applicationMetrics.windowCount,
          eventLoopLag: applicationMetrics.eventLoopLag,
        },
      });

      this.emit('metrics-collected', { systemMetrics, applicationMetrics });
    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error as Error);
      throw error;
    }
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(): Promise<void> {
    if (this.metricsHistory.length === 0) {
      return;
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) {
      return;
    }

    const { system, application } = latest;

    // Check CPU usage
    await this.checkThreshold(
      'cpu_usage',
      system.cpuUsagePercent,
      this.thresholds.cpuUsage,
      '%',
      system,
      application
    );

    // Check memory usage
    await this.checkThreshold(
      'memory_usage',
      system.memoryUsagePercent,
      this.thresholds.memoryUsage,
      '%',
      system,
      application
    );

    // Check process memory
    await this.checkThreshold(
      'process_memory',
      system.processMemoryMB.rss,
      this.thresholds.processMemory,
      'MB',
      system,
      application
    );

    // Check event loop lag
    await this.checkThreshold(
      'event_loop_lag',
      application.eventLoopLag,
      this.thresholds.eventLoopLag,
      'ms',
      system,
      application
    );

    // Check heap usage
    const heapUsagePercent =
      application.v8HeapStatistics.totalHeapSize > 0
        ? (application.v8HeapStatistics.usedHeapSize / application.v8HeapStatistics.totalHeapSize) *
          100
        : 0;
    await this.checkThreshold(
      'heap_usage',
      heapUsagePercent,
      this.thresholds.heapUsage,
      '%',
      system,
      application
    );

    // Check disk usage if available
    if (system.diskUsage) {
      await this.checkThreshold(
        'disk_usage',
        system.diskUsage.usagePercent,
        this.thresholds.diskUsage,
        '%',
        system,
        application
      );
    }
  }

  /**
   * Check individual threshold
   */
  private async checkThreshold(
    metricName: string,
    currentValue: number,
    threshold: { warning: number; critical: number },
    unit: string,
    systemMetrics: SystemMetrics,
    applicationMetrics: ApplicationMetrics
  ): Promise<void> {
    let level: AlertLevel | null = null;
    let thresholdValue = 0;

    if (currentValue >= threshold.critical) {
      level = AlertLevel.CRITICAL;
      thresholdValue = threshold.critical;
    } else if (currentValue >= threshold.warning) {
      level = AlertLevel.WARNING;
      thresholdValue = threshold.warning;
    }

    const alertId = `${metricName}_${level}`;

    if (level) {
      // Check if this alert is already active
      if (!this.activeAlerts.has(alertId)) {
        const alert: PerformanceAlert = {
          id: alertId,
          timestamp: new Date(),
          level,
          metric: metricName,
          currentValue,
          threshold: thresholdValue,
          message: `${metricName.replace('_', ' ')} is ${level}: ${currentValue.toFixed(2)}${unit} (threshold: ${thresholdValue}${unit})`,
          resolved: false,
          systemMetrics,
          applicationMetrics,
        };

        this.activeAlerts.set(alertId, alert);
        this.alertHistory.push(alert);

        this.logger.warn('Performance alert triggered', {
          alert: {
            id: alert.id,
            level: alert.level,
            metric: alert.metric,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
            message: alert.message,
          },
        });

        this.emit('alert-triggered', alert);
        this.emit('threshold-exceeded', {
          metric: metricName,
          value: currentValue,
          threshold: thresholdValue,
          level,
        });
      }
    } else {
      // Check if we need to resolve any active alerts for this metric
      const activeAlert = Array.from(this.activeAlerts.values()).find(
        alert => alert.metric === metricName && !alert.resolved
      );

      if (activeAlert) {
        activeAlert.resolved = true;
        activeAlert.resolvedAt = new Date();
        this.activeAlerts.delete(activeAlert.id);

        this.logger.info('Performance alert resolved', {
          alert: {
            id: activeAlert.id,
            level: activeAlert.level,
            metric: activeAlert.metric,
            resolvedAt: activeAlert.resolvedAt,
          },
        });

        this.emit('alert-resolved', activeAlert);
      }
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(config: Partial<ReportConfig> = {}): Promise<PerformanceReport> {
    const defaultConfig: ReportConfig = {
      includeSystemMetrics: true,
      includeApplicationMetrics: true,
      includeAlerts: true,
      includeHistoricalData: true,
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
      },
      format: 'json',
    };

    const reportConfig = { ...defaultConfig, ...config };

    // Filter data by time range
    const filteredHistory = this.metricsHistory.filter(entry => {
      const timestamp = entry.system.timestamp;
      return timestamp >= reportConfig.timeRange.start && timestamp <= reportConfig.timeRange.end;
    });

    const filteredAlerts = this.alertHistory.filter(alert => {
      return (
        alert.timestamp >= reportConfig.timeRange.start &&
        alert.timestamp <= reportConfig.timeRange.end
      );
    });

    // Calculate summary statistics
    const cpuValues = filteredHistory.map(h => h.system.cpuUsagePercent);
    const memoryValues = filteredHistory.map(h => h.system.memoryUsagePercent);

    const summary = {
      totalDataPoints: filteredHistory.length,
      averageCpuUsage: this.calculateAverage(cpuValues),
      averageMemoryUsage: this.calculateAverage(memoryValues),
      peakCpuUsage: Math.max(...cpuValues, 0),
      peakMemoryUsage: Math.max(...memoryValues, 0),
      alertCount: {
        info: filteredAlerts.filter(a => a.level === AlertLevel.INFO).length,
        warning: filteredAlerts.filter(a => a.level === AlertLevel.WARNING).length,
        critical: filteredAlerts.filter(a => a.level === AlertLevel.CRITICAL).length,
      },
      uptime: os.uptime(),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, filteredAlerts);

    const report: PerformanceReport = {
      generatedAt: new Date(),
      timeRange: reportConfig.timeRange,
      summary,
      recommendations,
    };

    // Include optional data
    if (reportConfig.includeSystemMetrics && reportConfig.includeHistoricalData) {
      report.systemMetrics = filteredHistory.map(h => h.system);
    }

    if (reportConfig.includeApplicationMetrics && reportConfig.includeHistoricalData) {
      report.applicationMetrics = filteredHistory.map(h => h.application);
    }

    if (reportConfig.includeAlerts) {
      report.alerts = filteredAlerts;
    }

    this.logger.info('Performance report generated', {
      reportSummary: {
        timeRange: report.timeRange,
        dataPoints: summary.totalDataPoints,
        alertCount: summary.alertCount,
        recommendationCount: recommendations.length,
      },
    });

    this.emit('report-generated', report);
    return report;
  }

  /**
   * Get current performance status
   */
  getCurrentStatus(): {
    isMonitoring: boolean;
    activeAlerts: PerformanceAlert[];
    lastMetrics: { system: SystemMetrics; application: ApplicationMetrics } | undefined;
  } {
    return {
      isMonitoring: this.isMonitoring,
      activeAlerts: Array.from(this.activeAlerts.values()),
      lastMetrics:
        this.metricsHistory.length > 0
          ? this.metricsHistory[this.metricsHistory.length - 1]
          : undefined,
    };
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory.length = 0;
    this.alertHistory.length = 0;
    this.activeAlerts.clear();

    this.logger.info('Metrics history cleared');
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    Object.assign(this.thresholds, newThresholds);
    this.logger.info('Performance thresholds updated', { thresholds: this.thresholds });
  }

  /**
   * Initialize event loop lag monitoring
   */
  private initializeEventLoopMonitoring(): void {
    const measureLag = () => {
      this.eventLoopLagStart = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - this.eventLoopLagStart) / 1e6; // Convert to ms
        this.eventLoopLag = lag;
      });
    };

    // Measure event loop lag every 5 seconds
    setInterval(measureLag, 5000);
    measureLag(); // Initial measurement
  }

  /**
   * Get network interface information
   */
  private getNetworkInterfaces(): Array<{
    interface: string;
    address: string;
    family: string;
    internal: boolean;
  }> {
    const interfaces = os.networkInterfaces();
    const result: Array<{
      interface: string;
      address: string;
      family: string;
      internal: boolean;
    }> = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      if (addresses) {
        for (const addr of addresses) {
          result.push({
            interface: name,
            address: addr.address,
            family: addr.family,
            internal: addr.internal,
          });
        }
      }
    }

    return result;
  }

  /**
   * Get approximate BrowserView count
   */
  private getBrowserViewCount(): number {
    // This is an approximation since there's no direct API
    // We count webContents that are not main window contents
    const allWebContents = webContents.getAllWebContents();
    const allWindows = BrowserWindow.getAllWindows();

    return Math.max(0, allWebContents.length - allWindows.length);
  }

  /**
   * Convert bytes to MB
   */
  private bytesToMB(bytes: number): number {
    return Math.round(bytes / (1024 * 1024));
  }

  /**
   * Convert bytes to GB
   */
  private bytesToGB(bytes: number): number {
    return Math.round((bytes / (1024 * 1024 * 1024)) * 100) / 100;
  }

  /**
   * Calculate average of number array
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    summary: PerformanceReport['summary'],
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    // CPU recommendations
    if (summary.averageCpuUsage > 60) {
      recommendations.push(
        'High average CPU usage detected. Consider reducing concurrent operations or optimizing resource-intensive tasks.'
      );
    }

    if (summary.peakCpuUsage > 90) {
      recommendations.push(
        'CPU usage peaks detected. Monitor for CPU-intensive operations and consider load balancing.'
      );
    }

    // Memory recommendations
    if (summary.averageMemoryUsage > 70) {
      recommendations.push(
        'High memory usage detected. Consider implementing memory cleanup routines or increasing available RAM.'
      );
    }

    // Event loop recommendations
    const eventLoopAlerts = alerts.filter(a => a.metric === 'event_loop_lag');
    if (eventLoopAlerts.length > 0) {
      recommendations.push(
        'Event loop lag detected. Review synchronous operations and consider moving heavy computations to worker threads.'
      );
    }

    // Alert-based recommendations
    const criticalAlerts = alerts.filter(a => a.level === AlertLevel.CRITICAL);
    if (criticalAlerts.length > 5) {
      recommendations.push(
        'Multiple critical alerts triggered. Consider reviewing performance thresholds and system capacity.'
      );
    }

    // General recommendations
    if (summary.totalDataPoints < 10) {
      recommendations.push(
        'Limited performance data available. Enable continuous monitoring for better insights.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'System performance appears stable. Continue monitoring to maintain optimal performance.'
      );
    }

    return recommendations;
  }

  /**
   * Handle cleanup
   */
  async dispose(): Promise<void> {
    this.stop();
    this.clearHistory();
    this.removeAllListeners();

    this.logger.info('PerformanceMonitor disposed');
  }

  // EventEmitter type overrides
  public override on<K extends keyof PerformanceMonitorEvents>(
    event: K,
    listener: (arg: PerformanceMonitorEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof PerformanceMonitorEvents>(
    event: K,
    listener: (arg: PerformanceMonitorEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }

  public override emit<K extends keyof PerformanceMonitorEvents>(
    event: K,
    arg: PerformanceMonitorEvents[K]
  ): boolean {
    return super.emit(event, arg);
  }
}

// Export types
export type {
  SystemMetrics,
  ApplicationMetrics,
  PerformanceThresholds,
  PerformanceAlert,
  PerformanceReport,
  ReportConfig,
  PerformanceMonitorEvents,
};

export { AlertLevel };

// Default export
export default PerformanceMonitor;
