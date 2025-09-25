"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationImporter = void 0;
const fs_1 = require("fs");
const electron_1 = require("electron");
const ajv_1 = __importDefault(require("ajv"));
const InputValidator_1 = require("../../shared/validation/InputValidator");
/**
 * Configuration schema for validation
 */
const CONFIGURATION_SCHEMA = {
    type: 'object',
    properties: {
        app: {
            type: 'object',
            properties: {
                autoStart: { type: 'boolean' },
                minimizeToTray: { type: 'boolean' },
                showNotifications: { type: 'boolean' },
                autoUpdate: { type: 'boolean' },
                language: { type: 'string' },
                theme: { type: 'string', enum: ['light', 'dark', 'system'] },
                zoomLevel: { type: 'number' },
            },
            required: [
                'autoStart',
                'minimizeToTray',
                'showNotifications',
                'autoUpdate',
                'language',
                'theme',
                'zoomLevel',
            ],
            additionalProperties: false,
        },
        security: {
            type: 'object',
            properties: {
                sessionTimeout: { type: 'boolean' },
                sessionTimeoutMinutes: { type: 'number', minimum: 1 },
                requireAuth: { type: 'boolean' },
                secureBrowsing: { type: 'boolean' },
                clearDataOnExit: { type: 'boolean' },
            },
            required: [
                'sessionTimeout',
                'sessionTimeoutMinutes',
                'requireAuth',
                'secureBrowsing',
                'clearDataOnExit',
            ],
            additionalProperties: false,
        },
        privacy: {
            type: 'object',
            properties: {
                telemetry: { type: 'boolean' },
                crashReporting: { type: 'boolean' },
                usageAnalytics: { type: 'boolean' },
                autoClearData: { type: 'boolean' },
                autoClearDays: { type: 'number', minimum: 1 },
            },
            required: ['telemetry', 'crashReporting', 'usageAnalytics', 'autoClearData', 'autoClearDays'],
            additionalProperties: false,
        },
        window: {
            type: 'object',
            properties: {
                rememberBounds: { type: 'boolean' },
                defaultWidth: { type: 'number', minimum: 100 },
                defaultHeight: { type: 'number', minimum: 100 },
                alwaysOnTop: { type: 'boolean' },
                showInTaskbar: { type: 'boolean' },
            },
            required: ['rememberBounds', 'defaultWidth', 'defaultHeight', 'alwaysOnTop', 'showInTaskbar'],
            additionalProperties: false,
        },
        workspace: {
            type: 'object',
            properties: {
                defaultWorkspaceId: { type: 'string', nullable: true },
                rememberLastWorkspace: { type: 'boolean' },
                restoreServicesOnStartup: { type: 'boolean' },
                maxConcurrentServices: { type: 'number', minimum: 1 },
            },
            required: ['rememberLastWorkspace', 'restoreServicesOnStartup', 'maxConcurrentServices'],
            additionalProperties: false,
        },
        developer: {
            type: 'object',
            properties: {
                developerMode: { type: 'boolean' },
                showDebugInfo: { type: 'boolean' },
                verboseLogging: { type: 'boolean' },
                autoReload: { type: 'boolean' },
            },
            required: ['developerMode', 'showDebugInfo', 'verboseLogging', 'autoReload'],
            additionalProperties: false,
        },
    },
    required: ['app', 'security', 'privacy', 'window', 'workspace', 'developer'],
    additionalProperties: false,
};
/**
 * Configuration import service
 * Handles secure import of application configuration with validation and migration
 */
class ConfigurationImporter {
    configurationManager;
    appVersion;
    configVersion;
    ajv;
    constructor(configurationManager, appVersion = '1.0.0', configVersion = '1.0.0') {
        this.configurationManager = configurationManager;
        this.appVersion = appVersion;
        this.configVersion = configVersion;
        // Initialize JSON schema validator
        this.ajv = new ajv_1.default({
            strict: true,
            allErrors: true,
            removeAdditional: true,
            useDefaults: true,
        });
    }
    /**
     * Import configuration from file with dialog
     */
    async importConfiguration(parentWindow, options = {}) {
        try {
            // Get import file path
            const filePath = await this.getImportFilePath(parentWindow, options);
            if (!filePath) {
                return { success: false, error: 'Import cancelled by user' };
            }
            // Read and parse import data
            const readResult = await this.readImportFile(filePath, options);
            if (!readResult.success) {
                return readResult;
            }
            // Create backup if requested
            let backupPath;
            if (options.backup) {
                const backupResult = await this.createConfigurationBackup();
                if (!backupResult.success) {
                    // Backup failed but continue with import - not critical
                }
                else {
                    backupPath = backupResult.backupPath;
                }
            }
            // Apply configuration
            const applyResult = await this.applyConfiguration(readResult.importData, options);
            if (!applyResult.success) {
                return applyResult;
            }
            const result = {
                success: true,
            };
            if (readResult.importData) {
                result.importData = readResult.importData;
            }
            if (readResult.warnings) {
                result.warnings = readResult.warnings;
            }
            if (backupPath) {
                result.backupPath = backupPath;
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import configuration',
            };
        }
    }
    /**
     * Read and validate import file
     */
    async readImportFile(filePath, options = {}) {
        try {
            const warnings = [];
            // Validate file path
            const pathValidation = InputValidator_1.InputValidator.validateFilePath(filePath);
            if (!pathValidation.valid) {
                return {
                    success: false,
                    error: 'Invalid file path: ' + pathValidation.error,
                };
            }
            // Read file
            const fileContent = await fs_1.promises.readFile(filePath, 'utf8');
            // Parse JSON
            let importData;
            try {
                importData = JSON.parse(fileContent);
            }
            catch (parseError) {
                return {
                    success: false,
                    error: 'Invalid JSON format: ' +
                        (parseError instanceof Error ? parseError.message : 'Parse error'),
                };
            }
            // Validate data structure
            if (options.validate !== false) {
                const validation = this.validateImportData(importData);
                if (!validation.valid) {
                    const errorResult = {
                        success: false,
                        error: 'Import validation failed: ' +
                            (validation.errors?.join(', ') || 'Unknown validation error'),
                    };
                    if (validation.warnings) {
                        errorResult.warnings = validation.warnings;
                    }
                    return errorResult;
                }
                if (validation.warnings) {
                    warnings.push(...validation.warnings);
                }
            }
            // Check for security warnings
            const securityWarnings = this.generateSecurityWarnings(importData);
            if (securityWarnings.length > 0) {
                warnings.push(...securityWarnings);
            }
            // Filter sections if requested
            if (options.sections && options.sections.length > 0) {
                importData.configuration = this.filterConfigurationSections(importData.configuration, options.sections);
            }
            const result = {
                success: true,
                importData,
            };
            if (warnings.length > 0) {
                result.warnings = warnings;
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to read import file',
            };
        }
    }
    /**
     * Apply imported configuration
     */
    async applyConfiguration(importData, options = {}) {
        try {
            const mergeStrategy = options.merge ? 'merge' : 'replace';
            const result = await this.configurationManager.importConfiguration(importData.configuration, mergeStrategy);
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Configuration import failed',
                };
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to apply configuration',
            };
        }
    }
    /**
     * Get import file path via dialog
     */
    async getImportFilePath(parentWindow, options = {}) {
        if (options.filePath) {
            return options.filePath;
        }
        const dialogOptions = {
            title: 'Import Configuration',
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] },
            ],
            properties: ['openFile'],
        };
        const result = parentWindow
            ? await electron_1.dialog.showOpenDialog(parentWindow, dialogOptions)
            : await electron_1.dialog.showOpenDialog(dialogOptions);
        return result.canceled ? null : result.filePaths[0] || null;
    }
    /**
     * Validate import data structure
     */
    validateImportData(importData) {
        const warnings = [];
        const errors = [];
        try {
            // Check basic structure
            if (!importData || typeof importData !== 'object') {
                return {
                    valid: false,
                    errors: ['Import data is not a valid object'],
                };
            }
            if (!importData.configuration) {
                return {
                    valid: false,
                    errors: ['Import data does not contain configuration'],
                };
            }
            // Validate configuration structure with JSON schema
            const validate = this.ajv.compile(CONFIGURATION_SCHEMA);
            const valid = validate(importData.configuration);
            if (!valid) {
                const schemaErrors = validate.errors?.map(error => {
                    const path = error.instancePath || error.schemaPath;
                    return `${path}: ${error.message}`;
                }) || ['Unknown validation error'];
                errors.push(...schemaErrors);
            }
            // Check metadata warnings
            if (importData.metadata) {
                if (importData.metadata.credentialsStripped) {
                    warnings.push('Credentials were stripped during export - you will need to re-authenticate services');
                }
                if (importData.metadata.appVersion && importData.metadata.appVersion !== this.appVersion) {
                    warnings.push(`Configuration was exported from app version ${importData.metadata.appVersion}, current version is ${this.appVersion}`);
                }
                if (importData.metadata.configVersion &&
                    importData.metadata.configVersion !== this.configVersion) {
                    warnings.push(`Configuration format version mismatch: exported ${importData.metadata.configVersion}, current ${this.configVersion}`);
                }
            }
            const result = {
                valid: errors.length === 0,
            };
            if (errors.length > 0) {
                result.errors = errors;
            }
            if (warnings.length > 0) {
                result.warnings = warnings;
            }
            return result;
        }
        catch (error) {
            return {
                valid: false,
                errors: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')],
            };
        }
    }
    /**
     * Generate security warnings for imported data
     */
    generateSecurityWarnings(importData) {
        const warnings = [];
        // Check if credentials were stripped
        if (importData.metadata?.credentialsStripped) {
            warnings.push('⚠️ Security Notice: All stored credentials were removed during export for security');
            warnings.push('You will need to re-authenticate all services after import');
        }
        // Check for potentially sensitive configuration changes
        const sensitiveSettings = [
            'security.requireAuth',
            'security.secureBrowsing',
            'security.clearDataOnExit',
            'browser.enableWebSecurity',
            'browser.enableDevTools',
        ];
        for (const setting of sensitiveSettings) {
            const [section, key] = setting.split('.');
            if (!section || !key)
                continue;
            const sectionData = importData.configuration[section];
            if (sectionData && typeof sectionData === 'object' && key in sectionData) {
                if (typeof sectionData[key] === 'boolean' && !sectionData[key]) {
                    warnings.push(`⚠️ Security Setting: ${setting} is disabled in imported configuration`);
                }
            }
        }
        return warnings;
    }
    /**
     * Filter configuration to only include specified sections
     */
    filterConfigurationSections(config, sections) {
        const filtered = {};
        for (const section of sections) {
            if (config[section]) {
                filtered[section] = config[section];
            }
        }
        return filtered;
    }
    /**
     * Create backup of current configuration
     */
    async createConfigurationBackup() {
        try {
            const currentConfig = await this.configurationManager.getConfiguration();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `getwarped-config-backup-${timestamp}.json`;
            const backupData = {
                configuration: currentConfig,
                metadata: {
                    backedUpAt: new Date().toISOString(),
                    appVersion: this.appVersion,
                    configVersion: this.configVersion,
                    source: 'GetWarped Configuration Manager (Backup)',
                },
            };
            await fs_1.promises.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
            return { success: true, backupPath };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create backup',
            };
        }
    }
    /**
     * Get configuration schema for validation
     */
    getConfigurationSchema() {
        return CONFIGURATION_SCHEMA;
    }
}
exports.ConfigurationImporter = ConfigurationImporter;
//# sourceMappingURL=ConfigurationImporter.js.map