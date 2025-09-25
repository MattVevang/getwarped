import { BrowserWindow } from 'electron';
import { ConfigurationManager, AppConfiguration } from './ConfigurationManager';
/**
 * Configuration import data structure
 */
export interface ConfigurationImportData {
    /** Application configuration data */
    configuration: AppConfiguration;
    /** Import metadata */
    metadata?: {
        exportedAt?: string;
        appVersion?: string;
        configVersion?: string;
        source?: string;
        formatVersion?: string;
        credentialsStripped?: boolean;
    };
}
/**
 * Import options
 */
export interface ImportOptions {
    /** File path (if not provided, dialog will be shown) */
    filePath?: string;
    /** Configuration sections to import */
    sections?: (keyof AppConfiguration)[];
    /** Whether to merge with existing configuration */
    merge?: boolean;
    /** Whether to backup current configuration before import */
    backup?: boolean;
    /** Whether to validate imported data */
    validate?: boolean;
}
/**
 * Import result
 */
export interface ImportResult {
    /** Whether import succeeded */
    success: boolean;
    /** Import data */
    importData?: ConfigurationImportData;
    /** Error message */
    error?: string;
    /** Import warnings */
    warnings?: string[];
    /** Backup file path (if backup was created) */
    backupPath?: string;
}
/**
 * Configuration import service
 * Handles secure import of application configuration with validation and migration
 */
export declare class ConfigurationImporter {
    private readonly configurationManager;
    private readonly appVersion;
    private readonly configVersion;
    private readonly ajv;
    constructor(configurationManager: ConfigurationManager, appVersion?: string, configVersion?: string);
    /**
     * Import configuration from file with dialog
     */
    importConfiguration(parentWindow?: BrowserWindow, options?: ImportOptions): Promise<ImportResult>;
    /**
     * Read and validate import file
     */
    readImportFile(filePath: string, options?: ImportOptions): Promise<ImportResult>;
    /**
     * Apply imported configuration
     */
    private applyConfiguration;
    /**
     * Get import file path via dialog
     */
    private getImportFilePath;
    /**
     * Validate import data structure
     */
    private validateImportData;
    /**
     * Generate security warnings for imported data
     */
    private generateSecurityWarnings;
    /**
     * Filter configuration to only include specified sections
     */
    private filterConfigurationSections;
    /**
     * Create backup of current configuration
     */
    private createConfigurationBackup;
    /**
     * Get configuration schema for validation
     */
    getConfigurationSchema(): object;
}
//# sourceMappingURL=ConfigurationImporter.d.ts.map