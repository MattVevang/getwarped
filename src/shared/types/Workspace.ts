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
export function isWorkspace(obj: unknown): obj is Workspace {
  if (!obj || typeof obj !== 'object') return false;

  const workspace = obj as Partial<Workspace>;

  return (
    typeof workspace.id === 'string' &&
    typeof workspace.name === 'string' &&
    (workspace.description === undefined || typeof workspace.description === 'string') &&
    Array.isArray(workspace.services) &&
    workspace.services.every(id => typeof id === 'string') &&
    isWorkspaceTheme(workspace.theme) &&
    typeof workspace.isDefault === 'boolean' &&
    typeof workspace.position === 'number' &&
    workspace.createdAt instanceof Date &&
    workspace.updatedAt instanceof Date
  );
}

/**
 * Type guard to check if an object is a valid WorkspaceTheme
 *
 * @param obj - Object to validate
 * @returns True if object matches WorkspaceTheme interface
 */
export function isWorkspaceTheme(obj: unknown): obj is WorkspaceTheme {
  if (!obj || typeof obj !== 'object') return false;

  const theme = obj as Partial<WorkspaceTheme>;

  return (
    typeof theme.primaryColor === 'string' &&
    typeof theme.secondaryColor === 'string' &&
    typeof theme.backgroundColor === 'string' &&
    typeof theme.sidebarColor === 'string' &&
    typeof theme.textColor === 'string' &&
    typeof theme.accentColor === 'string'
  );
}

/**
 * Predefined workspace themes for common use cases
 */
export const WORKSPACE_THEMES = {
  /** Professional blue theme suitable for work environments */
  WORK: {
    primaryColor: '#2563EB', // Blue-600
    secondaryColor: '#3B82F6', // Blue-500
    backgroundColor: '#F8FAFC', // Slate-50
    sidebarColor: '#1E293B', // Slate-800
    textColor: '#0F172A', // Slate-900
    accentColor: '#10B981', // Emerald-500
  } as WorkspaceTheme,

  /** Warm personal theme for personal use */
  PERSONAL: {
    primaryColor: '#DC2626', // Red-600
    secondaryColor: '#EF4444', // Red-500
    backgroundColor: '#FEF2F2', // Red-50
    sidebarColor: '#7C2D12', // Red-900
    textColor: '#1F2937', // Gray-800
    accentColor: '#F59E0B', // Amber-500
  } as WorkspaceTheme,

  /** Modern dark theme */
  DARK: {
    primaryColor: '#6366F1', // Indigo-500
    secondaryColor: '#8B5CF6', // Violet-500
    backgroundColor: '#0F172A', // Slate-900
    sidebarColor: '#1E1E2E', // Custom dark
    textColor: '#F1F5F9', // Slate-100
    accentColor: '#06B6D4', // Cyan-500
  } as WorkspaceTheme,

  /** Light neutral theme */
  LIGHT: {
    primaryColor: '#6B7280', // Gray-500
    secondaryColor: '#9CA3AF', // Gray-400
    backgroundColor: '#FFFFFF', // White
    sidebarColor: '#F3F4F6', // Gray-100
    textColor: '#111827', // Gray-900
    accentColor: '#3B82F6', // Blue-500
  } as WorkspaceTheme,
};

/**
 * Default workspace theme used as fallback
 */
export const DEFAULT_WORKSPACE_THEME: WorkspaceTheme = WORKSPACE_THEMES.LIGHT;

/**
 * Creates a new Workspace with default values
 * Useful for workspace creation forms and setup wizards
 *
 * @param partial - Partial workspace configuration
 * @returns Complete Workspace with defaults applied
 */
export function createWorkspace(partial: Partial<Workspace> & Pick<Workspace, 'name'>): Workspace {
  const now = new Date();

  return {
    id: generateUUID(),
    description: '',
    services: [],
    theme: DEFAULT_WORKSPACE_THEME,
    isDefault: false,
    position: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * Adds a service to a workspace's service list
 * Updates the updatedAt timestamp and maintains service order
 *
 * @param workspace - Workspace to modify
 * @param serviceId - Service ID to add
 * @returns Updated workspace
 */
export function addServiceToWorkspace(workspace: Workspace, serviceId: string): Workspace {
  if (workspace.services.includes(serviceId)) {
    return workspace; // Service already exists
  }

  return {
    ...workspace,
    services: [...workspace.services, serviceId],
    updatedAt: new Date(),
  };
}

/**
 * Removes a service from a workspace's service list
 * Updates the updatedAt timestamp
 *
 * @param workspace - Workspace to modify
 * @param serviceId - Service ID to remove
 * @returns Updated workspace
 */
export function removeServiceFromWorkspace(workspace: Workspace, serviceId: string): Workspace {
  return {
    ...workspace,
    services: workspace.services.filter(id => id !== serviceId),
    updatedAt: new Date(),
  };
}

/**
 * Reorders services within a workspace
 * Updates the updatedAt timestamp
 *
 * @param workspace - Workspace to modify
 * @param newServiceOrder - New order of service IDs
 * @returns Updated workspace
 */
export function reorderWorkspaceServices(
  workspace: Workspace,
  newServiceOrder: string[]
): Workspace {
  // Validate that all services are accounted for
  if (
    newServiceOrder.length !== workspace.services.length ||
    !newServiceOrder.every(id => workspace.services.includes(id))
  ) {
    throw new Error('Invalid service order: must include all existing services');
  }

  return {
    ...workspace,
    services: newServiceOrder,
    updatedAt: new Date(),
  };
}

/**
 * Simple UUID generator for workspace IDs
 * In production, consider using a more robust UUID library
 *
 * @returns UUID v4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
