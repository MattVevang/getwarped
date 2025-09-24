/**
 * Unit tests for ServiceManager
 *
 * Tests all CRUD operations, validation, error handling, and business logic
 * for service management functionality. Ensures proper integration with
 * storage layer and credential management.
 *
 * @fileoverview Comprehensive unit tests for ServiceManager class
 */

import {
  ServiceManager,
  ServiceOperationResult,
  CreateServiceRequest,
  UpdateServiceRequest,
} from '../../../src/main/services/ServiceManager';
import { ServiceConfiguration } from '../../../src/shared/types/ServiceConfiguration';

// Mock electron-store
jest.mock('electron-store');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-12345'),
}));

describe('ServiceManager', () => {
  let serviceManager: ServiceManager;
  let mockStore: any;

  const mockServiceConfig: ServiceConfiguration = {
    id: 'service-123',
    name: 'Test Service',
    url: 'https://example.com',
    workspaceId: 'workspace-456',
    sortOrder: 1,
    icon: 'https://example.com/icon.png',
    iconType: 'url',
    theme: {
      primaryColor: '#1890ff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
    },
    notifications: true,
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    customUserAgent: 'CustomAgent/1.0',
    blockAds: true,
    blockTrackers: true,
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Store constructor and methods
    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      size: 0,
      store: {},
    };

    const MockStore = require('electron-store');
    MockStore.mockImplementation(() => mockStore);

    // Create ServiceManager instance
    serviceManager = new ServiceManager();
  });

  describe('createService', () => {
    const validCreateRequest: CreateServiceRequest = {
      workspaceId: 'workspace-456',
      name: 'New Service',
      url: 'https://newservice.com',
      icon: 'https://newservice.com/icon.png',
      theme: {
        primaryColor: '#1890ff',
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
    };

    it('should create service with valid input', async () => {
      // Setup mock store to return empty services list
      mockStore.get.mockReturnValue({});
      mockStore.set.mockImplementation(() => {});

      const result = await serviceManager.createService(validCreateRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('mocked-uuid-12345');
      expect(result.data?.name).toBe(validCreateRequest.name);
      expect(result.data?.url).toBe(validCreateRequest.url);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail with invalid URL', async () => {
      const invalidRequest: CreateServiceRequest = {
        ...validCreateRequest,
        url: 'not-a-valid-url',
      };

      const result = await serviceManager.createService(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should fail with missing required fields', async () => {
      const invalidRequest = {
        workspaceId: 'workspace-456',
        // Missing name and url
      } as CreateServiceRequest;

      const result = await serviceManager.createService(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should handle duplicate service names', async () => {
      // Mock existing services
      const existingServices = {
        'existing-id': { ...mockServiceConfig, name: validCreateRequest.name },
      };
      mockStore.get.mockReturnValue(existingServices);

      const result = await serviceManager.createService(validCreateRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should assign proper sort order for new service', async () => {
      const existingServices = {
        'service-1': { ...mockServiceConfig, id: 'service-1', sortOrder: 1 },
        'service-2': { ...mockServiceConfig, id: 'service-2', sortOrder: 2 },
      };

      mockStore.get.mockReturnValue(existingServices);
      mockStore.set.mockImplementation(() => {});

      const result = await serviceManager.createService(validCreateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.sortOrder).toBe(3);
    });
  });

  describe('updateService', () => {
    const updateRequest: UpdateServiceRequest = {
      serviceId: 'service-123',
      updates: {
        name: 'Updated Service',
        url: 'https://updated.com',
      },
    };

    it('should update service successfully', async () => {
      const existingServices = {
        'service-123': mockServiceConfig,
      };
      mockStore.get.mockReturnValue(existingServices);
      mockStore.set.mockImplementation(() => {});

      const result = await serviceManager.updateService(updateRequest);

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail for non-existent service', async () => {
      mockStore.get.mockReturnValue({});

      const result = await serviceManager.updateService(updateRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate URL when updating', async () => {
      const existingServices = {
        'service-123': mockServiceConfig,
      };
      mockStore.get.mockReturnValue(existingServices);

      const result = await serviceManager.updateService({
        serviceId: 'service-123',
        updates: { url: 'invalid-url' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should update timestamps correctly', async () => {
      const existingServices = {
        'service-123': mockServiceConfig,
      };
      mockStore.get.mockReturnValue(existingServices);
      mockStore.set.mockImplementation(() => {});

      const originalUpdatedAt = mockServiceConfig.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      const result = await serviceManager.updateService(updateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('deleteService', () => {
    it('should delete service successfully', async () => {
      const existingServices = {
        'service-123': mockServiceConfig,
        'service-456': { ...mockServiceConfig, id: 'service-456' },
      };
      mockStore.get.mockReturnValue(existingServices);
      mockStore.set.mockImplementation(() => {});

      const result = await serviceManager.deleteService('service-123');

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail for non-existent service', async () => {
      mockStore.get.mockReturnValue({});

      const result = await serviceManager.deleteService('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getAllServices', () => {
    it('should return all services', async () => {
      const services = {
        'service-1': mockServiceConfig,
        'service-2': { ...mockServiceConfig, id: 'service-2' },
      };
      mockStore.get.mockReturnValue(services);

      const result = serviceManager.getAllServices();

      expect(result).toHaveLength(2);
    });

    it('should handle empty store', async () => {
      mockStore.get.mockReturnValue({});

      const result = serviceManager.getAllServices();

      expect(result).toHaveLength(0);
    });
  });

  describe('queryServices', () => {
    it('should filter services by workspace', async () => {
      const allServices = {
        'service-1': { ...mockServiceConfig, id: 'service-1', workspaceId: 'workspace-1' },
        'service-2': { ...mockServiceConfig, id: 'service-2', workspaceId: 'workspace-2' },
        'service-3': { ...mockServiceConfig, id: 'service-3', workspaceId: 'workspace-1' },
      };
      mockStore.get.mockReturnValue(allServices);

      const result = serviceManager.queryServices({ workspaceId: 'workspace-1' });

      expect(result).toHaveLength(2);
      expect(result.every(s => s.workspaceId === 'workspace-1')).toBe(true);
    });

    it('should handle empty store', async () => {
      mockStore.get.mockReturnValue({});

      const result = serviceManager.queryServices();

      expect(result).toHaveLength(0);
    });
  });

  describe('updateServiceOrder', () => {
    it('should update service order successfully', async () => {
      const existingServices = {
        'service-123': mockServiceConfig,
      };
      mockStore.get.mockReturnValue(existingServices);
      mockStore.set.mockImplementation(() => {});

      const result = await serviceManager.updateServiceOrder('service-123', 5);

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail for non-existent service', async () => {
      mockStore.get.mockReturnValue({});

      const result = await serviceManager.updateServiceOrder('non-existent', 5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Error handling', () => {
    it('should handle store errors gracefully', async () => {
      mockStore.get.mockImplementation(() => {
        throw new Error('Store read error');
      });

      const result = serviceManager.getAllServices();

      expect(() => result).toThrow('Store read error');
    });

    it('should validate service configuration structure', async () => {
      const invalidService = {
        // Missing required fields
        name: 'Test',
      } as CreateServiceRequest;

      const result = await serviceManager.createService(invalidService);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
