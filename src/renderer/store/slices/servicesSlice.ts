/**
 * Services Redux Slice
 *
 * Manages service state including CRUD operations, templates, health monitoring,
 * and IPC communication with the main process for service management.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ServiceConfiguration, ServiceTheme } from '../../../shared/types/ServiceConfiguration';
import { ServicesState, ServiceHealthStatus } from '../../../shared/types/ApplicationState';
import { ServiceTemplate } from '../../../shared/types/ServiceTemplate';

// IPC Service (will be imported when created)
// import { ipcService } from '../../services/IPCService';

/**
 * IPC Request/Response interfaces for service operations
 */
interface CreateServiceRequest {
  workspaceId: string;
  name: string;
  url: string;
  icon?: string;
  iconType: 'url' | 'base64' | 'builtin';
  customUserAgent?: string;
  theme?: ServiceTheme;
}

interface CreateServiceResponse {
  success: boolean;
  serviceId?: string;
  service?: ServiceConfiguration;
  error?: string;
}

interface UpdateServiceRequest {
  serviceId: string;
  updates: Partial<ServiceConfiguration>;
}

interface UpdateServiceResponse {
  success: boolean;
  error?: string;
}

interface DeleteServiceRequest {
  serviceId: string;
}

interface DeleteServiceResponse {
  success: boolean;
  error?: string;
}

interface GetServicesRequest {
  workspaceId?: string;
}

interface GetServicesResponse {
  success: boolean;
  services: ServiceConfiguration[];
  error?: string;
}

interface ReorderServicesRequest {
  workspaceId: string;
  serviceIds: string[];
}

interface ReorderServicesResponse {
  success: boolean;
  error?: string;
}

/**
 * Initial services state
 */
const initialState: ServicesState = {
  items: {},
  activeServiceId: null,
  templates: {},
  loading: false,
  error: null,
  serviceFormOpen: false,
  editingServiceId: null,
  templateModalOpen: false,
  healthStatus: {},
};

/**
 * Async thunk for creating a new service
 */
export const createService = createAsyncThunk(
  'services/create',
  async (request: CreateServiceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('service:create', request);

      // Temporary mock response for development
      const response: CreateServiceResponse = {
        success: true,
        serviceId: `service-${Date.now()}`,
        service: {
          id: `service-${Date.now()}`,
          name: request.name,
          url: request.url,
          ...(request.icon !== undefined && { icon: request.icon }),
          iconType: request.iconType,
          workspaceId: request.workspaceId,
          position: 0,
          sortOrder: Date.now(),
          ...(request.theme !== undefined && { theme: request.theme }),
          notifications: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(request.customUserAgent !== undefined && {
            customUserAgent: request.customUserAgent,
          }),
          blockAds: false,
          blockTrackers: false,
        },
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to create service');
      }

      return response.service!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for updating an existing service
 */
export const updateService = createAsyncThunk(
  'services/update',
  async (request: UpdateServiceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('service:update', request);

      // Temporary mock response for development
      const response: UpdateServiceResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to update service');
      }

      return request;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for deleting a service
 */
export const deleteService = createAsyncThunk(
  'services/delete',
  async (request: DeleteServiceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('service:delete', request);

      // Temporary mock response for development
      const response: DeleteServiceResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to delete service');
      }

      return request.serviceId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for fetching services
 */
export const fetchServices = createAsyncThunk(
  'services/fetch',
  async (_request: GetServicesRequest = {}, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('service:list', request);

      // Temporary mock response for development
      const response: GetServicesResponse = {
        success: true,
        services: [],
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch services');
      }

      return response.services;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for reordering services
 */
export const reorderServices = createAsyncThunk(
  'services/reorder',
  async (request: ReorderServicesRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('service:reorder', request);

      // Temporary mock response for development
      const response: ReorderServicesResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to reorder services');
      }

      return request;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Services slice definition
 */
export const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    // UI state management
    setActiveService: (state, action: PayloadAction<string | null>) => {
      state.activeServiceId = action.payload;
    },

    openServiceForm: (state, action: PayloadAction<string | null>) => {
      state.serviceFormOpen = true;
      state.editingServiceId = action.payload;
    },

    closeServiceForm: state => {
      state.serviceFormOpen = false;
      state.editingServiceId = null;
    },

    openTemplateModal: state => {
      state.templateModalOpen = true;
    },

    closeTemplateModal: state => {
      state.templateModalOpen = false;
    },

    clearError: state => {
      state.error = null;
    },

    // Service templates management
    setServiceTemplates: (state, action: PayloadAction<ServiceTemplate[]>) => {
      state.templates = {};
      action.payload.forEach(template => {
        state.templates[template.id] = template;
      });
    },

    // Health status management
    updateHealthStatus: (state, action: PayloadAction<ServiceHealthStatus>) => {
      state.healthStatus[action.payload.serviceId] = action.payload;
    },

    clearHealthStatus: (state, action: PayloadAction<string>) => {
      delete state.healthStatus[action.payload];
    },

    // Local service updates (optimistic updates)
    updateServiceLocal: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ServiceConfiguration> }>
    ) => {
      const { id, updates } = action.payload;
      if (state.items[id]) {
        state.items[id] = {
          ...state.items[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
  },
  extraReducers: builder => {
    // Create service
    builder
      .addCase(createService.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        state.items[action.payload.id] = action.payload;
        state.serviceFormOpen = false;
        state.editingServiceId = null;
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to create service';
      });

    // Update service
    builder
      .addCase(updateService.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        const { serviceId, updates } = action.payload;
        if (state.items[serviceId]) {
          state.items[serviceId] = {
            ...state.items[serviceId],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        state.serviceFormOpen = false;
        state.editingServiceId = null;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to update service';
      });

    // Delete service
    builder
      .addCase(deleteService.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        delete state.items[action.payload];
        if (state.activeServiceId === action.payload) {
          state.activeServiceId = null;
        }
        if (state.editingServiceId === action.payload) {
          state.serviceFormOpen = false;
          state.editingServiceId = null;
        }
        delete state.healthStatus[action.payload];
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to delete service';
      });

    // Fetch services
    builder
      .addCase(fetchServices.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = {};
        action.payload.forEach(service => {
          state.items[service.id] = service;
        });
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch services';
      });

    // Reorder services
    builder
      .addCase(reorderServices.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderServices.fulfilled, (state, action) => {
        state.loading = false;
        // Update positions based on new order
        const { serviceIds } = action.payload;
        serviceIds.forEach((serviceId, index) => {
          if (state.items[serviceId]) {
            state.items[serviceId].position = index;
            state.items[serviceId].updatedAt = new Date().toISOString();
          }
        });
      })
      .addCase(reorderServices.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to reorder services';
      });
  },
});

// Export actions
export const {
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
} = servicesSlice.actions;

// Selectors
export const selectServices = (state: { services: ServicesState }) => state.services.items;
export const selectActiveService = (state: { services: ServicesState }) => {
  const { activeServiceId, items } = state.services;
  return activeServiceId ? items[activeServiceId] : null;
};
export const selectServicesByWorkspace = (
  state: { services: ServicesState },
  workspaceId: string
) => {
  return Object.values(state.services.items)
    .filter(service => service.workspaceId === workspaceId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));
};
export const selectServicesLoading = (state: { services: ServicesState }) => state.services.loading;
export const selectServicesError = (state: { services: ServicesState }) => state.services.error;
export const selectServiceTemplates = (state: { services: ServicesState }) =>
  state.services.templates;
export const selectServiceHealth = (state: { services: ServicesState }, serviceId: string) =>
  state.services.healthStatus[serviceId];

export default servicesSlice.reducer;
