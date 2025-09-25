"use strict";
/**
 * Configuration Manager
 *
 * Manages application-level configuration, user preferences, and settings.
 * Handles configuration validation, secure storage, and configuration lifecycle.
 *
 * @fileoverview Central configuration management with validation and persistence
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = exports.DEFAULT_APP_CONFIGURATION = void 0;
const electron_store_1 = __importDefault(require("electron-store"));
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * Default application configuration
 */
exports.DEFAULT_APP_CONFIGURATION = {
    app: {
        autoStart: false,
        minimizeToTray: true,
        showNotifications: true,
        autoUpdate: true,
        language: 'en',
        theme: 'system',
        zoomLevel: 1.0,
    },
    security: {
        sessionTimeout: true,
        sessionTimeoutMinutes: 120,
        requireAuth: false,
        secureBrowsing: true,
        clearDataOnExit: false,
    },
    privacy: {
        telemetry: false,
        crashReporting: true,
        usageAnalytics: false,
        autoClearData: false,
        autoClearDays: 30,
    },
    window: {
        rememberBounds: true,
        defaultWidth: 1200,
        defaultHeight: 800,
        alwaysOnTop: false,
        showInTaskbar: true,
    },
    workspace: {
        rememberLastWorkspace: true,
        restoreServicesOnStartup: true,
        maxConcurrentServices: 10,
    },
    developer: {
        developerMode: false,
        showDebugInfo: false,
        verboseLogging: false,
        autoReload: false,
    },
};
/**
 * ConfigurationManager class for managing application configuration
 */
class ConfigurationManager {
    store;
    listeners;
    constructor() {
        // Initialize electron-store with schema validation
        this.store = new electron_store_1.default({
            name: 'app-config',
            defaults: exports.DEFAULT_APP_CONFIGURATION,
            schema: this.getConfigurationSchema(),
        });
        this.listeners = new Map();
    }
    /**
     * Get the complete configuration
     */
    getConfiguration() {
        return this.store.store;
    }
    /**
     * Get a specific configuration section
     */
    getConfigurationSection(section) {
        return this.store.get(section);
    }
    /**
     * Get a specific configuration value
     */
    getConfigurationValue(section, key) {
        const sectionConfig = this.store.get(section);
        return sectionConfig[key];
    }
    /**
     * Update configuration
     */
    async updateConfiguration(request) {
        try {
            // Validate the updates
            const validation = this.validateConfigurationUpdates(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Configuration validation failed: ${Object.values(validation.errors).flat().join(', ')}`,
                };
            }
            // Get current section configuration
            const currentSection = this.store.get(request.section);
            // Merge updates
            const updatedSection = {
                ...currentSection,
                ...request.updates,
            };
            // Apply the updates
            this.store.set(request.section, updatedSection);
            // Notify listeners
            this.notifyListeners();
            const result = {
                success: true,
                data: this.getConfiguration(),
            };
            if (Object.keys(validation.warnings).length > 0) {
                result.warnings = Object.values(validation.warnings).flat();
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Update multiple configuration sections at once
     */
    async updateMultipleConfigurations(updates) {
        try {
            // Validate all updates
            const allErrors = [];
            const allWarnings = [];
            for (const [section, sectionUpdates] of Object.entries(updates)) {
                const validation = this.validateConfigurationUpdates({
                    section: section,
                    updates: sectionUpdates,
                });
                if (!validation.valid) {
                    allErrors.push(...Object.values(validation.errors).flat());
                }
                allWarnings.push(...Object.values(validation.warnings).flat());
            }
            if (allErrors.length > 0) {
                return {
                    success: false,
                    error: `Configuration validation failed: ${allErrors.join(', ')}`,
                };
            }
            // Apply all updates
            for (const [section, sectionUpdates] of Object.entries(updates)) {
                const currentSection = this.store.get(section);
                const updatedSection = {
                    ...currentSection,
                    ...sectionUpdates,
                };
                this.store.set(section, updatedSection);
            }
            // Notify listeners
            this.notifyListeners();
            const result = {
                success: true,
                data: this.getConfiguration(),
            };
            if (allWarnings.length > 0) {
                result.warnings = allWarnings;
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update configurations: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Reset configuration to defaults
     */
    async resetConfiguration() {
        try {
            this.store.clear();
            this.notifyListeners();
            return {
                success: true,
                data: this.getConfiguration(),
                warnings: ['Configuration has been reset to default values'],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Reset a specific configuration section to defaults
     */
    async resetConfigurationSection(section) {
        try {
            const defaultSection = exports.DEFAULT_APP_CONFIGURATION[section];
            this.store.set(section, defaultSection);
            this.notifyListeners();
            return {
                success: true,
                data: this.getConfiguration(),
                warnings: [`${section} configuration has been reset to default values`],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reset ${section} configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Validate complete configuration
     */
    validateConfiguration(config = this.getConfiguration()) {
        const errors = {};
        const warnings = {};
        // Validate app section
        const appErrors = this.validateAppSection(config.app);
        if (appErrors.length > 0) {
            errors['app'] = appErrors;
        }
        // Validate security section
        const securityErrors = this.validateSecuritySection(config.security);
        if (securityErrors.length > 0) {
            errors['security'] = securityErrors;
        }
        // Validate privacy section
        const privacyErrors = this.validatePrivacySection(config.privacy);
        if (privacyErrors.length > 0) {
            errors['privacy'] = privacyErrors;
        }
        // Validate window section
        const windowErrors = this.validateWindowSection(config.window);
        if (windowErrors.length > 0) {
            errors['window'] = windowErrors;
        }
        // Validate workspace section
        const workspaceErrors = this.validateWorkspaceSection(config.workspace);
        if (workspaceErrors.length > 0) {
            errors['workspace'] = workspaceErrors;
        }
        // Validate developer section
        const developerErrors = this.validateDeveloperSection(config.developer);
        if (developerErrors.length > 0) {
            errors['developer'] = developerErrors;
        }
        // Add warnings for potentially problematic settings
        if (config.security.sessionTimeoutMinutes < 30) {
            if (!warnings['security'])
                warnings['security'] = [];
            warnings['security'].push('Session timeout less than 30 minutes may be too short');
        }
        if (config.workspace.maxConcurrentServices > 20) {
            if (!warnings['workspace'])
                warnings['workspace'] = [];
            warnings['workspace'].push('High concurrent service limit may impact performance');
        }
        return {
            valid: Object.keys(errors).length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Export configuration for backup
     */
    exportConfiguration() {
        return this.getConfiguration();
    }
    /**
     * Import configuration from backup
     */
    async importConfiguration(config, mergeStrategy = 'merge') {
        try {
            // Validate imported configuration
            const validation = this.validateConfiguration(config);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid configuration: ${Object.values(validation.errors).flat().join(', ')}`,
                };
            }
            if (mergeStrategy === 'replace') {
                // Replace entire configuration
                this.store.clear();
                this.store.store = config;
            }
            else {
                // Merge with existing configuration
                for (const [section, sectionConfig] of Object.entries(config)) {
                    const currentSection = this.store.get(section);
                    const mergedSection = {
                        ...currentSection,
                        ...sectionConfig,
                    };
                    this.store.set(section, mergedSection);
                }
            }
            // Notify listeners
            this.notifyListeners();
            const warnings = Object.keys(validation.warnings).length > 0
                ? Object.values(validation.warnings).flat()
                : ['Configuration imported successfully'];
            return {
                success: true,
                data: this.getConfiguration(),
                warnings,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Add configuration change listener
     */
    addListener(id, callback) {
        if (!this.listeners.has(id)) {
            this.listeners.set(id, []);
        }
        this.listeners.get(id).push(callback);
    }
    /**
     * Remove configuration change listener
     */
    removeListener(id, callback) {
        if (!this.listeners.has(id)) {
            return;
        }
        if (callback) {
            const callbacks = this.listeners.get(id);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
        else {
            this.listeners.delete(id);
        }
    }
    /**
     * Check if configuration has been modified from defaults
     */
    isConfigurationModified() {
        const current = this.getConfiguration();
        return JSON.stringify(current) !== JSON.stringify(exports.DEFAULT_APP_CONFIGURATION);
    }
    /**
     * Get configuration file path
     */
    getConfigurationPath() {
        return this.store.path;
    }
    // Private helper methods
    /**
     * Validate configuration updates
     */
    validateConfigurationUpdates(request) {
        const errors = {};
        const warnings = {};
        switch (request.section) {
            case 'app': {
                const appErrors = this.validateAppSection(request.updates);
                if (appErrors.length > 0) {
                    errors['app'] = appErrors;
                }
                break;
            }
            case 'security': {
                const securityErrors = this.validateSecuritySection(request.updates);
                if (securityErrors.length > 0) {
                    errors['security'] = securityErrors;
                }
                break;
            }
            case 'privacy': {
                const privacyErrors = this.validatePrivacySection(request.updates);
                if (privacyErrors.length > 0) {
                    errors['privacy'] = privacyErrors;
                }
                break;
            }
            case 'window': {
                const windowErrors = this.validateWindowSection(request.updates);
                if (windowErrors.length > 0) {
                    errors['window'] = windowErrors;
                }
                break;
            }
            case 'workspace': {
                const workspaceErrors = this.validateWorkspaceSection(request.updates);
                if (workspaceErrors.length > 0) {
                    errors['workspace'] = workspaceErrors;
                }
                break;
            }
            case 'developer': {
                const developerErrors = this.validateDeveloperSection(request.updates);
                if (developerErrors.length > 0) {
                    errors['developer'] = developerErrors;
                }
                break;
            }
        }
        return {
            valid: Object.keys(errors).length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate app configuration section
     */
    validateAppSection(app) {
        const errors = [];
        if (app.language !== undefined) {
            const languageValidation = InputValidator_1.InputValidator.validateText(app.language, {
                minLength: 2,
                maxLength: 5,
                pattern: /^[a-z]{2}(-[A-Z]{2})?$/,
            });
            if (!languageValidation.valid) {
                errors.push(`Invalid language code: ${languageValidation.error}`);
            }
        }
        if (app.theme !== undefined && !['light', 'dark', 'system'].includes(app.theme)) {
            errors.push('Theme must be one of: light, dark, system');
        }
        if (app.zoomLevel !== undefined && (app.zoomLevel < 0.5 || app.zoomLevel > 3.0)) {
            errors.push('Zoom level must be between 0.5 and 3.0');
        }
        return errors;
    }
    /**
     * Validate security configuration section
     */
    validateSecuritySection(security) {
        const errors = [];
        if (security.sessionTimeoutMinutes !== undefined) {
            if (security.sessionTimeoutMinutes < 5 || security.sessionTimeoutMinutes > 1440) {
                errors.push('Session timeout must be between 5 and 1440 minutes');
            }
        }
        return errors;
    }
    /**
     * Validate privacy configuration section
     */
    validatePrivacySection(privacy) {
        const errors = [];
        if (privacy.autoClearDays !== undefined) {
            if (privacy.autoClearDays < 1 || privacy.autoClearDays > 365) {
                errors.push('Auto-clear days must be between 1 and 365');
            }
        }
        return errors;
    }
    /**
     * Validate window configuration section
     */
    validateWindowSection(window) {
        const errors = [];
        if (window.defaultWidth !== undefined) {
            if (window.defaultWidth < 400 || window.defaultWidth > 4000) {
                errors.push('Default width must be between 400 and 4000 pixels');
            }
        }
        if (window.defaultHeight !== undefined) {
            if (window.defaultHeight < 300 || window.defaultHeight > 3000) {
                errors.push('Default height must be between 300 and 3000 pixels');
            }
        }
        return errors;
    }
    /**
     * Validate workspace configuration section
     */
    validateWorkspaceSection(workspace) {
        const errors = [];
        if (workspace.maxConcurrentServices !== undefined) {
            if (workspace.maxConcurrentServices < 1 || workspace.maxConcurrentServices > 50) {
                errors.push('Max concurrent services must be between 1 and 50');
            }
        }
        if (workspace.defaultWorkspaceId !== undefined && workspace.defaultWorkspaceId) {
            const uuidValidation = InputValidator_1.Validators.validateUUID(workspace.defaultWorkspaceId);
            if (!uuidValidation.valid) {
                errors.push(`Invalid default workspace ID: ${uuidValidation.error}`);
            }
        }
        return errors;
    }
    /**
     * Validate developer configuration section
     */
    validateDeveloperSection(_developer) {
        // Developer section typically has boolean flags that don't need complex validation
        return [];
    }
    /**
     * Get configuration schema for electron-store
     */
    getConfigurationSchema() {
        return {
            app: {
                type: 'object',
                properties: {
                    autoStart: { type: 'boolean' },
                    minimizeToTray: { type: 'boolean' },
                    showNotifications: { type: 'boolean' },
                    autoUpdate: { type: 'boolean' },
                    language: { type: 'string' },
                    theme: { type: 'string', enum: ['light', 'dark', 'system'] },
                    zoomLevel: { type: 'number', minimum: 0.5, maximum: 3.0 },
                },
            },
            security: {
                type: 'object',
                properties: {
                    sessionTimeout: { type: 'boolean' },
                    sessionTimeoutMinutes: { type: 'number', minimum: 5, maximum: 1440 },
                    requireAuth: { type: 'boolean' },
                    secureBrowsing: { type: 'boolean' },
                    clearDataOnExit: { type: 'boolean' },
                },
            },
            privacy: {
                type: 'object',
                properties: {
                    telemetry: { type: 'boolean' },
                    crashReporting: { type: 'boolean' },
                    usageAnalytics: { type: 'boolean' },
                    autoClearData: { type: 'boolean' },
                    autoClearDays: { type: 'number', minimum: 1, maximum: 365 },
                },
            },
            window: {
                type: 'object',
                properties: {
                    rememberBounds: { type: 'boolean' },
                    defaultWidth: { type: 'number', minimum: 400, maximum: 4000 },
                    defaultHeight: { type: 'number', minimum: 300, maximum: 3000 },
                    alwaysOnTop: { type: 'boolean' },
                    showInTaskbar: { type: 'boolean' },
                },
            },
            workspace: {
                type: 'object',
                properties: {
                    defaultWorkspaceId: { type: ['string', 'null'] },
                    rememberLastWorkspace: { type: 'boolean' },
                    restoreServicesOnStartup: { type: 'boolean' },
                    maxConcurrentServices: { type: 'number', minimum: 1, maximum: 50 },
                },
            },
            developer: {
                type: 'object',
                properties: {
                    developerMode: { type: 'boolean' },
                    showDebugInfo: { type: 'boolean' },
                    verboseLogging: { type: 'boolean' },
                    autoReload: { type: 'boolean' },
                },
            },
        };
    }
    /**
     * Notify all configuration change listeners
     */
    notifyListeners() {
        const config = this.getConfiguration();
        for (const callbacks of this.listeners.values()) {
            callbacks.forEach(callback => {
                try {
                    callback(config);
                }
                catch (error) {
                    // Silently handle listener errors to avoid disrupting other listeners
                    // In production, this would be logged to application logs
                }
            });
        }
    }
}
exports.ConfigurationManager = ConfigurationManager;
exports.default = ConfigurationManager;
//# sourceMappingURL=ConfigurationManager.js.map