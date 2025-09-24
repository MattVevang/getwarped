/**
 * ServiceHealthChecker - Service health monitoring and status checking system
 *
 * This is an alias export for the main HealthChecker implementation.
 * All functionality is provided by the HealthChecker class.
 *
 * @fileoverview ServiceHealthChecker alias for health monitoring system
 */

export {
  HealthChecker as ServiceHealthChecker,
  HealthStatus,
  HealthUtils,
  healthChecker as serviceHealthChecker,
} from './HealthChecker';

export type {
  HealthCheckResult,
  HealthMetrics,
  SSLStatus,
  HealthCheckOptions,
  HealthMonitorConfig,
} from './HealthChecker';

// Default export for convenience
export { default as default } from './HealthChecker';
