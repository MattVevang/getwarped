/**
 * Credential Storage
 *
 * Provides secure, OS-native credential storage using keytar.
 * Handles encryption, key derivation, and secure credential management
 * with proper lifecycle and cleanup operations.
 *
 * @fileoverview OS-native credential storage with encryption and security
 */

import * as keytar from 'keytar';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { InputValidator, Validators } from '../../shared/validation/InputValidator';

/**
 * Credential metadata interface
 */
export interface CredentialMetadata {
  /** Credential identifier */
  id: string;
  /** Service identifier */
  serviceId: string;
  /** User identifier */
  userId: string;
  /** Credential type */
  type: CredentialType;
  /** Credential description/label */
  label: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last access timestamp */
  lastAccessedAt?: Date;
  /** Expiration timestamp (if applicable) */
  expiresAt?: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Credential types
 */
export enum CredentialType {
  PASSWORD = 'password',
  API_KEY = 'api-key',
  TOKEN = 'token',
  CERTIFICATE = 'certificate',
  SSH_KEY = 'ssh-key',
  OAUTH_TOKEN = 'oauth-token',
  REFRESH_TOKEN = 'refresh-token',
}

/**
 * Credential storage request
 */
export interface StoreCredentialRequest {
  /** Service identifier */
  serviceId: string;
  /** User identifier */
  userId: string;
  /** Credential type */
  type: CredentialType;
  /** Credential label */
  label: string;
  /** Credential value */
  value: string;
  /** Expiration timestamp (optional) */
  expiresAt?: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Credential retrieval request
 */
export interface RetrieveCredentialRequest {
  /** Credential identifier */
  credentialId: string;
}

/**
 * Credential search request
 */
export interface SearchCredentialRequest {
  /** Service identifier (optional) */
  serviceId?: string;
  /** User identifier (optional) */
  userId?: string;
  /** Credential type (optional) */
  type?: CredentialType;
  /** Include expired credentials */
  includeExpired?: boolean;
}

/**
 * Credential update request
 */
export interface UpdateCredentialRequest {
  /** Credential identifier */
  credentialId: string;
  /** New credential value */
  value?: string;
  /** New label */
  label?: string;
  /** New expiration */
  expiresAt?: Date;
  /** Updated metadata */
  metadata?: Record<string, any>;
}

/**
 * Credential validation result
 */
export interface CredentialValidationResult {
  /** Whether credential is valid */
  valid: boolean;
  /** Validation error message */
  error?: string;
  /** Whether credential is expired */
  expired?: boolean;
}

/**
 * Credential storage events
 */
export enum CredentialEvent {
  /** Credential stored */
  STORED = 'credential:stored',
  /** Credential retrieved */
  RETRIEVED = 'credential:retrieved',
  /** Credential updated */
  UPDATED = 'credential:updated',
  /** Credential deleted */
  DELETED = 'credential:deleted',
  /** Credential expired */
  EXPIRED = 'credential:expired',
  /** Credential accessed */
  ACCESSED = 'credential:accessed',
}

/**
 * Credential Storage class for secure OS-native credential management
 */
export class CredentialStorage extends EventEmitter {
  private readonly serviceName = 'GetWarped';
  private readonly metadataPrefix = 'metadata:';
  private readonly credentialPrefix = 'credential:';
  private readonly encryptionAlgorithm = 'aes-256-gcm';
  private readonly keyDerivationRounds = 100000;
  private masterKey?: Buffer | undefined;

  constructor() {
    super();
  }

  /**
   * Initialize credential storage with master key
   */
  async initialize(masterPassword?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (masterPassword) {
        // Derive master key from password
        const salt = await this.getOrCreateSalt();
        this.masterKey = crypto.pbkdf2Sync(
          masterPassword,
          salt,
          this.keyDerivationRounds,
          32,
          'sha512'
        );
      } else {
        // Generate random master key for session-based encryption
        this.masterKey = crypto.randomBytes(32);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
      };
    }
  }

  /**
   * Store a credential securely
   */
  async storeCredential(
    request: StoreCredentialRequest
  ): Promise<{ success: boolean; credentialId?: string; error?: string }> {
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
      const credentialId = this.generateCredentialId(
        request.serviceId,
        request.userId,
        request.label
      );

      // Create metadata
      const metadata: CredentialMetadata = {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store credential',
      };
    }
  }

  /**
   * Retrieve a credential
   */
  async retrieveCredential(
    request: RetrieveCredentialRequest
  ): Promise<{
    success: boolean;
    credential?: string;
    metadata?: CredentialMetadata;
    error?: string;
  }> {
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

      const metadata = metadataResult.metadata!;

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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve credential',
      };
    }
  }

  /**
   * Update a credential
   */
  async updateCredential(
    request: UpdateCredentialRequest
  ): Promise<{ success: boolean; error?: string }> {
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

      const metadata = metadataResult.metadata!;

      // Update credential value if provided
      if (request.value) {
        const encryptedValue = await this.encryptCredential(request.value);
        const credentialAccount = this.buildCredentialAccount(request.credentialId);
        await keytar.setPassword(this.serviceName, credentialAccount, encryptedValue);
      }

      // Update metadata
      if (request.label) metadata.label = request.label;
      if (request.expiresAt !== undefined) metadata.expiresAt = request.expiresAt;
      if (request.metadata) {
        metadata.metadata = { ...metadata.metadata, ...request.metadata };
      }

      // Store updated metadata
      await this.updateCredentialMetadata(request.credentialId, metadata);

      // Emit event
      this.emit(CredentialEvent.UPDATED, { credentialId: request.credentialId, metadata });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update credential',
      };
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete credential',
      };
    }
  }

  /**
   * Search for credentials
   */
  async searchCredentials(
    request: SearchCredentialRequest = {}
  ): Promise<{ success: boolean; credentials?: CredentialMetadata[]; error?: string }> {
    try {
      // Get all credentials
      const credentials = await keytar.findCredentials(this.serviceName);
      const results: CredentialMetadata[] = [];
      const now = Date.now();

      for (const cred of credentials) {
        // Only process metadata entries
        if (!cred.account.startsWith(this.metadataPrefix)) {
          continue;
        }

        try {
          const metadata: CredentialMetadata = JSON.parse(cred.password);

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
        } catch (parseError) {
          // Skip invalid metadata entries
          continue;
        }
      }

      return { success: true, credentials: results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search credentials',
      };
    }
  }

  /**
   * Clear all credentials for a service
   */
  async clearServiceCredentials(
    serviceId: string
  ): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      // Validate service ID
      const serviceValidation = Validators.validateUUID(serviceId);
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear service credentials',
      };
    }
  }

  /**
   * Clear expired credentials
   */
  async clearExpiredCredentials(): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear expired credentials',
      };
    }
  }

  /**
   * Encrypt credential value
   */
  private async encryptCredential(value: string): Promise<string> {
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
  private async decryptCredential(encryptedValue: string): Promise<string> {
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
  private async getOrCreateSalt(): Promise<Buffer> {
    const saltAccount = 'encryption:salt';

    try {
      const existingSalt = await keytar.getPassword(this.serviceName, saltAccount);
      if (existingSalt) {
        return Buffer.from(existingSalt, 'hex');
      }
    } catch (error) {
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
  private async getCredentialMetadata(
    credentialId: string
  ): Promise<{ success: boolean; metadata?: CredentialMetadata; error?: string }> {
    try {
      const metadataAccount = this.buildMetadataAccount(credentialId);
      const metadataJson = await keytar.getPassword(this.serviceName, metadataAccount);

      if (!metadataJson) {
        return { success: false, error: 'Credential metadata not found' };
      }

      const metadata: CredentialMetadata = JSON.parse(metadataJson);

      // Convert date strings back to Date objects
      metadata.createdAt = new Date(metadata.createdAt);
      if (metadata.lastAccessedAt) {
        metadata.lastAccessedAt = new Date(metadata.lastAccessedAt);
      }
      if (metadata.expiresAt) {
        metadata.expiresAt = new Date(metadata.expiresAt);
      }

      return { success: true, metadata };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get credential metadata',
      };
    }
  }

  /**
   * Update credential metadata
   */
  private async updateCredentialMetadata(
    credentialId: string,
    metadata: CredentialMetadata
  ): Promise<void> {
    const metadataAccount = this.buildMetadataAccount(credentialId);
    await keytar.setPassword(this.serviceName, metadataAccount, JSON.stringify(metadata));
  }

  /**
   * Generate unique credential ID
   */
  private generateCredentialId(serviceId: string, userId: string, label: string): string {
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
  private buildCredentialAccount(credentialId: string): string {
    return `${this.credentialPrefix}${credentialId}`;
  }

  /**
   * Build metadata account string
   */
  private buildMetadataAccount(credentialId: string): string {
    return `${this.metadataPrefix}${credentialId}`;
  }

  /**
   * Validate store credential request
   */
  private validateStoreRequest(request: StoreCredentialRequest): {
    valid: boolean;
    error?: string;
  } {
    const serviceValidation = Validators.validateUUID(request.serviceId);
    if (!serviceValidation.valid) {
      return { valid: false, error: 'Invalid service ID format' };
    }

    const userValidation = InputValidator.validateText(request.userId, { minLength: 1 });
    if (!userValidation.valid) {
      return { valid: false, error: 'Invalid user ID' };
    }

    const labelValidation = InputValidator.validateText(request.label, {
      minLength: 1,
      maxLength: 255,
    });
    if (!labelValidation.valid) {
      return { valid: false, error: 'Invalid label' };
    }

    const valueValidation = InputValidator.validateText(request.value, { minLength: 1 });
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
  private validateRetrieveRequest(request: RetrieveCredentialRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request.credentialId || typeof request.credentialId !== 'string') {
      return { valid: false, error: 'Invalid credential ID' };
    }

    return { valid: true };
  }

  /**
   * Validate update credential request
   */
  private validateUpdateRequest(request: UpdateCredentialRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request.credentialId || typeof request.credentialId !== 'string') {
      return { valid: false, error: 'Invalid credential ID' };
    }

    if (request.value !== undefined) {
      const valueValidation = InputValidator.validateText(request.value, { minLength: 1 });
      if (!valueValidation.valid) {
        return { valid: false, error: 'Invalid credential value' };
      }
    }

    if (request.label !== undefined) {
      const labelValidation = InputValidator.validateText(request.label, {
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
  destroy(): void {
    // Clear master key from memory
    if (this.masterKey) {
      this.masterKey.fill(0);
      this.masterKey = undefined;
    }

    // Remove all listeners
    this.removeAllListeners();
  }
}

export default CredentialStorage;
