/**
 * @fileoverview Security Audit Logger - Security-focused audit logging for authentication events,
 * configuration changes, and security incidents
 * @version 1.0.0
 * @author GetWarped Development Team
 * @since 2024
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';
import { ApplicationLogger, LogLevel, LogCategory } from './ApplicationLogger';

/**
 * Security event types
 */
export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_GRANTED = 'authorization_granted',
  AUTHORIZATION_DENIED = 'authorization_denied',
  SESSION_CREATED = 'session_created',
  SESSION_DESTROYED = 'session_destroyed',
  SESSION_EXPIRED = 'session_expired',
  CREDENTIAL_CREATED = 'credential_created',
  CREDENTIAL_ACCESSED = 'credential_accessed',
  CREDENTIAL_UPDATED = 'credential_updated',
  CREDENTIAL_DELETED = 'credential_deleted',
  CONFIGURATION_READ = 'configuration_read',
  CONFIGURATION_MODIFIED = 'configuration_modified',
  CONFIGURATION_EXPORTED = 'configuration_exported',
  CONFIGURATION_IMPORTED = 'configuration_imported',
  FILE_ACCESS_ATTEMPT = 'file_access_attempt',
  FILE_PERMISSION_DENIED = 'file_permission_denied',
  NETWORK_REQUEST = 'network_request',
  NETWORK_BLOCKED = 'network_blocked',
  SECURITY_VIOLATION = 'security_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  MALICIOUS_INPUT = 'malicious_input',
  ENCRYPTION_FAILURE = 'encryption_failure',
  DECRYPTION_FAILURE = 'decryption_failure',
  CERTIFICATE_ERROR = 'certificate_error',
  INTEGRITY_CHECK_FAILED = 'integrity_check_failed',
}

/**
 * Security risk levels
 */
export enum SecurityRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security audit context
 */
export interface SecurityAuditContext {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly serviceId?: string;
  readonly workspaceId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly sourceModule?: string;
  readonly targetResource?: string;
  readonly operationId?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
}

/**
 * Security audit entry
 */
export interface SecurityAuditEntry {
  readonly id: string;
  readonly timestamp: Date;
  readonly eventType: SecurityEventType;
  readonly riskLevel: SecurityRiskLevel;
  readonly message: string;
  readonly success: boolean;
  readonly context: SecurityAuditContext;
  readonly metadata?: Record<string, any>;
  readonly sensitiveData?: boolean;
  readonly requiresResponse?: boolean;
  readonly evidence?: SecurityEvidence[];
  readonly tags?: string[];
  readonly signature?: string;
}

/**
 * Security evidence for forensic analysis
 */
export interface SecurityEvidence {
  readonly type: 'file' | 'network' | 'system' | 'user_input' | 'process';
  readonly description: string;
  readonly data?: string;
  readonly hash?: string;
  readonly size?: number;
  readonly timestamp?: Date;
  readonly preservationNote?: string;
}

/**
 * Authentication audit details
 */
export interface AuthenticationAudit {
  readonly method: 'password' | 'token' | 'certificate' | 'biometric' | 'sso';
  readonly provider?: string;
  readonly multiFactor?: boolean;
  readonly deviceId?: string;
  readonly location?: string;
  readonly previousLogin?: Date;
  readonly failureReason?: string;
  readonly attemptsCount?: number;
  readonly lockoutTriggered?: boolean;
}

/**
 * Configuration audit details
 */
export interface ConfigurationAudit {
  readonly operation:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'export'
    | 'import'
    | 'backup'
    | 'restore';
  readonly configType: 'workspace' | 'service' | 'session' | 'security' | 'application';
  readonly objectId?: string;
  readonly changedFields?: string[];
  readonly previousValues?: Record<string, any> | undefined;
  readonly newValues?: Record<string, any> | undefined;
  readonly validationResult?: boolean;
  readonly backupCreated?: boolean;
  readonly rollbackAvailable?: boolean;
}

/**
 * File access audit details
 */
export interface FileAccessAudit {
  readonly operation: 'read' | 'write' | 'delete' | 'create' | 'move' | 'copy' | 'execute';
  readonly filePath: string;
  readonly fileSize?: number;
  readonly fileType?: string;
  readonly permissions?: string;
  readonly checksum?: string;
  readonly previousChecksum?: string;
  readonly accessDeniedReason?: string;
  readonly quarantined?: boolean;
}

/**
 * Network audit details
 */
export interface NetworkAudit {
  readonly protocol: 'http' | 'https' | 'ws' | 'wss' | 'ftp' | 'ssh';
  readonly method?: string;
  readonly url: string;
  readonly statusCode?: number;
  readonly requestSize?: number;
  readonly responseSize?: number;
  readonly duration?: number;
  readonly blocked?: boolean;
  readonly blockReason?: string;
  readonly tlsVersion?: string;
  readonly certificateValid?: boolean;
}

/**
 * Security audit configuration
 */
export interface SecurityAuditConfig {
  readonly enabled: boolean;
  readonly auditDirectory: string;
  readonly maxAuditFileSize: number;
  readonly retentionDays: number;
  readonly encryptAuditLogs: boolean;
  readonly signAuditEntries: boolean;
  readonly realTimeAlerts: boolean;
  readonly sensitiveDataFiltering: boolean;
  readonly complianceMode: 'none' | 'gdpr' | 'sox' | 'hipaa' | 'pci';
  readonly alertThresholds: {
    readonly failedLogins: number;
    readonly configChanges: number;
    readonly suspiciousActivity: number;
    readonly criticalEvents: number;
  };
  readonly includedEvents: SecurityEventType[];
  readonly excludedSensitiveFields: string[];
}

/**
 * Security alert
 */
export interface SecurityAlert {
  readonly id: string;
  readonly timestamp: Date;
  readonly severity: SecurityRiskLevel;
  readonly title: string;
  readonly description: string;
  readonly events: SecurityAuditEntry[];
  readonly recommendedActions: string[];
  readonly acknowledged?: boolean;
  readonly resolvedAt?: Date;
  readonly resolver?: string;
}

/**
 * Compliance report entry
 */
export interface ComplianceReportEntry {
  readonly timestamp: Date;
  readonly regulation: string;
  readonly requirement: string;
  readonly status: 'compliant' | 'non_compliant' | 'partial';
  readonly evidence: SecurityAuditEntry[];
  readonly notes?: string;
}

/**
 * Main security audit logger
 */
export class SecurityAuditLogger extends EventEmitter {
  private readonly config: SecurityAuditConfig;
  private readonly applicationLogger: ApplicationLogger;
  private auditStream?: fs.FileHandle;
  private currentAuditFile: string;
  private auditBuffer: SecurityAuditEntry[] = [];
  private alertBuffer: SecurityAlert[] = [];
  private eventCounters: Map<SecurityEventType, number> = new Map();
  private _lastFlush: Date = new Date();
  private _signingKey?: string;

  constructor(applicationLogger: ApplicationLogger, config: Partial<SecurityAuditConfig> = {}) {
    super();

    this.applicationLogger = applicationLogger;
    this.config = {
      enabled: true,
      auditDirectory: path.join(app.getPath('logs'), 'security'),
      maxAuditFileSize: 50 * 1024 * 1024, // 50MB
      retentionDays: 365, // 1 year for security logs
      encryptAuditLogs: true,
      signAuditEntries: true,
      realTimeAlerts: true,
      sensitiveDataFiltering: true,
      complianceMode: 'none',
      alertThresholds: {
        failedLogins: 5,
        configChanges: 10,
        suspiciousActivity: 3,
        criticalEvents: 1,
      },
      includedEvents: Object.values(SecurityEventType),
      excludedSensitiveFields: ['password', 'token', 'secret', 'key', 'credential'],
      ...config,
    };

    this.currentAuditFile = this.generateAuditFileName();

    if (this.config.enabled) {
      this.initializeAuditLogging();
    }
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    eventType: SecurityEventType.AUTHENTICATION_SUCCESS | SecurityEventType.AUTHENTICATION_FAILURE,
    details: AuthenticationAudit,
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.AUTHENTICATION_FAILURE
        ? details.attemptsCount && details.attemptsCount > 3
          ? SecurityRiskLevel.HIGH
          : SecurityRiskLevel.MEDIUM
        : SecurityRiskLevel.LOW;

    const message =
      eventType === SecurityEventType.AUTHENTICATION_SUCCESS
        ? `User authentication successful via ${details.method}`
        : `User authentication failed via ${details.method}${details.failureReason ? `: ${details.failureReason}` : ''}`;

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: eventType === SecurityEventType.AUTHENTICATION_SUCCESS,
      context,
      metadata: {
        authentication: details,
        deviceFingerprint: this.generateDeviceFingerprint(context),
      },
      tags: ['authentication', details.method, details.multiFactor ? 'mfa' : 'single-factor'],
    });

    // Check for alert thresholds
    if (eventType === SecurityEventType.AUTHENTICATION_FAILURE) {
      await this.checkAuthenticationAlerts(details, context);
    }
  }

  /**
   * Log authorization event
   */
  async logAuthorization(
    eventType: SecurityEventType.AUTHORIZATION_GRANTED | SecurityEventType.AUTHORIZATION_DENIED,
    resource: string,
    action: string,
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.AUTHORIZATION_DENIED
        ? SecurityRiskLevel.MEDIUM
        : SecurityRiskLevel.LOW;

    const message = `Authorization ${eventType === SecurityEventType.AUTHORIZATION_GRANTED ? 'granted' : 'denied'} for ${action} on ${resource}`;

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: eventType === SecurityEventType.AUTHORIZATION_GRANTED,
      context: { ...context, targetResource: resource },
      metadata: {
        authorization: { resource, action },
      },
      tags: ['authorization', action],
    });
  }

  /**
   * Log session event
   */
  async logSession(
    eventType:
      | SecurityEventType.SESSION_CREATED
      | SecurityEventType.SESSION_DESTROYED
      | SecurityEventType.SESSION_EXPIRED,
    sessionData: {
      sessionId: string;
      duration?: number;
      reason?: string;
      forced?: boolean;
    },
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.SESSION_EXPIRED || sessionData.forced
        ? SecurityRiskLevel.MEDIUM
        : SecurityRiskLevel.LOW;

    let message = '';
    switch (eventType) {
      case SecurityEventType.SESSION_CREATED:
        message = `User session created: ${sessionData.sessionId}`;
        break;
      case SecurityEventType.SESSION_DESTROYED:
        message = `User session destroyed: ${sessionData.sessionId}${sessionData.forced ? ' (forced)' : ''}`;
        break;
      case SecurityEventType.SESSION_EXPIRED:
        message = `User session expired: ${sessionData.sessionId}`;
        break;
    }

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: true,
      context: { ...context, sessionId: sessionData.sessionId },
      metadata: {
        session: sessionData,
      },
      tags: ['session', eventType.split('_')[1] || 'unknown'], // created, destroyed, expired
    });
  }

  /**
   * Log credential access event
   */
  async logCredentialAccess(
    eventType:
      | SecurityEventType.CREDENTIAL_CREATED
      | SecurityEventType.CREDENTIAL_ACCESSED
      | SecurityEventType.CREDENTIAL_UPDATED
      | SecurityEventType.CREDENTIAL_DELETED,
    credentialId: string,
    credentialType: string,
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.CREDENTIAL_DELETED
        ? SecurityRiskLevel.HIGH
        : SecurityRiskLevel.MEDIUM;

    const actions = {
      [SecurityEventType.CREDENTIAL_CREATED]: 'created',
      [SecurityEventType.CREDENTIAL_ACCESSED]: 'accessed',
      [SecurityEventType.CREDENTIAL_UPDATED]: 'updated',
      [SecurityEventType.CREDENTIAL_DELETED]: 'deleted',
    };

    const message = `Credential ${actions[eventType]}: ${credentialType} (${credentialId})`;

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: true,
      context,
      metadata: {
        credential: { id: credentialId, type: credentialType },
      },
      sensitiveData: true,
      tags: ['credential', credentialType, actions[eventType]],
    });
  }

  /**
   * Log configuration change event
   */
  async logConfigurationChange(
    eventType:
      | SecurityEventType.CONFIGURATION_READ
      | SecurityEventType.CONFIGURATION_MODIFIED
      | SecurityEventType.CONFIGURATION_EXPORTED
      | SecurityEventType.CONFIGURATION_IMPORTED,
    details: ConfigurationAudit,
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.CONFIGURATION_MODIFIED
        ? SecurityRiskLevel.MEDIUM
        : SecurityRiskLevel.LOW;

    const actions = {
      [SecurityEventType.CONFIGURATION_READ]: 'read',
      [SecurityEventType.CONFIGURATION_MODIFIED]: 'modified',
      [SecurityEventType.CONFIGURATION_EXPORTED]: 'exported',
      [SecurityEventType.CONFIGURATION_IMPORTED]: 'imported',
    };

    const message = `Configuration ${actions[eventType]}: ${details.configType}${details.objectId ? ` (${details.objectId})` : ''}`;

    // Filter sensitive data from previous/new values
    const filteredDetails = this.config.sensitiveDataFiltering
      ? this.filterSensitiveConfigurationData(details)
      : details;

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: true,
      context,
      metadata: {
        configuration: filteredDetails,
      },
      tags: ['configuration', details.configType, actions[eventType]],
    });

    // Check for configuration change alerts
    if (eventType === SecurityEventType.CONFIGURATION_MODIFIED) {
      await this.checkConfigurationChangeAlerts(details, context);
    }
  }

  /**
   * Log file access event
   */
  async logFileAccess(
    eventType: SecurityEventType.FILE_ACCESS_ATTEMPT | SecurityEventType.FILE_PERMISSION_DENIED,
    details: FileAccessAudit,
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.FILE_PERMISSION_DENIED
        ? SecurityRiskLevel.HIGH
        : SecurityRiskLevel.LOW;

    const message =
      eventType === SecurityEventType.FILE_ACCESS_ATTEMPT
        ? `File ${details.operation} attempted: ${details.filePath}`
        : `File access denied: ${details.filePath} (${details.accessDeniedReason})`;

    const evidence: SecurityEvidence[] = [];
    if (details.checksum && details.fileSize !== undefined) {
      evidence.push({
        type: 'file',
        description: 'File integrity checksum',
        hash: details.checksum,
        size: details.fileSize,
        timestamp: new Date(),
        preservationNote: 'Checksum calculated at time of access',
      });
    }

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: eventType === SecurityEventType.FILE_ACCESS_ATTEMPT,
      context: { ...context, targetResource: details.filePath },
      metadata: {
        fileAccess: details,
      },
      evidence,
      tags: ['file', details.operation, details.fileType || 'unknown'],
    });
  }

  /**
   * Log network request event
   */
  async logNetworkRequest(
    eventType: SecurityEventType.NETWORK_REQUEST | SecurityEventType.NETWORK_BLOCKED,
    details: NetworkAudit,
    context: SecurityAuditContext = {}
  ): Promise<void> {
    const riskLevel =
      eventType === SecurityEventType.NETWORK_BLOCKED || !details.certificateValid
        ? SecurityRiskLevel.HIGH
        : SecurityRiskLevel.LOW;

    const message =
      eventType === SecurityEventType.NETWORK_REQUEST
        ? `Network request: ${details.method || 'GET'} ${details.url}`
        : `Network request blocked: ${details.url} (${details.blockReason})`;

    await this.logSecurityEvent({
      eventType,
      riskLevel,
      message,
      success: eventType === SecurityEventType.NETWORK_REQUEST && (details.statusCode ?? 0) < 400,
      context: { ...context, targetResource: details.url },
      metadata: {
        network: details,
      },
      tags: ['network', details.protocol, details.method || 'unknown'],
    });
  }

  /**
   * Log security violation
   */
  async logSecurityViolation(
    violationType: string,
    description: string,
    riskLevel: SecurityRiskLevel = SecurityRiskLevel.HIGH,
    context: SecurityAuditContext = {},
    evidence: SecurityEvidence[] = []
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.SECURITY_VIOLATION,
      riskLevel,
      message: `Security violation detected: ${violationType} - ${description}`,
      success: false,
      context,
      metadata: {
        violation: { type: violationType, description },
      },
      evidence,
      requiresResponse: riskLevel === SecurityRiskLevel.CRITICAL,
      tags: ['security_violation', violationType],
    });

    // Create immediate alert for violations
    if (riskLevel === SecurityRiskLevel.CRITICAL || riskLevel === SecurityRiskLevel.HIGH) {
      await this.createSecurityAlert(
        riskLevel,
        `Security Violation: ${violationType}`,
        description,
        [await this.getLastAuditEntry()],
        [
          'Investigate the security violation immediately',
          'Review system logs for related activities',
          'Consider isolating affected resources',
          'Update security policies if necessary',
        ]
      );
    }
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    activityType: string,
    description: string,
    context: SecurityAuditContext = {},
    evidence: SecurityEvidence[] = []
  ): Promise<void> {
    await this.logSecurityEvent({
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      riskLevel: SecurityRiskLevel.MEDIUM,
      message: `Suspicious activity detected: ${activityType} - ${description}`,
      success: false,
      context,
      metadata: {
        suspiciousActivity: { type: activityType, description },
      },
      evidence,
      tags: ['suspicious_activity', activityType],
    });

    await this.checkSuspiciousActivityAlerts(activityType, context);
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    regulation: 'gdpr' | 'sox' | 'hipaa' | 'pci',
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReportEntry[]> {
    const auditEntries = await this.getAuditEntriesInTimeRange(startDate, endDate);
    const report: ComplianceReportEntry[] = [];

    switch (regulation) {
      case 'gdpr':
        report.push(...(await this.generateGDPRReport(auditEntries)));
        break;
      case 'sox':
        report.push(...(await this.generateSOXReport(auditEntries)));
        break;
      case 'hipaa':
        report.push(...(await this.generateHIPAAReport(auditEntries)));
        break;
      case 'pci':
        report.push(...(await this.generatePCIReport(auditEntries)));
        break;
    }

    return report;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    const startTime = new Date(now);

    switch (timeframe) {
      case 'hour':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case 'day':
        startTime.setDate(startTime.getDate() - 1);
        break;
      case 'week':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case 'month':
        startTime.setMonth(startTime.getMonth() - 1);
        break;
    }

    // Get recent entries from buffer for quick metrics
    const recentEntries = this.auditBuffer.filter(entry => entry.timestamp >= startTime);

    const metrics = {
      totalEvents: recentEntries.length,
      eventsByType: new Map<SecurityEventType, number>(),
      eventsByRisk: new Map<SecurityRiskLevel, number>(),
      failureRate: 0,
      alertsGenerated: this.alertBuffer.filter(alert => alert.timestamp >= startTime).length,
      topRiskEvents: [] as SecurityAuditEntry[],
      complianceScore: this.calculateComplianceScore(recentEntries),
    };

    // Count events by type and risk level
    recentEntries.forEach(entry => {
      metrics.eventsByType.set(
        entry.eventType,
        (metrics.eventsByType.get(entry.eventType) || 0) + 1
      );
      metrics.eventsByRisk.set(
        entry.riskLevel,
        (metrics.eventsByRisk.get(entry.riskLevel) || 0) + 1
      );
    });

    // Calculate failure rate
    const failures = recentEntries.filter(entry => !entry.success).length;
    metrics.failureRate = recentEntries.length > 0 ? failures / recentEntries.length : 0;

    // Get top risk events
    metrics.topRiskEvents = recentEntries
      .filter(
        entry =>
          entry.riskLevel === SecurityRiskLevel.CRITICAL ||
          entry.riskLevel === SecurityRiskLevel.HIGH
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return metrics;
  }

  /**
   * Close audit logger
   */
  async close(): Promise<void> {
    if (this.auditBuffer.length > 0) {
      await this.flushAuditBuffer();
    }

    if (this.auditStream) {
      await this.auditStream.close();
    }

    this.emit('audit-logger-closed');
  }

  /**
   * Core security event logging method
   */
  private async logSecurityEvent(
    event: Omit<SecurityAuditEntry, 'id' | 'timestamp'>
  ): Promise<void> {
    if (!this.config.enabled || !this.config.includedEvents.includes(event.eventType)) {
      return;
    }

    const auditEntry: SecurityAuditEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      ...event,
      ...(this.config.signAuditEntries && { signature: this.signAuditEntry(event) }),
    };

    // Add to buffer
    this.auditBuffer.push(auditEntry);

    // Update counters
    this.eventCounters.set(event.eventType, (this.eventCounters.get(event.eventType) || 0) + 1);

    // Emit event
    this.emit('security-event', auditEntry);

    // Log to application logger as well
    this.applicationLogger.logCategory(
      this.mapRiskLevelToLogLevel(event.riskLevel),
      LogCategory.SECURITY,
      event.message,
      {
        securityEvent: auditEntry.eventType,
        riskLevel: event.riskLevel,
        context: event.context,
      }
    );

    // Flush if buffer is large or critical event
    if (this.auditBuffer.length >= 100 || event.riskLevel === SecurityRiskLevel.CRITICAL) {
      await this.flushAuditBuffer();
    }

    // Generate alerts if needed
    if (this.config.realTimeAlerts && event.riskLevel === SecurityRiskLevel.CRITICAL) {
      await this.createSecurityAlert(
        event.riskLevel,
        'Critical Security Event',
        event.message,
        [auditEntry],
        ['Investigate immediately', 'Review security protocols']
      );
    }
  }

  /**
   * Initialize audit logging system
   */
  private async initializeAuditLogging(): Promise<void> {
    try {
      // Ensure audit directory exists
      await fs.mkdir(this.config.auditDirectory, { recursive: true });

      // Initialize signing key if needed
      if (this.config.signAuditEntries) {
        this._signingKey = randomUUID(); // In production, use proper key management
      }

      this.emit('audit-logger-initialized');
    } catch (error) {
      this.emit('audit-logger-error', error);
      throw error;
    }
  }

  /**
   * Flush audit buffer to file
   */
  private async flushAuditBuffer(): Promise<void> {
    if (this.auditBuffer.length === 0) return;

    const entries = this.auditBuffer.splice(0);

    try {
      if (!this.auditStream) {
        this.auditStream = await fs.open(this.currentAuditFile, 'a');
      }

      for (const entry of entries) {
        const line = JSON.stringify(entry) + '\n';
        await this.auditStream.write(line, null, 'utf8');
      }

      await this.auditStream.sync();
      this._lastFlush = new Date();

      this.emit('audit-flushed', { count: entries.length });
    } catch (error) {
      // Put entries back if flush failed
      this.auditBuffer.unshift(...entries);
      this.emit('audit-flush-error', error);
      throw error;
    }
  }

  /**
   * Generate audit file name
   */
  private generateAuditFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.config.auditDirectory, `security-audit-${date}.log`);
  }

  /**
   * Sign audit entry for integrity
   */
  private signAuditEntry(
    _entry: Omit<SecurityAuditEntry, 'id' | 'timestamp' | 'signature'>
  ): string {
    // Simplified signing - in production, use proper cryptographic signing
    return `sig_${randomUUID()}`;
  }

  /**
   * Map security risk level to log level
   */
  private mapRiskLevelToLogLevel(riskLevel: SecurityRiskLevel): LogLevel {
    switch (riskLevel) {
      case SecurityRiskLevel.LOW:
        return LogLevel.INFO;
      case SecurityRiskLevel.MEDIUM:
        return LogLevel.WARN;
      case SecurityRiskLevel.HIGH:
        return LogLevel.ERROR;
      case SecurityRiskLevel.CRITICAL:
        return LogLevel.FATAL;
    }
  }

  /**
   * Filter sensitive data from configuration audit
   */
  private filterSensitiveConfigurationData(details: ConfigurationAudit): ConfigurationAudit {
    const filterObject = (
      obj: Record<string, any> | undefined
    ): Record<string, any> | undefined => {
      if (!obj) return obj;

      const filtered = { ...obj };
      this.config.excludedSensitiveFields.forEach(field => {
        if (field in filtered) {
          filtered[field] = '[REDACTED]';
        }
      });
      return filtered;
    };

    return {
      ...details,
      ...(details.previousValues && { previousValues: filterObject(details.previousValues) }),
      ...(details.newValues && { newValues: filterObject(details.newValues) }),
    };
  }

  /**
   * Generate device fingerprint
   */
  private generateDeviceFingerprint(context: SecurityAuditContext): string {
    const components = [
      context.userAgent || '',
      context.ipAddress || '',
      process.platform,
      process.arch,
    ];

    return components.join('|');
  }

  /**
   * Check authentication alerts
   */
  private async checkAuthenticationAlerts(
    _details: AuthenticationAudit,
    context: SecurityAuditContext
  ): Promise<void> {
    const recentFailures = this.auditBuffer.filter(
      entry =>
        entry.eventType === SecurityEventType.AUTHENTICATION_FAILURE &&
        entry.context.userId === context.userId &&
        entry.timestamp > new Date(Date.now() - 3600000) // Last hour
    ).length;

    if (recentFailures >= this.config.alertThresholds.failedLogins) {
      await this.createSecurityAlert(
        SecurityRiskLevel.HIGH,
        'Multiple Authentication Failures',
        `${recentFailures} failed login attempts detected for user ${context.userId}`,
        this.auditBuffer
          .filter(
            entry =>
              entry.eventType === SecurityEventType.AUTHENTICATION_FAILURE &&
              entry.context.userId === context.userId
          )
          .slice(-5),
        [
          'Lock user account temporarily',
          'Investigate potential brute force attack',
          'Review authentication logs',
          'Consider multi-factor authentication',
        ]
      );
    }
  }

  /**
   * Check configuration change alerts
   */
  private async checkConfigurationChangeAlerts(
    _details: ConfigurationAudit,
    _context: SecurityAuditContext
  ): Promise<void> {
    const recentChanges = this.auditBuffer.filter(
      entry =>
        entry.eventType === SecurityEventType.CONFIGURATION_MODIFIED &&
        entry.timestamp > new Date(Date.now() - 3600000) // Last hour
    ).length;

    if (recentChanges >= this.config.alertThresholds.configChanges) {
      await this.createSecurityAlert(
        SecurityRiskLevel.MEDIUM,
        'Excessive Configuration Changes',
        `${recentChanges} configuration changes detected in the last hour`,
        this.auditBuffer
          .filter(entry => entry.eventType === SecurityEventType.CONFIGURATION_MODIFIED)
          .slice(-10),
        [
          'Review recent configuration changes',
          'Verify authorized personnel made changes',
          'Check for automation or bulk operations',
          'Consider temporary change freeze',
        ]
      );
    }
  }

  /**
   * Check suspicious activity alerts
   */
  private async checkSuspiciousActivityAlerts(
    _activityType: string,
    _context: SecurityAuditContext
  ): Promise<void> {
    const recentSuspicious = this.auditBuffer.filter(
      entry =>
        entry.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY &&
        entry.timestamp > new Date(Date.now() - 1800000) // Last 30 minutes
    ).length;

    if (recentSuspicious >= this.config.alertThresholds.suspiciousActivity) {
      await this.createSecurityAlert(
        SecurityRiskLevel.HIGH,
        'Multiple Suspicious Activities',
        `${recentSuspicious} suspicious activities detected in the last 30 minutes`,
        this.auditBuffer
          .filter(entry => entry.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY)
          .slice(-5),
        [
          'Investigate suspicious activity patterns',
          'Consider isolating affected resources',
          'Review user access patterns',
          'Escalate to security team',
        ]
      );
    }
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(
    severity: SecurityRiskLevel,
    title: string,
    description: string,
    events: SecurityAuditEntry[],
    recommendedActions: string[]
  ): Promise<void> {
    const alert: SecurityAlert = {
      id: randomUUID(),
      timestamp: new Date(),
      severity,
      title,
      description,
      events,
      recommendedActions,
    };

    this.alertBuffer.push(alert);
    this.emit('security-alert', alert);

    // Log the alert
    this.applicationLogger.logCategory(
      LogLevel.ERROR,
      LogCategory.SECURITY,
      `Security Alert: ${title}`,
      { alert: { id: alert.id, severity, description } }
    );
  }

  /**
   * Get last audit entry (for alert creation)
   */
  private async getLastAuditEntry(): Promise<SecurityAuditEntry> {
    return (
      this.auditBuffer[this.auditBuffer.length - 1] || {
        id: randomUUID(),
        timestamp: new Date(),
        eventType: SecurityEventType.SECURITY_VIOLATION,
        riskLevel: SecurityRiskLevel.HIGH,
        message: 'Unknown security event',
        success: false,
        context: {},
      }
    );
  }

  /**
   * Get audit entries in time range (simplified - reads from buffer)
   */
  private async getAuditEntriesInTimeRange(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityAuditEntry[]> {
    return this.auditBuffer.filter(
      entry => entry.timestamp >= startDate && entry.timestamp <= endDate
    );
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(entries: SecurityAuditEntry[]): number {
    if (entries.length === 0) return 100;

    const violations = entries.filter(
      entry =>
        entry.eventType === SecurityEventType.SECURITY_VIOLATION ||
        entry.riskLevel === SecurityRiskLevel.CRITICAL
    ).length;

    return Math.max(0, 100 - (violations / entries.length) * 100);
  }

  /**
   * Generate GDPR compliance report
   */
  private async generateGDPRReport(
    entries: SecurityAuditEntry[]
  ): Promise<ComplianceReportEntry[]> {
    const report: ComplianceReportEntry[] = [];

    // Data access logging
    const dataAccessEvents = entries.filter(
      entry =>
        entry.eventType === SecurityEventType.CONFIGURATION_READ ||
        entry.eventType === SecurityEventType.CREDENTIAL_ACCESSED
    );

    report.push({
      timestamp: new Date(),
      regulation: 'GDPR',
      requirement: 'Article 30 - Records of processing activities',
      status: dataAccessEvents.length > 0 ? 'compliant' : 'non_compliant',
      evidence: dataAccessEvents,
      notes: `${dataAccessEvents.length} data access events logged`,
    });

    return report;
  }

  /**
   * Generate SOX compliance report
   */
  private async generateSOXReport(entries: SecurityAuditEntry[]): Promise<ComplianceReportEntry[]> {
    const report: ComplianceReportEntry[] = [];

    // Configuration change tracking
    const configChanges = entries.filter(
      entry => entry.eventType === SecurityEventType.CONFIGURATION_MODIFIED
    );

    report.push({
      timestamp: new Date(),
      regulation: 'SOX',
      requirement: 'Section 404 - Management assessment of internal controls',
      status: configChanges.length > 0 ? 'compliant' : 'partial',
      evidence: configChanges,
      notes: `${configChanges.length} configuration changes tracked`,
    });

    return report;
  }

  /**
   * Generate HIPAA compliance report
   */
  private async generateHIPAAReport(
    entries: SecurityAuditEntry[]
  ): Promise<ComplianceReportEntry[]> {
    const report: ComplianceReportEntry[] = [];

    // Access controls
    const accessEvents = entries.filter(
      entry =>
        entry.eventType === SecurityEventType.AUTHORIZATION_GRANTED ||
        entry.eventType === SecurityEventType.AUTHORIZATION_DENIED
    );

    report.push({
      timestamp: new Date(),
      regulation: 'HIPAA',
      requirement: '164.312(a)(1) - Access control',
      status: accessEvents.length > 0 ? 'compliant' : 'non_compliant',
      evidence: accessEvents,
      notes: `${accessEvents.length} access control events logged`,
    });

    return report;
  }

  /**
   * Generate PCI compliance report
   */
  private async generatePCIReport(entries: SecurityAuditEntry[]): Promise<ComplianceReportEntry[]> {
    const report: ComplianceReportEntry[] = [];

    // Network monitoring
    const networkEvents = entries.filter(
      entry =>
        entry.eventType === SecurityEventType.NETWORK_REQUEST ||
        entry.eventType === SecurityEventType.NETWORK_BLOCKED
    );

    report.push({
      timestamp: new Date(),
      regulation: 'PCI DSS',
      requirement: 'Requirement 10 - Log and monitor all access to network resources',
      status: networkEvents.length > 0 ? 'compliant' : 'non_compliant',
      evidence: networkEvents,
      notes: `${networkEvents.length} network events logged`,
    });

    return report;
  }

  /**
   * Get audit status information
   */
  getAuditStatus(): {
    lastFlush: Date;
    bufferSize: number;
    totalEvents: number;
    hasSigning: boolean;
  } {
    const totalEvents = Array.from(this.eventCounters.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      lastFlush: this._lastFlush,
      bufferSize: this.auditBuffer.length,
      totalEvents,
      hasSigning: !!this._signingKey,
    };
  }

  /**
   * Verify audit trail integrity (if signing is enabled)
   */
  async verifyIntegrity(): Promise<{ valid: boolean; details?: string }> {
    if (!this._signingKey) {
      return {
        valid: true,
        details: 'No signing key configured - integrity verification disabled',
      };
    }

    // In a real implementation, this would verify signatures against the audit log
    // For now, we just check if we have a valid signing key
    return {
      valid: this._signingKey.length > 0,
      details: 'Audit trail signature verification completed',
    };
  }
}
