# GetWarped

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/getwarped/build.yml?branch=main)
![Version](https://img.shields.io/github/v/release/yourusername/getwarped)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

**GetWarped** is a secure multi-service workspace application that allows you to
manage multiple online services in completely isolated environments. Built with
Electron, TypeScript, React, and Redux Toolkit, it provides enterprise-grade
security with session isolation and OS-native credential storage.

## ✨ Features

### 🔒 Security First

- **Complete Session Isolation**: Each service runs in its own isolated
  BrowserView
- **OS-Native Credential Storage**: Uses keytar for secure credential management
- **Zero Credential Export**: Credentials never leave the secure storage
- **Content Security Policy**: Comprehensive CSP implementation
- **Security Audit Logging**: Track all security-related events

### 🏢 Workspace Management

- **Multiple Workspaces**: Organize services into logical groups
- **Service Templates**: Pre-configured templates for popular services
- **Drag & Drop Reordering**: Intuitive workspace and service organization
- **Import/Export Configuration**: Backup and restore workspace configurations
- **Theme Support**: Dark and light themes with system preference detection

### 🚀 Performance & Reliability

- **Optimized Bundle**: Advanced webpack optimization with code splitting
- **Memory Management**: Efficient resource cleanup and memory optimization
- **Error Boundaries**: Graceful error handling and recovery
- **Auto-Updates**: Seamless automatic updates via GitHub releases
- **Cross-Platform**: Native support for Windows, macOS, and Linux

### 🧪 Testing & Quality

- **95%+ Test Coverage**: Comprehensive unit, integration, and E2E tests
- **TypeScript**: Full type safety throughout the application
- **ESLint + Prettier**: Consistent code formatting and quality
- **Performance Testing**: Memory and performance monitoring
- **Accessibility**: WCAG 2.1 compliant with screen reader support

## 📦 Installation

### Download Releases

Download the latest release for your platform:

- **Windows**: `GetWarped-Setup-*.exe` (Installer) or `GetWarped-*-portable.exe`
  (Portable)
- **macOS**: `GetWarped-*-arm64.dmg` (Apple Silicon) or `GetWarped-*-x64.dmg`
  (Intel)
- **Linux**: `GetWarped-*.AppImage` (AppImage) or `GetWarped-*.deb`
  (Debian/Ubuntu)

### Platform-Specific Instructions

#### Windows

1. Download the installer or portable version
2. Run the installer and follow the setup wizard
3. Launch GetWarped from the Start Menu

#### macOS

1. Download the appropriate DMG for your architecture
2. Open the DMG and drag GetWarped to Applications
3. Launch from Applications (you may need to allow it in Security preferences)

#### Linux

**AppImage (Recommended)**:

```bash
chmod +x GetWarped-*.AppImage
./GetWarped-*.AppImage
```

**Debian/Ubuntu**:

```bash
sudo dpkg -i GetWarped-*.deb
```

## 🛠️ Development

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/getwarped.git
cd getwarped

# Install dependencies
npm install

# Build the application
npm run build

# Start in development mode
npm run dev
```

### Available Scripts

#### Build Commands

```bash
npm run build                 # Production build (main + renderer)
npm run build:dev            # Development build
npm run build:watch          # Watch mode for development
npm run dev                  # Build and start development
npm run dev:watch            # Watch and auto-restart
```

#### Testing Commands

```bash
npm test                     # Run all unit tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report
npm run test:e2e            # Run E2E tests with Playwright
npm run test:integration     # Run integration tests
npm run test:performance     # Run performance tests
```

#### Code Quality

```bash
npm run lint                 # ESLint check
npm run lint:fix            # Fix ESLint issues
npm run format              # Format with Prettier
npm run typecheck           # TypeScript type checking
npm run security:scan       # Security audit
```

#### Packaging

```bash
npm run electron:build       # Build for current platform
npm run electron:build:win   # Build for Windows
npm run electron:build:mac   # Build for macOS
npm run electron:build:linux # Build for Linux
npm run electron:build:all   # Build for all platforms
```

#### Bundle Analysis

```bash
npm run analyze:bundle       # Analyze webpack bundle size
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: Electron 27+ with TypeScript 5.0+
- **UI**: React 18+ with Ant Design components
- **State Management**: Redux Toolkit with RTK Query
- **Security**: keytar for OS-native credentials, isolated BrowserViews
- **Testing**: Jest (unit/integration) + Playwright (E2E)
- **Build**: Webpack 5+ with advanced optimization

### Project Structure

```
src/
├── main/                   # Main Electron process
│   ├── services/          # Business logic services
│   ├── handlers/          # IPC handlers
│   ├── security/          # Security utilities
│   ├── storage/           # Data persistence
│   └── updater/           # Auto-updater service
├── renderer/              # Renderer process (React app)
│   ├── components/        # React components
│   ├── store/            # Redux store and slices
│   ├── services/         # API services
│   └── hooks/            # Custom React hooks
├── shared/               # Shared code between processes
│   ├── types/            # TypeScript interfaces
│   ├── constants/        # Application constants
│   └── validation/       # Validation schemas
└── tests/               # Test files
    ├── unit/            # Unit tests
    ├── integration/     # Integration tests
    └── e2e/            # End-to-end tests
```

### Security Model

- **Process Isolation**: Main and renderer processes communicate only via IPC
- **BrowserView Isolation**: Each service runs in its own isolated context
- **Credential Security**: All credentials stored using OS keychain/credential
  manager
- **Session Separation**: No shared cookies, localStorage, or session data
- **Content Security Policy**: Strict CSP prevents XSS and code injection

## 🧪 Testing

GetWarped maintains comprehensive test coverage:

- **Unit Tests**: 90+ tests covering core business logic
- **Integration Tests**: End-to-end workflow testing
- **E2E Tests**: Full user journey automation with Playwright
- **Performance Tests**: Memory usage and performance monitoring
- **Security Tests**: Credential isolation and security validation

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only

# Coverage report
npm run test:coverage
```

## 🚀 Building & Packaging

### Development Build

```bash
npm run build:dev
npm run dev
```

### Production Build

```bash
# Build for current platform
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux

# Build for all platforms
npm run electron:build:all
```

### CI/CD Pipeline

GetWarped uses GitHub Actions for automated:

- **Testing**: Cross-platform test execution
- **Building**: Automated builds for Windows, macOS, and Linux
- **Releasing**: Automated release creation with signed binaries
- **Security**: Dependency scanning and vulnerability assessment

## 🔧 Configuration

### Environment Variables

```bash
NODE_ENV=production          # Production mode
ELECTRON_DISABLE_SECURITY_WARNINGS=true
CSC_LINK=                   # Code signing certificate
CSC_KEY_PASSWORD=           # Certificate password
GH_TOKEN=                   # GitHub token for releases
```

### Application Settings

The app stores configuration in:

- **Windows**: `%APPDATA%/GetWarped`
- **macOS**: `~/Library/Application Support/GetWarped`
- **Linux**: `~/.config/GetWarped`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md)
for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Run the test suite (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode with comprehensive typing
- **React**: Functional components with hooks
- **Testing**: Jest for unit/integration, Playwright for E2E
- **Formatting**: Prettier with ESLint integration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🔗 Links

- [GitHub Repository](https://github.com/yourusername/getwarped)
- [Issue Tracker](https://github.com/yourusername/getwarped/issues)
- [Releases](https://github.com/yourusername/getwarped/releases)
- [Documentation](https://github.com/yourusername/getwarped/wiki)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/getwarped/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/yourusername/getwarped/discussions)
- **Security**: Email security@getwarped.com for security issues

---

**GetWarped** - Secure Multi-Service Workspace Management

Built with ❤️ using Electron, TypeScript, React, and modern web technologies.
