/**
 * SessionPersistence.ts
 *
 * Manages secure session data persistence for GetWarped application.
 * Provides encrypted storage and retrieval of user session information
 * while maintaining security boundaries between services.
 *
 * Features:
 * - Encrypted session data storage
 * - Cross-platform persistent storage
 * - Session cleanup and garbage collection
 * - Session restoration on app restart
 * - Service-specific session isolation
 * - Automatic session expiration
 * - Session metadata tracking
 *
 * Security Properties:
 * - Session data encrypted at rest
 * - Isolated storage per service
 * - Automatic cleanup of expired sessions
 * - Secure session token generation
 * - Memory-safe operations
 */
import { EventEmitter } from 'node:events';
import { CredentialEncryption, type EncryptedData } from './CredentialEncryption';
/**
 * Session data structure for persistence
 */
interface SessionData {
    sessionId: string;
    serviceId: string;
    workspaceId: string;
    userId?: string;
    sessionToken: string;
    createdAt: Date;
    lastAccessedAt: Date;
    expiresAt: Date;
    metadata: Record<string, any>;
    preferences: Record<string, any>;
    cookies?: string;
    localStorage?: Record<string, string>;
    sessionStorage?: Record<string, string>;
}
/**
 * Encrypted session storage format
 */
interface PersistedSession {
    sessionId: string;
    serviceId: string;
    workspaceId: string;
    encryptedData: EncryptedData;
    checksum: string;
    storedAt: Date;
    expiresAt: Date;
    version: number;
}
/**
 * Session persistence configuration
 */
interface SessionPersistenceConfig {
    storageDirectory?: string;
    maxSessions?: number;
    defaultExpirationHours?: number;
    cleanupIntervalMinutes?: number;
    enableCompression?: boolean;
    encryptionEnabled?: boolean;
    fileExtension?: string;
}
/**
 * Events emitted by SessionPersistence
 */
interface SessionPersistenceEvents {
    'session-stored': {
        sessionId: string;
        serviceId: string;
    };
    'session-restored': {
        sessionId: string;
        serviceId: string;
    };
    'session-expired': {
        sessionId: string;
        serviceId: string;
    };
    'session-cleaned': {
        sessionId: string;
        reason: string;
    };
    'storage-error': {
        operation: string;
        error: string;
    };
    'cleanup-completed': {
        removedCount: number;
        totalCount: number;
    };
}
/**
 * Secure session persistence manager
 *
 * Handles encrypted storage and retrieval of user session data
 * for the GetWarped multi-service workspace application.
 */
export declare class SessionPersistence extends EventEmitter {
    private readonly config;
    private readonly encryption;
    private readonly storageDirectory;
    private cleanupTimer;
    private sessionCache;
    private readonly FILE_VERSION;
    constructor(encryption: CredentialEncryption, config?: SessionPersistenceConfig);
    /**
     * Store session data securely
     */
    storeSession(sessionData: Omit<SessionData, 'sessionId' | 'createdAt' | 'lastAccessedAt'>): Promise<string>;
    /**
     * Restore session data from storage
     */
    restoreSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Update existing session data
     */
    updateSession(sessionId: string, updates: Partial<Omit<SessionData, 'sessionId' | 'createdAt'>>): Promise<boolean>;
    /**
     * Remove session from storage
     */
    removeSession(sessionId: string): Promise<boolean>;
    /**
     * Get all sessions for a service
     */
    getServiceSessions(serviceId: string): Promise<SessionData[]>;
    /**
     * Get all sessions for a workspace
     */
    getWorkspaceSessions(workspaceId: string): Promise<SessionData[]>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Get session storage statistics
     */
    getStorageStats(): Promise<{
        totalSessions: number;
        expiredSessions: number;
        cacheHitRate: number;
        storageSize: number;
    }>;
    /**
     * Clear all session data
     */
    clearAllSessions(): Promise<void>;
    /**
     * Initialize storage directory
     */
    private initializeStorage;
    /**
     * Persist session to disk
     */
    private persistSession;
    /**
     * Load session from disk
     */
    private loadSession;
    /**
     * Get all sessions from disk
     */
    private getAllSessions;
    /**
     * Generate secure session ID
     */
    private generateSessionId;
    /**
     * Get default expiration date
     */
    private getDefaultExpirationDate;
    /**
     * Get file path for session
     */
    private getSessionFilePath;
    /**
     * Calculate checksum for data integrity
     */
    private calculateChecksum;
    /**
     * Calculate cache hit rate
     */
    private calculateCacheHitRate;
    /**
     * Start cleanup timer
     */
    private startCleanupTimer;
    /**
     * Shutdown and cleanup
     */
    private shutdown;
    emit<K extends keyof SessionPersistenceEvents>(event: K, ...args: [SessionPersistenceEvents[K]]): boolean;
    on<K extends keyof SessionPersistenceEvents>(event: K, listener: (arg: SessionPersistenceEvents[K]) => void): this;
    once<K extends keyof SessionPersistenceEvents>(event: K, listener: (arg: SessionPersistenceEvents[K]) => void): this;
}
export type { SessionData, PersistedSession, SessionPersistenceConfig, SessionPersistenceEvents };
export default SessionPersistence;
//# sourceMappingURL=SessionPersistence.d.ts.map