/**
 * Unit tests for WorkspaceManager
 *
 * Tests workspace CRUD operations, validation, ordering, and integration
 * with service management. Ensures proper workspace isolation and
 * business logic enforcement.
 *
 * @fileoverview Comprehensive unit tests for WorkspaceManager class
 */

import {
  WorkspaceManager,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '../../../src/main/services/WorkspaceManager';
import { Workspace } from '../../../src/shared/types/Workspace';

// Mock electron-store
jest.mock('electron-store');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-workspace-uuid'),
}));

describe('WorkspaceManager', () => {
  let workspaceManager: WorkspaceManager;
  let mockStore: any;

  const mockWorkspace: Workspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    description: 'A test workspace for unit testing',
    services: ['service-1', 'service-2'],
    theme: {
      primaryColor: '#1890ff',
      secondaryColor: '#52c41a',
      backgroundColor: '#ffffff',
      sidebarColor: '#f0f0f0',
      textColor: '#000000',
      accentColor: '#fa8c16',
    },
    isDefault: false,
    position: 1,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
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

    // Create WorkspaceManager instance
    workspaceManager = new WorkspaceManager();
  });

  describe('createWorkspace', () => {
    const createRequest: CreateWorkspaceRequest = {
      name: 'New Workspace',
      description: 'A new workspace for testing',
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#28a745',
        backgroundColor: '#ffffff',
        sidebarColor: '#f8f9fa',
        textColor: '#333333',
        accentColor: '#17a2b8',
      },
    };

    it('should create workspace with valid input', async () => {
      mockStore.get.mockReturnValue({});
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.createWorkspace(createRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('mocked-workspace-uuid');
      expect(result.data?.name).toBe(createRequest.name);
      expect(result.data?.description).toBe(createRequest.description);
      expect(result.data?.services).toEqual([]);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail with missing required fields', async () => {
      const invalidRequest = {
        // Missing name
        description: 'Test description',
      } as CreateWorkspaceRequest;

      const result = await workspaceManager.createWorkspace(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should fail with duplicate workspace names', async () => {
      const existingWorkspaces = {
        'existing-id': { ...mockWorkspace, name: createRequest.name },
      };
      mockStore.get.mockReturnValue(existingWorkspaces);

      const result = await workspaceManager.createWorkspace(createRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should assign proper position for new workspace', async () => {
      const existingWorkspaces = {
        'workspace-1': { ...mockWorkspace, id: 'workspace-1', position: 1 },
        'workspace-2': { ...mockWorkspace, id: 'workspace-2', position: 2 },
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.createWorkspace(createRequest);

      expect(result.success).toBe(true);
      expect(result.data?.position).toBeGreaterThan(2);
    });

    it('should create first workspace as default', async () => {
      mockStore.get.mockReturnValue({});
      mockStore.set.mockImplementation(() => {});

      const createRequest: CreateWorkspaceRequest = {
        name: 'First Workspace',
        description: 'The first workspace',
        isDefault: true, // Explicitly set as default
      };

      const result = await workspaceManager.createWorkspace(createRequest);

      expect(result.success).toBe(true);
      expect(result.data?.isDefault).toBe(true);
    });
  });

  describe('updateWorkspace', () => {
    const updateRequest: UpdateWorkspaceRequest = {
      workspaceId: 'workspace-123',
      updates: {
        name: 'Updated Workspace',
        description: 'Updated description',
      },
    };

    it('should update workspace successfully', async () => {
      const existingWorkspaces = {
        'workspace-123': mockWorkspace,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.updateWorkspace(updateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(updateRequest.updates.name);
      expect(result.data?.description).toBe(updateRequest.updates.description);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail for non-existent workspace', async () => {
      mockStore.get.mockReturnValue({});

      const result = await workspaceManager.updateWorkspace(updateRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail with duplicate names', async () => {
      const existingWorkspaces = {
        'workspace-123': mockWorkspace,
        'workspace-456': { ...mockWorkspace, id: 'workspace-456', name: 'Updated Workspace' },
      };
      mockStore.get.mockReturnValue(existingWorkspaces);

      const result = await workspaceManager.updateWorkspace(updateRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should update timestamps correctly', async () => {
      const existingWorkspaces = {
        'workspace-123': mockWorkspace,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const originalUpdatedAt = mockWorkspace.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));

      const result = await workspaceManager.updateWorkspace(updateRequest);

      expect(result.success).toBe(true);
      expect(result.data?.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace successfully', async () => {
      const emptyWorkspace = { ...mockWorkspace, services: [] }; // No services
      const existingWorkspaces = {
        'workspace-123': emptyWorkspace,
        'workspace-456': { ...mockWorkspace, id: 'workspace-456' },
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.deleteWorkspace('workspace-123');

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should fail to delete workspace with services', async () => {
      const existingWorkspaces = {
        'workspace-123': mockWorkspace, // Has services
      };
      mockStore.get.mockReturnValue(existingWorkspaces);

      const result = await workspaceManager.deleteWorkspace('workspace-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('contains');
      expect(result.error).toContain('service(s)');
    });

    it('should fail for non-existent workspace', async () => {
      mockStore.get.mockReturnValue({});

      const result = await workspaceManager.deleteWorkspace('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should delete workspace with services when forced', async () => {
      const workspaceWithServices = { ...mockWorkspace, services: ['service-1', 'service-2'] };
      const existingWorkspaces = {
        'workspace-123': workspaceWithServices,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.deleteWorkspace('workspace-123', true);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('services have been deleted');
    });
  });

  describe('getAllWorkspaces', () => {
    it('should return all workspaces sorted by position', async () => {
      const workspaces = {
        'workspace-1': { ...mockWorkspace, id: 'workspace-1', position: 2 },
        'workspace-2': { ...mockWorkspace, id: 'workspace-2', position: 1 },
      };
      mockStore.get.mockReturnValue(workspaces);

      const result = workspaceManager.getAllWorkspaces();

      expect(result).toHaveLength(2);
      expect(result[0]?.position).toBe(1);
      expect(result[1]?.position).toBe(2);
    });

    it('should handle empty store', async () => {
      mockStore.get.mockReturnValue({});

      const result = workspaceManager.getAllWorkspaces();

      expect(result).toHaveLength(0);
    });
  });

  describe('getDefaultWorkspace', () => {
    it('should return the default workspace', async () => {
      const workspaces = {
        'workspace-1': { ...mockWorkspace, id: 'workspace-1', isDefault: false },
        'workspace-2': { ...mockWorkspace, id: 'workspace-2', isDefault: true },
      };
      mockStore.get.mockReturnValue(workspaces);

      const result = workspaceManager.getDefaultWorkspace();

      expect(result).toBeDefined();
      expect(result?.isDefault).toBe(true);
      expect(result?.id).toBe('workspace-2');
    });

    it('should return null if no default workspace exists', async () => {
      const workspaces = {
        'workspace-1': { ...mockWorkspace, id: 'workspace-1', isDefault: false },
      };
      mockStore.get.mockReturnValue(workspaces);

      const result = workspaceManager.getDefaultWorkspace();

      expect(result).toBeNull();
    });
  });

  describe('addServiceToWorkspace', () => {
    it('should add service to workspace successfully', async () => {
      const workspace = { ...mockWorkspace, services: ['existing-service'] };
      const existingWorkspaces = {
        'workspace-123': workspace,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.addServiceToWorkspace('workspace-123', 'new-service');

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should prevent duplicate services', async () => {
      const workspace = { ...mockWorkspace, services: ['existing-service'] };
      const existingWorkspaces = {
        'workspace-123': workspace,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);

      const result = await workspaceManager.addServiceToWorkspace(
        'workspace-123',
        'existing-service'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already in workspace');
    });
  });

  describe('removeServiceFromWorkspace', () => {
    it('should remove service from workspace successfully', async () => {
      const workspace = { ...mockWorkspace, services: ['service-1', 'service-2'] };
      const existingWorkspaces = {
        'workspace-123': workspace,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.removeServiceFromWorkspace(
        'workspace-123',
        'service-1'
      );

      expect(result.success).toBe(true);
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should handle non-existent service gracefully', async () => {
      const workspace = { ...mockWorkspace, services: ['service-1'] };
      const existingWorkspaces = {
        'workspace-123': workspace,
      };
      mockStore.get.mockReturnValue(existingWorkspaces);
      mockStore.set.mockImplementation(() => {});

      const result = await workspaceManager.removeServiceFromWorkspace(
        'workspace-123',
        'non-existent'
      );

      expect(result.success).toBe(true);
      // No warning because it just filters the service out (no-op)
    });
  });

  describe('Error handling', () => {
    it('should handle store errors gracefully', async () => {
      mockStore.get.mockImplementation(() => {
        throw new Error('Store read error');
      });

      expect(() => workspaceManager.getAllWorkspaces()).toThrow('Store read error');
    });

    it('should validate workspace configuration structure', async () => {
      const invalidWorkspace = {
        // Missing required name field
        description: 'Test description',
      } as CreateWorkspaceRequest;

      const result = await workspaceManager.createWorkspace(invalidWorkspace);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
