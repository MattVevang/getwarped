/**
 * Export/Import Redux Slice
 *
 * Manages configuration export/import operations with security validation,
 * backup scheduling, and migration support. Handles IPC communication
 * with main process for secure file operations.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  ConfigurationExport,
  ExportedWorkspace,
  ExportMetadata,
} from '../../../shared/types/ConfigurationExport';

// IPC Service (will be imported when created)
// import { ipcService } from '../../services/IPCService';

/**
 * Export/Import state interface
 */
export interface ExportImportState {
  // Export state
  exporting: boolean;
  exportProgress: number;
  exportError: string | null;
  lastExportPath: string | null;
  lastExportDate: Date | null;

  // Import state
  importing: boolean;
  importProgress: number;
  importError: string | null;
  importPreview: ConfigurationExport | null;
  importValidation: ImportValidationResult | null;

  // Settings
  settings: {
    defaultExportPath: string | null;
    includeThemes: boolean;
    includePreferences: boolean;
    autoBackup: boolean;
    backupFrequency: number; // hours
    maxBackups: number;
    compressExports: boolean;
  };

  // Security warnings
  securityWarnings: string[];

  // Migration state
  migrationRequired: boolean;
  migrationProgress: number;
}

/**
 * Import validation result
 */
interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  compatibilityIssues: string[];
  requiresReauth: boolean;
  workspacesCount: number;
  servicesCount: number;
}

/**
 * IPC Request/Response interfaces
 */
interface ExportConfigurationRequest {
  exportPath: string;
  includeThemes: boolean;
  includePreferences: boolean;
  compress: boolean;
}

interface ExportConfigurationResponse {
  success: boolean;
  exportPath?: string;
  error?: string;
  metadata?: ExportMetadata;
}

interface ImportConfigurationRequest {
  importPath: string;
  validateOnly?: boolean;
}

interface ImportConfigurationResponse {
  success: boolean;
  data?: ConfigurationExport;
  validation?: ImportValidationResult;
  error?: string;
}

interface ValidateImportRequest {
  filePath: string;
}

interface ValidateImportResponse {
  success: boolean;
  validation?: ImportValidationResult;
  preview?: ConfigurationExport;
  error?: string;
}

interface BackupConfigurationRequest {
  automatic?: boolean;
}

interface BackupConfigurationResponse {
  success: boolean;
  backupPath?: string;
  error?: string;
}

/**
 * Initial export/import state
 */
const initialState: ExportImportState = {
  exporting: false,
  exportProgress: 0,
  exportError: null,
  lastExportPath: null,
  lastExportDate: null,

  importing: false,
  importProgress: 0,
  importError: null,
  importPreview: null,
  importValidation: null,

  settings: {
    defaultExportPath: null,
    includeThemes: true,
    includePreferences: true,
    autoBackup: false,
    backupFrequency: 24, // 24 hours
    maxBackups: 10,
    compressExports: true,
  },

  securityWarnings: [],
  migrationRequired: false,
  migrationProgress: 0,
};

/**
 * Async thunk for exporting configuration
 */
export const exportConfiguration = createAsyncThunk(
  'exportImport/export',
  async (request: ExportConfigurationRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('config:export', request);

      // Temporary mock response for development
      const response: ExportConfigurationResponse = {
        success: true,
        exportPath: request.exportPath,
        metadata: {
          appVersion: '1.0.0',
          platform: 'Windows',
          totalWorkspaces: 0,
          totalServices: 0,
          exportVersion: '1.0.0',
          createdAt: new Date(),
        },
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to export configuration');
      }

      return {
        exportPath: response.exportPath!,
        metadata: response.metadata!,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for validating import file
 */
export const validateImportFile = createAsyncThunk(
  'exportImport/validateImport',
  async (request: ValidateImportRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('config:validate-import', request);

      // Temporary mock response for development
      const response: ValidateImportResponse = {
        success: true,
        validation: {
          valid: true,
          errors: [],
          warnings: ['This configuration was created on a different operating system'],
          compatibilityIssues: [],
          requiresReauth: true,
          workspacesCount: 2,
          servicesCount: 5,
        },
        preview: {
          version: '1.0.0',
          exportedAt: new Date(),
          workspaces: [],
          metadata: {
            appVersion: '1.0.0',
            platform: 'Windows',
            totalWorkspaces: 2,
            totalServices: 5,
            exportVersion: '1.0.0',
            createdAt: new Date(),
          },
        },
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to validate import file');
      }

      return {
        validation: response.validation!,
        preview: response.preview!,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for importing configuration
 */
export const importConfiguration = createAsyncThunk(
  'exportImport/import',
  async (request: ImportConfigurationRequest, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('config:import', request);

      // Temporary mock response for development
      const response: ImportConfigurationResponse = {
        success: true,
        data: {
          version: '1.0.0',
          exportedAt: new Date(),
          workspaces: [],
          metadata: {
            appVersion: '1.0.0',
            platform: 'Windows',
            totalWorkspaces: 0,
            totalServices: 0,
            exportVersion: '1.0.0',
            createdAt: new Date(),
          },
        },
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to import configuration');
      }

      return response.data!;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Async thunk for creating configuration backup
 */
export const createBackup = createAsyncThunk(
  'exportImport/backup',
  async (request: BackupConfigurationRequest = {}, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual IPC call when IPCService is available
      // const response = await ipcService.invoke('config:backup', request);

      // Temporary mock response for development
      const response: BackupConfigurationResponse = {
        success: true,
        backupPath: `backup-${Date.now()}.json`,
      };

      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to create backup');
      }

      return {
        backupPath: response.backupPath!,
        automatic: request.automatic || false,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

/**
 * Export/Import slice definition
 */
export const exportImportSlice = createSlice({
  name: 'exportImport',
  initialState,
  reducers: {
    // Settings management
    updateExportSettings: (
      state,
      action: PayloadAction<Partial<ExportImportState['settings']>>
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    setDefaultExportPath: (state, action: PayloadAction<string>) => {
      state.settings.defaultExportPath = action.payload;
    },

    toggleAutoBackup: state => {
      state.settings.autoBackup = !state.settings.autoBackup;
    },

    // Progress management
    setExportProgress: (state, action: PayloadAction<number>) => {
      state.exportProgress = Math.max(0, Math.min(100, action.payload));
    },

    setImportProgress: (state, action: PayloadAction<number>) => {
      state.importProgress = Math.max(0, Math.min(100, action.payload));
    },

    setMigrationProgress: (state, action: PayloadAction<number>) => {
      state.migrationProgress = Math.max(0, Math.min(100, action.payload));
    },

    // Security warnings management
    addSecurityWarning: (state, action: PayloadAction<string>) => {
      if (!state.securityWarnings.includes(action.payload)) {
        state.securityWarnings.push(action.payload);
      }
    },

    clearSecurityWarnings: state => {
      state.securityWarnings = [];
    },

    // Error management
    clearExportError: state => {
      state.exportError = null;
    },

    clearImportError: state => {
      state.importError = null;
    },

    // Preview management
    clearImportPreview: state => {
      state.importPreview = null;
      state.importValidation = null;
    },

    // Migration management
    setMigrationRequired: (state, action: PayloadAction<boolean>) => {
      state.migrationRequired = action.payload;
      if (!action.payload) {
        state.migrationProgress = 0;
      }
    },

    // Reset state
    resetExportImportState: state => {
      state.exporting = false;
      state.importing = false;
      state.exportProgress = 0;
      state.importProgress = 0;
      state.exportError = null;
      state.importError = null;
      state.importPreview = null;
      state.importValidation = null;
      state.securityWarnings = [];
      state.migrationRequired = false;
      state.migrationProgress = 0;
    },
  },
  extraReducers: builder => {
    // Export configuration
    builder
      .addCase(exportConfiguration.pending, state => {
        state.exporting = true;
        state.exportProgress = 0;
        state.exportError = null;
      })
      .addCase(exportConfiguration.fulfilled, (state, action) => {
        state.exporting = false;
        state.exportProgress = 100;
        state.lastExportPath = action.payload.exportPath;
        state.lastExportDate = new Date();
      })
      .addCase(exportConfiguration.rejected, (state, action) => {
        state.exporting = false;
        state.exportProgress = 0;
        state.exportError = (action.payload as string) || 'Export failed';
      });

    // Validate import
    builder
      .addCase(validateImportFile.pending, state => {
        state.importError = null;
        state.importValidation = null;
        state.importPreview = null;
      })
      .addCase(validateImportFile.fulfilled, (state, action) => {
        state.importValidation = action.payload.validation;
        state.importPreview = action.payload.preview;

        // Add security warnings based on validation
        if (action.payload.validation.requiresReauth) {
          state.securityWarnings.push('Import requires re-authentication for all services');
        }

        if (action.payload.validation.warnings.length > 0) {
          state.securityWarnings.push(...action.payload.validation.warnings);
        }
      })
      .addCase(validateImportFile.rejected, (state, action) => {
        state.importError = (action.payload as string) || 'Import validation failed';
      });

    // Import configuration
    builder
      .addCase(importConfiguration.pending, state => {
        state.importing = true;
        state.importProgress = 0;
        state.importError = null;
      })
      .addCase(importConfiguration.fulfilled, (state, action) => {
        state.importing = false;
        state.importProgress = 100;
        state.importPreview = null;
        state.importValidation = null;
        state.securityWarnings = [];

        // Check if migration is required
        const importedVersion = action.payload.metadata.exportVersion;
        const currentVersion = '1.0.0'; // Should come from app config
        if (importedVersion !== currentVersion) {
          state.migrationRequired = true;
        }
      })
      .addCase(importConfiguration.rejected, (state, action) => {
        state.importing = false;
        state.importProgress = 0;
        state.importError = (action.payload as string) || 'Import failed';
      });

    // Create backup
    builder
      .addCase(createBackup.pending, state => {
        // Backup is a background operation, no loading state needed
      })
      .addCase(createBackup.fulfilled, (state, action) => {
        // Backup completed successfully
        if (action.payload.automatic) {
          // Update last backup timestamp for automatic backups
          state.lastExportDate = new Date();
        }
      })
      .addCase(createBackup.rejected, (state, action) => {
        // Backup failed, could add to error state if needed
        state.exportError = (action.payload as string) || 'Backup failed';
      });
  },
});

// Export actions
export const {
  updateExportSettings,
  setDefaultExportPath,
  toggleAutoBackup,
  setExportProgress,
  setImportProgress,
  setMigrationProgress,
  addSecurityWarning,
  clearSecurityWarnings,
  clearExportError,
  clearImportError,
  clearImportPreview,
  setMigrationRequired,
  resetExportImportState,
} = exportImportSlice.actions;

// Selectors
export const selectExportImportState = (state: { exportImport: ExportImportState }) =>
  state.exportImport;
export const selectExportProgress = (state: { exportImport: ExportImportState }) =>
  state.exportImport.exportProgress;
export const selectImportProgress = (state: { exportImport: ExportImportState }) =>
  state.exportImport.importProgress;
export const selectExportSettings = (state: { exportImport: ExportImportState }) =>
  state.exportImport.settings;
export const selectImportPreview = (state: { exportImport: ExportImportState }) =>
  state.exportImport.importPreview;
export const selectImportValidation = (state: { exportImport: ExportImportState }) =>
  state.exportImport.importValidation;
export const selectSecurityWarnings = (state: { exportImport: ExportImportState }) =>
  state.exportImport.securityWarnings;
export const selectIsExporting = (state: { exportImport: ExportImportState }) =>
  state.exportImport.exporting;
export const selectIsImporting = (state: { exportImport: ExportImportState }) =>
  state.exportImport.importing;
export const selectMigrationRequired = (state: { exportImport: ExportImportState }) =>
  state.exportImport.migrationRequired;

export default exportImportSlice.reducer;
