# Service API Contracts: Service Management

**Feature**: GetWarped: Secure Multi-Service Workspace App  
**Date**: September 20, 2025  
**Branch**: `001-title-getwarped-secure`

## Service Templates API

### GetTemplates
**Purpose**: Retrieve available service templates for quick service setup

```typescript
interface GetTemplatesRequest {
  category?: ServiceCategory; // Optional filter by category
  search?: string;           // Optional name/description search
}

interface GetTemplatesResponse {
  success: boolean;
  templates: ServiceTemplate[];
  categories: ServiceCategory[];
  error?: string;
}
```

### CreateServiceFromTemplate
**Purpose**: Create a new service using a predefined template

```typescript
interface CreateServiceFromTemplateRequest {
  templateId: string;        // Template identifier
  workspaceId: string;       // Target workspace
  customizations?: {
    name?: string;           // Override template name
    url?: string;            // Override template URL
    theme?: ServiceTheme;    // Override template theme
  };
}

interface CreateServiceFromTemplateResponse {
  success: boolean;
  serviceId?: string;
  service?: ServiceConfiguration;
  error?: string;
}
```

### UpdateTemplate
**Purpose**: Update built-in service template (admin operation)

```typescript
interface UpdateTemplateRequest {
  templateId: string;
  updates: Partial<ServiceTemplate>;
}

interface UpdateTemplateResponse {
  success: boolean;
  error?: string;
}
```

## Service Icon Management API

### UploadServiceIcon
**Purpose**: Upload and process custom service icon

```typescript
interface UploadServiceIconRequest {
  serviceId: string;
  iconData: string;          // Base64 encoded image data
  format: 'png' | 'jpg' | 'svg' | 'ico';
}

interface UploadServiceIconResponse {
  success: boolean;
  iconUrl?: string;          // Processed icon URL
  iconHash?: string;         // Icon content hash
  error?: string;
}
```

### GetServiceIcon
**Purpose**: Retrieve service icon with caching

```typescript
interface GetServiceIconRequest {
  serviceId: string;
  size?: number;             // Requested icon size (pixels)
  format?: 'png' | 'jpg';    // Requested format
}

interface GetServiceIconResponse {
  success: boolean;
  iconData?: string;         // Base64 encoded icon
  contentType?: string;      // MIME type
  cached: boolean;           // Whether served from cache
  error?: string;
}
```

### ClearIconCache
**Purpose**: Clear cached service icons

```typescript
interface ClearIconCacheRequest {
  serviceId?: string;        // Optional specific service
}

interface ClearIconCacheResponse {
  success: boolean;
  clearedCount: number;
  error?: string;
}
```

## Service State Management API

### GetServiceState
**Purpose**: Retrieve current service runtime state

```typescript
interface GetServiceStateRequest {
  serviceId: string;
}

interface ServiceState {
  status: 'loading' | 'ready' | 'error' | 'offline';
  url: string;               // Current URL
  title: string;             // Page title
  canGoBack: boolean;        // Navigation state
  canGoForward: boolean;     // Navigation state
  isLoading: boolean;        // Loading state
  favicon?: string;          // Current favicon
  notifications: number;     // Unread notification count
  lastActiveAt: Date;        // Last user interaction
}

interface GetServiceStateResponse {
  success: boolean;
  state?: ServiceState;
  error?: string;
}
```

### UpdateServiceState
**Purpose**: Update service runtime state (internal use)

```typescript
interface UpdateServiceStateRequest {
  serviceId: string;
  stateUpdates: Partial<ServiceState>;
}

interface UpdateServiceStateResponse {
  success: boolean;
  error?: string;
}
```

### RefreshService
**Purpose**: Reload service content

```typescript
interface RefreshServiceRequest {
  serviceId: string;
  clearCache?: boolean;      // Whether to clear cache
}

interface RefreshServiceResponse {
  success: boolean;
  error?: string;
}
```

## Service Navigation API

### NavigateService
**Purpose**: Navigate service to specific URL

```typescript
interface NavigateServiceRequest {
  serviceId: string;
  url: string;
  openInNewWindow?: boolean; // Open in separate window
}

interface NavigateServiceResponse {
  success: boolean;
  error?: string;
}
```

### GoBack
**Purpose**: Navigate service back in history

```typescript
interface GoBackRequest {
  serviceId: string;
}

interface GoBackResponse {
  success: boolean;
  newUrl?: string;
  error?: string;
}
```

### GoForward
**Purpose**: Navigate service forward in history

```typescript
interface GoForwardRequest {
  serviceId: string;
}

interface GoForwardResponse {
  success: boolean;
  newUrl?: string;
  error?: string;
}
```

### GetServiceHistory
**Purpose**: Retrieve service navigation history

```typescript
interface GetServiceHistoryRequest {
  serviceId: string;
  maxEntries?: number;       // Limit history entries
}

interface HistoryEntry {
  url: string;
  title: string;
  visitTime: Date;
  favicon?: string;
}

interface GetServiceHistoryResponse {
  success: boolean;
  history?: HistoryEntry[];
  currentIndex?: number;
  error?: string;
}
```

## Service Notification API

### GetNotifications
**Purpose**: Retrieve service notifications

```typescript
interface GetNotificationsRequest {
  serviceId?: string;        // Optional service filter
  limit?: number;            // Limit results
  since?: Date;              // Only notifications after date
}

interface ServiceNotification {
  id: string;
  serviceId: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;              // Associated URL
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
}

interface GetNotificationsResponse {
  success: boolean;
  notifications?: ServiceNotification[];
  unreadCount?: number;
  error?: string;
}
```

### MarkNotificationRead
**Purpose**: Mark notification as read

```typescript
interface MarkNotificationReadRequest {
  notificationId: string;
}

interface MarkNotificationReadResponse {
  success: boolean;
  error?: string;
}
```

### ClearNotifications
**Purpose**: Clear service notifications

```typescript
interface ClearNotificationsRequest {
  serviceId?: string;        // Optional service filter
  olderThan?: Date;          // Clear notifications older than date
}

interface ClearNotificationsResponse {
  success: boolean;
  clearedCount: number;
  error?: string;
}
```

## Service User Agent API

### SetUserAgent
**Purpose**: Set custom user agent for service

```typescript
interface SetUserAgentRequest {
  serviceId: string;
  userAgent: string;
}

interface SetUserAgentResponse {
  success: boolean;
  error?: string;
}
```

### GetUserAgent
**Purpose**: Get current user agent for service

```typescript
interface GetUserAgentRequest {
  serviceId: string;
}

interface GetUserAgentResponse {
  success: boolean;
  userAgent?: string;
  isCustom: boolean;         // Whether custom or default
  error?: string;
}
```

### ResetUserAgent
**Purpose**: Reset to default user agent

```typescript
interface ResetUserAgentRequest {
  serviceId: string;
}

interface ResetUserAgentResponse {
  success: boolean;
  error?: string;
}
```

## Service Content Blocking API

### UpdateBlockingRules
**Purpose**: Update ad/tracker blocking for service

```typescript
interface UpdateBlockingRulesRequest {
  serviceId: string;
  rules: {
    blockAds: boolean;
    blockTrackers: boolean;
    customRules?: string[];   // Custom blocking rules
  };
}

interface UpdateBlockingRulesResponse {
  success: boolean;
  error?: string;
}
```

### GetBlockingStats
**Purpose**: Get blocking statistics for service

```typescript
interface GetBlockingStatsRequest {
  serviceId: string;
  since?: Date;              // Statistics since date
}

interface BlockingStats {
  adsBlocked: number;
  trackersBlocked: number;
  scriptsBlocked: number;
  lastUpdated: Date;
}

interface GetBlockingStatsResponse {
  success: boolean;
  stats?: BlockingStats;
  error?: string;
}
```

## Service Development API

### InjectCSS
**Purpose**: Inject custom CSS into service (development mode)

```typescript
interface InjectCSSRequest {
  serviceId: string;
  css: string;
  persistent?: boolean;      // Whether to persist across reloads
}

interface InjectCSSResponse {
  success: boolean;
  cssId?: string;           // CSS injection ID
  error?: string;
}
```

### ExecuteScript
**Purpose**: Execute JavaScript in service context (development mode)

```typescript
interface ExecuteScriptRequest {
  serviceId: string;
  script: string;
  worldId?: string;         // Isolated world ID
}

interface ExecuteScriptResponse {
  success: boolean;
  result?: any;             // Script execution result
  error?: string;
}
```

### GetConsoleMessages
**Purpose**: Retrieve console messages from service

```typescript
interface GetConsoleMessagesRequest {
  serviceId: string;
  level?: 'log' | 'warn' | 'error' | 'debug'; // Filter by level
  limit?: number;
}

interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  line: number;
  timestamp: Date;
}

interface GetConsoleMessagesResponse {
  success: boolean;
  messages?: ConsoleMessage[];
  error?: string;
}
```

## Service Performance API

### GetPerformanceMetrics
**Purpose**: Retrieve service performance metrics

```typescript
interface GetPerformanceMetricsRequest {
  serviceId: string;
}

interface PerformanceMetrics {
  memoryUsage: {
    used: number;            // Bytes
    total: number;           // Bytes
  };
  cpuUsage: number;          // Percentage
  networkRequests: {
    total: number;
    failed: number;
    averageResponseTime: number; // Milliseconds
  };
  loadTime: number;          // Page load time in milliseconds
  lastUpdated: Date;
}

interface GetPerformanceMetricsResponse {
  success: boolean;
  metrics?: PerformanceMetrics;
  error?: string;
}
```

### OptimizeService
**Purpose**: Perform service optimization

```typescript
interface OptimizeServiceRequest {
  serviceId: string;
  actions: {
    clearCache?: boolean;
    clearCookies?: boolean;
    clearStorage?: boolean;
    garbageCollect?: boolean;
  };
}

interface OptimizeServiceResponse {
  success: boolean;
  memoryFreed?: number;      // Bytes freed
  error?: string;
}
```

## Batch Operations API

### BatchUpdateServices
**Purpose**: Update multiple services in a single operation

```typescript
interface BatchUpdateServicesRequest {
  updates: {
    serviceId: string;
    changes: Partial<ServiceConfiguration>;
  }[];
}

interface BatchUpdateServicesResponse {
  success: boolean;
  results: {
    serviceId: string;
    success: boolean;
    error?: string;
  }[];
  error?: string;
}
```

### BatchDeleteServices
**Purpose**: Delete multiple services in a single operation

```typescript
interface BatchDeleteServicesRequest {
  serviceIds: string[];
  clearSessions?: boolean;   // Whether to clear associated sessions
}

interface BatchDeleteServicesResponse {
  success: boolean;
  deleted: string[];         // Successfully deleted service IDs
  failed: {
    serviceId: string;
    error: string;
  }[];
  error?: string;
}
```

## Service Validation API

### ValidateServiceUrl
**Purpose**: Validate and normalize service URL

```typescript
interface ValidateServiceUrlRequest {
  url: string;
  checkAccessibility?: boolean; // Whether to test URL accessibility
}

interface ValidateServiceUrlResponse {
  valid: boolean;
  normalizedUrl?: string;    // Normalized URL
  accessible?: boolean;      // Whether URL is accessible
  redirectUrl?: string;      // Final URL after redirects
  error?: string;
}
```

### ValidateServiceName
**Purpose**: Validate service name for uniqueness and format

```typescript
interface ValidateServiceNameRequest {
  name: string;
  workspaceId: string;
  excludeServiceId?: string; // Exclude specific service from uniqueness check
}

interface ValidateServiceNameResponse {
  valid: boolean;
  available: boolean;        // Whether name is available in workspace
  suggestions?: string[];    // Alternative name suggestions
  error?: string;
}
```

---
*All service APIs support comprehensive error handling and validation*