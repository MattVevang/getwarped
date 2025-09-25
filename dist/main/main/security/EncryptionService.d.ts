/**
 * Encryption Service
 *
 * Provides comprehensive encryption and decryption utilities using Node.js crypto module.
 * Handles symmetric encryption (AES-256-GCM), key derivation (PBKDF2), secure random generation,
 * and cryptographic hashing for secure data storage and transmission.
 *
 * @fileoverview Encryption utilities with Node.js crypto module
 */
/**
 * Encryption algorithm configuration
 */
export interface EncryptionConfig {
    /** Algorithm to use */
    algorithm: string;
    /** Key length in bytes */
    keyLength: number;
    /** IV length in bytes */
    ivLength: number;
    /** Tag length for authenticated encryption */
    tagLength?: number;
    /** Salt length for key derivation */
    saltLength: number;
    /** PBKDF2 iterations */
    iterations: number;
}
/**
 * Encrypted data structure
 */
export interface EncryptedData {
    /** Encrypted data */
    data: string;
    /** Initialization vector */
    iv: string;
    /** Authentication tag (for GCM mode) */
    tag?: string;
    /** Salt used for key derivation */
    salt: string;
    /** Algorithm used */
    algorithm: string;
    /** Timestamp of encryption */
    timestamp: number;
}
/**
 * Key derivation options
 */
export interface KeyDerivationOptions {
    /** Salt for key derivation */
    salt: Buffer;
    /** Number of iterations */
    iterations: number;
    /** Desired key length */
    keyLength: number;
    /** Hash algorithm */
    digest: string;
}
/**
 * Hash options
 */
export interface HashOptions {
    /** Hash algorithm */
    algorithm: string;
    /** Salt for hashing */
    salt?: Buffer;
    /** Output encoding */
    encoding?: BufferEncoding;
}
/**
 * Encryption result
 */
export interface EncryptionResult {
    /** Whether encryption was successful */
    success: boolean;
    /** Encrypted data (if successful) */
    encrypted?: EncryptedData;
    /** Error message (if failed) */
    error?: string;
}
/**
 * Decryption result
 */
export interface DecryptionResult {
    /** Whether decryption was successful */
    success: boolean;
    /** Decrypted data (if successful) */
    decrypted?: string;
    /** Error message (if failed) */
    error?: string;
}
/**
 * Encryption Service class for cryptographic operations
 */
export declare class EncryptionService {
    private static readonly DEFAULT_CONFIG;
    private static readonly SUPPORTED_ALGORITHMS;
    private static readonly HASH_ALGORITHMS;
    /**
     * Encrypt data using AES-256-GCM with password-based key derivation
     */
    static encrypt(data: string, password: string, config?: Partial<EncryptionConfig>): EncryptionResult;
    /**
     * Decrypt data using stored encryption parameters
     */
    static decrypt(encryptedData: EncryptedData, password: string): DecryptionResult;
    /**
     * Generate secure random bytes
     */
    static generateRandomBytes(length: number): Buffer;
    /**
     * Generate secure random string
     */
    static generateRandomString(length: number, encoding?: BufferEncoding): string;
    /**
     * Generate cryptographically secure random UUID
     */
    static generateSecureUuid(): string;
    /**
     * Derive key from password using PBKDF2
     */
    static deriveKey(password: string, options: KeyDerivationOptions): Buffer;
    /**
     * Generate secure salt
     */
    static generateSalt(length?: number): Buffer;
    /**
     * Hash data using specified algorithm
     */
    static hash(data: string, options?: HashOptions): string;
    /**
     * Verify hash against data
     */
    static verifyHash(data: string, expectedHash: string, options?: HashOptions): boolean;
    /**
     * Create HMAC (Hash-based Message Authentication Code)
     */
    static createHmac(data: string, key: string | Buffer, algorithm?: string): string;
    /**
     * Verify HMAC
     */
    static verifyHmac(data: string, expectedHmac: string, key: string | Buffer, algorithm?: string): boolean;
    /**
     * Encrypt data with public key (RSA)
     */
    static encryptWithPublicKey(data: string, publicKey: string | Buffer): Buffer;
    /**
     * Decrypt data with private key (RSA)
     */
    static decryptWithPrivateKey(encryptedData: Buffer, privateKey: string | Buffer): string;
    /**
     * Generate RSA key pair
     */
    static generateKeyPair(keySize?: number): {
        publicKey: string;
        privateKey: string;
    };
    /**
     * Create digital signature
     */
    static sign(data: string, privateKey: string | Buffer, algorithm?: string): Buffer;
    /**
     * Verify digital signature
     */
    static verify(data: string, signature: Buffer, publicKey: string | Buffer, algorithm?: string): boolean;
    /**
     * Secure memory clearing (best effort)
     */
    static clearBuffer(buffer: Buffer): void;
    /**
     * Secure string clearing (best effort)
     */
    static clearString(_str: string): string;
    /**
     * Constant time string comparison to prevent timing attacks
     */
    private static constantTimeEquals;
    /**
     * Get key length from algorithm name
     */
    private static getKeyLengthFromAlgorithm;
    /**
     * Check if algorithm is supported
     */
    static isAlgorithmSupported(algorithm: string): boolean;
    /**
     * Get list of supported algorithms
     */
    static getSupportedAlgorithms(): string[];
    /**
     * Get list of supported hash algorithms
     */
    static getSupportedHashAlgorithms(): string[];
    /**
     * Get default encryption configuration
     */
    static getDefaultConfig(): EncryptionConfig;
    /**
     * Validate encryption configuration
     */
    static validateConfig(config: EncryptionConfig): {
        valid: boolean;
        error?: string;
    };
}
export default EncryptionService;
//# sourceMappingURL=EncryptionService.d.ts.map