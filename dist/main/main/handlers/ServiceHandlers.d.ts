/**
 * Service IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for service-related operations.
 * Bridges renderer process requests to ServiceManager with proper validation,
 * error handling, and response formatting.
 *
 * @fileoverview IPC handlers for service operations (create, update, delete, query)
 */
import { ServiceManager } from '../services/ServiceManager';
import { ServiceConfiguration } from '../../shared/types/ServiceConfiguration';
/**
 * Service creation request
 */
export interface CreateServiceRequest {
    /** Service name */
    name: string;
    /** Service URL */
    url: string;
    /** Workspace ID */
    workspaceId: string;
    /** Service icon URL (optional) */
    icon?: string;
    /** Service template ID (optional) */
    templateId?: string;
    /** Service description (optional) */
    description?: string;
    /** Custom configuration (optional) */
    customConfig?: Record<string, any>;
}
/**
 * Service update request
 */
export interface UpdateServiceRequest {
    /** Service ID */
    id: string;
    /** Updated service data */
    updates: Partial<Omit<ServiceConfiguration, 'id' | 'createdAt' | 'updatedAt'>>;
}
/**
 * Service deletion request
 */
export interface DeleteServiceRequest {
    /** Service ID */
    id: string;
    /** Confirmation flag */
    confirmed: boolean;
}
/**
 * Service query request
 */
export interface QueryServicesRequest {
    /** Workspace ID filter (optional) */
    workspaceId?: string;
    /** Search query (optional) */
    search?: string;
    /** Category filter (optional) */
    category?: string;
    /** Active only filter (optional) */
    activeOnly?: boolean;
    /** Pagination offset (optional) */
    offset?: number;
    /** Pagination limit (optional) */
    limit?: number;
}
/**
 * Service list request
 */
export interface ListServicesRequest {
    /** Workspace ID filter (optional) */
    workspaceId?: string;
    /** Include inactive services */
    includeInactive?: boolean;
}
/**
 * Service reorder request
 */
export interface ReorderServicesRequest {
    /** Workspace ID */
    workspaceId: string;
    /** Service IDs in new order */
    serviceIds: string[];
}
/**
 * Service import request
 */
export interface ImportServiceRequest {
    /** Service configuration to import */
    service: Partial<ServiceConfiguration>;
    /** Target workspace ID */
    workspaceId: string;
    /** Whether to overwrite existing */
    overwrite?: boolean;
}
/**
 * Standard IPC response format
 */
export interface ServiceResponse<T = any> {
    /** Whether operation was successful */
    success: boolean;
    /** Response data (if successful) */
    data?: T;
    /** Error message (if failed) */
    error?: string;
    /** Additional metadata */
    metadata?: {
        /** Timestamp of response */
        timestamp: number;
        /** Request ID for tracing */
        requestId?: string;
        /** Performance metrics */
        duration?: number;
    };
}
/**
 * Service IPC Handlers class
 */
export declare class ServiceHandlers {
    private serviceManager;
    private readonly channelPrefix;
    constructor(serviceManager: ServiceManager);
    /**
     * Setup all IPC handlers for service operations
     */
    private setupHandlers;
    /**
     * Handle service creation
     */
    private handleCreateService;
    /**
     * Handle service update
     */
    private handleUpdateService;
    /**
     * Handle service deletion
     */
    private handleDeleteService;
    /**
     * Handle get service
     */
    private handleGetService;
    /**
     * Handle list services
     */
    private handleListServices;
    /**
     * Handle query services
     */
    private handleQueryServices;
    /**
     * Handle service reordering
     */
    private handleReorderServices;
    /**
     * Handle service import
     */
    private handleImportService;
    /**
     * Handle service export
     */
    private handleExportService;
    /**
     * Handle service activation
     */
    private handleActivateService;
    /**
     * Handle service deactivation
     */
    private handleDeactivateService;
    /**
     * Validate create service request
     */
    private validateCreateServiceRequest;
    /**
     * Validate update service request
     */
    private validateUpdateServiceRequest;
    /**
     * Generate unique request ID for tracing
     */
    private generateRequestId;
    /**
     * Create success response
     */
    private createSuccessResponse;
    /**
     * Create error response
     */
    private createErrorResponse;
    /**
     * Cleanup IPC handlers
     */
    destroy(): void;
}
export default ServiceHandlers;
//# sourceMappingURL=ServiceHandlers.d.ts.map