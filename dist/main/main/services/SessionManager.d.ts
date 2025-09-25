/**
 * Session Manager
 *
 * Manages user sessions, authentication state, and session-based security.
 * Integrates with keytar for secure credential storage and handles session
 * lifecycle, timeout, and cleanup operations.
 *
 * @fileoverview Session management with secure credential storage and lifecycle
 */
import { EventEmitter } from 'events';
/**
 * Session data interface
 */
export interface SessionData {
    /** Session identifier */
    sessionId: string;
    /** User identifier */
    userId: string;
    /** Service identifier */
    serviceId: string;
    /** Session creation timestamp */
    createdAt: Date;
    /** Session last activity timestamp */
    lastActivityAt: Date;
    /** Session expiration timestamp */
    expiresAt: Date;
    /** Additional session metadata */
    metadata?: Record<string, any>;
}
/**
 * Authentication token interface
 */
export interface AuthToken {
    /** Token value */
    token: string;
    /** Token type (Bearer, Basic, etc.) */
    type: string;
    /** Token expiration */
    expiresAt?: Date;
    /** Token scope */
    scope?: string[];
}
/**
 * Session creation request
 */
export interface SessionCreateRequest {
    /** User identifier */
    userId: string;
    /** Service identifier */
    serviceId: string;
    /** Session timeout in minutes */
    timeoutMinutes?: number;
    /** Additional session metadata */
    metadata?: Record<string, any>;
}
/**
 * Session update request
 */
export interface SessionUpdateRequest {
    /** Session identifier */
    sessionId: string;
    /** Updated metadata */
    metadata?: Record<string, any>;
    /** Extend session timeout */
    extendTimeoutMinutes?: number;
}
/**
 * Credential storage request
 */
export interface CredentialStoreRequest {
    /** Service identifier */
    serviceId: string;
    /** User identifier */
    userId: string;
    /** Credential key/name */
    credentialKey: string;
    /** Credential value */
    credentialValue: string;
    /** Credential type */
    credentialType: 'password' | 'token' | 'api-key' | 'certificate';
}
/**
 * Credential retrieval request
 */
export interface CredentialRetrieveRequest {
    /** Service identifier */
    serviceId: string;
    /** User identifier */
    userId: string;
    /** Credential key/name */
    credentialKey: string;
}
/**
 * Session validation result
 */
export interface SessionValidationResult {
    /** Whether session is valid */
    valid: boolean;
    /** Validation error message */
    error?: string;
    /** Session data if valid */
    session?: SessionData;
    /** Whether session was expired */
    expired?: boolean;
}
/**
 * Session events
 */
export declare enum SessionEvent {
    /** Session created */
    CREATED = "session:created",
    /** Session updated */
    UPDATED = "session:updated",
    /** Session deleted */
    DELETED = "session:deleted",
    /** Session expired */
    EXPIRED = "session:expired",
    /** Session activity */
    ACTIVITY = "session:activity",
    /** Credential stored */
    CREDENTIAL_STORED = "credential:stored",
    /** Credential retrieved */
    CREDENTIAL_RETRIEVED = "credential:retrieved",
    /** Credential deleted */
    CREDENTIAL_DELETED = "credential:deleted"
}
/**
 * Session Manager class for handling session lifecycle and credential storage
 */
export declare class SessionManager extends EventEmitter {
    private sessions;
    private sessionTimeouts;
    private readonly defaultTimeoutMinutes;
    private readonly serviceName;
    private cleanupInterval?;
    constructor();
    /**
     * Create a new session
     */
    createSession(request: SessionCreateRequest): Promise<{
        success: boolean;
        sessionId?: string;
        error?: string;
    }>;
    /**
     * Update an existing session
     */
    updateSession(request: SessionUpdateRequest): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<SessionValidationResult>;
    /**
     * Get all active sessions
     */
    getActiveSessions(): Promise<SessionData[]>;
    /**
     * Get sessions for a specific service
     */
    getSessionsForService(serviceId: string): Promise<SessionData[]>;
    /**
     * Clear all sessions
     */
    clearAllSessions(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Store credentials securely using keytar
     */
    storeCredential(request: CredentialStoreRequest): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Retrieve credentials from keytar
     */
    retrieveCredential(request: CredentialRetrieveRequest): Promise<{
        success: boolean;
        credential?: string;
        error?: string;
    }>;
    /**
     * Delete credentials from keytar
     */
    deleteCredential(request: CredentialRetrieveRequest): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * List all stored credentials for a service
     */
    listCredentials(serviceId: string, userId: string): Promise<{
        success: boolean;
        credentials?: string[];
        error?: string;
    }>;
    /**
     * Cleanup expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Start cleanup timer
     */
    private startCleanupTimer;
    /**
     * Stop cleanup timer
     */
    private stopCleanupTimer;
    /**
     * Set session timeout
     */
    private setSessionTimeout;
    /**
     * Clear session timeout
     */
    private clearSessionTimeout;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Build credential account string for keytar
     */
    private buildCredentialAccount;
    /**
     * Validate session create request
     */
    private validateSessionCreateRequest;
    /**
     * Validate session update request
     */
    private validateSessionUpdateRequest;
    /**
     * Validate credential store request
     */
    private validateCredentialStoreRequest;
    /**
     * Validate credential retrieve request
     */
    private validateCredentialRetrieveRequest;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export default SessionManager;
//# sourceMappingURL=SessionManager.d.ts.map