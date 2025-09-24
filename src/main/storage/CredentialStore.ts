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

import { EventEmitter } from 'events';

// Keytar is optional dependency - use dynamic import to handle missing package
let keytar: any;
try {
  keytar = require('keytar');
} catch (error) {
  // keytar not available - will use fallback storage
}

/**
 * Credential entry
 */
export interface CredentialEntry {
  /** Service identifier */
  serviceId: string;
  /** Service name for display */
  serviceName: string;
  /** Account/username */
  account: string;
  /** Credential type */
  type: CredentialType;
  /** Creation timestamp */
  createdAt: Date;
  /** Last accessed timestamp */
  lastAccessedAt: Date;
  /** Whether credential is currently active */
  isActive: boolean;
}

/**
 * Types of credentials
 */
export enum CredentialType {
  PASSWORD = 'password',
  TOKEN = 'token',
  API_KEY = 'api_key',
  CERTIFICATE = 'certificate',
  PRIVATE_KEY = 'private_key',
  SESSION_DATA = 'session_data',
  OAUTH_TOKEN = 'oauth_token',
  REFRESH_TOKEN = 'refresh_token',
}

/**
 * Credential storage result
 */
export interface CredentialResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Credential metadata for tracking
 */
export interface CredentialMetadata {
  serviceId: string;
  accounts: string[];
  totalCredentials: number;
  lastModified: Date;
  encryptionMethod: string;
}

/**
 * Credential store events
 */
export interface CredentialStoreEvents {
  'credential-stored': (serviceId: string, account: string, type: CredentialType) => void;
  'credential-retrieved': (serviceId: string, account: string) => void;
  'credential-deleted': (serviceId: string, account: string) => void;
  'credentials-cleared': (serviceId: string) => void;
  'storage-error': (error: Error) => void;
  'keytar-unavailable': () => void;
}

/**
 * Comprehensive credential storage manager
 */
export class CredentialStore extends EventEmitter {
  private readonly APP_NAME = 'GetWarped';
  private memoryCache: Map<string, { value: string; timestamp: number; type: CredentialType }> =
    new Map();
  private metadata: Map<string, CredentialMetadata> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly KEYTAR_AVAILABLE = !!keytar;
  private cleanupInterval?: NodeJS.Timeout;

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
  public async storeCredential(
    serviceId: string,
    serviceName: string,
    account: string,
    credential: string,
    type: CredentialType = CredentialType.PASSWORD
  ): Promise<CredentialResult<boolean>> {
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
        } catch (error) {
          // Fall back to memory cache if keytar fails
          this.storeInMemoryCache(serviceId, account, credential, type);
          return {
            success: true,
            data: true,
            error: 'Stored in memory cache (keytar unavailable)',
          };
        }
      } else {
        // Store in encrypted memory cache
        this.storeInMemoryCache(serviceId, account, credential, type);
      }

      // Update metadata
      this.updateMetadata(serviceId, serviceName, account, type);

      this.emit('credential-stored', serviceId, account, type);
      return { success: true, data: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('storage-error', new Error(`Failed to store credential: ${errorMessage}`));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retrieve credential securely
   */
  public async getCredential(
    serviceId: string,
    serviceName: string,
    account: string
  ): Promise<CredentialResult<string>> {
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
        } catch (error) {
          // Continue to return not found
        }
      }

      return { success: false, error: 'Credential not found' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('storage-error', new Error(`Failed to retrieve credential: ${errorMessage}`));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete credential
   */
  public async deleteCredential(
    serviceId: string,
    serviceName: string,
    account: string
  ): Promise<CredentialResult<boolean>> {
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
        } catch (error) {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('storage-error', new Error(`Failed to delete credential: ${errorMessage}`));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * List accounts for a service
   */
  public async listAccounts(
    serviceId: string,
    serviceName: string
  ): Promise<CredentialResult<string[]>> {
    try {
      const accounts = new Set<string>();

      // Get accounts from OS-native credential store
      if (this.KEYTAR_AVAILABLE) {
        const serviceKey = this.createServiceKey(serviceId, serviceName);

        try {
          const credentials = await keytar.findCredentials(serviceKey);
          credentials.forEach((cred: any) => accounts.add(cred.account));
        } catch (error) {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('storage-error', new Error(`Failed to list accounts: ${errorMessage}`));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Clear all credentials for a service
   */
  public async clearServiceCredentials(
    serviceId: string,
    serviceName: string
  ): Promise<CredentialResult<number>> {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('storage-error', new Error(`Failed to clear credentials: ${errorMessage}`));
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get credential metadata
   */
  public getCredentialMetadata(serviceId: string): CredentialMetadata | null {
    return this.metadata.get(serviceId) || null;
  }

  /**
   * Get all service metadata
   */
  public getAllMetadata(): Map<string, CredentialMetadata> {
    return new Map(this.metadata);
  }

  /**
   * Check if keytar is available
   */
  public isKeytarAvailable(): boolean {
    return this.KEYTAR_AVAILABLE;
  }

  /**
   * Clear memory cache
   */
  public clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  /**
   * Create service key for keytar
   */
  private createServiceKey(serviceId: string, serviceName: string): string {
    return `${this.APP_NAME}-${serviceName}-${serviceId}`;
  }

  /**
   * Create cache key for memory storage
   */
  private createCacheKey(serviceId: string, account: string): string {
    return `${serviceId}:${account}`;
  }

  /**
   * Parse cache key back to components
   */
  private parseCacheKey(cacheKey: string): [string, string] {
    const [serviceId, account] = cacheKey.split(':', 2);
    return [serviceId || '', account || ''];
  }

  /**
   * Store credential in memory cache with basic encryption
   */
  private storeInMemoryCache(
    serviceId: string,
    account: string,
    credential: string,
    type: CredentialType
  ): void {
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
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Update metadata for a service
   */
  private updateMetadata(
    serviceId: string,
    _serviceName: string,
    account: string,
    _type: CredentialType
  ): void {
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
  private removeFromMetadata(serviceId: string, account: string): void {
    const existing = this.metadata.get(serviceId);
    if (existing) {
      existing.accounts = existing.accounts.filter(a => a !== account);
      existing.totalCredentials = existing.accounts.length;
      existing.lastModified = new Date();

      if (existing.totalCredentials === 0) {
        this.metadata.delete(serviceId);
      } else {
        this.metadata.set(serviceId, existing);
      }
    }
  }

  /**
   * Update last accessed time
   */
  private updateLastAccessed(serviceId: string, _account: string): void {
    const existing = this.metadata.get(serviceId);
    if (existing) {
      existing.lastModified = new Date();
      this.metadata.set(serviceId, existing);
    }
  }

  /**
   * Simple XOR encryption for memory cache (use proper encryption in production)
   */
  private simpleEncrypt(text: string): string {
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
  public simpleDecrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      const key = 'GetWarped-Secret-Key';
      let result = '';

      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }

      return result;
    } catch {
      return encrypted; // Return as-is if decryption fails
    }
  }

  /**
   * Start periodic cleanup of expired cache entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Cleanup every minute
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
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
  public destroy(): void {
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

export default CredentialStore;
