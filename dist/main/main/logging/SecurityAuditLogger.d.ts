/**
 * @fileoverview Security Audit Logger - Security-focused audit logging for authentication events,
 * configuration changes, and security incidents
 * @version 1.0.0
 * @author GetWarped Development Team
 * @since 2024
 */
import { EventEmitter } from 'events';
import { ApplicationLogger } from './ApplicationLogger';
/**
 * Security event types
 */
export declare enum SecurityEventType {
    AUTHENTICATION_SUCCESS = "authentication_success",
    AUTHENTICATION_FAILURE = "authentication_failure",
    AUTHORIZATION_GRANTED = "authorization_granted",
    AUTHORIZATION_DENIED = "authorization_denied",
    SESSION_CREATED = "session_created",
    SESSION_DESTROYED = "session_destroyed",
    SESSION_EXPIRED = "session_expired",
    CREDENTIAL_CREATED = "credential_created",
    CREDENTIAL_ACCESSED = "credential_accessed",
    CREDENTIAL_UPDATED = "credential_updated",
    CREDENTIAL_DELETED = "credential_deleted",
    CONFIGURATION_READ = "configuration_read",
    CONFIGURATION_MODIFIED = "configuration_modified",
    CONFIGURATION_EXPORTED = "configuration_exported",
    CONFIGURATION_IMPORTED = "configuration_imported",
    FILE_ACCESS_ATTEMPT = "file_access_attempt",
    FILE_PERMISSION_DENIED = "file_permission_denied",
    NETWORK_REQUEST = "network_request",
    NETWORK_BLOCKED = "network_blocked",
    SECURITY_VIOLATION = "security_violation",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    DATA_BREACH_ATTEMPT = "data_breach_attempt",
    PRIVILEGE_ESCALATION = "privilege_escalation",
    MALICIOUS_INPUT = "malicious_input",
    ENCRYPTION_FAILURE = "encryption_failure",
    DECRYPTION_FAILURE = "decryption_failure",
    CERTIFICATE_ERROR = "certificate_error",
    INTEGRITY_CHECK_FAILED = "integrity_check_failed"
}
/**
 * Security risk levels
 */
export declare enum SecurityRiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
    readonly operation: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'backup' | 'restore';
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
export declare class SecurityAuditLogger extends EventEmitter {
    private readonly config;
    private readonly applicationLogger;
    private auditStream?;
    private currentAuditFile;
    private auditBuffer;
    private alertBuffer;
    private eventCounters;
    private _lastFlush;
    private _signingKey?;
    constructor(applicationLogger: ApplicationLogger, config?: Partial<SecurityAuditConfig>);
    /**
     * Log authentication event
     */
    logAuthentication(eventType: SecurityEventType.AUTHENTICATION_SUCCESS | SecurityEventType.AUTHENTICATION_FAILURE, details: AuthenticationAudit, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log authorization event
     */
    logAuthorization(eventType: SecurityEventType.AUTHORIZATION_GRANTED | SecurityEventType.AUTHORIZATION_DENIED, resource: string, action: string, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log session event
     */
    logSession(eventType: SecurityEventType.SESSION_CREATED | SecurityEventType.SESSION_DESTROYED | SecurityEventType.SESSION_EXPIRED, sessionData: {
        sessionId: string;
        duration?: number;
        reason?: string;
        forced?: boolean;
    }, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log credential access event
     */
    logCredentialAccess(eventType: SecurityEventType.CREDENTIAL_CREATED | SecurityEventType.CREDENTIAL_ACCESSED | SecurityEventType.CREDENTIAL_UPDATED | SecurityEventType.CREDENTIAL_DELETED, credentialId: string, credentialType: string, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log configuration change event
     */
    logConfigurationChange(eventType: SecurityEventType.CONFIGURATION_READ | SecurityEventType.CONFIGURATION_MODIFIED | SecurityEventType.CONFIGURATION_EXPORTED | SecurityEventType.CONFIGURATION_IMPORTED, details: ConfigurationAudit, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log file access event
     */
    logFileAccess(eventType: SecurityEventType.FILE_ACCESS_ATTEMPT | SecurityEventType.FILE_PERMISSION_DENIED, details: FileAccessAudit, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log network request event
     */
    logNetworkRequest(eventType: SecurityEventType.NETWORK_REQUEST | SecurityEventType.NETWORK_BLOCKED, details: NetworkAudit, context?: SecurityAuditContext): Promise<void>;
    /**
     * Log security violation
     */
    logSecurityViolation(violationType: string, description: string, riskLevel?: SecurityRiskLevel, context?: SecurityAuditContext, evidence?: SecurityEvidence[]): Promise<void>;
    /**
     * Log suspicious activity
     */
    logSuspiciousActivity(activityType: string, description: string, context?: SecurityAuditContext, evidence?: SecurityEvidence[]): Promise<void>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(regulation: 'gdpr' | 'sox' | 'hipaa' | 'pci', startDate: Date, endDate: Date): Promise<ComplianceReportEntry[]>;
    /**
     * Get security metrics
     */
    getSecurityMetrics(timeframe?: 'hour' | 'day' | 'week' | 'month'): {
        totalEvents: number;
        eventsByType: Map<SecurityEventType, number>;
        eventsByRisk: Map<SecurityRiskLevel, number>;
        failureRate: number;
        alertsGenerated: number;
        topRiskEvents: SecurityAuditEntry[];
        complianceScore: number;
    };
    /**
     * Close audit logger
     */
    close(): Promise<void>;
    /**
     * Core security event logging method
     */
    private logSecurityEvent;
    /**
     * Initialize audit logging system
     */
    private initializeAuditLogging;
    /**
     * Flush audit buffer to file
     */
    private flushAuditBuffer;
    /**
     * Generate audit file name
     */
    private generateAuditFileName;
    /**
     * Sign audit entry for integrity
     */
    private signAuditEntry;
    /**
     * Map security risk level to log level
     */
    private mapRiskLevelToLogLevel;
    /**
     * Filter sensitive data from configuration audit
     */
    private filterSensitiveConfigurationData;
    /**
     * Generate device fingerprint
     */
    private generateDeviceFingerprint;
    /**
     * Check authentication alerts
     */
    private checkAuthenticationAlerts;
    /**
     * Check configuration change alerts
     */
    private checkConfigurationChangeAlerts;
    /**
     * Check suspicious activity alerts
     */
    private checkSuspiciousActivityAlerts;
    /**
     * Create security alert
     */
    private createSecurityAlert;
    /**
     * Get last audit entry (for alert creation)
     */
    private getLastAuditEntry;
    /**
     * Get audit entries in time range (simplified - reads from buffer)
     */
    private getAuditEntriesInTimeRange;
    /**
     * Calculate compliance score
     */
    private calculateComplianceScore;
    /**
     * Generate GDPR compliance report
     */
    private generateGDPRReport;
    /**
     * Generate SOX compliance report
     */
    private generateSOXReport;
    /**
     * Generate HIPAA compliance report
     */
    private generateHIPAAReport;
    /**
     * Generate PCI compliance report
     */
    private generatePCIReport;
    /**
     * Get audit status information
     */
    getAuditStatus(): {
        lastFlush: Date;
        bufferSize: number;
        totalEvents: number;
        hasSigning: boolean;
    };
    /**
     * Verify audit trail integrity (if signing is enabled)
     */
    verifyIntegrity(): Promise<{
        valid: boolean;
        details?: string;
    }>;
}
//# sourceMappingURL=SecurityAuditLogger.d.ts.map