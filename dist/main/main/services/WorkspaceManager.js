"use strict";
/**
 * Workspace Manager
 *
 * Manages workspace configurations with CRUD operations, positioning, and persistence.
 * Handles workspace lifecycle, service relationships, and workspace-specific settings.
 *
 * @fileoverview Central workspace management following Workspace interface
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = void 0;
const uuid_1 = require("uuid");
const electron_store_1 = __importDefault(require("electron-store"));
const Workspace_1 = require("../../shared/types/Workspace");
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * WorkspaceManager class for managing workspace configurations
 */
class WorkspaceManager {
    store;
    constructor() {
        // Initialize electron-store with proper typing
        this.store = new electron_store_1.default({
            name: 'workspaces',
            defaults: { workspaces: {} },
        });
    }
    /**
     * Create a new workspace
     */
    async createWorkspace(request) {
        try {
            // Validate input data
            const inputValidation = this.validateCreateRequest(request);
            if (!inputValidation.success) {
                return {
                    success: false,
                    error: inputValidation.error || 'Validation failed',
                };
            }
            // Generate unique workspace ID
            const workspaceId = (0, uuid_1.v4)();
            const now = new Date();
            // Create workspace configuration matching Workspace interface
            const workspace = {
                id: workspaceId,
                name: request.name.trim(),
                description: request.description?.trim() || '',
                services: [], // Empty services array initially
                theme: request.theme || Workspace_1.DEFAULT_WORKSPACE_THEME,
                isDefault: request.isDefault || false,
                position: await this.getNextPosition(),
                createdAt: now,
                updatedAt: now,
            };
            // Check for duplicate names
            const existingWorkspaces = this.getAllWorkspaces();
            const duplicateName = existingWorkspaces.find(ws => ws.name.toLowerCase() === request.name.toLowerCase().trim());
            if (duplicateName) {
                return {
                    success: false,
                    error: `A workspace with the name "${request.name}" already exists`,
                };
            }
            // If this is set as default, ensure no other workspace is default
            if (workspace.isDefault) {
                await this.clearDefaultWorkspaces();
            }
            // Store the workspace configuration
            const workspaces = this.store.get('workspaces', {});
            workspaces[workspaceId] = workspace;
            this.store.set('workspaces', workspaces);
            return {
                success: true,
                data: workspace,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Update an existing workspace
     */
    async updateWorkspace(request) {
        try {
            // Validate workspace exists
            const existingWorkspace = this.getWorkspaceById(request.workspaceId);
            if (!existingWorkspace) {
                return {
                    success: false,
                    error: `Workspace with ID ${request.workspaceId} not found`,
                };
            }
            // Validate update data
            const inputValidation = this.validateUpdateRequest(request.updates);
            if (!inputValidation.success) {
                return {
                    success: false,
                    error: inputValidation.error || 'Validation failed',
                };
            }
            // Check for duplicate names if name is being updated
            if (request.updates.name) {
                const existingWorkspaces = this.getAllWorkspaces();
                const duplicateName = existingWorkspaces.find(ws => ws.id !== request.workspaceId &&
                    ws.name.toLowerCase() === request.updates.name.toLowerCase().trim());
                if (duplicateName) {
                    return {
                        success: false,
                        error: `A workspace with the name "${request.updates.name}" already exists`,
                    };
                }
            }
            // If setting as default, clear other defaults first
            if (request.updates.isDefault === true) {
                await this.clearDefaultWorkspaces();
            }
            // Merge updates with existing workspace
            const updatedWorkspace = {
                ...existingWorkspace,
                ...request.updates,
                id: existingWorkspace.id, // Ensure ID cannot be changed
                createdAt: existingWorkspace.createdAt, // Preserve creation date
                updatedAt: new Date(),
            };
            // Store the updated workspace
            const workspaces = this.store.get('workspaces', {});
            workspaces[request.workspaceId] = updatedWorkspace;
            this.store.set('workspaces', workspaces);
            return {
                success: true,
                data: updatedWorkspace,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Delete a workspace (only if it has no services)
     */
    async deleteWorkspace(workspaceId, force = false) {
        try {
            // Validate workspace exists
            const existingWorkspace = this.getWorkspaceById(workspaceId);
            if (!existingWorkspace) {
                return {
                    success: false,
                    error: `Workspace with ID ${workspaceId} not found`,
                };
            }
            // Check if workspace has services (unless forced)
            if (!force && existingWorkspace.services.length > 0) {
                return {
                    success: false,
                    error: `Cannot delete workspace "${existingWorkspace.name}" as it contains ${existingWorkspace.services.length} service(s). Remove all services first or use force delete.`,
                };
            }
            // Remove workspace from store
            const workspaces = this.store.get('workspaces', {});
            delete workspaces[workspaceId];
            this.store.set('workspaces', workspaces);
            const warnings = force && existingWorkspace.services.length > 0
                ? [`Workspace "${existingWorkspace.name}" and its services have been deleted`]
                : [`Workspace "${existingWorkspace.name}" has been deleted`];
            return {
                success: true,
                warnings,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to delete workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Get a workspace by ID
     */
    getWorkspaceById(workspaceId) {
        const workspaces = this.store.get('workspaces', {});
        return workspaces[workspaceId] || null;
    }
    /**
     * Get all workspaces
     */
    getAllWorkspaces() {
        const workspaces = this.store.get('workspaces', {});
        return Object.values(workspaces).sort((a, b) => a.position - b.position);
    }
    /**
     * Query workspaces with filtering and sorting options
     */
    queryWorkspaces(options = {}) {
        const workspaces = this.store.get('workspaces', {});
        let results = Object.values(workspaces);
        // Apply filters
        if (options.nameFilter) {
            const filter = options.nameFilter.toLowerCase();
            results = results.filter(workspace => workspace.name.toLowerCase().includes(filter) ||
                workspace.description?.toLowerCase().includes(filter));
        }
        if (options.defaultOnly) {
            results = results.filter(workspace => workspace.isDefault);
        }
        // Apply sorting
        if (options.sortBy) {
            const field = options.sortBy;
            const order = options.sortOrder || 'asc';
            results.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (aVal === undefined || bVal === undefined)
                    return 0;
                if (aVal < bVal)
                    return order === 'asc' ? -1 : 1;
                if (aVal > bVal)
                    return order === 'asc' ? 1 : -1;
                return 0;
            });
        }
        else {
            // Default sort by position
            results.sort((a, b) => a.position - b.position);
        }
        // Apply limit
        if (options.limit && options.limit > 0) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    /**
     * Get the default workspace
     */
    getDefaultWorkspace() {
        const workspaces = this.getAllWorkspaces();
        return workspaces.find(w => w.isDefault) || null;
    }
    /**
     * Update workspace position
     */
    async updateWorkspacePosition(workspaceId, newPosition) {
        try {
            const workspace = this.getWorkspaceById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    error: `Workspace with ID ${workspaceId} not found`,
                };
            }
            return await this.updateWorkspace({
                workspaceId,
                updates: { position: newPosition },
            });
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update workspace position: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Reorder workspaces by moving one workspace to a new position
     */
    async reorderWorkspaces(workspaceId, targetIndex) {
        try {
            const workspaces = this.getAllWorkspaces();
            const workspace = workspaces.find(w => w.id === workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    error: `Workspace with ID ${workspaceId} not found`,
                };
            }
            if (targetIndex < 0 || targetIndex >= workspaces.length) {
                return {
                    success: false,
                    error: `Invalid target index ${targetIndex}. Must be between 0 and ${workspaces.length - 1}`,
                };
            }
            // Remove workspace from current position
            const currentIndex = workspaces.indexOf(workspace);
            workspaces.splice(currentIndex, 1);
            // Insert at new position
            workspaces.splice(targetIndex, 0, workspace);
            // Update positions for all affected workspaces
            const storeData = this.store.get('workspaces', {});
            workspaces.forEach((ws, index) => {
                const existing = storeData[ws.id];
                if (existing) {
                    storeData[ws.id] = {
                        ...existing,
                        position: index,
                        updatedAt: new Date(),
                    };
                }
            });
            this.store.set('workspaces', storeData);
            return {
                success: true,
                warnings: [`Workspace "${workspace.name}" moved to position ${targetIndex + 1}`],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reorder workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Add a service to a workspace
     */
    async addServiceToWorkspace(workspaceId, serviceId) {
        try {
            const workspace = this.getWorkspaceById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    error: `Workspace with ID ${workspaceId} not found`,
                };
            }
            // Check if service is already in workspace
            if (workspace.services.includes(serviceId)) {
                return {
                    success: false,
                    error: `Service ${serviceId} is already in workspace "${workspace.name}"`,
                };
            }
            // Add service to workspace
            const updatedServices = [...workspace.services, serviceId];
            return await this.updateWorkspace({
                workspaceId,
                updates: { services: updatedServices },
            });
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to add service to workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Remove a service from a workspace
     */
    async removeServiceFromWorkspace(workspaceId, serviceId) {
        try {
            const workspace = this.getWorkspaceById(workspaceId);
            if (!workspace) {
                return {
                    success: false,
                    error: `Workspace with ID ${workspaceId} not found`,
                };
            }
            // Remove service from workspace
            const updatedServices = workspace.services.filter(id => id !== serviceId);
            return await this.updateWorkspace({
                workspaceId,
                updates: { services: updatedServices },
            });
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to remove service from workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Get workspace statistics
     */
    async getWorkspaceStats() {
        const workspaces = this.getAllWorkspaces();
        const defaultWorkspaces = workspaces.filter(w => w.isDefault);
        const totalServices = workspaces.reduce((sum, w) => sum + w.services.length, 0);
        return {
            totalWorkspaces: workspaces.length,
            defaultWorkspaces: defaultWorkspaces.length,
            totalServices,
            averageServicesPerWorkspace: workspaces.length > 0 ? totalServices / workspaces.length : 0,
        };
    }
    /**
     * Get workspace count
     */
    getWorkspaceCount() {
        const workspaces = this.store.get('workspaces', {});
        return Object.keys(workspaces).length;
    }
    /**
     * Clear all workspaces (for testing or reset)
     */
    clearAllWorkspaces() {
        this.store.set('workspaces', {});
    }
    /**
     * Export workspaces for backup
     */
    exportWorkspaces() {
        return this.getAllWorkspaces();
    }
    /**
     * Import workspaces from backup
     */
    async importWorkspaces(workspaces, mergeStrategy = 'merge') {
        try {
            let imported = 0;
            let skipped = 0;
            const existingWorkspaces = this.getAllWorkspaces();
            if (mergeStrategy === 'replace') {
                this.clearAllWorkspaces();
            }
            for (const workspace of workspaces) {
                // Validate workspace data
                const validation = this.validateWorkspaceData(workspace);
                if (!validation.success) {
                    skipped++;
                    continue;
                }
                // Check for existing workspace
                if (mergeStrategy === 'merge') {
                    const existing = existingWorkspaces.find(w => w.name === workspace.name);
                    if (existing) {
                        skipped++;
                        continue;
                    }
                }
                // Generate new ID to avoid conflicts
                const newWorkspace = {
                    ...workspace,
                    id: (0, uuid_1.v4)(),
                    position: await this.getNextPosition(),
                    updatedAt: new Date(),
                };
                const workspaceStore = this.store.get('workspaces', {});
                workspaceStore[newWorkspace.id] = newWorkspace;
                this.store.set('workspaces', workspaceStore);
                imported++;
            }
            const result = {
                success: true,
                data: { imported, skipped },
            };
            if (skipped > 0) {
                result.warnings = [
                    `${skipped} workspace(s) were skipped due to validation errors or conflicts`,
                ];
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to import workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    // Private helper methods
    /**
     * Validate workspace creation request
     */
    validateCreateRequest(request) {
        // Validate required fields
        if (!request.name?.trim()) {
            return { success: false, error: 'Workspace name is required' };
        }
        // Validate input using InputValidator
        const nameValidation = InputValidator_1.InputValidator.validateText(request.name, {
            minLength: 1,
            maxLength: 100,
            allowSpecialChars: true,
        });
        if (!nameValidation.valid) {
            return { success: false, error: `Invalid workspace name: ${nameValidation.error}` };
        }
        // Validate optional fields
        if (request.description) {
            const descValidation = InputValidator_1.InputValidator.validateText(request.description, {
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
     * Validate workspace update request
     */
    validateUpdateRequest(updates) {
        // Validate name if provided
        if (updates.name !== undefined) {
            if (!updates.name?.trim()) {
                return { success: false, error: 'Workspace name cannot be empty' };
            }
            const nameValidation = InputValidator_1.InputValidator.validateText(updates.name, {
                minLength: 1,
                maxLength: 100,
                allowSpecialChars: true,
            });
            if (!nameValidation.valid) {
                return { success: false, error: `Invalid workspace name: ${nameValidation.error}` };
            }
        }
        // Validate description if provided
        if (updates.description !== undefined && updates.description) {
            const descValidation = InputValidator_1.InputValidator.validateText(updates.description, {
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
     * Validate workspace data structure
     */
    validateWorkspaceData(workspace) {
        if (!workspace.id || !workspace.name || !workspace.createdAt) {
            return { success: false, error: 'Invalid workspace data structure' };
        }
        const nameValidation = InputValidator_1.InputValidator.validateText(workspace.name, {
            minLength: 1,
            maxLength: 100,
            allowSpecialChars: true,
        });
        if (!nameValidation.valid) {
            return { success: false, error: `Invalid workspace name: ${nameValidation.error}` };
        }
        return { success: true };
    }
    /**
     * Get the next position value
     */
    async getNextPosition() {
        const workspaces = this.getAllWorkspaces();
        if (workspaces.length === 0) {
            return 0;
        }
        const maxPosition = Math.max(...workspaces.map(w => w.position));
        return maxPosition + 1;
    }
    /**
     * Clear default flag from all workspaces
     */
    async clearDefaultWorkspaces() {
        const workspaces = this.store.get('workspaces', {});
        let hasChanges = false;
        for (const workspaceId in workspaces) {
            const workspace = workspaces[workspaceId];
            if (workspace?.isDefault) {
                workspaces[workspaceId] = {
                    ...workspace,
                    isDefault: false,
                    updatedAt: new Date(),
                };
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this.store.set('workspaces', workspaces);
        }
    }
}
exports.WorkspaceManager = WorkspaceManager;
exports.default = WorkspaceManager;
//# sourceMappingURL=WorkspaceManager.js.map