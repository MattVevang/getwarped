# Tasks: GetWarped: Secure Multi-Service Workspace App

**Input**: Design documents from `/specs/001-title-getwarped-secure/`  
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/
(✓), quickstart.md (✓)

## Execution Flow (main)

```
1. Load plan.md from feature directory ✓
   → Tech stack: Electron 27+, TypeScript 5.0+, React 18+, Redux Toolkit
   → Libraries: keytar, electron-builder, Jest, Playwright
   → Structure: Electron main/renderer architecture
2. Load design documents ✓
   → data-model.md: 6 core entities (ServiceConfiguration, Workspace, etc.)
   → contracts/: IPC contracts + Service API contracts
   → research.md: Framework decisions and library selections
   → quickstart.md: User workflows and test scenarios
3. Generate tasks by category:
   → Setup: Electron project, TypeScript, dependencies, linting
   → Tests: Contract tests, integration tests (TDD approach)
   → Core: Models, services, IPC handlers, UI components
   → Integration: BrowserView, credential storage, export/import
   → Polish: Unit tests, performance optimization, packaging
4. Task ordering: Setup → Tests → Models → Services → UI → Integration → Polish
5. Parallel marking: Different files = [P], same files = sequential
6. Production-ready focus: Real implementations, no placeholders
7. When possible include descriptive code comments explaining that function or section if supported in the file type (json == no comment support for example)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths and library versions in descriptions
- AI-executable tasks with specific implementation details

## Path Conventions

Single Electron project structure:

- `src/main/` - Main process code
- `src/renderer/` - Renderer process code
- `src/shared/` - Shared types and utilities
- `tests/unit/` - Jest unit tests
- `tests/e2e/` - Playwright E2E tests
- `tests/integration/` - Integration tests

## Phase 3.1: Project Setup & Infrastructure

- [x] T001 Initialize Electron project with TypeScript 5.0+, create package.json
      with electron@^27.0.0, typescript@^5.0.0, @types/node@^18.0.0
- [x] T002 [P] Configure TypeScript with strict mode in tsconfig.json for main
      process (target: ES2022, module: CommonJS)
- [x] T003 [P] Configure TypeScript with strict mode in tsconfig.renderer.json
      for renderer process (target: ES2022, module: ESNext, jsx: react-jsx)
- [x] T004 [P] Install and configure ESLint with @typescript-eslint/parser,
      @typescript-eslint/eslint-plugin, eslint-plugin-react@^7.33.0
- [x] T005 [P] Install and configure Prettier with electron-specific formatting
      rules
- [x] T006 [P] Configure Husky pre-commit hooks with lint-staged for automated
      code quality
- [x] T007 Install Webpack 5+ with typescript-loader, configure
      webpack.main.config.js for main process bundling
- [x] T008 Configure webpack.renderer.config.js for renderer process with React
      support and HMR
- [x] T009 [P] Install Jest@^29.0.0 with @types/jest@^29.0.0, ts-jest@^29.0.0
      for unit testing
- [x] T010 [P] Install Playwright@^1.40.0 for cross-platform E2E testing
- [x] T011 [P] Configure electron-builder@^24.0.0 with Windows MSI, macOS DMG,
      Linux AppImage targets
- [x] T012 Create project directory structure: src/{main,renderer,shared},
      tests/{unit,e2e,integration}, assets/, build/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY
implementation**

### Contract Tests

- [x] T013 [P] Contract test for service:create IPC channel in
      tests/integration/ipc/test_service_create.spec.ts
- [x] T014 [P] Contract test for service:update IPC channel in
      tests/integration/ipc/test_service_update.spec.ts
- [x] T015 [P] Contract test for service:delete IPC channel in
      tests/integration/ipc/test_service_delete.spec.ts
- [x] T016 [P] Contract test for workspace:create IPC channel in
      tests/integration/ipc/test_workspace_create.spec.ts
- [x] T017 [P] Contract test for workspace:update IPC channel in
      tests/integration/ipc/test_workspace_update.spec.ts
- [x] T018 [P] Contract test for config:export IPC channel in
      tests/integration/ipc/test_config_export.spec.ts
- [x] T019 [P] Contract test for config:import IPC channel in
      tests/integration/ipc/test_config_import.spec.ts
- [x] T020 [P] Contract test for session:clear IPC channel in
      tests/integration/ipc/test_session_clear.spec.ts
- [x] T021 [P] Contract test for browserview:create IPC channel in
      tests/integration/ipc/test_browserview_create.spec.ts

### Integration Tests

- [x] T022 [P] Integration test for workspace creation workflow in
      tests/integration/workflows/test_workspace_management.spec.ts
- [x] T023 [P] Integration test for service addition workflow in
      tests/integration/workflows/test_service_lifecycle.spec.ts
- [x] T024 [P] Integration test for export/import configuration workflow in
      tests/integration/workflows/test_configuration_persistence.spec.ts
- [x] T025 [P] Integration test for session isolation verification in
      tests/integration/workflows/test_session_isolation.spec.ts
- [x] T026 [P] Integration test for credential storage security in
      tests/integration/security/test_security_validation.spec.ts
- [x] T027 [P] Integration test for BrowserView isolation and error handling in
      tests/integration/error-handling/test_error_handling.spec.ts

### E2E Tests

- [x] T028 [P] E2E test for first-time app setup and user workflows in
      tests/e2e/workflows/test_user_workflows.spec.ts
- [x] T029 [P] E2E test for complete service management and configuration in
      tests/e2e/configuration/test_configuration_management.spec.ts
- [x] T030 [P] E2E test for application lifecycle and persistence in
      tests/e2e/lifecycle/test_application_lifecycle.spec.ts

## Phase 3.3: Core Models & Types (ONLY after tests are failing)

### Shared Types

- [x] T031 [P] ServiceConfiguration interface in
      src/shared/types/ServiceConfiguration.ts with UUID validation
- [x] T032 [P] Workspace interface in src/shared/types/Workspace.ts with theme
      configuration
- [x] T033 [P] UserSession interface in src/shared/types/UserSession.ts with
      encryption types
- [x] T034 [P] ConfigurationExport interface in
      src/shared/types/ConfigurationExport.ts with security validation
- [x] T035 [P] ServiceTemplate interface in src/shared/types/ServiceTemplate.ts
      with category enum
- [x] T036 [P] ApplicationState interface in
      src/shared/types/ApplicationState.ts for Redux store
- [x] T037 [P] IPC contract types in src/shared/types/IPCContracts.ts with
      request/response interfaces

### Validation Schemas

- [x] T038 [P] JSON schema for ServiceConfiguration in
      src/shared/validation/ServiceConfigurationSchema.ts using ajv@^8.12.0
- [x] T039 [P] JSON schema for ConfigurationExport in
      src/shared/validation/ConfigurationExportSchema.ts with security
      validation
- [x] T040 [P] Input validation utilities in
      src/shared/validation/InputValidator.ts with XSS protection

## Phase 3.4: Main Process Core Implementation

### Service Management

- [x] T041 ServiceManager class in src/main/services/ServiceManager.ts with CRUD
      operations
- [x] T042 WorkspaceManager class in src/main/services/WorkspaceManager.ts with
      ordering support
- [x] T043 ConfigurationManager class in
      src/main/services/ConfigurationManager.ts with electron-store@^8.1.0
- [x] T044 SessionManager class in src/main\services/SessionManager.ts with
      keytar@^7.9.0 integration

### Security & Isolation

- [x] T045 CredentialStorage class in src/main/security/CredentialStorage.ts
      with OS-native storage (keytar)
- [x] T046 BrowserViewManager class in src/main/security/BrowserViewManager.ts
      with session isolation
- [x] T047 SecurityValidator class in src/main/security/SecurityValidator.ts
      with CSP and input sanitization
- [x] T048 EncryptionService class in src/main/security/EncryptionService.ts
      with Node.js crypto module

### IPC Handlers

- [x] T049 Service IPC handlers in src/main/handlers/ServiceHandlers.ts for
      service:create, service:update, service:delete
- [x] T050 Workspace IPC handlers in src/main/handlers/WorkspaceHandlers.ts for
      workspace operations
- [x] T051 Configuration IPC handlers in
      src/main/handlers/ConfigurationHandlers.ts for export/import
- [x] T052 Session IPC handlers in src/main/handlers/SessionHandlers.ts for
      credential operations
- [x] T053 BrowserView IPC handlers in src/main/handlers/BrowserViewHandlers.ts
      for view management

### Export/Import System (Zero-Credential)

- [x] T054 ConfigurationExporter class in
      src/main/services/ConfigurationExporter.ts with credential stripping and
      JSON schema export using ajv@^8.12.0
- [x] T055 ConfigurationImporter class in
      src/main/services/ConfigurationImporter.ts with comprehensive security
      validation, credential stripping, and migration support
- [x] T056 Export dialog integration in
      src/main/services/ConfigurationExporter.ts using
      electron.dialog.showSaveDialog with proper file extensions and metadata
- [x] T057 Import validation in src/main/services/ConfigurationImporter.ts with
      JSON schema validation (ajv) and security warnings for re-authentication
      requirements
- [ ] T058 Configuration backup scheduler in
      src/main/services/ConfigurationBackupScheduler.ts with automatic export
      prompts and user-configurable intervals
- [ ] T059 Migration wizard in src/main/services/MigrationWizard.ts for
      first-time import with guided re-authentication flow and validation

### Main Process Setup

- [ ] T060 Main process entry point in src/main/main.ts with security
      configuration
- [ ] T061 IPC handler registration in src/main/ipc/IPCSetup.ts with error
      handling
- [ ] T062 Application lifecycle management in src/main/AppLifecycle.ts with
      proper cleanup

## Phase 3.5: Renderer Process UI Implementation

### State Management (Redux Toolkit)

- [ ] T063 Redux store configuration in src/renderer/store/store.ts with
      redux-persist@^6.0.0
- [ ] T064 Services slice in src/renderer/store/slices/servicesSlice.ts with
      createAsyncThunk
- [ ] T065 Workspaces slice in src/renderer/store/slices/workspacesSlice.ts with
      reordering actions
- [ ] T066 UI state slice in src/renderer/store/slices/uiSlice.ts for theme and
      preferences
- [ ] T067 Export/import slice in src/renderer/store/slices/exportImportSlice.ts
      with security validation

### Core React Components (with Ant Design)

- [ ] T068 [P] App component in src/renderer/components/App.tsx with routing and
      theme provider
- [ ] T069 [P] Sidebar component in src/renderer/components/Sidebar/Sidebar.tsx
      with antd@^5.12.0
- [ ] T070 [P] WorkspaceList component in
      src/renderer/components/Sidebar/WorkspaceList.tsx with drag-and-drop
- [ ] T071 [P] ServiceList component in
      src/renderer/components/Sidebar/ServiceList.tsx with react-dnd@^16.0.0
- [ ] T072 [P] MainContent component in
      src/renderer/components/MainContent/MainContent.tsx with service view
- [ ] T073 [P] ServiceView component in
      src/renderer/components/MainContent/ServiceView.tsx with webview container

### Service Management UI

- [ ] T074 [P] CreateServiceModal component in
      src/renderer/components/Modals/CreateServiceModal.tsx with form validation
      using react-hook-form@^7.48.0 or Formik
- [ ] T075 [P] EditServiceModal component in
      src/renderer/components/Modals/EditServiceModal.tsx with
      react-hook-form@^7.48.0 and comprehensive validation
- [ ] T076 [P] CreateWorkspaceModal component in
      src/renderer/components/Modals/CreateWorkspaceModal.tsx
- [ ] T077 [P] ServiceCard component in
      src/renderer/components/ServiceCard/ServiceCard.tsx with hover states
- [ ] T078 [P] ServiceTemplateGrid component in
      src/renderer/components/ServiceTemplates/ServiceTemplateGrid.tsx

### Export/Import UI

- [ ] T079 [P] ExportConfigurationModal component in
      src/renderer/components/Export/ExportConfigurationModal.tsx with backup
      scheduling options
- [ ] T080 [P] ImportConfigurationModal component in
      src/renderer/components/Import/ImportConfigurationModal.tsx with migration
      wizard integration
- [ ] T081 [P] ImportPreview component in
      src/renderer/components/Import/ImportPreview.tsx with security warnings
      and re-authentication requirements preview
- [ ] T082 [P] SecurityWarning component in
      src/renderer/components/Security/SecurityWarning.tsx for re-authentication
      notices and credential stripping alerts

### Utility Components

- [ ] T083 [P] NotificationToast component in
      src/renderer/components/Notifications/NotificationToast.tsx with
      react-hot-toast@^2.4.0
- [ ] T084 [P] LoadingSpinner component in
      src/renderer/components/UI/LoadingSpinner.tsx
- [ ] T085 [P] ConfirmDialog component in
      src/renderer/components/UI/ConfirmDialog.tsx
- [ ] T086 [P] ThemeProvider component in
      src/renderer/components/Theme/ThemeProvider.tsx with dark/light mode

### Service Integration

- [ ] T087 ServiceTemplates data in src/renderer/data/ServiceTemplates.ts with
      popular services (Gmail, Slack, Discord, GitHub, etc.) and proper metadata
- [ ] T088 IconManager class in src/renderer/services/IconManager.ts with
      caching and fallbacks
- [ ] T089 UrlValidator class in src/renderer/services/UrlValidator.ts with
      security checking and malicious URL detection
- [ ] T090 FaviconFetcher class in src/renderer/services/FaviconFetcher.ts with
      error handling and fallback icon system
- [ ] T091 ServiceHealthChecker class in
      src/renderer/services/ServiceHealthChecker.ts with retry logic and user
      feedback for service availability

### Renderer Setup

- [ ] T092 Renderer entry point in src/renderer/index.tsx with React 18+
      createRoot
- [ ] T093 IPC service layer in src/renderer/services/IPCService.ts with typed
      electron.ipcRenderer
- [ ] T094 Error boundary in
      src/renderer/components/ErrorBoundary/ErrorBoundary.tsx
- [ ] T095 Context providers setup in src/renderer/providers/AppProviders.tsx

## Phase 3.6: Cross-Platform Integration

### BrowserView Integration

- [ ] T096 BrowserView lifecycle management in
      src/main/browserview/BrowserViewLifecycle.ts
- [ ] T097 Session isolation enforcement in
      src/main/browserview/SessionIsolation.ts
- [ ] T098 Navigation controls in src/main/browserview/NavigationControls.ts
- [ ] T099 Content security policy in
      src/main/browserview/ContentSecurityPolicy.ts

### Credential Storage Integration

- [ ] T100 Cross-platform keytar integration in
      src/main/storage/CredentialStore.ts
- [ ] T101 Credential encryption in src/main/storage/CredentialEncryption.ts
- [ ] T102 Session persistence in src/main/storage/SessionPersistence.ts
- [ ] T103 Secure credential cleanup in src/main/storage/CredentialCleanup.ts

### File System Operations

- [ ] T104 Configuration file management in
      src/main/filesystem/ConfigurationFileManager.ts
- [ ] T105 Export file operations in src/main/filesystem/ExportFileOperations.ts
- [ ] T106 Import file validation in src/main/filesystem/ImportFileValidation.ts
- [ ] T107 Cross-platform file dialogs in src/main/filesystem/FileDialogs.ts

### Logging & Monitoring

- [ ] T108 [P] Structured logging setup in src/main/logging/Logger.ts with
      electron-log@^5.0.0
- [ ] T109 [P] Performance monitoring in
      src/main/monitoring/PerformanceMonitor.ts
- [ ] T110 [P] Error tracking in src/main/monitoring/ErrorTracker.ts
- [ ] T111 [P] Memory usage monitoring in src/main/monitoring/MemoryMonitor.ts

## Phase 3.7: Production Polish

### Unit Tests

- [ ] T112 [P] Unit tests for ServiceManager in
      tests/unit/services/test_ServiceManager.spec.ts
- [ ] T113 [P] Unit tests for WorkspaceManager in
      tests/unit/services/test_WorkspaceManager.spec.ts
- [ ] T114 [P] Unit tests for CredentialStorage in
      tests/unit/security/test_CredentialStorage.spec.ts
- [ ] T115 [P] Unit tests for ConfigurationExporter in
      tests/unit/export/test_ConfigurationExporter.spec.ts
- [ ] T116 [P] Unit tests for React components in
      tests/unit/components/test_Components.spec.tsx
- [ ] T117 [P] Unit tests for Redux slices in
      tests/unit/store/test_Slices.spec.ts

### Security Testing

- [ ] T118 [P] Security validation tests in
      tests/unit/security/test_SecurityValidator.spec.ts
- [ ] T119 [P] Export security tests in
      tests/unit/security/test_ExportSecurity.spec.ts
- [ ] T120 [P] Session isolation tests in
      tests/unit/security/test_SessionIsolation.spec.ts
- [ ] T121 [P] Input sanitization tests in
      tests/unit/security/test_InputSanitization.spec.ts

### Performance & Optimization

- [ ] T122 [P] Memory usage optimization in
      src/main/optimization/MemoryOptimization.ts
- [ ] T123 [P] Startup time optimization in
      src/main/optimization/StartupOptimization.ts
- [ ] T124 [P] UI performance optimization in
      src/renderer/optimization/UIOptimization.ts
- [ ] T125 [P] Bundle size optimization in webpack configuration files

### Build & Packaging

- [ ] T126 Configure electron-builder with code signing for Windows and macOS in
      electron-builder.config.js with proper rollback mechanisms
- [ ] T127 Set up auto-updater with electron-updater@^6.1.0 in
      src/main/updater/AutoUpdater.ts with crash recovery
- [ ] T128 Create installer assets and icons in assets/ directory for all
      platforms
- [ ] T129 Configure GitHub Actions CI/CD in .github/workflows/build.yml for
      automated builds
- [ ] T130 Set up crash reporting with @sentry/electron@^4.15.0 (optional,
      privacy-focused) and telemetry collection

### Documentation & Distribution

- [ ] T131 [P] Update README.md with installation and usage instructions
- [ ] T132 [P] Create user documentation in docs/user-guide.md
- [ ] T133 [P] Create developer documentation in docs/developer-guide.md
- [ ] T134 [P] Generate API documentation from TypeScript interfaces
- [ ] T135 [P] Create release notes template in .github/RELEASE_TEMPLATE.md

## Dependencies

- Setup (T001-T012) before everything
- Tests (T013-T030) before implementation (T031+)
- Types (T031-T040) before implementation
- Main process core (T041-T062) before renderer process (T063-T095)
- Core implementation before integration (T096-T111)
- Everything before polish (T112-T135)

## Parallel Execution Examples

### Setup Phase

```bash
# Launch parallel setup tasks:
Task T002: "Configure TypeScript for main process"
Task T003: "Configure TypeScript for renderer process"
Task T004: "Install and configure ESLint"
Task T005: "Install and configure Prettier"
Task T006: "Configure Husky pre-commit hooks"
Task T009: "Install Jest for unit testing"
Task T010: "Install Playwright for E2E testing"
Task T011: "Configure electron-builder"
```

### Contract Tests Phase

```bash
# Launch parallel contract tests:
Task T013: "Contract test for service:create IPC channel"
Task T014: "Contract test for service:update IPC channel"
Task T015: "Contract test for service:delete IPC channel"
Task T016: "Contract test for workspace:create IPC channel"
Task T017: "Contract test for workspace:update IPC channel"
```

### Types Phase

```bash
# Launch parallel type definitions:
Task T031: "ServiceConfiguration interface"
Task T032: "Workspace interface"
Task T033: "UserSession interface"
Task T034: "ConfigurationExport interface"
Task T035: "ServiceTemplate interface"
Task T038: "JSON schema for ServiceConfiguration"
Task T039: "JSON schema for ConfigurationExport"
```

### UI Components Phase

```bash
# Launch parallel React components:
Task T068: "App component with routing"
Task T069: "Sidebar component with Ant Design"
Task T070: "WorkspaceList component with drag-and-drop"
Task T071: "ServiceList component with react-dnd"
Task T074: "CreateServiceModal component"
Task T075: "EditServiceModal component"
```

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- All tests must fail before implementation begins (TDD)
- Commit after each task completion
- Use exact library versions for production readiness
- Focus on zero-credential exports and complete session isolation
- Cross-platform compatibility required for all features
- > 80% test coverage target
- AI-executable tasks with specific implementation details

## Production Implementation Guidelines

_Integrated from inputTasks.md requirements_

### Task Generation Requirements Applied

1. **Library-First Approach**: All tasks specify exact library names and
   versions (keytar@^7.9.0, electron-builder@^24.0.0, etc.)
2. **Cross-Platform Compatibility**: Windows MSI, macOS DMG, Linux AppImage
   targets throughout
3. **Complete Implementations**: No placeholders, mockups, or "TODO"
   implementations - production-ready code only
4. **Comprehensive Testing**: Each feature has corresponding unit, integration,
   and E2E tests
5. **AI-Executable Instructions**: Clear, unambiguous task descriptions suitable
   for GitHub Copilot automation
6. **Security-First Design**: Export/import functionality designed with zero
   credential exposure

### Enhanced Implementation Details

#### Security & Session Management (Production-grade)

- **keytar Integration**: Cross-platform OS credential storage with Windows
  Credential Manager, macOS Keychain, Linux Secret Service
- **BrowserView Isolation**: Complete session isolation using Electron's
  BrowserView API with independent cookies and storage
- **CSP Implementation**: Content Security Policy headers and security
  validation for all external content
- **IPC Security**: Comprehensive message validation and sanitization for all
  main/renderer communication

#### Export/Import System (Secure Configuration Management)

- **Zero-Credential Design**: Export contains service URLs, names, icons,
  ordering - NEVER credentials
- **JSON Schema Validation**: Use ajv@^8.12.0 or joi for comprehensive
  configuration validation
- **Security Warnings**: Clear UI warnings about re-authentication requirements
  during import
- **Migration Support**: Guided re-authentication flow for first-time imports
- **Backup Scheduling**: Automatic export prompts with user-configurable
  intervals
- **Cross-Platform File Handling**: Proper permissions and file dialog
  integration

#### Service Integration & Health Monitoring

- **Template System**: JSON-based service templates with comprehensive metadata
- **Health Checking**: Service availability monitoring with retry logic and user
  feedback
- **Icon Management**: Favicon fetching with fallback system and caching
- **URL Validation**: Security checking with malicious URL detection
- **Popular Services**: Pre-configured templates for Gmail, Slack, Discord,
  GitHub, etc.

#### UI/UX Implementation (Modern Component Libraries)

- **Form Validation**: react-hook-form@^7.48.0 or Formik for comprehensive form
  handling
- **CSS Framework**: Tailwind CSS or Material-UI for responsive design
- **Drag-and-Drop**: react-dnd@^16.0.0 or SortableJS for service reordering
- **Toast Notifications**: react-hot-toast@^2.4.0 with proper error handling
- **Theme System**: Dark/light mode support with user preferences

#### Packaging & Distribution (End-to-End)

- **Code Signing**: Windows and macOS distribution with proper certificates
- **Auto-Updater**: electron-updater@^6.1.0 with rollback mechanisms and crash
  recovery
- **Installer Packages**: Proper permissions, uninstall support, and
  cross-platform compatibility
- **Crash Reporting**: Optional @sentry/electron@^4.15.0 integration with
  privacy focus
- **CI/CD Pipeline**: GitHub Actions for automated builds across all platforms

### Critical Security Requirements

- **NEVER store credentials** in application files, configuration, or exports
- **ALWAYS use keytar** for OS-native credential storage
- **VALIDATE all inputs** with proper sanitization and XSS protection
- **IMPLEMENT session isolation** with independent BrowserView instances
- **ENCRYPT session data** before storing in keytar
- **STRIP credentials** from all export operations
- **REQUIRE re-authentication** after configuration import

### Performance & Quality Standards

- **Memory Management**: Proper disposal of BrowserView instances and resource
  cleanup
- **Startup Optimization**: Lazy loading and efficient initialization
- **Bundle Optimization**: Webpack configuration for minimal bundle sizes
- **Test Coverage**: >80% coverage requirement with comprehensive test suites
- **Code Quality**: ESLint, Prettier, and Husky pre-commit hooks
- **Documentation**: Comprehensive user and developer documentation

### Cross-Platform Considerations

- **Windows**: MSI installer with proper registry entries and uninstall support
- **macOS**: DMG distribution with code signing and notarization
- **Linux**: AppImage format for universal compatibility
- **File Paths**: Cross-platform path handling with proper separators
- **Permissions**: Platform-specific permission handling for file operations
- **Native Integrations**: OS-specific features like system tray and
  notifications

## Task Generation Rules Applied

_Applied during task creation_

1. **From Contracts**: Each IPC contract → contract test task [P]
2. **From Data Model**: Each entity → interface creation task [P] + validation
   schema [P]
3. **From User Stories**: Each workflow → integration test [P]
4. **Security First**: Export/import security validation throughout
5. **Production Ready**: Real library versions, no placeholders, comprehensive
   testing
6. **Cross-Platform**: Windows/macOS/Linux support in all tasks

## Validation Checklist

_GATE: All items checked before task execution_

- [x] All contracts have corresponding tests (T013-T021)
- [x] All entities have model tasks (T031-T036)
- [x] All tests come before implementation (T013-T030 before T031+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path and libraries
- [x] No task modifies same file as another [P] task
- [x] Production-ready focus with real implementations
- [x] Security-first approach with zero credential exposure
- [x] Cross-platform compatibility throughout
- [x] Enhanced export/import system with backup scheduling (T058-T059)
- [x] Service health checking with retry logic (T091)
- [x] Migration wizard for guided re-authentication (T059)
- [x] Comprehensive form validation with modern libraries (T074-T075)
- [x] Crash reporting and rollback mechanisms (T126-T127, T130)
