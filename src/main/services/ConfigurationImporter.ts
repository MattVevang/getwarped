import { promises as fs } from 'fs';
import { dialog, BrowserWindow } from 'electron';
import Ajv, { JSONSchemaType } from 'ajv';
import { ConfigurationManager, AppConfiguration } from './ConfigurationManager';
import { InputValidator } from '../../shared/validation/InputValidator';

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
 * Validation result
 */
interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors?: string[];
  /** Validation warnings */
  warnings?: string[];
}

/**
 * Configuration schema for validation
 */
const CONFIGURATION_SCHEMA: JSONSchemaType<AppConfiguration> = {
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
export class ConfigurationImporter {
  private readonly ajv: Ajv;

  constructor(
    private readonly configurationManager: ConfigurationManager,
    private readonly appVersion: string = '1.0.0',
    private readonly configVersion: string = '1.0.0'
  ) {
    // Initialize JSON schema validator
    this.ajv = new Ajv({
      strict: true,
      allErrors: true,
      removeAdditional: true,
      useDefaults: true,
    });
  }

  /**
   * Import configuration from file with dialog
   */
  async importConfiguration(
    parentWindow?: BrowserWindow,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
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
      let backupPath: string | undefined;
      if (options.backup) {
        const backupResult = await this.createConfigurationBackup();
        if (!backupResult.success) {
          // Backup failed but continue with import - not critical
        } else {
          backupPath = backupResult.backupPath;
        }
      }

      // Apply configuration
      const applyResult = await this.applyConfiguration(readResult.importData!, options);
      if (!applyResult.success) {
        return applyResult;
      }

      const result: ImportResult = {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import configuration',
      };
    }
  }

  /**
   * Read and validate import file
   */
  async readImportFile(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      const warnings: string[] = [];

      // Validate file path
      const pathValidation = InputValidator.validateFilePath(filePath);
      if (!pathValidation.valid) {
        return {
          success: false,
          error: 'Invalid file path: ' + pathValidation.error,
        };
      }

      // Read file
      const fileContent = await fs.readFile(filePath, 'utf8');

      // Parse JSON
      let importData: ConfigurationImportData;
      try {
        importData = JSON.parse(fileContent);
      } catch (parseError) {
        return {
          success: false,
          error:
            'Invalid JSON format: ' +
            (parseError instanceof Error ? parseError.message : 'Parse error'),
        };
      }

      // Validate data structure
      if (options.validate !== false) {
        const validation = this.validateImportData(importData);
        if (!validation.valid) {
          const errorResult: ImportResult = {
            success: false,
            error:
              'Import validation failed: ' +
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
        importData.configuration = this.filterConfigurationSections(
          importData.configuration,
          options.sections
        );
      }

      const result: ImportResult = {
        success: true,
        importData,
      };

      if (warnings.length > 0) {
        result.warnings = warnings;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read import file',
      };
    }
  }

  /**
   * Apply imported configuration
   */
  private async applyConfiguration(
    importData: ConfigurationImportData,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const mergeStrategy = options.merge ? 'merge' : 'replace';
      const result = await this.configurationManager.importConfiguration(
        importData.configuration,
        mergeStrategy
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Configuration import failed',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply configuration',
      };
    }
  }

  /**
   * Get import file path via dialog
   */
  private async getImportFilePath(
    parentWindow?: BrowserWindow,
    options: ImportOptions = {}
  ): Promise<string | null> {
    if (options.filePath) {
      return options.filePath;
    }

    const dialogOptions: Electron.OpenDialogOptions = {
      title: 'Import Configuration',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    };

    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    return result.canceled ? null : result.filePaths[0] || null;
  }

  /**
   * Validate import data structure
   */
  private validateImportData(importData: ConfigurationImportData): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

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
          warnings.push(
            'Credentials were stripped during export - you will need to re-authenticate services'
          );
        }

        if (importData.metadata.appVersion && importData.metadata.appVersion !== this.appVersion) {
          warnings.push(
            `Configuration was exported from app version ${importData.metadata.appVersion}, current version is ${this.appVersion}`
          );
        }

        if (
          importData.metadata.configVersion &&
          importData.metadata.configVersion !== this.configVersion
        ) {
          warnings.push(
            `Configuration format version mismatch: exported ${importData.metadata.configVersion}, current ${this.configVersion}`
          );
        }
      }

      const result: ValidationResult = {
        valid: errors.length === 0,
      };

      if (errors.length > 0) {
        result.errors = errors;
      }

      if (warnings.length > 0) {
        result.warnings = warnings;
      }

      return result;
    } catch (error) {
      return {
        valid: false,
        errors: ['Validation error: ' + (error instanceof Error ? error.message : 'Unknown error')],
      };
    }
  }

  /**
   * Generate security warnings for imported data
   */
  private generateSecurityWarnings(importData: ConfigurationImportData): string[] {
    const warnings: string[] = [];

    // Check if credentials were stripped
    if (importData.metadata?.credentialsStripped) {
      warnings.push(
        '⚠️ Security Notice: All stored credentials were removed during export for security'
      );
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
      if (!section || !key) continue;

      const sectionData = importData.configuration[section as keyof AppConfiguration] as any;
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
  private filterConfigurationSections(
    config: AppConfiguration,
    sections: (keyof AppConfiguration)[]
  ): AppConfiguration {
    const filtered = {} as Partial<AppConfiguration>;

    for (const section of sections) {
      if (config[section]) {
        (filtered as any)[section] = config[section];
      }
    }

    return filtered as AppConfiguration;
  }

  /**
   * Create backup of current configuration
   */
  private async createConfigurationBackup(): Promise<{
    success: boolean;
    backupPath?: string;
    error?: string;
  }> {
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

      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');

      return { success: true, backupPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create backup',
      };
    }
  }

  /**
   * Get configuration schema for validation
   */
  getConfigurationSchema(): object {
    return CONFIGURATION_SCHEMA;
  }
}
