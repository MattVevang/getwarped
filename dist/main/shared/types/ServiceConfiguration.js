"use strict";
/**
 * ServiceConfiguration: Core interface for individual service definitions
 *
 * Represents an individual online service configuration within a workspace.
 * Used throughout the application for service management, UI rendering, and persistence.
 *
 * @fileoverview ServiceConfiguration and related theme interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SERVICE_THEME = void 0;
exports.isServiceConfiguration = isServiceConfiguration;
exports.isServiceTheme = isServiceTheme;
exports.createServiceConfiguration = createServiceConfiguration;
/**
 * Type guard to check if an object is a valid ServiceConfiguration
 * Useful for runtime type checking, especially during import/deserialization
 *
 * @param obj - Object to validate
 * @returns True if object matches ServiceConfiguration interface
 */
function isServiceConfiguration(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const service = obj;
    return (typeof service.id === 'string' &&
        typeof service.name === 'string' &&
        typeof service.url === 'string' &&
        ['url', 'base64', 'builtin'].includes(service.iconType) &&
        typeof service.workspaceId === 'string' &&
        typeof service.position === 'number' &&
        typeof service.notifications === 'boolean' &&
        service.createdAt instanceof Date &&
        service.updatedAt instanceof Date &&
        typeof service.blockAds === 'boolean' &&
        typeof service.blockTrackers === 'boolean');
}
/**
 * Type guard to check if an object is a valid ServiceTheme
 *
 * @param obj - Object to validate
 * @returns True if object matches ServiceTheme interface
 */
function isServiceTheme(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const theme = obj;
    return ((theme.primaryColor === undefined || typeof theme.primaryColor === 'string') &&
        (theme.backgroundColor === undefined || typeof theme.backgroundColor === 'string') &&
        (theme.textColor === undefined || typeof theme.textColor === 'string'));
}
/**
 * Default theme configuration for services
 * Used as fallback when no custom theme is specified
 */
exports.DEFAULT_SERVICE_THEME = {
    primaryColor: '#3B82F6', // Blue-500
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937', // Gray-800
};
/**
 * Creates a new ServiceConfiguration with default values
 * Useful for service creation forms and templates
 *
 * @param partial - Partial service configuration
 * @returns Complete ServiceConfiguration with defaults applied
 */
function createServiceConfiguration(partial) {
    const now = new Date();
    return {
        id: generateUUID(),
        iconType: 'builtin',
        position: 0,
        sortOrder: 0,
        notifications: true,
        isActive: true,
        blockAds: true,
        blockTrackers: true,
        createdAt: now,
        updatedAt: now,
        ...partial,
    };
}
/**
 * Simple UUID generator for service IDs
 * In production, consider using a more robust UUID library
 *
 * @returns UUID v4 string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
//# sourceMappingURL=ServiceConfiguration.js.map