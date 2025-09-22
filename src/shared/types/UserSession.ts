/**
 * UserSession: Encrypted session data management for service authentication
 *
 * Represents session-specific data for each service stored securely in OS credentials.
 * This data is NEVER exported or stored in application configuration files.
 * All session data is encrypted before storage in the OS credential manager.
 *
 * @fileoverview UserSession interface and session management utilities
 */

/**
 * Encrypted session data container
 * Contains serialized and encrypted browser session information
 */
export interface SessionData {
  /** Serialized cookies (encrypted) - contains authentication tokens */
  cookies?: string;

  /** Local storage data (encrypted) - persistent client-side storage */
  localStorage?: string;

  /** Session storage data (encrypted) - temporary client-side storage */
  sessionStorage?: string;

  /** Additional encrypted metadata for session restoration */
  metadata?: string;
}

/**
 * User session configuration for individual services
 *
 * Contains encrypted session information for service authentication and state.
 * This data is stored in OS-native credential storage (Windows Credential Manager,
 * macOS Keychain, Linux Secret Service) and is never included in configuration exports.
 *
 * Security Notes:
 * - All sessionData fields are encrypted before storage
 * - Session data is completely isolated between services
 * - No session information is stored in application files
 * - Sessions expire and require re-authentication periodically
 *
 * @example
 * ```typescript
 * const gmailSession: UserSession = {
 *   serviceId: 'gmail-service-uuid',
 *   lastAccessedAt: new Date(),
 *   sessionData: {
 *     cookies: 'encrypted-cookie-data...',
 *     localStorage: 'encrypted-localstorage-data...'
 *   },
 *   isActive: true
 * };
 * ```
 */
export interface UserSession {
  /** Reference to ServiceConfiguration ID */
  serviceId: string;

  /** Last access timestamp for session cleanup and monitoring */
  lastAccessedAt: Date;

  /** Encrypted session information */
  sessionData: SessionData;

  /** Current session status - false if session expired or cleared */
  isActive: boolean;

  /** Session creation timestamp for expiration policies */
  createdAt?: Date;

  /** Optional session expiration timestamp */
  expiresAt?: Date;

  /** Session version for migration compatibility */
  version?: string;
}

/**
 * Session encryption metadata
 * Stored alongside session data to handle decryption and validation
 */
export interface SessionMetadata {
  /** Encryption algorithm used (e.g., 'aes-256-gcm') */
  algorithm: string;

  /** Initialization vector for encryption */
  iv: string;

  /** Authentication tag for encrypted data integrity */
  authTag: string;

  /** Key derivation salt for password-based encryption */
  salt: string;

  /** Timestamp when session was encrypted */
  encryptedAt: Date;
}

/**
 * Session storage configuration
 * Defines how sessions are stored and retrieved from OS credential storage
 */
export interface SessionStorageConfig {
  /** Base keychain service name for credential storage */
  serviceName: string;

  /** Key prefix for session identification */
  keyPrefix: string;

  /** Session timeout in milliseconds (default: 30 days) */
  sessionTimeout: number;

  /** Maximum number of stored sessions per service */
  maxSessionsPerService: number;

  /** Enable automatic session cleanup */
  enableAutoCleanup: boolean;
}

/**
 * Type guard to check if an object is a valid UserSession
 * Useful for runtime type checking during session deserialization
 *
 * @param obj - Object to validate
 * @returns True if object matches UserSession interface
 */
export function isUserSession(obj: unknown): obj is UserSession {
  if (!obj || typeof obj !== 'object') return false;

  const session = obj as Partial<UserSession>;

  return (
    typeof session.serviceId === 'string' &&
    session.lastAccessedAt instanceof Date &&
    isSessionData(session.sessionData) &&
    typeof session.isActive === 'boolean'
  );
}

/**
 * Type guard to check if an object is valid SessionData
 *
 * @param obj - Object to validate
 * @returns True if object matches SessionData interface
 */
export function isSessionData(obj: unknown): obj is SessionData {
  if (!obj || typeof obj !== 'object') return false;

  const data = obj as Partial<SessionData>;

  return (
    (data.cookies === undefined || typeof data.cookies === 'string') &&
    (data.localStorage === undefined || typeof data.localStorage === 'string') &&
    (data.sessionStorage === undefined || typeof data.sessionStorage === 'string') &&
    (data.metadata === undefined || typeof data.metadata === 'string')
  );
}

/**
 * Creates a new UserSession with default values
 *
 * @param serviceId - Service identifier
 * @param sessionData - Initial session data
 * @returns New UserSession instance
 */
export function createUserSession(
  serviceId: string,
  sessionData?: Partial<SessionData>
): UserSession {
  const now = new Date();

  return {
    serviceId,
    lastAccessedAt: now,
    sessionData: sessionData || {},
    isActive: true,
    createdAt: now,
    version: '1.0.0',
  };
}

/**
 * Updates session access timestamp
 * Should be called whenever a session is used
 *
 * @param session - Session to update
 * @returns Updated session with new access time
 */
export function updateSessionAccess(session: UserSession): UserSession {
  return {
    ...session,
    lastAccessedAt: new Date(),
  };
}

/**
 * Checks if a session has expired based on timeout configuration
 *
 * @param session - Session to check
 * @param timeoutMs - Timeout in milliseconds (default: 30 days)
 * @returns True if session has expired
 */
export function isSessionExpired(
  session: UserSession,
  timeoutMs: number = 30 * 24 * 60 * 60 * 1000
): boolean {
  if (session.expiresAt) {
    return new Date() > session.expiresAt;
  }

  const timeoutDate = new Date(session.lastAccessedAt.getTime() + timeoutMs);
  return new Date() > timeoutDate;
}

/**
 * Deactivates a session (marks as inactive)
 * Used for logout, session expiration, or manual clearing
 *
 * @param session - Session to deactivate
 * @returns Deactivated session
 */
export function deactivateSession(session: UserSession): UserSession {
  return {
    ...session,
    isActive: false,
    sessionData: {}, // Clear encrypted session data
  };
}

/**
 * Default session storage configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionStorageConfig = {
  serviceName: 'GetWarped-Sessions',
  keyPrefix: 'service-session-',
  sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxSessionsPerService: 5,
  enableAutoCleanup: true,
};

/**
 * Session security levels for different authentication requirements
 */
export enum SessionSecurityLevel {
  /** Basic authentication (username/password) */
  BASIC = 'basic',

  /** OAuth-based authentication */
  OAUTH = 'oauth',

  /** Two-factor authentication required */
  TWO_FACTOR = '2fa',

  /** Certificate-based authentication */
  CERTIFICATE = 'certificate',

  /** Single Sign-On authentication */
  SSO = 'sso',
}

/**
 * Session events for monitoring and logging
 */
export enum SessionEvent {
  CREATED = 'session_created',
  ACCESSED = 'session_accessed',
  UPDATED = 'session_updated',
  EXPIRED = 'session_expired',
  CLEARED = 'session_cleared',
  ERROR = 'session_error',
}

/**
 * Utility function to generate session storage key
 * Creates a consistent key format for OS credential storage
 *
 * @param serviceId - Service identifier
 * @param keyPrefix - Key prefix from configuration
 * @returns Formatted storage key
 */
export function generateSessionKey(
  serviceId: string,
  keyPrefix: string = 'service-session-'
): string {
  return `${keyPrefix}${serviceId}`;
}
