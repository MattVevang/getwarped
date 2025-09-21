# IPC Contracts: Main ↔ Renderer Communication

**Feature**: GetWarped: Secure Multi-Service Workspace App  
**Date**: September 20, 2025  
**Branch**: `001-title-getwarped-secure`

## Service Management Contracts

### CreateService

**Direction**: Renderer → Main  
**Channel**: `service:create`

```typescript
interface CreateServiceRequest {
  workspaceId: string;
  name: string;
  url: string;
  icon?: string;
  iconType: 'url' | 'base64' | 'builtin';
  customUserAgent?: string;
  theme?: ServiceTheme;
}

interface CreateServiceResponse {
  success: boolean;
  serviceId?: string;
  error?: string;
}
```

### UpdateService

**Direction**: Renderer → Main  
**Channel**: `service:update`

```typescript
interface UpdateServiceRequest {
  serviceId: string;
  updates: Partial<ServiceConfiguration>;
}

interface UpdateServiceResponse {
  success: boolean;
  error?: string;
}
```

### DeleteService

**Direction**: Renderer → Main  
**Channel**: `service:delete`

```typescript
interface DeleteServiceRequest {
  serviceId: string;
}

interface DeleteServiceResponse {
  success: boolean;
  error?: string;
}
```

### GetServices

**Direction**: Renderer → Main  
**Channel**: `service:list`

```typescript
interface GetServicesRequest {
  workspaceId?: string; // Optional filter by workspace
}

interface GetServicesResponse {
  success: boolean;
  services: ServiceConfiguration[];
  error?: string;
}
```

### ReorderServices

**Direction**: Renderer → Main  
**Channel**: `service:reorder`

```typescript
interface ReorderServicesRequest {
  workspaceId: string;
  serviceIds: string[]; // New order
}

interface ReorderServicesResponse {
  success: boolean;
  error?: string;
}
```

## Workspace Management Contracts

### CreateWorkspace

**Direction**: Renderer → Main  
**Channel**: `workspace:create`

```typescript
interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  theme: WorkspaceTheme;
}

interface CreateWorkspaceResponse {
  success: boolean;
  workspaceId?: string;
  error?: string;
}
```

### UpdateWorkspace

**Direction**: Renderer → Main  
**Channel**: `workspace:update`

```typescript
interface UpdateWorkspaceRequest {
  workspaceId: string;
  updates: Partial<Workspace>;
}

interface UpdateWorkspaceResponse {
  success: boolean;
  error?: string;
}
```

### DeleteWorkspace

**Direction**: Renderer → Main  
**Channel**: `workspace:delete`

```typescript
interface DeleteWorkspaceRequest {
  workspaceId: string;
  moveServicesTo?: string; // Target workspace for existing services
}

interface DeleteWorkspaceResponse {
  success: boolean;
  error?: string;
}
```

### GetWorkspaces

**Direction**: Renderer → Main  
**Channel**: `workspace:list`

```typescript
interface GetWorkspacesRequest {
  // No parameters - returns all workspaces
}

interface GetWorkspacesResponse {
  success: boolean;
  workspaces: Workspace[];
  error?: string;
}
```

### SetActiveWorkspace

**Direction**: Renderer → Main  
**Channel**: `workspace:activate`

```typescript
interface SetActiveWorkspaceRequest {
  workspaceId: string;
}

interface SetActiveWorkspaceResponse {
  success: boolean;
  error?: string;
}
```

## Session Management Contracts

### SaveSession

**Direction**: Main → Main (internal)  
**Channel**: Internal only - uses keytar directly

```typescript
interface SaveSessionData {
  serviceId: string;
  sessionData: {
    cookies: string; // Serialized cookies
    localStorage: string; // JSON string of localStorage
    sessionStorage: string; // JSON string of sessionStorage
  };
}
```

### LoadSession

**Direction**: Main → Main (internal)  
**Channel**: Internal only - uses keytar directly

```typescript
interface LoadSessionData {
  serviceId: string;
  sessionData?: {
    cookies: string;
    localStorage: string;
    sessionStorage: string;
  };
}
```

### ClearSession

**Direction**: Renderer → Main  
**Channel**: `session:clear`

```typescript
interface ClearSessionRequest {
  serviceId: string;
}

interface ClearSessionResponse {
  success: boolean;
  error?: string;
}
```

### ClearAllSessions

**Direction**: Renderer → Main  
**Channel**: `session:clear-all`

```typescript
interface ClearAllSessionsRequest {
  workspaceId?: string; // Optional - clear only specific workspace
}

interface ClearAllSessionsResponse {
  success: boolean;
  clearedCount: number;
  error?: string;
}
```

## BrowserView Management Contracts

### CreateBrowserView

**Direction**: Renderer → Main  
**Channel**: `browserview:create`

```typescript
interface CreateBrowserViewRequest {
  serviceId: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface CreateBrowserViewResponse {
  success: boolean;
  error?: string;
}
```

### NavigateService

**Direction**: Renderer → Main  
**Channel**: `browserview:navigate`

```typescript
interface NavigateServiceRequest {
  serviceId: string;
  url: string;
}

interface NavigateServiceResponse {
  success: boolean;
  error?: string;
}
```

### ResizeBrowserView

**Direction**: Renderer → Main  
**Channel**: `browserview:resize`

```typescript
interface ResizeBrowserViewRequest {
  serviceId: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ResizeBrowserViewResponse {
  success: boolean;
  error?: string;
}
```

### DestroyBrowserView

**Direction**: Renderer → Main  
**Channel**: `browserview:destroy`

```typescript
interface DestroyBrowserViewRequest {
  serviceId: string;
}

interface DestroyBrowserViewResponse {
  success: boolean;
  error?: string;
}
```

## Export/Import Contracts

### ExportConfiguration

**Direction**: Renderer → Main  
**Channel**: `config:export`

```typescript
interface ExportConfigurationRequest {
  includeWorkspaces?: string[]; // Optional workspace filter
  filePath: string; // Target file path
}

interface ExportConfigurationResponse {
  success: boolean;
  exportPath?: string;
  metadata?: ExportMetadata;
  error?: string;
}
```

### ImportConfiguration

**Direction**: Renderer → Main  
**Channel**: `config:import`

```typescript
interface ImportConfigurationRequest {
  filePath: string;
  mergeStrategy: 'replace' | 'merge' | 'skip-duplicates';
}

interface ImportConfigurationResponse {
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
```

### ValidateImport

**Direction**: Renderer → Main  
**Channel**: `config:validate`

```typescript
interface ValidateImportRequest {
  filePath: string;
}

interface ValidateImportResponse {
  valid: boolean;
  metadata?: ExportMetadata;
  errors?: string[];
  warnings?: string[];
}
```

## Settings Management Contracts

### GetSettings

**Direction**: Renderer → Main  
**Channel**: `settings:get`

```typescript
interface GetSettingsRequest {
  category?: 'general' | 'privacy' | 'advanced'; // Optional filter
}

interface GetSettingsResponse {
  success: boolean;
  settings: SettingsState;
  error?: string;
}
```

### UpdateSettings

**Direction**: Renderer → Main  
**Channel**: `settings:update`

```typescript
interface UpdateSettingsRequest {
  category: 'general' | 'privacy' | 'advanced';
  updates: Partial<GeneralSettings | PrivacySettings | AdvancedSettings>;
}

interface UpdateSettingsResponse {
  success: boolean;
  error?: string;
}
```

## Event Notifications (Main → Renderer)

### ServiceStateChanged

**Direction**: Main → Renderer  
**Channel**: `service:state-changed`

```typescript
interface ServiceStateChangedEvent {
  serviceId: string;
  previousState: 'loading' | 'ready' | 'error' | 'offline';
  currentState: 'loading' | 'ready' | 'error' | 'offline';
  error?: string;
}
```

### WorkspaceChanged

**Direction**: Main → Renderer  
**Channel**: `workspace:changed`

```typescript
interface WorkspaceChangedEvent {
  workspaceId: string;
  changeType: 'created' | 'updated' | 'deleted' | 'activated';
  workspace?: Workspace;
}
```

### SessionExpired

**Direction**: Main → Renderer  
**Channel**: `session:expired`

```typescript
interface SessionExpiredEvent {
  serviceId: string;
  serviceName: string;
  reason: 'timeout' | 'error' | 'logout';
}
```

### NotificationReceived

**Direction**: Main → Renderer  
**Channel**: `notification:received`

```typescript
interface NotificationReceivedEvent {
  serviceId: string;
  serviceName: string;
  title: string;
  body: string;
  icon?: string;
  timestamp: Date;
}
```

## Error Handling Contracts

### Error Response Format

All IPC responses include standardized error information:

```typescript
interface StandardError {
  code: string; // Error code (e.g., 'SERVICE_NOT_FOUND')
  message: string; // Human-readable error message
  details?: any; // Additional error context
  timestamp: Date; // Error occurrence time
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request data
- `SERVICE_NOT_FOUND`: Service ID does not exist
- `WORKSPACE_NOT_FOUND`: Workspace ID does not exist
- `PERMISSION_DENIED`: Operation not allowed
- `STORAGE_ERROR`: File system or credential storage error
- `VALIDATION_ERROR`: Data validation failed
- `NETWORK_ERROR`: Network operation failed
- `BROWSER_VIEW_ERROR`: BrowserView operation failed

## Security Validation

### Input Validation

All IPC handlers validate:

- Required fields presence
- Data type correctness
- String length limits
- URL format validation
- UUID format validation
- File path safety checks

### Authorization

- Service operations validate service ownership
- Workspace operations validate workspace access
- Session operations validate service association
- File operations validate path permissions

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
}
```

## IPC Channel Registry

### Bidirectional Channels

- `service:*` - Service management operations
- `workspace:*` - Workspace management operations
- `browserview:*` - BrowserView management operations
- `config:*` - Configuration export/import operations
- `settings:*` - Application settings operations
- `session:*` - Session management operations

### Event-Only Channels (Main → Renderer)

- `service:state-changed` - Service state notifications
- `workspace:changed` - Workspace change notifications
- `session:expired` - Session expiration notifications
- `notification:received` - Service notifications

### Internal Channels (Main only)

- Credential storage operations (keytar)
- File system operations (electron-store)
- BrowserView lifecycle management

---

_All contracts support type-safe communication with comprehensive error
handling_
