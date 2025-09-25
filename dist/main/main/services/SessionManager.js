"use strict";
/**
 * Session Manager
 *
 * Manages user sessions, authentication state, and session-based security.
 * Integrates with keytar for secure credential storage and handles session
 * lifecycle, timeout, and cleanup operations.
 *
 * @fileoverview Session management with secure credential storage and lifecycle
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
exports.SessionManager = exports.SessionEvent = void 0;
const keytar = __importStar(require("keytar"));
const events_1 = require("events");
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * Session events
 */
var SessionEvent;
(function (SessionEvent) {
    /** Session created */
    SessionEvent["CREATED"] = "session:created";
    /** Session updated */
    SessionEvent["UPDATED"] = "session:updated";
    /** Session deleted */
    SessionEvent["DELETED"] = "session:deleted";
    /** Session expired */
    SessionEvent["EXPIRED"] = "session:expired";
    /** Session activity */
    SessionEvent["ACTIVITY"] = "session:activity";
    /** Credential stored */
    SessionEvent["CREDENTIAL_STORED"] = "credential:stored";
    /** Credential retrieved */
    SessionEvent["CREDENTIAL_RETRIEVED"] = "credential:retrieved";
    /** Credential deleted */
    SessionEvent["CREDENTIAL_DELETED"] = "credential:deleted";
})(SessionEvent || (exports.SessionEvent = SessionEvent = {}));
/**
 * Session Manager class for handling session lifecycle and credential storage
 */
class SessionManager extends events_1.EventEmitter {
    sessions = new Map();
    sessionTimeouts = new Map();
    defaultTimeoutMinutes = 60;
    serviceName = 'GetWarped';
    cleanupInterval;
    constructor() {
        super();
        this.startCleanupTimer();
    }
    /**
     * Create a new session
     */
    async createSession(request) {
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
            const sessionData = {
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Update an existing session
     */
    async updateSession(request) {
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Delete a session
     */
    async deleteSession(sessionId) {
        try {
            // Validate session ID
            const validation = InputValidator_1.Validators.validateUUID(sessionId);
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
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        try {
            // Validate session ID
            const validation = InputValidator_1.Validators.validateUUID(sessionId);
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
        }
        catch (error) {
            return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Get all active sessions
     */
    async getActiveSessions() {
        const activeSessions = [];
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
    async getSessionsForService(serviceId) {
        const validation = InputValidator_1.Validators.validateUUID(serviceId);
        if (!validation.valid) {
            return [];
        }
        const serviceSessions = [];
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
    async clearAllSessions() {
        try {
            const sessionIds = Array.from(this.sessions.keys());
            for (const sessionId of sessionIds) {
                await this.deleteSession(sessionId);
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    /**
     * Store credentials securely using keytar
     */
    async storeCredential(request) {
        try {
            // Validate request
            const validation = this.validateCredentialStoreRequest(request);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Validation failed' };
            }
            // Create keytar account
            const account = this.buildCredentialAccount(request.serviceId, request.userId, request.credentialKey);
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to store credential',
            };
        }
    }
    /**
     * Retrieve credentials from keytar
     */
    async retrieveCredential(request) {
        try {
            // Validate request
            const validation = this.validateCredentialRetrieveRequest(request);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Validation failed' };
            }
            // Create keytar account
            const account = this.buildCredentialAccount(request.serviceId, request.userId, request.credentialKey);
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve credential',
            };
        }
    }
    /**
     * Delete credentials from keytar
     */
    async deleteCredential(request) {
        try {
            // Validate request
            const validation = this.validateCredentialRetrieveRequest(request);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Validation failed' };
            }
            // Create keytar account
            const account = this.buildCredentialAccount(request.serviceId, request.userId, request.credentialKey);
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete credential',
            };
        }
    }
    /**
     * List all stored credentials for a service
     */
    async listCredentials(serviceId, userId) {
        try {
            // Validate parameters
            const serviceValidation = InputValidator_1.Validators.validateUUID(serviceId);
            const userValidation = InputValidator_1.InputValidator.validateText(userId, { minLength: 1 });
            if (!serviceValidation.valid) {
                return { success: false, error: 'Invalid service ID format' };
            }
            if (!userValidation.valid) {
                return { success: false, error: 'Invalid user ID' };
            }
            // Get all credentials for this service
            const accounts = await keytar.findCredentials(this.serviceName);
            const prefix = `${serviceId}:${userId}:`;
            const credentials = [];
            for (const account of accounts) {
                if (account.account.startsWith(prefix)) {
                    const credentialKey = account.account.substring(prefix.length);
                    credentials.push(credentialKey);
                }
            }
            return { success: true, credentials };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to list credentials',
            };
        }
    }
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredSessionIds = [];
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
    startCleanupTimer() {
        // Clean up expired sessions every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);
    }
    /**
     * Stop cleanup timer
     */
    stopCleanupTimer() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
    }
    /**
     * Set session timeout
     */
    setSessionTimeout(sessionId, timeoutMinutes) {
        // Clear existing timeout
        this.clearSessionTimeout(sessionId);
        // Set new timeout
        const timeout = setTimeout(async () => {
            const session = this.sessions.get(sessionId);
            if (session) {
                await this.deleteSession(sessionId);
                this.emit(SessionEvent.EXPIRED, session);
            }
        }, timeoutMinutes * 60 * 1000);
        this.sessionTimeouts.set(sessionId, timeout);
    }
    /**
     * Clear session timeout
     */
    clearSessionTimeout(sessionId) {
        const timeout = this.sessionTimeouts.get(sessionId);
        if (timeout) {
            clearTimeout(timeout);
            this.sessionTimeouts.delete(sessionId);
        }
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
    /**
     * Build credential account string for keytar
     */
    buildCredentialAccount(serviceId, userId, credentialKey) {
        return `${serviceId}:${userId}:${credentialKey}`;
    }
    /**
     * Validate session create request
     */
    validateSessionCreateRequest(request) {
        const userValidation = InputValidator_1.InputValidator.validateText(request.userId, { minLength: 1 });
        if (!userValidation.valid) {
            return { valid: false, error: 'Invalid user ID' };
        }
        const serviceValidation = InputValidator_1.Validators.validateUUID(request.serviceId);
        if (!serviceValidation.valid) {
            return { valid: false, error: 'Invalid service ID format' };
        }
        if (request.timeoutMinutes !== undefined) {
            if (typeof request.timeoutMinutes !== 'number' ||
                request.timeoutMinutes < 1 ||
                request.timeoutMinutes > 1440) {
                return { valid: false, error: 'Timeout must be between 1 and 1440 minutes' };
            }
        }
        return { valid: true };
    }
    /**
     * Validate session update request
     */
    validateSessionUpdateRequest(request) {
        const sessionValidation = InputValidator_1.Validators.validateUUID(request.sessionId);
        if (!sessionValidation.valid) {
            return { valid: false, error: 'Invalid session ID format' };
        }
        if (request.extendTimeoutMinutes !== undefined) {
            if (typeof request.extendTimeoutMinutes !== 'number' ||
                request.extendTimeoutMinutes < 1 ||
                request.extendTimeoutMinutes > 1440) {
                return { valid: false, error: 'Timeout extension must be between 1 and 1440 minutes' };
            }
        }
        return { valid: true };
    }
    /**
     * Validate credential store request
     */
    validateCredentialStoreRequest(request) {
        const serviceValidation = InputValidator_1.Validators.validateUUID(request.serviceId);
        if (!serviceValidation.valid) {
            return { valid: false, error: 'Invalid service ID format' };
        }
        const userValidation = InputValidator_1.InputValidator.validateText(request.userId, { minLength: 1 });
        if (!userValidation.valid) {
            return { valid: false, error: 'Invalid user ID' };
        }
        const keyValidation = InputValidator_1.InputValidator.validateText(request.credentialKey, { minLength: 1 });
        if (!keyValidation.valid) {
            return { valid: false, error: 'Invalid credential key' };
        }
        const valueValidation = InputValidator_1.InputValidator.validateText(request.credentialValue, { minLength: 1 });
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
    validateCredentialRetrieveRequest(request) {
        const serviceValidation = InputValidator_1.Validators.validateUUID(request.serviceId);
        if (!serviceValidation.valid) {
            return { valid: false, error: 'Invalid service ID format' };
        }
        const userValidation = InputValidator_1.InputValidator.validateText(request.userId, { minLength: 1 });
        if (!userValidation.valid) {
            return { valid: false, error: 'Invalid user ID' };
        }
        const keyValidation = InputValidator_1.InputValidator.validateText(request.credentialKey, { minLength: 1 });
        if (!keyValidation.valid) {
            return { valid: false, error: 'Invalid credential key' };
        }
        return { valid: true };
    }
    /**
     * Cleanup resources
     */
    destroy() {
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
exports.SessionManager = SessionManager;
exports.default = SessionManager;
//# sourceMappingURL=SessionManager.js.map