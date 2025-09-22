/**
 * Workspace IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for workspace-related operations.
 * Bridges renderer process requests to WorkspaceManager with proper validation,
 * error handling, and response formatting.
 *
 * @fileoverview IPC handlers for workspace operations (create, update, delete, query, reorder)
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import {
  WorkspaceManager,
  CreateWorkspaceRequest as WorkspaceManagerCreateRequest,
  UpdateWorkspaceRequest as WorkspaceManagerUpdateRequest,
  WorkspaceQueryOptions,
  WorkspaceStats,
} from '../services/WorkspaceManager';
import { Workspace } from '../../shared/types/Workspace';
import { InputValidator } from '../../shared/validation/InputValidator';

/**
 * Workspace creation request
 */
export interface CreateWorkspaceRequest {
  /** Workspace name */
  name: string;
  /** Workspace description (optional) */
  description?: string;
  /** Custom theme configuration (optional) */
  theme?: any;
  /** Whether this is the default workspace (optional) */
  isDefault?: boolean;
}

/**
 * Workspace update request
 */
export interface UpdateWorkspaceRequest {
  /** Workspace ID */
  id: string;
  /** Updated workspace data */
  updates: Partial<Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Workspace reorder request
 */
export interface ReorderWorkspaceRequest {
  /** Workspace ID to reorder */
  workspaceId: string;
  /** New position index */
  targetIndex: number;
}

/**
 * Workspace service management request
 */
export interface WorkspaceServiceRequest {
  /** Workspace ID */
  workspaceId: string;
  /** Service ID */
  serviceId: string;
}

/**
 * Workspace import request
 */
export interface ImportWorkspaceRequest {
  /** Workspaces to import */
  workspaces: Workspace[];
  /** Merge strategy */
  mergeStrategy?: 'replace' | 'merge';
}

/**
 * Standard IPC response interface for successful operations
 */
export interface IPCSuccessResponse<T> {
  success: true;
  data: T;
  warnings?: string[];
}

/**
 * Standard IPC response interface for failed operations
 */
export interface IPCErrorResponse {
  success: false;
  error: string;
  warnings?: string[];
}

/**
 * Union type for all IPC responses
 */
export type IPCResponse<T = any> = IPCSuccessResponse<T> | IPCErrorResponse;

/**
 * WorkspaceHandlers class for managing workspace-related IPC operations
 */
export class WorkspaceHandlers {
  private workspaceManager: WorkspaceManager;

  constructor() {
    this.workspaceManager = new WorkspaceManager();
    this.registerHandlers();
  }

  /**
   * Register all IPC handlers
   */
  private registerHandlers(): void {
    // Create workspace
    ipcMain.handle('workspace:create', this.handleCreateWorkspace.bind(this));

    // Update workspace
    ipcMain.handle('workspace:update', this.handleUpdateWorkspace.bind(this));

    // Delete workspace
    ipcMain.handle('workspace:delete', this.handleDeleteWorkspace.bind(this));

    // Get workspace by ID
    ipcMain.handle('workspace:get', this.handleGetWorkspace.bind(this));

    // List all workspaces
    ipcMain.handle('workspace:list', this.handleListWorkspaces.bind(this));

    // Query workspaces with filtering
    ipcMain.handle('workspace:query', this.handleQueryWorkspaces.bind(this));

    // Reorder workspaces
    ipcMain.handle('workspace:reorder', this.handleReorderWorkspaces.bind(this));

    // Get default workspace
    ipcMain.handle('workspace:getDefault', this.handleGetDefaultWorkspace.bind(this));

    // Add service to workspace
    ipcMain.handle('workspace:addService', this.handleAddServiceToWorkspace.bind(this));

    // Remove service from workspace
    ipcMain.handle('workspace:removeService', this.handleRemoveServiceFromWorkspace.bind(this));

    // Update workspace position
    ipcMain.handle('workspace:updatePosition', this.handleUpdateWorkspacePosition.bind(this));

    // Get workspace statistics
    ipcMain.handle('workspace:getStats', this.handleGetWorkspaceStats.bind(this));

    // Export workspaces
    ipcMain.handle('workspace:export', this.handleExportWorkspaces.bind(this));

    // Import workspaces
    ipcMain.handle('workspace:import', this.handleImportWorkspaces.bind(this));

    // Clear all workspaces
    ipcMain.handle('workspace:clear', this.handleClearAllWorkspaces.bind(this));
  }

  /**
   * Handle workspace creation
   */
  private async handleCreateWorkspace(
    _event: IpcMainInvokeEvent,
    request: CreateWorkspaceRequest
  ): Promise<IPCResponse<Workspace>> {
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
      const createRequest: WorkspaceManagerCreateRequest = {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create workspace',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to create workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle workspace update
   */
  private async handleUpdateWorkspace(
    _event: IpcMainInvokeEvent,
    request: UpdateWorkspaceRequest
  ): Promise<IPCResponse<Workspace>> {
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
      const updateRequest: WorkspaceManagerUpdateRequest = {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update workspace',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle workspace deletion
   */
  private async handleDeleteWorkspace(
    _event: IpcMainInvokeEvent,
    workspaceId: string,
    force: boolean = false
  ): Promise<IPCResponse<void>> {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to delete workspace',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle getting workspace by ID
   */
  private async handleGetWorkspace(
    _event: IpcMainInvokeEvent,
    workspaceId: string
  ): Promise<IPCResponse<Workspace | null>> {
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
    } catch (error) {
      return {
        success: false,
        error: `Failed to get workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle listing all workspaces
   */
  private async handleListWorkspaces(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<Workspace[]>> {
    try {
      const workspaces = this.workspaceManager.getAllWorkspaces();

      return {
        success: true,
        data: workspaces,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle querying workspaces with filters
   */
  private async handleQueryWorkspaces(
    _event: IpcMainInvokeEvent,
    options: WorkspaceQueryOptions = {}
  ): Promise<IPCResponse<Workspace[]>> {
    try {
      const workspaces = this.workspaceManager.queryWorkspaces(options);

      return {
        success: true,
        data: workspaces,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to query workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle workspace reordering
   */
  private async handleReorderWorkspaces(
    _event: IpcMainInvokeEvent,
    request: ReorderWorkspaceRequest
  ): Promise<IPCResponse<void>> {
    try {
      // Validate input
      const validation = this.validateReorderWorkspaceRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid reorder request',
        };
      }

      const result = await this.workspaceManager.reorderWorkspaces(
        request.workspaceId,
        request.targetIndex
      );

      if (result.success) {
        return {
          success: true,
          data: undefined,
          ...(result.warnings && { warnings: result.warnings }),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to reorder workspaces',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to reorder workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle getting default workspace
   */
  private async handleGetDefaultWorkspace(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<Workspace | null>> {
    try {
      const workspace = this.workspaceManager.getDefaultWorkspace();

      return {
        success: true,
        data: workspace,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get default workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle adding service to workspace
   */
  private async handleAddServiceToWorkspace(
    _event: IpcMainInvokeEvent,
    request: WorkspaceServiceRequest
  ): Promise<IPCResponse<Workspace>> {
    try {
      // Validate input
      const validation = this.validateWorkspaceServiceRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid workspace service request',
        };
      }

      const result = await this.workspaceManager.addServiceToWorkspace(
        request.workspaceId,
        request.serviceId
      );

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          ...(result.warnings && { warnings: result.warnings }),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to add service to workspace',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to add service to workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle removing service from workspace
   */
  private async handleRemoveServiceFromWorkspace(
    _event: IpcMainInvokeEvent,
    request: WorkspaceServiceRequest
  ): Promise<IPCResponse<Workspace>> {
    try {
      // Validate input
      const validation = this.validateWorkspaceServiceRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid workspace service request',
        };
      }

      const result = await this.workspaceManager.removeServiceFromWorkspace(
        request.workspaceId,
        request.serviceId
      );

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          ...(result.warnings && { warnings: result.warnings }),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to remove service from workspace',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove service from workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle updating workspace position
   */
  private async handleUpdateWorkspacePosition(
    _event: IpcMainInvokeEvent,
    workspaceId: string,
    newPosition: number
  ): Promise<IPCResponse<Workspace>> {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update workspace position',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update workspace position: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle getting workspace statistics
   */
  private async handleGetWorkspaceStats(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<WorkspaceStats>> {
    try {
      const stats = await this.workspaceManager.getWorkspaceStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get workspace statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle exporting workspaces
   */
  private async handleExportWorkspaces(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<Workspace[]>> {
    try {
      const workspaces = this.workspaceManager.exportWorkspaces();

      return {
        success: true,
        data: workspaces,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to export workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle importing workspaces
   */
  private async handleImportWorkspaces(
    _event: IpcMainInvokeEvent,
    request: ImportWorkspaceRequest
  ): Promise<IPCResponse<{ imported: number; skipped: number }>> {
    try {
      // Validate input
      const validation = this.validateImportWorkspaceRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid import request',
        };
      }

      const result = await this.workspaceManager.importWorkspaces(
        request.workspaces,
        request.mergeStrategy || 'merge'
      );

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          ...(result.warnings && { warnings: result.warnings }),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to import workspaces',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to import workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle clearing all workspaces
   */
  private async handleClearAllWorkspaces(_event: IpcMainInvokeEvent): Promise<IPCResponse<void>> {
    try {
      this.workspaceManager.clearAllWorkspaces();

      return {
        success: true,
        data: undefined,
        warnings: ['All workspaces have been cleared'],
      };
    } catch (error) {
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
  private validateCreateWorkspaceRequest(request: CreateWorkspaceRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request) {
      return { valid: false, error: 'Request is required' };
    }

    if (!request.name?.trim()) {
      return { valid: false, error: 'Workspace name is required' };
    }

    const nameValidation = InputValidator.validateText(request.name, {
      minLength: 1,
      maxLength: 100,
      allowSpecialChars: true,
    });
    if (!nameValidation.valid) {
      return { valid: false, error: `Invalid workspace name: ${nameValidation.error}` };
    }

    if (request.description) {
      const descValidation = InputValidator.validateText(request.description, {
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
  private validateUpdateWorkspaceRequest(request: UpdateWorkspaceRequest): {
    valid: boolean;
    error?: string;
  } {
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

      const nameValidation = InputValidator.validateText(request.updates.name, {
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
      const descValidation = InputValidator.validateText(request.updates.description, {
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
  private validateReorderWorkspaceRequest(request: ReorderWorkspaceRequest): {
    valid: boolean;
    error?: string;
  } {
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
  private validateWorkspaceServiceRequest(request: WorkspaceServiceRequest): {
    valid: boolean;
    error?: string;
  } {
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
  private validateImportWorkspaceRequest(request: ImportWorkspaceRequest): {
    valid: boolean;
    error?: string;
  } {
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

export default WorkspaceHandlers;
