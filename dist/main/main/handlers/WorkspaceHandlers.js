"use strict";
/**
 * Workspace IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for workspace-related operations.
 * Bridges renderer process requests to WorkspaceManager with proper validation,
 * error handling, and response formatting.
 *
 * @fileoverview IPC handlers for workspace operations (create, update, delete, query, reorder)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceHandlers = void 0;
const electron_1 = require("electron");
const WorkspaceManager_1 = require("../services/WorkspaceManager");
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * WorkspaceHandlers class for managing workspace-related IPC operations
 */
class WorkspaceHandlers {
    workspaceManager;
    constructor() {
        this.workspaceManager = new WorkspaceManager_1.WorkspaceManager();
        this.registerHandlers();
    }
    /**
     * Register all IPC handlers
     */
    registerHandlers() {
        // Create workspace
        electron_1.ipcMain.handle('workspace:create', this.handleCreateWorkspace.bind(this));
        // Update workspace
        electron_1.ipcMain.handle('workspace:update', this.handleUpdateWorkspace.bind(this));
        // Delete workspace
        electron_1.ipcMain.handle('workspace:delete', this.handleDeleteWorkspace.bind(this));
        // Get workspace by ID
        electron_1.ipcMain.handle('workspace:get', this.handleGetWorkspace.bind(this));
        // List all workspaces
        electron_1.ipcMain.handle('workspace:list', this.handleListWorkspaces.bind(this));
        // Query workspaces with filtering
        electron_1.ipcMain.handle('workspace:query', this.handleQueryWorkspaces.bind(this));
        // Reorder workspaces
        electron_1.ipcMain.handle('workspace:reorder', this.handleReorderWorkspaces.bind(this));
        // Get default workspace
        electron_1.ipcMain.handle('workspace:getDefault', this.handleGetDefaultWorkspace.bind(this));
        // Add service to workspace
        electron_1.ipcMain.handle('workspace:addService', this.handleAddServiceToWorkspace.bind(this));
        // Remove service from workspace
        electron_1.ipcMain.handle('workspace:removeService', this.handleRemoveServiceFromWorkspace.bind(this));
        // Update workspace position
        electron_1.ipcMain.handle('workspace:updatePosition', this.handleUpdateWorkspacePosition.bind(this));
        // Get workspace statistics
        electron_1.ipcMain.handle('workspace:getStats', this.handleGetWorkspaceStats.bind(this));
        // Export workspaces
        electron_1.ipcMain.handle('workspace:export', this.handleExportWorkspaces.bind(this));
        // Import workspaces
        electron_1.ipcMain.handle('workspace:import', this.handleImportWorkspaces.bind(this));
        // Clear all workspaces
        electron_1.ipcMain.handle('workspace:clear', this.handleClearAllWorkspaces.bind(this));
    }
    /**
     * Handle workspace creation
     */
    async handleCreateWorkspace(_event, request) {
        try {
            // Validate input data
            const validation = this.validateCreateWorkspaceRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid workspace creation request',
                };
            }
            // Convert to WorkspaceManager format
            const createRequest = {
                name: request.name,
                ...(request.description && { description: request.description }),
                ...(request.theme && { theme: request.theme }),
                ...(request.isDefault !== undefined && { isDefault: request.isDefault }),
            };
            const result = await this.workspaceManager.createWorkspace(createRequest);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to create workspace',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle workspace update
     */
    async handleUpdateWorkspace(_event, request) {
        try {
            // Validate input data
            const validation = this.validateUpdateWorkspaceRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid workspace update request',
                };
            }
            // Convert to WorkspaceManager format
            const updateRequest = {
                workspaceId: request.id,
                updates: request.updates,
            };
            const result = await this.workspaceManager.updateWorkspace(updateRequest);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to update workspace',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle workspace deletion
     */
    async handleDeleteWorkspace(_event, workspaceId, force = false) {
        try {
            // Validate input
            if (!workspaceId?.trim()) {
                return {
                    success: false,
                    error: 'Workspace ID is required',
                };
            }
            const result = await this.workspaceManager.deleteWorkspace(workspaceId, force);
            if (result.success) {
                return {
                    success: true,
                    data: undefined,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to delete workspace',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to delete workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle getting workspace by ID
     */
    async handleGetWorkspace(_event, workspaceId) {
        try {
            // Validate input
            if (!workspaceId?.trim()) {
                return {
                    success: false,
                    error: 'Workspace ID is required',
                };
            }
            const workspace = this.workspaceManager.getWorkspaceById(workspaceId);
            return {
                success: true,
                data: workspace,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle listing all workspaces
     */
    async handleListWorkspaces(_event) {
        try {
            const workspaces = this.workspaceManager.getAllWorkspaces();
            return {
                success: true,
                data: workspaces,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to list workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle querying workspaces with filters
     */
    async handleQueryWorkspaces(_event, options = {}) {
        try {
            const workspaces = this.workspaceManager.queryWorkspaces(options);
            return {
                success: true,
                data: workspaces,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to query workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle workspace reordering
     */
    async handleReorderWorkspaces(_event, request) {
        try {
            // Validate input
            const validation = this.validateReorderWorkspaceRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid reorder request',
                };
            }
            const result = await this.workspaceManager.reorderWorkspaces(request.workspaceId, request.targetIndex);
            if (result.success) {
                return {
                    success: true,
                    data: undefined,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to reorder workspaces',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reorder workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle getting default workspace
     */
    async handleGetDefaultWorkspace(_event) {
        try {
            const workspace = this.workspaceManager.getDefaultWorkspace();
            return {
                success: true,
                data: workspace,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get default workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle adding service to workspace
     */
    async handleAddServiceToWorkspace(_event, request) {
        try {
            // Validate input
            const validation = this.validateWorkspaceServiceRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid workspace service request',
                };
            }
            const result = await this.workspaceManager.addServiceToWorkspace(request.workspaceId, request.serviceId);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to add service to workspace',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to add service to workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle removing service from workspace
     */
    async handleRemoveServiceFromWorkspace(_event, request) {
        try {
            // Validate input
            const validation = this.validateWorkspaceServiceRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid workspace service request',
                };
            }
            const result = await this.workspaceManager.removeServiceFromWorkspace(request.workspaceId, request.serviceId);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to remove service from workspace',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to remove service from workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle updating workspace position
     */
    async handleUpdateWorkspacePosition(_event, workspaceId, newPosition) {
        try {
            // Validate input
            if (!workspaceId?.trim()) {
                return {
                    success: false,
                    error: 'Workspace ID is required',
                };
            }
            if (typeof newPosition !== 'number' || newPosition < 0) {
                return {
                    success: false,
                    error: 'Valid position number is required',
                };
            }
            const result = await this.workspaceManager.updateWorkspacePosition(workspaceId, newPosition);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to update workspace position',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update workspace position: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle getting workspace statistics
     */
    async handleGetWorkspaceStats(_event) {
        try {
            const stats = await this.workspaceManager.getWorkspaceStats();
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get workspace statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle exporting workspaces
     */
    async handleExportWorkspaces(_event) {
        try {
            const workspaces = this.workspaceManager.exportWorkspaces();
            return {
                success: true,
                data: workspaces,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to export workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle importing workspaces
     */
    async handleImportWorkspaces(_event, request) {
        try {
            // Validate input
            const validation = this.validateImportWorkspaceRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid import request',
                };
            }
            const result = await this.workspaceManager.importWorkspaces(request.workspaces, request.mergeStrategy || 'merge');
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to import workspaces',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to import workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle clearing all workspaces
     */
    async handleClearAllWorkspaces(_event) {
        try {
            this.workspaceManager.clearAllWorkspaces();
            return {
                success: true,
                data: undefined,
                warnings: ['All workspaces have been cleared'],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to clear workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    // Private validation methods
    /**
     * Validate create workspace request
     */
    validateCreateWorkspaceRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!request.name?.trim()) {
            return { valid: false, error: 'Workspace name is required' };
        }
        const nameValidation = InputValidator_1.InputValidator.validateText(request.name, {
            minLength: 1,
            maxLength: 100,
            allowSpecialChars: true,
        });
        if (!nameValidation.valid) {
            return { valid: false, error: `Invalid workspace name: ${nameValidation.error}` };
        }
        if (request.description) {
            const descValidation = InputValidator_1.InputValidator.validateText(request.description, {
                maxLength: 500,
                allowSpecialChars: true,
            });
            if (!descValidation.valid) {
                return { valid: false, error: `Invalid description: ${descValidation.error}` };
            }
        }
        return { valid: true };
    }
    /**
     * Validate update workspace request
     */
    validateUpdateWorkspaceRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!request.id?.trim()) {
            return { valid: false, error: 'Workspace ID is required' };
        }
        if (!request.updates || Object.keys(request.updates).length === 0) {
            return { valid: false, error: 'Updates are required' };
        }
        // Validate name if provided
        if (request.updates.name !== undefined) {
            if (!request.updates.name?.trim()) {
                return { valid: false, error: 'Workspace name cannot be empty' };
            }
            const nameValidation = InputValidator_1.InputValidator.validateText(request.updates.name, {
                minLength: 1,
                maxLength: 100,
                allowSpecialChars: true,
            });
            if (!nameValidation.valid) {
                return { valid: false, error: `Invalid workspace name: ${nameValidation.error}` };
            }
        }
        // Validate description if provided
        if (request.updates.description !== undefined && request.updates.description) {
            const descValidation = InputValidator_1.InputValidator.validateText(request.updates.description, {
                maxLength: 500,
                allowSpecialChars: true,
            });
            if (!descValidation.valid) {
                return { valid: false, error: `Invalid description: ${descValidation.error}` };
            }
        }
        return { valid: true };
    }
    /**
     * Validate reorder workspace request
     */
    validateReorderWorkspaceRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!request.workspaceId?.trim()) {
            return { valid: false, error: 'Workspace ID is required' };
        }
        if (typeof request.targetIndex !== 'number' || request.targetIndex < 0) {
            return { valid: false, error: 'Valid target index is required' };
        }
        return { valid: true };
    }
    /**
     * Validate workspace service request
     */
    validateWorkspaceServiceRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!request.workspaceId?.trim()) {
            return { valid: false, error: 'Workspace ID is required' };
        }
        if (!request.serviceId?.trim()) {
            return { valid: false, error: 'Service ID is required' };
        }
        return { valid: true };
    }
    /**
     * Validate import workspace request
     */
    validateImportWorkspaceRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!Array.isArray(request.workspaces)) {
            return { valid: false, error: 'Workspaces array is required' };
        }
        if (request.workspaces.length === 0) {
            return { valid: false, error: 'At least one workspace is required' };
        }
        if (request.mergeStrategy && !['replace', 'merge'].includes(request.mergeStrategy)) {
            return { valid: false, error: 'Invalid merge strategy. Must be "replace" or "merge"' };
        }
        return { valid: true };
    }
}
exports.WorkspaceHandlers = WorkspaceHandlers;
exports.default = WorkspaceHandlers;
//# sourceMappingURL=WorkspaceHandlers.js.map