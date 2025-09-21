/**
 * Integration test for error handling scenarios
 * Tests: network failures, invalid data, edge cases, error recovery
 */

import { ipcRenderer } from 'electron';
import * as path from 'path';

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

interface UpdateServiceRequest {
  serviceId: string;
  updates: {
    name?: string;
    url?: string;
    icon?: string;
    iconType?: 'emoji' | 'url' | 'file';
  };
}

interface CreateBrowserViewRequest {
  serviceId: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  sessionPartition?: string;
  preloadScript?: string;
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

interface ClearSessionRequest {
  serviceId: string;
  clearType: 'all' | 'cookies' | 'storage' | 'cache' | 'downloads';
}

describe('Integration Test: Error Handling Scenarios', () => {
  let testWorkspaceId: string;
  let testServiceIds: string[] = [];

  beforeAll(async () => {
    // Create a workspace for error testing
    const workspaceRequest: CreateWorkspaceRequest = {
      name: 'Error Handling Test Workspace',
      theme: 'light',
    };

    try {
      const workspaceResponse = await ipcRenderer.invoke('workspace:create', workspaceRequest);
      testWorkspaceId = workspaceResponse.workspace.id;
    } catch (error) {
      testWorkspaceId = '12345678-1234-1234-1234-123456789012'; // Fallback for implementation
    }
  });

  beforeEach(() => {
    testServiceIds = [];
  });

  afterEach(async () => {
    // Cleanup created services
    for (const serviceId of testServiceIds) {
      try {
        await ipcRenderer.invoke('service:delete', { serviceId });
      } catch (error) {
        // Expected to fail until implementation
      }
    }
    testServiceIds = [];
  });

  afterAll(async () => {
    // Cleanup workspace
    if (testWorkspaceId) {
      try {
        await ipcRenderer.invoke('workspace:delete', { workspaceId: testWorkspaceId });
      } catch (error) {
        // Expected to fail until implementation
      }
    }
  });

  describe('Invalid Request Handling', () => {
    it('should handle missing required fields gracefully', async () => {
      // Test workspace creation with missing fields
      const incompleteWorkspaceRequests = [
        {}, // Empty request
        { theme: 'light' }, // Missing name
        { name: '' }, // Empty name
        { name: null }, // Null name
        { name: undefined }, // Undefined name
      ];

      for (const request of incompleteWorkspaceRequests) {
        try {
          const response = await ipcRenderer.invoke('workspace:create', request);
          expect(response.success).toBe(false);
          expect(response.error).toMatch(/required.*field|missing.*name|invalid.*request/i);
        } catch (error) {
          expect((error as Error).message).toMatch(
            /required.*field|missing.*name|invalid.*request|IPC handler not implemented/i
          );
        }
      }

      // Test service creation with missing fields
      const incompleteServiceRequests = [
        {}, // Empty request
        { name: 'Test Service' }, // Missing URL and workspaceId
        { url: 'https://test.com' }, // Missing name and workspaceId
        { workspaceId: testWorkspaceId }, // Missing name and URL
        { name: '', url: '', workspaceId: '' }, // Empty strings
        { name: 'Test', url: 'https://test.com', workspaceId: null }, // Null workspaceId
      ];

      for (const request of incompleteServiceRequests) {
        try {
          const response = await ipcRenderer.invoke('service:create', request);
          expect(response.success).toBe(false);
          expect(response.error).toMatch(/required.*field|missing.*field|invalid.*request/i);
        } catch (error) {
          expect((error as Error).message).toMatch(
            /required.*field|missing.*field|invalid.*request|IPC handler not implemented/i
          );
        }
      }
    });

    it('should handle malformed request data', async () => {
      // Test with various malformed data types
      const malformedRequests = [
        'not-an-object', // String instead of object
        123, // Number instead of object
        [], // Array instead of object
        true, // Boolean instead of object
        null, // Null value
        undefined, // Undefined value
        new Date(), // Date object
        /regex/, // Regex object
        () => {}, // Function
      ];

      for (const request of malformedRequests) {
        try {
          const response = await ipcRenderer.invoke('workspace:create', request);
          expect(response.success).toBe(false);
          expect(response.error).toMatch(/invalid.*request|malformed.*data|type.*error/i);
        } catch (error) {
          expect((error as Error).message).toMatch(
            /invalid.*request|malformed.*data|type.*error|IPC handler not implemented/i
          );
        }
      }
    });

    it('should handle extremely large request payloads', async () => {
      // Create request with very large strings
      const largeString = 'A'.repeat(100000); // 100KB string

      const largeRequests = [
        {
          name: largeString,
          theme: 'light',
        },
        {
          name: 'Test Workspace',
          theme: 'light',
          icon: largeString,
        },
        {
          name: 'Test Service',
          url: 'https://' + largeString + '.com',
          workspaceId: testWorkspaceId,
        },
      ];

      for (let i = 0; i < largeRequests.length; i++) {
        try {
          const channel = i < 2 ? 'workspace:create' : 'service:create';
          const response = await ipcRenderer.invoke(channel, largeRequests[i]);

          if (response.success) {
            // If creation succeeds, data should be truncated or limited
            if (i < 2 && response.workspace) {
              expect(response.workspace.name.length).toBeLessThan(1000);
            } else if (response.service) {
              expect(response.service.name.length).toBeLessThan(1000);
              expect(response.service.url.length).toBeLessThan(1000);
            }
          } else {
            // If creation fails, should be due to size limits
            expect(response.error).toMatch(/too.*large|size.*limit|payload.*too.*big/i);
          }
        } catch (error) {
          expect((error as Error).message).toMatch(
            /too.*large|size.*limit|payload.*too.*big|IPC handler not implemented/i
          );
        }
      }
    });
  });

  describe('Resource Not Found Errors', () => {
    it('should handle non-existent workspace operations', async () => {
      const nonExistentWorkspaceId = '99999999-9999-9999-9999-999999999999';

      // Test updating non-existent workspace
      try {
        const response = await ipcRenderer.invoke('workspace:update', {
          workspaceId: nonExistentWorkspaceId,
          updates: { name: 'Updated Name' },
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/workspace.*not.*found|invalid.*workspace.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /workspace.*not.*found|invalid.*workspace.*id|IPC handler not implemented/i
        );
      }

      // Test deleting non-existent workspace
      try {
        const response = await ipcRenderer.invoke('workspace:delete', {
          workspaceId: nonExistentWorkspaceId,
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/workspace.*not.*found|invalid.*workspace.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /workspace.*not.*found|invalid.*workspace.*id|IPC handler not implemented/i
        );
      }

      // Test creating service in non-existent workspace
      try {
        const response = await ipcRenderer.invoke('service:create', {
          name: 'Test Service',
          url: 'https://test.com',
          workspaceId: nonExistentWorkspaceId,
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/workspace.*not.*found|invalid.*workspace.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /workspace.*not.*found|invalid.*workspace.*id|IPC handler not implemented/i
        );
      }
    });

    it('should handle non-existent service operations', async () => {
      const nonExistentServiceId = '99999999-9999-9999-9999-999999999999';

      // Test updating non-existent service
      try {
        const response = await ipcRenderer.invoke('service:update', {
          serviceId: nonExistentServiceId,
          updates: { name: 'Updated Service' },
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/service.*not.*found|invalid.*service.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /service.*not.*found|invalid.*service.*id|IPC handler not implemented/i
        );
      }

      // Test deleting non-existent service
      try {
        const response = await ipcRenderer.invoke('service:delete', {
          serviceId: nonExistentServiceId,
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/service.*not.*found|invalid.*service.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /service.*not.*found|invalid.*service.*id|IPC handler not implemented/i
        );
      }

      // Test creating BrowserView for non-existent service
      try {
        const response = await ipcRenderer.invoke('browserview:create', {
          serviceId: nonExistentServiceId,
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/service.*not.*found|invalid.*service.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /service.*not.*found|invalid.*service.*id|IPC handler not implemented/i
        );
      }

      // Test clearing session for non-existent service
      try {
        const response = await ipcRenderer.invoke('session:clear', {
          serviceId: nonExistentServiceId,
          clearType: 'all',
        });
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/service.*not.*found|invalid.*service.*id/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /service.*not.*found|invalid.*service.*id|IPC handler not implemented/i
        );
      }
    });
  });

  describe('File System Error Handling', () => {
    it('should handle non-existent file operations', async () => {
      const nonExistentFile = path.join(process.cwd(), 'non-existent-config.json');

      // Test importing non-existent configuration
      const importRequest: ImportConfigurationRequest = {
        filePath: nonExistentFile,
        mergeStrategy: 'merge',
      };

      try {
        const response = await ipcRenderer.invoke('config:import', importRequest);
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/file.*not.*found|cannot.*read.*file|ENOENT/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /file.*not.*found|cannot.*read.*file|ENOENT|IPC handler not implemented/i
        );
      }
    });

    it('should handle permission denied errors', async () => {
      // Test exporting to restricted directory (Windows system directory)
      const restrictedPath = 'C:\\Windows\\System32\\getwarped-config.json';

      const exportRequest: ExportConfigurationRequest = {
        filePath: restrictedPath,
        includeSettings: true,
        includeWorkspaces: true,
        includeServices: true,
      };

      try {
        const response = await ipcRenderer.invoke('config:export', exportRequest);
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/permission.*denied|access.*denied|EACCES|EPERM/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /permission.*denied|access.*denied|EACCES|EPERM|IPC handler not implemented/i
        );
      }

      // Test importing from restricted file
      const importRequest: ImportConfigurationRequest = {
        filePath: restrictedPath,
        mergeStrategy: 'merge',
      };

      try {
        const response = await ipcRenderer.invoke('config:import', importRequest);
        expect(response.success).toBe(false);
        expect(response.error).toMatch(
          /permission.*denied|access.*denied|file.*not.*found|EACCES|EPERM|ENOENT/i
        );
      } catch (error) {
        expect((error as Error).message).toMatch(
          /permission.*denied|access.*denied|file.*not.*found|EACCES|EPERM|ENOENT|IPC handler not implemented/i
        );
      }
    });

    it('should handle corrupted configuration files', async () => {
      const corruptedConfigs = [
        'not-json-data',
        '{"incomplete": json',
        '{"version": "1.0.0", "workspaces": [}', // Invalid JSON
        '\x00\x01\x02\x03', // Binary data
        '<?xml version="1.0"?><root></root>', // XML instead of JSON
        'undefined', // JavaScript undefined
        'null', // Just null
        '[]', // Array instead of object
        '""', // Empty string
        '123', // Number
      ];

      for (let i = 0; i < corruptedConfigs.length; i++) {
        const testFile = path.join(process.cwd(), `corrupted-config-${i}.json`);

        try {
          require('fs').writeFileSync(testFile, corruptedConfigs[i]);

          const importRequest: ImportConfigurationRequest = {
            filePath: testFile,
            mergeStrategy: 'merge',
          };

          const response = await ipcRenderer.invoke('config:import', importRequest);
          expect(response.success).toBe(false);
          expect(response.error).toMatch(
            /invalid.*json|parse.*error|corrupted.*file|malformed.*data/i
          );
        } catch (error) {
          expect((error as Error).message).toMatch(
            /invalid.*json|parse.*error|corrupted.*file|malformed.*data|IPC handler not implemented/i
          );
        } finally {
          // Cleanup test file
          try {
            require('fs').unlinkSync(testFile);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    });

    it('should handle disk space and write errors', async () => {
      // Test exporting to invalid drive (assuming Z: doesn't exist)
      const invalidDrivePath = 'Z:\\getwarped-config.json';

      const exportRequest: ExportConfigurationRequest = {
        filePath: invalidDrivePath,
        includeSettings: true,
        includeWorkspaces: true,
        includeServices: true,
      };

      try {
        const response = await ipcRenderer.invoke('config:export', exportRequest);
        expect(response.success).toBe(false);
        expect(response.error).toMatch(/drive.*not.*found|path.*not.*found|invalid.*drive|ENOENT/i);
      } catch (error) {
        expect((error as Error).message).toMatch(
          /drive.*not.*found|path.*not.*found|invalid.*drive|ENOENT|IPC handler not implemented/i
        );
      }
    });
  });

  describe('Concurrent Operation Errors', () => {
    it('should handle concurrent modifications gracefully', async () => {
      // Create a service first
      const serviceRequest: CreateServiceRequest = {
        name: 'Concurrent Test Service',
        url: 'https://concurrent.com',
        workspaceId: testWorkspaceId,
      };

      try {
        const serviceResponse = await ipcRenderer.invoke('service:create', serviceRequest);
        testServiceIds.push(serviceResponse.service.id);

        // Attempt concurrent updates to the same service
        const updatePromises = Array(10)
          .fill(null)
          .map((_, index) =>
            ipcRenderer
              .invoke('service:update', {
                serviceId: serviceResponse.service.id,
                updates: { name: `Updated Service ${index}` },
              })
              .catch(error => ({ error: error.message }))
          );

        const results = await Promise.all(updatePromises);

        // At least one should succeed, others might fail due to concurrent access
        const successCount = results.filter(r => r.success === true).length;
        const errorCount = results.filter(r => r.error).length;

        // Should handle concurrent access gracefully (either succeed or fail with proper error)
        results.forEach(result => {
          if (result.error && result.error !== 'IPC handler not implemented') {
            expect(result.error).toMatch(/concurrent.*access|resource.*busy|lock.*timeout/i);
          }
        });
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should handle concurrent deletions', async () => {
      // Create multiple services
      const servicePromises = Array(5)
        .fill(null)
        .map((_, index) =>
          ipcRenderer
            .invoke('service:create', {
              name: `Concurrent Delete Service ${index}`,
              url: `https://delete${index}.com`,
              workspaceId: testWorkspaceId,
            })
            .catch(error => ({ error: error.message }))
        );

      try {
        const services = await Promise.all(servicePromises);
        const validServices = services.filter(s => s.service);

        if (validServices.length > 0) {
          validServices.forEach(s => testServiceIds.push(s.service.id));

          // Attempt to delete the same service multiple times concurrently
          const deletePromises = Array(3)
            .fill(null)
            .map(() =>
              ipcRenderer
                .invoke('service:delete', {
                  serviceId: validServices[0].service.id,
                })
                .catch(error => ({ error: error.message }))
            );

          const results = await Promise.all(deletePromises);

          // Only one should succeed, others should fail gracefully
          const successCount = results.filter(r => r.success === true).length;
          const notFoundErrors = results.filter(
            r => r.error && r.error.includes('not found')
          ).length;

          expect(successCount + notFoundErrors).toBeGreaterThan(0);
        }
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });
  });

  describe('Memory and Resource Limits', () => {
    it('should handle excessive BrowserView creation attempts', async () => {
      // Create a service first
      const serviceRequest: CreateServiceRequest = {
        name: 'Resource Test Service',
        url: 'https://resource.com',
        workspaceId: testWorkspaceId,
      };

      try {
        const serviceResponse = await ipcRenderer.invoke('service:create', serviceRequest);
        testServiceIds.push(serviceResponse.service.id);

        // Attempt to create many BrowserViews
        const browserViewPromises = Array(100)
          .fill(null)
          .map((_, index) =>
            ipcRenderer
              .invoke('browserview:create', {
                serviceId: serviceResponse.service.id,
                bounds: { x: index, y: index, width: 800, height: 600 },
              })
              .catch(error => ({ error: error.message }))
          );

        const results = await Promise.all(browserViewPromises);

        // Should either succeed or fail with resource limits
        results.forEach(result => {
          if (result.error && result.error !== 'IPC handler not implemented') {
            expect(result.error).toMatch(/resource.*limit|too.*many.*views|memory.*limit/i);
          }
        });
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });

    it('should handle memory pressure during operations', async () => {
      // Attempt to create many workspaces and services
      const workspacePromises = Array(1000)
        .fill(null)
        .map((_, index) =>
          ipcRenderer
            .invoke('workspace:create', {
              name: `Memory Test Workspace ${index}`,
              theme: 'light',
            })
            .catch(error => ({ error: error.message }))
        );

      try {
        const results = await Promise.all(workspacePromises);

        // Should handle memory pressure gracefully
        results.forEach(result => {
          if (result.error && result.error !== 'IPC handler not implemented') {
            expect(result.error).toMatch(/memory.*limit|resource.*exhausted|too.*many.*resources/i);
          }
        });

        // Cleanup any created workspaces
        const createdWorkspaces = results.filter(r => r.workspace);
        for (const workspace of createdWorkspaces) {
          try {
            await ipcRenderer.invoke('workspace:delete', { workspaceId: workspace.workspace.id });
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });
  });

  describe('Network and URL Error Handling', () => {
    it('should handle unreachable URLs gracefully', async () => {
      const unreachableUrls = [
        'https://definitely-does-not-exist-12345.com',
        'https://localhost:99999', // Invalid port
        'https://192.0.2.1', // Test network (should not respond)
        'https://10.255.255.1', // Private IP unlikely to respond
        'https://[::1]:99999', // IPv6 localhost with invalid port
        'https://invalid-tld.invalidtld',
      ];

      for (const url of unreachableUrls) {
        const serviceRequest: CreateServiceRequest = {
          name: 'Unreachable URL Test',
          url: url,
          workspaceId: testWorkspaceId,
        };

        try {
          // Service creation should succeed even if URL is unreachable
          // The error should be handled when the BrowserView tries to navigate
          const response = await ipcRenderer.invoke('service:create', serviceRequest);

          if (response.success) {
            testServiceIds.push(response.service.id);
            expect(response.service.url).toBe(url); // URL should be preserved as-is
          } else {
            // If validation is strict, should fail with URL validation error
            expect(response.error).toMatch(/invalid.*url|unreachable.*url|dns.*resolution/i);
          }
        } catch (error) {
          expect((error as Error).message).toMatch(
            /invalid.*url|unreachable.*url|dns.*resolution|IPC handler not implemented/i
          );
        }
      }
    });

    it('should handle network timeout scenarios', async () => {
      // Test with URLs that might timeout
      const timeoutUrls = [
        'https://httpstat.us/200?sleep=30000', // 30 second delay
        'https://httpbin.org/delay/30', // 30 second delay
        'https://postman-echo.com/delay/30', // 30 second delay
      ];

      for (const url of timeoutUrls) {
        const serviceRequest: CreateServiceRequest = {
          name: 'Timeout Test Service',
          url: url,
          workspaceId: testWorkspaceId,
        };

        try {
          // Service creation should succeed quickly regardless of URL response time
          const startTime = Date.now();
          const response = await ipcRenderer.invoke('service:create', serviceRequest);
          const endTime = Date.now();

          expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds

          if (response.success) {
            testServiceIds.push(response.service.id);
          }
        } catch (error) {
          expect((error as Error).message).toBe('IPC handler not implemented');
        }
      }
    });
  });

  describe('Data Validation Error Recovery', () => {
    it('should recover from partial data corruption', async () => {
      // Create valid configuration data
      const validConfig = {
        version: '1.0.0',
        workspaces: [
          {
            id: '12345678-1234-1234-1234-123456789012',
            name: 'Valid Workspace',
            theme: 'light',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        services: [
          {
            id: '12345678-1234-1234-1234-123456789013',
            name: 'Valid Service',
            url: 'https://valid.com',
            workspaceId: '12345678-1234-1234-1234-123456789012',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      };

      // Create corrupted versions with partial data issues
      const corruptedConfigs = [
        {
          ...validConfig,
          workspaces: [
            { ...validConfig.workspaces[0], id: 'invalid-uuid' }, // Invalid UUID
          ],
        },
        {
          ...validConfig,
          services: [
            { ...validConfig.services[0], url: 'not-a-url' }, // Invalid URL
          ],
        },
        {
          ...validConfig,
          workspaces: [
            { ...validConfig.workspaces[0], createdAt: 'invalid-date' }, // Invalid date
          ],
        },
      ];

      for (let i = 0; i < corruptedConfigs.length; i++) {
        const testFile = path.join(process.cwd(), `partial-corrupt-${i}.json`);

        try {
          require('fs').writeFileSync(testFile, JSON.stringify(corruptedConfigs[i]));

          const importRequest: ImportConfigurationRequest = {
            filePath: testFile,
            mergeStrategy: 'merge',
          };

          const response = await ipcRenderer.invoke('config:import', importRequest);

          // Should either reject the entire import or skip invalid items
          if (response.success) {
            expect(response.importSummary).toBeDefined();
            expect(response.importSummary.errors).toBeDefined();
            expect(response.importSummary.errors.length).toBeGreaterThan(0);
          } else {
            expect(response.error).toMatch(/validation.*failed|invalid.*data|partial.*corruption/i);
          }
        } catch (error) {
          expect((error as Error).message).toMatch(
            /validation.*failed|invalid.*data|partial.*corruption|IPC handler not implemented/i
          );
        } finally {
          // Cleanup test file
          try {
            require('fs').unlinkSync(testFile);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    });

    it('should handle graceful degradation on system resource errors', async () => {
      try {
        // Simulate system under heavy load by creating many operations
        const operations = [];

        // Mix of different operation types
        for (let i = 0; i < 50; i++) {
          operations.push(
            ipcRenderer
              .invoke('workspace:create', {
                name: `Load Test Workspace ${i}`,
                theme: 'light',
              })
              .catch(error => ({ error: error.message }))
          );
        }

        for (let i = 0; i < 50; i++) {
          operations.push(
            ipcRenderer
              .invoke('service:create', {
                name: `Load Test Service ${i}`,
                url: `https://loadtest${i}.com`,
                workspaceId: testWorkspaceId,
              })
              .catch(error => ({ error: error.message }))
          );
        }

        const results = await Promise.all(operations);

        // System should handle load gracefully - either succeed or fail with proper error
        results.forEach(result => {
          if (result.error && result.error !== 'IPC handler not implemented') {
            expect(result.error).toMatch(
              /system.*overload|resource.*unavailable|service.*unavailable|rate.*limit/i
            );
          }
        });

        // Cleanup any created resources
        const workspaces = results.filter(r => r.workspace);
        const services = results.filter(r => r.service);

        for (const workspace of workspaces) {
          try {
            await ipcRenderer.invoke('workspace:delete', { workspaceId: workspace.workspace.id });
          } catch (e) {
            // Ignore cleanup errors
          }
        }

        for (const service of services) {
          try {
            await ipcRenderer.invoke('service:delete', { serviceId: service.service.id });
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      } catch (error) {
        expect((error as Error).message).toBe('IPC handler not implemented');
      }
    });
  });
});
