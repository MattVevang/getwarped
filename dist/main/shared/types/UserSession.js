"use strict";
/**
 * UserSession: Encrypted session data management for service authentication
 *
 * Represents session-specific data for each service stored securely in OS credentials.
 * This data is NEVER exported or stored in application configuration files.
 * All session data is encrypted before storage in the OS credential manager.
 *
 * @fileoverview UserSession interface and session management utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionEvent = exports.SessionSecurityLevel = exports.DEFAULT_SESSION_CONFIG = void 0;
exports.isUserSession = isUserSession;
exports.isSessionData = isSessionData;
exports.createUserSession = createUserSession;
exports.updateSessionAccess = updateSessionAccess;
exports.isSessionExpired = isSessionExpired;
exports.deactivateSession = deactivateSession;
exports.generateSessionKey = generateSessionKey;
/**
 * Type guard to check if an object is a valid UserSession
 * Useful for runtime type checking during session deserialization
 *
 * @param obj - Object to validate
 * @returns True if object matches UserSession interface
 */
function isUserSession(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const session = obj;
    return (typeof session.serviceId === 'string' &&
        session.lastAccessedAt instanceof Date &&
        isSessionData(session.sessionData) &&
        typeof session.isActive === 'boolean');
}
/**
 * Type guard to check if an object is valid SessionData
 *
 * @param obj - Object to validate
 * @returns True if object matches SessionData interface
 */
function isSessionData(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const data = obj;
    return ((data.cookies === undefined || typeof data.cookies === 'string') &&
        (data.localStorage === undefined || typeof data.localStorage === 'string') &&
        (data.sessionStorage === undefined || typeof data.sessionStorage === 'string') &&
        (data.metadata === undefined || typeof data.metadata === 'string'));
}
/**
 * Creates a new UserSession with default values
 *
 * @param serviceId - Service identifier
 * @param sessionData - Initial session data
 * @returns New UserSession instance
 */
function createUserSession(serviceId, sessionData) {
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
function updateSessionAccess(session) {
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
function isSessionExpired(session, timeoutMs = 30 * 24 * 60 * 60 * 1000) {
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
function deactivateSession(session) {
    return {
        ...session,
        isActive: false,
        sessionData: {}, // Clear encrypted session data
    };
}
/**
 * Default session storage configuration
 */
exports.DEFAULT_SESSION_CONFIG = {
    serviceName: 'GetWarped-Sessions',
    keyPrefix: 'service-session-',
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxSessionsPerService: 5,
    enableAutoCleanup: true,
};
/**
 * Session security levels for different authentication requirements
 */
var SessionSecurityLevel;
(function (SessionSecurityLevel) {
    /** Basic authentication (username/password) */
    SessionSecurityLevel["BASIC"] = "basic";
    /** OAuth-based authentication */
    SessionSecurityLevel["OAUTH"] = "oauth";
    /** Two-factor authentication required */
    SessionSecurityLevel["TWO_FACTOR"] = "2fa";
    /** Certificate-based authentication */
    SessionSecurityLevel["CERTIFICATE"] = "certificate";
    /** Single Sign-On authentication */
    SessionSecurityLevel["SSO"] = "sso";
})(SessionSecurityLevel || (exports.SessionSecurityLevel = SessionSecurityLevel = {}));
/**
 * Session events for monitoring and logging
 */
var SessionEvent;
(function (SessionEvent) {
    SessionEvent["CREATED"] = "session_created";
    SessionEvent["ACCESSED"] = "session_accessed";
    SessionEvent["UPDATED"] = "session_updated";
    SessionEvent["EXPIRED"] = "session_expired";
    SessionEvent["CLEARED"] = "session_cleared";
    SessionEvent["ERROR"] = "session_error";
})(SessionEvent || (exports.SessionEvent = SessionEvent = {}));
/**
 * Utility function to generate session storage key
 * Creates a consistent key format for OS credential storage
 *
 * @param serviceId - Service identifier
 * @param keyPrefix - Key prefix from configuration
 * @returns Formatted storage key
 */
function generateSessionKey(serviceId, keyPrefix = 'service-session-') {
    return `${keyPrefix}${serviceId}`;
}
//# sourceMappingURL=UserSession.js.map