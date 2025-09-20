## Project Title
GetWarped: Secure Multi-Service Workspace App

## Project Overview
GetWarped is a cross-platform Electron-based desktop application that acts as a secure, privacy-focused workspace for managing multiple online services (e.g., Gmail, Slack, Discord, ChatGPT, etc.). Users can add, organize, and interact with these services in isolated, sandboxed webviews, with no central login or server. All session data is securely stored using OS-native credential management, and each service runs in its own isolated context to prevent cross-service data access.

## Key Features
- Sidebar with service icons for navigation (inspired by VSCode/SigmaOS)
- Add services via manual URL entry, service templates, or in-app browser discovery
- Each service/tab runs in a fully isolated session (separate cookies/tokens)
- Secure session persistence using Windows Credential Manager/macOS Keychain
- Customizable icons, names, and ordering for services
- Grouping and workspace organization for power users
- **Export/Import Configuration**: Export service layout (URLs, names, icons, ordering) for backup and migration - NO credentials or secrets included
- **Secure Migration**: Import requires complete re-authentication to all services, reinforcing zero-trust security model
- Display error messages if a service is offline or unreachable
- Optional integration for local AI chat (Ollama, Foundry Local) as a separate service
- No central app login or server-side data storage

## Security Principles
- No cross-tab communication; each service is a walled garden
- No storage of full credentials; only session cookies/tokens
- All sensitive data stored using OS-native secure storage
- **Export Security**: Configuration exports contain ZERO sensitive data - only service metadata (URLs, names, icons, ordering)
- **Import Security**: All imported services require complete re-authentication, ensuring no credential transfer between devices

## Technology Stack
- Electron (Chromium webviews) - Cross-platform desktop app framework
- Node.js backend for OS integration
- Windows Credential Manager/macOS Keychain APIs (use existing OS libraries)
- UI Framework: Leverage established libraries (React/Vue/vanilla JS + CSS framework)
- State Management: Use proven libraries (Redux, Zustand, or similar)
- Icon Libraries: Utilize existing icon sets (Feather, Heroicons, etc.)
- Drag & Drop: Leverage mature libraries (react-dnd, SortableJS, etc.)
- Optional: Local AI integration via API (Ollama REST API, Foundry Local API)

**Library Strategy**: Prioritize mature, well-maintained open-source libraries over custom implementations. Focus development effort on core business logic (service isolation, credential management, UI orchestration) rather than reinventing common UI components, drag-and-drop, or icon systems.

## User Experience
- Clean, modern UI with vertical tabs and workspaces
- Intergrated support for light or dark mode as well as app themes
- Easy add/remove/reorder/group services
- In-app browser for service discovery and quick addition
- Customizable appearance (icons, names, themes)

## Out of Scope
- No central authentication or cloud sync
- No offline-first functionality (except for local AI)
- No catalog/registry in initial release

## Success Criteria
- Users can add, organize, and persistently access multiple online services securely
- Each service remains isolated and secure
- No user friction from central logins or privacy concerns
- Extensible for future richer app integrations

**PRODUCTION-READY REQUIREMENTS**:
This specification must result in a complete, fully functional, production-grade application ready for end-user deployment. No placeholders, mockups, or "TODO" items - every component must be fully implemented, tested, and packaged for distribution.

**CROSS-PLATFORM REQUIREMENTS**:
The application must work seamlessly on Windows, macOS, and Linux. Leverage Electron's cross-platform capabilities and ensure all OS-specific integrations (credential storage, notifications, file system access) work across platforms.

**LIBRARY-FIRST APPROACH**:
Prioritize using established, mature libraries and frameworks over custom implementations. Focus development time on unique business logic rather than common functionality already solved by the open-source community.

## Please generate a detailed technical specification for this project, including:
- Complete architecture with specific library recommendations
- Cross-platform implementation details for all OS integrations
- Security model with specific APIs and libraries
- UI/UX implementation using existing component libraries
- **Export/Import System**: Complete specification for secure configuration backup/restore functionality
- Packaging and distribution strategy for all platforms
- Testing strategy for automated quality assurance
- Performance optimization for production deployment
