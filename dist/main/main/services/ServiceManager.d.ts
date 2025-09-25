/**
 * Service Manager
 *
 * Manages service configurations with CRUD operations, validation, and persistence.
 * Handles service lifecycle, configuration updates, and data integrity checks.
 *
 * @fileoverview Central service management with secure CRUD operations
 */
import { ServiceConfiguration, ServiceTheme } from '../../shared/types/ServiceConfiguration';
/**
 * Result type for service operations
 */
export interface ServiceOperationResult<T = ServiceConfiguration> {
    /** Whether the operation succeeded */
    success: boolean;
    /** The result data (present on success) */
    data?: T;
    /** Error message (present on failure) */
    error?: string;
    /** Warning messages for non-critical issues */
    warnings?: string[];
}
/**
 * Service creation request interface
 */
export interface CreateServiceRequest {
    /** Service display name */
    name: string;
    /** Service URL */
    url: string;
    /** Parent workspace ID */
    workspaceId: string;
    /** Optional service icon URL or data URI */
    icon?: string;
    /** Optional service category */
    category?: string;
    /** Optional service description */
    description?: string;
    /** Custom theme configuration */
    theme?: ServiceTheme;
}
/**
 * Service update request interface
 */
export interface UpdateServiceRequest {
    /** Service ID to update */
    serviceId: string;
    /** Updated service data */
    updates: Partial<Omit<ServiceConfiguration, 'id' | 'createdAt' | 'updatedAt'>>;
}
/**
 * Service query options
 */
export interface ServiceQueryOptions {
    /** Filter by workspace ID */
    workspaceId?: string;
    /** Filter by category */
    category?: string;
    /** Search by name */
    nameFilter?: string;
    /** Include inactive services */
    includeInactive?: boolean;
    /** Sort field */
    sortBy?: keyof ServiceConfiguration;
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
    /** Maximum results */
    limit?: number;
}
/**
 * ServiceManager class for managing service configurations
 */
export declare class ServiceManager {
    private store;
    private validator;
    private readonly storeKey;
    constructor();
    /**
     * Create a new service configuration
     */
    createService(request: CreateServiceRequest): Promise<ServiceOperationResult>;
    /**
     * Update an existing service configuration
     */
    updateService(request: UpdateServiceRequest): Promise<ServiceOperationResult>;
    /**
     * Delete a service configuration
     */
    deleteService(serviceId: string): Promise<ServiceOperationResult<void>>;
    /**
     * Get a service by ID
     */
    getServiceById(serviceId: string): ServiceConfiguration | null;
    /**
     * Get all services for a workspace
     */
    getServicesByWorkspace(workspaceId: string): ServiceConfiguration[];
    /**
     * Query services with filtering and sorting options
     */
    queryServices(options?: ServiceQueryOptions): ServiceConfiguration[];
    /**
     * Get all services across all workspaces
     */
    getAllServices(): ServiceConfiguration[];
    /**
     * Update service sort order
     */
    updateServiceOrder(serviceId: string, newSortOrder: number): Promise<ServiceOperationResult>;
    /**
     * Get service count by workspace
     */
    getServiceCountByWorkspace(workspaceId: string): number;
    /**
     * Clear all services (for testing or reset)
     */
    clearAllServices(): void;
    /**
     * Validate service creation request
     */
    private validateCreateRequest;
    /**
     * Validate service update request
     */
    private validateUpdateRequest;
    /**
     * Get the next sort order for a workspace
     */
    private getNextSortOrder;
}
export default ServiceManager;
//# sourceMappingURL=ServiceManager.d.ts.map