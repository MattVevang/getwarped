/**
 * ConfigurationExport: Secure export/import data structures
 *
 * Represents sanitized configuration data for export/import functionality.
 * CRITICAL: This system NEVER exports credentials, session data, or sensitive information.
 * Only service configurations, workspace layouts, and user preferences are included.
 *
 * @fileoverview ConfigurationExport interfaces and security-focused export utilities
 */

import { ServiceTheme } from './ServiceConfiguration';
import { WorkspaceTheme } from './Workspace';

/**
 * Export metadata containing version and platform information
 * Used for compatibility checking during import operations
 */
export interface ExportMetadata {
  /** GetWarped version that created this export */
  appVersion: string;

  /** Operating system where export was created */
  platform: string;

  /** Count of exported workspaces */
  totalWorkspaces: number;

  /** Count of exported services across all workspaces */
  totalServices: number;

  /** Export format version for schema compatibility */
  exportVersion: string;

  /** Optional export description or notes */
  description?: string;

  /** Export creation timestamp */
  createdAt: Date;

  /** Checksum for data integrity verification */
  checksum?: string;
}

/**
 * Sanitized service configuration for export
 * Contains ONLY non-sensitive service information
 *
 * SECURITY NOTE: No credentials, session data, or authentication tokens are included
 */
export interface ExportedService {
  /** Service display name */
  name: string;

  /** Service URL (publicly accessible information) */
  url: string;

  /** Icon data (if not credential-related or sensitive) */
  icon?: string;

  /** Icon source type */
  iconType: 'url' | 'base64' | 'builtin';

  /** Service-specific theming */
  theme?: ServiceTheme;

  /** Notification preferences */
  notifications: boolean;

  /** Display order within workspace */
  position: number;

  /** Custom user agent (if not sensitive) */
  customUserAgent?: string;

  /** Ad blocking preference */
  blockAds: boolean;

  /** Tracker blocking preference */
  blockTrackers: boolean;

  /** Service category for organization */
  category?: string;

  /** Optional service-specific notes */
  notes?: string;

  /** Service template ID if created from template */
  templateId?: string;
}

/**
 * Sanitized workspace configuration for export
 * Contains workspace layout and theme information
 */
export interface ExportedWorkspace {
  /** Workspace name */
  name: string;

  /** Workspace description */
  description?: string;

  /** Sanitized service configurations */
  services: ExportedService[];

  /** Theme settings */
  theme: WorkspaceTheme;

  /** Display order in workspace list */
  position: number;

  /** Whether this was the default workspace */
  wasDefault: boolean;

  /** Optional workspace-specific notes */
  notes?: string;
}

/**
 * Complete configuration export structure
 *
 * This is the root export format that contains all exportable application data.
 * The structure is designed for security - no sensitive information is included.
 *
 * @example
 * ```typescript
 * const exportData: ConfigurationExport = {
 *   version: '1.0.0',
 *   exportedAt: new Date(),
 *   workspaces: [workWorkspace, personalWorkspace],
 *   metadata: {
 *     appVersion: '1.0.0',
 *     platform: 'Windows',
 *     totalWorkspaces: 2,
 *     totalServices: 8,
 *     exportVersion: '1.0.0',
 *     createdAt: new Date()
 *   }
 * };
 * ```
 */
export interface ConfigurationExport {
  /** Export format version (e.g., "1.0.0") */
  version: string;

  /** Export timestamp */
  exportedAt: Date;

  /** Sanitized workspace configurations */
  workspaces: ExportedWorkspace[];

  /** Export metadata and statistics */
  metadata: ExportMetadata;

  /** Optional application-wide preferences */
  preferences?: ExportedPreferences;

  /** Security warnings and notices for import */
  securityNotices?: string[];
}

/**
 * Application preferences that can be safely exported
 * Does not include sensitive settings or authentication data
 */
export interface ExportedPreferences {
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';

  /** Language/locale preference */
  language: string;

  /** Notification preferences */
  notifications: {
    enabled: boolean;
    showInTray: boolean;
    soundEnabled: boolean;
  };

  /** Window preferences */
  window: {
    width: number;
    height: number;
    maximized: boolean;
  };

  /** Privacy preferences */
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    errorReporting: boolean;
  };

  /** Auto-update preferences */
  updates: {
    autoCheck: boolean;
    autoInstall: boolean;
    includePrerelease: boolean;
  };
}

/**
 * Import configuration for merge strategies and conflict resolution
 */
export interface ImportConfiguration {
  /** How to handle name conflicts during import */
  conflictResolution: 'skip' | 'rename' | 'overwrite' | 'ask';

  /** Whether to import workspace themes */
  importThemes: boolean;

  /** Whether to import application preferences */
  importPreferences: boolean;

  /** Workspace merge strategy */
  workspaceMergeStrategy: 'separate' | 'merge' | 'replace';

  /** Whether to validate URLs during import */
  validateUrls: boolean;

  /** Maximum services to import (safety limit) */
  maxServices?: number;
}

/**
 * Import result summary for user feedback
 */
export interface ImportResult {
  /** Import operation success status */
  success: boolean;

  /** Number of workspaces successfully imported */
  workspacesImported: number;

  /** Number of services successfully imported */
  servicesImported: number;

  /** Number of items skipped due to conflicts */
  itemsSkipped: number;

  /** Detailed error messages if any */
  errors: string[];

  /** Warning messages for user attention */
  warnings: string[];

  /** Summary message for UI display */
  summary: string;

  /** Imported workspace IDs for navigation */
  importedWorkspaceIds: string[];
}

/**
 * Type guard to check if an object is a valid ConfigurationExport
 * Essential for security validation during import operations
 *
 * @param obj - Object to validate
 * @returns True if object matches ConfigurationExport interface
 */
export function isConfigurationExport(obj: unknown): obj is ConfigurationExport {
  if (!obj || typeof obj !== 'object') return false;

  const config = obj as Partial<ConfigurationExport>;

  return (
    typeof config.version === 'string' &&
    config.exportedAt instanceof Date &&
    Array.isArray(config.workspaces) &&
    config.workspaces.every(isExportedWorkspace) &&
    isExportMetadata(config.metadata)
  );
}

/**
 * Type guard for ExportedWorkspace validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportedWorkspace interface
 */
export function isExportedWorkspace(obj: unknown): obj is ExportedWorkspace {
  if (!obj || typeof obj !== 'object') return false;

  const workspace = obj as Partial<ExportedWorkspace>;

  return (
    typeof workspace.name === 'string' &&
    Array.isArray(workspace.services) &&
    workspace.services.every(isExportedService) &&
    typeof workspace.position === 'number' &&
    typeof workspace.wasDefault === 'boolean'
  );
}

/**
 * Type guard for ExportedService validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportedService interface
 */
export function isExportedService(obj: unknown): obj is ExportedService {
  if (!obj || typeof obj !== 'object') return false;

  const service = obj as Partial<ExportedService>;

  return (
    typeof service.name === 'string' &&
    typeof service.url === 'string' &&
    ['url', 'base64', 'builtin'].includes(service.iconType as string) &&
    typeof service.notifications === 'boolean' &&
    typeof service.position === 'number' &&
    typeof service.blockAds === 'boolean' &&
    typeof service.blockTrackers === 'boolean'
  );
}

/**
 * Type guard for ExportMetadata validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportMetadata interface
 */
export function isExportMetadata(obj: unknown): obj is ExportMetadata {
  if (!obj || typeof obj !== 'object') return false;

  const metadata = obj as Partial<ExportMetadata>;

  return (
    typeof metadata.appVersion === 'string' &&
    typeof metadata.platform === 'string' &&
    typeof metadata.totalWorkspaces === 'number' &&
    typeof metadata.totalServices === 'number' &&
    typeof metadata.exportVersion === 'string' &&
    metadata.createdAt instanceof Date
  );
}

/**
 * Security validation for configuration exports
 * Ensures no sensitive data is present in export structure
 *
 * @param exportData - Export data to validate
 * @returns Array of security issues found (empty if valid)
 */
export function validateExportSecurity(exportData: ConfigurationExport): string[] {
  const issues: string[] = [];

  // Check for forbidden keywords that might indicate sensitive data
  const forbiddenKeywords = [
    'password',
    'token',
    'session',
    'cookie',
    'credential',
    'auth',
    'login',
    'secret',
    'key',
    'private',
  ];

  const jsonString = JSON.stringify(exportData).toLowerCase();

  forbiddenKeywords.forEach(keyword => {
    if (jsonString.includes(keyword)) {
      issues.push(`Potential sensitive data detected: '${keyword}' found in export`);
    }
  });

  // Validate URLs are not internal or credential-containing
  exportData.workspaces.forEach(workspace => {
    workspace.services.forEach(service => {
      try {
        const url = new URL(service.url);

        // Check for credentials in URL
        if (url.username || url.password) {
          issues.push(`Service '${service.name}' URL contains embedded credentials`);
        }

        // Check for internal/localhost URLs
        if (
          url.hostname === 'localhost' ||
          url.hostname.startsWith('192.168.') ||
          url.hostname.startsWith('10.') ||
          url.hostname.startsWith('172.')
        ) {
          issues.push(`Service '${service.name}' URL appears to be internal/private`);
        }
      } catch (error) {
        issues.push(`Service '${service.name}' has invalid URL format`);
      }
    });
  });

  return issues;
}

/**
 * Creates export metadata from application state
 *
 * @param appVersion - Current application version
 * @param workspaceCount - Number of workspaces being exported
 * @param serviceCount - Number of services being exported
 * @returns ExportMetadata object
 */
export function createExportMetadata(
  appVersion: string,
  workspaceCount: number,
  serviceCount: number
): ExportMetadata {
  return {
    appVersion,
    platform: process.platform,
    totalWorkspaces: workspaceCount,
    totalServices: serviceCount,
    exportVersion: '1.0.0',
    createdAt: new Date(),
  };
}

/**
 * Default import configuration for safe import operations
 */
export const DEFAULT_IMPORT_CONFIG: ImportConfiguration = {
  conflictResolution: 'ask',
  importThemes: true,
  importPreferences: false,
  workspaceMergeStrategy: 'separate',
  validateUrls: true,
  maxServices: 100,
};
