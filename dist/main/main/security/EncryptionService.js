"use strict";
/**
 * Encryption Service
 *
 * Provides comprehensive encryption and decryption utilities using Node.js crypto module.
 * Handles symmetric encryption (AES-256-GCM), key derivation (PBKDF2), secure random generation,
 * and cryptographic hashing for secure data storage and transmission.
 *
 * @fileoverview Encryption utilities with Node.js crypto module
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
exports.EncryptionService = void 0;
const crypto = __importStar(require("crypto"));
/**
 * Encryption Service class for cryptographic operations
 */
class EncryptionService {
    static DEFAULT_CONFIG = {
        algorithm: 'aes-256-gcm',
        keyLength: 32, // 256 bits
        ivLength: 12, // 96 bits for GCM
        tagLength: 16, // 128 bits
        saltLength: 32, // 256 bits
        iterations: 100000, // PBKDF2 iterations
    };
    static SUPPORTED_ALGORITHMS = [
        'aes-256-gcm',
        'aes-256-cbc',
        'aes-192-gcm',
        'aes-192-cbc',
        'aes-128-gcm',
        'aes-128-cbc',
    ];
    static HASH_ALGORITHMS = ['sha256', 'sha512', 'sha1', 'md5'];
    /**
     * Encrypt data using AES-256-GCM with password-based key derivation
     */
    static encrypt(data, password, config) {
        try {
            const encryptionConfig = { ...this.DEFAULT_CONFIG, ...config };
            // Validate algorithm
            if (!this.SUPPORTED_ALGORITHMS.includes(encryptionConfig.algorithm)) {
                return { success: false, error: 'Unsupported encryption algorithm' };
            }
            // Generate random salt and IV
            const salt = crypto.randomBytes(encryptionConfig.saltLength);
            const iv = crypto.randomBytes(encryptionConfig.ivLength);
            // Derive key from password
            const key = crypto.pbkdf2Sync(password, salt, encryptionConfig.iterations, encryptionConfig.keyLength, 'sha256');
            // Create cipher
            const cipher = crypto.createCipher(encryptionConfig.algorithm, key);
            cipher.setAutoPadding(true);
            // For GCM mode, set IV
            if (encryptionConfig.algorithm.includes('gcm')) {
                // Use createCipheriv for GCM mode with explicit IV
                const gcmCipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);
                let encrypted = gcmCipher.update(data, 'utf8', 'hex');
                encrypted += gcmCipher.final('hex');
                const tag = gcmCipher.getAuthTag();
                const encryptedData = {
                    data: encrypted,
                    iv: iv.toString('hex'),
                    tag: tag.toString('hex'),
                    salt: salt.toString('hex'),
                    algorithm: encryptionConfig.algorithm,
                    timestamp: Date.now(),
                };
                return { success: true, encrypted: encryptedData };
            }
            else {
                // CBC mode
                const cbcCipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);
                let encrypted = cbcCipher.update(data, 'utf8', 'hex');
                encrypted += cbcCipher.final('hex');
                const encryptedData = {
                    data: encrypted,
                    iv: iv.toString('hex'),
                    salt: salt.toString('hex'),
                    algorithm: encryptionConfig.algorithm,
                    timestamp: Date.now(),
                };
                return { success: true, encrypted: encryptedData };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Encryption failed',
            };
        }
    }
    /**
     * Decrypt data using stored encryption parameters
     */
    static decrypt(encryptedData, password) {
        try {
            // Validate algorithm
            if (!this.SUPPORTED_ALGORITHMS.includes(encryptedData.algorithm)) {
                return { success: false, error: 'Unsupported encryption algorithm' };
            }
            // Convert hex strings back to buffers
            const salt = Buffer.from(encryptedData.salt, 'hex');
            const iv = Buffer.from(encryptedData.iv, 'hex');
            // Determine key length from algorithm
            const keyLength = this.getKeyLengthFromAlgorithm(encryptedData.algorithm);
            // Derive key from password using same parameters
            const key = crypto.pbkdf2Sync(password, salt, this.DEFAULT_CONFIG.iterations, keyLength, 'sha256');
            if (encryptedData.algorithm.includes('gcm')) {
                // GCM mode decryption
                if (!encryptedData.tag) {
                    return { success: false, error: 'Authentication tag required for GCM mode' };
                }
                const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
                const tag = Buffer.from(encryptedData.tag, 'hex');
                decipher.setAuthTag(tag);
                let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return { success: true, decrypted };
            }
            else {
                // CBC mode decryption
                const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
                let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
                decrypted += decipher.final('utf8');
                return { success: true, decrypted };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Decryption failed',
            };
        }
    }
    /**
     * Generate secure random bytes
     */
    static generateRandomBytes(length) {
        return crypto.randomBytes(length);
    }
    /**
     * Generate secure random string
     */
    static generateRandomString(length, encoding = 'hex') {
        const bytes = crypto.randomBytes(Math.ceil(length / 2));
        return bytes.toString(encoding).slice(0, length);
    }
    /**
     * Generate cryptographically secure random UUID
     */
    static generateSecureUuid() {
        return crypto.randomUUID();
    }
    /**
     * Derive key from password using PBKDF2
     */
    static deriveKey(password, options) {
        return crypto.pbkdf2Sync(password, options.salt, options.iterations, options.keyLength, options.digest);
    }
    /**
     * Generate secure salt
     */
    static generateSalt(length = 32) {
        return crypto.randomBytes(length);
    }
    /**
     * Hash data using specified algorithm
     */
    static hash(data, options = { algorithm: 'sha256' }) {
        if (!this.HASH_ALGORITHMS.includes(options.algorithm)) {
            throw new Error(`Unsupported hash algorithm: ${options.algorithm}`);
        }
        const hash = crypto.createHash(options.algorithm);
        if (options.salt) {
            hash.update(options.salt);
        }
        hash.update(data, 'utf8');
        const encoding = options.encoding || 'hex';
        // Ensure encoding is compatible with digest method
        const validEncodings = ['hex', 'base64', 'base64url'];
        const digestEncoding = validEncodings.includes(encoding)
            ? encoding
            : 'hex';
        return hash.digest(digestEncoding);
    }
    /**
     * Verify hash against data
     */
    static verifyHash(data, expectedHash, options = { algorithm: 'sha256' }) {
        try {
            const computedHash = this.hash(data, options);
            return this.constantTimeEquals(computedHash, expectedHash);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Create HMAC (Hash-based Message Authentication Code)
     */
    static createHmac(data, key, algorithm = 'sha256') {
        if (!this.HASH_ALGORITHMS.includes(algorithm)) {
            throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
        }
        const hmac = crypto.createHmac(algorithm, key);
        hmac.update(data, 'utf8');
        return hmac.digest('hex');
    }
    /**
     * Verify HMAC
     */
    static verifyHmac(data, expectedHmac, key, algorithm = 'sha256') {
        try {
            const computedHmac = this.createHmac(data, key, algorithm);
            return this.constantTimeEquals(computedHmac, expectedHmac);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Encrypt data with public key (RSA)
     */
    static encryptWithPublicKey(data, publicKey) {
        return crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        }, Buffer.from(data, 'utf8'));
    }
    /**
     * Decrypt data with private key (RSA)
     */
    static decryptWithPrivateKey(encryptedData, privateKey) {
        const decrypted = crypto.privateDecrypt({
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        }, encryptedData);
        return decrypted.toString('utf8');
    }
    /**
     * Generate RSA key pair
     */
    static generateKeyPair(keySize = 2048) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: keySize,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        return { publicKey, privateKey };
    }
    /**
     * Create digital signature
     */
    static sign(data, privateKey, algorithm = 'sha256') {
        const sign = crypto.createSign(algorithm);
        sign.update(data, 'utf8');
        return sign.sign(privateKey);
    }
    /**
     * Verify digital signature
     */
    static verify(data, signature, publicKey, algorithm = 'sha256') {
        try {
            const verify = crypto.createVerify(algorithm);
            verify.update(data, 'utf8');
            return verify.verify(publicKey, signature);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Secure memory clearing (best effort)
     */
    static clearBuffer(buffer) {
        if (buffer && buffer.length > 0) {
            buffer.fill(0);
        }
    }
    /**
     * Secure string clearing (best effort)
     */
    static clearString(_str) {
        // JavaScript strings are immutable, so this is just for consistency
        // In practice, sensitive strings should be handled as Buffers when possible
        return '';
    }
    /**
     * Constant time string comparison to prevent timing attacks
     */
    static constantTimeEquals(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }
    /**
     * Get key length from algorithm name
     */
    static getKeyLengthFromAlgorithm(algorithm) {
        if (algorithm.includes('256')) {
            return 32; // 256 bits
        }
        else if (algorithm.includes('192')) {
            return 24; // 192 bits
        }
        else if (algorithm.includes('128')) {
            return 16; // 128 bits
        }
        return 32; // Default to 256 bits
    }
    /**
     * Check if algorithm is supported
     */
    static isAlgorithmSupported(algorithm) {
        return this.SUPPORTED_ALGORITHMS.includes(algorithm);
    }
    /**
     * Get list of supported algorithms
     */
    static getSupportedAlgorithms() {
        return [...this.SUPPORTED_ALGORITHMS];
    }
    /**
     * Get list of supported hash algorithms
     */
    static getSupportedHashAlgorithms() {
        return [...this.HASH_ALGORITHMS];
    }
    /**
     * Get default encryption configuration
     */
    static getDefaultConfig() {
        return { ...this.DEFAULT_CONFIG };
    }
    /**
     * Validate encryption configuration
     */
    static validateConfig(config) {
        if (!this.SUPPORTED_ALGORITHMS.includes(config.algorithm)) {
            return { valid: false, error: 'Unsupported algorithm' };
        }
        if (config.keyLength < 16 || config.keyLength > 64) {
            return { valid: false, error: 'Invalid key length' };
        }
        if (config.ivLength < 8 || config.ivLength > 16) {
            return { valid: false, error: 'Invalid IV length' };
        }
        if (config.iterations < 1000) {
            return { valid: false, error: 'Insufficient iterations for PBKDF2' };
        }
        return { valid: true };
    }
}
exports.EncryptionService = EncryptionService;
exports.default = EncryptionService;
//# sourceMappingURL=EncryptionService.js.map