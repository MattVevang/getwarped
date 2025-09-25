/**
 * Workspace IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for workspace-related operations.
 * Bridges renderer process requests to WorkspaceManager with proper validation,
 * error handling, and response formatting.
 *
 * @fileoverview IPC handlers for workspace operations (create, update, delete, query, reorder)
 */
import { Workspace } from '../../shared/types/Workspace';
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
export declare class WorkspaceHandlers {
    private workspaceManager;
    constructor();
    /**
     * Register all IPC handlers
     */
    private registerHandlers;
    /**
     * Handle workspace creation
     */
    private handleCreateWorkspace;
    /**
     * Handle workspace update
     */
    private handleUpdateWorkspace;
    /**
     * Handle workspace deletion
     */
    private handleDeleteWorkspace;
    /**
     * Handle getting workspace by ID
     */
    private handleGetWorkspace;
    /**
     * Handle listing all workspaces
     */
    private handleListWorkspaces;
    /**
     * Handle querying workspaces with filters
     */
    private handleQueryWorkspaces;
    /**
     * Handle workspace reordering
     */
    private handleReorderWorkspaces;
    /**
     * Handle getting default workspace
     */
    private handleGetDefaultWorkspace;
    /**
     * Handle adding service to workspace
     */
    private handleAddServiceToWorkspace;
    /**
     * Handle removing service from workspace
     */
    private handleRemoveServiceFromWorkspace;
    /**
     * Handle updating workspace position
     */
    private handleUpdateWorkspacePosition;
    /**
     * Handle getting workspace statistics
     */
    private handleGetWorkspaceStats;
    /**
     * Handle exporting workspaces
     */
    private handleExportWorkspaces;
    /**
     * Handle importing workspaces
     */
    private handleImportWorkspaces;
    /**
     * Handle clearing all workspaces
     */
    private handleClearAllWorkspaces;
    /**
     * Validate create workspace request
     */
    private validateCreateWorkspaceRequest;
    /**
     * Validate update workspace request
     */
    private validateUpdateWorkspaceRequest;
    /**
     * Validate reorder workspace request
     */
    private validateReorderWorkspaceRequest;
    /**
     * Validate workspace service request
     */
    private validateWorkspaceServiceRequest;
    /**
     * Validate import workspace request
     */
    private validateImportWorkspaceRequest;
}
export default WorkspaceHandlers;
//# sourceMappingURL=WorkspaceHandlers.d.ts.map