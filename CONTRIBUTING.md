# Contributing to GetWarped

We're thrilled that you're interested in contributing to GetWarped! This
document provides guidelines and information for contributors.

## 🚀 Getting Started

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/getwarped.git
   cd getwarped
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```
5. **Run in development mode**:
   ```bash
   npm run dev
   ```

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **TypeScript**: Knowledge of TypeScript is helpful
- **React**: Familiarity with React hooks and modern patterns

## 🏗️ Architecture Overview

GetWarped follows a secure, modular architecture:

### Main Process (`src/main/`)

- **Services**: Business logic and core functionality
- **Handlers**: IPC request/response handlers
- **Security**: Credential management and security utilities
- **Storage**: Data persistence and configuration

### Renderer Process (`src/renderer/`)

- **Components**: React UI components
- **Store**: Redux Toolkit slices and state management
- **Services**: API client services
- **Hooks**: Custom React hooks

### Shared (`src/shared/`)

- **Types**: TypeScript interfaces and type definitions
- **Constants**: Application-wide constants
- **Validation**: Schema validation utilities

## 🧪 Testing Guidelines

### Test Types

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions and workflows
- **E2E Tests**: Test complete user journeys

### Writing Tests

```typescript
// Unit test example
describe('ServiceManager', () => {
  it('should create service with valid configuration', async () => {
    const manager = new ServiceManager();
    const config = createMockServiceConfig();

    const result = await manager.createService(config);

    expect(result.success).toBe(true);
    expect(result.service.id).toBeDefined();
  });
});

// Integration test example
describe('Service Creation Workflow', () => {
  it('should create service and update UI', async () => {
    const { store } = renderWithProviders(<App />);

    // Trigger service creation
    store.dispatch(createService(mockServiceData));

    // Verify state updates
    expect(store.getState().services.items).toHaveLength(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📝 Code Style Guidelines

### TypeScript

- Use **strict mode** TypeScript
- Prefer **interfaces** over types for object shapes
- Use **branded types** for IDs and important primitives
- Always provide **explicit return types** for functions

```typescript
// Good
interface ServiceConfiguration {
  id: ServiceId;
  name: string;
  url: string;
  createdAt: Date;
}

type ServiceId = string & { __brand: 'ServiceId' };

function createService(
  config: CreateServiceRequest
): Promise<ServiceConfiguration> {
  // implementation
}

// Avoid
function createService(config: any): any {
  // implementation
}
```

### React Components

- Use **functional components** with hooks
- Prefer **custom hooks** for complex logic
- Use **React.memo** for performance optimization
- Implement **proper error boundaries**

```typescript
// Good
interface ServiceCardProps {
  service: ServiceConfiguration;
  onEdit: (id: ServiceId) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = React.memo(({
  service,
  onEdit
}) => {
  const handleEdit = useCallback(() => {
    onEdit(service.id);
  }, [onEdit, service.id]);

  return (
    <Card onClick={handleEdit}>
      {service.name}
    </Card>
  );
});
```

### Redux Toolkit

- Use **createSlice** for reducers
- Use **createAsyncThunk** for async operations
- Implement **proper error handling**
- Use **RTK Query** for API calls where appropriate

```typescript
// Good
const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setActiveService: (state, action: PayloadAction<ServiceId>) => {
      state.activeServiceId = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createService.fulfilled, (state, action) => {
        state.items[action.payload.id] = action.payload;
      })
      .addCase(createService.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create service';
      });
  },
});
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## 🔒 Security Guidelines

Security is paramount in GetWarped. Please follow these guidelines:

### Credential Handling

- **Never** log or console.log credentials
- **Always** use keytar for credential storage
- **Never** include credentials in error messages
- **Validate** all credential operations

### IPC Security

- **Validate** all IPC messages
- **Use** type-safe IPC contracts
- **Sanitize** all user inputs
- **Avoid** exposing internal APIs

### BrowserView Security

- **Isolate** each service in its own BrowserView
- **Prevent** cross-service data sharing
- **Validate** navigation requests
- **Implement** proper CSP headers

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node.js version, app version
6. **Screenshots**: If applicable
7. **Logs**: Relevant log entries (remove sensitive data)

### Bug Report Template

```markdown
## Bug Description

Brief description of the issue

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: Windows 11 / macOS 13 / Ubuntu 22.04
- Node.js: 18.17.0
- GetWarped: 1.0.0

## Additional Context

Any other context about the problem
```

## ✨ Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and problem you're solving
3. **Propose a solution** with implementation details
4. **Consider security implications**
5. **Think about cross-platform compatibility**

### Feature Request Template

```markdown
## Feature Description

Brief description of the proposed feature

## Use Case

What problem does this solve?

## Proposed Solution

How should this feature work?

## Alternatives Considered

What other approaches did you consider?

## Security Considerations

Any security implications?

## Additional Context

Screenshots, mockups, or other context
```

## 📋 Pull Request Process

### Before Submitting

1. **Test your changes** thoroughly
2. **Run the full test suite**: `npm test`
3. **Check code quality**: `npm run lint`
4. **Verify types**: `npm run typecheck`
5. **Update documentation** if needed
6. **Add tests** for new functionality

### PR Requirements

- **Descriptive title** and detailed description
- **Link to related issues**
- **Test coverage** for new code
- **No breaking changes** without discussion
- **Security review** for security-related changes

### PR Template

```markdown
## Description

Brief description of changes

## Related Issues

Fixes #123

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Security considerations reviewed
```

## 🏷️ Release Process

Releases follow semantic versioning (SemVer):

- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backwards compatible
- **Patch** (1.0.1): Bug fixes, backwards compatible

### Release Timeline

- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed for critical bugs

## 📚 Documentation

Help improve our documentation:

- **README**: Getting started and overview
- **Code comments**: Inline documentation
- **Type definitions**: Comprehensive TypeScript types
- **Examples**: Usage examples and tutorials
- **Architecture docs**: Design decisions and patterns

## 🎯 Areas for Contribution

We especially welcome contributions in:

- **Performance optimization**
- **Security enhancements**
- **Cross-platform compatibility**
- **Accessibility improvements**
- **Test coverage**
- **Documentation**
- **Bug fixes**
- **UI/UX improvements**

## 💬 Community

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Security**: Email security@getwarped.com for security issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the
MIT License.

## 🙏 Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md** file
- **Release notes**
- **GitHub contributors page**

Thank you for contributing to GetWarped! 🚀
