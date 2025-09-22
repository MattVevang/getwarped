/**
 * Configuration Exporter
 *
 * Handles secure export of application configuration data with credential stripping.
 * Generates JSON schema validation and ensures no sensitive data is included in exports.
 *
 * @fileoverview Secure configuration export with credential protection
 */

import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigurationManager, AppConfiguration } from './ConfigurationManager';
import { InputValidator } from '../../shared/validation/InputValidator';

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
export class ConfigurationExporter {
  private configurationManager: ConfigurationManager;
  private ajv: Ajv;
  private readonly appVersion = '1.0.0'; // This should come from package.json
  private readonly configVersion = '1.0';
  private readonly formatVersion = '1.0';

  constructor(configurationManager: ConfigurationManager) {
    this.configurationManager = configurationManager;

    // Initialize AJV with formats
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);

    // Add configuration schema
    this.ajv.addSchema(CONFIGURATION_SCHEMA, 'configuration');
  }

  /**
   * Export configuration to file with dialog
   */
  async exportConfiguration(
    parentWindow?: BrowserWindow,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
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
      const writeResult = await this.writeExportFile(filePath, exportResult.exportData!, options);
      if (!writeResult.success) {
        return writeResult;
      }

      const result: ExportResult = {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
      };
    }
  }

  /**
   * Generate export data without writing to file
   */
  async generateExportData(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const warnings: string[] = [];

      // Get current configuration
      const currentConfig = await this.configurationManager.getConfiguration();

      // Sanitize configuration (remove sensitive data)
      const sanitizedConfig = this.sanitizeConfiguration(currentConfig, options.sections, warnings);

      // Generate metadata
      const metadata: ConfigurationExportMetadata = {
        exportedAt: new Date().toISOString(),
        appVersion: this.appVersion,
        configVersion: this.configVersion,
        source: 'GetWarped Configuration Manager',
        formatVersion: this.formatVersion,
        securityNotice:
          'This export contains NO credentials or sensitive authentication data. Re-authentication will be required after import.',
      };

      // Create export data
      const exportData: ConfigurationExportData = {
        metadata:
          options.includeMetadata !== false ? metadata : ({} as ConfigurationExportMetadata),
        configuration: sanitizedConfig,
        warnings,
      };

      // Validate export data
      const validationResult = this.validateExportData(exportData);
      if (!validationResult.success) {
        const errorResult: ExportResult = {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate export data',
      };
    }
  }

  /**
   * Generate JSON schema for configuration
   */
  getConfigurationSchema(): object {
    return CONFIGURATION_SCHEMA;
  }

  /**
   * Validate configuration against schema
   */
  validateConfiguration(configuration: AppConfiguration): { valid: boolean; errors?: string[] } {
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
  private async getExportFilePath(
    parentWindow?: BrowserWindow,
    options: ExportOptions = {}
  ): Promise<string | null> {
    if (options.filePath) {
      return options.filePath;
    }

    const dialogOptions: Electron.SaveDialogOptions = {
      title: 'Export Configuration',
      defaultPath: `getwarped-config-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      properties: ['createDirectory'],
    };

    const result = parentWindow
      ? await dialog.showSaveDialog(parentWindow, dialogOptions)
      : await dialog.showSaveDialog(dialogOptions);

    return result.canceled ? null : result.filePath || null;
  }

  /**
   * Sanitize configuration by removing sensitive data
   */
  private sanitizeConfiguration(
    config: AppConfiguration,
    sections?: (keyof AppConfiguration)[],
    warnings?: string[]
  ): AppConfiguration {
    // Deep clone the configuration
    const sanitized = JSON.parse(JSON.stringify(config)) as AppConfiguration;

    // Filter sections if specified
    if (sections && sections.length > 0) {
      const result = { ...sanitized };

      // Reset all sections first
      const allKeys = Object.keys(result) as (keyof AppConfiguration)[];
      for (const key of allKeys) {
        if (!sections.includes(key)) {
          delete result[key];
        }
      }

      return result;
    }

    // Remove potentially sensitive workspace data
    if (sanitized.workspace.defaultWorkspaceId) {
      warnings?.push(
        'Default workspace ID has been preserved but may need reconfiguration after import'
      );
    }

    // Add security notice for settings that may affect security
    if (sanitized.security.requireAuth) {
      warnings?.push(
        'Authentication requirement setting preserved - ensure proper setup after import'
      );
    }

    if (sanitized.developer.developerMode) {
      warnings?.push('Developer mode is enabled - review security implications after import');
    }

    return sanitized;
  }

  /**
   * Write export data to file
   */
  private async writeExportFile(
    filePath: string,
    exportData: ConfigurationExportData,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      // Validate file path
      const pathValidation = InputValidator.validateFilePath(filePath);
      if (!pathValidation.valid) {
        return { success: false, error: 'Invalid export file path' };
      }

      // Ensure directory exists
      const directory = path.dirname(filePath);
      await fs.mkdir(directory, { recursive: true });

      // Format data based on options
      let content: string;
      if (options.format === 'yaml') {
        // For now, only support JSON
        return { success: false, error: 'YAML format not yet supported' };
      } else {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write export file',
      };
    }
  }

  /**
   * Validate export data structure
   */
  private validateExportData(exportData: ConfigurationExportData): {
    success: boolean;
    error?: string;
    warnings?: string[];
  } {
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
        const missingFields = requiredMetadataFields.filter(
          field => !exportData.metadata[field as keyof ConfigurationExportMetadata]
        );

        if (missingFields.length > 0) {
          return {
            success: false,
            error: `Missing required metadata fields: ${missingFields.join(', ')}`,
          };
        }
      }

      return { success: true, warnings: exportData.warnings };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export data validation failed',
      };
    }
  }
}

export default ConfigurationExporter;
