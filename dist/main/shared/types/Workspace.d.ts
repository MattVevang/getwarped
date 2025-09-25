/**
 * Workspace: Core interface for service groupings and workspace management
 *
 * Represents a logical grouping of services with shared configuration and theming.
 * Workspaces allow users to organize services by context (e.g., "Work", "Personal").
 *
 * @fileoverview Workspace and WorkspaceTheme interfaces
 */
/**
 * Workspace-wide theming configuration
 * Controls the visual appearance and color scheme for the entire workspace
 */
export interface WorkspaceTheme {
    /** Main theme color for workspace branding */
    primaryColor: string;
    /** Secondary theme color for accents and highlights */
    secondaryColor: string;
    /** Background color for workspace content areas */
    backgroundColor: string;
    /** Sidebar background color */
    sidebarColor: string;
    /** Primary text color for readability */
    textColor: string;
    /** Accent/highlight color for interactive elements */
    accentColor: string;
}
/**
 * Workspace configuration and service grouping
 *
 * A workspace represents a collection of services that logically belong together,
 * such as all work-related services or personal services. Each workspace has its
 * own theme and can contain multiple ServiceConfiguration instances.
 *
 * @example
 * ```typescript
 * const workWorkspace: Workspace = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: 'Work',
 *   description: 'All work-related services and tools',
 *   services: ['gmail-service-id', 'slack-service-id', 'github-service-id'],
 *   theme: WORK_THEME,
 *   isDefault: false,
 *   position: 0,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export interface Workspace {
    /** Unique identifier (UUID) */
    id: string;
    /** Display name (e.g., "Work", "Personal") */
    name: string;
    /** Optional description for workspace purpose */
    description?: string;
    /** Array of ServiceConfiguration IDs belonging to this workspace */
    services: string[];
    /** Workspace-wide theming configuration */
    theme: WorkspaceTheme;
    /** Default workspace flag - one workspace should be marked as default */
    isDefault: boolean;
    /** Display order in sidebar (0-based, lower = higher priority) */
    position: number;
    /** Creation timestamp */
    createdAt: Date;
    /** Last modification timestamp */
    updatedAt: Date;
}
/**
 * Type guard to check if an object is a valid Workspace
 * Useful for runtime type checking, especially during import/deserialization
 *
 * @param obj - Object to validate
 * @returns True if object matches Workspace interface
 */
export declare function isWorkspace(obj: unknown): obj is Workspace;
/**
 * Type guard to check if an object is a valid WorkspaceTheme
 *
 * @param obj - Object to validate
 * @returns True if object matches WorkspaceTheme interface
 */
export declare function isWorkspaceTheme(obj: unknown): obj is WorkspaceTheme;
/**
 * Predefined workspace themes for common use cases
 */
export declare const WORKSPACE_THEMES: {
    /** Professional blue theme suitable for work environments */
    WORK: WorkspaceTheme;
    /** Warm personal theme for personal use */
    PERSONAL: WorkspaceTheme;
    /** Modern dark theme */
    DARK: WorkspaceTheme;
    /** Light neutral theme */
    LIGHT: WorkspaceTheme;
};
/**
 * Default workspace theme used as fallback
 */
export declare const DEFAULT_WORKSPACE_THEME: WorkspaceTheme;
/**
 * Creates a new Workspace with default values
 * Useful for workspace creation forms and setup wizards
 *
 * @param partial - Partial workspace configuration
 * @returns Complete Workspace with defaults applied
 */
export declare function createWorkspace(partial: Partial<Workspace> & Pick<Workspace, 'name'>): Workspace;
/**
 * Adds a service to a workspace's service list
 * Updates the updatedAt timestamp and maintains service order
 *
 * @param workspace - Workspace to modify
 * @param serviceId - Service ID to add
 * @returns Updated workspace
 */
export declare function addServiceToWorkspace(workspace: Workspace, serviceId: string): Workspace;
/**
 * Removes a service from a workspace's service list
 * Updates the updatedAt timestamp
 *
 * @param workspace - Workspace to modify
 * @param serviceId - Service ID to remove
 * @returns Updated workspace
 */
export declare function removeServiceFromWorkspace(workspace: Workspace, serviceId: string): Workspace;
/**
 * Reorders services within a workspace
 * Updates the updatedAt timestamp
 *
 * @param workspace - Workspace to modify
 * @param newServiceOrder - New order of service IDs
 * @returns Updated workspace
 */
export declare function reorderWorkspaceServices(workspace: Workspace, newServiceOrder: string[]): Workspace;
//# sourceMappingURL=Workspace.d.ts.map