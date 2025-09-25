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
import { EventEmitter } from 'node:events';
/**
 * Encrypted data structure containing all necessary components
 */
interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
    salt: string;
    algorithm: string;
    keyDerivation: string;
    version: number;
}
/**
 * Encryption metadata for tracking and auditing
 */
interface EncryptionMetadata {
    encryptedAt: Date;
    algorithm: string;
    keyDerivation: string;
    ivLength: number;
    tagLength: number;
    version: number;
}
/**
 * Configuration options for encryption operations
 */
interface EncryptionOptions {
    algorithm?: string;
    keyDerivation?: string;
    keyLength?: number;
    ivLength?: number;
    tagLength?: number;
    iterations?: number;
    memoryFactor?: number;
    parallelization?: number;
    additionalData?: string;
}
/**
 * Events emitted by CredentialEncryption
 */
interface CredentialEncryptionEvents {
    'encryption-completed': {
        metadata: EncryptionMetadata;
    };
    'decryption-completed': {
        metadata: EncryptionMetadata;
    };
    'key-derived': {
        algorithm: string;
        keyLength: number;
    };
    'operation-failed': {
        operation: string;
        error: string;
    };
    'security-violation': {
        type: string;
        details: string;
    };
}
/**
 * Production-grade credential encryption service
 *
 * Provides secure encryption/decryption operations for sensitive credential data
 * using AES-256-GCM with proper key derivation and authenticated encryption.
 */
export declare class CredentialEncryption extends EventEmitter {
    private readonly DEFAULT_ALGORITHM;
    private readonly DEFAULT_KEY_DERIVATION;
    private readonly DEFAULT_KEY_LENGTH;
    private readonly DEFAULT_IV_LENGTH;
    private readonly DEFAULT_TAG_LENGTH;
    private readonly FORMAT_VERSION;
    private readonly scryptAsync;
    private masterKey;
    private keyCache;
    constructor(masterKey?: string);
    /**
     * Set the master key used for key derivation
     */
    setMasterKey(masterKey: string): void;
    /**
     * Encrypt plaintext data using AES-256-GCM
     */
    encrypt(plaintext: string, options?: EncryptionOptions): Promise<EncryptedData>;
    /**
     * Decrypt encrypted data using AES-256-GCM
     */
    decrypt(encryptedData: EncryptedData, options?: EncryptionOptions): Promise<string>;
    /**
     * Encrypt data and return as compact base64 string
     * (Convenience method for simple use cases)
     */
    encryptToString(plaintext: string, options?: EncryptionOptions): Promise<string>;
    /**
     * Decrypt from compact base64 string
     * (Convenience method for simple use cases)
     */
    decryptFromString(encryptedString: string, options?: EncryptionOptions): Promise<string>;
    /**
     * Verify that encrypted data can be decrypted (integrity check)
     */
    verifyIntegrity(encryptedData: EncryptedData, options?: EncryptionOptions): Promise<boolean>;
    /**
     * Get encryption metadata without decrypting
     */
    getEncryptionMetadata(encryptedData: EncryptedData): EncryptionMetadata;
    /**
     * Clear master key and sensitive data
     */
    clearMasterKey(): void;
    /**
     * Check if encryption service is ready to use
     */
    isReady(): boolean;
    /**
     * Get supported algorithms
     */
    getSupportedAlgorithms(): string[];
    /**
     * Derive encryption key from master key and salt using scrypt
     */
    private deriveKey;
    /**
     * Secure cleanup of sensitive data
     */
    private cleanup;
    emit<K extends keyof CredentialEncryptionEvents>(event: K, ...args: [CredentialEncryptionEvents[K]]): boolean;
    on<K extends keyof CredentialEncryptionEvents>(event: K, listener: (arg: CredentialEncryptionEvents[K]) => void): this;
    once<K extends keyof CredentialEncryptionEvents>(event: K, listener: (arg: CredentialEncryptionEvents[K]) => void): this;
}
export type { EncryptedData, EncryptionMetadata, EncryptionOptions, CredentialEncryptionEvents };
export default CredentialEncryption;
//# sourceMappingURL=CredentialEncryption.d.ts.map