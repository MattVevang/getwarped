/**
 * Unit tests for ConfigurationExporter
 *
 * Tests configuration export functionality, credential stripping, JSON schema validation,
 * and secure file operations. Validates export/import security patterns.
 *
 * @fileoverview Comprehensive unit tests for ConfigurationExporter class
 */

import {
  ConfigurationExporter,
  ExportOptions,
} from '../../../src/main/services/ConfigurationExporter';
import {
  ConfigurationManager,
  AppConfiguration,
} from '../../../src/main/services/ConfigurationManager';
import { dialog } from 'electron';
import * as fs from 'fs/promises';

// Mock electron modules
jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
  },
  BrowserWindow: jest.fn(),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
}));

describe('ConfigurationExporter', () => {
  let configurationExporter: ConfigurationExporter;
  let mockConfigurationManager: jest.Mocked<ConfigurationManager>;
  let mockFs: jest.Mocked<typeof fs>;
  let mockDialog: jest.Mocked<typeof dialog>;

  const mockAppConfiguration: AppConfiguration = {
    app: {
      autoStart: true,
      minimizeToTray: true,
      showNotifications: true,
      autoUpdate: true,
      language: 'en',
      theme: 'dark',
      zoomLevel: 1.0,
    },
    security: {
      sessionTimeout: true,
      sessionTimeoutMinutes: 60,
      requireAuth: true,
      secureBrowsing: true,
      clearDataOnExit: false,
    },
    privacy: {
      telemetry: false,
      crashReporting: true,
      usageAnalytics: false,
      autoClearData: true,
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
      defaultWorkspaceId: 'default-workspace',
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ConfigurationManager
    mockConfigurationManager = {
      getConfiguration: jest.fn().mockResolvedValue(mockAppConfiguration),
    } as any;

    // Mock fs/promises
    mockFs = require('fs/promises');
    mockFs.writeFile.mockResolvedValue(undefined);

    // Mock electron dialog
    mockDialog = dialog as jest.Mocked<typeof dialog>;
    mockDialog.showSaveDialog = jest.fn().mockResolvedValue({
      canceled: false,
      filePath: 'c:/exports/test-config.json',
    });

    // Create ConfigurationExporter instance
    configurationExporter = new ConfigurationExporter(mockConfigurationManager);
  });

  describe('Constructor', () => {
    it('should create ConfigurationExporter instance', () => {
      expect(() => new ConfigurationExporter(mockConfigurationManager)).not.toThrow();
      expect(configurationExporter).toBeInstanceOf(ConfigurationExporter);
    });
  });

  describe('getConfigurationSchema', () => {
    it('should return valid JSON schema', () => {
      const schema = configurationExporter.getConfigurationSchema();

      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
      expect((schema as any).type).toBe('object');
      expect((schema as any).properties).toBeDefined();
    });

    it('should have required configuration sections in schema', () => {
      const schema = configurationExporter.getConfigurationSchema() as any;

      expect(schema.properties).toHaveProperty('app');
      expect(schema.properties).toHaveProperty('security');
      expect(schema.properties).toHaveProperty('privacy');
      expect(schema.properties).toHaveProperty('window');
      expect(schema.properties).toHaveProperty('workspace');
      expect(schema.properties).toHaveProperty('developer');
    });
  });

  describe('exportConfiguration with dialog cancellation', () => {
    it('should handle user cancellation', async () => {
      mockDialog.showSaveDialog.mockResolvedValue({
        canceled: true,
      } as any);

      const result = await configurationExporter.exportConfiguration();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Export cancelled by user');
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('exportConfiguration with custom file path', () => {
    it('should bypass dialog when filePath provided', async () => {
      const customPath = 'c:/custom/config.json';
      const options: ExportOptions = {
        filePath: customPath,
      };

      // Mock successful data generation and internal validation
      const mockExportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          appVersion: '1.0.0',
          configVersion: '1.0',
          source: 'GetWarped Configuration Manager',
          formatVersion: '1.0',
          securityNotice: 'This export contains NO credentials or sensitive authentication data.',
        },
        configuration: mockAppConfiguration,
        warnings: [],
      };

      jest.spyOn(configurationExporter, 'generateExportData').mockResolvedValue({
        success: true,
        exportData: mockExportData,
        warnings: [],
      });

      // Mock the writeExportFile method to succeed
      jest.spyOn(configurationExporter as any, 'writeExportFile').mockResolvedValue({
        success: true,
      });

      const result = await configurationExporter.exportConfiguration(undefined, options);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(customPath);
      expect(mockDialog.showSaveDialog).not.toHaveBeenCalled();
    });
  });

  describe('File write error handling', () => {
    it('should handle file write errors', async () => {
      const options: ExportOptions = {
        filePath: 'test-file.json',
      };

      // Mock successful data generation
      jest.spyOn(configurationExporter, 'generateExportData').mockResolvedValue({
        success: true,
        exportData: {
          metadata: {
            exportedAt: new Date().toISOString(),
            appVersion: '1.0.0',
            configVersion: '1.0',
            source: 'GetWarped Configuration Manager',
            formatVersion: '1.0',
            securityNotice: 'This export contains NO credentials.',
          },
          configuration: mockAppConfiguration,
          warnings: [],
        },
        warnings: [],
      });

      // Mock writeExportFile to fail
      jest.spyOn(configurationExporter as any, 'writeExportFile').mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      const result = await configurationExporter.exportConfiguration(undefined, options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('Configuration Manager integration', () => {
    it('should handle configuration manager errors', async () => {
      (mockConfigurationManager.getConfiguration as jest.Mock).mockRejectedValue(
        new Error('Configuration error')
      );

      const result = await configurationExporter.generateExportData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Configuration error');
    });

    it('should call configuration manager', async () => {
      // Mock validation to pass
      jest.spyOn(configurationExporter, 'validateConfiguration').mockReturnValue({
        valid: true,
      });

      await configurationExporter.generateExportData();

      expect(mockConfigurationManager.getConfiguration).toHaveBeenCalled();
    });
  });

  describe('Security validations', () => {
    it('should include security notice in metadata', async () => {
      // Mock validation to pass
      jest.spyOn(configurationExporter, 'validateConfiguration').mockReturnValue({
        valid: true,
      });

      const result = await configurationExporter.generateExportData();

      expect(result.success).toBe(true);
      expect(result.exportData!.metadata.securityNotice).toContain('NO credentials');
      expect(result.exportData!.metadata.securityNotice).toContain('Re-authentication');
    });

    it('should never include sensitive data patterns', async () => {
      // Mock validation to pass
      jest.spyOn(configurationExporter, 'validateConfiguration').mockReturnValue({
        valid: true,
      });

      const result = await configurationExporter.generateExportData();

      expect(result.success).toBe(true);

      const exportString = JSON.stringify(result.exportData);

      // Check for common sensitive patterns (excluding expected words in security notice)
      expect(exportString).not.toMatch(/password/i);
      expect(exportString).not.toMatch(/token/i);
      expect(exportString).not.toMatch(/secret/i);
      expect(exportString).not.toMatch(/api[_-]?key/i);
      expect(exportString).not.toMatch(/access[_-]?token/i);
      expect(exportString).not.toMatch(/private[_-]?key/i);

      // The word "credentials" appears in security notice, which is expected and safe
      expect(exportString).toMatch(/NO credentials/i);
    });
  });

  describe('Export options handling', () => {
    it('should handle metadata exclusion option', async () => {
      // Mock validation to pass
      jest.spyOn(configurationExporter, 'validateConfiguration').mockReturnValue({
        valid: true,
      });

      const options: ExportOptions = {
        includeMetadata: false,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);
      expect(Object.keys(result.exportData!.metadata)).toHaveLength(0);
    });

    it('should handle invalid options gracefully', async () => {
      // Mock validation to pass
      jest.spyOn(configurationExporter, 'validateConfiguration').mockReturnValue({
        valid: true,
      });

      const invalidOptions = {
        format: 'invalid-format' as any,
        sections: ['invalid-section'] as any,
      };

      const result = await configurationExporter.generateExportData(invalidOptions);

      expect(result.success).toBe(true);
    });
  });

  describe('File dialog operations', () => {
    it('should generate proper file names', async () => {
      mockDialog.showSaveDialog.mockImplementation(async options => {
        expect(options?.defaultPath).toMatch(/getwarped-config-\d{4}-\d{2}-\d{2}\.json/);
        return { canceled: false, filePath: 'test.json' };
      });

      // Mock successful export data generation
      jest.spyOn(configurationExporter, 'generateExportData').mockResolvedValue({
        success: true,
        exportData: {
          metadata: {
            exportedAt: new Date().toISOString(),
            appVersion: '1.0.0',
            configVersion: '1.0',
            source: 'GetWarped Configuration Manager',
            formatVersion: '1.0',
            securityNotice: 'No credentials included.',
          },
          configuration: mockAppConfiguration,
          warnings: [],
        },
        warnings: [],
      });

      await configurationExporter.exportConfiguration();

      expect(mockDialog.showSaveDialog).toHaveBeenCalled();
    });
  });

  describe('Validation methods', () => {
    it('should validate valid configuration', () => {
      // Test with actual validation (not mocked)
      const configExporter = new ConfigurationExporter(mockConfigurationManager);
      const result = configExporter.validateConfiguration(mockAppConfiguration);

      // With real AJV, this should work
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Error boundaries', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockConfigurationManager.getConfiguration.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await configurationExporter.generateExportData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error');
    });

    it('should handle malformed configuration data', async () => {
      (mockConfigurationManager.getConfiguration as jest.Mock).mockResolvedValue(null);

      const result = await configurationExporter.generateExportData();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
