"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionIsolation = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
/**
 * Comprehensive session isolation manager
 */
class SessionIsolation extends events_1.EventEmitter {
    sessions = new Map();
    sessionMetadata = new Map();
    sessionTimeouts = new Map();
    DEFAULT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
    MAX_STORAGE_SIZE = 100 * 1024 * 1024; // 100MB per session
    constructor() {
        super();
        this.setupGlobalSecurityPolicies();
    }
    /**
     * Create isolated session for a service
     */
    async createIsolatedSession(config) {
        try {
            // Validate configuration
            if (!config.serviceId || !config.serviceName) {
                throw new Error('Service ID and name are required');
            }
            // Check if session already exists
            if (this.sessions.has(config.serviceId)) {
                throw new Error(`Session for service ${config.serviceId} already exists`);
            }
            // Create unique partition name
            const partitionName = config.partitionName || `service-${config.serviceId}-${Date.now()}`;
            const partitionKey = config.persistent ? `persist:${partitionName}` : partitionName;
            // Create isolated session
            const isolatedSession = electron_1.session.fromPartition(partitionKey);
            // Configure session security
            await this.configureSessionSecurity(isolatedSession, config);
            // Create metadata
            const metadata = {
                serviceId: config.serviceId,
                serviceName: config.serviceName,
                partitionName,
                createdAt: new Date(),
                lastAccessedAt: new Date(),
                isActive: true,
                dataCleared: false,
                storageSize: 0,
                permissions: config.permissions || [],
            };
            // Store session and metadata
            this.sessions.set(config.serviceId, isolatedSession);
            this.sessionMetadata.set(config.serviceId, metadata);
            // Set up session timeout if configured
            if (config.timeoutMs && config.timeoutMs > 0) {
                this.setupSessionTimeout(config.serviceId, config.timeoutMs);
            }
            else {
                this.setupSessionTimeout(config.serviceId, this.DEFAULT_TIMEOUT);
            }
            this.emit('session-created', metadata);
            return isolatedSession;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to create isolated session: ${errorMessage}`);
        }
    }
    /**
     * Get session by service ID
     */
    getSession(serviceId) {
        return this.sessions.get(serviceId);
    }
    /**
     * Get session metadata
     */
    getSessionMetadata(serviceId) {
        return this.sessionMetadata.get(serviceId);
    }
    /**
     * Get all active sessions
     */
    getAllSessions() {
        return new Map(this.sessions);
    }
    /**
     * Update session access time
     */
    updateSessionAccess(serviceId) {
        const metadata = this.sessionMetadata.get(serviceId);
        if (metadata) {
            metadata.lastAccessedAt = new Date();
            // Reset timeout
            this.clearSessionTimeout(serviceId);
            this.setupSessionTimeout(serviceId, this.DEFAULT_TIMEOUT);
        }
    }
    /**
     * Clear session data
     */
    async clearSessionData(serviceId, options = {}) {
        const sessionInstance = this.sessions.get(serviceId);
        const metadata = this.sessionMetadata.get(serviceId);
        if (!sessionInstance || !metadata) {
            return false;
        }
        try {
            // Default to clearing all data types
            const clearOptions = {
                appcache: true,
                cookies: true,
                filesystem: true,
                indexdb: true,
                localstorage: true,
                shadercache: true,
                websql: true,
                serviceworkers: true,
                cachestorage: true,
                ...options,
            };
            // Clear storage data
            await sessionInstance.clearStorageData({
                storages: Object.keys(clearOptions).filter(key => clearOptions[key]),
            });
            // Update metadata
            metadata.dataCleared = true;
            metadata.storageSize = 0;
            this.emit('session-data-cleared', serviceId, clearOptions);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Destroy session completely
     */
    async destroySession(serviceId) {
        try {
            // Clear session data first
            await this.clearSessionData(serviceId);
            // Clear timeout
            this.clearSessionTimeout(serviceId);
            // Remove from maps
            this.sessions.delete(serviceId);
            this.sessionMetadata.delete(serviceId);
            this.emit('session-destroyed', serviceId);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Destroy all sessions
     */
    async destroyAllSessions() {
        const serviceIds = Array.from(this.sessions.keys());
        await Promise.all(serviceIds.map(serviceId => this.destroySession(serviceId)));
    }
    /**
     * Check and enforce storage limits
     */
    async enforceStorageLimits() {
        for (const [serviceId, sessionInstance] of this.sessions) {
            try {
                // Get storage usage (simplified - in real implementation use appropriate APIs)
                const storageUsage = await this.getSessionStorageUsage(sessionInstance);
                const metadata = this.sessionMetadata.get(serviceId);
                if (metadata) {
                    metadata.storageSize = storageUsage;
                    // Clear data if over limit
                    if (storageUsage > this.MAX_STORAGE_SIZE) {
                        await this.clearSessionData(serviceId, {
                            appcache: true,
                            cachestorage: true,
                            shadercache: true,
                        });
                    }
                }
            }
            catch (error) {
                // Ignore storage check errors
            }
        }
    }
    /**
     * Setup global security policies
     */
    setupGlobalSecurityPolicies() {
        // Set default security policies for all sessions
        electron_1.session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
            // Deny all permissions by default for security
            callback(false);
        });
        // Block dangerous protocols
        electron_1.session.defaultSession.protocol.registerHttpProtocol('dangerous', (_request, callback) => {
            callback({ error: -3 }); // ABORTED
        });
    }
    /**
     * Configure security for individual session
     */
    async configureSessionSecurity(sessionInstance, config) {
        // Set user agent if provided
        if (config.userAgent) {
            sessionInstance.setUserAgent(config.userAgent);
        }
        // Configure permissions
        sessionInstance.setPermissionRequestHandler((_webContents, permission, callback) => {
            const isAllowed = config.permissions?.includes(permission) || false;
            if (isAllowed) {
                this.emit('permission-granted', config.serviceId, permission);
            }
            else {
                this.emit('permission-denied', config.serviceId, permission);
            }
            callback(isAllowed);
        });
        // Set up CSP if provided
        if (config.contentSecurityPolicy) {
            sessionInstance.webRequest.onHeadersReceived((details, callback) => {
                callback({
                    responseHeaders: {
                        ...details.responseHeaders,
                        'Content-Security-Policy': [config.contentSecurityPolicy],
                    },
                });
            });
        }
        // Inject custom headers if provided
        if (config.customHeaders) {
            sessionInstance.webRequest.onBeforeSendHeaders((details, callback) => {
                callback({
                    requestHeaders: {
                        ...details.requestHeaders,
                        ...config.customHeaders,
                    },
                });
            });
        }
        // Security headers
        sessionInstance.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'X-Frame-Options': ['DENY'],
                    'X-Content-Type-Options': ['nosniff'],
                    'X-XSS-Protection': ['1; mode=block'],
                    'Referrer-Policy': ['strict-origin-when-cross-origin'],
                    'Strict-Transport-Security': ['max-age=31536000; includeSubDomains'],
                },
            });
        });
        // Monitor for security violations
        sessionInstance.webRequest.onCompleted(details => {
            // Check for suspicious activity
            if (details.statusCode >= 400 || details.error) {
                this.emit('security-violation', config.serviceId, `HTTP ${details.statusCode}: ${details.url}`);
            }
        });
        // Handle downloads based on configuration
        sessionInstance.on('will-download', (event, _item) => {
            if (!config.enableDownloads) {
                event.preventDefault();
            }
        });
    }
    /**
     * Setup session timeout
     */
    setupSessionTimeout(serviceId, timeoutMs) {
        // Clear existing timeout
        this.clearSessionTimeout(serviceId);
        // Set new timeout
        const timeoutId = setTimeout(() => {
            this.emit('session-timeout', serviceId);
            this.destroySession(serviceId);
        }, timeoutMs);
        this.sessionTimeouts.set(serviceId, timeoutId);
    }
    /**
     * Clear session timeout
     */
    clearSessionTimeout(serviceId) {
        const timeoutId = this.sessionTimeouts.get(serviceId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.sessionTimeouts.delete(serviceId);
        }
    }
    /**
     * Get session storage usage (simplified implementation)
     */
    async getSessionStorageUsage(_sessionInstance) {
        try {
            // In a real implementation, you would calculate actual storage usage
            // For now, return a simulated value
            return Math.random() * 50 * 1024 * 1024; // Random 0-50MB
        }
        catch (error) {
            return 0;
        }
    }
    /**
     * Clean up session isolation manager
     */
    destroy() {
        // Clear all timeouts
        for (const timeoutId of this.sessionTimeouts.values()) {
            clearTimeout(timeoutId);
        }
        // Destroy all sessions
        this.destroyAllSessions();
        // Clear maps
        this.sessions.clear();
        this.sessionMetadata.clear();
        this.sessionTimeouts.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
exports.SessionIsolation = SessionIsolation;
exports.default = SessionIsolation;
//# sourceMappingURL=SessionIsolation.js.map