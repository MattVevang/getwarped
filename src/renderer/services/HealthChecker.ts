/**
 * HealthChecker - Service health monitoring and status checking system
 *
 * Monitors service availability, tracks response times, detects outages,
 * and provides health status information for workspace services. Integrates
 * with service management to provide real-time health insights.
 *
 * @fileoverview Service health monitoring system
 */

import { EventEmitter } from 'events';
import { urlValidator } from './UrlValidator';

/**
 * Service health status enumeration
 */
export enum HealthStatus {
  UNKNOWN = 'unknown',
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline',
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Service URL that was checked */
  serviceUrl: string;
  /** Current health status */
  status: HealthStatus;
  /** Response time in milliseconds */
  responseTime: number;
  /** HTTP status code if applicable */
  httpStatus?: number;
  /** Last successful check timestamp */
  lastHealthyAt: Date | null;
  /** Last check timestamp */
  lastCheckedAt: Date;
  /** Error message if check failed */
  error?: string;
  /** Additional health metrics */
  metrics?: HealthMetrics;
}

/**
 * Detailed health metrics
 */
export interface HealthMetrics {
  /** Average response time over recent checks */
  avgResponseTime: number;
  /** Success rate percentage */
  successRate: number;
  /** Total number of checks performed */
  totalChecks: number;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Uptime percentage */
  uptimePercentage: number;
  /** SSL certificate validity */
  sslStatus?: SSLStatus;
}

/**
 * SSL certificate status
 */
export interface SSLStatus {
  /** Whether SSL certificate is valid */
  isValid: boolean;
  /** Certificate expiration date */
  expiresAt?: Date;
  /** Days until expiration */
  daysUntilExpiry?: number;
  /** Certificate issuer */
  issuer?: string;
}

/**
 * Health check options
 */
export interface HealthCheckOptions {
  /** Timeout for health check in milliseconds */
  timeout?: number;
  /** HTTP method to use for check */
  method?: 'GET' | 'HEAD' | 'OPTIONS';
  /** Custom headers to send */
  headers?: Record<string, string>;
  /** Whether to follow redirects */
  followRedirects?: boolean;
  /** Maximum number of redirects to follow */
  maxRedirects?: number;
  /** Whether to check SSL certificate */
  checkSSL?: boolean;
  /** User agent string */
  userAgent?: string;
  /** Expected HTTP status codes for healthy response */
  expectedStatusCodes?: number[];
}

/**
 * Health monitoring configuration
 */
export interface HealthMonitorConfig {
  /** Interval between health checks in milliseconds */
  checkInterval?: number;
  /** Number of recent checks to keep for metrics */
  metricsWindow?: number;
  /** Failure threshold for marking service unhealthy */
  failureThreshold?: number;
  /** Recovery threshold for marking service healthy again */
  recoveryThreshold?: number;
  /** Whether to perform continuous monitoring */
  continuousMonitoring?: boolean;
  /** Default health check options */
  defaultCheckOptions?: HealthCheckOptions;
}

/**
 * Health check history entry
 */
interface HealthCheckHistory {
  timestamp: Date;
  status: HealthStatus;
  responseTime: number;
  httpStatus?: number;
  error?: string;
}

/**
 * Service health data
 */
interface ServiceHealthData {
  serviceUrl: string;
  currentStatus: HealthStatus;
  history: HealthCheckHistory[];
  lastHealthyAt: Date | null;
  consecutiveFailures: number;
  monitoringActive: boolean;
  intervalId?: NodeJS.Timeout;
}

/**
 * HealthChecker class for service monitoring
 */
export class HealthChecker extends EventEmitter {
  private services: Map<string, ServiceHealthData> = new Map();
  private defaultConfig: Required<HealthMonitorConfig>;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<HealthMonitorConfig> = {}) {
    super();

    this.defaultConfig = {
      checkInterval: 5 * 60 * 1000, // 5 minutes
      metricsWindow: 20, // Keep 20 recent checks
      failureThreshold: 3, // 3 failures to mark unhealthy
      recoveryThreshold: 2, // 2 successes to mark healthy
      continuousMonitoring: true,
      defaultCheckOptions: {
        timeout: 10000,
        method: 'HEAD',
        followRedirects: true,
        maxRedirects: 5,
        checkSSL: true,
        userAgent: 'GetWarped/1.0.0 (Health Checker)',
        expectedStatusCodes: [200, 301, 302, 304],
      },
      ...config,
    } as Required<HealthMonitorConfig>;
  }

  /**
   * Start monitoring a service
   */
  startMonitoring(serviceUrl: string, options: Partial<HealthCheckOptions> = {}): void {
    const normalizedUrl = this.normalizeUrl(serviceUrl);

    // Stop existing monitoring if any
    this.stopMonitoring(normalizedUrl);

    // Initialize service health data
    const serviceData: ServiceHealthData = {
      serviceUrl: normalizedUrl,
      currentStatus: HealthStatus.UNKNOWN,
      history: [],
      lastHealthyAt: null,
      consecutiveFailures: 0,
      monitoringActive: true,
    };

    this.services.set(normalizedUrl, serviceData);

    // Perform initial check
    this.performHealthCheck(normalizedUrl, options);

    // Set up periodic monitoring if enabled
    if (this.defaultConfig.continuousMonitoring) {
      const intervalId = setInterval(() => {
        this.performHealthCheck(normalizedUrl, options);
      }, this.defaultConfig.checkInterval);

      serviceData.intervalId = intervalId;
    }

    this.emit('monitoring-started', { serviceUrl: normalizedUrl });
  }

  /**
   * Stop monitoring a service
   */
  stopMonitoring(serviceUrl: string): void {
    const normalizedUrl = this.normalizeUrl(serviceUrl);
    const serviceData = this.services.get(normalizedUrl);

    if (serviceData) {
      // Clear interval
      if (serviceData.intervalId) {
        clearInterval(serviceData.intervalId);
        serviceData.intervalId = undefined;
      }

      // Mark as inactive
      serviceData.monitoringActive = false;

      // Abort any ongoing checks
      const controller = this.abortControllers.get(normalizedUrl);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(normalizedUrl);
      }

      this.emit('monitoring-stopped', { serviceUrl: normalizedUrl });
    }
  }

  /**
   * Perform a single health check
   */
  async performHealthCheck(
    serviceUrl: string,
    options: Partial<HealthCheckOptions> = {}
  ): Promise<HealthCheckResult> {
    const normalizedUrl = this.normalizeUrl(serviceUrl);
    const checkOptions = { ...this.defaultConfig.defaultCheckOptions, ...options };

    // Abort any existing check for this service
    const existingController = this.abortControllers.get(normalizedUrl);
    if (existingController) {
      existingController.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    this.abortControllers.set(normalizedUrl, controller);

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Validate URL first
      const validation = await urlValidator.validateUrl(normalizedUrl, {
        checkBlocklists: false, // Skip blocklists for health checks
        checkSuspiciousPatterns: false, // Skip pattern checks for health checks
      });

      if (!validation.isValid) {
        throw new Error(
          `Invalid service URL: ${validation.issues[0]?.message || 'Unknown validation error'}`
        );
      }

      // Perform HTTP request
      const headers: Record<string, string> = {
        'User-Agent': checkOptions.userAgent!,
        ...checkOptions.headers,
      };

      const response = await fetch(normalizedUrl, {
        method: checkOptions.method,
        headers,
        signal: controller.signal,
        redirect: checkOptions.followRedirects ? 'follow' : 'manual',
        mode: 'cors',
      });

      const responseTime = Date.now() - startTime;
      const httpStatus = response.status;

      // Determine health status
      let status: HealthStatus;
      if (checkOptions.expectedStatusCodes!.includes(httpStatus)) {
        status = HealthStatus.HEALTHY;
      } else if (httpStatus >= 400 && httpStatus < 500) {
        status = HealthStatus.DEGRADED;
      } else if (httpStatus >= 500) {
        status = HealthStatus.UNHEALTHY;
      } else {
        status = HealthStatus.DEGRADED;
      }

      // Check SSL if enabled
      let sslStatus: SSLStatus | undefined;
      if (checkOptions.checkSSL && normalizedUrl.startsWith('https://')) {
        sslStatus = await this.checkSSLCertificate(normalizedUrl);
        if (!sslStatus.isValid) {
          status = HealthStatus.DEGRADED;
        }
      }

      result = {
        serviceUrl: normalizedUrl,
        status,
        responseTime,
        httpStatus,
        lastHealthyAt: status === HealthStatus.HEALTHY ? new Date() : null,
        lastCheckedAt: new Date(),
        metrics: undefined, // Will be calculated separately
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      result = {
        serviceUrl: normalizedUrl,
        status: HealthStatus.OFFLINE,
        responseTime,
        lastHealthyAt: null,
        lastCheckedAt: new Date(),
        error: errorMessage,
      };
    } finally {
      this.abortControllers.delete(normalizedUrl);
    }

    // Update service data and calculate metrics
    this.updateServiceHealthData(normalizedUrl, result);
    result.metrics = this.calculateMetrics(normalizedUrl);

    this.emit('health-check-completed', result);
    return result;
  }

  /**
   * Update service health data with new check result
   */
  private updateServiceHealthData(serviceUrl: string, result: HealthCheckResult): void {
    let serviceData = this.services.get(serviceUrl);

    if (!serviceData) {
      serviceData = {
        serviceUrl,
        currentStatus: HealthStatus.UNKNOWN,
        history: [],
        lastHealthyAt: null,
        consecutiveFailures: 0,
        monitoringActive: false,
      };
      this.services.set(serviceUrl, serviceData);
    }

    // Add to history
    const historyEntry: HealthCheckHistory = {
      timestamp: result.lastCheckedAt,
      status: result.status,
      responseTime: result.responseTime,
      httpStatus: result.httpStatus,
      error: result.error,
    };

    serviceData.history.push(historyEntry);

    // Limit history size
    if (serviceData.history.length > this.defaultConfig.metricsWindow) {
      serviceData.history = serviceData.history.slice(-this.defaultConfig.metricsWindow);
    }

    // Update consecutive failures
    if (result.status === HealthStatus.HEALTHY) {
      serviceData.consecutiveFailures = 0;
      serviceData.lastHealthyAt = result.lastCheckedAt;
    } else {
      serviceData.consecutiveFailures++;
    }

    // Determine overall status based on thresholds
    const previousStatus = serviceData.currentStatus;

    if (serviceData.consecutiveFailures >= this.defaultConfig.failureThreshold) {
      serviceData.currentStatus =
        result.status === HealthStatus.OFFLINE ? HealthStatus.OFFLINE : HealthStatus.UNHEALTHY;
    } else if (serviceData.consecutiveFailures === 0 && result.status === HealthStatus.HEALTHY) {
      serviceData.currentStatus = HealthStatus.HEALTHY;
    } else {
      serviceData.currentStatus = result.status;
    }

    // Emit status change event if status changed
    if (previousStatus !== serviceData.currentStatus) {
      this.emit('status-changed', {
        serviceUrl,
        previousStatus,
        currentStatus: serviceData.currentStatus,
        result,
      });
    }
  }

  /**
   * Calculate health metrics for a service
   */
  private calculateMetrics(serviceUrl: string): HealthMetrics {
    const serviceData = this.services.get(serviceUrl);
    if (!serviceData || serviceData.history.length === 0) {
      return {
        avgResponseTime: 0,
        successRate: 0,
        totalChecks: 0,
        consecutiveFailures: 0,
        uptimePercentage: 0,
      };
    }

    const history = serviceData.history;
    const totalChecks = history.length;
    const healthyChecks = history.filter(h => h.status === HealthStatus.HEALTHY).length;
    const avgResponseTime = history.reduce((sum, h) => sum + h.responseTime, 0) / totalChecks;
    const successRate = (healthyChecks / totalChecks) * 100;
    const uptimePercentage = successRate; // Simplified uptime calculation

    return {
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      totalChecks,
      consecutiveFailures: serviceData.consecutiveFailures,
      uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    };
  }

  /**
   * Check SSL certificate status
   */
  private async checkSSLCertificate(url: string): Promise<SSLStatus> {
    try {
      // This is a simplified SSL check - in a real implementation,
      // you would use more sophisticated certificate validation
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      // Basic SSL validation (connection succeeded over HTTPS)
      return {
        isValid: response.ok && url.startsWith('https://'),
      };
    } catch (error) {
      return {
        isValid: false,
      };
    }
  }

  /**
   * Get current health status for a service
   */
  getServiceHealth(serviceUrl: string): HealthCheckResult | null {
    const normalizedUrl = this.normalizeUrl(serviceUrl);
    const serviceData = this.services.get(normalizedUrl);

    if (!serviceData || serviceData.history.length === 0) {
      return null;
    }

    const latestHistory = serviceData.history[serviceData.history.length - 1];
    const metrics = this.calculateMetrics(normalizedUrl);

    return {
      serviceUrl: normalizedUrl,
      status: serviceData.currentStatus,
      responseTime: latestHistory.responseTime,
      httpStatus: latestHistory.httpStatus,
      lastHealthyAt: serviceData.lastHealthyAt,
      lastCheckedAt: latestHistory.timestamp,
      error: latestHistory.error,
      metrics,
    };
  }

  /**
   * Get health status for all monitored services
   */
  getAllServicesHealth(): HealthCheckResult[] {
    const results: HealthCheckResult[] = [];

    for (const serviceUrl of this.services.keys()) {
      const health = this.getServiceHealth(serviceUrl);
      if (health) {
        results.push(health);
      }
    }

    return results;
  }

  /**
   * Get services by health status
   */
  getServicesByStatus(status: HealthStatus): HealthCheckResult[] {
    return this.getAllServicesHealth().filter(health => health.status === status);
  }

  /**
   * Check if service is being monitored
   */
  isMonitoring(serviceUrl: string): boolean {
    const normalizedUrl = this.normalizeUrl(serviceUrl);
    const serviceData = this.services.get(normalizedUrl);
    return serviceData?.monitoringActive ?? false;
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<HealthMonitorConfig>): void {
    Object.assign(this.defaultConfig, config);
    this.emit('config-updated', this.defaultConfig);
  }

  /**
   * Clear health history for a service
   */
  clearServiceHistory(serviceUrl: string): void {
    const normalizedUrl = this.normalizeUrl(serviceUrl);
    const serviceData = this.services.get(normalizedUrl);

    if (serviceData) {
      serviceData.history = [];
      serviceData.consecutiveFailures = 0;
      serviceData.currentStatus = HealthStatus.UNKNOWN;
      serviceData.lastHealthyAt = null;

      this.emit('history-cleared', { serviceUrl: normalizedUrl });
    }
  }

  /**
   * Remove service from monitoring completely
   */
  removeService(serviceUrl: string): void {
    const normalizedUrl = this.normalizeUrl(serviceUrl);

    // Stop monitoring
    this.stopMonitoring(normalizedUrl);

    // Remove from services
    this.services.delete(normalizedUrl);

    this.emit('service-removed', { serviceUrl: normalizedUrl });
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    totalServices: number;
    activeMonitoring: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    offlineServices: number;
  } {
    const allHealth = this.getAllServicesHealth();
    const activeServices = Array.from(this.services.values()).filter(s => s.monitoringActive);

    return {
      totalServices: this.services.size,
      activeMonitoring: activeServices.length,
      healthyServices: allHealth.filter(h => h.status === HealthStatus.HEALTHY).length,
      degradedServices: allHealth.filter(h => h.status === HealthStatus.DEGRADED).length,
      unhealthyServices: allHealth.filter(h => h.status === HealthStatus.UNHEALTHY).length,
      offlineServices: allHealth.filter(h => h.status === HealthStatus.OFFLINE).length,
    };
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    for (const serviceUrl of this.services.keys()) {
      this.stopMonitoring(serviceUrl);
    }
  }

  /**
   * Normalize URL for consistent handling
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove trailing slash and fragments
      return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`;
    } catch {
      return url;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAllMonitoring();
    this.services.clear();
    this.abortControllers.clear();
    this.removeAllListeners();
  }
}

/**
 * Health checker utilities
 */
export const HealthUtils = {
  /**
   * Get health status color for UI display
   */
  getStatusColor(status: HealthStatus): string {
    switch (status) {
      case HealthStatus.HEALTHY:
        return '#52c41a'; // Green
      case HealthStatus.DEGRADED:
        return '#faad14'; // Yellow
      case HealthStatus.UNHEALTHY:
        return '#ff4d4f'; // Red
      case HealthStatus.OFFLINE:
        return '#8c8c8c'; // Gray
      case HealthStatus.UNKNOWN:
      default:
        return '#d9d9d9'; // Light gray
    }
  },

  /**
   * Get health status icon
   */
  getStatusIcon(status: HealthStatus): string {
    switch (status) {
      case HealthStatus.HEALTHY:
        return '✓';
      case HealthStatus.DEGRADED:
        return '⚠';
      case HealthStatus.UNHEALTHY:
        return '✗';
      case HealthStatus.OFFLINE:
        return '⚡';
      case HealthStatus.UNKNOWN:
      default:
        return '?';
    }
  },

  /**
   * Format response time for display
   */
  formatResponseTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 10000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      return `${Math.round(milliseconds / 1000)}s`;
    }
  },

  /**
   * Format uptime percentage
   */
  formatUptime(percentage: number): string {
    if (percentage >= 99.9) {
      return '99.9%+';
    } else {
      return `${percentage.toFixed(1)}%`;
    }
  },

  /**
   * Determine if service needs attention
   */
  needsAttention(health: HealthCheckResult): boolean {
    return (
      health.status === HealthStatus.UNHEALTHY ||
      health.status === HealthStatus.OFFLINE ||
      (health.metrics?.consecutiveFailures ?? 0) > 0
    );
  },
};

/**
 * Global health checker instance
 */
export const healthChecker = new HealthChecker({
  checkInterval: 5 * 60 * 1000, // 5 minutes
  continuousMonitoring: true,
  failureThreshold: 3,
  recoveryThreshold: 1,
});

export default HealthChecker;
