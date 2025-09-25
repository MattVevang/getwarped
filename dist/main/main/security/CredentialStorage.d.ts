/**
 * Credential Storage
 *
 * Provides secure, OS-native credential storage using keytar.
 * Handles encryption, key derivation, and secure credential management
 * with proper lifecycle and cleanup operations.
 *
 * @fileoverview OS-native credential storage with encryption and security
 */
import { EventEmitter } from 'events';
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
export declare enum CredentialType {
    PASSWORD = "password",
    API_KEY = "api-key",
    TOKEN = "token",
    CERTIFICATE = "certificate",
    SSH_KEY = "ssh-key",
    OAUTH_TOKEN = "oauth-token",
    REFRESH_TOKEN = "refresh-token"
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
export declare enum CredentialEvent {
    /** Credential stored */
    STORED = "credential:stored",
    /** Credential retrieved */
    RETRIEVED = "credential:retrieved",
    /** Credential updated */
    UPDATED = "credential:updated",
    /** Credential deleted */
    DELETED = "credential:deleted",
    /** Credential expired */
    EXPIRED = "credential:expired",
    /** Credential accessed */
    ACCESSED = "credential:accessed"
}
/**
 * Credential Storage class for secure OS-native credential management
 */
export declare class CredentialStorage extends EventEmitter {
    private readonly serviceName;
    private readonly metadataPrefix;
    private readonly credentialPrefix;
    private readonly encryptionAlgorithm;
    private readonly keyDerivationRounds;
    private masterKey?;
    constructor();
    /**
     * Initialize credential storage with master key
     */
    initialize(masterPassword?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Store a credential securely
     */
    storeCredential(request: StoreCredentialRequest): Promise<{
        success: boolean;
        credentialId?: string;
        error?: string;
    }>;
    /**
     * Retrieve a credential
     */
    retrieveCredential(request: RetrieveCredentialRequest): Promise<{
        success: boolean;
        credential?: string;
        metadata?: CredentialMetadata;
        error?: string;
    }>;
    /**
     * Update a credential
     */
    updateCredential(request: UpdateCredentialRequest): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Delete a credential
     */
    deleteCredential(credentialId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Search for credentials
     */
    searchCredentials(request?: SearchCredentialRequest): Promise<{
        success: boolean;
        credentials?: CredentialMetadata[];
        error?: string;
    }>;
    /**
     * Clear all credentials for a service
     */
    clearServiceCredentials(serviceId: string): Promise<{
        success: boolean;
        deletedCount?: number;
        error?: string;
    }>;
    /**
     * Clear expired credentials
     */
    clearExpiredCredentials(): Promise<{
        success: boolean;
        deletedCount?: number;
        error?: string;
    }>;
    /**
     * Encrypt credential value
     */
    private encryptCredential;
    /**
     * Decrypt credential value
     */
    private decryptCredential;
    /**
     * Get or create salt for key derivation
     */
    private getOrCreateSalt;
    /**
     * Get credential metadata
     */
    private getCredentialMetadata;
    /**
     * Update credential metadata
     */
    private updateCredentialMetadata;
    /**
     * Generate unique credential ID
     */
    private generateCredentialId;
    /**
     * Build credential account string
     */
    private buildCredentialAccount;
    /**
     * Build metadata account string
     */
    private buildMetadataAccount;
    /**
     * Validate store credential request
     */
    private validateStoreRequest;
    /**
     * Validate retrieve credential request
     */
    private validateRetrieveRequest;
    /**
     * Validate update credential request
     */
    private validateUpdateRequest;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export default CredentialStorage;
//# sourceMappingURL=CredentialStorage.d.ts.map