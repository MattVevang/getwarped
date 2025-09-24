/**
 * Redux Slices Unit Tests
 *
 * Comprehensive unit tests for Redux slices covering actions, reducers, selectors,
 * async thunks, and state management patterns for services, workspaces, and UI.
 */

import { configureStore } from '@reduxjs/toolkit';
import servicesSlice, {
  setActiveService,
  openServiceForm,
  closeServiceForm,
  openTemplateModal,
  closeTemplateModal,
  clearError,
  setServiceTemplates,
  updateHealthStatus,
  clearHealthStatus,
  updateServiceLocal,
  selectServices,
  selectActiveService,
  selectServicesByWorkspace,
  selectServicesLoading,
  selectServicesError,
  selectServiceTemplates,
  selectServiceHealth,
} from '../../../src/renderer/store/slices/servicesSlice';
import workspacesSlice, {
  setActiveWorkspaceLocal,
  openWorkspaceForm,
  closeWorkspaceForm,
  setReorderMode,
  clearError as clearWorkspaceError,
  setActiveWorkspace,
} from '../../../src/renderer/store/slices/workspacesSlice';
import uiSlice, {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  setZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  setLanguage,
  setNotifications,
  updateWindowState,
  setWindowMaximized,
  setWindowFullscreen,
  setWindowAlwaysOnTop,
  openSettingsModal,
  closeSettingsModal,
  openAboutModal,
  closeAboutModal,
  openExportModal,
  closeExportModal,
  openImportModal,
  closeImportModal,
  showConfirmDialog,
  hideConfirmDialog,
  setSearchQuery,
  updateSearchFilters,
  setSearchResults,
  setSearchLoading,
  clearSearch,
  addToast,
  removeToast,
  clearAllToasts,
} from '../../../src/renderer/store/slices/uiSlice';
import { ServiceConfiguration, ServiceTheme } from '../../../src/shared/types/ServiceConfiguration';
import { ServiceTemplate, ServiceCategory } from '../../../src/shared/types/ServiceTemplate';
import { Workspace } from '../../../src/shared/types/Workspace';

// Mock Redux store for testing
const createMockStore = () =>
  configureStore({
    reducer: {
      services: servicesSlice,
      workspaces: workspacesSlice,
      ui: uiSlice,
    },
  });

type MockStore = ReturnType<typeof createMockStore>;

describe('Redux Slices', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createMockStore();
  });

  describe('Services Slice', () => {
    const mockService: ServiceConfiguration = {
      id: 'test-service-1',
      name: 'Test Service',
      url: 'https://example.com',
      icon: 'test-icon.png',
      iconType: 'url',
      workspaceId: 'test-workspace-1',
      position: 0,
      sortOrder: 1000,
      theme: 'dark' as ServiceTheme,
      notifications: true,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      customUserAgent: 'test-agent',
      blockAds: false,
      blockTrackers: false,
    };

    const mockTemplate: ServiceTemplate = {
      id: 'template-1',
      name: 'Test Template',
      description: 'Test template description',
      url: 'https://template.com',
      icon: 'template-icon.png',
      category: ServiceCategory.PRODUCTIVITY,
      defaultTheme: { primaryColor: '#007bff' },
      userAgentRequired: false,
      supportedFeatures: [],
      version: '1.0.0',
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      verified: true,
    };

    describe('Initial State', () => {
      it('should have correct initial state', () => {
        const state = store.getState().services;
        expect(state).toEqual({
          items: {},
          activeServiceId: null,
          templates: {},
          loading: false,
          error: null,
          serviceFormOpen: false,
          editingServiceId: null,
          templateModalOpen: false,
          healthStatus: {},
        });
      });
    });

    describe('Synchronous Actions', () => {
      it('should set active service', () => {
        store.dispatch(setActiveService('service-1'));
        const state = store.getState().services;
        expect(state.activeServiceId).toBe('service-1');
      });

      it('should handle null active service', () => {
        store.dispatch(setActiveService('service-1'));
        store.dispatch(setActiveService(null));
        const state = store.getState().services;
        expect(state.activeServiceId).toBeNull();
      });

      it('should open service form for new service', () => {
        store.dispatch(openServiceForm(null));
        const state = store.getState().services;
        expect(state.serviceFormOpen).toBe(true);
        expect(state.editingServiceId).toBeNull();
      });

      it('should open service form for editing', () => {
        store.dispatch(openServiceForm('service-1'));
        const state = store.getState().services;
        expect(state.serviceFormOpen).toBe(true);
        expect(state.editingServiceId).toBe('service-1');
      });

      it('should close service form', () => {
        store.dispatch(openServiceForm('service-1'));
        store.dispatch(closeServiceForm());
        const state = store.getState().services;
        expect(state.serviceFormOpen).toBe(false);
        expect(state.editingServiceId).toBeNull();
      });

      it('should open template modal', () => {
        store.dispatch(openTemplateModal());
        const state = store.getState().services;
        expect(state.templateModalOpen).toBe(true);
      });

      it('should close template modal', () => {
        store.dispatch(openTemplateModal());
        store.dispatch(closeTemplateModal());
        const state = store.getState().services;
        expect(state.templateModalOpen).toBe(false);
      });

      it('should clear error', () => {
        // Set error through failed async action
        store.dispatch({ type: 'services/create/rejected', payload: 'Test error' });
        expect(store.getState().services.error).toBe('Test error');

        store.dispatch(clearError());
        expect(store.getState().services.error).toBeNull();
      });

      it('should set service templates', () => {
        const templates = [mockTemplate];
        store.dispatch(setServiceTemplates(templates));
        const state = store.getState().services;
        expect(state.templates).toEqual({
          [mockTemplate.id]: mockTemplate,
        });
      });

      it('should update health status', () => {
        const healthStatus = {
          serviceId: 'service-1',
          status: 'healthy' as const,
          lastChecked: new Date(),
          responseTime: 100,
        };
        store.dispatch(updateHealthStatus(healthStatus));
        const state = store.getState().services;
        expect(state.healthStatus['service-1']).toEqual(healthStatus);
      });

      it('should clear health status', () => {
        const healthStatus = {
          serviceId: 'service-1',
          status: 'healthy' as const,
          lastChecked: new Date(),
          responseTime: 100,
        };
        store.dispatch(updateHealthStatus(healthStatus));
        store.dispatch(clearHealthStatus('service-1'));
        const state = store.getState().services;
        expect(state.healthStatus['service-1']).toBeUndefined();
      });

      it('should update service locally', () => {
        // First add a service using the create fulfilled action
        store.dispatch({ type: 'services/create/fulfilled', payload: mockService });

        // Then update it locally
        const updates = { name: 'Updated Service Name' };
        store.dispatch(updateServiceLocal({ id: mockService.id, updates }));

        const state = store.getState().services;
        expect(state.items[mockService.id]).toBeDefined();
        expect(state.items[mockService.id]?.name).toBe('Updated Service Name');
        expect(state.items[mockService.id]?.updatedAt).not.toBe(mockService.updatedAt);
      });

      it('should ignore local update for non-existent service', () => {
        const updates = { name: 'Updated Service Name' };
        store.dispatch(updateServiceLocal({ id: 'non-existent', updates }));

        const state = store.getState().services;
        expect(state.items['non-existent']).toBeUndefined();
      });
    });

    describe('Async Actions', () => {
      describe('createService', () => {
        it('should handle createService.pending', () => {
          store.dispatch({ type: 'services/create/pending' });
          const state = store.getState().services;
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();
        });

        it('should handle createService.fulfilled', () => {
          const action = {
            type: 'services/create/fulfilled',
            payload: mockService,
          };
          store.dispatch(action);
          const state = store.getState().services;
          expect(state.loading).toBe(false);
          expect(state.items[mockService.id]).toEqual(mockService);
          expect(state.serviceFormOpen).toBe(false);
          expect(state.editingServiceId).toBeNull();
        });

        it('should handle createService.rejected', () => {
          const action = {
            type: 'services/create/rejected',
            payload: 'Creation failed',
          };
          store.dispatch(action);
          const state = store.getState().services;
          expect(state.loading).toBe(false);
          expect(state.error).toBe('Creation failed');
        });
      });

      describe('updateService', () => {
        beforeEach(() => {
          // Add service to state first
          const action = {
            type: 'services/create/fulfilled',
            payload: mockService,
          };
          store.dispatch(action);
        });

        it('should handle updateService.fulfilled', () => {
          const updatePayload = {
            serviceId: mockService.id,
            updates: { name: 'Updated Service' },
          };
          const action = {
            type: 'services/update/fulfilled',
            payload: updatePayload,
          };
          store.dispatch(action);
          const state = store.getState().services;
          expect(state.loading).toBe(false);
          expect(state.items[mockService.id]).toBeDefined();
          expect(state.items[mockService.id]?.name).toBe('Updated Service');
          expect(state.serviceFormOpen).toBe(false);
          expect(state.editingServiceId).toBeNull();
        });

        it('should ignore update for non-existent service', () => {
          const updatePayload = {
            serviceId: 'non-existent',
            updates: { name: 'Updated Service' },
          };
          const action = {
            type: 'services/update/fulfilled',
            payload: updatePayload,
          };
          store.dispatch(action);
          const state = store.getState().services;
          expect(state.items['non-existent']).toBeUndefined();
        });
      });

      describe('deleteService', () => {
        beforeEach(() => {
          // Add service and set it as active
          store.dispatch({ type: 'services/create/fulfilled', payload: mockService });
          store.dispatch(setActiveService(mockService.id));
          store.dispatch(openServiceForm(mockService.id));
          store.dispatch(
            updateHealthStatus({
              serviceId: mockService.id,
              status: 'healthy',
              lastChecked: new Date(),
              responseTime: 100,
            })
          );
        });

        it('should handle deleteService.fulfilled', () => {
          const action = {
            type: 'services/delete/fulfilled',
            payload: mockService.id,
          };
          store.dispatch(action);
          const state = store.getState().services;
          expect(state.loading).toBe(false);
          expect(state.items[mockService.id]).toBeUndefined();
          expect(state.activeServiceId).toBeNull();
          expect(state.serviceFormOpen).toBe(false);
          expect(state.editingServiceId).toBeNull();
          expect(state.healthStatus[mockService.id]).toBeUndefined();
        });
      });

      describe('fetchServices', () => {
        it('should handle fetchServices.fulfilled', () => {
          const services = [mockService];
          const action = {
            type: 'services/fetch/fulfilled',
            payload: services,
          };
          store.dispatch(action);
          const state = store.getState().services;
          expect(state.loading).toBe(false);
          expect(state.items).toEqual({
            [mockService.id]: mockService,
          });
        });

        it('should replace existing services', () => {
          // Add initial service
          store.dispatch({ type: 'services/create/fulfilled', payload: mockService });

          // Fetch new services
          const newService: ServiceConfiguration = {
            ...mockService,
            id: 'new-service',
            name: 'New Service',
          };
          const action = {
            type: 'services/fetch/fulfilled',
            payload: [newService],
          };
          store.dispatch(action);

          const state = store.getState().services;
          expect(state.items).toEqual({
            [newService.id]: newService,
          });
          expect(state.items[mockService.id]).toBeUndefined();
        });
      });

      describe('reorderServices', () => {
        const service2: ServiceConfiguration = {
          ...mockService,
          id: 'service-2',
          name: 'Service 2',
          position: 1,
        };

        beforeEach(() => {
          store.dispatch({ type: 'services/create/fulfilled', payload: mockService });
          store.dispatch({ type: 'services/create/fulfilled', payload: service2 });
        });

        it('should handle reorderServices.fulfilled', () => {
          const reorderPayload = {
            workspaceId: 'test-workspace-1',
            serviceIds: [service2.id, mockService.id],
          };
          const action = {
            type: 'services/reorder/fulfilled',
            payload: reorderPayload,
          };
          store.dispatch(action);

          const state = store.getState().services;
          expect(state.loading).toBe(false);
          expect(state.items[service2.id]).toBeDefined();
          expect(state.items[mockService.id]).toBeDefined();
          expect(state.items[service2.id]?.position).toBe(0);
          expect(state.items[mockService.id]?.position).toBe(1);
        });

        it('should ignore reorder for non-existent services', () => {
          const reorderPayload = {
            workspaceId: 'test-workspace-1',
            serviceIds: ['non-existent-1', 'non-existent-2'],
          };
          const action = {
            type: 'services/reorder/fulfilled',
            payload: reorderPayload,
          };
          store.dispatch(action);

          const state = store.getState().services;
          expect(state.items[mockService.id]).toBeDefined();
          expect(state.items[service2.id]).toBeDefined();
          expect(state.items[mockService.id]?.position).toBe(0);
          expect(state.items[service2.id]?.position).toBe(1);
        });
      });
    });

    describe('Selectors', () => {
      beforeEach(() => {
        store.dispatch({ type: 'services/create/fulfilled', payload: mockService });
        store.dispatch(setActiveService(mockService.id));
        store.dispatch(setServiceTemplates([mockTemplate]));
        store.dispatch(
          updateHealthStatus({
            serviceId: mockService.id,
            status: 'healthy',
            lastChecked: new Date(),
            responseTime: 100,
          })
        );
        store.dispatch({ type: 'services/create/rejected', payload: 'Test error' });
      });

      it('should select all services', () => {
        const state = store.getState();
        const services = selectServices(state);
        expect(services).toEqual({
          [mockService.id]: mockService,
        });
      });

      it('should select active service', () => {
        const state = store.getState();
        const activeService = selectActiveService(state);
        expect(activeService).toEqual(mockService);
      });

      it('should return null for no active service', () => {
        store.dispatch(setActiveService(null));
        const state = store.getState();
        const activeService = selectActiveService(state);
        expect(activeService).toBeNull();
      });

      it('should select services by workspace', () => {
        const service2: ServiceConfiguration = {
          ...mockService,
          id: 'service-2',
          workspaceId: 'other-workspace',
          position: 0,
        };
        store.dispatch({ type: 'services/create/fulfilled', payload: service2 });

        const state = store.getState();
        const workspaceServices = selectServicesByWorkspace(state, 'test-workspace-1');
        expect(workspaceServices).toEqual([mockService]);
      });

      it('should sort services by position', () => {
        const service2: ServiceConfiguration = {
          ...mockService,
          id: 'service-2',
          name: 'Service 2',
          position: -1, // Should come first
        };
        store.dispatch({ type: 'services/create/fulfilled', payload: service2 });

        const state = store.getState();
        const workspaceServices = selectServicesByWorkspace(state, 'test-workspace-1');
        expect(workspaceServices[0]).toEqual(service2);
        expect(workspaceServices[1]).toEqual(mockService);
      });

      it('should select loading state', () => {
        store.dispatch({ type: 'services/create/pending' });
        const state = store.getState();
        const loading = selectServicesLoading(state);
        expect(loading).toBe(true);
      });

      it('should select error state', () => {
        const state = store.getState();
        const error = selectServicesError(state);
        expect(error).toBe('Test error');
      });

      it('should select service templates', () => {
        const state = store.getState();
        const templates = selectServiceTemplates(state);
        expect(templates).toEqual({
          [mockTemplate.id]: mockTemplate,
        });
      });

      it('should select service health', () => {
        const state = store.getState();
        const health = selectServiceHealth(state, mockService.id);
        expect(health).toBeDefined();
        expect(health?.status).toBe('healthy');
      });

      it('should return undefined for non-existent health', () => {
        const state = store.getState();
        const health = selectServiceHealth(state, 'non-existent');
        expect(health).toBeUndefined();
      });
    });
  });

  describe('Workspaces Slice', () => {
    const mockWorkspace: Workspace = {
      id: 'test-workspace-1',
      name: 'Test Workspace',
      description: 'Test description',
      services: [],
      theme: {
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
        backgroundColor: '#ffffff',
        sidebarColor: '#f8f9fa',
        textColor: '#212529',
        accentColor: '#17a2b8',
      },
      isDefault: false,
      position: 0,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    describe('Initial State', () => {
      it('should have correct initial state', () => {
        const state = store.getState().workspaces;
        expect(state).toEqual({
          items: {},
          activeWorkspaceId: null,
          loading: false,
          error: null,
          workspaceFormOpen: false,
          editingWorkspaceId: null,
          reorderMode: false,
        });
      });
    });

    describe('Synchronous Actions', () => {
      it('should set active workspace', () => {
        store.dispatch(setActiveWorkspace({ workspaceId: 'workspace-1' }));
        // Note: setActiveWorkspace is async, so we test the local version
        store.dispatch(setActiveWorkspaceLocal('workspace-1'));
        const updatedState = store.getState().workspaces;
        expect(updatedState.activeWorkspaceId).toBe('workspace-1');
      });

      it('should open workspace form for new workspace', () => {
        store.dispatch(openWorkspaceForm(null));
        const state = store.getState().workspaces;
        expect(state.workspaceFormOpen).toBe(true);
        expect(state.editingWorkspaceId).toBeNull();
      });

      it('should open workspace form for editing', () => {
        store.dispatch(openWorkspaceForm('workspace-1'));
        const state = store.getState().workspaces;
        expect(state.workspaceFormOpen).toBe(true);
        expect(state.editingWorkspaceId).toBe('workspace-1');
      });

      it('should close workspace form', () => {
        store.dispatch(openWorkspaceForm('workspace-1'));
        store.dispatch(closeWorkspaceForm());
        const state = store.getState().workspaces;
        expect(state.workspaceFormOpen).toBe(false);
        expect(state.editingWorkspaceId).toBeNull();
      });

      it('should toggle reorder mode', () => {
        store.dispatch(setReorderMode(true));
        expect(store.getState().workspaces.reorderMode).toBe(true);

        store.dispatch(setReorderMode(false));
        expect(store.getState().workspaces.reorderMode).toBe(false);
      });

      it('should clear workspace error', () => {
        // Set error through failed async action
        store.dispatch({ type: 'workspaces/create/rejected', payload: 'Test error' });
        expect(store.getState().workspaces.error).toBe('Test error');

        store.dispatch(clearWorkspaceError());
        expect(store.getState().workspaces.error).toBeNull();
      });
    });

    describe('Async Actions', () => {
      describe('createWorkspace', () => {
        it('should handle createWorkspace.pending', () => {
          store.dispatch({ type: 'workspaces/create/pending' });
          const state = store.getState().workspaces;
          expect(state.loading).toBe(true);
          expect(state.error).toBeNull();
        });

        it('should handle createWorkspace.fulfilled', () => {
          const action = {
            type: 'workspaces/create/fulfilled',
            payload: mockWorkspace,
          };
          store.dispatch(action);
          const state = store.getState().workspaces;
          expect(state.loading).toBe(false);
          expect(state.items[mockWorkspace.id]).toEqual(mockWorkspace);
          expect(state.workspaceFormOpen).toBe(false);
          expect(state.editingWorkspaceId).toBeNull();
        });

        it('should handle createWorkspace.rejected', () => {
          const action = {
            type: 'workspaces/create/rejected',
            payload: 'Creation failed',
          };
          store.dispatch(action);
          const state = store.getState().workspaces;
          expect(state.loading).toBe(false);
          expect(state.error).toBe('Creation failed');
        });
      });

      describe('updateWorkspace', () => {
        it('should handle updateWorkspace.fulfilled', () => {
          // Create a fresh workspace object to avoid readonly issues
          const testWorkspace = JSON.parse(JSON.stringify(mockWorkspace));
          testWorkspace.id = 'update-test-workspace';
          store.dispatch({ type: 'workspaces/create/fulfilled', payload: testWorkspace });

          const updatePayload = {
            workspaceId: testWorkspace.id,
            updates: { name: 'Updated Workspace' },
          };
          const action = {
            type: 'workspaces/update/fulfilled',
            payload: updatePayload,
          };
          store.dispatch(action);
          const state = store.getState().workspaces;
          expect(state.loading).toBe(false);
          expect(state.items[testWorkspace.id]).toBeDefined();
          expect(state.items[testWorkspace.id]?.name).toBe('Updated Workspace');
          expect(state.workspaceFormOpen).toBe(false);
          expect(state.editingWorkspaceId).toBeNull();
        });
      });

      describe('deleteWorkspace', () => {
        it('should handle deleteWorkspace.fulfilled', () => {
          // Create a fresh workspace object to avoid readonly issues
          const testWorkspace = JSON.parse(JSON.stringify(mockWorkspace));
          testWorkspace.id = 'delete-test-workspace';
          store.dispatch({ type: 'workspaces/create/fulfilled', payload: testWorkspace });
          store.dispatch(setActiveWorkspace({ workspaceId: testWorkspace.id }));
          store.dispatch(openWorkspaceForm(testWorkspace.id));

          const action = {
            type: 'workspaces/delete/fulfilled',
            payload: testWorkspace.id,
          };
          store.dispatch(action);
          const state = store.getState().workspaces;
          expect(state.loading).toBe(false);
          expect(state.items[testWorkspace.id]).toBeUndefined();
          expect(state.activeWorkspaceId).toBeNull();
          expect(state.workspaceFormOpen).toBe(false);
          expect(state.editingWorkspaceId).toBeNull();
        });
      });

      describe('fetchWorkspaces', () => {
        it('should handle fetchWorkspaces.fulfilled', () => {
          const workspaces = [mockWorkspace];
          const action = {
            type: 'workspaces/fetch/fulfilled',
            payload: workspaces,
          };
          store.dispatch(action);
          const state = store.getState().workspaces;
          expect(state.loading).toBe(false);
          expect(state.items).toEqual({
            [mockWorkspace.id]: mockWorkspace,
          });
        });
      });

      describe('reorderWorkspaces', () => {
        it('should handle reorderWorkspaces.fulfilled', () => {
          // Create fresh workspace objects to avoid readonly issues
          const testWorkspace1 = JSON.parse(JSON.stringify(mockWorkspace));
          testWorkspace1.id = 'reorder-test-workspace-1';

          const testWorkspace2 = JSON.parse(JSON.stringify(mockWorkspace));
          testWorkspace2.id = 'reorder-test-workspace-2';
          testWorkspace2.name = 'Workspace 2';
          testWorkspace2.position = 1;

          store.dispatch({ type: 'workspaces/create/fulfilled', payload: testWorkspace1 });
          store.dispatch({ type: 'workspaces/create/fulfilled', payload: testWorkspace2 });

          const action = {
            type: 'workspaces/reorder/fulfilled',
            payload: [testWorkspace2.id, testWorkspace1.id], // payload should be the array directly
          };
          store.dispatch(action);

          const state = store.getState().workspaces;
          expect(state.loading).toBe(false);
          expect(state.items[testWorkspace2.id]).toBeDefined();
          expect(state.items[testWorkspace1.id]).toBeDefined();
          expect(state.items[testWorkspace2.id]?.position).toBe(0);
          expect(state.items[testWorkspace1.id]?.position).toBe(1);
        });
      });
    });
  });

  describe('UI Slice', () => {
    describe('Initial State', () => {
      it('should have correct initial state', () => {
        const state = store.getState().ui;
        expect(state).toEqual({
          sidebarCollapsed: false,
          theme: 'system',
          zoom: 1.0,
          language: 'en',
          notifications: true,
          window: {
            width: 1200,
            height: 800,
            maximized: false,
            fullscreen: false,
            alwaysOnTop: false,
          },
          modals: {
            settingsOpen: false,
            aboutOpen: false,
            exportModalOpen: false,
            importModalOpen: false,
            confirmDialog: null,
          },
          search: {
            query: '',
            filters: {},
            results: [],
            searching: false,
          },
          toasts: [],
        });
      });
    });

    describe('Sidebar Management', () => {
      it('should toggle sidebar', () => {
        store.dispatch(toggleSidebar());
        expect(store.getState().ui.sidebarCollapsed).toBe(true);

        store.dispatch(toggleSidebar());
        expect(store.getState().ui.sidebarCollapsed).toBe(false);
      });

      it('should set sidebar collapsed', () => {
        store.dispatch(setSidebarCollapsed(true));
        expect(store.getState().ui.sidebarCollapsed).toBe(true);

        store.dispatch(setSidebarCollapsed(false));
        expect(store.getState().ui.sidebarCollapsed).toBe(false);
      });
    });

    describe('Theme Management', () => {
      it('should set theme', () => {
        store.dispatch(setTheme('dark'));
        expect(store.getState().ui.theme).toBe('dark');

        store.dispatch(setTheme('light'));
        expect(store.getState().ui.theme).toBe('light');

        store.dispatch(setTheme('system'));
        expect(store.getState().ui.theme).toBe('system');
      });
    });

    describe('Zoom Management', () => {
      it('should set zoom level', () => {
        store.dispatch(setZoom(1.5));
        expect(store.getState().ui.zoom).toBe(1.5);
      });

      it('should clamp zoom between 0.5 and 2.0', () => {
        store.dispatch(setZoom(0.1));
        expect(store.getState().ui.zoom).toBe(0.5);

        store.dispatch(setZoom(3.0));
        expect(store.getState().ui.zoom).toBe(2.0);
      });

      it('should zoom in', () => {
        store.dispatch(zoomIn());
        expect(store.getState().ui.zoom).toBe(1.1);
      });

      it('should not zoom in beyond maximum', () => {
        store.dispatch(setZoom(2.0));
        store.dispatch(zoomIn());
        expect(store.getState().ui.zoom).toBe(2.0);
      });

      it('should zoom out', () => {
        store.dispatch(zoomOut());
        expect(store.getState().ui.zoom).toBe(0.9);
      });

      it('should not zoom out beyond minimum', () => {
        store.dispatch(setZoom(0.5));
        store.dispatch(zoomOut());
        expect(store.getState().ui.zoom).toBe(0.5);
      });

      it('should reset zoom', () => {
        store.dispatch(setZoom(1.5));
        store.dispatch(resetZoom());
        expect(store.getState().ui.zoom).toBe(1.0);
      });
    });

    describe('Language and Notifications', () => {
      it('should set language', () => {
        store.dispatch(setLanguage('es'));
        expect(store.getState().ui.language).toBe('es');
      });

      it('should toggle notifications', () => {
        store.dispatch(setNotifications(false));
        expect(store.getState().ui.notifications).toBe(false);

        store.dispatch(setNotifications(true));
        expect(store.getState().ui.notifications).toBe(true);
      });
    });

    describe('Window Management', () => {
      it('should update window state', () => {
        const windowState = { width: 1440, height: 900 };
        store.dispatch(updateWindowState(windowState));
        const state = store.getState().ui;
        expect(state.window.width).toBe(1440);
        expect(state.window.height).toBe(900);
      });

      it('should set window maximized', () => {
        store.dispatch(setWindowMaximized(true));
        expect(store.getState().ui.window.maximized).toBe(true);
      });

      it('should set window fullscreen', () => {
        store.dispatch(setWindowFullscreen(true));
        expect(store.getState().ui.window.fullscreen).toBe(true);
      });

      it('should set window always on top', () => {
        store.dispatch(setWindowAlwaysOnTop(true));
        expect(store.getState().ui.window.alwaysOnTop).toBe(true);
      });
    });

    describe('Modal Management', () => {
      it('should manage settings modal', () => {
        store.dispatch(openSettingsModal());
        expect(store.getState().ui.modals.settingsOpen).toBe(true);

        store.dispatch(closeSettingsModal());
        expect(store.getState().ui.modals.settingsOpen).toBe(false);
      });

      it('should manage about modal', () => {
        store.dispatch(openAboutModal());
        expect(store.getState().ui.modals.aboutOpen).toBe(true);

        store.dispatch(closeAboutModal());
        expect(store.getState().ui.modals.aboutOpen).toBe(false);
      });

      it('should manage export modal', () => {
        store.dispatch(openExportModal());
        expect(store.getState().ui.modals.exportModalOpen).toBe(true);

        store.dispatch(closeExportModal());
        expect(store.getState().ui.modals.exportModalOpen).toBe(false);
      });

      it('should manage import modal', () => {
        store.dispatch(openImportModal());
        expect(store.getState().ui.modals.importModalOpen).toBe(true);

        store.dispatch(closeImportModal());
        expect(store.getState().ui.modals.importModalOpen).toBe(false);
      });

      it('should manage confirm dialog', () => {
        const confirmDialog = {
          title: 'Confirm Action',
          message: 'Are you sure?',
          confirmText: 'Yes',
          cancelText: 'No',
          onConfirm: 'confirm-action',
          onCancel: 'cancel-action',
          type: 'warning' as const,
        };

        store.dispatch(showConfirmDialog(confirmDialog));
        expect(store.getState().ui.modals.confirmDialog).toEqual(confirmDialog);

        store.dispatch(hideConfirmDialog());
        expect(store.getState().ui.modals.confirmDialog).toBeNull();
      });
    });

    describe('Search Management', () => {
      it('should set search query', () => {
        store.dispatch(setSearchQuery('test query'));
        expect(store.getState().ui.search.query).toBe('test query');
      });

      it('should set search filters', () => {
        const filters = { category: 'productivity' };
        store.dispatch(updateSearchFilters(filters));
        expect(store.getState().ui.search.filters).toEqual(filters);
      });

      it('should set search results', () => {
        const results = [{ id: '1', title: 'Result 1' }];
        store.dispatch(setSearchResults(results));
        expect(store.getState().ui.search.results).toEqual(results);
      });

      it('should set searching state', () => {
        store.dispatch(setSearchLoading(true));
        expect(store.getState().ui.search.searching).toBe(true);
      });

      it('should clear search', () => {
        store.dispatch(setSearchQuery('test'));
        store.dispatch(updateSearchFilters({ category: 'test' }));
        store.dispatch(setSearchResults([{ id: '1', title: 'Result' }]));
        store.dispatch(setSearchLoading(true));

        store.dispatch(clearSearch());
        const state = store.getState().ui.search;
        expect(state.query).toBe('');
        expect(state.filters).toEqual({ category: 'test' }); // Filters are not cleared by clearSearch
        expect(state.results).toEqual([]);
        expect(state.searching).toBe(false);
      });
    });

    describe('Toast Management', () => {
      it('should show toast notification', () => {
        const toast = {
          id: 'toast-1',
          message: 'Test message',
          type: 'success' as const,
          duration: 3000,
        };

        store.dispatch(addToast(toast));
        expect(store.getState().ui.toasts).toContainEqual(
          expect.objectContaining({
            id: 'toast-1',
            message: 'Test message',
            type: 'success',
          })
        );
      });

      it('should generate ID for toast if not provided', () => {
        const toast = {
          message: 'Test message',
          type: 'success' as const,
        };

        store.dispatch(addToast(toast));
        const state = store.getState().ui;
        expect(state.toasts).toHaveLength(1);
        expect(state.toasts[0]).toBeDefined();
        expect(state.toasts[0]?.id).toBeDefined();
        expect(state.toasts[0]?.message).toBe(toast.message);
      });

      it('should hide specific toast', () => {
        const toast1 = { id: 'toast-1', message: 'Message 1', type: 'success' as const };
        const toast2 = { id: 'toast-2', message: 'Message 2', type: 'info' as const };

        store.dispatch(addToast(toast1));
        store.dispatch(addToast(toast2));
        expect(store.getState().ui.toasts).toHaveLength(2);

        store.dispatch(removeToast('toast-1'));
        const state = store.getState().ui;
        expect(state.toasts).toHaveLength(1);
        expect(state.toasts[0]).toBeDefined();
        expect(state.toasts[0]?.message).toBe('Message 2');
      });

      it('should clear all toasts', () => {
        store.dispatch(addToast({ id: 'toast-1', message: 'Message 1', type: 'success' }));
        store.dispatch(addToast({ id: 'toast-2', message: 'Message 2', type: 'info' }));
        expect(store.getState().ui.toasts).toHaveLength(2);

        store.dispatch(clearAllToasts());
        expect(store.getState().ui.toasts).toHaveLength(0);
      });
    });
  });
});
