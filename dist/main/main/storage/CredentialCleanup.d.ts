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
import { EventEmitter } from 'node:events';
import { CredentialStore } from './CredentialStore';
import { SessionPersistence } from './SessionPersistence';
/**
 * Cleanup policy configuration
 */
interface CleanupPolicy {
    maxCredentialAge: number;
    maxUnusedCredentialAge: number;
    orphanedCredentialAge: number;
    maxSessionAge: number;
    maxInactiveSessionAge: number;
    cleanupIntervalHours: number;
    deepCleanupIntervalDays: number;
    enableSecureOverwrite: boolean;
    overwritePassCount: number;
    enableAuditLogging: boolean;
    maxCleanupBatchSize: number;
    cleanupTimeoutMs: number;
}
/**
 * Cleanup operation result
 */
interface CleanupResult {
    operation: string;
    startTime: Date;
    endTime: Date;
    itemsProcessed: number;
    itemsRemoved: number;
    errors: string[];
    warnings: string[];
    bytesFreed: number;
}
/**
 * Credential audit information
 */
interface CredentialAudit {
    serviceId: string;
    credentialType: string;
    lastAccessed: Date;
    lastModified: Date;
    accessCount: number;
    isOrphaned: boolean;
    isExpired: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    recommendedAction: 'keep' | 'rotate' | 'remove';
}
/**
 * Events emitted by CredentialCleanup
 */
interface CredentialCleanupEvents {
    'cleanup-started': {
        operation: string;
        policy: string;
    };
    'cleanup-completed': {
        result: CleanupResult;
    };
    'credential-removed': {
        serviceId: string;
        type: string;
        reason: string;
    };
    'session-cleaned': {
        sessionId: string;
        reason: string;
    };
    'security-violation': {
        type: string;
        details: string;
        severity: 'low' | 'medium' | 'high';
    };
    'cleanup-error': {
        operation: string;
        error: string;
    };
    'audit-complete': {
        credentialCount: number;
        issuesFound: number;
    };
    'rotation-required': {
        serviceId: string;
        reason: string;
    };
}
/**
 * Secure credential cleanup manager
 *
 * Provides comprehensive cleanup and maintenance services for credential
 * and session data in the GetWarped application.
 */
export declare class CredentialCleanup extends EventEmitter {
    private readonly _credentialStore;
    private readonly sessionPersistence;
    private readonly policy;
    private readonly auditLog;
    private cleanupTimer;
    private deepCleanupTimer;
    private isCleanupRunning;
    private lastCleanup;
    private lastDeepCleanup;
    constructor(credentialStore: CredentialStore, sessionPersistence: SessionPersistence, policy?: Partial<CleanupPolicy>);
    /**
     * Perform standard credential and session cleanup
     */
    performCleanup(): Promise<CleanupResult>;
    /**
     * Perform deep cleanup with comprehensive auditing
     */
    performDeepCleanup(): Promise<CleanupResult>;
    /**
     * Audit all credentials for security issues
     */
    auditAllCredentials(): Promise<{
        credentialAudits: CredentialAudit[];
        itemsProcessed: number;
        issuesFound: number;
    }>;
    /**
     * Clean up expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Clean up unused credentials
     */
    private cleanupUnusedCredentials;
    /**
     * Clean up orphaned credentials
     */
    private cleanupOrphanedCredentials;
    /**
     * Perform secure memory cleanup
     */
    private performSecureMemoryCleanup;
    /**
     * Standard cleanup without deep operations
     */
    private performStandardCleanupInternal;
    /**
     * Audit individual credential
     */
    private auditCredential;
    /**
     * Find orphaned credentials
     */
    private findOrphanedCredentials;
    /**
     * Check if credential is orphaned
     */
    private isCredentialOrphaned;
    /**
     * Check if service exists
     */
    private checkServiceExists;
    /**
     * Estimate credential size for cleanup reporting
     */
    private estimateCredentialSize;
    /**
     * Secure overwrite of credential data
     */
    private secureOverwrite;
    /**
     * Log audit event
     */
    private logAuditEvent;
    /**
     * Initialize cleanup scheduling
     */
    private initializeCleanupScheduling;
    /**
     * Get cleanup statistics
     */
    getCleanupStats(): {
        lastCleanup: Date | null;
        lastDeepCleanup: Date | null;
        isRunning: boolean;
        policy: CleanupPolicy;
    };
    /**
     * Shutdown cleanup service
     */
    private shutdown;
    emit<K extends keyof CredentialCleanupEvents>(event: K, ...args: [CredentialCleanupEvents[K]]): boolean;
    on<K extends keyof CredentialCleanupEvents>(event: K, listener: (arg: CredentialCleanupEvents[K]) => void): this;
    once<K extends keyof CredentialCleanupEvents>(event: K, listener: (arg: CredentialCleanupEvents[K]) => void): this;
    /**
     * Get credential store status (for future integration)
     */
    getCredentialStoreStatus(): {
        available: boolean;
    };
}
export type { CleanupPolicy, CleanupResult, CredentialAudit, CredentialCleanupEvents };
export default CredentialCleanup;
//# sourceMappingURL=CredentialCleanup.d.ts.map