/**
 * ConfigurationFileManager.ts
 *
 * Manages configuration file operations for the GetWarped application.
 * Handles reading, writing, validation, and backup of configuration data
 * across different file formats and platforms.
 *
 * Features:
 * - Cross-platform configuration file management
 * - JSON Schema validation
 * - Atomic file operations with backup/restore
 * - Configuration migration and versioning
 * - File watching for external changes
 * - Security validation and sanitization
 * - Configuration templates and defaults
 *
 * Security Properties:
 * - Input validation and sanitization
 * - Atomic operations to prevent corruption
 * - Backup creation before modifications
 * - Path traversal protection
 * - File permission management
 */
import { EventEmitter } from 'node:events';
/**
 * Configuration file metadata
 */
interface ConfigurationMetadata {
    version: string;
    created: Date;
    lastModified: Date;
    checksum: string;
    size: number;
    format: 'json' | 'yaml' | 'toml';
    encoding: 'utf8' | 'utf16le';
}
/**
 * Configuration file structure
 */
interface ConfigurationFile {
    metadata: ConfigurationMetadata;
    data: any;
    schema?: any;
    isValid: boolean;
    validationErrors: string[];
}
/**
 * File operation options
 */
interface FileOperationOptions {
    createBackup?: boolean;
    validateSchema?: boolean;
    atomicWrite?: boolean;
    createMissing?: boolean;
    permissions?: number;
    encoding?: 'utf8' | 'utf16le';
    maxSize?: number;
}
/**
 * Configuration file paths
 */
interface ConfigurationPaths {
    main: string;
    backup: string;
    templates: string;
    schemas: string;
    temp: string;
}
/**
 * Events emitted by ConfigurationFileManager
 */
interface ConfigurationFileManagerEvents {
    'file-changed': {
        filePath: string;
        changeType: 'created' | 'modified' | 'deleted';
    };
    'file-loaded': {
        filePath: string;
        metadata: ConfigurationMetadata;
    };
    'file-saved': {
        filePath: string;
        metadata: ConfigurationMetadata;
    };
    'validation-failed': {
        filePath: string;
        errors: string[];
    };
    'backup-created': {
        originalPath: string;
        backupPath: string;
    };
    'migration-completed': {
        fromVersion: string;
        toVersion: string;
        filePath: string;
    };
    'operation-failed': {
        operation: string;
        filePath: string;
        error: string;
    };
    'security-violation': {
        type: string;
        filePath: string;
        details: string;
    };
}
/**
 * Configuration file manager
 *
 * Provides comprehensive configuration file management with validation,
 * backup, versioning, and security features.
 */
export declare class ConfigurationFileManager extends EventEmitter {
    private readonly configPaths;
    private readonly watchers;
    private readonly loadedConfigs;
    private readonly schemas;
    private readonly appVersion;
    private readonly DEFAULT_OPTIONS;
    constructor();
    /**
     * Load configuration file
     */
    loadConfiguration(filePath: string, options?: Partial<FileOperationOptions>): Promise<ConfigurationFile>;
    /**
     * Save configuration file
     */
    saveConfiguration(filePath: string, data: any, options?: Partial<FileOperationOptions>): Promise<ConfigurationMetadata>;
    /**
     * Watch configuration file for changes
     */
    watchConfiguration(filePath: string): Promise<void>;
    /**
     * Stop watching configuration file
     */
    unwatchConfiguration(filePath: string): Promise<void>;
    /**
     * Create backup of configuration file
     */
    createBackup(filePath: string): Promise<string>;
    /**
     * Restore from backup
     */
    restoreFromBackup(backupPath: string, targetPath: string): Promise<void>;
    /**
     * List available backups for a file
     */
    listBackups(filePath: string): Promise<Array<{
        path: string;
        created: Date;
        size: number;
    }>>;
    /**
     * Migrate configuration to new version
     */
    migrateConfiguration(filePath: string, fromVersion: string, toVersion: string): Promise<void>;
    /**
     * Get configuration file information
     */
    getFileInfo(filePath: string): Promise<ConfigurationMetadata>;
    /**
     * Validate file path for security
     */
    private validateFilePath;
    /**
     * Detect file format from extension
     */
    private detectFileFormat;
    /**
     * Parse content based on format
     */
    private parseContent;
    /**
     * Serialize content based on format
     */
    private serializeContent;
    /**
     * Calculate checksum for content
     */
    private calculateChecksum;
    /**
     * Extract version from data
     */
    private extractVersion;
    /**
     * Atomic write using temporary file
     */
    private atomicWrite;
    /**
     * Create configuration from template
     */
    private createFromTemplate;
    /**
     * Validate data against schema
     */
    private validateAgainstSchema;
    /**
     * Get schema for file
     */
    private getSchemaForFile;
    /**
     * Perform configuration migration
     */
    private performMigration;
    /**
     * Initialize directory structure
     */
    private initializeDirectories;
    /**
     * Load built-in schemas
     */
    private loadBuiltinSchemas;
    /**
     * Shutdown and cleanup
     */
    private shutdown;
    emit<K extends keyof ConfigurationFileManagerEvents>(event: K, ...args: [ConfigurationFileManagerEvents[K]]): boolean;
    on<K extends keyof ConfigurationFileManagerEvents>(event: K, listener: (arg: ConfigurationFileManagerEvents[K]) => void): this;
    once<K extends keyof ConfigurationFileManagerEvents>(event: K, listener: (arg: ConfigurationFileManagerEvents[K]) => void): this;
}
export type { ConfigurationFile, ConfigurationMetadata, FileOperationOptions, ConfigurationPaths, ConfigurationFileManagerEvents, };
export default ConfigurationFileManager;
//# sourceMappingURL=ConfigurationFileManager.d.ts.map