# GetWarped: Quick Start Guide

**Feature**: GetWarped: Secure Multi-Service Workspace App  
**Date**: September 20, 2025  
**Branch**: `001-title-getwarped-secure`

## Overview

GetWarped is a secure desktop application for managing multiple online services
in isolated workspaces. Each service runs in its own secure container with
OS-native credential storage and zero cross-service data sharing.

## Prerequisites

### System Requirements

- **Windows**: Windows 10 (version 1903+) or Windows 11
- **macOS**: macOS 11.0 (Big Sur) or later
- **Linux**: Ubuntu 20.04 LTS or equivalent with GTK 3.24+
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB available space
- **Network**: Internet connection for service access

### Development Prerequisites

- **Node.js**: 18.0+ with npm 8.0+
- **Git**: 2.30+ for version control
- **Python**: 3.8+ (for native module compilation)
- **Visual Studio Code**: Recommended IDE with extensions

## Installation

### Option 1: Download Release (Recommended)

1. Visit [GitHub Releases](https://github.com/yourusername/getwarped/releases)
2. Download the installer for your platform:
   - `GetWarped-Setup-1.0.0.exe` (Windows)
   - `GetWarped-1.0.0.dmg` (macOS)
   - `GetWarped-1.0.0.AppImage` (Linux)
3. Run the installer and follow the setup wizard
4. Launch GetWarped from your applications menu

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/getwarped.git
cd getwarped

# Install dependencies
npm install

# Build the application
npm run build

# Package for your platform
npm run package

# Run the packaged application
npm run start
```

## First Launch

### Initial Setup

1. **Welcome Screen**: Choose your preferred theme (Light/Dark)
2. **Privacy Settings**: Configure data collection preferences
3. **Security Setup**: Enable OS credential storage integration
4. **Default Workspace**: Create your first workspace

### Creating Your First Workspace

1. Click **"Create Workspace"** in the sidebar
2. Enter workspace details:
   - **Name**: e.g., "Personal", "Work", "Projects"
   - **Description**: Optional workspace description
   - **Theme**: Choose colors and appearance
3. Click **"Create"** to save your workspace

### Adding Your First Service

1. Select your workspace from the sidebar
2. Click **"Add Service"** in the main area
3. Choose from options:
   - **Quick Setup**: Select from popular service templates
   - **Custom Service**: Enter custom URL and details
4. Configure service settings:
   - **Name**: Display name for the service
   - **URL**: Service web address
   - **Icon**: Choose or upload custom icon
   - **Notifications**: Enable/disable notifications
5. Click **"Add Service"** to create

## Core Features

### Service Management

- **Add Services**: Quick templates or custom URLs
- **Organize**: Drag and drop to reorder services
- **Customize**: Themes, icons, and display preferences
- **Isolate**: Each service runs in its own secure container

### Workspace Organization

- **Multiple Workspaces**: Separate work, personal, and project services
- **Quick Switching**: Click workspace tabs in sidebar
- **Theme Customization**: Per-workspace colors and appearance
- **Service Grouping**: Logical organization of related services

### Security Features

- **Credential Storage**: OS-native secure storage (Keychain/Credential Manager)
- **Session Isolation**: No data sharing between services
- **Ad/Tracker Blocking**: Built-in content filtering
- **Export Safety**: Configuration exports exclude all credentials

### Configuration Management

- **Export Settings**: Backup workspace and service configurations
- **Import Settings**: Restore or migrate configurations
- **Sync Across Devices**: Manual configuration sharing
- **Version Control**: Track configuration changes

## Common Use Cases

### Personal Productivity Setup

```
Workspace: "Personal"
├── Gmail (notifications enabled)
├── Google Calendar (daily view)
├── Google Drive (file access)
├── YouTube (entertainment)
└── Reddit (social browsing)
```

### Work Environment Setup

```
Workspace: "Work"
├── Outlook 365 (corporate email)
├── Microsoft Teams (communication)
├── SharePoint (document collaboration)
├── Jira (project tracking)
└── Confluence (knowledge base)
```

### Development Workflow Setup

```
Workspace: "Development"
├── GitHub (code repositories)
├── Stack Overflow (technical questions)
├── Docker Hub (container images)
├── AWS Console (cloud resources)
└── Linear (issue tracking)
```

## Service Templates

GetWarped includes built-in templates for popular services:

### Communication

- **Email**: Gmail, Outlook, Yahoo Mail, ProtonMail
- **Chat**: Slack, Discord, Microsoft Teams, Telegram
- **Video**: Zoom, Google Meet, Skype, WebEx

### Productivity

- **Office**: Google Workspace, Microsoft 365, Notion
- **Project Management**: Jira, Trello, Asana, Linear
- **Note Taking**: Obsidian, Roam Research, Logseq

### Development

- **Code Hosting**: GitHub, GitLab, Bitbucket
- **Cloud Platforms**: AWS, Azure, Google Cloud
- **Monitoring**: Datadog, New Relic, Grafana

### Entertainment

- **Streaming**: YouTube, Netflix, Spotify, Twitch
- **Social**: Twitter, LinkedIn, Reddit, Facebook

## Keyboard Shortcuts

### Global Shortcuts

- `Ctrl/Cmd + ,`: Open Settings
- `Ctrl/Cmd + N`: Create New Service
- `Ctrl/Cmd + W`: Create New Workspace
- `Ctrl/Cmd + T`: Switch Between Workspaces
- `Ctrl/Cmd + R`: Refresh Current Service
- `Ctrl/Cmd + Q`: Quit Application

### Service Navigation

- `Ctrl/Cmd + 1-9`: Switch to Service by Position
- `Ctrl/Cmd + Left/Right`: Navigate Service History
- `Ctrl/Cmd + Shift + R`: Hard Refresh (Clear Cache)
- `F11`: Toggle Fullscreen Mode
- `Ctrl/Cmd + 0`: Reset Zoom Level

### Workspace Management

- `Ctrl/Cmd + Shift + N`: New Workspace
- `Ctrl/Cmd + Shift + W`: Switch Workspace
- `Ctrl/Cmd + Shift + E`: Export Configuration
- `Ctrl/Cmd + Shift + I`: Import Configuration

## Configuration Export/Import

### Exporting Your Configuration

1. Go to **Settings** → **Configuration** → **Export**
2. Select workspaces to include (or select all)
3. Choose export location and filename
4. Click **"Export Configuration"**
5. Save the `.json` file securely

**Note**: Exports contain only service URLs, names, and preferences. No
credentials, session data, or personal information is included.

### Importing Configuration

1. Go to **Settings** → **Configuration** → **Import**
2. Select your configuration `.json` file
3. Choose merge strategy:
   - **Replace**: Replace existing configuration
   - **Merge**: Add to existing configuration
   - **Skip Duplicates**: Only add new services
4. Review import preview
5. Click **"Import Configuration"**

## Troubleshooting

### Common Issues

#### Service Not Loading

1. Check internet connection
2. Verify service URL is correct
3. Try refreshing the service (`Ctrl/Cmd + R`)
4. Clear service cache in Settings
5. Check if service requires specific user agent

#### Credential Storage Issues

1. Ensure OS credential storage is enabled
2. Check system permissions for credential access
3. Try logging out and back into the service
4. Contact support if issues persist

#### Performance Issues

1. Check system memory usage in Task Manager
2. Close unused services or workspaces
3. Clear service caches in Settings
4. Disable hardware acceleration if experiencing graphics issues
5. Reduce the number of active services

#### Import/Export Problems

1. Verify JSON file is not corrupted
2. Check file permissions and location
3. Ensure GetWarped version compatibility
4. Try smaller configuration exports
5. Validate JSON format using online validators

### Getting Help

#### Documentation

- **User Guide**: Comprehensive feature documentation
- **Developer Documentation**: API and development guides
- **FAQ**: Frequently asked questions and solutions

#### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **Community Forum**: User discussions and help
- **Email Support**: Direct support for urgent issues

#### Reporting Bugs

1. Check existing GitHub issues first
2. Include system information and GetWarped version
3. Provide steps to reproduce the issue
4. Include relevant log files from Settings → Advanced → Logs
5. Screenshots or screen recordings if applicable

## Advanced Configuration

### Custom Service Templates

Create custom service templates by editing the templates configuration:

```json
{
  "id": "custom-service",
  "name": "Custom Service",
  "url": "https://example.com",
  "category": "productivity",
  "icon": "custom-icon",
  "defaultTheme": {
    "primaryColor": "#007acc"
  }
}
```

### Proxy Configuration

Configure proxy settings in Settings → Advanced → Network:

1. Select proxy type (HTTP/HTTPS/SOCKS)
2. Enter proxy server details
3. Configure authentication if required
4. Test proxy connection
5. Apply to all services or specific workspaces

### Development Mode

Enable development features in Settings → Advanced → Developer:

- **Debug Logging**: Detailed application logs
- **Console Access**: Browser developer tools for services
- **Custom CSS**: Inject custom styles into services
- **Script Execution**: Run custom JavaScript in service contexts

## Security Best Practices

### Credential Management

- Use OS-native credential storage exclusively
- Never store credentials in configuration files
- Regularly review and clean up stored credentials
- Use two-factor authentication when available

### Service Isolation

- Keep unrelated services in separate workspaces
- Regularly clear service caches and session data
- Be cautious with custom user agents and scripts
- Monitor service permissions and access requests

### Configuration Sharing

- Never share configuration files containing sensitive data
- Review export contents before sharing
- Use secure channels for configuration transfer
- Regularly update and rotate shared configurations

---

_GetWarped: Secure, Private, Productive_
