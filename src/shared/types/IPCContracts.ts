/**
 * IPCContracts: Type-safe IPC communication interfaces
 *
 * Defines all request/response interfaces for Electron main-renderer communication.
 * These contracts ensure type safety and consistent error handling across all IPC channels.
 * Each channel has strictly typed request/response pairs with comprehensive validation.
 *
 * @fileoverview Complete IPC contract definitions for GetWarped application
 */

import { ServiceConfiguration, ServiceTheme } from './ServiceConfiguration';
import { Workspace, WorkspaceTheme } from './Workspace';
import { ExportMetadata } from './ConfigurationExport';
import {
  ApplicationState,
  GeneralSettings,
  PrivacySettings,
  AdvancedSettings,
} from './ApplicationState';

// =============================================================================
// SERVICE MANAGEMENT CONTRACTS
// =============================================================================

/**
 * Create new service configuration
 * Channel: service:create
 */
export interface CreateServiceRequest {
  workspaceId: string;
  name: string;
  url: string;
  icon?: string;
  iconType: 'url' | 'base64' | 'builtin';
  customUserAgent?: string;
  theme?: ServiceTheme;
}

export interface CreateServiceResponse {
  success: boolean;
  serviceId?: string;
  error?: string;
}

/**
 * Update existing service configuration
 * Channel: service:update
 */
export interface UpdateServiceRequest {
  serviceId: string;
  updates: Partial<ServiceConfiguration>;
}

export interface UpdateServiceResponse {
  success: boolean;
  error?: string;
}

/**
 * Delete service configuration
 * Channel: service:delete
 */
export interface DeleteServiceRequest {
  serviceId: string;
}

export interface DeleteServiceResponse {
  success: boolean;
  error?: string;
}

/**
 * Get list of services with optional workspace filter
 * Channel: service:list
 */
export interface GetServicesRequest {
  workspaceId?: string; // Optional filter by workspace
}

export interface GetServicesResponse {
  success: boolean;
  services: ServiceConfiguration[];
  error?: string;
}

/**
 * Reorder services within a workspace
 * Channel: service:reorder
 */
export interface ReorderServicesRequest {
  workspaceId: string;
  serviceIds: string[]; // New order
}

export interface ReorderServicesResponse {
  success: boolean;
  error?: string;
}

// =============================================================================
// WORKSPACE MANAGEMENT CONTRACTS
// =============================================================================

/**
 * Create new workspace
 * Channel: workspace:create
 */
export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  theme: WorkspaceTheme;
}

export interface CreateWorkspaceResponse {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

/**
 * Update existing workspace
 * Channel: workspace:update
 */
export interface UpdateWorkspaceRequest {
  workspaceId: string;
  updates: Partial<Workspace>;
}

export interface UpdateWorkspaceResponse {
  success: boolean;
  error?: string;
}

/**
 * Delete workspace with optional service migration
 * Channel: workspace:delete
 */
export interface DeleteWorkspaceRequest {
  workspaceId: string;
  moveServicesTo?: string; // Target workspace for existing services
}

export interface DeleteWorkspaceResponse {
  success: boolean;
  error?: string;
}

/**
 * Get all workspaces
 * Channel: workspace:list
 */
export interface GetWorkspacesRequest {
  // No parameters - returns all workspaces
}

export interface GetWorkspacesResponse {
  success: boolean;
  workspaces: Workspace[];
  error?: string;
}

/**
 * Set active/current workspace
 * Channel: workspace:activate
 */
export interface SetActiveWorkspaceRequest {
  workspaceId: string;
}

export interface SetActiveWorkspaceResponse {
  success: boolean;
  error?: string;
}

// =============================================================================
// SESSION MANAGEMENT CONTRACTS
// =============================================================================

/**
 * Save encrypted session data to OS credential storage
 * Internal use - not exposed via IPC
 */
export interface SaveSessionData {
  serviceId: string;
  sessionData: {
    cookies: string; // Serialized cookies
    localStorage: string; // JSON string of localStorage
    sessionStorage: string; // JSON string of sessionStorage
  };
}

/**
 * Load encrypted session data from OS credential storage
 * Internal use - not exposed via IPC
 */
export interface LoadSessionData {
  serviceId: string;
  sessionData?: {
    cookies: string;
    localStorage: string;
    sessionStorage: string;
  };
}

/**
 * Clear session data for specific service
 * Channel: session:clear
 */
export interface ClearSessionRequest {
  serviceId: string;
}

export interface ClearSessionResponse {
  success: boolean;
  error?: string;
}

/**
 * Clear all session data with optional workspace filter
 * Channel: session:clear-all
 */
export interface ClearAllSessionsRequest {
  workspaceId?: string; // Optional - clear only specific workspace
}

export interface ClearAllSessionsResponse {
  success: boolean;
  clearedCount: number;
  error?: string;
}

// =============================================================================
// BROWSERVIEW MANAGEMENT CONTRACTS
// =============================================================================

/**
 * Rectangle bounds for BrowserView positioning
 */
export interface ViewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Create new BrowserView for service
 * Channel: browserview:create
 */
export interface CreateBrowserViewRequest {
  serviceId: string;
  bounds: ViewBounds;
}

export interface CreateBrowserViewResponse {
  success: boolean;
  error?: string;
}

/**
 * Navigate service BrowserView to URL
 * Channel: browserview:navigate
 */
export interface NavigateServiceRequest {
  serviceId: string;
  url: string;
}

export interface NavigateServiceResponse {
  success: boolean;
  error?: string;
}

/**
 * Resize service BrowserView
 * Channel: browserview:resize
 */
export interface ResizeBrowserViewRequest {
  serviceId: string;
  bounds: ViewBounds;
}

export interface ResizeBrowserViewResponse {
  success: boolean;
  error?: string;
}

/**
 * Destroy service BrowserView
 * Channel: browserview:destroy
 */
export interface DestroyBrowserViewRequest {
  serviceId: string;
}

export interface DestroyBrowserViewResponse {
  success: boolean;
  error?: string;
}

// =============================================================================
// EXPORT/IMPORT CONTRACTS
// =============================================================================

/**
 * Export configuration to file
 * Channel: config:export
 */
export interface ExportConfigurationRequest {
  includeWorkspaces?: string[]; // Optional workspace filter
  filePath: string; // Target file path
}

export interface ExportConfigurationResponse {
  success: boolean;
  exportPath?: string;
  metadata?: ExportMetadata;
  error?: string;
}

/**
 * Import configuration from file
 * Channel: config:import
 */
export interface ImportConfigurationRequest {
  filePath: string;
  mergeStrategy: 'replace' | 'merge' | 'skip-duplicates';
}

export interface ImportConfigurationResponse {
  success: boolean;
  imported: {
    workspaces: number;
    services: number;
  };
  skipped: {
    workspaces: number;
    services: number;
  };
  error?: string;
}

/**
 * Validate import file before importing
 * Channel: config:validate
 */
export interface ValidateImportRequest {
  filePath: string;
}

export interface ValidateImportResponse {
  valid: boolean;
  metadata?: ExportMetadata;
  errors?: string[];
  warnings?: string[];
}

// =============================================================================
// SETTINGS MANAGEMENT CONTRACTS
// =============================================================================

/**
 * Get application settings
 * Channel: settings:get
 */
export interface GetSettingsRequest {
  category?: 'general' | 'privacy' | 'advanced'; // Optional filter
}

export interface GetSettingsResponse {
  success: boolean;
  settings: ApplicationState['settings'];
  error?: string;
}

/**
 * Update application settings
 * Channel: settings:update
 */
export interface UpdateSettingsRequest {
  category: 'general' | 'privacy' | 'advanced';
  updates: Partial<GeneralSettings | PrivacySettings | AdvancedSettings>;
}

export interface UpdateSettingsResponse {
  success: boolean;
  error?: string;
}

// =============================================================================
// EVENT NOTIFICATIONS (Main → Renderer)
// =============================================================================

/**
 * Service state change notification
 * Channel: service:state-changed
 */
export interface ServiceStateChangedEvent {
  serviceId: string;
  previousState: 'loading' | 'ready' | 'error' | 'offline';
  currentState: 'loading' | 'ready' | 'error' | 'offline';
  error?: string;
}

/**
 * Workspace change notification
 * Channel: workspace:changed
 */
export interface WorkspaceChangedEvent {
  workspaceId: string;
  changeType: 'created' | 'updated' | 'deleted' | 'activated';
  workspace?: Workspace;
}

/**
 * Session expiration notification
 * Channel: session:expired
 */
export interface SessionExpiredEvent {
  serviceId: string;
  serviceName: string;
  reason: 'timeout' | 'error' | 'logout';
}

/**
 * Service notification received
 * Channel: notification:received
 */
export interface NotificationReceivedEvent {
  serviceId: string;
  serviceName: string;
  title: string;
  body: string;
  icon?: string;
  timestamp: Date;
}

// =============================================================================
// ERROR HANDLING AND VALIDATION
// =============================================================================

/**
 * Standardized error format for all IPC responses
 */
export interface StandardError {
  code: string; // Error code (e.g., 'SERVICE_NOT_FOUND')
  message: string; // Human-readable error message
  details?: unknown; // Additional error context
  timestamp: Date; // Error occurrence time
}

/**
 * Common error codes used across IPC channels
 */
export enum IPCErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  WORKSPACE_NOT_FOUND = 'WORKSPACE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BROWSER_VIEW_ERROR = 'BROWSER_VIEW_ERROR',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  EXPORT_ERROR = 'EXPORT_ERROR',
  IMPORT_ERROR = 'IMPORT_ERROR',
  SESSION_ERROR = 'SESSION_ERROR',
}

/**
 * Validation result for request data
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

/**
 * IPC channel registry for type-safe communication
 */
export const IPC_CHANNELS = {
  // Service management
  SERVICE_CREATE: 'service:create',
  SERVICE_UPDATE: 'service:update',
  SERVICE_DELETE: 'service:delete',
  SERVICE_LIST: 'service:list',
  SERVICE_REORDER: 'service:reorder',

  // Workspace management
  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_ACTIVATE: 'workspace:activate',

  // Session management
  SESSION_CLEAR: 'session:clear',
  SESSION_CLEAR_ALL: 'session:clear-all',

  // BrowserView management
  BROWSERVIEW_CREATE: 'browserview:create',
  BROWSERVIEW_NAVIGATE: 'browserview:navigate',
  BROWSERVIEW_RESIZE: 'browserview:resize',
  BROWSERVIEW_DESTROY: 'browserview:destroy',

  // Configuration management
  CONFIG_EXPORT: 'config:export',
  CONFIG_IMPORT: 'config:import',
  CONFIG_VALIDATE: 'config:validate',

  // Settings management
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  // Event notifications (Main → Renderer)
  SERVICE_STATE_CHANGED: 'service:state-changed',
  WORKSPACE_CHANGED: 'workspace:changed',
  SESSION_EXPIRED: 'session:expired',
  NOTIFICATION_RECEIVED: 'notification:received',
} as const;

/**
 * Type for IPC channel names
 */
export type IPCChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Union type for all IPC request interfaces
 */
export type IPCRequest =
  | CreateServiceRequest
  | UpdateServiceRequest
  | DeleteServiceRequest
  | GetServicesRequest
  | ReorderServicesRequest
  | CreateWorkspaceRequest
  | UpdateWorkspaceRequest
  | DeleteWorkspaceRequest
  | GetWorkspacesRequest
  | SetActiveWorkspaceRequest
  | ClearSessionRequest
  | ClearAllSessionsRequest
  | CreateBrowserViewRequest
  | NavigateServiceRequest
  | ResizeBrowserViewRequest
  | DestroyBrowserViewRequest
  | ExportConfigurationRequest
  | ImportConfigurationRequest
  | ValidateImportRequest
  | GetSettingsRequest
  | UpdateSettingsRequest;

/**
 * Union type for all IPC response interfaces
 */
export type IPCResponse =
  | CreateServiceResponse
  | UpdateServiceResponse
  | DeleteServiceResponse
  | GetServicesResponse
  | ReorderServicesResponse
  | CreateWorkspaceResponse
  | UpdateWorkspaceResponse
  | DeleteWorkspaceResponse
  | GetWorkspacesResponse
  | SetActiveWorkspaceResponse
  | ClearSessionResponse
  | ClearAllSessionsResponse
  | CreateBrowserViewResponse
  | NavigateServiceResponse
  | ResizeBrowserViewResponse
  | DestroyBrowserViewResponse
  | ExportConfigurationResponse
  | ImportConfigurationResponse
  | ValidateImportResponse
  | GetSettingsResponse
  | UpdateSettingsResponse;

/**
 * Union type for all event notification interfaces
 */
export type IPCEvent =
  | ServiceStateChangedEvent
  | WorkspaceChangedEvent
  | SessionExpiredEvent
  | NotificationReceivedEvent;

/**
 * Helper type to map channel names to their request/response types
 */
export interface IPCChannelMap {
  [IPC_CHANNELS.SERVICE_CREATE]: {
    request: CreateServiceRequest;
    response: CreateServiceResponse;
  };
  [IPC_CHANNELS.SERVICE_UPDATE]: {
    request: UpdateServiceRequest;
    response: UpdateServiceResponse;
  };
  [IPC_CHANNELS.SERVICE_DELETE]: {
    request: DeleteServiceRequest;
    response: DeleteServiceResponse;
  };
  [IPC_CHANNELS.SERVICE_LIST]: {
    request: GetServicesRequest;
    response: GetServicesResponse;
  };
  [IPC_CHANNELS.SERVICE_REORDER]: {
    request: ReorderServicesRequest;
    response: ReorderServicesResponse;
  };
  [IPC_CHANNELS.WORKSPACE_CREATE]: {
    request: CreateWorkspaceRequest;
    response: CreateWorkspaceResponse;
  };
  [IPC_CHANNELS.WORKSPACE_UPDATE]: {
    request: UpdateWorkspaceRequest;
    response: UpdateWorkspaceResponse;
  };
  [IPC_CHANNELS.WORKSPACE_DELETE]: {
    request: DeleteWorkspaceRequest;
    response: DeleteWorkspaceResponse;
  };
  [IPC_CHANNELS.WORKSPACE_LIST]: {
    request: GetWorkspacesRequest;
    response: GetWorkspacesResponse;
  };
  [IPC_CHANNELS.WORKSPACE_ACTIVATE]: {
    request: SetActiveWorkspaceRequest;
    response: SetActiveWorkspaceResponse;
  };
  [IPC_CHANNELS.SESSION_CLEAR]: {
    request: ClearSessionRequest;
    response: ClearSessionResponse;
  };
  [IPC_CHANNELS.SESSION_CLEAR_ALL]: {
    request: ClearAllSessionsRequest;
    response: ClearAllSessionsResponse;
  };
  [IPC_CHANNELS.BROWSERVIEW_CREATE]: {
    request: CreateBrowserViewRequest;
    response: CreateBrowserViewResponse;
  };
  [IPC_CHANNELS.BROWSERVIEW_NAVIGATE]: {
    request: NavigateServiceRequest;
    response: NavigateServiceResponse;
  };
  [IPC_CHANNELS.BROWSERVIEW_RESIZE]: {
    request: ResizeBrowserViewRequest;
    response: ResizeBrowserViewResponse;
  };
  [IPC_CHANNELS.BROWSERVIEW_DESTROY]: {
    request: DestroyBrowserViewRequest;
    response: DestroyBrowserViewResponse;
  };
  [IPC_CHANNELS.CONFIG_EXPORT]: {
    request: ExportConfigurationRequest;
    response: ExportConfigurationResponse;
  };
  [IPC_CHANNELS.CONFIG_IMPORT]: {
    request: ImportConfigurationRequest;
    response: ImportConfigurationResponse;
  };
  [IPC_CHANNELS.CONFIG_VALIDATE]: {
    request: ValidateImportRequest;
    response: ValidateImportResponse;
  };
  [IPC_CHANNELS.SETTINGS_GET]: {
    request: GetSettingsRequest;
    response: GetSettingsResponse;
  };
  [IPC_CHANNELS.SETTINGS_UPDATE]: {
    request: UpdateSettingsRequest;
    response: UpdateSettingsResponse;
  };
}

/**
 * Type-safe IPC helper for extracting request/response types
 */
export type IPCRequestType<T extends IPCChannelName> = T extends keyof IPCChannelMap
  ? IPCChannelMap[T]['request']
  : never;

export type IPCResponseType<T extends IPCChannelName> = T extends keyof IPCChannelMap
  ? IPCChannelMap[T]['response']
  : never;
