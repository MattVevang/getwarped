/**
 * Encryption Service
 *
 * Provides comprehensive encryption and decryption utilities using Node.js crypto module.
 * Handles symmetric encryption (AES-256-GCM), key derivation (PBKDF2), secure random generation,
 * and cryptographic hashing for secure data storage and transmission.
 *
 * @fileoverview Encryption utilities with Node.js crypto module
 */

import * as crypto from 'crypto';

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
export class EncryptionService {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 12, // 96 bits for GCM
    tagLength: 16, // 128 bits
    saltLength: 32, // 256 bits
    iterations: 100000, // PBKDF2 iterations
  };

  private static readonly SUPPORTED_ALGORITHMS = [
    'aes-256-gcm',
    'aes-256-cbc',
    'aes-192-gcm',
    'aes-192-cbc',
    'aes-128-gcm',
    'aes-128-cbc',
  ];

  private static readonly HASH_ALGORITHMS = ['sha256', 'sha512', 'sha1', 'md5'];

  /**
   * Encrypt data using AES-256-GCM with password-based key derivation
   */
  static encrypt(
    data: string,
    password: string,
    config?: Partial<EncryptionConfig>
  ): EncryptionResult {
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
      const key = crypto.pbkdf2Sync(
        password,
        salt,
        encryptionConfig.iterations,
        encryptionConfig.keyLength,
        'sha256'
      );

      // Create cipher
      const cipher = crypto.createCipher(encryptionConfig.algorithm, key);
      cipher.setAutoPadding(true);

      // For GCM mode, set IV
      if (encryptionConfig.algorithm.includes('gcm')) {
        // Use createCipheriv for GCM mode with explicit IV
        const gcmCipher = crypto.createCipheriv(
          encryptionConfig.algorithm,
          key,
          iv
        ) as crypto.CipherGCM;

        let encrypted = gcmCipher.update(data, 'utf8', 'hex');
        encrypted += gcmCipher.final('hex');

        const tag = gcmCipher.getAuthTag();

        const encryptedData: EncryptedData = {
          data: encrypted,
          iv: iv.toString('hex'),
          tag: tag.toString('hex'),
          salt: salt.toString('hex'),
          algorithm: encryptionConfig.algorithm,
          timestamp: Date.now(),
        };

        return { success: true, encrypted: encryptedData };
      } else {
        // CBC mode
        const cbcCipher = crypto.createCipheriv(encryptionConfig.algorithm, key, iv);

        let encrypted = cbcCipher.update(data, 'utf8', 'hex');
        encrypted += cbcCipher.final('hex');

        const encryptedData: EncryptedData = {
          data: encrypted,
          iv: iv.toString('hex'),
          salt: salt.toString('hex'),
          algorithm: encryptionConfig.algorithm,
          timestamp: Date.now(),
        };

        return { success: true, encrypted: encryptedData };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed',
      };
    }
  }

  /**
   * Decrypt data using stored encryption parameters
   */
  static decrypt(encryptedData: EncryptedData, password: string): DecryptionResult {
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
      const key = crypto.pbkdf2Sync(
        password,
        salt,
        this.DEFAULT_CONFIG.iterations,
        keyLength,
        'sha256'
      );

      if (encryptedData.algorithm.includes('gcm')) {
        // GCM mode decryption
        if (!encryptedData.tag) {
          return { success: false, error: 'Authentication tag required for GCM mode' };
        }

        const decipher = crypto.createDecipheriv(
          encryptedData.algorithm,
          key,
          iv
        ) as crypto.DecipherGCM;
        const tag = Buffer.from(encryptedData.tag, 'hex');
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return { success: true, decrypted };
      } else {
        // CBC mode decryption
        const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);

        let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return { success: true, decrypted };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed',
      };
    }
  }

  /**
   * Generate secure random bytes
   */
  static generateRandomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Generate secure random string
   */
  static generateRandomString(length: number, encoding: BufferEncoding = 'hex'): string {
    const bytes = crypto.randomBytes(Math.ceil(length / 2));
    return bytes.toString(encoding).slice(0, length);
  }

  /**
   * Generate cryptographically secure random UUID
   */
  static generateSecureUuid(): string {
    return crypto.randomUUID();
  }

  /**
   * Derive key from password using PBKDF2
   */
  static deriveKey(password: string, options: KeyDerivationOptions): Buffer {
    return crypto.pbkdf2Sync(
      password,
      options.salt,
      options.iterations,
      options.keyLength,
      options.digest
    );
  }

  /**
   * Generate secure salt
   */
  static generateSalt(length: number = 32): Buffer {
    return crypto.randomBytes(length);
  }

  /**
   * Hash data using specified algorithm
   */
  static hash(data: string, options: HashOptions = { algorithm: 'sha256' }): string {
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
    const validEncodings: Array<'hex' | 'base64' | 'base64url'> = ['hex', 'base64', 'base64url'];
    const digestEncoding = validEncodings.includes(encoding as any)
      ? (encoding as 'hex' | 'base64' | 'base64url')
      : 'hex';
    return hash.digest(digestEncoding);
  }

  /**
   * Verify hash against data
   */
  static verifyHash(
    data: string,
    expectedHash: string,
    options: HashOptions = { algorithm: 'sha256' }
  ): boolean {
    try {
      const computedHash = this.hash(data, options);
      return this.constantTimeEquals(computedHash, expectedHash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Create HMAC (Hash-based Message Authentication Code)
   */
  static createHmac(data: string, key: string | Buffer, algorithm: string = 'sha256'): string {
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
  static verifyHmac(
    data: string,
    expectedHmac: string,
    key: string | Buffer,
    algorithm: string = 'sha256'
  ): boolean {
    try {
      const computedHmac = this.createHmac(data, key, algorithm);
      return this.constantTimeEquals(computedHmac, expectedHmac);
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt data with public key (RSA)
   */
  static encryptWithPublicKey(data: string, publicKey: string | Buffer): Buffer {
    return crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(data, 'utf8')
    );
  }

  /**
   * Decrypt data with private key (RSA)
   */
  static decryptWithPrivateKey(encryptedData: Buffer, privateKey: string | Buffer): string {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedData
    );
    return decrypted.toString('utf8');
  }

  /**
   * Generate RSA key pair
   */
  static generateKeyPair(keySize: number = 2048): { publicKey: string; privateKey: string } {
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
  static sign(data: string, privateKey: string | Buffer, algorithm: string = 'sha256'): Buffer {
    const sign = crypto.createSign(algorithm);
    sign.update(data, 'utf8');
    return sign.sign(privateKey);
  }

  /**
   * Verify digital signature
   */
  static verify(
    data: string,
    signature: Buffer,
    publicKey: string | Buffer,
    algorithm: string = 'sha256'
  ): boolean {
    try {
      const verify = crypto.createVerify(algorithm);
      verify.update(data, 'utf8');
      return verify.verify(publicKey, signature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Secure memory clearing (best effort)
   */
  static clearBuffer(buffer: Buffer): void {
    if (buffer && buffer.length > 0) {
      buffer.fill(0);
    }
  }

  /**
   * Secure string clearing (best effort)
   */
  static clearString(_str: string): string {
    // JavaScript strings are immutable, so this is just for consistency
    // In practice, sensitive strings should be handled as Buffers when possible
    return '';
  }

  /**
   * Constant time string comparison to prevent timing attacks
   */
  private static constantTimeEquals(a: string, b: string): boolean {
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
  private static getKeyLengthFromAlgorithm(algorithm: string): number {
    if (algorithm.includes('256')) {
      return 32; // 256 bits
    } else if (algorithm.includes('192')) {
      return 24; // 192 bits
    } else if (algorithm.includes('128')) {
      return 16; // 128 bits
    }
    return 32; // Default to 256 bits
  }

  /**
   * Check if algorithm is supported
   */
  static isAlgorithmSupported(algorithm: string): boolean {
    return this.SUPPORTED_ALGORITHMS.includes(algorithm);
  }

  /**
   * Get list of supported algorithms
   */
  static getSupportedAlgorithms(): string[] {
    return [...this.SUPPORTED_ALGORITHMS];
  }

  /**
   * Get list of supported hash algorithms
   */
  static getSupportedHashAlgorithms(): string[] {
    return [...this.HASH_ALGORITHMS];
  }

  /**
   * Get default encryption configuration
   */
  static getDefaultConfig(): EncryptionConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Validate encryption configuration
   */
  static validateConfig(config: EncryptionConfig): { valid: boolean; error?: string } {
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

export default EncryptionService;
