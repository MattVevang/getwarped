/**
 * Service Manager
 *
 * Manages service configurations with CRUD operations, validation, and persistence.
 * Handles service lifecycle, configuration updates, and data integrity checks.
 *
 * @fileoverview Central service management with secure CRUD operations
 */

import { v4 as uuidv4 } from 'uuid';
import Store from 'electron-store';
import { ServiceConfiguration, ServiceTheme } from '../../shared/types/ServiceConfiguration';
import { ServiceConfigurationValidator } from '../../shared/validation/ServiceConfigurationSchema';
import { InputValidator } from '../../shared/validation/InputValidator';

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
export class ServiceManager {
  private store: Store<{ services: Record<string, ServiceConfiguration> }>;
  private validator: ServiceConfigurationValidator;
  private readonly storeKey = 'services';

  constructor() {
    // Initialize electron-store with schema validation
    const encryptionKey = process.env['GETWARPED_ENCRYPTION_KEY'];

    this.store = new Store<{ services: Record<string, ServiceConfiguration> }>({
      name: 'services',
      defaults: { services: {} },
      ...(encryptionKey && { encryptionKey }),
      schema: {
        services: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            required: ['id', 'name', 'url', 'workspaceId', 'createdAt', 'updatedAt'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              url: { type: 'string' },
              workspaceId: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    });

    this.validator = new ServiceConfigurationValidator();
  }

  /**
   * Create a new service configuration
   */
  async createService(request: CreateServiceRequest): Promise<ServiceOperationResult> {
    try {
      // Validate input data
      const inputValidation = this.validateCreateRequest(request);
      if (!inputValidation.success) {
        return {
          success: false,
          error: inputValidation.error || 'Validation failed',
        };
      }

      // Generate unique service ID
      const serviceId = uuidv4();
      const now = new Date().toISOString();

      // Create service configuration
      const serviceConfig: ServiceConfiguration = {
        id: serviceId,
        name: request.name.trim(),
        url: request.url.trim(),
        workspaceId: request.workspaceId,
        ...(request.icon && { icon: request.icon }),
        iconType: 'builtin',
        ...(request.category && { category: request.category }),
        ...(request.description && { description: request.description }),
        theme: request.theme || {
          primaryColor: '#007bff',
          backgroundColor: '#ffffff',
          textColor: '#333333',
          customCSS: '',
        },
        isActive: true,
        sortOrder: await this.getNextSortOrder(request.workspaceId),
        createdAt: now,
        updatedAt: now,
      };

      // Validate the complete service configuration
      const validation = await this.validator.validate(serviceConfig);
      if (!validation.valid) {
        return {
          success: false,
          error: `Service configuration validation failed: ${validation.errors?.map(e => e.message).join(', ') || 'Unknown validation error'}`,
        };
      }

      // Check for duplicate names in workspace
      const existingServices = this.getServicesByWorkspace(request.workspaceId);
      const duplicateName = existingServices.find(
        service => service.name.toLowerCase() === request.name.toLowerCase().trim()
      );

      if (duplicateName) {
        return {
          success: false,
          error: `A service with the name "${request.name}" already exists in this workspace`,
        };
      }

      // Store the service configuration
      const services = this.store.get(this.storeKey, {});
      services[serviceId] = serviceConfig;
      this.store.set(this.storeKey, services);

      return {
        success: true,
        data: serviceConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update an existing service configuration
   */
  async updateService(request: UpdateServiceRequest): Promise<ServiceOperationResult> {
    try {
      // Validate service ID
      const existingService = this.getServiceById(request.serviceId);
      if (!existingService) {
        return {
          success: false,
          error: `Service with ID ${request.serviceId} not found`,
        };
      }

      // Validate update data
      const inputValidation = this.validateUpdateRequest(request.updates);
      if (!inputValidation.success) {
        return {
          success: false,
          error: inputValidation.error || 'Update validation failed',
        };
      }

      // Check for duplicate names if name is being updated
      if (request.updates.name) {
        const existingServices = this.getServicesByWorkspace(existingService.workspaceId);
        const duplicateName = existingServices.find(
          service =>
            service.id !== request.serviceId &&
            service.name.toLowerCase() === request.updates.name!.toLowerCase().trim()
        );

        if (duplicateName) {
          return {
            success: false,
            error: `A service with the name "${request.updates.name}" already exists in this workspace`,
          };
        }
      }

      // Merge updates with existing service
      const updatedService: ServiceConfiguration = {
        ...existingService,
        ...request.updates,
        id: existingService.id, // Ensure ID cannot be changed
        createdAt: existingService.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString(),
      };

      // Validate the updated configuration
      const validation = await this.validator.validate(updatedService);
      if (!validation.valid) {
        return {
          success: false,
          error: `Updated service configuration validation failed: ${validation.errors?.map(e => e.message).join(', ') || 'Unknown validation error'}`,
        };
      }

      // Store the updated service
      const services = this.store.get(this.storeKey, {});
      services[request.serviceId] = updatedService;
      this.store.set(this.storeKey, services);

      return {
        success: true,
        data: updatedService,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Delete a service configuration
   */
  async deleteService(serviceId: string): Promise<ServiceOperationResult<void>> {
    try {
      // Validate service exists
      const existingService = this.getServiceById(serviceId);
      if (!existingService) {
        return {
          success: false,
          error: `Service with ID ${serviceId} not found`,
        };
      }

      // Remove service from store
      const services = this.store.get(this.storeKey, {});
      delete services[serviceId];
      this.store.set(this.storeKey, services);

      return {
        success: true,
        warnings: [`Service "${existingService.name}" has been deleted`],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get a service by ID
   */
  getServiceById(serviceId: string): ServiceConfiguration | null {
    const services = this.store.get(this.storeKey, {});
    return services[serviceId] || null;
  }

  /**
   * Get all services for a workspace
   */
  getServicesByWorkspace(workspaceId: string): ServiceConfiguration[] {
    const services = this.store.get(this.storeKey, {});
    return Object.values(services)
      .filter(service => service.workspaceId === workspaceId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Query services with filtering and sorting options
   */
  queryServices(options: ServiceQueryOptions = {}): ServiceConfiguration[] {
    const services = this.store.get(this.storeKey, {});
    let results = Object.values(services);

    // Apply filters
    if (options.workspaceId) {
      results = results.filter(service => service.workspaceId === options.workspaceId);
    }

    if (options.category) {
      results = results.filter(service => service.category === options.category);
    }

    if (options.nameFilter) {
      const filter = options.nameFilter.toLowerCase();
      results = results.filter(
        service =>
          service.name.toLowerCase().includes(filter) ||
          service.description?.toLowerCase().includes(filter)
      );
    }

    if (!options.includeInactive) {
      results = results.filter(service => service.isActive);
    }

    // Apply sorting
    if (options.sortBy) {
      const field = options.sortBy;
      const order = options.sortOrder || 'asc';
      results.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return order === 'asc' ? 1 : -1;
        if (bVal == null) return order === 'asc' ? -1 : 1;
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by sortOrder
      results.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get all services across all workspaces
   */
  getAllServices(): ServiceConfiguration[] {
    const services = this.store.get(this.storeKey, {});
    return Object.values(services).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Update service sort order
   */
  async updateServiceOrder(
    serviceId: string,
    newSortOrder: number
  ): Promise<ServiceOperationResult> {
    try {
      const service = this.getServiceById(serviceId);
      if (!service) {
        return {
          success: false,
          error: `Service with ID ${serviceId} not found`,
        };
      }

      return await this.updateService({
        serviceId,
        updates: { sortOrder: newSortOrder },
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to update service order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get service count by workspace
   */
  getServiceCountByWorkspace(workspaceId: string): number {
    const services = this.store.get(this.storeKey, {});
    return Object.values(services).filter(service => service.workspaceId === workspaceId).length;
  }

  /**
   * Clear all services (for testing or reset)
   */
  clearAllServices(): void {
    this.store.set(this.storeKey, {});
  }

  // Private helper methods

  /**
   * Validate service creation request
   */
  private validateCreateRequest(request: CreateServiceRequest): ServiceOperationResult<void> {
    // Validate required fields
    if (!request.name?.trim()) {
      return { success: false, error: 'Service name is required' };
    }

    if (!request.url?.trim()) {
      return { success: false, error: 'Service URL is required' };
    }

    if (!request.workspaceId?.trim()) {
      return { success: false, error: 'Workspace ID is required' };
    }

    // Validate input using InputValidator
    const nameValidation = InputValidator.validateText(request.name, {
      minLength: 1,
      maxLength: 100,
      allowSpecialChars: true,
    });
    if (!nameValidation.valid) {
      return { success: false, error: `Invalid service name: ${nameValidation.error}` };
    }

    const urlValidation = InputValidator.validateUrl(request.url);
    if (!urlValidation.valid) {
      return { success: false, error: `Invalid service URL: ${urlValidation.error}` };
    }

    // Validate optional fields
    if (request.description) {
      const descValidation = InputValidator.validateText(request.description, {
        maxLength: 500,
        allowSpecialChars: true,
      });
      if (!descValidation.valid) {
        return { success: false, error: `Invalid description: ${descValidation.error}` };
      }
    }

    return { success: true };
  }

  /**
   * Validate service update request
   */
  private validateUpdateRequest(
    updates: Partial<ServiceConfiguration>
  ): ServiceOperationResult<void> {
    // Validate name if provided
    if (updates.name !== undefined) {
      if (!updates.name?.trim()) {
        return { success: false, error: 'Service name cannot be empty' };
      }

      const nameValidation = InputValidator.validateText(updates.name, {
        minLength: 1,
        maxLength: 100,
        allowSpecialChars: true,
      });
      if (!nameValidation.valid) {
        return { success: false, error: `Invalid service name: ${nameValidation.error}` };
      }
    }

    // Validate URL if provided
    if (updates.url !== undefined) {
      if (!updates.url?.trim()) {
        return { success: false, error: 'Service URL cannot be empty' };
      }

      const urlValidation = InputValidator.validateUrl(updates.url);
      if (!urlValidation.valid) {
        return { success: false, error: `Invalid service URL: ${urlValidation.error}` };
      }
    }

    // Validate description if provided
    if (updates.description !== undefined && updates.description) {
      const descValidation = InputValidator.validateText(updates.description, {
        maxLength: 500,
        allowSpecialChars: true,
      });
      if (!descValidation.valid) {
        return { success: false, error: `Invalid description: ${descValidation.error}` };
      }
    }

    return { success: true };
  }

  /**
   * Get the next sort order for a workspace
   */
  private async getNextSortOrder(workspaceId: string): Promise<number> {
    const workspaceServices = this.getServicesByWorkspace(workspaceId);
    if (workspaceServices.length === 0) {
      return 0;
    }

    const maxOrder = Math.max(...workspaceServices.map(s => s.sortOrder));
    return maxOrder + 1;
  }
}

export default ServiceManager;
