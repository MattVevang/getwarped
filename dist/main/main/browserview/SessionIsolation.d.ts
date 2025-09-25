/**
 * SessionIsolation - Comprehensive session isolation enforcement
 *
 * Ensures complete isolation between different service sessions by:
 * - Creating unique session partitions for each service
 * - Enforcing strict data separation (cookies, localStorage, etc.)
 * - Implementing secure session cleanup and management
 * - Preventing cross-session data leakage
 * - Managing session permissions and security policies
 *
 * @fileoverview Session isolation enforcement for secure multi-service architecture
 */
import { Session } from 'electron';
import { EventEmitter } from 'events';
/**
 * Session configuration options
 */
export interface SessionConfiguration {
    /** Unique service identifier */
    serviceId: string;
    /** Service name for logging */
    serviceName: string;
    /** Custom user agent for the session */
    userAgent?: string;
    /** Whether to persist session data */
    persistent?: boolean;
    /** Custom session partition name */
    partitionName?: string;
    /** Session timeout in milliseconds */
    timeoutMs?: number;
    /** Whether to enable downloads */
    enableDownloads?: boolean;
    /** Whether to enable notifications */
    enableNotifications?: boolean;
    /** Allowed permissions */
    permissions?: string[];
    /** Content Security Policy */
    contentSecurityPolicy?: string;
    /** Custom headers to inject */
    customHeaders?: Record<string, string>;
}
/**
 * Session metadata for tracking
 */
export interface SessionMetadata {
    serviceId: string;
    serviceName: string;
    partitionName: string;
    createdAt: Date;
    lastAccessedAt: Date;
    isActive: boolean;
    dataCleared: boolean;
    storageSize: number;
    permissions: string[];
}
/**
 * Storage data types for cleanup
 */
export interface StorageDataTypes {
    appcache?: boolean;
    cookies?: boolean;
    filesystem?: boolean;
    indexdb?: boolean;
    localstorage?: boolean;
    shadercache?: boolean;
    websql?: boolean;
    serviceworkers?: boolean;
    cachestorage?: boolean;
}
/**
 * Session isolation events
 */
export interface SessionIsolationEvents {
    'session-created': (metadata: SessionMetadata) => void;
    'session-destroyed': (serviceId: string) => void;
    'session-data-cleared': (serviceId: string, dataTypes: StorageDataTypes) => void;
    'session-timeout': (serviceId: string) => void;
    'permission-granted': (serviceId: string, permission: string) => void;
    'permission-denied': (serviceId: string, permission: string) => void;
    'security-violation': (serviceId: string, violation: string) => void;
}
/**
 * Comprehensive session isolation manager
 */
export declare class SessionIsolation extends EventEmitter {
    private sessions;
    private sessionMetadata;
    private sessionTimeouts;
    private readonly DEFAULT_TIMEOUT;
    private readonly MAX_STORAGE_SIZE;
    constructor();
    /**
     * Create isolated session for a service
     */
    createIsolatedSession(config: SessionConfiguration): Promise<Session>;
    /**
     * Get session by service ID
     */
    getSession(serviceId: string): Session | undefined;
    /**
     * Get session metadata
     */
    getSessionMetadata(serviceId: string): SessionMetadata | undefined;
    /**
     * Get all active sessions
     */
    getAllSessions(): Map<string, Session>;
    /**
     * Update session access time
     */
    updateSessionAccess(serviceId: string): void;
    /**
     * Clear session data
     */
    clearSessionData(serviceId: string, options?: StorageDataTypes): Promise<boolean>;
    /**
     * Destroy session completely
     */
    destroySession(serviceId: string): Promise<boolean>;
    /**
     * Destroy all sessions
     */
    destroyAllSessions(): Promise<void>;
    /**
     * Check and enforce storage limits
     */
    enforceStorageLimits(): Promise<void>;
    /**
     * Setup global security policies
     */
    private setupGlobalSecurityPolicies;
    /**
     * Configure security for individual session
     */
    private configureSessionSecurity;
    /**
     * Setup session timeout
     */
    private setupSessionTimeout;
    /**
     * Clear session timeout
     */
    private clearSessionTimeout;
    /**
     * Get session storage usage (simplified implementation)
     */
    private getSessionStorageUsage;
    /**
     * Clean up session isolation manager
     */
    destroy(): void;
}
export default SessionIsolation;
//# sourceMappingURL=SessionIsolation.d.ts.map