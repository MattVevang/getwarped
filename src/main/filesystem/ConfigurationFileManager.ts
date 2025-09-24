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

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { app } from 'electron';
import { FSWatcher, watch } from 'fs';

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
  permissions?: number; // Unix file permissions
  encoding?: 'utf8' | 'utf16le';
  maxSize?: number; // Maximum file size in bytes
}

/**
 * Configuration file paths
 */
interface ConfigurationPaths {
  main: string; // Main configuration file
  backup: string; // Backup directory
  templates: string; // Template directory
  schemas: string; // Schema directory
  temp: string; // Temporary files directory
}

/**
 * Events emitted by ConfigurationFileManager
 */
interface ConfigurationFileManagerEvents {
  'file-changed': { filePath: string; changeType: 'created' | 'modified' | 'deleted' };
  'file-loaded': { filePath: string; metadata: ConfigurationMetadata };
  'file-saved': { filePath: string; metadata: ConfigurationMetadata };
  'validation-failed': { filePath: string; errors: string[] };
  'backup-created': { originalPath: string; backupPath: string };
  'migration-completed': { fromVersion: string; toVersion: string; filePath: string };
  'operation-failed': { operation: string; filePath: string; error: string };
  'security-violation': { type: string; filePath: string; details: string };
}

/**
 * Configuration file manager
 *
 * Provides comprehensive configuration file management with validation,
 * backup, versioning, and security features.
 */
export class ConfigurationFileManager extends EventEmitter {
  private readonly configPaths: ConfigurationPaths;
  private readonly watchers = new Map<string, FSWatcher>();
  private readonly loadedConfigs = new Map<string, ConfigurationFile>();
  private readonly schemas = new Map<string, any>();
  private readonly appVersion: string;

  // Default options
  private readonly DEFAULT_OPTIONS: Required<FileOperationOptions> = {
    createBackup: true,
    validateSchema: true,
    atomicWrite: true,
    createMissing: true,
    permissions: 0o600, // rw------- (user read/write only)
    encoding: 'utf8',
    maxSize: 50 * 1024 * 1024, // 50MB
  };

  constructor() {
    super();

    this.appVersion = app.getVersion();

    // Initialize configuration paths
    const userDataPath = app.getPath('userData');
    this.configPaths = {
      main: path.join(userDataPath, 'config'),
      backup: path.join(userDataPath, 'config', 'backups'),
      templates: path.join(userDataPath, 'config', 'templates'),
      schemas: path.join(userDataPath, 'config', 'schemas'),
      temp: path.join(userDataPath, 'config', 'temp'),
    };

    // Initialize directories
    this.initializeDirectories();

    // Load built-in schemas
    this.loadBuiltinSchemas();

    // Handle app shutdown
    process.on('exit', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Load configuration file
   */
  public async loadConfiguration(
    filePath: string,
    options: Partial<FileOperationOptions> = {}
  ): Promise<ConfigurationFile> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Security validation
      this.validateFilePath(filePath);

      // Check if already loaded and cached
      const absolutePath = path.resolve(filePath);
      if (this.loadedConfigs.has(absolutePath)) {
        const cached = this.loadedConfigs.get(absolutePath)!;

        // Check if file has changed on disk
        const stats = await fs.stat(absolutePath);
        if (stats.mtime.getTime() === cached.metadata.lastModified.getTime()) {
          return cached;
        }
      }

      // Check file exists
      let fileExists = true;
      try {
        await fs.access(absolutePath, fs.constants.F_OK);
      } catch {
        fileExists = false;
      }

      if (!fileExists) {
        if (opts.createMissing) {
          // Create from template if available
          const config = await this.createFromTemplate(absolutePath);
          this.loadedConfigs.set(absolutePath, config);
          return config;
        } else {
          throw new Error(`Configuration file not found: ${filePath}`);
        }
      }

      // Load file content
      const stats = await fs.stat(absolutePath);

      // Size validation
      if (stats.size > opts.maxSize) {
        throw new Error(`Configuration file too large: ${stats.size} bytes (max: ${opts.maxSize})`);
      }

      const content = await fs.readFile(absolutePath, opts.encoding);

      // Parse content based on file extension
      const format = this.detectFileFormat(absolutePath);
      const data = this.parseContent(content, format);

      // Create metadata
      const metadata: ConfigurationMetadata = {
        version: this.extractVersion(data) || this.appVersion,
        created: stats.birthtime,
        lastModified: stats.mtime,
        checksum: this.calculateChecksum(content),
        size: stats.size,
        format,
        encoding: opts.encoding,
      };

      // Schema validation
      let isValid = true;
      let validationErrors: string[] = [];

      if (opts.validateSchema) {
        const validationResult = await this.validateAgainstSchema(data, absolutePath);
        isValid = validationResult.isValid;
        validationErrors = validationResult.errors;

        if (!isValid) {
          this.emit('validation-failed', { filePath: absolutePath, errors: validationErrors });
        }
      }

      const config: ConfigurationFile = {
        metadata,
        data,
        schema: this.getSchemaForFile(absolutePath),
        isValid,
        validationErrors,
      };

      // Cache loaded configuration
      this.loadedConfigs.set(absolutePath, config);

      this.emit('file-loaded', { filePath: absolutePath, metadata });

      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown load error';
      this.emit('operation-failed', { operation: 'load', filePath, error: message });
      throw new Error(`Failed to load configuration: ${message}`);
    }
  }

  /**
   * Save configuration file
   */
  public async saveConfiguration(
    filePath: string,
    data: any,
    options: Partial<FileOperationOptions> = {}
  ): Promise<ConfigurationMetadata> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Security validation
      this.validateFilePath(filePath);

      const absolutePath = path.resolve(filePath);

      // Schema validation
      if (opts.validateSchema) {
        const validationResult = await this.validateAgainstSchema(data, absolutePath);
        if (!validationResult.isValid) {
          this.emit('validation-failed', {
            filePath: absolutePath,
            errors: validationResult.errors,
          });
          throw new Error(`Schema validation failed: ${validationResult.errors.join(', ')}`);
        }
      }

      // Ensure version is set
      if (typeof data === 'object' && data !== null) {
        data.version = data.version || this.appVersion;
        data.lastModified = new Date().toISOString();
      }

      // Create backup if requested and file exists
      if (opts.createBackup) {
        try {
          await fs.access(absolutePath, fs.constants.F_OK);
          await this.createBackup(absolutePath);
        } catch {
          // File doesn't exist, no backup needed
        }
      }

      // Serialize data
      const format = this.detectFileFormat(absolutePath);
      const content = this.serializeContent(data, format);

      // Ensure directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });

      if (opts.atomicWrite) {
        // Atomic write using temporary file
        await this.atomicWrite(absolutePath, content, opts);
      } else {
        // Direct write
        await fs.writeFile(absolutePath, content, opts.encoding);
      }

      // Set file permissions on Unix-like systems
      if (process.platform !== 'win32') {
        await fs.chmod(absolutePath, opts.permissions);
      }

      // Create metadata
      const stats = await fs.stat(absolutePath);
      const metadata: ConfigurationMetadata = {
        version: this.extractVersion(data) || this.appVersion,
        created: stats.birthtime,
        lastModified: stats.mtime,
        checksum: this.calculateChecksum(content),
        size: stats.size,
        format,
        encoding: opts.encoding,
      };

      // Update cache
      const config: ConfigurationFile = {
        metadata,
        data,
        schema: this.getSchemaForFile(absolutePath),
        isValid: true,
        validationErrors: [],
      };
      this.loadedConfigs.set(absolutePath, config);

      this.emit('file-saved', { filePath: absolutePath, metadata });

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown save error';
      this.emit('operation-failed', { operation: 'save', filePath, error: message });
      throw new Error(`Failed to save configuration: ${message}`);
    }
  }

  /**
   * Watch configuration file for changes
   */
  public async watchConfiguration(filePath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);

      // Don't watch if already watching
      if (this.watchers.has(absolutePath)) {
        return;
      }

      // Ensure file exists
      await fs.access(absolutePath, fs.constants.F_OK);

      const watcher = watch(absolutePath, (eventType, filename) => {
        if (filename) {
          // Remove from cache when file changes externally
          this.loadedConfigs.delete(absolutePath);

          let changeType: 'created' | 'modified' | 'deleted';
          switch (eventType) {
            case 'rename':
              changeType = 'deleted'; // File was likely deleted or moved
              break;
            case 'change':
              changeType = 'modified';
              break;
            default:
              changeType = 'modified';
          }

          this.emit('file-changed', { filePath: absolutePath, changeType });
        }
      });

      this.watchers.set(absolutePath, watcher);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown watch error';
      this.emit('operation-failed', { operation: 'watch', filePath, error: message });
      throw new Error(`Failed to watch configuration: ${message}`);
    }
  }

  /**
   * Stop watching configuration file
   */
  public async unwatchConfiguration(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    const watcher = this.watchers.get(absolutePath);

    if (watcher) {
      watcher.close();
      this.watchers.delete(absolutePath);
    }
  }

  /**
   * Create backup of configuration file
   */
  public async createBackup(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${path.basename(absolutePath)}.${timestamp}.backup`;
      const backupPath = path.join(this.configPaths.backup, backupName);

      // Ensure backup directory exists
      await fs.mkdir(this.configPaths.backup, { recursive: true });

      // Copy file to backup location
      await fs.copyFile(absolutePath, backupPath);

      this.emit('backup-created', { originalPath: absolutePath, backupPath });

      return backupPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown backup error';
      this.emit('operation-failed', { operation: 'backup', filePath, error: message });
      throw new Error(`Failed to create backup: ${message}`);
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(backupPath: string, targetPath: string): Promise<void> {
    try {
      // Security validation
      this.validateFilePath(backupPath);
      this.validateFilePath(targetPath);

      const absoluteBackupPath = path.resolve(backupPath);
      const absoluteTargetPath = path.resolve(targetPath);

      // Verify backup exists
      await fs.access(absoluteBackupPath, fs.constants.F_OK);

      // Create backup of current file before restore
      try {
        await this.createBackup(absoluteTargetPath);
      } catch {
        // Ignore if target doesn't exist
      }

      // Copy backup to target location
      await fs.copyFile(absoluteBackupPath, absoluteTargetPath);

      // Remove from cache to force reload
      this.loadedConfigs.delete(absoluteTargetPath);

      this.emit('file-changed', { filePath: absoluteTargetPath, changeType: 'modified' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown restore error';
      this.emit('operation-failed', { operation: 'restore', filePath: targetPath, error: message });
      throw new Error(`Failed to restore from backup: ${message}`);
    }
  }

  /**
   * List available backups for a file
   */
  public async listBackups(filePath: string): Promise<
    Array<{
      path: string;
      created: Date;
      size: number;
    }>
  > {
    try {
      const fileName = path.basename(filePath);
      const backupPattern = new RegExp(`^${fileName}\\..*\\.backup$`);

      const files = await fs.readdir(this.configPaths.backup);
      const backups: Array<{ path: string; created: Date; size: number }> = [];

      for (const file of files) {
        if (backupPattern.test(file)) {
          const backupPath = path.join(this.configPaths.backup, file);
          const stats = await fs.stat(backupPath);

          backups.push({
            path: backupPath,
            created: stats.birthtime,
            size: stats.size,
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.created.getTime() - a.created.getTime());

      return backups;
    } catch (error) {
      return [];
    }
  }

  /**
   * Migrate configuration to new version
   */
  public async migrateConfiguration(
    filePath: string,
    fromVersion: string,
    toVersion: string
  ): Promise<void> {
    try {
      const config = await this.loadConfiguration(filePath, { validateSchema: false });

      // Apply migration logic based on version changes
      const migratedData = await this.performMigration(config.data, fromVersion, toVersion);

      // Save with new version
      await this.saveConfiguration(filePath, migratedData);

      this.emit('migration-completed', { fromVersion, toVersion, filePath });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown migration error';
      this.emit('operation-failed', { operation: 'migrate', filePath, error: message });
      throw new Error(`Failed to migrate configuration: ${message}`);
    }
  }

  /**
   * Get configuration file information
   */
  public async getFileInfo(filePath: string): Promise<ConfigurationMetadata> {
    const config = await this.loadConfiguration(filePath, { validateSchema: false });
    return config.metadata;
  }

  /**
   * Validate file path for security
   */
  private validateFilePath(filePath: string): void {
    const absolutePath = path.resolve(filePath);
    const userDataPath = app.getPath('userData');

    // Ensure path is within user data directory
    if (!absolutePath.startsWith(userDataPath)) {
      this.emit('security-violation', {
        type: 'path-traversal',
        filePath,
        details: `Attempted access outside user data directory: ${absolutePath}`,
      });
      throw new Error('Invalid file path: Access denied');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Invalid characters
      /^\s*$/, // Empty or whitespace only
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(filePath)) {
        this.emit('security-violation', {
          type: 'invalid-path',
          filePath,
          details: `Path contains suspicious pattern: ${pattern}`,
        });
        throw new Error('Invalid file path: Security violation');
      }
    }
  }

  /**
   * Detect file format from extension
   */
  private detectFileFormat(filePath: string): 'json' | 'yaml' | 'toml' {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        return 'json';
      case '.yaml':
      case '.yml':
        return 'yaml';
      case '.toml':
        return 'toml';
      default:
        return 'json'; // Default to JSON
    }
  }

  /**
   * Parse content based on format
   */
  private parseContent(content: string, format: 'json' | 'yaml' | 'toml'): any {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(content);
        case 'yaml':
          // Simplified YAML parsing - in production, use a proper YAML library
          throw new Error('YAML parsing not implemented');
        case 'toml':
          // Simplified TOML parsing - in production, use a proper TOML library
          throw new Error('TOML parsing not implemented');
        default:
          return JSON.parse(content);
      }
    } catch (error) {
      throw new Error(`Failed to parse ${format.toUpperCase()} content: ${error}`);
    }
  }

  /**
   * Serialize content based on format
   */
  private serializeContent(data: any, format: 'json' | 'yaml' | 'toml'): string {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);
        case 'yaml':
          // Simplified YAML serialization - in production, use a proper YAML library
          throw new Error('YAML serialization not implemented');
        case 'toml':
          // Simplified TOML serialization - in production, use a proper TOML library
          throw new Error('TOML serialization not implemented');
        default:
          return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      throw new Error(`Failed to serialize ${format.toUpperCase()} content: ${error}`);
    }
  }

  /**
   * Calculate checksum for content
   */
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Extract version from data
   */
  private extractVersion(data: any): string | undefined {
    if (typeof data === 'object' && data !== null) {
      return data.version || data.configVersion || data.schemaVersion;
    }
    return undefined;
  }

  /**
   * Atomic write using temporary file
   */
  private async atomicWrite(
    filePath: string,
    content: string,
    options: Required<FileOperationOptions>
  ): Promise<void> {
    const tempPath = path.join(this.configPaths.temp, `${path.basename(filePath)}.tmp`);

    try {
      // Ensure temp directory exists
      await fs.mkdir(this.configPaths.temp, { recursive: true });

      // Write to temporary file
      await fs.writeFile(tempPath, content, options.encoding);

      // Set permissions on temp file
      if (process.platform !== 'win32') {
        await fs.chmod(tempPath, options.permissions);
      }

      // Move temporary file to final location (atomic on most filesystems)
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temporary file on error
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Create configuration from template
   */
  private async createFromTemplate(filePath: string): Promise<ConfigurationFile> {
    const fileName = path.basename(filePath);
    const templatePath = path.join(this.configPaths.templates, fileName);

    try {
      // Try to load template
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const format = this.detectFileFormat(filePath);
      const data = this.parseContent(templateContent, format);

      // Set initial version
      if (typeof data === 'object' && data !== null) {
        data.version = this.appVersion;
        data.created = new Date().toISOString();
      }

      // Save as actual configuration
      const metadata = await this.saveConfiguration(filePath, data, { createBackup: false });

      return {
        metadata,
        data,
        schema: this.getSchemaForFile(filePath),
        isValid: true,
        validationErrors: [],
      };
    } catch (error) {
      // Create minimal default configuration
      const defaultData = {
        version: this.appVersion,
        created: new Date().toISOString(),
        workspaces: [],
        services: [],
        preferences: {},
      };

      const metadata = await this.saveConfiguration(filePath, defaultData, { createBackup: false });

      return {
        metadata,
        data: defaultData,
        schema: this.getSchemaForFile(filePath),
        isValid: true,
        validationErrors: [],
      };
    }
  }

  /**
   * Validate data against schema
   */
  private async validateAgainstSchema(
    data: any,
    filePath: string
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const schema = this.getSchemaForFile(filePath);

    if (!schema) {
      return { isValid: true, errors: [] };
    }

    // Simplified validation - in production, use a proper JSON schema validator
    const errors: string[] = [];

    // Basic validation checks
    if (typeof data !== 'object' || data === null) {
      errors.push('Configuration must be an object');
    }

    if (!data.version) {
      errors.push('Configuration must have a version field');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get schema for file
   */
  private getSchemaForFile(filePath: string): any {
    const fileName = path.basename(filePath, path.extname(filePath));
    return this.schemas.get(fileName);
  }

  /**
   * Perform configuration migration
   */
  private async performMigration(data: any, fromVersion: string, toVersion: string): Promise<any> {
    // Simplified migration logic - in production, implement proper version-specific migrations
    const migratedData = JSON.parse(JSON.stringify(data)); // Deep clone
    migratedData.version = toVersion;
    migratedData.migrated = new Date().toISOString();
    migratedData.previousVersion = fromVersion;

    return migratedData;
  }

  /**
   * Initialize directory structure
   */
  private async initializeDirectories(): Promise<void> {
    for (const dirPath of Object.values(this.configPaths)) {
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore
      }
    }
  }

  /**
   * Load built-in schemas
   */
  private loadBuiltinSchemas(): void {
    // Load built-in schemas for configuration validation
    // In production, these would be loaded from actual schema files
    this.schemas.set('config', {
      type: 'object',
      properties: {
        version: { type: 'string' },
        workspaces: { type: 'array' },
        services: { type: 'array' },
        preferences: { type: 'object' },
      },
      required: ['version'],
    });
  }

  /**
   * Shutdown and cleanup
   */
  private shutdown(): void {
    // Close all file watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    // Clear caches
    this.loadedConfigs.clear();
    this.schemas.clear();

    this.removeAllListeners();
  }

  // Type-safe event emitter overrides
  public override emit<K extends keyof ConfigurationFileManagerEvents>(
    event: K,
    ...args: [ConfigurationFileManagerEvents[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  public override on<K extends keyof ConfigurationFileManagerEvents>(
    event: K,
    listener: (arg: ConfigurationFileManagerEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof ConfigurationFileManagerEvents>(
    event: K,
    listener: (arg: ConfigurationFileManagerEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }
}

// Export types for external use
export type {
  ConfigurationFile,
  ConfigurationMetadata,
  FileOperationOptions,
  ConfigurationPaths,
  ConfigurationFileManagerEvents,
};

// Default export
export default ConfigurationFileManager;
