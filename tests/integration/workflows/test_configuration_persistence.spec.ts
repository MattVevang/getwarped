/**
 * Integration test for configuration persistence flows
 * Tests: export configuration → modify data → import with different merge strategies → validate results
 */

import { ipcRenderer } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// TODO: Import types from @shared/types/IPCContracts once implemented
interface CreateWorkspaceRequest {
  name: string;
  theme?: 'light' | 'dark' | 'system';
  icon?: string;
  isDefault?: boolean;
}

interface CreateServiceRequest {
  name: string;
  url: string;
  workspaceId: string;
  icon?: string;
  iconType?: 'emoji' | 'url' | 'file';
}

interface ExportConfigurationRequest {
  filePath: string;
  includeSettings: boolean;
  includeWorkspaces: boolean;
  includeServices: boolean;
}

interface ImportConfigurationRequest {
  filePath: string;
  mergeStrategy: 'replace' | 'merge' | 'skip-duplicates';
}

describe('Integration Test: Configuration Persistence', () => {
  let testWorkspaceIds: string[] = [];
  let testServiceIds: string[] = [];
  let testExportPath: string;
  let testImportPath: string;

  beforeAll(() => {
    // Setup test file paths
    testExportPath = path.join(process.cwd(), 'test-export.json');
    testImportPath = path.join(process.cwd(), 'test-import.json');
  });

  beforeEach(() => {
    // Reset state for each test
    testWorkspaceIds = [];
    testServiceIds = [];
  });

  afterEach(async () => {
    // Cleanup any created resources
    for (const serviceId of testServiceIds) {
      try {
        await ipcRenderer.invoke('service:delete', { serviceId });
      } catch (error) {
        // Expected to fail until implementation
      }
    }

    for (const workspaceId of testWorkspaceIds) {
      try {
        await ipcRenderer.invoke('workspace:delete', { workspaceId });
      } catch (error) {
        // Expected to fail until implementation
      }
    }

    // Cleanup test files
    try {
      if (fs.existsSync(testExportPath)) {
        fs.unlinkSync(testExportPath);
      }
      if (fs.existsSync(testImportPath)) {
        fs.unlinkSync(testImportPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Complete Export-Import Cycle', () => {
    it('should handle full configuration export and import successfully', async () => {
      // STEP 1: Create Test Configuration
      const workspace1Request: CreateWorkspaceRequest = {
        name: 'Export Test Workspace 1',
        theme: 'light',
        icon: '🏢',
        isDefault: true,
      };

      const workspace2Request: CreateWorkspaceRequest = {
        name: 'Export Test Workspace 2',
        theme: 'dark',
        icon: '🌙',
        isDefault: false,
      };

      // This will fail until workspace:create is implemented
      let workspace1Response, workspace2Response;
      try {
        workspace1Response = await ipcRenderer.invoke('workspace:create', workspace1Request);
        workspace2Response = await ipcRenderer.invoke('workspace:create', workspace2Request);
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
        return; // Skip rest of test until implementation
      }

      testWorkspaceIds.push(workspace1Response.workspace.id, workspace2Response.workspace.id);

      // Create services in workspaces
      const service1Request: CreateServiceRequest = {
        name: 'Gmail',
        url: 'https://mail.google.com',
        workspaceId: workspace1Response.workspace.id,
        icon: '📧',
        iconType: 'emoji',
      };

      const service2Request: CreateServiceRequest = {
        name: 'GitHub',
        url: 'https://github.com',
        workspaceId: workspace1Response.workspace.id,
        icon: '⚡',
        iconType: 'emoji',
      };

      const service3Request: CreateServiceRequest = {
        name: 'Slack',
        url: 'https://slack.com',
        workspaceId: workspace2Response.workspace.id,
        icon: '💬',
        iconType: 'emoji',
      };

      const service1Response = await ipcRenderer.invoke('service:create', service1Request);
      const service2Response = await ipcRenderer.invoke('service:create', service2Request);
      const service3Response = await ipcRenderer.invoke('service:create', service3Request);

      testServiceIds.push(
        service1Response.service.id,
        service2Response.service.id,
        service3Response.service.id
      );

      // STEP 2: Export Configuration
      const exportRequest: ExportConfigurationRequest = {
        filePath: testExportPath,
        includeSettings: true,
        includeWorkspaces: true,
        includeServices: true,
      };

      const exportResponse = await ipcRenderer.invoke('config:export', exportRequest);
      expect(exportResponse.success).toBe(true);
      expect(exportResponse.exported.workspaces).toBe(2);
      expect(exportResponse.exported.services).toBe(3);

      // Verify export file exists and has content
      expect(fs.existsSync(testExportPath)).toBe(true);
      const exportedContent = JSON.parse(fs.readFileSync(testExportPath, 'utf-8'));
      expect(exportedContent.version).toBeDefined();
      expect(exportedContent.workspaces).toHaveLength(2);
      expect(exportedContent.services).toHaveLength(3);

      // STEP 3: Modify Configuration Data
      const modifiedConfig = {
        ...exportedContent,
        workspaces: exportedContent.workspaces.map((ws: any) => ({
          ...ws,
          name: `Modified ${ws.name}`,
          theme: ws.theme === 'light' ? 'dark' : 'light',
        })),
        services: [
          ...exportedContent.services.map((svc: any) => ({
            ...svc,
            name: `Modified ${svc.name}`,
          })),
          // Add new service
          {
            id: 'new-service-id',
            name: 'New Service',
            url: 'https://new-service.com',
            workspaceId: exportedContent.workspaces[0].id,
            icon: '🆕',
            iconType: 'emoji',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      fs.writeFileSync(testImportPath, JSON.stringify(modifiedConfig, null, 2));

      // STEP 4: Clear Current Configuration
      // Delete current services and workspaces to test fresh import
      for (const serviceId of testServiceIds) {
        await ipcRenderer.invoke('service:delete', { serviceId });
      }
      for (const workspaceId of testWorkspaceIds) {
        await ipcRenderer.invoke('workspace:delete', { workspaceId });
      }

      testServiceIds = [];
      testWorkspaceIds = [];

      // STEP 5: Import Modified Configuration with 'replace' strategy
      const importRequest: ImportConfigurationRequest = {
        filePath: testImportPath,
        mergeStrategy: 'replace',
      };

      const importResponse = await ipcRenderer.invoke('config:import', importRequest);
      expect(importResponse.success).toBe(true);
      expect(importResponse.imported.workspaces).toBe(2);
      expect(importResponse.imported.services).toBe(4); // 3 modified + 1 new

      // STEP 6: Validate Imported Configuration
      // Verify workspaces were imported with modifications
      const workspace1UpdateRequest = {
        workspaceId: workspace1Response.workspace.id,
        updates: { name: 'Validation Test' },
      };

      const validationResponse = await ipcRenderer.invoke(
        'workspace:update',
        workspace1UpdateRequest
      );
      expect(validationResponse.success).toBe(true);
      // Previous name should have been "Modified Export Test Workspace 1"

      // Verify services were imported with modifications
      const service1UpdateRequest = {
        serviceId: service1Response.service.id,
        updates: { name: 'Validation Service' },
      };

      const serviceValidationResponse = await ipcRenderer.invoke(
        'service:update',
        service1UpdateRequest
      );
      expect(serviceValidationResponse.success).toBe(true);
    });

    it('should handle merge strategy correctly', async () => {
      // Test different merge strategies: merge, replace, skip-duplicates
      try {
        // Create initial configuration
        const workspaceRequest: CreateWorkspaceRequest = {
          name: 'Merge Test Workspace',
          theme: 'light',
        };

        const workspaceResponse = await ipcRenderer.invoke('workspace:create', workspaceRequest);
        testWorkspaceIds.push(workspaceResponse.workspace.id);

        const serviceRequest: CreateServiceRequest = {
          name: 'Original Service',
          url: 'https://original.com',
          workspaceId: workspaceResponse.workspace.id,
        };

        const serviceResponse = await ipcRenderer.invoke('service:create', serviceRequest);
        testServiceIds.push(serviceResponse.service.id);

        // Export current configuration
        const exportRequest: ExportConfigurationRequest = {
          filePath: testExportPath,
          includeSettings: true,
          includeWorkspaces: true,
          includeServices: true,
        };

        await ipcRenderer.invoke('config:export', exportRequest);

        const originalConfig = JSON.parse(fs.readFileSync(testExportPath, 'utf-8'));

        // Create modified import configuration with overlapping data
        const importConfig = {
          ...originalConfig,
          workspaces: [
            // Keep original workspace with same ID but different name
            {
              ...originalConfig.workspaces[0],
              name: 'Merged Workspace Name',
            },
            // Add new workspace
            {
              id: 'new-workspace-id',
              name: 'Additional Workspace',
              theme: 'dark',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          services: [
            // Keep original service with same ID but different name
            {
              ...originalConfig.services[0],
              name: 'Merged Service Name',
            },
            // Add new service
            {
              id: 'new-service-id',
              name: 'Additional Service',
              url: 'https://additional.com',
              workspaceId: originalConfig.workspaces[0].id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };

        fs.writeFileSync(testImportPath, JSON.stringify(importConfig, null, 2));

        // Test 'merge' strategy
        const mergeRequest: ImportConfigurationRequest = {
          filePath: testImportPath,
          mergeStrategy: 'merge',
        };

        const mergeResponse = await ipcRenderer.invoke('config:import', mergeRequest);
        expect(mergeResponse.success).toBe(true);
        expect(mergeResponse.imported.workspaces).toBeGreaterThanOrEqual(1);
        expect(mergeResponse.imported.services).toBeGreaterThanOrEqual(1);

        // Test 'skip-duplicates' strategy
        const skipRequest: ImportConfigurationRequest = {
          filePath: testImportPath,
          mergeStrategy: 'skip-duplicates',
        };

        const skipResponse = await ipcRenderer.invoke('config:import', skipRequest);
        expect(skipResponse.success).toBe(true);
        expect(skipResponse.skipped.workspaces).toBeGreaterThanOrEqual(0);
        expect(skipResponse.skipped.services).toBeGreaterThanOrEqual(0);
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should handle selective export/import correctly', async () => {
      // Test selective export and import of different configuration parts
      try {
        // Create test configuration
        const workspaceRequest: CreateWorkspaceRequest = {
          name: 'Selective Test Workspace',
          theme: 'dark',
        };

        const workspaceResponse = await ipcRenderer.invoke('workspace:create', workspaceRequest);
        testWorkspaceIds.push(workspaceResponse.workspace.id);

        const serviceRequest: CreateServiceRequest = {
          name: 'Selective Test Service',
          url: 'https://selective.com',
          workspaceId: workspaceResponse.workspace.id,
        };

        const serviceResponse = await ipcRenderer.invoke('service:create', serviceRequest);
        testServiceIds.push(serviceResponse.service.id);

        // Export only workspaces (not services)
        const workspaceOnlyExportRequest: ExportConfigurationRequest = {
          filePath: testExportPath,
          includeSettings: false,
          includeWorkspaces: true,
          includeServices: false,
        };

        const workspaceExportResponse = await ipcRenderer.invoke(
          'config:export',
          workspaceOnlyExportRequest
        );
        expect(workspaceExportResponse.success).toBe(true);
        expect(workspaceExportResponse.exported.workspaces).toBe(1);
        expect(workspaceExportResponse.exported.services).toBe(0);

        const workspaceOnlyConfig = JSON.parse(fs.readFileSync(testExportPath, 'utf-8'));
        expect(workspaceOnlyConfig.workspaces).toHaveLength(1);
        expect(workspaceOnlyConfig.services || []).toHaveLength(0);

        // Export only services (not workspaces)
        const serviceOnlyExportRequest: ExportConfigurationRequest = {
          filePath: testImportPath,
          includeSettings: false,
          includeWorkspaces: false,
          includeServices: true,
        };

        const serviceExportResponse = await ipcRenderer.invoke(
          'config:export',
          serviceOnlyExportRequest
        );
        expect(serviceExportResponse.success).toBe(true);
        expect(serviceExportResponse.exported.workspaces).toBe(0);
        expect(serviceExportResponse.exported.services).toBe(1);

        const serviceOnlyConfig = JSON.parse(fs.readFileSync(testImportPath, 'utf-8'));
        expect(serviceOnlyConfig.workspaces || []).toHaveLength(0);
        expect(serviceOnlyConfig.services).toHaveLength(1);
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should validate configuration format and version compatibility', async () => {
      // Test import of configurations with different formats/versions
      try {
        // Test invalid JSON format
        const invalidJsonPath = path.join(process.cwd(), 'invalid.json');
        fs.writeFileSync(invalidJsonPath, '{ invalid json content');

        const invalidJsonRequest: ImportConfigurationRequest = {
          filePath: invalidJsonPath,
          mergeStrategy: 'merge',
        };

        await expect(ipcRenderer.invoke('config:import', invalidJsonRequest)).rejects.toThrow();

        // Test incompatible version
        const incompatibleConfig = {
          version: '999.0.0', // Future version
          workspaces: [],
          services: [],
        };

        const incompatiblePath = path.join(process.cwd(), 'incompatible.json');
        fs.writeFileSync(incompatiblePath, JSON.stringify(incompatibleConfig));

        const incompatibleRequest: ImportConfigurationRequest = {
          filePath: incompatiblePath,
          mergeStrategy: 'merge',
        };

        await expect(ipcRenderer.invoke('config:import', incompatibleRequest)).rejects.toThrow();

        // Test missing required fields
        const incompleteConfig = {
          version: '1.0.0',
          workspaces: [
            {
              // Missing required fields like id, name
              theme: 'light',
            },
          ],
          services: [],
        };

        const incompletePath = path.join(process.cwd(), 'incomplete.json');
        fs.writeFileSync(incompletePath, JSON.stringify(incompleteConfig));

        const incompleteRequest: ImportConfigurationRequest = {
          filePath: incompletePath,
          mergeStrategy: 'merge',
        };

        await expect(ipcRenderer.invoke('config:import', incompleteRequest)).rejects.toThrow();

        // Cleanup test files
        fs.unlinkSync(invalidJsonPath);
        fs.unlinkSync(incompatiblePath);
        fs.unlinkSync(incompletePath);
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });
  });

  describe('Configuration Data Integrity', () => {
    it('should preserve UUID relationships during export/import', async () => {
      // Test that workspace-service relationships are maintained
      try {
        // Create workspace and service
        const workspaceRequest: CreateWorkspaceRequest = {
          name: 'UUID Test Workspace',
          theme: 'light',
        };

        const workspaceResponse = await ipcRenderer.invoke('workspace:create', workspaceRequest);
        const originalWorkspaceId = workspaceResponse.workspace.id;
        testWorkspaceIds.push(originalWorkspaceId);

        const serviceRequest: CreateServiceRequest = {
          name: 'UUID Test Service',
          url: 'https://uuidtest.com',
          workspaceId: originalWorkspaceId,
        };

        const serviceResponse = await ipcRenderer.invoke('service:create', serviceRequest);
        const originalServiceId = serviceResponse.service.id;
        testServiceIds.push(originalServiceId);

        // Export configuration
        const exportRequest: ExportConfigurationRequest = {
          filePath: testExportPath,
          includeSettings: true,
          includeWorkspaces: true,
          includeServices: true,
        };

        await ipcRenderer.invoke('config:export', exportRequest);

        // Verify exported configuration has correct relationships
        const exportedConfig = JSON.parse(fs.readFileSync(testExportPath, 'utf-8'));
        const exportedWorkspace = exportedConfig.workspaces.find(
          (w: any) => w.name === 'UUID Test Workspace'
        );
        const exportedService = exportedConfig.services.find(
          (s: any) => s.name === 'UUID Test Service'
        );

        expect(exportedWorkspace).toBeDefined();
        expect(exportedService).toBeDefined();
        expect(exportedService.workspaceId).toBe(exportedWorkspace.id);

        // Import should regenerate UUIDs but preserve relationships
        const importRequest: ImportConfigurationRequest = {
          filePath: testExportPath,
          mergeStrategy: 'replace',
        };

        // First clear existing configuration
        await ipcRenderer.invoke('service:delete', { serviceId: originalServiceId });
        await ipcRenderer.invoke('workspace:delete', { workspaceId: originalWorkspaceId });

        testServiceIds = [];
        testWorkspaceIds = [];

        const importResponse = await ipcRenderer.invoke('config:import', importRequest);
        expect(importResponse.success).toBe(true);

        // Verify relationships are preserved with new UUIDs
        // This would require querying the imported configuration to verify
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should handle configuration rollback on import failure', async () => {
      // Test that failed imports don't corrupt existing configuration
      try {
        // Create stable configuration
        const workspaceRequest: CreateWorkspaceRequest = {
          name: 'Stable Workspace',
          theme: 'light',
        };

        const workspaceResponse = await ipcRenderer.invoke('workspace:create', workspaceRequest);
        testWorkspaceIds.push(workspaceResponse.workspace.id);

        // Create invalid import configuration
        const invalidImportConfig = {
          version: '1.0.0',
          workspaces: [
            {
              id: 'invalid-workspace',
              name: '', // Invalid empty name
              theme: 'invalid-theme', // Invalid theme
            },
          ],
          services: [
            {
              id: 'invalid-service',
              name: 'Invalid Service',
              url: 'not-a-valid-url', // Invalid URL
              workspaceId: 'non-existent-workspace', // Non-existent workspace
            },
          ],
        };

        fs.writeFileSync(testImportPath, JSON.stringify(invalidImportConfig));

        const invalidImportRequest: ImportConfigurationRequest = {
          filePath: testImportPath,
          mergeStrategy: 'merge',
        };

        // Import should fail
        await expect(ipcRenderer.invoke('config:import', invalidImportRequest)).rejects.toThrow();

        // Verify original configuration is intact
        const validateRequest = {
          workspaceId: workspaceResponse.workspace.id,
          updates: { name: 'Still Works' },
        };

        const validateResponse = await ipcRenderer.invoke('workspace:update', validateRequest);
        expect(validateResponse.success).toBe(true);
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should handle large configuration files efficiently', async () => {
      // Test performance with large configurations
      try {
        // Create multiple workspaces and services
        const workspacePromises = Array.from({ length: 10 }, (_, i) =>
          ipcRenderer.invoke('workspace:create', {
            name: `Performance Workspace ${i}`,
            theme: i % 2 === 0 ? 'light' : 'dark',
          })
        );

        const workspaceResponses = await Promise.all(workspacePromises);
        workspaceResponses.forEach(response => {
          testWorkspaceIds.push(response.workspace.id);
        });

        // Create services for each workspace
        const servicePromises: Promise<any>[] = [];
        workspaceResponses.forEach((workspaceResponse, i) => {
          for (let j = 0; j < 5; j++) {
            servicePromises.push(
              ipcRenderer.invoke('service:create', {
                name: `Performance Service ${i}-${j}`,
                url: `https://performance${i}${j}.com`,
                workspaceId: workspaceResponse.workspace.id,
              })
            );
          }
        });

        const serviceResponses = await Promise.all(servicePromises);
        serviceResponses.forEach(response => {
          testServiceIds.push(response.service.id);
        });

        // Export large configuration
        const startTime = Date.now();

        const exportRequest: ExportConfigurationRequest = {
          filePath: testExportPath,
          includeSettings: true,
          includeWorkspaces: true,
          includeServices: true,
        };

        const exportResponse = await ipcRenderer.invoke('config:export', exportRequest);

        const exportTime = Date.now() - startTime;

        expect(exportResponse.success).toBe(true);
        expect(exportResponse.exported.workspaces).toBe(10);
        expect(exportResponse.exported.services).toBe(50);
        expect(exportTime).toBeLessThan(5000); // Should complete within 5 seconds

        // Verify export file size is reasonable
        const stats = fs.statSync(testExportPath);
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.size).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });
  });

  describe('Security and Validation', () => {
    it('should sanitize imported configuration data', async () => {
      // Test that imported data is properly sanitized
      try {
        const maliciousConfig = {
          version: '1.0.0',
          workspaces: [
            {
              id: '12345678-1234-1234-1234-123456789012',
              name: '<script>alert("xss")</script>',
              theme: 'light',
              icon: 'javascript:alert("xss")',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          services: [
            {
              id: '12345678-1234-1234-1234-123456789013',
              name: '<img src="x" onerror="alert(1)">',
              url: 'javascript:void(0)',
              workspaceId: '12345678-1234-1234-1234-123456789012',
              icon: '<svg onload="alert(1)">',
              iconType: 'emoji',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };

        fs.writeFileSync(testImportPath, JSON.stringify(maliciousConfig));

        const importRequest: ImportConfigurationRequest = {
          filePath: testImportPath,
          mergeStrategy: 'replace',
        };

        // Should either reject malicious data or sanitize it
        const importResponse = await ipcRenderer.invoke('config:import', importRequest);

        if (importResponse.success) {
          // If import succeeds, data should be sanitized
          // This would need verification through querying the imported data
          expect(importResponse.imported.workspaces).toBe(1);
          expect(importResponse.imported.services).toBe(0); // Malicious service should be rejected
        } else {
          // If import fails, should be due to validation
          expect(importResponse.error).toMatch(/validation failed|invalid data/);
        }
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should prevent path traversal in export/import paths', async () => {
      // Test path traversal protection
      try {
        const maliciousExportRequest: ExportConfigurationRequest = {
          filePath: '../../../etc/passwd',
          includeSettings: true,
          includeWorkspaces: true,
          includeServices: true,
        };

        await expect(ipcRenderer.invoke('config:export', maliciousExportRequest)).rejects.toThrow();

        const maliciousImportRequest: ImportConfigurationRequest = {
          filePath: '..\\..\\..\\windows\\system32\\config\\system',
          mergeStrategy: 'merge',
        };

        await expect(ipcRenderer.invoke('config:import', maliciousImportRequest)).rejects.toThrow();
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });
  });
});
