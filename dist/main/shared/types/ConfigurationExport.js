"use strict";
/**
 * ConfigurationExport: Secure export/import data structures
 *
 * Represents sanitized configuration data for export/import functionality.
 * CRITICAL: This system NEVER exports credentials, session data, or sensitive information.
 * Only service configurations, workspace layouts, and user preferences are included.
 *
 * @fileoverview ConfigurationExport interfaces and security-focused export utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_IMPORT_CONFIG = void 0;
exports.isConfigurationExport = isConfigurationExport;
exports.isExportedWorkspace = isExportedWorkspace;
exports.isExportedService = isExportedService;
exports.isExportMetadata = isExportMetadata;
exports.validateExportSecurity = validateExportSecurity;
exports.createExportMetadata = createExportMetadata;
/**
 * Type guard to check if an object is a valid ConfigurationExport
 * Essential for security validation during import operations
 *
 * @param obj - Object to validate
 * @returns True if object matches ConfigurationExport interface
 */
function isConfigurationExport(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const config = obj;
    return (typeof config.version === 'string' &&
        config.exportedAt instanceof Date &&
        Array.isArray(config.workspaces) &&
        config.workspaces.every(isExportedWorkspace) &&
        isExportMetadata(config.metadata));
}
/**
 * Type guard for ExportedWorkspace validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportedWorkspace interface
 */
function isExportedWorkspace(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const workspace = obj;
    return (typeof workspace.name === 'string' &&
        Array.isArray(workspace.services) &&
        workspace.services.every(isExportedService) &&
        typeof workspace.position === 'number' &&
        typeof workspace.wasDefault === 'boolean');
}
/**
 * Type guard for ExportedService validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportedService interface
 */
function isExportedService(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const service = obj;
    return (typeof service.name === 'string' &&
        typeof service.url === 'string' &&
        ['url', 'base64', 'builtin'].includes(service.iconType) &&
        typeof service.notifications === 'boolean' &&
        typeof service.position === 'number' &&
        typeof service.blockAds === 'boolean' &&
        typeof service.blockTrackers === 'boolean');
}
/**
 * Type guard for ExportMetadata validation
 *
 * @param obj - Object to validate
 * @returns True if object matches ExportMetadata interface
 */
function isExportMetadata(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const metadata = obj;
    return (typeof metadata.appVersion === 'string' &&
        typeof metadata.platform === 'string' &&
        typeof metadata.totalWorkspaces === 'number' &&
        typeof metadata.totalServices === 'number' &&
        typeof metadata.exportVersion === 'string' &&
        metadata.createdAt instanceof Date);
}
/**
 * Security validation for configuration exports
 * Ensures no sensitive data is present in export structure
 *
 * @param exportData - Export data to validate
 * @returns Array of security issues found (empty if valid)
 */
function validateExportSecurity(exportData) {
    const issues = [];
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
                if (url.hostname === 'localhost' ||
                    url.hostname.startsWith('192.168.') ||
                    url.hostname.startsWith('10.') ||
                    url.hostname.startsWith('172.')) {
                    issues.push(`Service '${service.name}' URL appears to be internal/private`);
                }
            }
            catch (error) {
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
function createExportMetadata(appVersion, workspaceCount, serviceCount) {
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
exports.DEFAULT_IMPORT_CONFIG = {
    conflictResolution: 'ask',
    importThemes: true,
    importPreferences: false,
    workspaceMergeStrategy: 'separate',
    validateUrls: true,
    maxServices: 100,
};
//# sourceMappingURL=ConfigurationExport.js.map