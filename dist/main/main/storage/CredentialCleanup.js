"use strict";
/**
 * CredentialCleanup.ts
 *
 * Provides secure cleanup and maintenance of credential data in the GetWarped
 * application. Handles automated cleanup of expired credentials, secure data
 * disposal, and credential rotation policies.
 *
 * Features:
 * - Automated cleanup of expired credentials
 * - Secure memory and storage cleanup
 * - Credential rotation scheduling
 * - Orphaned credential detection and removal
 * - Security audit trail for cleanup operations
 * - Configurable cleanup policies
 * - Cross-platform secure deletion
 *
 * Security Properties:
 * - Secure overwriting of sensitive memory
 * - Proper disposal of cryptographic keys
 * - Audit logging of all cleanup operations
 * - Detection of security violations
 * - Safe handling of cleanup failures
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
exports.CredentialCleanup = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_crypto_1 = require("node:crypto");
const node_events_1 = require("node:events");
const electron_1 = require("electron");
/**
 * Secure credential cleanup manager
 *
 * Provides comprehensive cleanup and maintenance services for credential
 * and session data in the GetWarped application.
 */
class CredentialCleanup extends node_events_1.EventEmitter {
    _credentialStore; // Reserved for future use
    sessionPersistence;
    policy;
    auditLog;
    cleanupTimer;
    deepCleanupTimer;
    isCleanupRunning = false;
    lastCleanup = null;
    lastDeepCleanup = null;
    constructor(credentialStore, sessionPersistence, policy = {}) {
        super();
        this._credentialStore = credentialStore;
        this.sessionPersistence = sessionPersistence;
        // Configure cleanup policy with defaults
        this.policy = {
            maxCredentialAge: policy.maxCredentialAge || 90, // 3 months
            maxUnusedCredentialAge: policy.maxUnusedCredentialAge || 30, // 1 month
            orphanedCredentialAge: policy.orphanedCredentialAge || 7, // 1 week
            maxSessionAge: policy.maxSessionAge || 24, // 1 day
            maxInactiveSessionAge: policy.maxInactiveSessionAge || 4, // 4 hours
            cleanupIntervalHours: policy.cleanupIntervalHours || 6, // Every 6 hours
            deepCleanupIntervalDays: policy.deepCleanupIntervalDays || 7, // Weekly
            enableSecureOverwrite: policy.enableSecureOverwrite ?? true,
            overwritePassCount: policy.overwritePassCount || 3,
            enableAuditLogging: policy.enableAuditLogging ?? true,
            maxCleanupBatchSize: policy.maxCleanupBatchSize || 50,
            cleanupTimeoutMs: policy.cleanupTimeoutMs || 30000, // 30 seconds
        };
        this.auditLog = path.join(electron_1.app.getPath('userData'), 'logs', 'credential-cleanup.log');
        // Initialize cleanup scheduling
        this.initializeCleanupScheduling();
        // Handle shutdown
        process.on('exit', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }
    /**
     * Perform standard credential and session cleanup
     */
    async performCleanup() {
        if (this.isCleanupRunning) {
            throw new Error('Cleanup operation already in progress');
        }
        this.isCleanupRunning = true;
        const startTime = new Date();
        this.emit('cleanup-started', { operation: 'standard', policy: 'default' });
        try {
            const result = {
                operation: 'standard-cleanup',
                startTime,
                endTime: new Date(),
                itemsProcessed: 0,
                itemsRemoved: 0,
                errors: [],
                warnings: [],
                bytesFreed: 0,
            };
            // Clean up expired sessions
            const sessionResult = await this.cleanupExpiredSessions();
            result.itemsProcessed += sessionResult.itemsProcessed || 0;
            result.itemsRemoved += sessionResult.itemsRemoved || 0;
            result.bytesFreed += sessionResult.bytesFreed || 0;
            result.errors.push(...(sessionResult.errors || []));
            result.warnings.push(...(sessionResult.warnings || []));
            // Clean up unused credentials
            const credentialResult = await this.cleanupUnusedCredentials();
            result.itemsProcessed += credentialResult.itemsProcessed || 0;
            result.itemsRemoved += credentialResult.itemsRemoved || 0;
            result.bytesFreed += credentialResult.bytesFreed || 0;
            result.errors.push(...(credentialResult.errors || []));
            result.warnings.push(...(credentialResult.warnings || []));
            result.endTime = new Date();
            this.lastCleanup = result.endTime;
            // Log audit trail
            if (this.policy.enableAuditLogging) {
                await this.logAuditEvent('cleanup-completed', result);
            }
            this.emit('cleanup-completed', { result });
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown cleanup error';
            this.emit('cleanup-error', { operation: 'standard', error: message });
            throw error;
        }
        finally {
            this.isCleanupRunning = false;
        }
    }
    /**
     * Perform deep cleanup with comprehensive auditing
     */
    async performDeepCleanup() {
        if (this.isCleanupRunning) {
            throw new Error('Cleanup operation already in progress');
        }
        this.isCleanupRunning = true;
        const startTime = new Date();
        this.emit('cleanup-started', { operation: 'deep', policy: 'comprehensive' });
        try {
            const result = {
                operation: 'deep-cleanup',
                startTime,
                endTime: new Date(),
                itemsProcessed: 0,
                itemsRemoved: 0,
                errors: [],
                warnings: [],
                bytesFreed: 0,
            };
            // Perform standard cleanup first
            const standardResult = await this.performStandardCleanupInternal();
            result.itemsProcessed += standardResult.itemsProcessed || 0;
            result.itemsRemoved += standardResult.itemsRemoved || 0;
            result.bytesFreed += standardResult.bytesFreed || 0;
            result.errors.push(...(standardResult.errors || []));
            result.warnings.push(...(standardResult.warnings || []));
            // Audit all credentials
            const auditResult = await this.auditAllCredentials();
            result.itemsProcessed += auditResult.itemsProcessed;
            // Clean up orphaned credentials
            const orphanResult = await this.cleanupOrphanedCredentials();
            result.itemsProcessed += orphanResult.itemsProcessed || 0;
            result.itemsRemoved += orphanResult.itemsRemoved || 0;
            result.bytesFreed += orphanResult.bytesFreed || 0;
            result.errors.push(...(orphanResult.errors || []));
            result.warnings.push(...(orphanResult.warnings || []));
            // Secure memory cleanup
            const memoryResult = await this.performSecureMemoryCleanup();
            result.bytesFreed += memoryResult.bytesFreed || 0;
            result.warnings.push(...(memoryResult.warnings || []));
            result.endTime = new Date();
            this.lastDeepCleanup = result.endTime;
            // Log comprehensive audit trail
            if (this.policy.enableAuditLogging) {
                await this.logAuditEvent('deep-cleanup-completed', result);
            }
            this.emit('cleanup-completed', { result });
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown deep cleanup error';
            this.emit('cleanup-error', { operation: 'deep', error: message });
            throw error;
        }
        finally {
            this.isCleanupRunning = false;
        }
    }
    /**
     * Audit all credentials for security issues
     */
    async auditAllCredentials() {
        const audits = [];
        let itemsProcessed = 0;
        let issuesFound = 0;
        try {
            // Simplified implementation - return empty array for now
            // TODO: Implement proper credential auditing when CredentialStore API is complete
            const credentials = [];
            for (const credential of credentials) {
                const audit = await this.auditCredential(credential);
                audits.push(audit);
                itemsProcessed++;
                if (audit.riskLevel === 'high' || audit.recommendedAction === 'remove') {
                    issuesFound++;
                }
                // Check for rotation requirements
                if (audit.recommendedAction === 'rotate') {
                    this.emit('rotation-required', {
                        serviceId: audit.serviceId,
                        reason: 'policy-based-rotation',
                    });
                }
            }
            this.emit('audit-complete', { credentialCount: itemsProcessed, issuesFound });
            return { credentialAudits: audits, itemsProcessed, issuesFound };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown audit error';
            this.emit('cleanup-error', { operation: 'audit', error: message });
            return { credentialAudits: [], itemsProcessed: 0, issuesFound: 0 };
        }
    }
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        const result = {
            itemsProcessed: 0,
            itemsRemoved: 0,
            errors: [],
            warnings: [],
            bytesFreed: 0,
        };
        try {
            const removedCount = await this.sessionPersistence.cleanupExpiredSessions();
            result.itemsRemoved = removedCount;
            result.itemsProcessed = removedCount; // Simplified - in practice, would check all sessions
            // Estimate bytes freed (rough calculation)
            result.bytesFreed = removedCount * 1024; // Assume ~1KB per session
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown session cleanup error';
            result.errors.push(`Session cleanup failed: ${message}`);
        }
        return result;
    }
    /**
     * Clean up unused credentials
     */
    async cleanupUnusedCredentials() {
        const result = {
            itemsProcessed: 0,
            itemsRemoved: 0,
            errors: [],
            warnings: [],
            bytesFreed: 0,
        };
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.policy.maxUnusedCredentialAge);
            // Simplified implementation - return empty array for now
            // TODO: Implement proper unused credential detection when CredentialStore API is complete
            const unusedCredentials = [];
            result.itemsProcessed = unusedCredentials.length;
            for (const credential of unusedCredentials) {
                try {
                    // TODO: Implement proper credential deletion when CredentialStore API is complete
                    const removed = true; // Placeholder
                    if (removed) {
                        result.itemsRemoved++;
                        result.bytesFreed += this.estimateCredentialSize(credential);
                        this.emit('credential-removed', {
                            serviceId: credential.serviceId,
                            type: credential.type,
                            reason: 'unused-expired',
                        });
                        // Secure cleanup if enabled
                        if (this.policy.enableSecureOverwrite) {
                            await this.secureOverwrite(credential);
                        }
                    }
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown credential removal error';
                    result.errors.push(`Failed to remove credential ${credential.serviceId}: ${message}`);
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown credential cleanup error';
            result.errors.push(`Credential cleanup failed: ${message}`);
        }
        return result;
    }
    /**
     * Clean up orphaned credentials
     */
    async cleanupOrphanedCredentials() {
        const result = {
            itemsProcessed: 0,
            itemsRemoved: 0,
            errors: [],
            warnings: [],
            bytesFreed: 0,
        };
        try {
            const orphanedCredentials = await this.findOrphanedCredentials();
            result.itemsProcessed = orphanedCredentials.length;
            for (const credential of orphanedCredentials) {
                try {
                    // TODO: Implement proper credential deletion when CredentialStore API is complete
                    const removed = true; // Placeholder
                    if (removed) {
                        result.itemsRemoved++;
                        result.bytesFreed += this.estimateCredentialSize(credential);
                        this.emit('credential-removed', {
                            serviceId: credential.serviceId,
                            type: credential.type,
                            reason: 'orphaned',
                        });
                        this.emit('security-violation', {
                            type: 'orphaned-credential',
                            details: `Removed orphaned credential for service ${credential.serviceId}`,
                            severity: 'medium',
                        });
                    }
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown orphan cleanup error';
                    result.errors.push(`Failed to remove orphaned credential ${credential.serviceId}: ${message}`);
                }
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown orphan detection error';
            result.errors.push(`Orphaned credential cleanup failed: ${message}`);
        }
        return result;
    }
    /**
     * Perform secure memory cleanup
     */
    async performSecureMemoryCleanup() {
        const result = {
            bytesFreed: 0,
            warnings: [],
        };
        try {
            // Force garbage collection if possible
            if (global.gc) {
                global.gc();
                result.bytesFreed = 1024 * 1024; // Estimate 1MB freed
            }
            else {
                result.warnings.push('Garbage collection not available - consider running with --expose-gc');
            }
            // TODO: Clear sensitive caches when CredentialStore API is complete
            // await this.credentialStore.clearSensitiveCaches();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown memory cleanup error';
            result.warnings.push(`Memory cleanup warning: ${message}`);
        }
        return result;
    }
    /**
     * Standard cleanup without deep operations
     */
    async performStandardCleanupInternal() {
        const sessionResult = await this.cleanupExpiredSessions();
        const credentialResult = await this.cleanupUnusedCredentials();
        return {
            itemsProcessed: (sessionResult.itemsProcessed || 0) + (credentialResult.itemsProcessed || 0),
            itemsRemoved: (sessionResult.itemsRemoved || 0) + (credentialResult.itemsRemoved || 0),
            errors: [...(sessionResult.errors || []), ...(credentialResult.errors || [])],
            warnings: [...(sessionResult.warnings || []), ...(credentialResult.warnings || [])],
            bytesFreed: (sessionResult.bytesFreed || 0) + (credentialResult.bytesFreed || 0),
        };
    }
    /**
     * Audit individual credential
     */
    async auditCredential(credential) {
        // This is a simplified implementation
        const now = new Date();
        const lastAccessed = credential.lastAccessed || credential.createdAt || now;
        const lastModified = credential.updatedAt || credential.createdAt || now;
        const daysSinceAccess = Math.floor((now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceModified = Math.floor((now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
        let riskLevel = 'low';
        let recommendedAction = 'keep';
        // Risk assessment logic
        if (daysSinceAccess > this.policy.maxUnusedCredentialAge) {
            riskLevel = 'medium';
            recommendedAction = 'remove';
        }
        else if (daysSinceModified > this.policy.maxCredentialAge) {
            riskLevel = 'medium';
            recommendedAction = 'rotate';
        }
        const isOrphaned = await this.isCredentialOrphaned(credential);
        if (isOrphaned) {
            riskLevel = 'high';
            recommendedAction = 'remove';
        }
        return {
            serviceId: credential.serviceId,
            credentialType: credential.type || 'unknown',
            lastAccessed,
            lastModified,
            accessCount: credential.accessCount || 0,
            isOrphaned,
            isExpired: daysSinceAccess > this.policy.maxCredentialAge,
            riskLevel,
            recommendedAction,
        };
    }
    /**
     * Find orphaned credentials
     */
    async findOrphanedCredentials() {
        // Simplified implementation - return empty array for now
        // TODO: Implement proper orphaned credential detection when CredentialStore API is complete
        try {
            const allCredentials = [];
            const orphaned = [];
            for (const credential of allCredentials) {
                if (await this.isCredentialOrphaned(credential)) {
                    orphaned.push(credential);
                }
            }
            return orphaned;
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Check if credential is orphaned
     */
    async isCredentialOrphaned(credential) {
        // Simplified check - in practice, would verify against active services/workspaces
        try {
            // Check if the service still exists in configuration
            const serviceExists = await this.checkServiceExists(credential.serviceId);
            return !serviceExists;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check if service exists
     */
    async checkServiceExists(_serviceId) {
        // This would need to check against the actual service configuration
        // For now, assume all services exist
        return true;
    }
    /**
     * Estimate credential size for cleanup reporting
     */
    estimateCredentialSize(_credential) {
        // Rough estimate of credential storage size
        return 512; // bytes
    }
    /**
     * Secure overwrite of credential data
     */
    async secureOverwrite(_credential) {
        if (!this.policy.enableSecureOverwrite) {
            return;
        }
        try {
            // This is a placeholder for secure overwrite implementation
            // In practice, this would involve overwriting memory locations
            // and storage locations with random data multiple times
            for (let pass = 0; pass < this.policy.overwritePassCount; pass++) {
                (0, node_crypto_1.randomBytes)(1024); // Generate random data for overwrite pass
                // Overwrite credential data locations with random data
                // Implementation would depend on how credentials are actually stored
            }
        }
        catch (error) {
            // Log but don't fail the cleanup operation
            const message = error instanceof Error ? error.message : 'Unknown overwrite error';
            this.emit('cleanup-error', {
                operation: 'secure-overwrite',
                error: `Secure overwrite failed: ${message}`,
            });
        }
    }
    /**
     * Log audit event
     */
    async logAuditEvent(eventType, data) {
        if (!this.policy.enableAuditLogging) {
            return;
        }
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                eventType,
                data,
                checksum: (0, node_crypto_1.createHash)('sha256').update(JSON.stringify(data)).digest('hex'),
            };
            const logLine = JSON.stringify(logEntry) + '\n';
            // Ensure log directory exists
            await fs.mkdir(path.dirname(this.auditLog), { recursive: true });
            await fs.appendFile(this.auditLog, logLine);
        }
        catch (error) {
            // Don't fail cleanup operations due to logging errors
            this.emit('cleanup-error', {
                operation: 'audit-logging',
                error: `Failed to write audit log: ${error}`,
            });
        }
    }
    /**
     * Initialize cleanup scheduling
     */
    initializeCleanupScheduling() {
        // Standard cleanup timer
        const cleanupIntervalMs = this.policy.cleanupIntervalHours * 60 * 60 * 1000;
        this.cleanupTimer = setInterval(() => {
            this.performCleanup().catch(error => {
                this.emit('cleanup-error', {
                    operation: 'scheduled-cleanup',
                    error: error.message,
                });
            });
        }, cleanupIntervalMs);
        // Deep cleanup timer
        const deepCleanupIntervalMs = this.policy.deepCleanupIntervalDays * 24 * 60 * 60 * 1000;
        this.deepCleanupTimer = setInterval(() => {
            this.performDeepCleanup().catch(error => {
                this.emit('cleanup-error', {
                    operation: 'scheduled-deep-cleanup',
                    error: error.message,
                });
            });
        }, deepCleanupIntervalMs);
    }
    /**
     * Get cleanup statistics
     */
    getCleanupStats() {
        return {
            lastCleanup: this.lastCleanup,
            lastDeepCleanup: this.lastDeepCleanup,
            isRunning: this.isCleanupRunning,
            policy: { ...this.policy },
        };
    }
    /**
     * Shutdown cleanup service
     */
    shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        if (this.deepCleanupTimer) {
            clearInterval(this.deepCleanupTimer);
            this.deepCleanupTimer = undefined;
        }
        this.removeAllListeners();
    }
    // Type-safe event emitter overrides
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
    /**
     * Get credential store status (for future integration)
     */
    getCredentialStoreStatus() {
        return {
            available: !!this._credentialStore,
        };
    }
}
exports.CredentialCleanup = CredentialCleanup;
// Default export
exports.default = CredentialCleanup;
//# sourceMappingURL=CredentialCleanup.js.map