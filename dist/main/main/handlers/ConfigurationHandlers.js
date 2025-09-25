"use strict";
/**
 * Configuration IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for configuration-related operations.
 * Bridges renderer process requests to ConfigurationManager with proper validation,
 * error handling, and security considerations for export/import operations.
 *
 * @fileoverview IPC handlers for configuration operations (export, import, get, update)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationHandlers = void 0;
const electron_1 = require("electron");
const ConfigurationManager_1 = require("../services/ConfigurationManager");
/**
 * ConfigurationHandlers class for managing configuration-related IPC operations
 */
class ConfigurationHandlers {
    configurationManager;
    constructor() {
        this.configurationManager = new ConfigurationManager_1.ConfigurationManager();
        this.registerHandlers();
    }
    /**
     * Register all IPC handlers
     */
    registerHandlers() {
        // Get complete configuration
        electron_1.ipcMain.handle('config:get', this.handleGetConfiguration.bind(this));
        // Get specific configuration section
        electron_1.ipcMain.handle('config:getSection', this.handleGetConfigurationSection.bind(this));
        // Get specific configuration value
        electron_1.ipcMain.handle('config:getValue', this.handleGetConfigurationValue.bind(this));
        // Update configuration
        electron_1.ipcMain.handle('config:update', this.handleUpdateConfiguration.bind(this));
        // Update configuration section
        electron_1.ipcMain.handle('config:updateSection', this.handleUpdateConfigurationSection.bind(this));
        // Update multiple configurations
        electron_1.ipcMain.handle('config:updateMultiple', this.handleUpdateMultipleConfigurations.bind(this));
        // Reset configuration to defaults
        electron_1.ipcMain.handle('config:reset', this.handleResetConfiguration.bind(this));
        // Reset specific section to defaults
        electron_1.ipcMain.handle('config:resetSection', this.handleResetConfigurationSection.bind(this));
        // Validate configuration
        electron_1.ipcMain.handle('config:validate', this.handleValidateConfiguration.bind(this));
        // Export configuration
        electron_1.ipcMain.handle('config:export', this.handleExportConfiguration.bind(this));
        // Import configuration
        electron_1.ipcMain.handle('config:import', this.handleImportConfiguration.bind(this));
        // Check if configuration is modified
        electron_1.ipcMain.handle('config:isModified', this.handleIsConfigurationModified.bind(this));
        // Get configuration file path
        electron_1.ipcMain.handle('config:getPath', this.handleGetConfigurationPath.bind(this));
        // Add configuration change listener
        electron_1.ipcMain.handle('config:addListener', this.handleAddConfigurationListener.bind(this));
        // Remove configuration change listener
        electron_1.ipcMain.handle('config:removeListener', this.handleRemoveConfigurationListener.bind(this));
    }
    /**
     * Handle getting complete configuration
     */
    async handleGetConfiguration(_event) {
        try {
            const configuration = this.configurationManager.getConfiguration();
            return {
                success: true,
                data: configuration,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle getting specific configuration section
     */
    async handleGetConfigurationSection(_event, section) {
        try {
            // Validate section parameter
            if (!section) {
                return {
                    success: false,
                    error: 'Configuration section is required',
                };
            }
            if (!this.isValidConfigurationSection(section)) {
                return {
                    success: false,
                    error: `Invalid configuration section: ${section}`,
                };
            }
            const sectionData = this.configurationManager.getConfigurationSection(section);
            return {
                success: true,
                data: sectionData,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get configuration section: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle getting specific configuration value
     */
    async handleGetConfigurationValue(_event, section, key) {
        try {
            // Validate parameters
            if (!section) {
                return {
                    success: false,
                    error: 'Configuration section is required',
                };
            }
            if (!key) {
                return {
                    success: false,
                    error: 'Configuration key is required',
                };
            }
            if (!this.isValidConfigurationSection(section)) {
                return {
                    success: false,
                    error: `Invalid configuration section: ${section}`,
                };
            }
            // Get the section configuration and extract the key value
            const sectionConfig = this.configurationManager.getConfigurationSection(section);
            const value = sectionConfig[key];
            return {
                success: true,
                data: value,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get configuration value: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle updating configuration
     */
    async handleUpdateConfiguration(_event, request) {
        try {
            // Validate request
            const validation = this.validateUpdateConfigurationRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid configuration update request',
                };
            }
            const result = await this.configurationManager.updateConfiguration(request);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to update configuration',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle updating configuration section
     */
    async handleUpdateConfigurationSection(_event, request) {
        try {
            // Convert to ConfigurationUpdateRequest format
            const updateRequest = {
                section: request.section,
                updates: request.updates,
            };
            return await this.handleUpdateConfiguration(_event, updateRequest);
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update configuration section: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle updating multiple configurations
     */
    async handleUpdateMultipleConfigurations(_event, updates) {
        try {
            // Validate updates
            if (!updates || Object.keys(updates).length === 0) {
                return {
                    success: false,
                    error: 'Configuration updates are required',
                };
            }
            const result = await this.configurationManager.updateMultipleConfigurations(updates);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to update configurations',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to update multiple configurations: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle resetting configuration to defaults
     */
    async handleResetConfiguration(_event) {
        try {
            const result = await this.configurationManager.resetConfiguration();
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to reset configuration',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle resetting configuration section to defaults
     */
    async handleResetConfigurationSection(_event, section) {
        try {
            // Validate section parameter
            if (!section) {
                return {
                    success: false,
                    error: 'Configuration section is required',
                };
            }
            if (!this.isValidConfigurationSection(section)) {
                return {
                    success: false,
                    error: `Invalid configuration section: ${section}`,
                };
            }
            const result = await this.configurationManager.resetConfigurationSection(section);
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to reset configuration section',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to reset configuration section: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle validating configuration
     */
    async handleValidateConfiguration(_event, config) {
        try {
            const validation = this.configurationManager.validateConfiguration(config);
            return {
                success: true,
                data: validation,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to validate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle exporting configuration
     */
    async handleExportConfiguration(_event, request = {}) {
        try {
            // Get configuration data
            let configurationToExport;
            if (request.sections && request.sections.length > 0) {
                // Export only specified sections
                const fullConfig = this.configurationManager.exportConfiguration();
                configurationToExport = {};
                for (const section of request.sections) {
                    if (this.isValidConfigurationSection(section)) {
                        configurationToExport[section] = fullConfig[section];
                    }
                }
            }
            else {
                // Export all configuration
                configurationToExport = this.configurationManager.exportConfiguration();
            }
            // Create export metadata
            const metadata = {
                exportedAt: new Date().toISOString(),
                appVersion: process.env['APP_VERSION'] || '1.0.0',
                configVersion: '1.0.0',
                source: 'GetWarped Application',
                ...(request.includeMetadata && {
                    checksum: this.generateConfigurationChecksum(configurationToExport),
                }),
            };
            const exportData = {
                configuration: configurationToExport,
                metadata,
            };
            return {
                success: true,
                data: exportData,
                warnings: [
                    'Configuration exported successfully. Note: No sensitive data is included in exports.',
                ],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to export configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle importing configuration
     */
    async handleImportConfiguration(_event, request) {
        try {
            // Validate import request
            const validation = this.validateImportConfigurationRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error || 'Invalid configuration import request',
                };
            }
            // If validate only, just validate and return
            if (request.validateOnly) {
                const configValidation = this.configurationManager.validateConfiguration(request.configuration);
                if (!configValidation.valid) {
                    return {
                        success: false,
                        error: `Configuration validation failed: ${Object.values(configValidation.errors).flat().join(', ')}`,
                    };
                }
                return {
                    success: true,
                    data: request.configuration,
                    warnings: ['Configuration validation passed. Ready for import.'],
                };
            }
            // Import configuration
            const result = await this.configurationManager.importConfiguration(request.configuration, request.mergeStrategy || 'merge');
            if (result.success && result.data) {
                return {
                    success: true,
                    data: result.data,
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
            else {
                return {
                    success: false,
                    error: result.error || 'Failed to import configuration',
                    ...(result.warnings && { warnings: result.warnings }),
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle checking if configuration is modified
     */
    async handleIsConfigurationModified(_event) {
        try {
            const isModified = this.configurationManager.isConfigurationModified();
            return {
                success: true,
                data: isModified,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to check configuration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle getting configuration file path
     */
    async handleGetConfigurationPath(_event) {
        try {
            const configPath = this.configurationManager.getConfigurationPath();
            return {
                success: true,
                data: configPath,
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get configuration path: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle adding configuration change listener
     */
    async handleAddConfigurationListener(_event, listenerId) {
        try {
            // Validate listener ID
            if (!listenerId?.trim()) {
                return {
                    success: false,
                    error: 'Listener ID is required',
                };
            }
            // Add listener that sends IPC message to renderer
            this.configurationManager.addListener(listenerId, (config) => {
                // Send configuration change event to renderer process
                _event.sender.send('config:changed', { listenerId, configuration: config });
            });
            return {
                success: true,
                data: undefined,
                warnings: [`Configuration listener '${listenerId}' added successfully`],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to add configuration listener: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Handle removing configuration change listener
     */
    async handleRemoveConfigurationListener(_event, listenerId) {
        try {
            // Validate listener ID
            if (!listenerId?.trim()) {
                return {
                    success: false,
                    error: 'Listener ID is required',
                };
            }
            this.configurationManager.removeListener(listenerId);
            return {
                success: true,
                data: undefined,
                warnings: [`Configuration listener '${listenerId}' removed successfully`],
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to remove configuration listener: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    // Private validation and helper methods
    /**
     * Validate configuration update request
     */
    validateUpdateConfigurationRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!request.section) {
            return { valid: false, error: 'Configuration section is required' };
        }
        if (!this.isValidConfigurationSection(request.section)) {
            return { valid: false, error: `Invalid configuration section: ${request.section}` };
        }
        if (!request.updates || Object.keys(request.updates).length === 0) {
            return { valid: false, error: 'Configuration updates are required' };
        }
        return { valid: true };
    }
    /**
     * Validate configuration import request
     */
    validateImportConfigurationRequest(request) {
        if (!request) {
            return { valid: false, error: 'Request is required' };
        }
        if (!request.configuration) {
            return { valid: false, error: 'Configuration data is required' };
        }
        if (typeof request.configuration !== 'object') {
            return { valid: false, error: 'Configuration must be an object' };
        }
        if (request.mergeStrategy && !['replace', 'merge'].includes(request.mergeStrategy)) {
            return { valid: false, error: 'Invalid merge strategy. Must be "replace" or "merge"' };
        }
        return { valid: true };
    }
    /**
     * Check if section is a valid configuration section
     */
    isValidConfigurationSection(section) {
        const validSections = [
            'app',
            'security',
            'privacy',
            'window',
            'workspace',
            'developer',
        ];
        return validSections.includes(section);
    }
    /**
     * Generate checksum for configuration data
     */
    generateConfigurationChecksum(config) {
        const crypto = require('crypto');
        const configString = JSON.stringify(config, Object.keys(config).sort());
        return crypto.createHash('sha256').update(configString).digest('hex');
    }
}
exports.ConfigurationHandlers = ConfigurationHandlers;
exports.default = ConfigurationHandlers;
//# sourceMappingURL=ConfigurationHandlers.js.map