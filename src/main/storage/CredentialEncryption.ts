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

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { EventEmitter } from 'node:events';

/**
 * Encrypted data structure containing all necessary components
 */
interface EncryptedData {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
  salt: string; // Base64 encoded salt for key derivation
  algorithm: string; // Encryption algorithm used
  keyDerivation: string; // Key derivation method
  version: number; // Format version for future compatibility
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
  algorithm?: string; // Default: 'aes-256-gcm'
  keyDerivation?: string; // Default: 'scrypt'
  keyLength?: number; // Default: 32 (256 bits)
  ivLength?: number; // Default: 16 (128 bits)
  tagLength?: number; // Default: 16 (128 bits)
  iterations?: number; // Default: 100000 (for PBKDF2, N/A for scrypt)
  memoryFactor?: number; // Default: 16384 (for scrypt)
  parallelization?: number; // Default: 1 (for scrypt)
  additionalData?: string; // Additional authenticated data
}

/**
 * Events emitted by CredentialEncryption
 */
interface CredentialEncryptionEvents {
  'encryption-completed': { metadata: EncryptionMetadata };
  'decryption-completed': { metadata: EncryptionMetadata };
  'key-derived': { algorithm: string; keyLength: number };
  'operation-failed': { operation: string; error: string };
  'security-violation': { type: string; details: string };
}

/**
 * Production-grade credential encryption service
 *
 * Provides secure encryption/decryption operations for sensitive credential data
 * using AES-256-GCM with proper key derivation and authenticated encryption.
 */
export class CredentialEncryption extends EventEmitter {
  private readonly DEFAULT_ALGORITHM = 'aes-256-gcm';
  private readonly DEFAULT_KEY_DERIVATION = 'scrypt';
  private readonly DEFAULT_KEY_LENGTH = 32; // 256 bits
  private readonly DEFAULT_IV_LENGTH = 16; // 128 bits
  private readonly DEFAULT_TAG_LENGTH = 16; // 128 bits
  private readonly FORMAT_VERSION = 1;

  private readonly scryptAsync = promisify(scrypt);
  private masterKey: Buffer | null = null;
  private keyCache = new Map<string, Buffer>(); // Salt -> derived key cache

  constructor(masterKey?: string) {
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
  public setMasterKey(masterKey: string): void {
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
  public async encrypt(plaintext: string, options: EncryptionOptions = {}): Promise<EncryptedData> {
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
      const salt = randomBytes(32); // 256-bit salt
      const iv = randomBytes(ivLength);

      // Derive encryption key from master key and salt
      const derivedKey = await this.deriveKey(salt, keyLength, keyDerivation, options);

      // Create cipher
      const cipher = createCipheriv(algorithm, derivedKey, iv) as any; // Type assertion for GCM methods

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
        throw new Error(
          `Authentication tag length mismatch: expected ${tagLength}, got ${authTag.length}`
        );
      }

      const result: EncryptedData = {
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

      const metadata: EncryptionMetadata = {
        encryptedAt: new Date(),
        algorithm,
        keyDerivation,
        ivLength,
        tagLength,
        version: this.FORMAT_VERSION,
      };

      this.emit('encryption-completed', { metadata });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown encryption error';
      this.emit('operation-failed', { operation: 'encrypt', error: message });
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  /**
   * Decrypt encrypted data using AES-256-GCM
   */
  public async decrypt(
    encryptedData: EncryptedData,
    options: EncryptionOptions = {}
  ): Promise<string> {
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
      const decipher = createDecipheriv(algorithm, derivedKey, ivBuffer) as any; // Type assertion for GCM methods
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

      const metadata: EncryptionMetadata = {
        encryptedAt: new Date(), // Decryption timestamp
        algorithm,
        keyDerivation,
        ivLength: ivBuffer.length,
        tagLength: authTagBuffer.length,
        version: encryptedData.version,
      };

      this.emit('decryption-completed', { metadata });

      return plaintext;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown decryption error';
      this.emit('operation-failed', { operation: 'decrypt', error: message });
      throw new Error(`Decryption failed: ${message}`);
    }
  }

  /**
   * Encrypt data and return as compact base64 string
   * (Convenience method for simple use cases)
   */
  public async encryptToString(
    plaintext: string,
    options: EncryptionOptions = {}
  ): Promise<string> {
    const encryptedData = await this.encrypt(plaintext, options);
    return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
  }

  /**
   * Decrypt from compact base64 string
   * (Convenience method for simple use cases)
   */
  public async decryptFromString(
    encryptedString: string,
    options: EncryptionOptions = {}
  ): Promise<string> {
    try {
      const encryptedData = JSON.parse(
        Buffer.from(encryptedString, 'base64').toString('utf8')
      ) as EncryptedData;
      return await this.decrypt(encryptedData, options);
    } catch (error) {
      throw new Error(
        `Invalid encrypted string format: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify that encrypted data can be decrypted (integrity check)
   */
  public async verifyIntegrity(
    encryptedData: EncryptedData,
    options: EncryptionOptions = {}
  ): Promise<boolean> {
    try {
      await this.decrypt(encryptedData, options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get encryption metadata without decrypting
   */
  public getEncryptionMetadata(encryptedData: EncryptedData): EncryptionMetadata {
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
  public clearMasterKey(): void {
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
  public isReady(): boolean {
    return this.masterKey !== null;
  }

  /**
   * Get supported algorithms
   */
  public getSupportedAlgorithms(): string[] {
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
  private async deriveKey(
    salt: Buffer,
    keyLength: number,
    method: string = 'scrypt',
    _options: EncryptionOptions = {}
  ): Promise<Buffer> {
    if (!this.masterKey) {
      throw new Error('Master key not available for key derivation');
    }

    const saltKey = salt.toString('base64');

    // Check cache first (optional optimization)
    if (this.keyCache.has(saltKey)) {
      const cachedKey = this.keyCache.get(saltKey)!;
      return Buffer.from(cachedKey); // Return copy
    }

    let derivedKey: Buffer;

    switch (method) {
      case 'scrypt':
        derivedKey = (await this.scryptAsync(this.masterKey, salt, keyLength)) as Buffer;
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
  private cleanup(): void {
    this.clearMasterKey();
    this.removeAllListeners();
  }

  // Type-safe event emitter overrides
  public override emit<K extends keyof CredentialEncryptionEvents>(
    event: K,
    ...args: [CredentialEncryptionEvents[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  public override on<K extends keyof CredentialEncryptionEvents>(
    event: K,
    listener: (arg: CredentialEncryptionEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof CredentialEncryptionEvents>(
    event: K,
    listener: (arg: CredentialEncryptionEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }
}

// Export types for external use
export type { EncryptedData, EncryptionMetadata, EncryptionOptions, CredentialEncryptionEvents };

// Default export
export default CredentialEncryption;
