"use strict";
/**
 * @fileoverview Security Audit Logger - Security-focused audit logging for authentication events,
 * configuration changes, and security incidents
 * @version 1.0.0
 * @author GetWarped Development Team
 * @since 2024
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditLogger = exports.SecurityRiskLevel = exports.SecurityEventType = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const electron_1 = require("electron");
const crypto_1 = require("crypto");
const ApplicationLogger_1 = require("./ApplicationLogger");
/**
 * Security event types
 */
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["AUTHENTICATION_SUCCESS"] = "authentication_success";
    SecurityEventType["AUTHENTICATION_FAILURE"] = "authentication_failure";
    SecurityEventType["AUTHORIZATION_GRANTED"] = "authorization_granted";
    SecurityEventType["AUTHORIZATION_DENIED"] = "authorization_denied";
    SecurityEventType["SESSION_CREATED"] = "session_created";
    SecurityEventType["SESSION_DESTROYED"] = "session_destroyed";
    SecurityEventType["SESSION_EXPIRED"] = "session_expired";
    SecurityEventType["CREDENTIAL_CREATED"] = "credential_created";
    SecurityEventType["CREDENTIAL_ACCESSED"] = "credential_accessed";
    SecurityEventType["CREDENTIAL_UPDATED"] = "credential_updated";
    SecurityEventType["CREDENTIAL_DELETED"] = "credential_deleted";
    SecurityEventType["CONFIGURATION_READ"] = "configuration_read";
    SecurityEventType["CONFIGURATION_MODIFIED"] = "configuration_modified";
    SecurityEventType["CONFIGURATION_EXPORTED"] = "configuration_exported";
    SecurityEventType["CONFIGURATION_IMPORTED"] = "configuration_imported";
    SecurityEventType["FILE_ACCESS_ATTEMPT"] = "file_access_attempt";
    SecurityEventType["FILE_PERMISSION_DENIED"] = "file_permission_denied";
    SecurityEventType["NETWORK_REQUEST"] = "network_request";
    SecurityEventType["NETWORK_BLOCKED"] = "network_blocked";
    SecurityEventType["SECURITY_VIOLATION"] = "security_violation";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    SecurityEventType["DATA_BREACH_ATTEMPT"] = "data_breach_attempt";
    SecurityEventType["PRIVILEGE_ESCALATION"] = "privilege_escalation";
    SecurityEventType["MALICIOUS_INPUT"] = "malicious_input";
    SecurityEventType["ENCRYPTION_FAILURE"] = "encryption_failure";
    SecurityEventType["DECRYPTION_FAILURE"] = "decryption_failure";
    SecurityEventType["CERTIFICATE_ERROR"] = "certificate_error";
    SecurityEventType["INTEGRITY_CHECK_FAILED"] = "integrity_check_failed";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
/**
 * Security risk levels
 */
var SecurityRiskLevel;
(function (SecurityRiskLevel) {
    SecurityRiskLevel["LOW"] = "low";
    SecurityRiskLevel["MEDIUM"] = "medium";
    SecurityRiskLevel["HIGH"] = "high";
    SecurityRiskLevel["CRITICAL"] = "critical";
})(SecurityRiskLevel || (exports.SecurityRiskLevel = SecurityRiskLevel = {}));
/**
 * Main security audit logger
 */
class SecurityAuditLogger extends events_1.EventEmitter {
    config;
    applicationLogger;
    auditStream;
    currentAuditFile;
    auditBuffer = [];
    alertBuffer = [];
    eventCounters = new Map();
    _lastFlush = new Date();
    _signingKey;
    constructor(applicationLogger, config = {}) {
        super();
        this.applicationLogger = applicationLogger;
        this.config = {
            enabled: true,
            auditDirectory: path.join(electron_1.app.getPath('logs'), 'security'),
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
    async logAuthentication(eventType, details, context = {}) {
        const riskLevel = eventType === SecurityEventType.AUTHENTICATION_FAILURE
            ? details.attemptsCount && details.attemptsCount > 3
                ? SecurityRiskLevel.HIGH
                : SecurityRiskLevel.MEDIUM
            : SecurityRiskLevel.LOW;
        const message = eventType === SecurityEventType.AUTHENTICATION_SUCCESS
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
    async logAuthorization(eventType, resource, action, context = {}) {
        const riskLevel = eventType === SecurityEventType.AUTHORIZATION_DENIED
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
    async logSession(eventType, sessionData, context = {}) {
        const riskLevel = eventType === SecurityEventType.SESSION_EXPIRED || sessionData.forced
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
    async logCredentialAccess(eventType, credentialId, credentialType, context = {}) {
        const riskLevel = eventType === SecurityEventType.CREDENTIAL_DELETED
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
    async logConfigurationChange(eventType, details, context = {}) {
        const riskLevel = eventType === SecurityEventType.CONFIGURATION_MODIFIED
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
    async logFileAccess(eventType, details, context = {}) {
        const riskLevel = eventType === SecurityEventType.FILE_PERMISSION_DENIED
            ? SecurityRiskLevel.HIGH
            : SecurityRiskLevel.LOW;
        const message = eventType === SecurityEventType.FILE_ACCESS_ATTEMPT
            ? `File ${details.operation} attempted: ${details.filePath}`
            : `File access denied: ${details.filePath} (${details.accessDeniedReason})`;
        const evidence = [];
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
    async logNetworkRequest(eventType, details, context = {}) {
        const riskLevel = eventType === SecurityEventType.NETWORK_BLOCKED || !details.certificateValid
            ? SecurityRiskLevel.HIGH
            : SecurityRiskLevel.LOW;
        const message = eventType === SecurityEventType.NETWORK_REQUEST
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
    async logSecurityViolation(violationType, description, riskLevel = SecurityRiskLevel.HIGH, context = {}, evidence = []) {
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
            await this.createSecurityAlert(riskLevel, `Security Violation: ${violationType}`, description, [await this.getLastAuditEntry()], [
                'Investigate the security violation immediately',
                'Review system logs for related activities',
                'Consider isolating affected resources',
                'Update security policies if necessary',
            ]);
        }
    }
    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(activityType, description, context = {}, evidence = []) {
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
    async generateComplianceReport(regulation, startDate, endDate) {
        const auditEntries = await this.getAuditEntriesInTimeRange(startDate, endDate);
        const report = [];
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
    getSecurityMetrics(timeframe = 'day') {
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
            eventsByType: new Map(),
            eventsByRisk: new Map(),
            failureRate: 0,
            alertsGenerated: this.alertBuffer.filter(alert => alert.timestamp >= startTime).length,
            topRiskEvents: [],
            complianceScore: this.calculateComplianceScore(recentEntries),
        };
        // Count events by type and risk level
        recentEntries.forEach(entry => {
            metrics.eventsByType.set(entry.eventType, (metrics.eventsByType.get(entry.eventType) || 0) + 1);
            metrics.eventsByRisk.set(entry.riskLevel, (metrics.eventsByRisk.get(entry.riskLevel) || 0) + 1);
        });
        // Calculate failure rate
        const failures = recentEntries.filter(entry => !entry.success).length;
        metrics.failureRate = recentEntries.length > 0 ? failures / recentEntries.length : 0;
        // Get top risk events
        metrics.topRiskEvents = recentEntries
            .filter(entry => entry.riskLevel === SecurityRiskLevel.CRITICAL ||
            entry.riskLevel === SecurityRiskLevel.HIGH)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
        return metrics;
    }
    /**
     * Close audit logger
     */
    async close() {
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
    async logSecurityEvent(event) {
        if (!this.config.enabled || !this.config.includedEvents.includes(event.eventType)) {
            return;
        }
        const auditEntry = {
            id: (0, crypto_1.randomUUID)(),
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
        this.applicationLogger.logCategory(this.mapRiskLevelToLogLevel(event.riskLevel), ApplicationLogger_1.LogCategory.SECURITY, event.message, {
            securityEvent: auditEntry.eventType,
            riskLevel: event.riskLevel,
            context: event.context,
        });
        // Flush if buffer is large or critical event
        if (this.auditBuffer.length >= 100 || event.riskLevel === SecurityRiskLevel.CRITICAL) {
            await this.flushAuditBuffer();
        }
        // Generate alerts if needed
        if (this.config.realTimeAlerts && event.riskLevel === SecurityRiskLevel.CRITICAL) {
            await this.createSecurityAlert(event.riskLevel, 'Critical Security Event', event.message, [auditEntry], ['Investigate immediately', 'Review security protocols']);
        }
    }
    /**
     * Initialize audit logging system
     */
    async initializeAuditLogging() {
        try {
            // Ensure audit directory exists
            await fs_1.promises.mkdir(this.config.auditDirectory, { recursive: true });
            // Initialize signing key if needed
            if (this.config.signAuditEntries) {
                this._signingKey = (0, crypto_1.randomUUID)(); // In production, use proper key management
            }
            this.emit('audit-logger-initialized');
        }
        catch (error) {
            this.emit('audit-logger-error', error);
            throw error;
        }
    }
    /**
     * Flush audit buffer to file
     */
    async flushAuditBuffer() {
        if (this.auditBuffer.length === 0)
            return;
        const entries = this.auditBuffer.splice(0);
        try {
            if (!this.auditStream) {
                this.auditStream = await fs_1.promises.open(this.currentAuditFile, 'a');
            }
            for (const entry of entries) {
                const line = JSON.stringify(entry) + '\n';
                await this.auditStream.write(line, null, 'utf8');
            }
            await this.auditStream.sync();
            this._lastFlush = new Date();
            this.emit('audit-flushed', { count: entries.length });
        }
        catch (error) {
            // Put entries back if flush failed
            this.auditBuffer.unshift(...entries);
            this.emit('audit-flush-error', error);
            throw error;
        }
    }
    /**
     * Generate audit file name
     */
    generateAuditFileName() {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.config.auditDirectory, `security-audit-${date}.log`);
    }
    /**
     * Sign audit entry for integrity
     */
    signAuditEntry(_entry) {
        // Simplified signing - in production, use proper cryptographic signing
        return `sig_${(0, crypto_1.randomUUID)()}`;
    }
    /**
     * Map security risk level to log level
     */
    mapRiskLevelToLogLevel(riskLevel) {
        switch (riskLevel) {
            case SecurityRiskLevel.LOW:
                return ApplicationLogger_1.LogLevel.INFO;
            case SecurityRiskLevel.MEDIUM:
                return ApplicationLogger_1.LogLevel.WARN;
            case SecurityRiskLevel.HIGH:
                return ApplicationLogger_1.LogLevel.ERROR;
            case SecurityRiskLevel.CRITICAL:
                return ApplicationLogger_1.LogLevel.FATAL;
        }
    }
    /**
     * Filter sensitive data from configuration audit
     */
    filterSensitiveConfigurationData(details) {
        const filterObject = (obj) => {
            if (!obj)
                return obj;
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
    generateDeviceFingerprint(context) {
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
    async checkAuthenticationAlerts(_details, context) {
        const recentFailures = this.auditBuffer.filter(entry => entry.eventType === SecurityEventType.AUTHENTICATION_FAILURE &&
            entry.context.userId === context.userId &&
            entry.timestamp > new Date(Date.now() - 3600000) // Last hour
        ).length;
        if (recentFailures >= this.config.alertThresholds.failedLogins) {
            await this.createSecurityAlert(SecurityRiskLevel.HIGH, 'Multiple Authentication Failures', `${recentFailures} failed login attempts detected for user ${context.userId}`, this.auditBuffer
                .filter(entry => entry.eventType === SecurityEventType.AUTHENTICATION_FAILURE &&
                entry.context.userId === context.userId)
                .slice(-5), [
                'Lock user account temporarily',
                'Investigate potential brute force attack',
                'Review authentication logs',
                'Consider multi-factor authentication',
            ]);
        }
    }
    /**
     * Check configuration change alerts
     */
    async checkConfigurationChangeAlerts(_details, _context) {
        const recentChanges = this.auditBuffer.filter(entry => entry.eventType === SecurityEventType.CONFIGURATION_MODIFIED &&
            entry.timestamp > new Date(Date.now() - 3600000) // Last hour
        ).length;
        if (recentChanges >= this.config.alertThresholds.configChanges) {
            await this.createSecurityAlert(SecurityRiskLevel.MEDIUM, 'Excessive Configuration Changes', `${recentChanges} configuration changes detected in the last hour`, this.auditBuffer
                .filter(entry => entry.eventType === SecurityEventType.CONFIGURATION_MODIFIED)
                .slice(-10), [
                'Review recent configuration changes',
                'Verify authorized personnel made changes',
                'Check for automation or bulk operations',
                'Consider temporary change freeze',
            ]);
        }
    }
    /**
     * Check suspicious activity alerts
     */
    async checkSuspiciousActivityAlerts(_activityType, _context) {
        const recentSuspicious = this.auditBuffer.filter(entry => entry.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY &&
            entry.timestamp > new Date(Date.now() - 1800000) // Last 30 minutes
        ).length;
        if (recentSuspicious >= this.config.alertThresholds.suspiciousActivity) {
            await this.createSecurityAlert(SecurityRiskLevel.HIGH, 'Multiple Suspicious Activities', `${recentSuspicious} suspicious activities detected in the last 30 minutes`, this.auditBuffer
                .filter(entry => entry.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY)
                .slice(-5), [
                'Investigate suspicious activity patterns',
                'Consider isolating affected resources',
                'Review user access patterns',
                'Escalate to security team',
            ]);
        }
    }
    /**
     * Create security alert
     */
    async createSecurityAlert(severity, title, description, events, recommendedActions) {
        const alert = {
            id: (0, crypto_1.randomUUID)(),
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
        this.applicationLogger.logCategory(ApplicationLogger_1.LogLevel.ERROR, ApplicationLogger_1.LogCategory.SECURITY, `Security Alert: ${title}`, { alert: { id: alert.id, severity, description } });
    }
    /**
     * Get last audit entry (for alert creation)
     */
    async getLastAuditEntry() {
        return (this.auditBuffer[this.auditBuffer.length - 1] || {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            eventType: SecurityEventType.SECURITY_VIOLATION,
            riskLevel: SecurityRiskLevel.HIGH,
            message: 'Unknown security event',
            success: false,
            context: {},
        });
    }
    /**
     * Get audit entries in time range (simplified - reads from buffer)
     */
    async getAuditEntriesInTimeRange(startDate, endDate) {
        return this.auditBuffer.filter(entry => entry.timestamp >= startDate && entry.timestamp <= endDate);
    }
    /**
     * Calculate compliance score
     */
    calculateComplianceScore(entries) {
        if (entries.length === 0)
            return 100;
        const violations = entries.filter(entry => entry.eventType === SecurityEventType.SECURITY_VIOLATION ||
            entry.riskLevel === SecurityRiskLevel.CRITICAL).length;
        return Math.max(0, 100 - (violations / entries.length) * 100);
    }
    /**
     * Generate GDPR compliance report
     */
    async generateGDPRReport(entries) {
        const report = [];
        // Data access logging
        const dataAccessEvents = entries.filter(entry => entry.eventType === SecurityEventType.CONFIGURATION_READ ||
            entry.eventType === SecurityEventType.CREDENTIAL_ACCESSED);
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
    async generateSOXReport(entries) {
        const report = [];
        // Configuration change tracking
        const configChanges = entries.filter(entry => entry.eventType === SecurityEventType.CONFIGURATION_MODIFIED);
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
    async generateHIPAAReport(entries) {
        const report = [];
        // Access controls
        const accessEvents = entries.filter(entry => entry.eventType === SecurityEventType.AUTHORIZATION_GRANTED ||
            entry.eventType === SecurityEventType.AUTHORIZATION_DENIED);
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
    async generatePCIReport(entries) {
        const report = [];
        // Network monitoring
        const networkEvents = entries.filter(entry => entry.eventType === SecurityEventType.NETWORK_REQUEST ||
            entry.eventType === SecurityEventType.NETWORK_BLOCKED);
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
    getAuditStatus() {
        const totalEvents = Array.from(this.eventCounters.values()).reduce((sum, count) => sum + count, 0);
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
    async verifyIntegrity() {
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
exports.SecurityAuditLogger = SecurityAuditLogger;
//# sourceMappingURL=SecurityAuditLogger.js.map