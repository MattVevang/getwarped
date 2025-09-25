/**
 * Configuration Manager
 *
 * Manages application-level configuration, user preferences, and settings.
 * Handles configuration validation, secure storage, and configuration lifecycle.
 *
 * @fileoverview Central configuration management with validation and persistence
 */
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
export declare const DEFAULT_APP_CONFIGURATION: AppConfiguration;
/**
 * ConfigurationManager class for managing application configuration
 */
export declare class ConfigurationManager {
    private store;
    private listeners;
    constructor();
    /**
     * Get the complete configuration
     */
    getConfiguration(): AppConfiguration;
    /**
     * Get a specific configuration section
     */
    getConfigurationSection<K extends keyof AppConfiguration>(section: K): AppConfiguration[K];
    /**
     * Get a specific configuration value
     */
    getConfigurationValue<K extends keyof AppConfiguration>(section: K, key: keyof AppConfiguration[K]): AppConfiguration[K][keyof AppConfiguration[K]];
    /**
     * Update configuration
     */
    updateConfiguration(request: ConfigurationUpdateRequest): Promise<ConfigurationOperationResult>;
    /**
     * Update multiple configuration sections at once
     */
    updateMultipleConfigurations(updates: Partial<AppConfiguration>): Promise<ConfigurationOperationResult>;
    /**
     * Reset configuration to defaults
     */
    resetConfiguration(): Promise<ConfigurationOperationResult>;
    /**
     * Reset a specific configuration section to defaults
     */
    resetConfigurationSection(section: keyof AppConfiguration): Promise<ConfigurationOperationResult>;
    /**
     * Validate complete configuration
     */
    validateConfiguration(config?: AppConfiguration): ConfigurationValidationResult;
    /**
     * Export configuration for backup
     */
    exportConfiguration(): AppConfiguration;
    /**
     * Import configuration from backup
     */
    importConfiguration(config: AppConfiguration, mergeStrategy?: 'replace' | 'merge'): Promise<ConfigurationOperationResult>;
    /**
     * Add configuration change listener
     */
    addListener(id: string, callback: (config: AppConfiguration) => void): void;
    /**
     * Remove configuration change listener
     */
    removeListener(id: string, callback?: (config: AppConfiguration) => void): void;
    /**
     * Check if configuration has been modified from defaults
     */
    isConfigurationModified(): boolean;
    /**
     * Get configuration file path
     */
    getConfigurationPath(): string;
    /**
     * Validate configuration updates
     */
    private validateConfigurationUpdates;
    /**
     * Validate app configuration section
     */
    private validateAppSection;
    /**
     * Validate security configuration section
     */
    private validateSecuritySection;
    /**
     * Validate privacy configuration section
     */
    private validatePrivacySection;
    /**
     * Validate window configuration section
     */
    private validateWindowSection;
    /**
     * Validate workspace configuration section
     */
    private validateWorkspaceSection;
    /**
     * Validate developer configuration section
     */
    private validateDeveloperSection;
    /**
     * Get configuration schema for electron-store
     */
    private getConfigurationSchema;
    /**
     * Notify all configuration change listeners
     */
    private notifyListeners;
}
export default ConfigurationManager;
//# sourceMappingURL=ConfigurationManager.d.ts.map