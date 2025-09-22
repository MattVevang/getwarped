/**
 * Configuration IPC Handlers
 *
 * Handles Inter-Process Communication (IPC) for configuration-related operations.
 * Bridges renderer process requests to ConfigurationManager with proper validation,
 * error handling, and security considerations for export/import operations.
 *
 * @fileoverview IPC handlers for configuration operations (export, import, get, update)
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import {
  ConfigurationManager,
  AppConfiguration,
  ConfigurationUpdateRequest,
  ConfigurationValidationResult,
} from '../services/ConfigurationManager';

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
export class ConfigurationHandlers {
  private configurationManager: ConfigurationManager;

  constructor() {
    this.configurationManager = new ConfigurationManager();
    this.registerHandlers();
  }

  /**
   * Register all IPC handlers
   */
  private registerHandlers(): void {
    // Get complete configuration
    ipcMain.handle('config:get', this.handleGetConfiguration.bind(this));

    // Get specific configuration section
    ipcMain.handle('config:getSection', this.handleGetConfigurationSection.bind(this));

    // Get specific configuration value
    ipcMain.handle('config:getValue', this.handleGetConfigurationValue.bind(this));

    // Update configuration
    ipcMain.handle('config:update', this.handleUpdateConfiguration.bind(this));

    // Update configuration section
    ipcMain.handle('config:updateSection', this.handleUpdateConfigurationSection.bind(this));

    // Update multiple configurations
    ipcMain.handle('config:updateMultiple', this.handleUpdateMultipleConfigurations.bind(this));

    // Reset configuration to defaults
    ipcMain.handle('config:reset', this.handleResetConfiguration.bind(this));

    // Reset specific section to defaults
    ipcMain.handle('config:resetSection', this.handleResetConfigurationSection.bind(this));

    // Validate configuration
    ipcMain.handle('config:validate', this.handleValidateConfiguration.bind(this));

    // Export configuration
    ipcMain.handle('config:export', this.handleExportConfiguration.bind(this));

    // Import configuration
    ipcMain.handle('config:import', this.handleImportConfiguration.bind(this));

    // Check if configuration is modified
    ipcMain.handle('config:isModified', this.handleIsConfigurationModified.bind(this));

    // Get configuration file path
    ipcMain.handle('config:getPath', this.handleGetConfigurationPath.bind(this));

    // Add configuration change listener
    ipcMain.handle('config:addListener', this.handleAddConfigurationListener.bind(this));

    // Remove configuration change listener
    ipcMain.handle('config:removeListener', this.handleRemoveConfigurationListener.bind(this));
  }

  /**
   * Handle getting complete configuration
   */
  private async handleGetConfiguration(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<AppConfiguration>> {
    try {
      const configuration = this.configurationManager.getConfiguration();

      return {
        success: true,
        data: configuration,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle getting specific configuration section
   */
  private async handleGetConfigurationSection(
    _event: IpcMainInvokeEvent,
    section: keyof AppConfiguration
  ): Promise<IPCResponse<AppConfiguration[keyof AppConfiguration]>> {
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
    } catch (error) {
      return {
        success: false,
        error: `Failed to get configuration section: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle getting specific configuration value
   */
  private async handleGetConfigurationValue(
    _event: IpcMainInvokeEvent,
    section: keyof AppConfiguration,
    key: string
  ): Promise<IPCResponse<any>> {
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
      const value = (sectionConfig as any)[key];

      return {
        success: true,
        data: value,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get configuration value: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle updating configuration
   */
  private async handleUpdateConfiguration(
    _event: IpcMainInvokeEvent,
    request: ConfigurationUpdateRequest
  ): Promise<IPCResponse<AppConfiguration>> {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update configuration',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle updating configuration section
   */
  private async handleUpdateConfigurationSection(
    _event: IpcMainInvokeEvent,
    request: UpdateConfigurationSectionRequest
  ): Promise<IPCResponse<AppConfiguration>> {
    try {
      // Convert to ConfigurationUpdateRequest format
      const updateRequest: ConfigurationUpdateRequest = {
        section: request.section,
        updates: request.updates,
      };

      return await this.handleUpdateConfiguration(_event, updateRequest);
    } catch (error) {
      return {
        success: false,
        error: `Failed to update configuration section: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle updating multiple configurations
   */
  private async handleUpdateMultipleConfigurations(
    _event: IpcMainInvokeEvent,
    updates: Partial<AppConfiguration>
  ): Promise<IPCResponse<AppConfiguration>> {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update configurations',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to update multiple configurations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle resetting configuration to defaults
   */
  private async handleResetConfiguration(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<AppConfiguration>> {
    try {
      const result = await this.configurationManager.resetConfiguration();

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          ...(result.warnings && { warnings: result.warnings }),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to reset configuration',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle resetting configuration section to defaults
   */
  private async handleResetConfigurationSection(
    _event: IpcMainInvokeEvent,
    section: keyof AppConfiguration
  ): Promise<IPCResponse<AppConfiguration>> {
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
      } else {
        return {
          success: false,
          error: result.error || 'Failed to reset configuration section',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset configuration section: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle validating configuration
   */
  private async handleValidateConfiguration(
    _event: IpcMainInvokeEvent,
    config?: AppConfiguration
  ): Promise<IPCResponse<ConfigurationValidationResult>> {
    try {
      const validation = this.configurationManager.validateConfiguration(config);

      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle exporting configuration
   */
  private async handleExportConfiguration(
    _event: IpcMainInvokeEvent,
    request: ExportConfigurationRequest = {}
  ): Promise<IPCResponse<ConfigurationExportData>> {
    try {
      // Get configuration data
      let configurationToExport: AppConfiguration;

      if (request.sections && request.sections.length > 0) {
        // Export only specified sections
        const fullConfig = this.configurationManager.exportConfiguration();
        configurationToExport = {} as AppConfiguration;

        for (const section of request.sections) {
          if (this.isValidConfigurationSection(section)) {
            (configurationToExport as any)[section] = fullConfig[section];
          }
        }
      } else {
        // Export all configuration
        configurationToExport = this.configurationManager.exportConfiguration();
      }

      // Create export metadata
      const metadata: ConfigurationExportMetadata = {
        exportedAt: new Date().toISOString(),
        appVersion: process.env['APP_VERSION'] || '1.0.0',
        configVersion: '1.0.0',
        source: 'GetWarped Application',
        ...(request.includeMetadata && {
          checksum: this.generateConfigurationChecksum(configurationToExport),
        }),
      };

      const exportData: ConfigurationExportData = {
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
    } catch (error) {
      return {
        success: false,
        error: `Failed to export configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle importing configuration
   */
  private async handleImportConfiguration(
    _event: IpcMainInvokeEvent,
    request: ImportConfigurationRequest
  ): Promise<IPCResponse<AppConfiguration>> {
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
        const configValidation = this.configurationManager.validateConfiguration(
          request.configuration
        );

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
      const result = await this.configurationManager.importConfiguration(
        request.configuration,
        request.mergeStrategy || 'merge'
      );

      if (result.success && result.data) {
        return {
          success: true,
          data: result.data,
          ...(result.warnings && { warnings: result.warnings }),
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to import configuration',
          ...(result.warnings && { warnings: result.warnings }),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle checking if configuration is modified
   */
  private async handleIsConfigurationModified(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<boolean>> {
    try {
      const isModified = this.configurationManager.isConfigurationModified();

      return {
        success: true,
        data: isModified,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check configuration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle getting configuration file path
   */
  private async handleGetConfigurationPath(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<string>> {
    try {
      const configPath = this.configurationManager.getConfigurationPath();

      return {
        success: true,
        data: configPath,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get configuration path: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle adding configuration change listener
   */
  private async handleAddConfigurationListener(
    _event: IpcMainInvokeEvent,
    listenerId: string
  ): Promise<IPCResponse<void>> {
    try {
      // Validate listener ID
      if (!listenerId?.trim()) {
        return {
          success: false,
          error: 'Listener ID is required',
        };
      }

      // Add listener that sends IPC message to renderer
      this.configurationManager.addListener(listenerId, (config: AppConfiguration) => {
        // Send configuration change event to renderer process
        _event.sender.send('config:changed', { listenerId, configuration: config });
      });

      return {
        success: true,
        data: undefined,
        warnings: [`Configuration listener '${listenerId}' added successfully`],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add configuration listener: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Handle removing configuration change listener
   */
  private async handleRemoveConfigurationListener(
    _event: IpcMainInvokeEvent,
    listenerId: string
  ): Promise<IPCResponse<void>> {
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
    } catch (error) {
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
  private validateUpdateConfigurationRequest(request: ConfigurationUpdateRequest): {
    valid: boolean;
    error?: string;
  } {
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
  private validateImportConfigurationRequest(request: ImportConfigurationRequest): {
    valid: boolean;
    error?: string;
  } {
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
  private isValidConfigurationSection(section: string): section is keyof AppConfiguration {
    const validSections: (keyof AppConfiguration)[] = [
      'app',
      'security',
      'privacy',
      'window',
      'workspace',
      'developer',
    ];
    return validSections.includes(section as keyof AppConfiguration);
  }

  /**
   * Generate checksum for configuration data
   */
  private generateConfigurationChecksum(config: AppConfiguration): string {
    const crypto = require('crypto');
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return crypto.createHash('sha256').update(configString).digest('hex');
  }
}

export default ConfigurationHandlers;
