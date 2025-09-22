/**
 * Configuration Manager
 *
 * Manages application-level configuration, user preferences, and settings.
 * Handles configuration validation, secure storage, and configuration lifecycle.
 *
 * @fileoverview Central configuration management with validation and persistence
 */

import Store from 'electron-store';
import { InputValidator, Validators } from '../../shared/validation/InputValidator';

/**
 * Application configuration interface
 */
export interface AppConfiguration {
  /** Application general settings */
  app: {
    /** Auto-start application on system boot */
    autoStart: boolean;
    /** Minimize to system tray on close */
    minimizeToTray: boolean;
    /** Show notifications */
    showNotifications: boolean;
    /** Check for updates automatically */
    autoUpdate: boolean;
    /** Application language */
    language: string;
    /** Application theme */
    theme: 'light' | 'dark' | 'system';
    /** Zoom level for application UI */
    zoomLevel: number;
  };

  /** Security settings */
  security: {
    /** Enable session timeout */
    sessionTimeout: boolean;
    /** Session timeout duration in minutes */
    sessionTimeoutMinutes: number;
    /** Require authentication on startup */
    requireAuth: boolean;
    /** Enable secure browsing mode */
    secureBrowsing: boolean;
    /** Clear session data on exit */
    clearDataOnExit: boolean;
  };

  /** Privacy settings */
  privacy: {
    /** Enable telemetry */
    telemetry: boolean;
    /** Enable crash reporting */
    crashReporting: boolean;
    /** Enable usage analytics */
    usageAnalytics: boolean;
    /** Clear browsing data periodically */
    autoClearData: boolean;
    /** Auto-clear data interval in days */
    autoClearDays: number;
  };

  /** Window settings */
  window: {
    /** Remember window size and position */
    rememberBounds: boolean;
    /** Default window width */
    defaultWidth: number;
    /** Default window height */
    defaultHeight: number;
    /** Always on top */
    alwaysOnTop: boolean;
    /** Show window in taskbar */
    showInTaskbar: boolean;
  };

  /** Workspace settings */
  workspace: {
    /** Default workspace ID */
    defaultWorkspaceId?: string;
    /** Remember last active workspace */
    rememberLastWorkspace: boolean;
    /** Restore services on startup */
    restoreServicesOnStartup: boolean;
    /** Maximum concurrent services */
    maxConcurrentServices: number;
  };

  /** Developer settings */
  developer: {
    /** Enable developer mode */
    developerMode: boolean;
    /** Show debug information */
    showDebugInfo: boolean;
    /** Enable verbose logging */
    verboseLogging: boolean;
    /** Auto-reload on file changes */
    autoReload: boolean;
  };
}

/**
 * Configuration update request interface
 */
export interface ConfigurationUpdateRequest {
  /** Configuration section to update */
  section: keyof AppConfiguration;
  /** Updates to apply */
  updates: Partial<AppConfiguration[keyof AppConfiguration]>;
}

/**
 * Configuration operation result
 */
export interface ConfigurationOperationResult<T = AppConfiguration> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result data (present on success) */
  data?: T;
  /** Error message (present on failure) */
  error?: string;
  /** Warning messages for non-critical issues */
  warnings?: string[];
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Validation errors by section */
  errors: Record<string, string[]>;
  /** Validation warnings by section */
  warnings: Record<string, string[]>;
}

/**
 * Default application configuration
 */
export const DEFAULT_APP_CONFIGURATION: AppConfiguration = {
  app: {
    autoStart: false,
    minimizeToTray: true,
    showNotifications: true,
    autoUpdate: true,
    language: 'en',
    theme: 'system',
    zoomLevel: 1.0,
  },
  security: {
    sessionTimeout: true,
    sessionTimeoutMinutes: 120,
    requireAuth: false,
    secureBrowsing: true,
    clearDataOnExit: false,
  },
  privacy: {
    telemetry: false,
    crashReporting: true,
    usageAnalytics: false,
    autoClearData: false,
    autoClearDays: 30,
  },
  window: {
    rememberBounds: true,
    defaultWidth: 1200,
    defaultHeight: 800,
    alwaysOnTop: false,
    showInTaskbar: true,
  },
  workspace: {
    rememberLastWorkspace: true,
    restoreServicesOnStartup: true,
    maxConcurrentServices: 10,
  },
  developer: {
    developerMode: false,
    showDebugInfo: false,
    verboseLogging: false,
    autoReload: false,
  },
};

/**
 * ConfigurationManager class for managing application configuration
 */
export class ConfigurationManager {
  private store: Store<AppConfiguration>;
  private listeners: Map<string, ((config: AppConfiguration) => void)[]>;

  constructor() {
    // Initialize electron-store with schema validation
    this.store = new Store<AppConfiguration>({
      name: 'app-config',
      defaults: DEFAULT_APP_CONFIGURATION,
      schema: this.getConfigurationSchema(),
    });

    this.listeners = new Map();
  }

  /**
   * Get the complete configuration
   */
  getConfiguration(): AppConfiguration {
    return this.store.store;
  }

  /**
   * Get a specific configuration section
   */
  getConfigurationSection<K extends keyof AppConfiguration>(section: K): AppConfiguration[K] {
    return this.store.get(section);
  }

  /**
   * Get a specific configuration value
   */
  getConfigurationValue<K extends keyof AppConfiguration>(
    section: K,
    key: keyof AppConfiguration[K]
  ): AppConfiguration[K][keyof AppConfiguration[K]] {
    const sectionConfig = this.store.get(section);
    return sectionConfig[key];
  }

  /**
   * Update configuration
   */
  async updateConfiguration(
    request: ConfigurationUpdateRequest
  ): Promise<ConfigurationOperationResult> {
    try {
      // Validate the updates
      const validation = this.validateConfigurationUpdates(request);
      if (!validation.valid) {
        return {
          success: false,
          error: `Configuration validation failed: ${Object.values(validation.errors).flat().join(', ')}`,
        };
      }

      // Get current section configuration
      const currentSection = this.store.get(request.section);

      // Merge updates
      const updatedSection = {
        ...currentSection,
        ...request.updates,
      };

      // Apply the updates
      this.store.set(request.section, updatedSection);

      // Notify listeners
      this.notifyListeners();

      const result: ConfigurationOperationResult = {
        success: true,
        data: this.getConfiguration(),
      };

      if (Object.keys(validation.warnings).length > 0) {
        result.warnings = Object.values(validation.warnings).flat();
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update multiple configuration sections at once
   */
  async updateMultipleConfigurations(
    updates: Partial<AppConfiguration>
  ): Promise<ConfigurationOperationResult> {
    try {
      // Validate all updates
      const allErrors: string[] = [];
      const allWarnings: string[] = [];

      for (const [section, sectionUpdates] of Object.entries(updates)) {
        const validation = this.validateConfigurationUpdates({
          section: section as keyof AppConfiguration,
          updates: sectionUpdates as Partial<AppConfiguration[keyof AppConfiguration]>,
        });

        if (!validation.valid) {
          allErrors.push(...Object.values(validation.errors).flat());
        }
        allWarnings.push(...Object.values(validation.warnings).flat());
      }

      if (allErrors.length > 0) {
        return {
          success: false,
          error: `Configuration validation failed: ${allErrors.join(', ')}`,
        };
      }

      // Apply all updates
      for (const [section, sectionUpdates] of Object.entries(updates)) {
        const currentSection = this.store.get(section as keyof AppConfiguration);
        const updatedSection = {
          ...currentSection,
          ...sectionUpdates,
        };
        this.store.set(section as keyof AppConfiguration, updatedSection);
      }

      // Notify listeners
      this.notifyListeners();

      const result: ConfigurationOperationResult = {
        success: true,
        data: this.getConfiguration(),
      };

      if (allWarnings.length > 0) {
        result.warnings = allWarnings;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to update configurations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfiguration(): Promise<ConfigurationOperationResult> {
    try {
      this.store.clear();
      this.notifyListeners();

      return {
        success: true,
        data: this.getConfiguration(),
        warnings: ['Configuration has been reset to default values'],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Reset a specific configuration section to defaults
   */
  async resetConfigurationSection(
    section: keyof AppConfiguration
  ): Promise<ConfigurationOperationResult> {
    try {
      const defaultSection = DEFAULT_APP_CONFIGURATION[section];
      this.store.set(section, defaultSection);
      this.notifyListeners();

      return {
        success: true,
        data: this.getConfiguration(),
        warnings: [`${section} configuration has been reset to default values`],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset ${section} configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate complete configuration
   */
  validateConfiguration(
    config: AppConfiguration = this.getConfiguration()
  ): ConfigurationValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    // Validate app section
    const appErrors = this.validateAppSection(config.app);
    if (appErrors.length > 0) {
      errors['app'] = appErrors;
    }

    // Validate security section
    const securityErrors = this.validateSecuritySection(config.security);
    if (securityErrors.length > 0) {
      errors['security'] = securityErrors;
    }

    // Validate privacy section
    const privacyErrors = this.validatePrivacySection(config.privacy);
    if (privacyErrors.length > 0) {
      errors['privacy'] = privacyErrors;
    }

    // Validate window section
    const windowErrors = this.validateWindowSection(config.window);
    if (windowErrors.length > 0) {
      errors['window'] = windowErrors;
    }

    // Validate workspace section
    const workspaceErrors = this.validateWorkspaceSection(config.workspace);
    if (workspaceErrors.length > 0) {
      errors['workspace'] = workspaceErrors;
    }

    // Validate developer section
    const developerErrors = this.validateDeveloperSection(config.developer);
    if (developerErrors.length > 0) {
      errors['developer'] = developerErrors;
    }

    // Add warnings for potentially problematic settings
    if (config.security.sessionTimeoutMinutes < 30) {
      if (!warnings['security']) warnings['security'] = [];
      warnings['security'].push('Session timeout less than 30 minutes may be too short');
    }

    if (config.workspace.maxConcurrentServices > 20) {
      if (!warnings['workspace']) warnings['workspace'] = [];
      warnings['workspace'].push('High concurrent service limit may impact performance');
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export configuration for backup
   */
  exportConfiguration(): AppConfiguration {
    return this.getConfiguration();
  }

  /**
   * Import configuration from backup
   */
  async importConfiguration(
    config: AppConfiguration,
    mergeStrategy: 'replace' | 'merge' = 'merge'
  ): Promise<ConfigurationOperationResult> {
    try {
      // Validate imported configuration
      const validation = this.validateConfiguration(config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid configuration: ${Object.values(validation.errors).flat().join(', ')}`,
        };
      }

      if (mergeStrategy === 'replace') {
        // Replace entire configuration
        this.store.clear();
        this.store.store = config;
      } else {
        // Merge with existing configuration
        for (const [section, sectionConfig] of Object.entries(config)) {
          const currentSection = this.store.get(section as keyof AppConfiguration);
          const mergedSection = {
            ...currentSection,
            ...sectionConfig,
          };
          this.store.set(section as keyof AppConfiguration, mergedSection);
        }
      }

      // Notify listeners
      this.notifyListeners();

      const warnings =
        Object.keys(validation.warnings).length > 0
          ? Object.values(validation.warnings).flat()
          : ['Configuration imported successfully'];

      return {
        success: true,
        data: this.getConfiguration(),
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Add configuration change listener
   */
  addListener(id: string, callback: (config: AppConfiguration) => void): void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, []);
    }
    this.listeners.get(id)!.push(callback);
  }

  /**
   * Remove configuration change listener
   */
  removeListener(id: string, callback?: (config: AppConfiguration) => void): void {
    if (!this.listeners.has(id)) {
      return;
    }

    if (callback) {
      const callbacks = this.listeners.get(id)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(id);
    }
  }

  /**
   * Check if configuration has been modified from defaults
   */
  isConfigurationModified(): boolean {
    const current = this.getConfiguration();
    return JSON.stringify(current) !== JSON.stringify(DEFAULT_APP_CONFIGURATION);
  }

  /**
   * Get configuration file path
   */
  getConfigurationPath(): string {
    return this.store.path;
  }

  // Private helper methods

  /**
   * Validate configuration updates
   */
  private validateConfigurationUpdates(
    request: ConfigurationUpdateRequest
  ): ConfigurationValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    switch (request.section) {
      case 'app': {
        const appErrors = this.validateAppSection(
          request.updates as Partial<AppConfiguration['app']>
        );
        if (appErrors.length > 0) {
          errors['app'] = appErrors;
        }
        break;
      }

      case 'security': {
        const securityErrors = this.validateSecuritySection(
          request.updates as Partial<AppConfiguration['security']>
        );
        if (securityErrors.length > 0) {
          errors['security'] = securityErrors;
        }
        break;
      }

      case 'privacy': {
        const privacyErrors = this.validatePrivacySection(
          request.updates as Partial<AppConfiguration['privacy']>
        );
        if (privacyErrors.length > 0) {
          errors['privacy'] = privacyErrors;
        }
        break;
      }

      case 'window': {
        const windowErrors = this.validateWindowSection(
          request.updates as Partial<AppConfiguration['window']>
        );
        if (windowErrors.length > 0) {
          errors['window'] = windowErrors;
        }
        break;
      }

      case 'workspace': {
        const workspaceErrors = this.validateWorkspaceSection(
          request.updates as Partial<AppConfiguration['workspace']>
        );
        if (workspaceErrors.length > 0) {
          errors['workspace'] = workspaceErrors;
        }
        break;
      }

      case 'developer': {
        const developerErrors = this.validateDeveloperSection(
          request.updates as Partial<AppConfiguration['developer']>
        );
        if (developerErrors.length > 0) {
          errors['developer'] = developerErrors;
        }
        break;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate app configuration section
   */
  private validateAppSection(app: Partial<AppConfiguration['app']>): string[] {
    const errors: string[] = [];

    if (app.language !== undefined) {
      const languageValidation = InputValidator.validateText(app.language, {
        minLength: 2,
        maxLength: 5,
        pattern: /^[a-z]{2}(-[A-Z]{2})?$/,
      });
      if (!languageValidation.valid) {
        errors.push(`Invalid language code: ${languageValidation.error}`);
      }
    }

    if (app.theme !== undefined && !['light', 'dark', 'system'].includes(app.theme)) {
      errors.push('Theme must be one of: light, dark, system');
    }

    if (app.zoomLevel !== undefined && (app.zoomLevel < 0.5 || app.zoomLevel > 3.0)) {
      errors.push('Zoom level must be between 0.5 and 3.0');
    }

    return errors;
  }

  /**
   * Validate security configuration section
   */
  private validateSecuritySection(security: Partial<AppConfiguration['security']>): string[] {
    const errors: string[] = [];

    if (security.sessionTimeoutMinutes !== undefined) {
      if (security.sessionTimeoutMinutes < 5 || security.sessionTimeoutMinutes > 1440) {
        errors.push('Session timeout must be between 5 and 1440 minutes');
      }
    }

    return errors;
  }

  /**
   * Validate privacy configuration section
   */
  private validatePrivacySection(privacy: Partial<AppConfiguration['privacy']>): string[] {
    const errors: string[] = [];

    if (privacy.autoClearDays !== undefined) {
      if (privacy.autoClearDays < 1 || privacy.autoClearDays > 365) {
        errors.push('Auto-clear days must be between 1 and 365');
      }
    }

    return errors;
  }

  /**
   * Validate window configuration section
   */
  private validateWindowSection(window: Partial<AppConfiguration['window']>): string[] {
    const errors: string[] = [];

    if (window.defaultWidth !== undefined) {
      if (window.defaultWidth < 400 || window.defaultWidth > 4000) {
        errors.push('Default width must be between 400 and 4000 pixels');
      }
    }

    if (window.defaultHeight !== undefined) {
      if (window.defaultHeight < 300 || window.defaultHeight > 3000) {
        errors.push('Default height must be between 300 and 3000 pixels');
      }
    }

    return errors;
  }

  /**
   * Validate workspace configuration section
   */
  private validateWorkspaceSection(workspace: Partial<AppConfiguration['workspace']>): string[] {
    const errors: string[] = [];

    if (workspace.maxConcurrentServices !== undefined) {
      if (workspace.maxConcurrentServices < 1 || workspace.maxConcurrentServices > 50) {
        errors.push('Max concurrent services must be between 1 and 50');
      }
    }

    if (workspace.defaultWorkspaceId !== undefined && workspace.defaultWorkspaceId) {
      const uuidValidation = Validators.validateUUID(workspace.defaultWorkspaceId);
      if (!uuidValidation.valid) {
        errors.push(`Invalid default workspace ID: ${uuidValidation.error}`);
      }
    }

    return errors;
  }

  /**
   * Validate developer configuration section
   */
  private validateDeveloperSection(_developer: Partial<AppConfiguration['developer']>): string[] {
    // Developer section typically has boolean flags that don't need complex validation
    return [];
  }

  /**
   * Get configuration schema for electron-store
   */
  private getConfigurationSchema(): any {
    return {
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
      },
      security: {
        type: 'object',
        properties: {
          sessionTimeout: { type: 'boolean' },
          sessionTimeoutMinutes: { type: 'number', minimum: 5, maximum: 1440 },
          requireAuth: { type: 'boolean' },
          secureBrowsing: { type: 'boolean' },
          clearDataOnExit: { type: 'boolean' },
        },
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
      },
      workspace: {
        type: 'object',
        properties: {
          defaultWorkspaceId: { type: ['string', 'null'] },
          rememberLastWorkspace: { type: 'boolean' },
          restoreServicesOnStartup: { type: 'boolean' },
          maxConcurrentServices: { type: 'number', minimum: 1, maximum: 50 },
        },
      },
      developer: {
        type: 'object',
        properties: {
          developerMode: { type: 'boolean' },
          showDebugInfo: { type: 'boolean' },
          verboseLogging: { type: 'boolean' },
          autoReload: { type: 'boolean' },
        },
      },
    };
  }

  /**
   * Notify all configuration change listeners
   */
  private notifyListeners(): void {
    const config = this.getConfiguration();
    for (const callbacks of this.listeners.values()) {
      callbacks.forEach(callback => {
        try {
          callback(config);
        } catch (error) {
          // Silently handle listener errors to avoid disrupting other listeners
          // In production, this would be logged to application logs
        }
      });
    }
  }
}

export default ConfigurationManager;
