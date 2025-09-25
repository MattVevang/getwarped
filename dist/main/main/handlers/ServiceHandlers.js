"use strict";
/**
 * Service IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for service-related operations.
 * Bridges renderer process requests to ServiceManager with proper validation,
 * error handling, and response formatting.
 *
 * @fileoverview IPC handlers for service operations (create, update, delete, query)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceHandlers = void 0;
const electron_1 = require("electron");
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * Service IPC Handlers class
 */
class ServiceHandlers {
    serviceManager;
    channelPrefix = 'service:';
    constructor(serviceManager) {
        this.serviceManager = serviceManager;
        this.setupHandlers();
    }
    /**
     * Setup all IPC handlers for service operations
     */
    setupHandlers() {
        // Service CRUD operations
        electron_1.ipcMain.handle(`${this.channelPrefix}create`, this.handleCreateService.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}update`, this.handleUpdateService.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}delete`, this.handleDeleteService.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}get`, this.handleGetService.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}list`, this.handleListServices.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}query`, this.handleQueryServices.bind(this));
        // Service management operations
        electron_1.ipcMain.handle(`${this.channelPrefix}reorder`, this.handleReorderServices.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}import`, this.handleImportService.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}export`, this.handleExportService.bind(this));
        // Service state operations
        electron_1.ipcMain.handle(`${this.channelPrefix}activate`, this.handleActivateService.bind(this));
        electron_1.ipcMain.handle(`${this.channelPrefix}deactivate`, this.handleDeactivateService.bind(this));
    }
    /**
     * Handle service creation
     */
    async handleCreateService(_event, request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate request
            const validation = this.validateCreateServiceRequest(request);
            if (!validation.valid) {
                return this.createErrorResponse(validation.error || 'Invalid request', requestId, startTime);
            }
            // Create service using ServiceManager's interface
            const createRequest = {
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
                return this.createErrorResponse(result.error || 'Failed to create service', requestId, startTime);
            }
            return this.createSuccessResponse(result.data, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service update
     */
    async handleUpdateService(_event, request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate request
            const validation = this.validateUpdateServiceRequest(request);
            if (!validation.valid) {
                return this.createErrorResponse(validation.error || 'Invalid request', requestId, startTime);
            }
            // Update service using ServiceManager's interface
            const updateRequest = {
                serviceId: request.id,
                updates: request.updates,
            };
            const result = await this.serviceManager.updateService(updateRequest);
            if (!result.success) {
                return this.createErrorResponse(result.error || 'Failed to update service', requestId, startTime);
            }
            return this.createSuccessResponse(result.data, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service deletion
     */
    async handleDeleteService(_event, request) {
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
                return this.createErrorResponse(result.error || 'Failed to delete service', requestId, startTime);
            }
            return this.createSuccessResponse({ deleted: true, serviceId: request.id }, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle get service
     */
    async handleGetService(_event, serviceId) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate service ID
            const validation = InputValidator_1.Validators.validateUUID
                ? InputValidator_1.Validators.validateUUID(serviceId)
                : { valid: true };
            if (!validation.valid) {
                return this.createErrorResponse('Invalid service ID format', requestId, startTime);
            }
            // Get service using ServiceManager's interface
            const service = this.serviceManager.getServiceById(serviceId);
            return this.createSuccessResponse(service, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle list services
     */
    async handleListServices(_event, request = {}) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate workspace ID if provided
            if (request.workspaceId) {
                const validation = InputValidator_1.Validators.validateUUID
                    ? InputValidator_1.Validators.validateUUID(request.workspaceId)
                    : { valid: true };
                if (!validation.valid) {
                    return this.createErrorResponse('Invalid workspace ID format', requestId, startTime);
                }
            }
            // List services using ServiceManager's interface
            let services;
            if (request.workspaceId) {
                services = this.serviceManager.getServicesByWorkspace(request.workspaceId);
            }
            else {
                services = this.serviceManager.getAllServices();
            }
            // Filter out inactive services if requested
            if (!request.includeInactive) {
                services = services.filter(service => service.isActive);
            }
            return this.createSuccessResponse(services, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle query services
     */
    async handleQueryServices(_event, request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate query parameters
            if (request.offset !== undefined &&
                (request.offset < 0 || !Number.isInteger(request.offset))) {
                return this.createErrorResponse('Invalid offset value', requestId, startTime);
            }
            if (request.limit !== undefined &&
                (request.limit < 1 || request.limit > 1000 || !Number.isInteger(request.limit))) {
                return this.createErrorResponse('Invalid limit value (must be 1-1000)', requestId, startTime);
            }
            // Query services using ServiceManager's interface
            const queryOptions = {};
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
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service reordering
     */
    async handleReorderServices(_event, request) {
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
            return this.createSuccessResponse({ reordered: successCount > 0, count: successCount }, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service import
     */
    async handleImportService(_event, request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Validate request
            if (!request.service || !request.workspaceId) {
                return this.createErrorResponse('Invalid import request', requestId, startTime);
            }
            if (!request.service.name || !request.service.url) {
                return this.createErrorResponse('Service name and URL are required for import', requestId, startTime);
            }
            // Create service from import request
            const createRequest = {
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
                return this.createErrorResponse(result.error || 'Failed to import service', requestId, startTime);
            }
            return this.createSuccessResponse(result.data, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service export
     */
    async handleExportService(_event, serviceId) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            // Get service
            const service = this.serviceManager.getServiceById(serviceId);
            if (!service) {
                return this.createErrorResponse('Service not found', requestId, startTime);
            }
            // Export service (strip sensitive data)
            const exportedService = {
                name: service.name,
                url: service.url,
                ...(service.icon && { icon: service.icon }),
                ...(service.category && { category: service.category }),
                ...(service.description && { description: service.description }),
                ...(service.theme && { theme: service.theme }),
                // Exclude: id, workspaceId, createdAt, updatedAt, isActive, sortOrder
            };
            return this.createSuccessResponse(exportedService, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service activation
     */
    async handleActivateService(_event, serviceId) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            const result = await this.serviceManager.updateService({
                serviceId,
                updates: { isActive: true },
            });
            if (!result.success) {
                return this.createErrorResponse(result.error || 'Failed to activate service', requestId, startTime);
            }
            return this.createSuccessResponse({ activated: true, serviceId }, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Handle service deactivation
     */
    async handleDeactivateService(_event, serviceId) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        try {
            const result = await this.serviceManager.updateService({
                serviceId,
                updates: { isActive: false },
            });
            if (!result.success) {
                return this.createErrorResponse(result.error || 'Failed to deactivate service', requestId, startTime);
            }
            return this.createSuccessResponse({ deactivated: true, serviceId }, requestId, startTime);
        }
        catch (error) {
            return this.createErrorResponse(error instanceof Error ? error.message : 'Internal server error', requestId, startTime);
        }
    }
    /**
     * Validate create service request
     */
    validateCreateServiceRequest(request) {
        if (!request.name || typeof request.name !== 'string' || request.name.trim().length === 0) {
            return { valid: false, error: 'Service name is required' };
        }
        if (request.name.trim().length > 100) {
            return { valid: false, error: 'Service name must be 100 characters or less' };
        }
        const urlValidation = InputValidator_1.InputValidator.validateUrl(request.url);
        if (!urlValidation.valid) {
            return { valid: false, error: 'Invalid service URL' };
        }
        const workspaceValidation = InputValidator_1.Validators.validateUUID
            ? InputValidator_1.Validators.validateUUID(request.workspaceId)
            : { valid: true };
        if (!workspaceValidation.valid) {
            return { valid: false, error: 'Invalid workspace ID format' };
        }
        if (request.icon && request.icon.trim().length > 0) {
            const iconValidation = InputValidator_1.InputValidator.validateUrl(request.icon);
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
    validateUpdateServiceRequest(request) {
        const idValidation = InputValidator_1.Validators.validateUUID
            ? InputValidator_1.Validators.validateUUID(request.id)
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
            const urlValidation = InputValidator_1.InputValidator.validateUrl(request.updates.url);
            if (!urlValidation.valid) {
                return { valid: false, error: 'Invalid service URL' };
            }
        }
        if (request.updates.icon !== undefined && request.updates.icon.trim().length > 0) {
            const iconValidation = InputValidator_1.InputValidator.validateUrl(request.updates.icon);
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
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Create success response
     */
    createSuccessResponse(data, requestId, startTime) {
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
    createErrorResponse(error, requestId, startTime) {
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
    destroy() {
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
            electron_1.ipcMain.removeHandler(`${this.channelPrefix}${channel}`);
        });
    }
}
exports.ServiceHandlers = ServiceHandlers;
exports.default = ServiceHandlers;
//# sourceMappingURL=ServiceHandlers.js.map