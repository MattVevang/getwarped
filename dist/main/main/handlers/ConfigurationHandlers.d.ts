/**
 * Configuration IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for configuration-related operations.
 * Bridges renderer process requests to ConfigurationManager with proper validation,
 * error handling, and security considerations for export/import operations.
 *
 * @fileoverview IPC handlers for configuration operations (export, import, get, update)
 */
import { AppConfiguration } from '../services/ConfigurationManager';
/**
 * Configuration export request
 */
export interface ExportConfigurationRequest {
    /** Include all configuration sections */
    includeAll?: boolean;
    /** Specific sections to include */
    sections?: (keyof AppConfiguration)[];
    /** Export format */
    format?: 'json' | 'yaml';
    /** Include metadata */
    includeMetadata?: boolean;
}
/**
 * Configuration import request
 */
export interface ImportConfigurationRequest {
    /** Configuration data to import */
    configuration: AppConfiguration;
    /** Import strategy */
    mergeStrategy?: 'replace' | 'merge';
    /** Validate only without importing */
    validateOnly?: boolean;
    /** Skip validation warnings */
    skipWarnings?: boolean;
}
/**
 * Configuration section update request
 */
export interface UpdateConfigurationSectionRequest {
    /** Section to update */
    section: keyof AppConfiguration;
    /** Updates to apply */
    updates: Partial<AppConfiguration[keyof AppConfiguration]>;
}
/**
 * Configuration export metadata
 */
export interface ConfigurationExportMetadata {
    /** Export timestamp */
    exportedAt: string;
    /** Application version */
    appVersion: string;
    /** Configuration version */
    configVersion: string;
    /** Export checksum for integrity */
    checksum?: string;
    /** Export source */
    source: string;
}
/**
 * Configuration export data
 */
export interface ConfigurationExportData {
    /** Configuration data */
    configuration: AppConfiguration;
    /** Export metadata */
    metadata: ConfigurationExportMetadata;
}
/**
 * Standard IPC response interface for successful operations
 */
export interface IPCSuccessResponse<T> {
    success: true;
    data: T;
    warnings?: string[];
}
/**
 * Standard IPC response interface for failed operations
 */
export interface IPCErrorResponse {
    success: false;
    error: string;
    warnings?: string[];
}
/**
 * Union type for all IPC responses
 */
export type IPCResponse<T = any> = IPCSuccessResponse<T> | IPCErrorResponse;
/**
 * ConfigurationHandlers class for managing configuration-related IPC operations
 */
export declare class ConfigurationHandlers {
    private configurationManager;
    constructor();
    /**
     * Register all IPC handlers
     */
    private registerHandlers;
    /**
     * Handle getting complete configuration
     */
    private handleGetConfiguration;
    /**
     * Handle getting specific configuration section
     */
    private handleGetConfigurationSection;
    /**
     * Handle getting specific configuration value
     */
    private handleGetConfigurationValue;
    /**
     * Handle updating configuration
     */
    private handleUpdateConfiguration;
    /**
     * Handle updating configuration section
     */
    private handleUpdateConfigurationSection;
    /**
     * Handle updating multiple configurations
     */
    private handleUpdateMultipleConfigurations;
    /**
     * Handle resetting configuration to defaults
     */
    private handleResetConfiguration;
    /**
     * Handle resetting configuration section to defaults
     */
    private handleResetConfigurationSection;
    /**
     * Handle validating configuration
     */
    private handleValidateConfiguration;
    /**
     * Handle exporting configuration
     */
    private handleExportConfiguration;
    /**
     * Handle importing configuration
     */
    private handleImportConfiguration;
    /**
     * Handle checking if configuration is modified
     */
    private handleIsConfigurationModified;
    /**
     * Handle getting configuration file path
     */
    private handleGetConfigurationPath;
    /**
     * Handle adding configuration change listener
     */
    private handleAddConfigurationListener;
    /**
     * Handle removing configuration change listener
     */
    private handleRemoveConfigurationListener;
    /**
     * Validate configuration update request
     */
    private validateUpdateConfigurationRequest;
    /**
     * Validate configuration import request
     */
    private validateImportConfigurationRequest;
    /**
     * Check if section is a valid configuration section
     */
    private isValidConfigurationSection;
    /**
     * Generate checksum for configuration data
     */
    private generateConfigurationChecksum;
}
export default ConfigurationHandlers;
//# sourceMappingURL=ConfigurationHandlers.d.ts.map