"use strict";
/**
 * CredentialEncryption.ts
 *
 * Provides secure encryption services for sensitive credential data using
 * industry-standard cryptographic methods. Replaces simple XOR encryption
 * with AES-256-GCM for production-grade security.
 *
 * Features:
 * - AES-256-GCM encryption/decryption
 * - Random IV generation for each encryption
 * - Secure key derivation from master key
 * - Authenticated encryption with additional data
 * - Cross-platform compatibility using Node.js crypto
 * - Memory-safe operations with secure cleanup
 *
 * Security Properties:
 * - Confidentiality: AES-256 encryption
 * - Integrity: GCM authentication tag
 * - Freshness: Random IV per operation
 * - Forward secrecy: Ephemeral keys when possible
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialEncryption = void 0;
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const node_events_1 = require("node:events");
/**
 * Production-grade credential encryption service
 *
 * Provides secure encryption/decryption operations for sensitive credential data
 * using AES-256-GCM with proper key derivation and authenticated encryption.
 */
class CredentialEncryption extends node_events_1.EventEmitter {
    DEFAULT_ALGORITHM = 'aes-256-gcm';
    DEFAULT_KEY_DERIVATION = 'scrypt';
    DEFAULT_KEY_LENGTH = 32; // 256 bits
    DEFAULT_IV_LENGTH = 16; // 128 bits
    DEFAULT_TAG_LENGTH = 16; // 128 bits
    FORMAT_VERSION = 1;
    scryptAsync = (0, node_util_1.promisify)(node_crypto_1.scrypt);
    masterKey = null;
    keyCache = new Map(); // Salt -> derived key cache
    constructor(masterKey) {
        super();
        if (masterKey) {
            this.setMasterKey(masterKey);
        }
        // Clear sensitive data on process exit
        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => this.cleanup());
        process.on('SIGTERM', () => this.cleanup());
    }
    /**
     * Set the master key used for key derivation
     */
    setMasterKey(masterKey) {
        if (!masterKey || masterKey.length < 16) {
            const error = 'Master key must be at least 16 characters long';
            this.emit('security-violation', { type: 'weak-master-key', details: error });
            throw new Error(error);
        }
        // Clear existing key and cache
        this.clearMasterKey();
        this.masterKey = Buffer.from(masterKey, 'utf8');
        this.emit('key-derived', {
            algorithm: this.DEFAULT_KEY_DERIVATION,
            keyLength: this.DEFAULT_KEY_LENGTH,
        });
    }
    /**
     * Encrypt plaintext data using AES-256-GCM
     */
    async encrypt(plaintext, options = {}) {
        try {
            if (!this.masterKey) {
                throw new Error('Master key not set. Call setMasterKey() first.');
            }
            if (!plaintext) {
                throw new Error('Plaintext cannot be empty');
            }
            const algorithm = options.algorithm || this.DEFAULT_ALGORITHM;
            const keyDerivation = options.keyDerivation || this.DEFAULT_KEY_DERIVATION;
            const keyLength = options.keyLength || this.DEFAULT_KEY_LENGTH;
            const ivLength = options.ivLength || this.DEFAULT_IV_LENGTH;
            const tagLength = options.tagLength || this.DEFAULT_TAG_LENGTH;
            // Generate random salt and IV for this encryption
            const salt = (0, node_crypto_1.randomBytes)(32); // 256-bit salt
            const iv = (0, node_crypto_1.randomBytes)(ivLength);
            // Derive encryption key from master key and salt
            const derivedKey = await this.deriveKey(salt, keyLength, keyDerivation, options);
            // Create cipher
            const cipher = (0, node_crypto_1.createCipheriv)(algorithm, derivedKey, iv); // Type assertion for GCM methods
            // Add additional authenticated data if provided
            if (options.additionalData) {
                cipher.setAAD(Buffer.from(options.additionalData, 'utf8'));
            }
            // Encrypt the plaintext
            let encrypted = cipher.update(plaintext, 'utf8');
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            // Get authentication tag
            const authTag = cipher.getAuthTag();
            if (authTag.length !== tagLength) {
                throw new Error(`Authentication tag length mismatch: expected ${tagLength}, got ${authTag.length}`);
            }
            const result = {
                encrypted: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                salt: salt.toString('base64'),
                algorithm,
                keyDerivation,
                version: this.FORMAT_VERSION,
            };
            // Clear sensitive buffers
            derivedKey.fill(0);
            encrypted.fill(0);
            const metadata = {
                encryptedAt: new Date(),
                algorithm,
                keyDerivation,
                ivLength,
                tagLength,
                version: this.FORMAT_VERSION,
            };
            this.emit('encryption-completed', { metadata });
            return result;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown encryption error';
            this.emit('operation-failed', { operation: 'encrypt', error: message });
            throw new Error(`Encryption failed: ${message}`);
        }
    }
    /**
     * Decrypt encrypted data using AES-256-GCM
     */
    async decrypt(encryptedData, options = {}) {
        try {
            if (!this.masterKey) {
                throw new Error('Master key not set. Call setMasterKey() first.');
            }
            if (!encryptedData || !encryptedData.encrypted) {
                throw new Error('Invalid encrypted data structure');
            }
            // Validate format version
            if (encryptedData.version !== this.FORMAT_VERSION) {
                throw new Error(`Unsupported format version: ${encryptedData.version}`);
            }
            const { algorithm, keyDerivation, encrypted, iv, authTag, salt } = encryptedData;
            // Decode base64 components
            const encryptedBuffer = Buffer.from(encrypted, 'base64');
            const ivBuffer = Buffer.from(iv, 'base64');
            const authTagBuffer = Buffer.from(authTag, 'base64');
            const saltBuffer = Buffer.from(salt, 'base64');
            // Derive the same key used for encryption
            const keyLength = options.keyLength || this.DEFAULT_KEY_LENGTH;
            const derivedKey = await this.deriveKey(saltBuffer, keyLength, keyDerivation, options);
            // Create decipher
            const decipher = (0, node_crypto_1.createDecipheriv)(algorithm, derivedKey, ivBuffer); // Type assertion for GCM methods
            decipher.setAuthTag(authTagBuffer);
            // Add additional authenticated data if provided
            if (options.additionalData) {
                decipher.setAAD(Buffer.from(options.additionalData, 'utf8'));
            }
            // Decrypt the data
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const plaintext = decrypted.toString('utf8');
            // Clear sensitive buffers
            derivedKey.fill(0);
            decrypted.fill(0);
            encryptedBuffer.fill(0);
            const metadata = {
                encryptedAt: new Date(), // Decryption timestamp
                algorithm,
                keyDerivation,
                ivLength: ivBuffer.length,
                tagLength: authTagBuffer.length,
                version: encryptedData.version,
            };
            this.emit('decryption-completed', { metadata });
            return plaintext;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown decryption error';
            this.emit('operation-failed', { operation: 'decrypt', error: message });
            throw new Error(`Decryption failed: ${message}`);
        }
    }
    /**
     * Encrypt data and return as compact base64 string
     * (Convenience method for simple use cases)
     */
    async encryptToString(plaintext, options = {}) {
        const encryptedData = await this.encrypt(plaintext, options);
        return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
    }
    /**
     * Decrypt from compact base64 string
     * (Convenience method for simple use cases)
     */
    async decryptFromString(encryptedString, options = {}) {
        try {
            const encryptedData = JSON.parse(Buffer.from(encryptedString, 'base64').toString('utf8'));
            return await this.decrypt(encryptedData, options);
        }
        catch (error) {
            throw new Error(`Invalid encrypted string format: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Verify that encrypted data can be decrypted (integrity check)
     */
    async verifyIntegrity(encryptedData, options = {}) {
        try {
            await this.decrypt(encryptedData, options);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get encryption metadata without decrypting
     */
    getEncryptionMetadata(encryptedData) {
        return {
            encryptedAt: new Date(), // We don't store original timestamp
            algorithm: encryptedData.algorithm,
            keyDerivation: encryptedData.keyDerivation,
            ivLength: Buffer.from(encryptedData.iv, 'base64').length,
            tagLength: Buffer.from(encryptedData.authTag, 'base64').length,
            version: encryptedData.version,
        };
    }
    /**
     * Clear master key and sensitive data
     */
    clearMasterKey() {
        if (this.masterKey) {
            this.masterKey.fill(0);
            this.masterKey = null;
        }
        // Clear key cache
        for (const key of this.keyCache.values()) {
            key.fill(0);
        }
        this.keyCache.clear();
    }
    /**
     * Check if encryption service is ready to use
     */
    isReady() {
        return this.masterKey !== null;
    }
    /**
     * Get supported algorithms
     */
    getSupportedAlgorithms() {
        return [
            'aes-256-gcm',
            'aes-192-gcm',
            'aes-128-gcm',
            'chacha20-poly1305', // If available
        ];
    }
    /**
     * Derive encryption key from master key and salt using scrypt
     */
    async deriveKey(salt, keyLength, method = 'scrypt', _options = {}) {
        if (!this.masterKey) {
            throw new Error('Master key not available for key derivation');
        }
        const saltKey = salt.toString('base64');
        // Check cache first (optional optimization)
        if (this.keyCache.has(saltKey)) {
            const cachedKey = this.keyCache.get(saltKey);
            return Buffer.from(cachedKey); // Return copy
        }
        let derivedKey;
        switch (method) {
            case 'scrypt':
                derivedKey = (await this.scryptAsync(this.masterKey, salt, keyLength));
                break;
            default:
                throw new Error(`Unsupported key derivation method: ${method}`);
        }
        // Cache derived key (optional optimization, but be careful about memory)
        // Don't cache too many keys to avoid memory issues
        if (this.keyCache.size < 10) {
            this.keyCache.set(saltKey, Buffer.from(derivedKey));
        }
        return derivedKey;
    }
    /**
     * Secure cleanup of sensitive data
     */
    cleanup() {
        this.clearMasterKey();
        this.removeAllListeners();
    }
    // Type-safe event emitter overrides
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
}
exports.CredentialEncryption = CredentialEncryption;
// Default export
exports.default = CredentialEncryption;
//# sourceMappingURL=CredentialEncryption.js.map