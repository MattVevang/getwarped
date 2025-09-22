/**
 * Session Manager
 *
 * Manages user sessions, authentication state, and session-based security.
 * Integrates with keytar for secure credential storage and handles session
 * lifecycle, timeout, and cleanup operations.
 *
 * @fileoverview Session management with secure credential storage and lifecycle
 */

import * as keytar from 'keytar';
import { EventEmitter } from 'events';
import { InputValidator, Validators } from '../../shared/validation/InputValidator';

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
export enum SessionEvent {
  /** Session created */
  CREATED = 'session:created',
  /** Session updated */
  UPDATED = 'session:updated',
  /** Session deleted */
  DELETED = 'session:deleted',
  /** Session expired */
  EXPIRED = 'session:expired',
  /** Session activity */
  ACTIVITY = 'session:activity',
  /** Credential stored */
  CREDENTIAL_STORED = 'credential:stored',
  /** Credential retrieved */
  CREDENTIAL_RETRIEVED = 'credential:retrieved',
  /** Credential deleted */
  CREDENTIAL_DELETED = 'credential:deleted',
}

/**
 * Session Manager class for handling session lifecycle and credential storage
 */
export class SessionManager extends EventEmitter {
  private sessions: Map<string, SessionData> = new Map();
  private sessionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly defaultTimeoutMinutes = 60;
  private readonly serviceName = 'GetWarped';
  private cleanupInterval?: NodeJS.Timeout | undefined;

  constructor() {
    super();
    this.startCleanupTimer();
  }

  /**
   * Create a new session
   */
  async createSession(
    request: SessionCreateRequest
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      // Validate request
      const validation = this.validateSessionCreateRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Validation failed' };
      }

      // Generate session ID
      const sessionId = this.generateSessionId();
      const now = new Date();
      const timeoutMinutes = request.timeoutMinutes || this.defaultTimeoutMinutes;
      const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);

      // Create session data
      const sessionData: SessionData = {
        sessionId,
        userId: request.userId,
        serviceId: request.serviceId,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
        metadata: request.metadata || {},
      };

      // Store session
      this.sessions.set(sessionId, sessionData);

      // Set timeout
      this.setSessionTimeout(sessionId, timeoutMinutes);

      // Emit event
      this.emit(SessionEvent.CREATED, sessionData);

      return { success: true, sessionId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(
    request: SessionUpdateRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate request
      const validation = this.validateSessionUpdateRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Validation failed' };
      }

      // Get session
      const session = this.sessions.get(request.sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Check if session is expired
      if (session.expiresAt.getTime() < Date.now()) {
        return { success: false, error: 'Session expired' };
      }

      // Update session
      session.lastActivityAt = new Date();
      if (request.metadata) {
        session.metadata = { ...session.metadata, ...request.metadata };
      }

      // Extend timeout if requested
      if (request.extendTimeoutMinutes) {
        const newExpiresAt = new Date(Date.now() + request.extendTimeoutMinutes * 60 * 1000);
        session.expiresAt = newExpiresAt;
        this.setSessionTimeout(request.sessionId, request.extendTimeoutMinutes);
      }

      // Emit event
      this.emit(SessionEvent.UPDATED, session);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate session ID
      const validation = Validators.validateUUID(sessionId);
      if (!validation.valid) {
        return { success: false, error: 'Invalid session ID format' };
      }

      // Get session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // Clear timeout
      this.clearSessionTimeout(sessionId);

      // Remove session
      this.sessions.delete(sessionId);

      // Emit event
      this.emit(SessionEvent.DELETED, session);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      // Validate session ID
      const validation = Validators.validateUUID(sessionId);
      if (!validation.valid) {
        return { valid: false, error: 'Invalid session ID format' };
      }

      // Get session
      const session = this.sessions.get(sessionId);
      if (!session) {
        return { valid: false, error: 'Session not found' };
      }

      // Check if session is expired
      if (session.expiresAt.getTime() < Date.now()) {
        // Clean up expired session
        await this.deleteSession(sessionId);
        this.emit(SessionEvent.EXPIRED, session);
        return { valid: false, error: 'Session expired', expired: true };
      }

      // Update last activity
      session.lastActivityAt = new Date();
      this.emit(SessionEvent.ACTIVITY, session);

      return { valid: true, session };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<SessionData[]> {
    const activeSessions: SessionData[] = [];
    const now = Date.now();

    for (const session of this.sessions.values()) {
      if (session.expiresAt.getTime() > now) {
        activeSessions.push(session);
      }
    }

    return activeSessions;
  }

  /**
   * Get sessions for a specific service
   */
  async getSessionsForService(serviceId: string): Promise<SessionData[]> {
    const validation = Validators.validateUUID(serviceId);
    if (!validation.valid) {
      return [];
    }

    const serviceSessions: SessionData[] = [];
    const now = Date.now();

    for (const session of this.sessions.values()) {
      if (session.serviceId === serviceId && session.expiresAt.getTime() > now) {
        serviceSessions.push(session);
      }
    }

    return serviceSessions;
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions(): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionIds = Array.from(this.sessions.keys());

      for (const sessionId of sessionIds) {
        await this.deleteSession(sessionId);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Store credentials securely using keytar
   */
  async storeCredential(
    request: CredentialStoreRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate request
      const validation = this.validateCredentialStoreRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Validation failed' };
      }

      // Create keytar account
      const account = this.buildCredentialAccount(
        request.serviceId,
        request.userId,
        request.credentialKey
      );

      // Store credential
      await keytar.setPassword(this.serviceName, account, request.credentialValue);

      // Emit event
      this.emit(SessionEvent.CREDENTIAL_STORED, {
        serviceId: request.serviceId,
        userId: request.userId,
        credentialKey: request.credentialKey,
        credentialType: request.credentialType,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store credential',
      };
    }
  }

  /**
   * Retrieve credentials from keytar
   */
  async retrieveCredential(
    request: CredentialRetrieveRequest
  ): Promise<{ success: boolean; credential?: string; error?: string }> {
    try {
      // Validate request
      const validation = this.validateCredentialRetrieveRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Validation failed' };
      }

      // Create keytar account
      const account = this.buildCredentialAccount(
        request.serviceId,
        request.userId,
        request.credentialKey
      );

      // Retrieve credential
      const credential = await keytar.getPassword(this.serviceName, account);
      if (!credential) {
        return { success: false, error: 'Credential not found' };
      }

      // Emit event
      this.emit(SessionEvent.CREDENTIAL_RETRIEVED, {
        serviceId: request.serviceId,
        userId: request.userId,
        credentialKey: request.credentialKey,
      });

      return { success: true, credential };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve credential',
      };
    }
  }

  /**
   * Delete credentials from keytar
   */
  async deleteCredential(
    request: CredentialRetrieveRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate request
      const validation = this.validateCredentialRetrieveRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error || 'Validation failed' };
      }

      // Create keytar account
      const account = this.buildCredentialAccount(
        request.serviceId,
        request.userId,
        request.credentialKey
      );

      // Delete credential
      const deleted = await keytar.deletePassword(this.serviceName, account);
      if (!deleted) {
        return { success: false, error: 'Credential not found or could not be deleted' };
      }

      // Emit event
      this.emit(SessionEvent.CREDENTIAL_DELETED, {
        serviceId: request.serviceId,
        userId: request.userId,
        credentialKey: request.credentialKey,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete credential',
      };
    }
  }

  /**
   * List all stored credentials for a service
   */
  async listCredentials(
    serviceId: string,
    userId: string
  ): Promise<{ success: boolean; credentials?: string[]; error?: string }> {
    try {
      // Validate parameters
      const serviceValidation = Validators.validateUUID(serviceId);
      const userValidation = InputValidator.validateText(userId, { minLength: 1 });

      if (!serviceValidation.valid) {
        return { success: false, error: 'Invalid service ID format' };
      }

      if (!userValidation.valid) {
        return { success: false, error: 'Invalid user ID' };
      }

      // Get all credentials for this service
      const accounts = await keytar.findCredentials(this.serviceName);
      const prefix = `${serviceId}:${userId}:`;
      const credentials: string[] = [];

      for (const account of accounts) {
        if (account.account.startsWith(prefix)) {
          const credentialKey = account.account.substring(prefix.length);
          credentials.push(credentialKey);
        }
      }

      return { success: true, credentials };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list credentials',
      };
    }
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessionIds: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt.getTime() < now) {
        expiredSessionIds.push(sessionId);
      }
    }

    for (const sessionId of expiredSessionIds) {
      this.deleteSession(sessionId);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Set session timeout
   */
  private setSessionTimeout(sessionId: string, timeoutMinutes: number): void {
    // Clear existing timeout
    this.clearSessionTimeout(sessionId);

    // Set new timeout
    const timeout = setTimeout(
      async () => {
        const session = this.sessions.get(sessionId);
        if (session) {
          await this.deleteSession(sessionId);
          this.emit(SessionEvent.EXPIRED, session);
        }
      },
      timeoutMinutes * 60 * 1000
    );

    this.sessionTimeouts.set(sessionId, timeout);
  }

  /**
   * Clear session timeout
   */
  private clearSessionTimeout(sessionId: string): void {
    const timeout = this.sessionTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.sessionTimeouts.delete(sessionId);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Build credential account string for keytar
   */
  private buildCredentialAccount(serviceId: string, userId: string, credentialKey: string): string {
    return `${serviceId}:${userId}:${credentialKey}`;
  }

  /**
   * Validate session create request
   */
  private validateSessionCreateRequest(request: SessionCreateRequest): {
    valid: boolean;
    error?: string;
  } {
    const userValidation = InputValidator.validateText(request.userId, { minLength: 1 });
    if (!userValidation.valid) {
      return { valid: false, error: 'Invalid user ID' };
    }

    const serviceValidation = Validators.validateUUID(request.serviceId);
    if (!serviceValidation.valid) {
      return { valid: false, error: 'Invalid service ID format' };
    }

    if (request.timeoutMinutes !== undefined) {
      if (
        typeof request.timeoutMinutes !== 'number' ||
        request.timeoutMinutes < 1 ||
        request.timeoutMinutes > 1440
      ) {
        return { valid: false, error: 'Timeout must be between 1 and 1440 minutes' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate session update request
   */
  private validateSessionUpdateRequest(request: SessionUpdateRequest): {
    valid: boolean;
    error?: string;
  } {
    const sessionValidation = Validators.validateUUID(request.sessionId);
    if (!sessionValidation.valid) {
      return { valid: false, error: 'Invalid session ID format' };
    }

    if (request.extendTimeoutMinutes !== undefined) {
      if (
        typeof request.extendTimeoutMinutes !== 'number' ||
        request.extendTimeoutMinutes < 1 ||
        request.extendTimeoutMinutes > 1440
      ) {
        return { valid: false, error: 'Timeout extension must be between 1 and 1440 minutes' };
      }
    }

    return { valid: true };
  }

  /**
   * Validate credential store request
   */
  private validateCredentialStoreRequest(request: CredentialStoreRequest): {
    valid: boolean;
    error?: string;
  } {
    const serviceValidation = Validators.validateUUID(request.serviceId);
    if (!serviceValidation.valid) {
      return { valid: false, error: 'Invalid service ID format' };
    }

    const userValidation = InputValidator.validateText(request.userId, { minLength: 1 });
    if (!userValidation.valid) {
      return { valid: false, error: 'Invalid user ID' };
    }

    const keyValidation = InputValidator.validateText(request.credentialKey, { minLength: 1 });
    if (!keyValidation.valid) {
      return { valid: false, error: 'Invalid credential key' };
    }

    const valueValidation = InputValidator.validateText(request.credentialValue, { minLength: 1 });
    if (!valueValidation.valid) {
      return { valid: false, error: 'Invalid credential value' };
    }

    const validTypes = ['password', 'token', 'api-key', 'certificate'];
    if (!validTypes.includes(request.credentialType)) {
      return { valid: false, error: 'Invalid credential type' };
    }

    return { valid: true };
  }

  /**
   * Validate credential retrieve request
   */
  private validateCredentialRetrieveRequest(request: CredentialRetrieveRequest): {
    valid: boolean;
    error?: string;
  } {
    const serviceValidation = Validators.validateUUID(request.serviceId);
    if (!serviceValidation.valid) {
      return { valid: false, error: 'Invalid service ID format' };
    }

    const userValidation = InputValidator.validateText(request.userId, { minLength: 1 });
    if (!userValidation.valid) {
      return { valid: false, error: 'Invalid user ID' };
    }

    const keyValidation = InputValidator.validateText(request.credentialKey, { minLength: 1 });
    if (!keyValidation.valid) {
      return { valid: false, error: 'Invalid credential key' };
    }

    return { valid: true };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();

    // Clear all timeouts
    for (const timeout of this.sessionTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.sessionTimeouts.clear();

    // Clear sessions
    this.sessions.clear();

    // Remove all listeners
    this.removeAllListeners();
  }
}

export default SessionManager;
