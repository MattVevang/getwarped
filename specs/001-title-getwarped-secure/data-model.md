# Data Model: GetWarped Entities

**Feature**: GetWarped: Secure Multi-Service Workspace App  
**Date**: September 20, 2025  
**Branch**: `001-title-getwarped-secure`

## Core Entities

### ServiceConfiguration

Represents an individual online service configuration within a workspace.

```typescript
interface ServiceConfiguration {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Display name (e.g., "Gmail", "GitHub")
  url: string;                   // Service URL (https://mail.google.com)
  icon?: string;                 // Icon URL or base64 data
  iconType: 'url' | 'base64' | 'builtin'; // Icon source type
  workspaceId: string;           // Parent workspace reference
  position: number;              // Display order within workspace
  theme?: ServiceTheme;          // Service-specific theming
  notifications: boolean;        // Enable/disable notifications
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modification timestamp
  customUserAgent?: string;      // Optional custom user agent
  blockAds: boolean;            // Ad blocking preference
  blockTrackers: boolean;       // Tracker blocking preference
}

interface ServiceTheme {
  primaryColor?: string;         // Custom primary color
  backgroundColor?: string;      // Custom background color
  textColor?: string;           // Custom text color
}
```

### Workspace

Represents a logical grouping of services with shared configuration.

```typescript
interface Workspace {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Display name (e.g., "Work", "Personal")
  description?: string;          // Optional description
  services: string[];            // Array of ServiceConfiguration IDs
  theme: WorkspaceTheme;         // Workspace-wide theming
  isDefault: boolean;            // Default workspace flag
  position: number;              // Display order in sidebar
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modification timestamp
}

interface WorkspaceTheme {
  primaryColor: string;          // Main theme color
  secondaryColor: string;        // Secondary theme color
  backgroundColor: string;       // Background color
  sidebarColor: string;         // Sidebar background color
  textColor: string;            // Primary text color
  accentColor: string;          // Accent/highlight color
}
```

### UserSession

Represents session-specific data for each service (stored in OS credentials).

```typescript
interface UserSession {
  serviceId: string;             // Reference to ServiceConfiguration
  lastAccessedAt: Date;          // Last access timestamp
  sessionData: {                 // Encrypted session information
    cookies?: string;            // Serialized cookies (encrypted)
    localStorage?: string;       // Local storage data (encrypted)
    sessionStorage?: string;     // Session storage data (encrypted)
  };
  isActive: boolean;            // Current session status
}

// Note: UserSession data is stored in OS credential storage
// and never appears in configuration exports
```

### ConfigurationExport

Represents sanitized configuration data for export/import functionality.

```typescript
interface ConfigurationExport {
  version: string;               // Export format version (e.g., "1.0.0")
  exportedAt: Date;             // Export timestamp
  workspaces: ExportedWorkspace[]; // Sanitized workspace data
  metadata: ExportMetadata;      // Export metadata
}

interface ExportedWorkspace {
  name: string;                  // Workspace name
  description?: string;          // Workspace description
  services: ExportedService[];   // Sanitized service configurations
  theme: WorkspaceTheme;         // Theme settings
  position: number;              // Display order
}

interface ExportedService {
  name: string;                  // Service display name
  url: string;                   // Service URL
  icon?: string;                 // Icon data (if not credential-related)
  iconType: 'url' | 'base64' | 'builtin'; // Icon source type
  theme?: ServiceTheme;          // Service theming
  notifications: boolean;        // Notification preferences
  position: number;              // Display order
  customUserAgent?: string;      // Custom user agent
  blockAds: boolean;            // Ad blocking preference
  blockTrackers: boolean;       // Tracker blocking preference
  // Note: No credentials, session data, or sensitive information
}

interface ExportMetadata {
  appVersion: string;            // GetWarped version that created export
  platform: string;             // Operating system
  totalWorkspaces: number;       // Count of exported workspaces
  totalServices: number;        // Count of exported services
}
```

### ServiceTemplate

Represents predefined service configurations for popular services.

```typescript
interface ServiceTemplate {
  id: string;                    // Template identifier (e.g., "gmail")
  name: string;                  // Display name
  url: string;                   // Default service URL
  icon: string;                  // Built-in icon identifier
  category: ServiceCategory;     // Service category
  description: string;           // Template description
  defaultTheme: ServiceTheme;    // Default theming
  userAgentRequired: boolean;    // Requires custom user agent
  defaultUserAgent?: string;     // Default user agent string
  supportedFeatures: TemplateFeature[]; // Supported features
}

enum ServiceCategory {
  EMAIL = 'email',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  DEVELOPMENT = 'development',
  SOCIAL = 'social',
  ENTERTAINMENT = 'entertainment',
  FINANCE = 'finance',
  SHOPPING = 'shopping',
  NEWS = 'news',
  OTHER = 'other'
}

enum TemplateFeature {
  NOTIFICATIONS = 'notifications',
  AD_BLOCKING = 'ad_blocking',
  TRACKER_BLOCKING = 'tracker_blocking',
  CUSTOM_USER_AGENT = 'custom_user_agent',
  CUSTOM_THEMING = 'custom_theming'
}
```

### ApplicationState

Represents the overall application state managed by Redux Toolkit.

```typescript
interface ApplicationState {
  workspaces: WorkspacesState;
  services: ServicesState;
  ui: UIState;
  settings: SettingsState;
}

interface WorkspacesState {
  items: Record<string, Workspace>; // Workspaces indexed by ID
  activeWorkspaceId: string | null; // Currently selected workspace
  loading: boolean;
  error: string | null;
}

interface ServicesState {
  items: Record<string, ServiceConfiguration>; // Services indexed by ID
  activeServiceId: string | null;   // Currently active service
  templates: Record<string, ServiceTemplate>; // Service templates
  loading: boolean;
  error: string | null;
}

interface UIState {
  sidebarCollapsed: boolean;     // Sidebar visibility state
  theme: 'light' | 'dark';       // Global theme preference
  zoom: number;                  // UI zoom level (0.5 - 2.0)
  language: string;              // Interface language (ISO code)
  notifications: boolean;        // Global notification preference
}

interface SettingsState {
  general: GeneralSettings;
  privacy: PrivacySettings;
  advanced: AdvancedSettings;
}

interface GeneralSettings {
  startMinimized: boolean;       // Start app minimized to tray
  minimizeToTray: boolean;       // Minimize to system tray
  autoUpdate: boolean;           // Automatic updates
  defaultWorkspace: string;      // Default workspace ID
}

interface PrivacySettings {
  clearDataOnExit: boolean;      // Clear session data on app exit
  blockAdsGlobally: boolean;     // Global ad blocking
  blockTrackersGlobally: boolean; // Global tracker blocking
  sendAnalytics: boolean;        // Send usage analytics
}

interface AdvancedSettings {
  hardwareAcceleration: boolean; // Enable hardware acceleration
  debugMode: boolean;            // Enable debug logging
  maxMemoryUsage: number;        // Memory usage limit (MB)
  proxySettings?: ProxySettings; // Proxy configuration
}

interface ProxySettings {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string; // Stored in OS credential storage
}
```

## Entity Relationships

```
Workspace (1) ──→ (N) ServiceConfiguration
    │                      │
    │                      │
    └─── WorkspaceTheme    └─── ServiceTheme
                           │
                           └─── UserSession (OS Credentials)

ServiceTemplate (1) ──→ (N) ServiceConfiguration (via template ID)

ConfigurationExport
    │
    ├─── ExportedWorkspace (N)
    │         │
    │         └─── ExportedService (N)
    │
    └─── ExportMetadata

ApplicationState
    │
    ├─── WorkspacesState
    ├─── ServicesState
    ├─── UIState
    └─── SettingsState
```

## Storage Strategy

### Local Configuration (electron-store)
- `ApplicationState`: Redux store persistence
- `ServiceConfiguration[]`: Service definitions
- `Workspace[]`: Workspace definitions
- `ServiceTemplate[]`: Built-in service templates
- `Settings`: Application preferences

### OS Credential Storage (keytar)
- `UserSession` data: Encrypted cookies, localStorage, sessionStorage
- `ProxySettings.password`: Proxy authentication
- Service-specific authentication tokens
- Never exported or accessible outside the app

### Export/Import Files
- `ConfigurationExport`: JSON format with schema validation
- Only non-sensitive configuration data
- No credentials, session data, or personal information
- Validated against JSON schema on import

## Data Validation

### Schema Validation (ajv)
```typescript
// Service configuration schema
const serviceConfigSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", minLength: 1, maxLength: 100 },
    url: { type: "string", format: "uri" },
    workspaceId: { type: "string", format: "uuid" },
    // ... additional properties
  },
  required: ["id", "name", "url", "workspaceId"],
  additionalProperties: false
};

// Export format schema
const exportSchema = {
  type: "object",
  properties: {
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    exportedAt: { type: "string", format: "date-time" },
    workspaces: { type: "array", items: { $ref: "#/definitions/workspace" } },
    // ... additional properties
  },
  required: ["version", "exportedAt", "workspaces"],
  additionalProperties: false
};
```

### Input Sanitization
- URL validation and normalization
- XSS prevention for user-provided names and descriptions
- File size limits for icon uploads
- JSON schema validation for all configuration imports

## Migration Strategy

### Data Versioning
- Each export includes version information
- Migration functions for backward compatibility
- Graceful handling of unknown properties
- Error recovery for corrupted data

### Schema Evolution
- Additive changes: New optional properties
- Breaking changes: Version increment with migration
- Deprecation warnings for obsolete properties
- Rollback support for failed migrations

---
*Data model supports zero-credential exports and complete session isolation*