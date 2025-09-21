# GitHub Copilot Instructions: GetWarped Development

## Project Overview

**Project**: GetWarped - Secure Multi-Service Workspace App  
**Technology Stack**: Electron + TypeScript + React + Redux Toolkit  
**Security Model**: OS-native credential storage, complete session isolation  
**Platform**: Cross-platform desktop (Windows, macOS, Linux)

## Architecture Context

### Core Technologies

- **Framework**: Electron 27+ with main/renderer process architecture
- **UI**: React 18+ with TypeScript 5.0+ and Ant Design components
- **State**: Redux Toolkit for centralized state management
- **Security**: keytar for OS-native credential storage
- **Testing**: Jest (unit) + Playwright (E2E) with >80% coverage
- **Build**: Webpack + electron-builder for cross-platform packaging

### Key Principles

1. **Library-First**: Prioritize mature, well-maintained open-source libraries
2. **Security-First**: Complete session isolation, zero credential exports
3. **Production-Ready**: Comprehensive error handling, logging, and testing
4. **Cross-Platform**: Support Windows 10+, macOS 11+, Linux Ubuntu 20+

## Code Generation Guidelines

### TypeScript Patterns

```typescript
// Always use strict typing for interfaces
interface ServiceConfiguration {
  id: string; // Use UUID for unique identifiers
  name: string; // Required fields first
  url: string;
  workspaceId: string;
  icon?: string; // Optional fields with ? suffix
  createdAt: Date; // Use native JS types
  updatedAt: Date;
}

// Use branded types for IDs
type ServiceId = string & { __brand: 'ServiceId' };
type WorkspaceId = string & { __brand: 'WorkspaceId' };

// Prefer const assertions for enums
const ServiceCategory = {
  EMAIL: 'email',
  PRODUCTIVITY: 'productivity',
  COMMUNICATION: 'communication',
} as const;
type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];
```

### React Component Patterns

```typescript
// Use functional components with proper props typing
interface ServiceCardProps {
  service: ServiceConfiguration;
  isActive: boolean;
  onSelect: (serviceId: string) => void;
  onUpdate: (updates: Partial<ServiceConfiguration>) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isActive,
  onSelect,
  onUpdate
}) => {
  // Use callbacks for performance
  const handleSelect = useCallback(() => {
    onSelect(service.id);
  }, [onSelect, service.id]);

  // Prefer early returns for loading/error states
  if (!service) {
    return <Skeleton />;
  }

  return (
    <Card
      className={`service-card ${isActive ? 'active' : ''}`}
      onClick={handleSelect}
    >
      {/* Component content */}
    </Card>
  );
};
```

### Redux Toolkit Patterns

```typescript
// Use createSlice for reducers
const servicesSlice = createSlice({
  name: 'services',
  initialState: {
    items: {} as Record<string, ServiceConfiguration>,
    activeServiceId: null as string | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    addService: (state, action: PayloadAction<ServiceConfiguration>) => {
      state.items[action.payload.id] = action.payload;
    },
    updateService: (
      state,
      action: PayloadAction<{
        id: string;
        updates: Partial<ServiceConfiguration>;
      }>
    ) => {
      const service = state.items[action.payload.id];
      if (service) {
        Object.assign(service, action.payload.updates);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createService.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        state.items[action.payload.id] = action.payload;
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create service';
      });
  },
});

// Use createAsyncThunk for async operations
export const createService = createAsyncThunk(
  'services/create',
  async (request: CreateServiceRequest, { rejectWithValue }) => {
    try {
      const response = await ipcRenderer.invoke('service:create', request);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.service;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### Electron IPC Patterns

```typescript
// Main process IPC handlers
ipcMain.handle(
  'service:create',
  async (event, request: CreateServiceRequest) => {
    try {
      // Validate input
      const validation = validateCreateServiceRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create service
      const service = await serviceManager.createService(request);

      // Save to store
      await configStore.set(`services.${service.id}`, service);

      return { success: true, serviceId: service.id, service };
    } catch (error) {
      logger.error('Failed to create service:', error);
      return { success: false, error: error.message };
    }
  }
);

// Renderer process IPC calls
const createService = async (
  request: CreateServiceRequest
): Promise<ServiceConfiguration> => {
  const response = await ipcRenderer.invoke('service:create', request);
  if (!response.success) {
    throw new Error(response.error);
  }
  return response.service;
};
```

### Error Handling Patterns

```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Service layer error handling
class ServiceManager {
  async createService(
    request: CreateServiceRequest
  ): Promise<Result<ServiceConfiguration>> {
    try {
      // Validate request
      if (!request.name || !request.url || !request.workspaceId) {
        return {
          success: false,
          error: new ValidationError('Missing required fields'),
        };
      }

      // Create service
      const service: ServiceConfiguration = {
        id: uuidv4(),
        name: request.name,
        url: request.url,
        workspaceId: request.workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return { success: true, data: service };
    } catch (error) {
      logger.error('Service creation failed:', error);
      return { success: false, error };
    }
  }
}
```

### Testing Patterns

```typescript
// Jest unit tests
describe('ServiceManager', () => {
  let serviceManager: ServiceManager;

  beforeEach(() => {
    serviceManager = new ServiceManager();
  });

  describe('createService', () => {
    it('should create service with valid input', async () => {
      const request: CreateServiceRequest = {
        name: 'Test Service',
        url: 'https://example.com',
        workspaceId: 'workspace-1',
      };

      const result = await serviceManager.createService(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeDefined();
        expect(result.data.name).toBe(request.name);
        expect(result.data.url).toBe(request.url);
      }
    });

    it('should fail with missing required fields', async () => {
      const request = { name: 'Test' } as CreateServiceRequest;

      const result = await serviceManager.createService(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });
  });
});

// Playwright E2E tests
test('should create and display new service', async ({ page }) => {
  // Navigate to app
  await page.goto('/');

  // Create new workspace first
  await page.click('[data-testid="create-workspace-btn"]');
  await page.fill('[data-testid="workspace-name"]', 'Test Workspace');
  await page.click('[data-testid="save-workspace-btn"]');

  // Create new service
  await page.click('[data-testid="add-service-btn"]');
  await page.fill('[data-testid="service-name"]', 'Gmail');
  await page.fill('[data-testid="service-url"]', 'https://mail.google.com');
  await page.click('[data-testid="save-service-btn"]');

  // Verify service appears
  await expect(page.locator('[data-testid="service-card"]')).toContainText(
    'Gmail'
  );
});
```

## Security Guidelines

### Credential Storage

- **NEVER** store credentials in application files, configuration, or exports
- **ALWAYS** use keytar for OS-native credential storage
- **VALIDATE** all credential operations with proper error handling
- **ENCRYPT** session data before storing in keytar

### Session Isolation

- **USE** Electron's BrowserView API for complete isolation
- **AVOID** shared cookies, localStorage, or session data
- **IMPLEMENT** independent navigation and resource loading
- **VALIDATE** all cross-process communication

### Input Validation

- **SANITIZE** all user inputs, especially URLs and names
- **VALIDATE** JSON schema for import/export operations
- **ESCAPE** HTML content to prevent XSS attacks
- **LIMIT** file sizes and operation scope

## Performance Guidelines

### Memory Management

- **DISPOSE** of unused BrowserView instances
- **LIMIT** active services to prevent memory leaks
- **IMPLEMENT** lazy loading for service templates
- **MONITOR** memory usage and implement optimization

### UI Performance

- **USE** React.memo for expensive components
- **IMPLEMENT** virtualization for large service lists
- **DEBOUNCE** search and filter operations
- **OPTIMIZE** Redux selectors with reselect

### Electron Optimization

- **PRELOAD** scripts for IPC communication
- **OPTIMIZE** main process with worker threads
- **IMPLEMENT** lazy module loading
- **USE** native modules judiciously

## Development Workflow

### File Organization

```
src/
├── main/                   # Main process code
│   ├── services/          # Business logic services
│   ├── managers/          # Resource managers
│   ├── handlers/          # IPC handlers
│   └── utils/            # Utilities and helpers
├── renderer/              # Renderer process code
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── store/           # Redux store and slices
│   └── utils/           # UI utilities
├── shared/               # Shared code
│   ├── types/           # TypeScript interfaces
│   ├── constants/       # Application constants
│   └── validation/      # Validation schemas
└── tests/               # Test files
    ├── unit/           # Jest unit tests
    ├── integration/    # Integration tests
    └── e2e/           # Playwright E2E tests
```

### Code Review Checklist

- [ ] TypeScript types are properly defined
- [ ] Error handling follows Result pattern
- [ ] Security best practices are followed
- [ ] Tests cover both success and error cases
- [ ] Performance considerations are addressed
- [ ] Cross-platform compatibility is maintained
- [ ] Documentation is updated

## Common Patterns to Avoid

### Anti-Patterns

- **DON'T** use `any` type - prefer `unknown` or proper typing
- **DON'T** store sensitive data in Redux state
- **DON'T** use synchronous IPC calls - prefer async
- **DON'T** directly manipulate DOM in React components
- **DON'T** ignore TypeScript errors - fix them properly

### Security Anti-Patterns

- **NEVER** store credentials in plain text
- **NEVER** trust user input without validation
- **NEVER** expose internal APIs to renderer process
- **NEVER** share session data between services
- **NEVER** include credentials in logs or exports

---

_Follow these guidelines to maintain code quality, security, and performance
standards_
