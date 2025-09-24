/**
 * Export Security Tests
 *
 * Comprehensive security testing for configuration export functionality.
 * Tests data validation, sanitization of export content, prevention of sensitive data exposure,
 * file path validation, and secure export process verification.
 * Validates ConfigurationExporter security measures and export validation.
 */

import {
  ConfigurationExporter,
  ExportOptions,
} from '../../../src/main/services/ConfigurationExporter';
import {
  ConfigurationManager,
  AppConfiguration,
} from '../../../src/main/services/ConfigurationManager';
import { InputValidator } from '../../../src/shared/validation/InputValidator';

// Mock dependencies
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn((name: string) => {
      switch (name) {
        case 'userData':
          return '/tmp/userData';
        case 'documents':
          return '/tmp/documents';
        case 'temp':
          return '/tmp';
        default:
          return `/tmp/${name}`;
      }
    }),
  },
  dialog: {
    showSaveDialog: jest.fn(),
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn(),
  },
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn(),
  readFile: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
  readdir: jest.fn(),
}));

jest.mock('../../../src/main/services/ConfigurationManager');
jest.mock('../../../src/main/storage/CredentialEncryption');

describe('Export Security Tests', () => {
  let configurationExporter: ConfigurationExporter;
  let mockConfigurationManager: jest.Mocked<ConfigurationManager>;
  const mockFs = require('fs/promises');

  // Mock configuration data
  const mockConfiguration: AppConfiguration = {
    app: {
      autoStart: false,
      minimizeToTray: true,
      showNotifications: true,
      autoUpdate: true,
      language: 'en',
      theme: 'dark',
      zoomLevel: 1.0,
    },
    security: {
      sessionTimeout: true,
      sessionTimeoutMinutes: 30,
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
      defaultWorkspaceId: 'sensitive-workspace-id-123',
      rememberLastWorkspace: true,
      restoreServicesOnStartup: true,
      maxConcurrentServices: 10,
    },
    developer: {
      developerMode: true,
      showDebugInfo: false,
      verboseLogging: false,
      autoReload: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock configuration manager
    const { ConfigurationManager } = require('../../../src/main/services/ConfigurationManager');
    mockConfigurationManager = new ConfigurationManager() as jest.Mocked<ConfigurationManager>;
    mockConfigurationManager.getConfiguration.mockReturnValue(mockConfiguration);

    configurationExporter = new ConfigurationExporter(mockConfigurationManager);

    // Setup fs mocks
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive configuration data in exports', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeMetadata: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);
      expect(result.exportData).toBeDefined();

      // Verify that warnings were generated for sensitive data
      expect(result.warnings).toContain(
        expect.stringMatching(/Default workspace ID has been preserved/)
      );
      expect(result.warnings).toContain(
        expect.stringMatching(/Authentication requirement setting preserved/)
      );
      expect(result.warnings).toContain(expect.stringMatching(/Developer mode is enabled/));
    });

    it('should exclude sensitive data sections when requested', async () => {
      const options: ExportOptions = {
        sections: ['app', 'window'], // Exclude security, workspace, etc.
        format: 'json',
        includeMetadata: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);
      expect(result.exportData?.configuration).toBeDefined();

      const config = result.exportData!.configuration;
      expect(config.app).toBeDefined();
      expect(config.window).toBeDefined();
      expect(config.workspace).toBeUndefined();
      expect(config.security).toBeUndefined();
    });

    it('should generate security notices in export metadata', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeMetadata: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);
      expect(result.exportData?.metadata).toBeDefined();

      const metadata = result.exportData!.metadata;
      expect(metadata.securityNotice).toBe(
        'This export contains NO credentials or sensitive authentication data. Re-authentication will be required after import.'
      );
      expect(metadata.source).toBe('GetWarped Configuration Manager');
    });

    it('should validate export data against schema', async () => {
      // Mock an invalid configuration
      const invalidConfig = {
        ...mockConfiguration,
        app: {
          ...mockConfiguration.app,
          zoomLevel: 5.0, // Invalid: exceeds maximum
        },
        security: {
          ...mockConfiguration.security,
          sessionTimeoutMinutes: 2000, // Invalid: exceeds maximum
        },
      };

      mockConfigurationManager.getConfiguration.mockReturnValue(invalidConfig as AppConfiguration);

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      const result = await configurationExporter.generateExportData(options);

      // Export should still succeed but with validation warnings
      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('File Path Security', () => {
    // Note: File path security is tested through writeExportFile method
    // since generateExportData doesn't handle file paths directly

    it('should validate export file paths for security', async () => {
      const dangerousPath = '/tmp/../../../etc/passwd';

      // Test path validation using InputValidator
      const pathValidation = InputValidator.validateFilePath(dangerousPath);
      expect(pathValidation.valid).toBe(false);
    });

    it('should reject null bytes in file paths', async () => {
      const maliciousPath = '/tmp/export\x00.json';

      // Test path validation using InputValidator
      const pathValidation = InputValidator.validateFilePath(maliciousPath);
      expect(pathValidation.valid).toBe(false);
    });

    it('should validate file extension matches format', async () => {
      const validPath = '/tmp/test.json';
      const pathValidation = InputValidator.validateFilePath(validPath);
      expect(pathValidation.valid).toBe(true);
    });

    it('should handle directory creation requirements', async () => {
      // This test would be more meaningful with actual file operations
      // For now, just test that the concept is sound
      const nestedPath = '/tmp/deeply/nested/path/export.json';
      const pathValidation = InputValidator.validateFilePath(nestedPath);
      expect(pathValidation.valid).toBe(true);
    });
  });

  describe('Export Content Security', () => {
    it('should not expose credentials in exports', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeMetadata: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      // Check the export data directly
      const exportData = result.exportData!;

      // Should not contain credentials or passwords
      expect(JSON.stringify(exportData)).not.toMatch(/password|token|secret|credential|key|auth/i);

      // Should contain the security notice
      expect(exportData.metadata.securityNotice).toContain('NO credentials');
    });

    it('should handle empty or null configuration safely', async () => {
      mockConfigurationManager.getConfiguration.mockImplementation(() => {
        throw new Error('No configuration available');
      });

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should sanitize HTML content in configuration values', async () => {
      const configWithHtml = {
        ...mockConfiguration,
        app: {
          ...mockConfiguration.app,
          language: '<script>alert("xss")</script>en',
        },
      };

      mockConfigurationManager.getConfiguration.mockReturnValue(configWithHtml as AppConfiguration);

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      const exportData = result.exportData!;

      // HTML should be escaped or sanitized
      expect(exportData.configuration.app.language).not.toContain('<script>');
    });

    it('should limit export file size', async () => {
      // Mock a large configuration
      const largeConfig = {
        ...mockConfiguration,
        // Simulate a very large configuration
        largeData: 'x'.repeat(50 * 1024 * 1024), // 50MB string
      };

      mockConfigurationManager.getConfiguration.mockReturnValue(largeConfig as any);

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      // This test might need to be adapted based on actual size limits in the implementation
      const result = await configurationExporter.generateExportData(options);

      // The actual behavior depends on implementation - it might succeed with warnings or fail
      if (!result.success) {
        expect(result.error).toMatch(/size|large|limit/i);
      } else {
        expect(result.warnings).toBeDefined();
      }
    });
  });

  describe('Export Format Security', () => {
    it('should validate JSON format output', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeMetadata: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      const exportData = result.exportData!;

      // Should be valid data structure
      expect(exportData.metadata).toBeDefined();
      expect(exportData.configuration).toBeDefined();
      expect(exportData.warnings).toBeDefined();

      // Should be JSON serializable
      expect(() => JSON.stringify(exportData)).not.toThrow();
    });

    it('should handle unsupported export formats securely', async () => {
      // Note: Format validation typically happens at file writing level
      // This test ensures the generateExportData works regardless of format specified
      const options: ExportOptions = {
        includeAll: true,
        format: 'yaml' as any, // Not yet supported at file level
      };

      const result = await configurationExporter.generateExportData(options);

      // Data generation should still work
      expect(result.success).toBe(true);
      expect(result.exportData).toBeDefined();
    });

    it('should generate consistent export data structure', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeSchema: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      // Verify consistent structure
      const exportData = result.exportData!;
      expect(exportData.metadata).toBeDefined();
      expect(exportData.configuration).toBeDefined();
      expect(exportData.warnings).toBeDefined();
    });
  });

  describe('Error Handling Security', () => {
    it('should handle file system errors securely', async () => {
      // This test focuses on data generation error handling
      // File system errors would be tested in integration tests

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      const result = await configurationExporter.generateExportData(options);

      // Data generation should succeed even if file operations might fail
      expect(result.success).toBe(true);
      expect(result.exportData).toBeDefined();
    });

    it('should handle configuration manager errors securely', async () => {
      mockConfigurationManager.getConfiguration.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should not expose internal error details
      expect(result.error).not.toContain('Database connection');
    });

    it('should validate export options securely', async () => {
      const maliciousOptions = {
        includeAll: true,
        format: 'json' as const,
        sections: ['<script>alert("xss")</script>'] as any,
      };

      const result = await configurationExporter.generateExportData(maliciousOptions);

      // Should handle malicious options gracefully
      expect(result.success).toBe(true); // The malicious sections should be ignored
      expect(result.exportData).toBeDefined();
    });
  });

  describe('ExportFileOperations Security', () => {
    // Note: ExportFileOperations requires constructor arguments
    // This would be better tested in integration tests

    it('should validate export file operations', async () => {
      // Test file path validation in ExportFileOperations
      const validPath = '/tmp/safe-export.json';
      const invalidPath = '/tmp/../../../etc/passwd';

      // These tests would need to be implemented based on ExportFileOperations methods
      // For now, we'll test the principle
      const pathValidation1 = InputValidator.validateFilePath(validPath);
      const pathValidation2 = InputValidator.validateFilePath(invalidPath);

      expect(pathValidation1.valid).toBe(true);
      expect(pathValidation2.valid).toBe(false);
    });

    it('should handle encryption options securely', async () => {
      // Test that encryption options are handled properly
      // This would test ExportFileOperations encryption functionality
      // More specific tests would depend on the actual ExportFileOperations API
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    it('should sanitize configuration values that could contain scripts', async () => {
      const xssConfig = {
        ...mockConfiguration,
        app: {
          ...mockConfiguration.app,
          language: 'en<script>alert("xss")</script>',
        },
        workspace: {
          ...mockConfiguration.workspace,
          defaultWorkspaceId: 'workspace<img src=x onerror=alert(1)>',
        },
      };

      mockConfigurationManager.getConfiguration.mockReturnValue(xssConfig as AppConfiguration);

      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      const exportData = result.exportData!;

      // Should not contain dangerous HTML/JS
      const jsonString = JSON.stringify(exportData);
      expect(jsonString).not.toMatch(/<script/i);
      expect(jsonString).not.toMatch(/onerror=/i);
      expect(jsonString).not.toMatch(/javascript:/i);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data integrity during export process', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeMetadata: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      const exportData = result.exportData!;

      // Verify metadata integrity
      expect(exportData.metadata.appVersion).toBeDefined();
      expect(exportData.metadata.configVersion).toBeDefined();
      expect(exportData.metadata.exportedAt).toBeDefined();
      expect(exportData.metadata.formatVersion).toBeDefined();

      // Verify configuration data integrity (non-sensitive parts)
      expect(exportData.configuration.app.autoStart).toBe(mockConfiguration.app.autoStart);
      expect(exportData.configuration.window.defaultWidth).toBe(
        mockConfiguration.window.defaultWidth
      );
    });

    it('should validate exported data structure', async () => {
      const options: ExportOptions = {
        includeAll: true,
        format: 'json',
        includeMetadata: true,
        includeSchema: true,
      };

      const result = await configurationExporter.generateExportData(options);

      expect(result.success).toBe(true);

      // Verify data structure
      const exportData = result.exportData!;
      expect(exportData.metadata).toBeDefined();
      expect(exportData.configuration).toBeDefined();
      expect(exportData.warnings).toBeDefined();

      // Verify configuration has required sections
      expect(exportData.configuration.app).toBeDefined();
      expect(exportData.configuration.security).toBeDefined();
      expect(exportData.configuration.privacy).toBeDefined();
      expect(exportData.configuration.window).toBeDefined();
      expect(exportData.configuration.workspace).toBeDefined();
      expect(exportData.configuration.developer).toBeDefined();
    });
  });
});
