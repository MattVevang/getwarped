/**
 * Configuration Exporter
 *
 * Handles secure export of application configuration data with credential stripping.
 * Generates JSON schema validation and ensures no sensitive data is included in exports.
 *
 * @fileoverview Secure configuration export with credential protection
 */
import { BrowserWindow } from 'electron';
import { ConfigurationManager, AppConfiguration } from './ConfigurationManager';
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
    /** Export source */
    source: string;
    /** Export format version */
    formatVersion: string;
    /** Security notice */
    securityNotice: string;
}
/**
 * Configuration export data structure
 */
export interface ConfigurationExportData {
    /** Export metadata */
    metadata: ConfigurationExportMetadata;
    /** Configuration data (sanitized) */
    configuration: AppConfiguration;
    /** Export warnings */
    warnings: string[];
}
/**
 * Export options
 */
export interface ExportOptions {
    /** Include all configuration sections */
    includeAll?: boolean;
    /** Specific sections to include */
    sections?: (keyof AppConfiguration)[];
    /** Export format */
    format?: 'json' | 'yaml';
    /** Include metadata */
    includeMetadata?: boolean;
    /** Export file path (if not provided, show dialog) */
    filePath?: string;
    /** Generate JSON schema */
    includeSchema?: boolean;
}
/**
 * Export result
 */
export interface ExportResult {
    /** Whether export succeeded */
    success: boolean;
    /** Path to exported file */
    filePath?: string;
    /** Export data */
    exportData?: ConfigurationExportData;
    /** Error message */
    error?: string;
    /** Export warnings */
    warnings?: string[];
}
/**
 * ConfigurationExporter class for secure configuration export
 */
export declare class ConfigurationExporter {
    private configurationManager;
    private ajv;
    private readonly appVersion;
    private readonly configVersion;
    private readonly formatVersion;
    constructor(configurationManager: ConfigurationManager);
    /**
     * Export configuration to file with dialog
     */
    exportConfiguration(parentWindow?: BrowserWindow, options?: ExportOptions): Promise<ExportResult>;
    /**
     * Generate export data without writing to file
     */
    generateExportData(options?: ExportOptions): Promise<ExportResult>;
    /**
     * Generate JSON schema for configuration
     */
    getConfigurationSchema(): object;
    /**
     * Validate configuration against schema
     */
    validateConfiguration(configuration: AppConfiguration): {
        valid: boolean;
        errors?: string[];
    };
    /**
     * Get export file path via dialog
     */
    private getExportFilePath;
    /**
     * Sanitize configuration by removing sensitive data
     */
    private sanitizeConfiguration;
    /**
     * Write export data to file
     */
    private writeExportFile;
    /**
     * Validate export data structure
     */
    private validateExportData;
}
export default ConfigurationExporter;
//# sourceMappingURL=ConfigurationExporter.d.ts.map