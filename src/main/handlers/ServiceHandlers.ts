/**
 * Service IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for service-related operations.
 * Bridges renderer process requests to ServiceManager with proper validation,
 * error handling, and response formatting.
 *
 * @fileoverview IPC handlers for service operations (create, update, delete, query)
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import {
  ServiceManager,
  CreateServiceRequest as ServiceManagerCreateRequest,
  ServiceQueryOptions,
} from '../services/ServiceManager';
import { ServiceConfiguration } from '../../shared/types/ServiceConfiguration';
import { InputValidator, Validators } from '../../shared/validation/InputValidator';

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
export class ServiceHandlers {
  private serviceManager: ServiceManager;
  private readonly channelPrefix = 'service:';

  constructor(serviceManager: ServiceManager) {
    this.serviceManager = serviceManager;
    this.setupHandlers();
  }

  /**
   * Setup all IPC handlers for service operations
   */
  private setupHandlers(): void {
    // Service CRUD operations
    ipcMain.handle(`${this.channelPrefix}create`, this.handleCreateService.bind(this));
    ipcMain.handle(`${this.channelPrefix}update`, this.handleUpdateService.bind(this));
    ipcMain.handle(`${this.channelPrefix}delete`, this.handleDeleteService.bind(this));
    ipcMain.handle(`${this.channelPrefix}get`, this.handleGetService.bind(this));
    ipcMain.handle(`${this.channelPrefix}list`, this.handleListServices.bind(this));
    ipcMain.handle(`${this.channelPrefix}query`, this.handleQueryServices.bind(this));

    // Service management operations
    ipcMain.handle(`${this.channelPrefix}reorder`, this.handleReorderServices.bind(this));
    ipcMain.handle(`${this.channelPrefix}import`, this.handleImportService.bind(this));
    ipcMain.handle(`${this.channelPrefix}export`, this.handleExportService.bind(this));

    // Service state operations
    ipcMain.handle(`${this.channelPrefix}activate`, this.handleActivateService.bind(this));
    ipcMain.handle(`${this.channelPrefix}deactivate`, this.handleDeactivateService.bind(this));
  }

  /**
   * Handle service creation
   */
  private async handleCreateService(
    _event: IpcMainInvokeEvent,
    request: CreateServiceRequest
  ): Promise<ServiceResponse<ServiceConfiguration>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate request
      const validation = this.validateCreateServiceRequest(request);
      if (!validation.valid) {
        return this.createErrorResponse(
          validation.error || 'Invalid request',
          requestId,
          startTime
        );
      }

      // Create service using ServiceManager's interface
      const createRequest: ServiceManagerCreateRequest = {
        name: request.name.trim(),
        url: request.url.trim(),
        workspaceId: request.workspaceId,
        ...(request.icon && { icon: request.icon.trim() }),
        ...(request.description && { description: request.description.trim() }),
        category: request.customConfig?.['category'] || 'general',
      };

      // Create service
      const result = await this.serviceManager.createService(createRequest);

      if (!result.success) {
        return this.createErrorResponse(
          result.error || 'Failed to create service',
          requestId,
          startTime
        );
      }

      return this.createSuccessResponse(result.data!, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service update
   */
  private async handleUpdateService(
    _event: IpcMainInvokeEvent,
    request: UpdateServiceRequest
  ): Promise<ServiceResponse<ServiceConfiguration>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate request
      const validation = this.validateUpdateServiceRequest(request);
      if (!validation.valid) {
        return this.createErrorResponse(
          validation.error || 'Invalid request',
          requestId,
          startTime
        );
      }

      // Update service using ServiceManager's interface
      const updateRequest = {
        serviceId: request.id,
        updates: request.updates,
      };

      const result = await this.serviceManager.updateService(updateRequest);

      if (!result.success) {
        return this.createErrorResponse(
          result.error || 'Failed to update service',
          requestId,
          startTime
        );
      }

      return this.createSuccessResponse(result.data!, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service deletion
   */
  private async handleDeleteService(
    _event: IpcMainInvokeEvent,
    request: DeleteServiceRequest
  ): Promise<ServiceResponse<{ deleted: boolean; serviceId: string }>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate request
      if (!request.id || typeof request.id !== 'string') {
        return this.createErrorResponse('Invalid service ID', requestId, startTime);
      }

      if (!request.confirmed) {
        return this.createErrorResponse('Service deletion not confirmed', requestId, startTime);
      }

      // Delete service
      const result = await this.serviceManager.deleteService(request.id);

      if (!result.success) {
        return this.createErrorResponse(
          result.error || 'Failed to delete service',
          requestId,
          startTime
        );
      }

      return this.createSuccessResponse(
        { deleted: true, serviceId: request.id },
        requestId,
        startTime
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle get service
   */
  private async handleGetService(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<ServiceResponse<ServiceConfiguration | null>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate service ID
      const validation = Validators.validateUUID
        ? Validators.validateUUID(serviceId)
        : { valid: true };
      if (!validation.valid) {
        return this.createErrorResponse('Invalid service ID format', requestId, startTime);
      }

      // Get service using ServiceManager's interface
      const service = this.serviceManager.getServiceById(serviceId);

      return this.createSuccessResponse(service, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle list services
   */
  private async handleListServices(
    _event: IpcMainInvokeEvent,
    request: ListServicesRequest = {}
  ): Promise<ServiceResponse<ServiceConfiguration[]>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate workspace ID if provided
      if (request.workspaceId) {
        const validation = Validators.validateUUID
          ? Validators.validateUUID(request.workspaceId)
          : { valid: true };
        if (!validation.valid) {
          return this.createErrorResponse('Invalid workspace ID format', requestId, startTime);
        }
      }

      // List services using ServiceManager's interface
      let services: ServiceConfiguration[];
      if (request.workspaceId) {
        services = this.serviceManager.getServicesByWorkspace(request.workspaceId);
      } else {
        services = this.serviceManager.getAllServices();
      }

      // Filter out inactive services if requested
      if (!request.includeInactive) {
        services = services.filter(service => service.isActive);
      }

      return this.createSuccessResponse(services, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle query services
   */
  private async handleQueryServices(
    _event: IpcMainInvokeEvent,
    request: QueryServicesRequest
  ): Promise<ServiceResponse<ServiceConfiguration[]>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate query parameters
      if (
        request.offset !== undefined &&
        (request.offset < 0 || !Number.isInteger(request.offset))
      ) {
        return this.createErrorResponse('Invalid offset value', requestId, startTime);
      }

      if (
        request.limit !== undefined &&
        (request.limit < 1 || request.limit > 1000 || !Number.isInteger(request.limit))
      ) {
        return this.createErrorResponse(
          'Invalid limit value (must be 1-1000)',
          requestId,
          startTime
        );
      }

      // Query services using ServiceManager's interface
      const queryOptions: ServiceQueryOptions = {};

      if (request.workspaceId) {
        queryOptions.workspaceId = request.workspaceId;
      }

      if (request.search) {
        queryOptions.nameFilter = request.search;
      }

      queryOptions.includeInactive = !request.activeOnly;

      let services = this.serviceManager.queryServices(queryOptions);

      // Apply pagination if specified
      if (request.offset !== undefined) {
        services = services.slice(request.offset);
      }

      if (request.limit !== undefined) {
        services = services.slice(0, request.limit);
      }

      return this.createSuccessResponse(services, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service reordering
   */
  private async handleReorderServices(
    _event: IpcMainInvokeEvent,
    request: ReorderServicesRequest
  ): Promise<ServiceResponse<{ reordered: boolean; count: number }>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate request
      if (!request.workspaceId || !Array.isArray(request.serviceIds)) {
        return this.createErrorResponse('Invalid reorder request', requestId, startTime);
      }

      // Reorder services by updating sort order for each service
      let successCount = 0;
      for (let i = 0; i < request.serviceIds.length; i++) {
        const serviceId = request.serviceIds[i];
        if (serviceId) {
          const result = await this.serviceManager.updateServiceOrder(serviceId, i);

          if (result.success) {
            successCount++;
          }
        }
      }

      return this.createSuccessResponse(
        { reordered: successCount > 0, count: successCount },
        requestId,
        startTime
      );
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service import
   */
  private async handleImportService(
    _event: IpcMainInvokeEvent,
    request: ImportServiceRequest
  ): Promise<ServiceResponse<ServiceConfiguration>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Validate request
      if (!request.service || !request.workspaceId) {
        return this.createErrorResponse('Invalid import request', requestId, startTime);
      }

      if (!request.service.name || !request.service.url) {
        return this.createErrorResponse(
          'Service name and URL are required for import',
          requestId,
          startTime
        );
      }

      // Create service from import request
      const createRequest: ServiceManagerCreateRequest = {
        name: request.service.name,
        url: request.service.url,
        workspaceId: request.workspaceId,
        ...(request.service.icon && { icon: request.service.icon }),
        ...(request.service.category && { category: request.service.category }),
        ...(request.service.description && { description: request.service.description }),
        ...(request.service.theme && { theme: request.service.theme }),
      };

      const result = await this.serviceManager.createService(createRequest);

      if (!result.success) {
        return this.createErrorResponse(
          result.error || 'Failed to import service',
          requestId,
          startTime
        );
      }

      return this.createSuccessResponse(result.data!, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service export
   */
  private async handleExportService(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<ServiceResponse<Partial<ServiceConfiguration>>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Get service
      const service = this.serviceManager.getServiceById(serviceId);

      if (!service) {
        return this.createErrorResponse('Service not found', requestId, startTime);
      }

      // Export service (strip sensitive data)
      const exportedService: Partial<ServiceConfiguration> = {
        name: service.name,
        url: service.url,
        ...(service.icon && { icon: service.icon }),
        ...(service.category && { category: service.category }),
        ...(service.description && { description: service.description }),
        ...(service.theme && { theme: service.theme }),
        // Exclude: id, workspaceId, createdAt, updatedAt, isActive, sortOrder
      };

      return this.createSuccessResponse(exportedService, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service activation
   */
  private async handleActivateService(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<ServiceResponse<{ activated: boolean; serviceId: string }>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const result = await this.serviceManager.updateService({
        serviceId,
        updates: { isActive: true },
      });

      if (!result.success) {
        return this.createErrorResponse(
          result.error || 'Failed to activate service',
          requestId,
          startTime
        );
      }

      return this.createSuccessResponse({ activated: true, serviceId }, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Handle service deactivation
   */
  private async handleDeactivateService(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<ServiceResponse<{ deactivated: boolean; serviceId: string }>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const result = await this.serviceManager.updateService({
        serviceId,
        updates: { isActive: false },
      });

      if (!result.success) {
        return this.createErrorResponse(
          result.error || 'Failed to deactivate service',
          requestId,
          startTime
        );
      }

      return this.createSuccessResponse({ deactivated: true, serviceId }, requestId, startTime);
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        requestId,
        startTime
      );
    }
  }

  /**
   * Validate create service request
   */
  private validateCreateServiceRequest(request: CreateServiceRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request.name || typeof request.name !== 'string' || request.name.trim().length === 0) {
      return { valid: false, error: 'Service name is required' };
    }

    if (request.name.trim().length > 100) {
      return { valid: false, error: 'Service name must be 100 characters or less' };
    }

    const urlValidation = InputValidator.validateUrl(request.url);
    if (!urlValidation.valid) {
      return { valid: false, error: 'Invalid service URL' };
    }

    const workspaceValidation = Validators.validateUUID
      ? Validators.validateUUID(request.workspaceId)
      : { valid: true };
    if (!workspaceValidation.valid) {
      return { valid: false, error: 'Invalid workspace ID format' };
    }

    if (request.icon && request.icon.trim().length > 0) {
      const iconValidation = InputValidator.validateUrl(request.icon);
      if (!iconValidation.valid) {
        return { valid: false, error: 'Invalid icon URL' };
      }
    }

    if (request.description && request.description.length > 500) {
      return { valid: false, error: 'Description must be 500 characters or less' };
    }

    return { valid: true };
  }

  /**
   * Validate update service request
   */
  private validateUpdateServiceRequest(request: UpdateServiceRequest): {
    valid: boolean;
    error?: string;
  } {
    const idValidation = Validators.validateUUID
      ? Validators.validateUUID(request.id)
      : { valid: true };
    if (!idValidation.valid) {
      return { valid: false, error: 'Invalid service ID format' };
    }

    if (!request.updates || typeof request.updates !== 'object') {
      return { valid: false, error: 'Updates object is required' };
    }

    if (Object.keys(request.updates).length === 0) {
      return { valid: false, error: 'At least one field must be updated' };
    }

    // Validate individual fields if present
    if (request.updates.name !== undefined) {
      if (typeof request.updates.name !== 'string' || request.updates.name.trim().length === 0) {
        return { valid: false, error: 'Service name must be a non-empty string' };
      }
      if (request.updates.name.trim().length > 100) {
        return { valid: false, error: 'Service name must be 100 characters or less' };
      }
    }

    if (request.updates.url !== undefined) {
      const urlValidation = InputValidator.validateUrl(request.updates.url);
      if (!urlValidation.valid) {
        return { valid: false, error: 'Invalid service URL' };
      }
    }

    if (request.updates.icon !== undefined && request.updates.icon.trim().length > 0) {
      const iconValidation = InputValidator.validateUrl(request.updates.icon);
      if (!iconValidation.valid) {
        return { valid: false, error: 'Invalid icon URL' };
      }
    }

    if (request.updates.description !== undefined && request.updates.description.length > 500) {
      return { valid: false, error: 'Description must be 500 characters or less' };
    }

    return { valid: true };
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Create success response
   */
  private createSuccessResponse<T>(
    data: T,
    requestId: string,
    startTime: number
  ): ServiceResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        timestamp: Date.now(),
        requestId,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: string,
    requestId: string,
    startTime: number
  ): ServiceResponse {
    return {
      success: false,
      error,
      metadata: {
        timestamp: Date.now(),
        requestId,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Cleanup IPC handlers
   */
  destroy(): void {
    const channels = [
      'create',
      'update',
      'delete',
      'get',
      'list',
      'query',
      'reorder',
      'import',
      'export',
      'activate',
      'deactivate',
    ];

    channels.forEach(channel => {
      ipcMain.removeHandler(`${this.channelPrefix}${channel}`);
    });
  }
}

export default ServiceHandlers;
