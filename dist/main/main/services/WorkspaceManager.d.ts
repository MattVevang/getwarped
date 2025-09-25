/**
 * Workspace Manager
 *
 * Manages workspace configurations with CRUD operations, positioning, and persistence.
 * Handles workspace lifecycle, service relationships, and workspace-specific settings.
 *
 * @fileoverview Central workspace management following Workspace interface
 */
import { Workspace, WorkspaceTheme } from '../../shared/types/Workspace';
/**
 * Result type for workspace operations
 */
export interface WorkspaceOperationResult<T = Workspace> {
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
 * Workspace creation request interface
 */
export interface CreateWorkspaceRequest {
    /** Workspace display name */
    name: string;
    /** Optional workspace description */
    description?: string;
    /** Custom theme configuration */
    theme?: WorkspaceTheme;
    /** Whether this is the default workspace */
    isDefault?: boolean;
}
/**
 * Workspace update request interface
 */
export interface UpdateWorkspaceRequest {
    /** Workspace ID to update */
    workspaceId: string;
    /** Updated workspace data */
    updates: Partial<Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>>;
}
/**
 * Workspace query options
 */
export interface WorkspaceQueryOptions {
    /** Search by name */
    nameFilter?: string;
    /** Include only default workspace */
    defaultOnly?: boolean;
    /** Sort field */
    sortBy?: keyof Workspace;
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
    /** Maximum results */
    limit?: number;
}
/**
 * Workspace statistics interface
 */
export interface WorkspaceStats {
    /** Total number of workspaces */
    totalWorkspaces: number;
    /** Number of default workspaces */
    defaultWorkspaces: number;
    /** Total services across all workspaces */
    totalServices: number;
    /** Average services per workspace */
    averageServicesPerWorkspace: number;
}
/**
 * WorkspaceManager class for managing workspace configurations
 */
export declare class WorkspaceManager {
    private store;
    constructor();
    /**
     * Create a new workspace
     */
    createWorkspace(request: CreateWorkspaceRequest): Promise<WorkspaceOperationResult>;
    /**
     * Update an existing workspace
     */
    updateWorkspace(request: UpdateWorkspaceRequest): Promise<WorkspaceOperationResult>;
    /**
     * Delete a workspace (only if it has no services)
     */
    deleteWorkspace(workspaceId: string, force?: boolean): Promise<WorkspaceOperationResult<void>>;
    /**
     * Get a workspace by ID
     */
    getWorkspaceById(workspaceId: string): Workspace | null;
    /**
     * Get all workspaces
     */
    getAllWorkspaces(): Workspace[];
    /**
     * Query workspaces with filtering and sorting options
     */
    queryWorkspaces(options?: WorkspaceQueryOptions): Workspace[];
    /**
     * Get the default workspace
     */
    getDefaultWorkspace(): Workspace | null;
    /**
     * Update workspace position
     */
    updateWorkspacePosition(workspaceId: string, newPosition: number): Promise<WorkspaceOperationResult>;
    /**
     * Reorder workspaces by moving one workspace to a new position
     */
    reorderWorkspaces(workspaceId: string, targetIndex: number): Promise<WorkspaceOperationResult<void>>;
    /**
     * Add a service to a workspace
     */
    addServiceToWorkspace(workspaceId: string, serviceId: string): Promise<WorkspaceOperationResult>;
    /**
     * Remove a service from a workspace
     */
    removeServiceFromWorkspace(workspaceId: string, serviceId: string): Promise<WorkspaceOperationResult>;
    /**
     * Get workspace statistics
     */
    getWorkspaceStats(): Promise<WorkspaceStats>;
    /**
     * Get workspace count
     */
    getWorkspaceCount(): number;
    /**
     * Clear all workspaces (for testing or reset)
     */
    clearAllWorkspaces(): void;
    /**
     * Export workspaces for backup
     */
    exportWorkspaces(): Workspace[];
    /**
     * Import workspaces from backup
     */
    importWorkspaces(workspaces: Workspace[], mergeStrategy?: 'replace' | 'merge'): Promise<WorkspaceOperationResult<{
        imported: number;
        skipped: number;
    }>>;
    /**
     * Validate workspace creation request
     */
    private validateCreateRequest;
    /**
     * Validate workspace update request
     */
    private validateUpdateRequest;
    /**
     * Validate workspace data structure
     */
    private validateWorkspaceData;
    /**
     * Get the next position value
     */
    private getNextPosition;
    /**
     * Clear default flag from all workspaces
     */
    private clearDefaultWorkspaces;
}
export default WorkspaceManager;
//# sourceMappingURL=WorkspaceManager.d.ts.map