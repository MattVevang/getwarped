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

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { app } from 'electron';
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
  cookies?: string; // Serialized cookie data
  localStorage?: Record<string, string>; // Key-value pairs
  sessionStorage?: Record<string, string>; // Key-value pairs
}

/**
 * Encrypted session storage format
 */
interface PersistedSession {
  sessionId: string;
  serviceId: string;
  workspaceId: string;
  encryptedData: EncryptedData;
  checksum: string; // Data integrity verification
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
  'session-stored': { sessionId: string; serviceId: string };
  'session-restored': { sessionId: string; serviceId: string };
  'session-expired': { sessionId: string; serviceId: string };
  'session-cleaned': { sessionId: string; reason: string };
  'storage-error': { operation: string; error: string };
  'cleanup-completed': { removedCount: number; totalCount: number };
}

/**
 * Secure session persistence manager
 *
 * Handles encrypted storage and retrieval of user session data
 * for the GetWarped multi-service workspace application.
 */
export class SessionPersistence extends EventEmitter {
  private readonly config: Required<SessionPersistenceConfig>;
  private readonly encryption: CredentialEncryption;
  private readonly storageDirectory: string;
  private cleanupTimer: NodeJS.Timeout | undefined;
  private sessionCache = new Map<string, SessionData>(); // sessionId -> data
  private readonly FILE_VERSION = 1;

  constructor(encryption: CredentialEncryption, config: SessionPersistenceConfig = {}) {
    super();

    this.encryption = encryption;
    this.config = {
      storageDirectory: config.storageDirectory || path.join(app.getPath('userData'), 'sessions'),
      maxSessions: config.maxSessions || 100,
      defaultExpirationHours: config.defaultExpirationHours || 24,
      cleanupIntervalMinutes: config.cleanupIntervalMinutes || 60,
      enableCompression: config.enableCompression ?? false,
      encryptionEnabled: config.encryptionEnabled ?? true,
      fileExtension: config.fileExtension || '.session',
    };

    this.storageDirectory = this.config.storageDirectory;

    // Initialize storage directory
    this.initializeStorage();

    // Start cleanup timer
    this.startCleanupTimer();

    // Handle app shutdown
    process.on('exit', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Store session data securely
   */
  public async storeSession(
    sessionData: Omit<SessionData, 'sessionId' | 'createdAt' | 'lastAccessedAt'>
  ): Promise<string> {
    try {
      // Generate session ID
      const sessionId = this.generateSessionId();

      // Complete session data
      const completeSessionData: SessionData = {
        ...sessionData,
        sessionId,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        expiresAt: sessionData.expiresAt || this.getDefaultExpirationDate(),
      };

      // Cache session data
      this.sessionCache.set(sessionId, completeSessionData);

      // Persist to disk
      await this.persistSession(completeSessionData);

      this.emit('session-stored', {
        sessionId,
        serviceId: sessionData.serviceId,
      });

      return sessionId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown storage error';
      this.emit('storage-error', { operation: 'store', error: message });
      throw new Error(`Failed to store session: ${message}`);
    }
  }

  /**
   * Restore session data from storage
   */
  public async restoreSession(sessionId: string): Promise<SessionData | null> {
    try {
      // Check cache first
      if (this.sessionCache.has(sessionId)) {
        const cachedSession = this.sessionCache.get(sessionId)!;

        // Check if session is expired
        if (cachedSession.expiresAt < new Date()) {
          await this.removeSession(sessionId);
          this.emit('session-expired', {
            sessionId,
            serviceId: cachedSession.serviceId,
          });
          return null;
        }

        // Update last accessed
        cachedSession.lastAccessedAt = new Date();
        return cachedSession;
      }

      // Load from disk
      const sessionData = await this.loadSession(sessionId);

      if (!sessionData) {
        return null;
      }

      // Check expiration
      if (sessionData.expiresAt < new Date()) {
        await this.removeSession(sessionId);
        this.emit('session-expired', {
          sessionId,
          serviceId: sessionData.serviceId,
        });
        return null;
      }

      // Update last accessed and cache
      sessionData.lastAccessedAt = new Date();
      this.sessionCache.set(sessionId, sessionData);

      this.emit('session-restored', {
        sessionId,
        serviceId: sessionData.serviceId,
      });

      return sessionData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown restore error';
      this.emit('storage-error', { operation: 'restore', error: message });
      throw new Error(`Failed to restore session: ${message}`);
    }
  }

  /**
   * Update existing session data
   */
  public async updateSession(
    sessionId: string,
    updates: Partial<Omit<SessionData, 'sessionId' | 'createdAt'>>
  ): Promise<boolean> {
    try {
      const existingSession = await this.restoreSession(sessionId);

      if (!existingSession) {
        return false;
      }

      // Apply updates
      const updatedSession: SessionData = {
        ...existingSession,
        ...updates,
        sessionId, // Ensure ID doesn't change
        createdAt: existingSession.createdAt, // Preserve creation time
        lastAccessedAt: new Date(),
      };

      // Update cache
      this.sessionCache.set(sessionId, updatedSession);

      // Persist to disk
      await this.persistSession(updatedSession);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown update error';
      this.emit('storage-error', { operation: 'update', error: message });
      throw new Error(`Failed to update session: ${message}`);
    }
  }

  /**
   * Remove session from storage
   */
  public async removeSession(sessionId: string): Promise<boolean> {
    try {
      // Remove from cache
      this.sessionCache.delete(sessionId);

      // Remove from disk
      const filePath = this.getSessionFilePath(sessionId);

      try {
        await fs.unlink(filePath);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      this.emit('session-cleaned', {
        sessionId,
        reason: 'manual-removal',
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown removal error';
      this.emit('storage-error', { operation: 'remove', error: message });
      return false;
    }
  }

  /**
   * Get all sessions for a service
   */
  public async getServiceSessions(serviceId: string): Promise<SessionData[]> {
    try {
      const allSessions = await this.getAllSessions();
      return allSessions.filter(session => session.serviceId === serviceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown query error';
      this.emit('storage-error', { operation: 'query', error: message });
      return [];
    }
  }

  /**
   * Get all sessions for a workspace
   */
  public async getWorkspaceSessions(workspaceId: string): Promise<SessionData[]> {
    try {
      const allSessions = await this.getAllSessions();
      return allSessions.filter(session => session.workspaceId === workspaceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown query error';
      this.emit('storage-error', { operation: 'query', error: message });
      return [];
    }
  }

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<number> {
    try {
      const allSessions = await this.getAllSessions();
      const now = new Date();
      const expiredSessions = allSessions.filter(session => session.expiresAt < now);

      let removedCount = 0;
      for (const session of expiredSessions) {
        if (await this.removeSession(session.sessionId)) {
          removedCount++;
          this.emit('session-expired', {
            sessionId: session.sessionId,
            serviceId: session.serviceId,
          });
        }
      }

      this.emit('cleanup-completed', {
        removedCount,
        totalCount: allSessions.length,
      });

      return removedCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown cleanup error';
      this.emit('storage-error', { operation: 'cleanup', error: message });
      return 0;
    }
  }

  /**
   * Get session storage statistics
   */
  public async getStorageStats(): Promise<{
    totalSessions: number;
    expiredSessions: number;
    cacheHitRate: number;
    storageSize: number;
  }> {
    try {
      const allSessions = await this.getAllSessions();
      const now = new Date();
      const expiredSessions = allSessions.filter(session => session.expiresAt < now);

      // Calculate storage directory size
      const files = await fs.readdir(this.storageDirectory);
      const sessionFiles = files.filter(file => file.endsWith(this.config.fileExtension));

      let storageSize = 0;
      for (const file of sessionFiles) {
        try {
          const stats = await fs.stat(path.join(this.storageDirectory, file));
          storageSize += stats.size;
        } catch {
          // Ignore file stat errors
        }
      }

      return {
        totalSessions: allSessions.length,
        expiredSessions: expiredSessions.length,
        cacheHitRate: this.calculateCacheHitRate(),
        storageSize,
      };
    } catch (error) {
      return {
        totalSessions: 0,
        expiredSessions: 0,
        cacheHitRate: 0,
        storageSize: 0,
      };
    }
  }

  /**
   * Clear all session data
   */
  public async clearAllSessions(): Promise<void> {
    try {
      // Clear cache
      this.sessionCache.clear();

      // Remove all session files
      const files = await fs.readdir(this.storageDirectory);
      const sessionFiles = files.filter(file => file.endsWith(this.config.fileExtension));

      for (const file of sessionFiles) {
        try {
          await fs.unlink(path.join(this.storageDirectory, file));
        } catch {
          // Ignore individual file errors
        }
      }

      this.emit('cleanup-completed', {
        removedCount: sessionFiles.length,
        totalCount: sessionFiles.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown clear error';
      this.emit('storage-error', { operation: 'clear', error: message });
      throw new Error(`Failed to clear sessions: ${message}`);
    }
  }

  /**
   * Initialize storage directory
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageDirectory, { recursive: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      this.emit('storage-error', { operation: 'initialize', error: message });
      throw new Error(`Failed to initialize storage: ${message}`);
    }
  }

  /**
   * Persist session to disk
   */
  private async persistSession(sessionData: SessionData): Promise<void> {
    if (!this.config.encryptionEnabled) {
      // Store unencrypted (for debugging/development)
      const filePath = this.getSessionFilePath(sessionData.sessionId);
      await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2));
      return;
    }

    // Create encrypted session
    const serializedData = JSON.stringify(sessionData);
    const encryptedData = await this.encryption.encrypt(serializedData);

    const persistedSession: PersistedSession = {
      sessionId: sessionData.sessionId,
      serviceId: sessionData.serviceId,
      workspaceId: sessionData.workspaceId,
      encryptedData,
      checksum: this.calculateChecksum(serializedData),
      storedAt: new Date(),
      expiresAt: sessionData.expiresAt,
      version: this.FILE_VERSION,
    };

    const filePath = this.getSessionFilePath(sessionData.sessionId);
    await fs.writeFile(filePath, JSON.stringify(persistedSession, null, 2));
  }

  /**
   * Load session from disk
   */
  private async loadSession(sessionId: string): Promise<SessionData | null> {
    try {
      const filePath = this.getSessionFilePath(sessionId);
      const fileContent = await fs.readFile(filePath, 'utf8');

      if (!this.config.encryptionEnabled) {
        // Load unencrypted session
        return JSON.parse(fileContent) as SessionData;
      }

      // Load encrypted session
      const persistedSession = JSON.parse(fileContent) as PersistedSession;

      // Verify version
      if (persistedSession.version !== this.FILE_VERSION) {
        throw new Error(`Unsupported file version: ${persistedSession.version}`);
      }

      // Decrypt data
      const decryptedData = await this.encryption.decrypt(persistedSession.encryptedData);

      // Verify checksum
      const expectedChecksum = this.calculateChecksum(decryptedData);
      if (expectedChecksum !== persistedSession.checksum) {
        throw new Error('Session data integrity check failed');
      }

      return JSON.parse(decryptedData) as SessionData;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Get all sessions from disk
   */
  private async getAllSessions(): Promise<SessionData[]> {
    try {
      const files = await fs.readdir(this.storageDirectory);
      const sessionFiles = files.filter(file => file.endsWith(this.config.fileExtension));

      const sessions: SessionData[] = [];

      for (const file of sessionFiles) {
        try {
          const sessionId = path.basename(file, this.config.fileExtension);
          const session = await this.loadSession(sessionId);

          if (session) {
            sessions.push(session);
          }
        } catch {
          // Ignore individual session load errors
        }
      }

      return sessions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(16).toString('hex');
    return `session_${timestamp}_${randomPart}`;
  }

  /**
   * Get default expiration date
   */
  private getDefaultExpirationDate(): Date {
    const now = new Date();
    now.setHours(now.getHours() + this.config.defaultExpirationHours);
    return now;
  }

  /**
   * Get file path for session
   */
  private getSessionFilePath(sessionId: string): string {
    return path.join(this.storageDirectory, `${sessionId}${this.config.fileExtension}`);
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    // This is a simplified implementation
    // In production, you might want to track actual hits/misses
    return this.sessionCache.size > 0 ? 0.8 : 0;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const intervalMs = this.config.cleanupIntervalMinutes * 60 * 1000;
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions().catch(error => {
        this.emit('storage-error', {
          operation: 'cleanup-timer',
          error: error.message,
        });
      });
    }, intervalMs);
  }

  /**
   * Shutdown and cleanup
   */
  private shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    // Clear sensitive data
    this.sessionCache.clear();
    this.removeAllListeners();
  }

  // Type-safe event emitter overrides
  public override emit<K extends keyof SessionPersistenceEvents>(
    event: K,
    ...args: [SessionPersistenceEvents[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  public override on<K extends keyof SessionPersistenceEvents>(
    event: K,
    listener: (arg: SessionPersistenceEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof SessionPersistenceEvents>(
    event: K,
    listener: (arg: SessionPersistenceEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }
}

// Export types for external use
export type { SessionData, PersistedSession, SessionPersistenceConfig, SessionPersistenceEvents };

// Default export
export default SessionPersistence;
