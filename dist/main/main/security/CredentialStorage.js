"use strict";
/**
 * Credential Storage
 *
 * Provides secure, OS-native credential storage using keytar.
 * Handles encryption, key derivation, and secure credential management
 * with proper lifecycle and cleanup operations.
 *
 * @fileoverview OS-native credential storage with encryption and security
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
exports.CredentialStorage = exports.CredentialEvent = exports.CredentialType = void 0;
const keytar = __importStar(require("keytar"));
const crypto = __importStar(require("crypto"));
const events_1 = require("events");
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * Credential types
 */
var CredentialType;
(function (CredentialType) {
    CredentialType["PASSWORD"] = "password";
    CredentialType["API_KEY"] = "api-key";
    CredentialType["TOKEN"] = "token";
    CredentialType["CERTIFICATE"] = "certificate";
    CredentialType["SSH_KEY"] = "ssh-key";
    CredentialType["OAUTH_TOKEN"] = "oauth-token";
    CredentialType["REFRESH_TOKEN"] = "refresh-token";
})(CredentialType || (exports.CredentialType = CredentialType = {}));
/**
 * Credential storage events
 */
var CredentialEvent;
(function (CredentialEvent) {
    /** Credential stored */
    CredentialEvent["STORED"] = "credential:stored";
    /** Credential retrieved */
    CredentialEvent["RETRIEVED"] = "credential:retrieved";
    /** Credential updated */
    CredentialEvent["UPDATED"] = "credential:updated";
    /** Credential deleted */
    CredentialEvent["DELETED"] = "credential:deleted";
    /** Credential expired */
    CredentialEvent["EXPIRED"] = "credential:expired";
    /** Credential accessed */
    CredentialEvent["ACCESSED"] = "credential:accessed";
})(CredentialEvent || (exports.CredentialEvent = CredentialEvent = {}));
/**
 * Credential Storage class for secure OS-native credential management
 */
class CredentialStorage extends events_1.EventEmitter {
    serviceName = 'GetWarped';
    metadataPrefix = 'metadata:';
    credentialPrefix = 'credential:';
    encryptionAlgorithm = 'aes-256-gcm';
    keyDerivationRounds = 100000;
    masterKey;
    constructor() {
        super();
    }
    /**
     * Initialize credential storage with master key
     */
    async initialize(masterPassword) {
        try {
            if (masterPassword) {
                // Derive master key from password
                const salt = await this.getOrCreateSalt();
                this.masterKey = crypto.pbkdf2Sync(masterPassword, salt, this.keyDerivationRounds, 32, 'sha512');
            }
            else {
                // Generate random master key for session-based encryption
                this.masterKey = crypto.randomBytes(32);
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Initialization failed',
            };
        }
    }
    /**
     * Store a credential securely
     */
    async storeCredential(request) {
        try {
            // Validate request
            const validation = this.validateStoreRequest(request);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Validation failed' };
            }
            if (!this.masterKey) {
                return { success: false, error: 'Credential storage not initialized' };
            }
            // Generate credential ID
            const credentialId = this.generateCredentialId(request.serviceId, request.userId, request.label);
            // Create metadata
            const metadata = {
                id: credentialId,
                serviceId: request.serviceId,
                userId: request.userId,
                type: request.type,
                label: request.label,
                createdAt: new Date(),
                metadata: request.metadata || {},
            };
            // Add optional properties if present
            if (request.expiresAt) {
                metadata.expiresAt = request.expiresAt;
            }
            // Encrypt credential value
            const encryptedValue = await this.encryptCredential(request.value);
            // Store encrypted credential
            const credentialAccount = this.buildCredentialAccount(credentialId);
            await keytar.setPassword(this.serviceName, credentialAccount, encryptedValue);
            // Store metadata
            const metadataAccount = this.buildMetadataAccount(credentialId);
            await keytar.setPassword(this.serviceName, metadataAccount, JSON.stringify(metadata));
            // Emit event
            this.emit(CredentialEvent.STORED, {
                credentialId,
                serviceId: request.serviceId,
                type: request.type,
            });
            return { success: true, credentialId };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to store credential',
            };
        }
    }
    /**
     * Retrieve a credential
     */
    async retrieveCredential(request) {
        try {
            // Validate request
            const validation = this.validateRetrieveRequest(request);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Validation failed' };
            }
            if (!this.masterKey) {
                return { success: false, error: 'Credential storage not initialized' };
            }
            // Get metadata first
            const metadataResult = await this.getCredentialMetadata(request.credentialId);
            if (!metadataResult.success) {
                return { success: false, error: metadataResult.error || 'Failed to get metadata' };
            }
            const metadata = metadataResult.metadata;
            // Check if credential is expired
            if (metadata.expiresAt && metadata.expiresAt.getTime() < Date.now()) {
                this.emit(CredentialEvent.EXPIRED, { credentialId: request.credentialId, metadata });
                return { success: false, error: 'Credential has expired' };
            }
            // Retrieve encrypted credential
            const credentialAccount = this.buildCredentialAccount(request.credentialId);
            const encryptedValue = await keytar.getPassword(this.serviceName, credentialAccount);
            if (!encryptedValue) {
                return { success: false, error: 'Credential not found' };
            }
            // Decrypt credential value
            const decryptedValue = await this.decryptCredential(encryptedValue);
            // Update last accessed timestamp
            metadata.lastAccessedAt = new Date();
            await this.updateCredentialMetadata(request.credentialId, metadata);
            // Emit events
            this.emit(CredentialEvent.RETRIEVED, { credentialId: request.credentialId, metadata });
            this.emit(CredentialEvent.ACCESSED, { credentialId: request.credentialId, metadata });
            return { success: true, credential: decryptedValue, metadata };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve credential',
            };
        }
    }
    /**
     * Update a credential
     */
    async updateCredential(request) {
        try {
            // Validate request
            const validation = this.validateUpdateRequest(request);
            if (!validation.valid) {
                return { success: false, error: validation.error || 'Validation failed' };
            }
            if (!this.masterKey) {
                return { success: false, error: 'Credential storage not initialized' };
            }
            // Get existing metadata
            const metadataResult = await this.getCredentialMetadata(request.credentialId);
            if (!metadataResult.success) {
                return { success: false, error: metadataResult.error || 'Failed to get metadata' };
            }
            const metadata = metadataResult.metadata;
            // Update credential value if provided
            if (request.value) {
                const encryptedValue = await this.encryptCredential(request.value);
                const credentialAccount = this.buildCredentialAccount(request.credentialId);
                await keytar.setPassword(this.serviceName, credentialAccount, encryptedValue);
            }
            // Update metadata
            if (request.label)
                metadata.label = request.label;
            if (request.expiresAt !== undefined)
                metadata.expiresAt = request.expiresAt;
            if (request.metadata) {
                metadata.metadata = { ...metadata.metadata, ...request.metadata };
            }
            // Store updated metadata
            await this.updateCredentialMetadata(request.credentialId, metadata);
            // Emit event
            this.emit(CredentialEvent.UPDATED, { credentialId: request.credentialId, metadata });
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update credential',
            };
        }
    }
    /**
     * Delete a credential
     */
    async deleteCredential(credentialId) {
        try {
            // Validate credential ID
            if (!credentialId || typeof credentialId !== 'string') {
                return { success: false, error: 'Invalid credential ID' };
            }
            // Get metadata before deletion
            const metadataResult = await this.getCredentialMetadata(credentialId);
            const metadata = metadataResult.success ? metadataResult.metadata : undefined;
            // Delete credential
            const credentialAccount = this.buildCredentialAccount(credentialId);
            const credentialDeleted = await keytar.deletePassword(this.serviceName, credentialAccount);
            // Delete metadata
            const metadataAccount = this.buildMetadataAccount(credentialId);
            const metadataDeleted = await keytar.deletePassword(this.serviceName, metadataAccount);
            if (!credentialDeleted && !metadataDeleted) {
                return { success: false, error: 'Credential not found' };
            }
            // Emit event
            this.emit(CredentialEvent.DELETED, { credentialId, metadata });
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
     * Search for credentials
     */
    async searchCredentials(request = {}) {
        try {
            // Get all credentials
            const credentials = await keytar.findCredentials(this.serviceName);
            const results = [];
            const now = Date.now();
            for (const cred of credentials) {
                // Only process metadata entries
                if (!cred.account.startsWith(this.metadataPrefix)) {
                    continue;
                }
                try {
                    const metadata = JSON.parse(cred.password);
                    // Apply filters
                    if (request.serviceId && metadata.serviceId !== request.serviceId) {
                        continue;
                    }
                    if (request.userId && metadata.userId !== request.userId) {
                        continue;
                    }
                    if (request.type && metadata.type !== request.type) {
                        continue;
                    }
                    // Check expiration
                    if (metadata.expiresAt && metadata.expiresAt.getTime() < now) {
                        if (!request.includeExpired) {
                            continue;
                        }
                    }
                    results.push(metadata);
                }
                catch (parseError) {
                    // Skip invalid metadata entries
                    continue;
                }
            }
            return { success: true, credentials: results };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to search credentials',
            };
        }
    }
    /**
     * Clear all credentials for a service
     */
    async clearServiceCredentials(serviceId) {
        try {
            // Validate service ID
            const serviceValidation = InputValidator_1.Validators.validateUUID(serviceId);
            if (!serviceValidation.valid) {
                return { success: false, error: 'Invalid service ID format' };
            }
            // Search for service credentials
            const searchResult = await this.searchCredentials({ serviceId, includeExpired: true });
            if (!searchResult.success) {
                return { success: false, error: searchResult.error || 'Search failed' };
            }
            let deletedCount = 0;
            const credentials = searchResult.credentials || [];
            // Delete each credential
            for (const credential of credentials) {
                const deleteResult = await this.deleteCredential(credential.id);
                if (deleteResult.success) {
                    deletedCount++;
                }
            }
            return { success: true, deletedCount };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear service credentials',
            };
        }
    }
    /**
     * Clear expired credentials
     */
    async clearExpiredCredentials() {
        try {
            // Search for expired credentials
            const searchResult = await this.searchCredentials({ includeExpired: true });
            if (!searchResult.success) {
                return { success: false, error: searchResult.error || 'Search failed' };
            }
            let deletedCount = 0;
            const credentials = searchResult.credentials || [];
            const now = Date.now();
            // Delete expired credentials
            for (const credential of credentials) {
                if (credential.expiresAt && credential.expiresAt.getTime() < now) {
                    const deleteResult = await this.deleteCredential(credential.id);
                    if (deleteResult.success) {
                        deletedCount++;
                        this.emit(CredentialEvent.EXPIRED, {
                            credentialId: credential.id,
                            metadata: credential,
                        });
                    }
                }
            }
            return { success: true, deletedCount };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to clear expired credentials',
            };
        }
    }
    /**
     * Encrypt credential value
     */
    async encryptCredential(value) {
        if (!this.masterKey) {
            throw new Error('Master key not available');
        }
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.encryptionAlgorithm, this.masterKey, iv);
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        // Combine IV, authTag, and encrypted data
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    /**
     * Decrypt credential value
     */
    async decryptCredential(encryptedValue) {
        if (!this.masterKey) {
            throw new Error('Master key not available');
        }
        const parts = encryptedValue.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted credential format');
        }
        if (!parts[0] || !parts[1] || !parts[2]) {
            throw new Error('Invalid encrypted credential format - missing parts');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, this.masterKey, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Get or create salt for key derivation
     */
    async getOrCreateSalt() {
        const saltAccount = 'encryption:salt';
        try {
            const existingSalt = await keytar.getPassword(this.serviceName, saltAccount);
            if (existingSalt) {
                return Buffer.from(existingSalt, 'hex');
            }
        }
        catch (error) {
            // Salt doesn't exist, create new one
        }
        // Generate new salt
        const salt = crypto.randomBytes(32);
        await keytar.setPassword(this.serviceName, saltAccount, salt.toString('hex'));
        return salt;
    }
    /**
     * Get credential metadata
     */
    async getCredentialMetadata(credentialId) {
        try {
            const metadataAccount = this.buildMetadataAccount(credentialId);
            const metadataJson = await keytar.getPassword(this.serviceName, metadataAccount);
            if (!metadataJson) {
                return { success: false, error: 'Credential metadata not found' };
            }
            const metadata = JSON.parse(metadataJson);
            // Convert date strings back to Date objects
            metadata.createdAt = new Date(metadata.createdAt);
            if (metadata.lastAccessedAt) {
                metadata.lastAccessedAt = new Date(metadata.lastAccessedAt);
            }
            if (metadata.expiresAt) {
                metadata.expiresAt = new Date(metadata.expiresAt);
            }
            return { success: true, metadata };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get credential metadata',
            };
        }
    }
    /**
     * Update credential metadata
     */
    async updateCredentialMetadata(credentialId, metadata) {
        const metadataAccount = this.buildMetadataAccount(credentialId);
        await keytar.setPassword(this.serviceName, metadataAccount, JSON.stringify(metadata));
    }
    /**
     * Generate unique credential ID
     */
    generateCredentialId(serviceId, userId, label) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const hash = crypto
            .createHash('sha256')
            .update(`${serviceId}:${userId}:${label}:${timestamp}:${random}`)
            .digest('hex')
            .substring(0, 16);
        return `cred_${hash}`;
    }
    /**
     * Build credential account string
     */
    buildCredentialAccount(credentialId) {
        return `${this.credentialPrefix}${credentialId}`;
    }
    /**
     * Build metadata account string
     */
    buildMetadataAccount(credentialId) {
        return `${this.metadataPrefix}${credentialId}`;
    }
    /**
     * Validate store credential request
     */
    validateStoreRequest(request) {
        const serviceValidation = InputValidator_1.Validators.validateUUID(request.serviceId);
        if (!serviceValidation.valid) {
            return { valid: false, error: 'Invalid service ID format' };
        }
        const userValidation = InputValidator_1.InputValidator.validateText(request.userId, { minLength: 1 });
        if (!userValidation.valid) {
            return { valid: false, error: 'Invalid user ID' };
        }
        const labelValidation = InputValidator_1.InputValidator.validateText(request.label, {
            minLength: 1,
            maxLength: 255,
        });
        if (!labelValidation.valid) {
            return { valid: false, error: 'Invalid label' };
        }
        const valueValidation = InputValidator_1.InputValidator.validateText(request.value, { minLength: 1 });
        if (!valueValidation.valid) {
            return { valid: false, error: 'Invalid credential value' };
        }
        if (!Object.values(CredentialType).includes(request.type)) {
            return { valid: false, error: 'Invalid credential type' };
        }
        if (request.expiresAt && request.expiresAt.getTime() <= Date.now()) {
            return { valid: false, error: 'Expiration date must be in the future' };
        }
        return { valid: true };
    }
    /**
     * Validate retrieve credential request
     */
    validateRetrieveRequest(request) {
        if (!request.credentialId || typeof request.credentialId !== 'string') {
            return { valid: false, error: 'Invalid credential ID' };
        }
        return { valid: true };
    }
    /**
     * Validate update credential request
     */
    validateUpdateRequest(request) {
        if (!request.credentialId || typeof request.credentialId !== 'string') {
            return { valid: false, error: 'Invalid credential ID' };
        }
        if (request.value !== undefined) {
            const valueValidation = InputValidator_1.InputValidator.validateText(request.value, { minLength: 1 });
            if (!valueValidation.valid) {
                return { valid: false, error: 'Invalid credential value' };
            }
        }
        if (request.label !== undefined) {
            const labelValidation = InputValidator_1.InputValidator.validateText(request.label, {
                minLength: 1,
                maxLength: 255,
            });
            if (!labelValidation.valid) {
                return { valid: false, error: 'Invalid label' };
            }
        }
        if (request.expiresAt && request.expiresAt.getTime() <= Date.now()) {
            return { valid: false, error: 'Expiration date must be in the future' };
        }
        return { valid: true };
    }
    /**
     * Cleanup resources
     */
    destroy() {
        // Clear master key from memory
        if (this.masterKey) {
            this.masterKey.fill(0);
            this.masterKey = undefined;
        }
        // Remove all listeners
        this.removeAllListeners();
    }
}
exports.CredentialStorage = CredentialStorage;
exports.default = CredentialStorage;
//# sourceMappingURL=CredentialStorage.js.map