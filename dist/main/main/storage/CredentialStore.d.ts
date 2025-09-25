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
export declare enum CredentialType {
    PASSWORD = "password",
    TOKEN = "token",
    API_KEY = "api_key",
    CERTIFICATE = "certificate",
    PRIVATE_KEY = "private_key",
    SESSION_DATA = "session_data",
    OAUTH_TOKEN = "oauth_token",
    REFRESH_TOKEN = "refresh_token"
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
export declare class CredentialStore extends EventEmitter {
    private readonly APP_NAME;
    private memoryCache;
    private metadata;
    private readonly CACHE_TTL;
    private readonly KEYTAR_AVAILABLE;
    private cleanupInterval?;
    constructor();
    /**
     * Store credential securely
     */
    storeCredential(serviceId: string, serviceName: string, account: string, credential: string, type?: CredentialType): Promise<CredentialResult<boolean>>;
    /**
     * Retrieve credential securely
     */
    getCredential(serviceId: string, serviceName: string, account: string): Promise<CredentialResult<string>>;
    /**
     * Delete credential
     */
    deleteCredential(serviceId: string, serviceName: string, account: string): Promise<CredentialResult<boolean>>;
    /**
     * List accounts for a service
     */
    listAccounts(serviceId: string, serviceName: string): Promise<CredentialResult<string[]>>;
    /**
     * Clear all credentials for a service
     */
    clearServiceCredentials(serviceId: string, serviceName: string): Promise<CredentialResult<number>>;
    /**
     * Get credential metadata
     */
    getCredentialMetadata(serviceId: string): CredentialMetadata | null;
    /**
     * Get all service metadata
     */
    getAllMetadata(): Map<string, CredentialMetadata>;
    /**
     * Check if keytar is available
     */
    isKeytarAvailable(): boolean;
    /**
     * Clear memory cache
     */
    clearMemoryCache(): void;
    /**
     * Create service key for keytar
     */
    private createServiceKey;
    /**
     * Create cache key for memory storage
     */
    private createCacheKey;
    /**
     * Parse cache key back to components
     */
    private parseCacheKey;
    /**
     * Store credential in memory cache with basic encryption
     */
    private storeInMemoryCache;
    /**
     * Check if cache entry is valid
     */
    private isCacheValid;
    /**
     * Update metadata for a service
     */
    private updateMetadata;
    /**
     * Remove account from metadata
     */
    private removeFromMetadata;
    /**
     * Update last accessed time
     */
    private updateLastAccessed;
    /**
     * Simple XOR encryption for memory cache (use proper encryption in production)
     */
    private simpleEncrypt;
    /**
     * Simple XOR decryption for memory cache
     */
    simpleDecrypt(encrypted: string): string;
    /**
     * Start periodic cleanup of expired cache entries
     */
    private startCleanup;
    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCache;
    /**
     * Clean up credential store
     */
    destroy(): void;
}
export default CredentialStore;
//# sourceMappingURL=CredentialStore.d.ts.map