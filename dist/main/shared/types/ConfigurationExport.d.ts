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
export declare function isConfigurationExport(obj: unknown): obj is ConfigurationExport;
/**
 * Type guard for ExportedWorkspace validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportedWorkspace interface
 */
export declare function isExportedWorkspace(obj: unknown): obj is ExportedWorkspace;
/**
 * Type guard for ExportedService validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportedService interface
 */
export declare function isExportedService(obj: unknown): obj is ExportedService;
/**
 * Type guard for ExportMetadata validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportMetadata interface
 */
export declare function isExportMetadata(obj: unknown): obj is ExportMetadata;
/**
 * Security validation for configuration exports
 * Ensures no sensitive data is present in export structure
 *
 * @param exportData - Export data to validate
 * @returns Array of security issues found (empty if valid)
 */
export declare function validateExportSecurity(exportData: ConfigurationExport): string[];
/**
 * Creates export metadata from application state
 *
 * @param appVersion - Current application version
 * @param workspaceCount - Number of workspaces being exported
 * @param serviceCount - Number of services being exported
 * @returns ExportMetadata object
 */
export declare function createExportMetadata(appVersion: string, workspaceCount: number, serviceCount: number): ExportMetadata;
/**
 * Default import configuration for safe import operations
 */
export declare const DEFAULT_IMPORT_CONFIG: ImportConfiguration;
//# sourceMappingURL=ConfigurationExport.d.ts.map