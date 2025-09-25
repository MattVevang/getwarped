"use strict";
/**
 * Configuration Exporter
 *
 * Handles secure export of application configuration data with credential stripping.
 * Generates JSON schema validation and ensures no sensitive data is included in exports.
 *
 * @fileoverview Secure configuration export with credential protection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationExporter = void 0;
const ajv_1 = __importDefault(require("ajv"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const electron_1 = require("electron");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
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
                zoomLevel: { type: 'number', minimum: 0.5, maximum: 3.0 },
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
                sessionTimeoutMinutes: { type: 'number', minimum: 1, maximum: 1440 },
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
                autoClearDays: { type: 'number', minimum: 1, maximum: 365 },
            },
            required: ['telemetry', 'crashReporting', 'usageAnalytics', 'autoClearData', 'autoClearDays'],
            additionalProperties: false,
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
            required: ['rememberBounds', 'defaultWidth', 'defaultHeight', 'alwaysOnTop', 'showInTaskbar'],
            additionalProperties: false,
        },
        workspace: {
            type: 'object',
            properties: {
                defaultWorkspaceId: { type: 'string', nullable: true },
                rememberLastWorkspace: { type: 'boolean' },
                restoreServicesOnStartup: { type: 'boolean' },
                maxConcurrentServices: { type: 'number', minimum: 1, maximum: 50 },
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
 * ConfigurationExporter class for secure configuration export
 */
class ConfigurationExporter {
    configurationManager;
    ajv;
    appVersion = '1.0.0'; // This should come from package.json
    configVersion = '1.0';
    formatVersion = '1.0';
    constructor(configurationManager) {
        this.configurationManager = configurationManager;
        // Initialize AJV with formats
        this.ajv = new ajv_1.default({ allErrors: true });
        (0, ajv_formats_1.default)(this.ajv);
        // Add configuration schema
        this.ajv.addSchema(CONFIGURATION_SCHEMA, 'configuration');
    }
    /**
     * Export configuration to file with dialog
     */
    async exportConfiguration(parentWindow, options = {}) {
        try {
            // Get export file path
            const filePath = await this.getExportFilePath(parentWindow, options);
            if (!filePath) {
                return { success: false, error: 'Export cancelled by user' };
            }
            // Generate export data
            const exportResult = await this.generateExportData(options);
            if (!exportResult.success) {
                return exportResult;
            }
            // Write to file
            const writeResult = await this.writeExportFile(filePath, exportResult.exportData, options);
            if (!writeResult.success) {
                return writeResult;
            }
            const result = {
                success: true,
                filePath,
            };
            if (exportResult.exportData) {
                result.exportData = exportResult.exportData;
            }
            if (exportResult.warnings) {
                result.warnings = exportResult.warnings;
            }
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown export error',
            };
        }
    }
    /**
     * Generate export data without writing to file
     */
    async generateExportData(options = {}) {
        try {
            const warnings = [];
            // Get current configuration
            const currentConfig = await this.configurationManager.getConfiguration();
            // Sanitize configuration (remove sensitive data)
            const sanitizedConfig = this.sanitizeConfiguration(currentConfig, options.sections, warnings);
            // Generate metadata
            const metadata = {
                exportedAt: new Date().toISOString(),
                appVersion: this.appVersion,
                configVersion: this.configVersion,
                source: 'GetWarped Configuration Manager',
                formatVersion: this.formatVersion,
                securityNotice: 'This export contains NO credentials or sensitive authentication data. Re-authentication will be required after import.',
            };
            // Create export data
            const exportData = {
                metadata: options.includeMetadata !== false ? metadata : {},
                configuration: sanitizedConfig,
                warnings,
            };
            // Validate export data
            const validationResult = this.validateExportData(exportData);
            if (!validationResult.success) {
                const errorResult = {
                    success: false,
                    error: 'Export validation failed: ' + validationResult.error,
                };
                if (validationResult.warnings) {
                    errorResult.warnings = validationResult.warnings;
                }
                return errorResult;
            }
            return {
                success: true,
                exportData,
                warnings,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate export data',
            };
        }
    }
    /**
     * Generate JSON schema for configuration
     */
    getConfigurationSchema() {
        return CONFIGURATION_SCHEMA;
    }
    /**
     * Validate configuration against schema
     */
    validateConfiguration(configuration) {
        const validate = this.ajv.getSchema('configuration');
        if (!validate) {
            return { valid: false, errors: ['Schema not found'] };
        }
        const valid = validate(configuration);
        if (!valid) {
            const errors = validate.errors?.map(error => {
                const path = error.instancePath || error.schemaPath;
                return `${path}: ${error.message}`;
            }) || ['Unknown validation error'];
            return { valid: false, errors };
        }
        return { valid: true };
    }
    /**
     * Get export file path via dialog
     */
    async getExportFilePath(parentWindow, options = {}) {
        if (options.filePath) {
            return options.filePath;
        }
        const dialogOptions = {
            title: 'Export Configuration',
            defaultPath: `getwarped-config-${new Date().toISOString().split('T')[0]}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] },
            ],
            properties: ['createDirectory'],
        };
        const result = parentWindow
            ? await electron_1.dialog.showSaveDialog(parentWindow, dialogOptions)
            : await electron_1.dialog.showSaveDialog(dialogOptions);
        return result.canceled ? null : result.filePath || null;
    }
    /**
     * Sanitize configuration by removing sensitive data
     */
    sanitizeConfiguration(config, sections, warnings) {
        // Deep clone the configuration
        const sanitized = JSON.parse(JSON.stringify(config));
        // Filter sections if specified
        if (sections && sections.length > 0) {
            const result = { ...sanitized };
            // Reset all sections first
            const allKeys = Object.keys(result);
            for (const key of allKeys) {
                if (!sections.includes(key)) {
                    delete result[key];
                }
            }
            return result;
        }
        // Remove potentially sensitive workspace data
        if (sanitized.workspace.defaultWorkspaceId) {
            warnings?.push('Default workspace ID has been preserved but may need reconfiguration after import');
        }
        // Add security notice for settings that may affect security
        if (sanitized.security.requireAuth) {
            warnings?.push('Authentication requirement setting preserved - ensure proper setup after import');
        }
        if (sanitized.developer.developerMode) {
            warnings?.push('Developer mode is enabled - review security implications after import');
        }
        return sanitized;
    }
    /**
     * Write export data to file
     */
    async writeExportFile(filePath, exportData, options = {}) {
        try {
            // Validate file path
            const pathValidation = InputValidator_1.InputValidator.validateFilePath(filePath);
            if (!pathValidation.valid) {
                return { success: false, error: 'Invalid export file path' };
            }
            // Ensure directory exists
            const directory = path.dirname(filePath);
            await fs.mkdir(directory, { recursive: true });
            // Format data based on options
            let content;
            if (options.format === 'yaml') {
                // For now, only support JSON
                return { success: false, error: 'YAML format not yet supported' };
            }
            else {
                content = JSON.stringify(exportData, null, 2);
            }
            // Write file
            await fs.writeFile(filePath, content, 'utf8');
            // Write schema file if requested
            if (options.includeSchema) {
                const schemaPath = filePath.replace(/\.json$/, '-schema.json');
                const schemaContent = JSON.stringify(this.getConfigurationSchema(), null, 2);
                await fs.writeFile(schemaPath, schemaContent, 'utf8');
            }
            return { success: true, filePath };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to write export file',
            };
        }
    }
    /**
     * Validate export data structure
     */
    validateExportData(exportData) {
        try {
            // Validate configuration structure
            const configValidation = this.validateConfiguration(exportData.configuration);
            if (!configValidation.valid) {
                return {
                    success: false,
                    error: 'Configuration validation failed: ' + configValidation.errors?.join(', '),
                };
            }
            // Validate metadata structure
            if (exportData.metadata && Object.keys(exportData.metadata).length > 0) {
                const requiredMetadataFields = ['exportedAt', 'appVersion', 'configVersion', 'source'];
                const missingFields = requiredMetadataFields.filter(field => !exportData.metadata[field]);
                if (missingFields.length > 0) {
                    return {
                        success: false,
                        error: `Missing required metadata fields: ${missingFields.join(', ')}`,
                    };
                }
            }
            return { success: true, warnings: exportData.warnings };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Export data validation failed',
            };
        }
    }
}
exports.ConfigurationExporter = ConfigurationExporter;
exports.default = ConfigurationExporter;
//# sourceMappingURL=ConfigurationExporter.js.map