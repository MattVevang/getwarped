"use strict";
/**
 * CredentialStore - Cross-platform secure credential storage using keytar
 *
 * Provides secure, OS-native credential storage capabilities:
 * - Windows Credential Manager integration
 * - macOS Keychain Services integration
 * - Linux Secret Service API integration
 * - Encrypted credential caching and management
 * - Service-isolated credential storage
 * - Secure credential cleanup and rotation
 *
 * @fileoverview Cross-platform credential storage with keytar integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialStore = exports.CredentialType = void 0;
const events_1 = require("events");
// Keytar is optional dependency - use dynamic import to handle missing package
let keytar;
try {
    keytar = require('keytar');
}
catch (error) {
    // keytar not available - will use fallback storage
}
/**
 * Types of credentials
 */
var CredentialType;
(function (CredentialType) {
    CredentialType["PASSWORD"] = "password";
    CredentialType["TOKEN"] = "token";
    CredentialType["API_KEY"] = "api_key";
    CredentialType["CERTIFICATE"] = "certificate";
    CredentialType["PRIVATE_KEY"] = "private_key";
    CredentialType["SESSION_DATA"] = "session_data";
    CredentialType["OAUTH_TOKEN"] = "oauth_token";
    CredentialType["REFRESH_TOKEN"] = "refresh_token";
})(CredentialType || (exports.CredentialType = CredentialType = {}));
/**
 * Comprehensive credential storage manager
 */
class CredentialStore extends events_1.EventEmitter {
    APP_NAME = 'GetWarped';
    memoryCache = new Map();
    metadata = new Map();
    CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    KEYTAR_AVAILABLE = !!keytar;
    cleanupInterval;
    constructor() {
        super();
        if (!this.KEYTAR_AVAILABLE) {
            this.emit('keytar-unavailable');
        }
        // Start periodic cleanup
        this.startCleanup();
    }
    /**
     * Store credential securely
     */
    async storeCredential(serviceId, serviceName, account, credential, type = CredentialType.PASSWORD) {
        try {
            // Validate inputs
            if (!serviceId || !account || !credential) {
                return {
                    success: false,
                    error: 'Service ID, account, and credential are required',
                };
            }
            // Create service key for keytar
            const serviceKey = this.createServiceKey(serviceId, serviceName);
            // Store in OS-native credential store if available
            if (this.KEYTAR_AVAILABLE) {
                try {
                    await keytar.setPassword(serviceKey, account, credential);
                }
                catch (error) {
                    // Fall back to memory cache if keytar fails
                    this.storeInMemoryCache(serviceId, account, credential, type);
                    return {
                        success: true,
                        data: true,
                        error: 'Stored in memory cache (keytar unavailable)',
                    };
                }
            }
            else {
                // Store in encrypted memory cache
                this.storeInMemoryCache(serviceId, account, credential, type);
            }
            // Update metadata
            this.updateMetadata(serviceId, serviceName, account, type);
            this.emit('credential-stored', serviceId, account, type);
            return { success: true, data: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('storage-error', new Error(`Failed to store credential: ${errorMessage}`));
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Retrieve credential securely
     */
    async getCredential(serviceId, serviceName, account) {
        try {
            // Validate inputs
            if (!serviceId || !account) {
                return {
                    success: false,
                    error: 'Service ID and account are required',
                };
            }
            // Try memory cache first
            const cacheKey = this.createCacheKey(serviceId, account);
            const cachedCredential = this.memoryCache.get(cacheKey);
            if (cachedCredential && this.isCacheValid(cachedCredential.timestamp)) {
                this.updateLastAccessed(serviceId, account);
                this.emit('credential-retrieved', serviceId, account);
                return { success: true, data: cachedCredential.value };
            }
            // Try OS-native credential store
            if (this.KEYTAR_AVAILABLE) {
                const serviceKey = this.createServiceKey(serviceId, serviceName);
                try {
                    const credential = await keytar.getPassword(serviceKey, account);
                    if (credential) {
                        // Cache for quick access
                        this.storeInMemoryCache(serviceId, account, credential, CredentialType.PASSWORD);
                        this.updateLastAccessed(serviceId, account);
                        this.emit('credential-retrieved', serviceId, account);
                        return { success: true, data: credential };
                    }
                }
                catch (error) {
                    // Continue to return not found
                }
            }
            return { success: false, error: 'Credential not found' };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('storage-error', new Error(`Failed to retrieve credential: ${errorMessage}`));
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Delete credential
     */
    async deleteCredential(serviceId, serviceName, account) {
        try {
            // Validate inputs
            if (!serviceId || !account) {
                return {
                    success: false,
                    error: 'Service ID and account are required',
                };
            }
            let deleted = false;
            // Remove from OS-native credential store
            if (this.KEYTAR_AVAILABLE) {
                const serviceKey = this.createServiceKey(serviceId, serviceName);
                try {
                    deleted = await keytar.deletePassword(serviceKey, account);
                }
                catch (error) {
                    // Continue to remove from cache
                }
            }
            // Remove from memory cache
            const cacheKey = this.createCacheKey(serviceId, account);
            const cacheDeleted = this.memoryCache.delete(cacheKey);
            // Update metadata
            this.removeFromMetadata(serviceId, account);
            this.emit('credential-deleted', serviceId, account);
            return { success: true, data: deleted || cacheDeleted };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('storage-error', new Error(`Failed to delete credential: ${errorMessage}`));
            return { success: false, error: errorMessage };
        }
    }
    /**
     * List accounts for a service
     */
    async listAccounts(serviceId, serviceName) {
        try {
            const accounts = new Set();
            // Get accounts from OS-native credential store
            if (this.KEYTAR_AVAILABLE) {
                const serviceKey = this.createServiceKey(serviceId, serviceName);
                try {
                    const credentials = await keytar.findCredentials(serviceKey);
                    credentials.forEach((cred) => accounts.add(cred.account));
                }
                catch (error) {
                    // Continue with cache search
                }
            }
            // Get accounts from memory cache
            for (const [cacheKey] of this.memoryCache) {
                const [cacheServiceId, account] = this.parseCacheKey(cacheKey);
                if (cacheServiceId === serviceId) {
                    accounts.add(account);
                }
            }
            return { success: true, data: Array.from(accounts) };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('storage-error', new Error(`Failed to list accounts: ${errorMessage}`));
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Clear all credentials for a service
     */
    async clearServiceCredentials(serviceId, serviceName) {
        try {
            let totalDeleted = 0;
            // Get all accounts for the service
            const accountsResult = await this.listAccounts(serviceId, serviceName);
            if (!accountsResult.success || !accountsResult.data) {
                return { success: true, data: 0 };
            }
            // Delete each credential
            for (const account of accountsResult.data) {
                const deleteResult = await this.deleteCredential(serviceId, serviceName, account);
                if (deleteResult.success) {
                    totalDeleted++;
                }
            }
            // Clear metadata
            this.metadata.delete(serviceId);
            this.emit('credentials-cleared', serviceId);
            return { success: true, data: totalDeleted };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('storage-error', new Error(`Failed to clear credentials: ${errorMessage}`));
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Get credential metadata
     */
    getCredentialMetadata(serviceId) {
        return this.metadata.get(serviceId) || null;
    }
    /**
     * Get all service metadata
     */
    getAllMetadata() {
        return new Map(this.metadata);
    }
    /**
     * Check if keytar is available
     */
    isKeytarAvailable() {
        return this.KEYTAR_AVAILABLE;
    }
    /**
     * Clear memory cache
     */
    clearMemoryCache() {
        this.memoryCache.clear();
    }
    /**
     * Create service key for keytar
     */
    createServiceKey(serviceId, serviceName) {
        return `${this.APP_NAME}-${serviceName}-${serviceId}`;
    }
    /**
     * Create cache key for memory storage
     */
    createCacheKey(serviceId, account) {
        return `${serviceId}:${account}`;
    }
    /**
     * Parse cache key back to components
     */
    parseCacheKey(cacheKey) {
        const [serviceId, account] = cacheKey.split(':', 2);
        return [serviceId || '', account || ''];
    }
    /**
     * Store credential in memory cache with basic encryption
     */
    storeInMemoryCache(serviceId, account, credential, type) {
        const cacheKey = this.createCacheKey(serviceId, account);
        // Basic encryption using simple XOR (in production, use proper encryption)
        const encrypted = this.simpleEncrypt(credential);
        this.memoryCache.set(cacheKey, {
            value: encrypted,
            timestamp: Date.now(),
            type,
        });
    }
    /**
     * Check if cache entry is valid
     */
    isCacheValid(timestamp) {
        return Date.now() - timestamp < this.CACHE_TTL;
    }
    /**
     * Update metadata for a service
     */
    updateMetadata(serviceId, _serviceName, account, _type) {
        const existing = this.metadata.get(serviceId) || {
            serviceId,
            accounts: [],
            totalCredentials: 0,
            lastModified: new Date(),
            encryptionMethod: this.KEYTAR_AVAILABLE ? 'keytar' : 'memory',
        };
        if (!existing.accounts.includes(account)) {
            existing.accounts.push(account);
            existing.totalCredentials++;
        }
        existing.lastModified = new Date();
        this.metadata.set(serviceId, existing);
    }
    /**
     * Remove account from metadata
     */
    removeFromMetadata(serviceId, account) {
        const existing = this.metadata.get(serviceId);
        if (existing) {
            existing.accounts = existing.accounts.filter(a => a !== account);
            existing.totalCredentials = existing.accounts.length;
            existing.lastModified = new Date();
            if (existing.totalCredentials === 0) {
                this.metadata.delete(serviceId);
            }
            else {
                this.metadata.set(serviceId, existing);
            }
        }
    }
    /**
     * Update last accessed time
     */
    updateLastAccessed(serviceId, _account) {
        const existing = this.metadata.get(serviceId);
        if (existing) {
            existing.lastModified = new Date();
            this.metadata.set(serviceId, existing);
        }
    }
    /**
     * Simple XOR encryption for memory cache (use proper encryption in production)
     */
    simpleEncrypt(text) {
        const key = 'GetWarped-Secret-Key'; // In production, use a proper key derivation
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }
    /**
     * Simple XOR decryption for memory cache
     */
    simpleDecrypt(encrypted) {
        try {
            const decoded = atob(encrypted);
            const key = 'GetWarped-Secret-Key';
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        }
        catch {
            return encrypted; // Return as-is if decryption fails
        }
    }
    /**
     * Start periodic cleanup of expired cache entries
     */
    startCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // Cleanup every minute
    }
    /**
     * Clean up expired cache entries
     */
    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, entry] of this.memoryCache) {
            if (now - entry.timestamp > this.CACHE_TTL) {
                this.memoryCache.delete(key);
            }
        }
    }
    /**
     * Clean up credential store
     */
    destroy() {
        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Clear memory cache
        this.clearMemoryCache();
        // Clear metadata
        this.metadata.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
exports.CredentialStore = CredentialStore;
exports.default = CredentialStore;
//# sourceMappingURL=CredentialStore.js.map