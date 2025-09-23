/**
 * Workspaces Redux Slice
 *
 * Manages workspace state including CRUD operations, reordering, default workspace
 * management, and IPC communication with the main process.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Workspace, WorkspaceTheme } from '../../../shared/types/Workspace';
import { WorkspacesState } from '../../../shared/types/ApplicationState';

// IPC Service (will be imported when created)
// import { ipcService } from '../../services/IPCService';

/**
 * IPC Request/Response interfaces for workspace operations
 */
interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  theme: WorkspaceTheme;
}

interface CreateWorkspaceResponse {
  success: boolean;
  workspaceId?: string;
  workspace?: Workspace;
  error?: string;
}

interface UpdateWorkspaceRequest {
  workspaceId: string;
  updates: Partial<Workspace>;
}

interface UpdateWorkspaceResponse {
  success: boolean;
  error?: string;
}

interface DeleteWorkspaceRequest {
  workspaceId: string;
  moveServicesTo?: string;
}

interface DeleteWorkspaceResponse {
  success: boolean;
  error?: string;
}

interface GetWorkspacesResponse {
  success: boolean;
  workspaces: Workspace[];
  error?: string;
}

interface SetActiveWorkspaceRequest {
  workspaceId: string;
}

interface SetActiveWorkspaceResponse {
  success: boolean;
  error?: string;
}

interface ReorderWorkspacesRequest {
  workspaceIds: string[];
}

interface ReorderWorkspacesResponse {
  success: boolean;
  error?: string;
}

/**
 * Initial workspaces state
 */
const initialState: WorkspacesState = {
  items: {},
  activeWorkspaceId: null,
  loading: false,
  error: null,
  workspaceFormOpen: false,
  editingWorkspaceId: null,
  reorderMode: false,
};

/**
 * Async thunk for creating a new workspace
 */
export const createWorkspace = createAsyncThunk(
  'workspaces/create',
  async (request: CreateWorkspaceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('workspace:create', request);

      // Temporary mock response for development
      const workspace: Workspace = {
        id: `workspace-${Date.now()}`,
        name: request.name,
        description: request.description,
        services: [],
        theme: request.theme,
        isDefault: false,
        position: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response: CreateWorkspaceResponse = {
        success: true,
        workspaceId: workspace.id,
        workspace,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to create workspace');
      }

      return response.workspace!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for updating an existing workspace
 */
export const updateWorkspace = createAsyncThunk(
  'workspaces/update',
  async (request: UpdateWorkspaceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('workspace:update', request);

      // Temporary mock response for development
      const response: UpdateWorkspaceResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to update workspace');
      }

      return request;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for deleting a workspace
 */
export const deleteWorkspace = createAsyncThunk(
  'workspaces/delete',
  async (request: DeleteWorkspaceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('workspace:delete', request);

      // Temporary mock response for development
      const response: DeleteWorkspaceResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to delete workspace');
      }

      return request.workspaceId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for fetching all workspaces
 */
export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetch',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('workspace:list');

      // Temporary mock response for development
      const response: GetWorkspacesResponse = {
        success: true,
        workspaces: [],
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to fetch workspaces');
      }

      return response.workspaces;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for setting the active workspace
 */
export const setActiveWorkspace = createAsyncThunk(
  'workspaces/setActive',
  async (request: SetActiveWorkspaceRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('workspace:activate', request);

      // Temporary mock response for development
      const response: SetActiveWorkspaceResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to set active workspace');
      }

      return request.workspaceId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for reordering workspaces
 */
export const reorderWorkspaces = createAsyncThunk(
  'workspaces/reorder',
  async (request: ReorderWorkspacesRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('workspace:reorder', request);

      // Temporary mock response for development
      const response: ReorderWorkspacesResponse = {
        success: true,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to reorder workspaces');
      }

      return request.workspaceIds;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Workspaces slice definition
 */
export const workspacesSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    // UI state management
    setActiveWorkspaceLocal: (state, action: PayloadAction<string | null>) => {
      state.activeWorkspaceId = action.payload;
    },

    openWorkspaceForm: (state, action: PayloadAction<string | null>) => {
      state.workspaceFormOpen = true;
      state.editingWorkspaceId = action.payload;
    },

    closeWorkspaceForm: state => {
      state.workspaceFormOpen = false;
      state.editingWorkspaceId = null;
    },

    setReorderMode: (state, action: PayloadAction<boolean>) => {
      state.reorderMode = action.payload;
    },

    clearError: state => {
      state.error = null;
    },

    // Local workspace updates (optimistic updates)
    updateWorkspaceLocal: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Workspace> }>
    ) => {
      const { id, updates } = action.payload;
      if (state.items[id]) {
        state.items[id] = {
          ...state.items[id],
          ...updates,
          updatedAt: new Date(),
        };
      }
    },

    // Service management within workspace
    addServiceToWorkspace: (
      state,
      action: PayloadAction<{ workspaceId: string; serviceId: string }>
    ) => {
      const { workspaceId, serviceId } = action.payload;
      const workspace = state.items[workspaceId];
      if (workspace && !workspace.services.includes(serviceId)) {
        workspace.services.push(serviceId);
        workspace.updatedAt = new Date();
      }
    },

    removeServiceFromWorkspace: (
      state,
      action: PayloadAction<{ workspaceId: string; serviceId: string }>
    ) => {
      const { workspaceId, serviceId } = action.payload;
      const workspace = state.items[workspaceId];
      if (workspace) {
        workspace.services = workspace.services.filter(id => id !== serviceId);
        workspace.updatedAt = new Date();
      }
    },

    // Default workspace management
    setDefaultWorkspace: (state, action: PayloadAction<string>) => {
      // Clear all default flags
      Object.values(state.items).forEach(workspace => {
        workspace.isDefault = false;
      });

      // Set new default
      const newDefault = state.items[action.payload];
      if (newDefault) {
        newDefault.isDefault = true;
        newDefault.updatedAt = new Date();
      }
    },
  },
  extraReducers: builder => {
    // Create workspace
    builder
      .addCase(createWorkspace.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        const workspace = action.payload;
        state.items[workspace.id] = workspace;

        // If this is the first workspace, make it default and active
        const workspaceCount = Object.keys(state.items).length;
        if (workspaceCount === 1 || !Object.values(state.items).some(w => w.isDefault)) {
          workspace.isDefault = true;
          state.activeWorkspaceId = workspace.id;
        }

        state.workspaceFormOpen = false;
        state.editingWorkspaceId = null;
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to create workspace';
      });

    // Update workspace
    builder
      .addCase(updateWorkspace.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        const { workspaceId, updates } = action.payload;
        if (state.items[workspaceId]) {
          state.items[workspaceId] = {
            ...state.items[workspaceId],
            ...updates,
            updatedAt: new Date(),
          };
        }
        state.workspaceFormOpen = false;
        state.editingWorkspaceId = null;
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to update workspace';
      });

    // Delete workspace
    builder
      .addCase(deleteWorkspace.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        const workspaceId = action.payload;

        // If deleting active workspace, clear selection
        if (state.activeWorkspaceId === workspaceId) {
          state.activeWorkspaceId = null;
        }

        // If deleting editing workspace, close form
        if (state.editingWorkspaceId === workspaceId) {
          state.workspaceFormOpen = false;
          state.editingWorkspaceId = null;
        }

        delete state.items[workspaceId];

        // If we deleted the default workspace, make the first remaining one default
        const remainingWorkspaces = Object.values(state.items);
        if (remainingWorkspaces.length > 0 && !remainingWorkspaces.some(w => w.isDefault)) {
          const firstWorkspace = remainingWorkspaces.sort((a, b) => a.position - b.position)[0];
          firstWorkspace.isDefault = true;
          state.activeWorkspaceId = firstWorkspace.id;
        }
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to delete workspace';
      });

    // Fetch workspaces
    builder
      .addCase(fetchWorkspaces.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = {};
        action.payload.forEach(workspace => {
          state.items[workspace.id] = workspace;
        });

        // Set active workspace to default if not already set
        if (!state.activeWorkspaceId) {
          const defaultWorkspace = action.payload.find(w => w.isDefault);
          if (defaultWorkspace) {
            state.activeWorkspaceId = defaultWorkspace.id;
          } else if (action.payload.length > 0) {
            // If no default, use first workspace
            const firstWorkspace = action.payload.sort((a, b) => a.position - b.position)[0];
            state.activeWorkspaceId = firstWorkspace.id;
          }
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch workspaces';
      });

    // Set active workspace
    builder
      .addCase(setActiveWorkspace.pending, state => {
        state.error = null;
      })
      .addCase(setActiveWorkspace.fulfilled, (state, action) => {
        state.activeWorkspaceId = action.payload;
      })
      .addCase(setActiveWorkspace.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to set active workspace';
      });

    // Reorder workspaces
    builder
      .addCase(reorderWorkspaces.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        // Update positions based on new order
        const workspaceIds = action.payload;
        workspaceIds.forEach((workspaceId, index) => {
          if (state.items[workspaceId]) {
            state.items[workspaceId].position = index;
            state.items[workspaceId].updatedAt = new Date();
          }
        });
        state.reorderMode = false;
      })
      .addCase(reorderWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to reorder workspaces';
      });
  },
});

// Export actions
export const {
  setActiveWorkspaceLocal,
  openWorkspaceForm,
  closeWorkspaceForm,
  setReorderMode,
  clearError,
  updateWorkspaceLocal,
  addServiceToWorkspace,
  removeServiceFromWorkspace,
  setDefaultWorkspace,
} = workspacesSlice.actions;

// Selectors
export const selectWorkspaces = (state: { workspaces: WorkspacesState }) => state.workspaces.items;
export const selectActiveWorkspace = (state: { workspaces: WorkspacesState }) => {
  const { activeWorkspaceId, items } = state.workspaces;
  return activeWorkspaceId ? items[activeWorkspaceId] : null;
};
export const selectWorkspacesList = (state: { workspaces: WorkspacesState }) => {
  return Object.values(state.workspaces.items).sort((a, b) => a.position - b.position);
};
export const selectDefaultWorkspace = (state: { workspaces: WorkspacesState }) => {
  return Object.values(state.workspaces.items).find(w => w.isDefault) || null;
};
export const selectWorkspacesLoading = (state: { workspaces: WorkspacesState }) =>
  state.workspaces.loading;
export const selectWorkspacesError = (state: { workspaces: WorkspacesState }) =>
  state.workspaces.error;
export const selectWorkspaceById = (state: { workspaces: WorkspacesState }, workspaceId: string) =>
  state.workspaces.items[workspaceId];

export default workspacesSlice.reducer;
