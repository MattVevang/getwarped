/**
 * IPCService - Type-safe IPC communication layer
 *
 * Provides a typed interface for communication between renderer and main processes.
 * Handles request/response patterns, error handling, and provides a clean API
 * for all IPC operations in the GetWarped application.
 *
 * @fileoverview IPC service layer for main/renderer communication
 */

import { ipcRenderer } from 'electron';
import {
  CreateServiceRequest,
  CreateServiceResponse,
  UpdateServiceRequest,
  UpdateServiceResponse,
  DeleteServiceRequest,
  DeleteServiceResponse,
  GetServicesRequest,
  GetServicesResponse,
  ReorderServicesRequest,
  ReorderServicesResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse,
  DeleteWorkspaceRequest,
  DeleteWorkspaceResponse,
  GetWorkspacesRequest,
  GetWorkspacesResponse,
  ExportConfigurationRequest,
  ExportConfigurationResponse,
  ImportConfigurationRequest,
  ImportConfigurationResponse,
  ClearSessionRequest,
  ClearSessionResponse,
  CreateBrowserViewRequest,
  CreateBrowserViewResponse,
  NavigateServiceRequest,
  NavigateServiceResponse,
  ResizeBrowserViewRequest,
  ResizeBrowserViewResponse,
  DestroyBrowserViewRequest,
  DestroyBrowserViewResponse,
} from '../../shared/types/IPCContracts';

/**
 * IPC error with additional context
 */
export class IPCError extends Error {
  constructor(
    message: string,
    public channel: string,
    public request?: any,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'IPCError';
  }
}

/**
 * IPC timeout error
 */
export class IPCTimeoutError extends IPCError {
  constructor(channel: string, timeout: number) {
    super(`IPC request timeout after ${timeout}ms`, channel);
    this.name = 'IPCTimeoutError';
  }
}

/**
 * IPC request options
 */
export interface IPCRequestOptions {
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to retry on failure */
  retries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Default IPC request options
 */
const DEFAULT_IPC_OPTIONS: Required<IPCRequestOptions> = {
  timeout: 10000, // 10 seconds
  retries: 2,
  retryDelay: 1000, // 1 second
};

/**
 * IPCService class for type-safe IPC communication
 */
export class IPCService {
  private static instance: IPCService;
  private defaultOptions: Required<IPCRequestOptions>;

  private constructor(options: Partial<IPCRequestOptions> = {}) {
    this.defaultOptions = { ...DEFAULT_IPC_OPTIONS, ...options };
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: Partial<IPCRequestOptions>): IPCService {
    if (!IPCService.instance) {
      IPCService.instance = new IPCService(options);
    }
    return IPCService.instance;
  }

  /**
   * Send IPC request with timeout and retry logic
   */
  private async sendRequest<TRequest, TResponse>(
    channel: string,
    request: TRequest,
    options: Partial<IPCRequestOptions> = {}
  ): Promise<TResponse> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt <= opts.retries; attempt++) {
      try {
        return await this.sendRequestInternal<TRequest, TResponse>(channel, request, opts.timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on certain types of errors
        if (error instanceof IPCTimeoutError || attempt === opts.retries) {
          throw lastError;
        }

        // Wait before retry
        if (attempt < opts.retries) {
          await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Internal request implementation with timeout
   */
  private async sendRequestInternal<TRequest, TResponse>(
    channel: string,
    request: TRequest,
    timeout: number
  ): Promise<TResponse> {
    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new IPCTimeoutError(channel, timeout));
      }, timeout);

      // Send request and wait for response
      ipcRenderer
        .invoke(channel, request)
        .then((response: TResponse) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error: any) => {
          clearTimeout(timeoutId);
          reject(new IPCError(`IPC request failed: ${error.message}`, channel, request, error));
        });
    });
  }

  // Service Management Methods

  /**
   * Create a new service
   */
  async createService(
    request: CreateServiceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<CreateServiceResponse> {
    return this.sendRequest<CreateServiceRequest, CreateServiceResponse>(
      'service:create',
      request,
      options
    );
  }

  /**
   * Update an existing service
   */
  async updateService(
    request: UpdateServiceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<UpdateServiceResponse> {
    return this.sendRequest<UpdateServiceRequest, UpdateServiceResponse>(
      'service:update',
      request,
      options
    );
  }

  /**
   * Delete a service
   */
  async deleteService(
    request: DeleteServiceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<DeleteServiceResponse> {
    return this.sendRequest<DeleteServiceRequest, DeleteServiceResponse>(
      'service:delete',
      request,
      options
    );
  }

  /**
   * Get all services or filter by workspace
   */
  async getServices(
    request: GetServicesRequest = {},
    options?: Partial<IPCRequestOptions>
  ): Promise<GetServicesResponse> {
    return this.sendRequest<GetServicesRequest, GetServicesResponse>(
      'service:list',
      request,
      options
    );
  }

  /**
   * Reorder services within a workspace
   */
  async reorderServices(
    request: ReorderServicesRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<ReorderServicesResponse> {
    return this.sendRequest<ReorderServicesRequest, ReorderServicesResponse>(
      'service:reorder',
      request,
      options
    );
  }

  // Workspace Management Methods

  /**
   * Create a new workspace
   */
  async createWorkspace(
    request: CreateWorkspaceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<CreateWorkspaceResponse> {
    return this.sendRequest<CreateWorkspaceRequest, CreateWorkspaceResponse>(
      'workspace:create',
      request,
      options
    );
  }

  /**
   * Update an existing workspace
   */
  async updateWorkspace(
    request: UpdateWorkspaceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<UpdateWorkspaceResponse> {
    return this.sendRequest<UpdateWorkspaceRequest, UpdateWorkspaceResponse>(
      'workspace:update',
      request,
      options
    );
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(
    request: DeleteWorkspaceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<DeleteWorkspaceResponse> {
    return this.sendRequest<DeleteWorkspaceRequest, DeleteWorkspaceResponse>(
      'workspace:delete',
      request,
      options
    );
  }

  /**
   * Get all workspaces
   */
  async getWorkspaces(
    request: GetWorkspacesRequest = {},
    options?: Partial<IPCRequestOptions>
  ): Promise<GetWorkspacesResponse> {
    return this.sendRequest<GetWorkspacesRequest, GetWorkspacesResponse>(
      'workspace:list',
      request,
      options
    );
  }

  // Configuration Management Methods

  /**
   * Export application configuration
   */
  async exportConfiguration(
    request: ExportConfigurationRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<ExportConfigurationResponse> {
    return this.sendRequest<ExportConfigurationRequest, ExportConfigurationResponse>(
      'config:export',
      request,
      { ...options, timeout: 30000 } // Longer timeout for export
    );
  }

  /**
   * Import application configuration
   */
  async importConfiguration(
    request: ImportConfigurationRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<ImportConfigurationResponse> {
    return this.sendRequest<ImportConfigurationRequest, ImportConfigurationResponse>(
      'config:import',
      request,
      { ...options, timeout: 30000 } // Longer timeout for import
    );
  }

  // Session Management Methods

  /**
   * Clear session data for a service
   */
  async clearSession(
    request: ClearSessionRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<ClearSessionResponse> {
    return this.sendRequest<ClearSessionRequest, ClearSessionResponse>(
      'session:clear',
      request,
      options
    );
  }

  // BrowserView Management Methods

  /**
   * Create a new browser view for a service
   */
  async createBrowserView(
    request: CreateBrowserViewRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<CreateBrowserViewResponse> {
    return this.sendRequest<CreateBrowserViewRequest, CreateBrowserViewResponse>(
      'browserview:create',
      request,
      options
    );
  }

  /**
   * Navigate browser view to URL
   */
  async navigateService(
    request: NavigateServiceRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<NavigateServiceResponse> {
    return this.sendRequest<NavigateServiceRequest, NavigateServiceResponse>(
      'browserview:navigate',
      request,
      options
    );
  }

  /**
   * Resize browser view
   */
  async resizeBrowserView(
    request: ResizeBrowserViewRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<ResizeBrowserViewResponse> {
    return this.sendRequest<ResizeBrowserViewRequest, ResizeBrowserViewResponse>(
      'browserview:resize',
      request,
      options
    );
  }

  /**
   * Destroy/close a browser view
   */
  async destroyBrowserView(
    request: DestroyBrowserViewRequest,
    options?: Partial<IPCRequestOptions>
  ): Promise<DestroyBrowserViewResponse> {
    return this.sendRequest<DestroyBrowserViewRequest, DestroyBrowserViewResponse>(
      'browserview:destroy',
      request,
      options
    );
  }

  // Utility Methods

  /**
   * Check if IPC is available
   */
  isAvailable(): boolean {
    return typeof ipcRenderer !== 'undefined' && ipcRenderer !== null;
  }

  /**
   * Update default options
   */
  setDefaultOptions(options: Partial<IPCRequestOptions>): void {
    Object.assign(this.defaultOptions, options);
  }

  /**
   * Get current default options
   */
  getDefaultOptions(): Required<IPCRequestOptions> {
    return { ...this.defaultOptions };
  }

  // Event Listener Methods

  /**
   * Add event listener for IPC events
   */
  on(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): void {
    ipcRenderer.on(channel, listener);
  }

  /**
   * Remove event listener for IPC events
   */
  off(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): void {
    ipcRenderer.off(channel, listener);
  }

  /**
   * Add one-time event listener for IPC events
   */
  once(
    channel: string,
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void
  ): void {
    ipcRenderer.once(channel, listener);
  }

  /**
   * Remove all listeners for a channel
   */
  removeAllListeners(channel: string): void {
    ipcRenderer.removeAllListeners(channel);
  }
}

/**
 * IPC service utilities
 */
export const IPCUtils = {
  /**
   * Check if error is an IPC timeout error
   */
  isTimeoutError(error: Error): error is IPCTimeoutError {
    return error instanceof IPCTimeoutError;
  },

  /**
   * Check if error is an IPC error
   */
  isIPCError(error: Error): error is IPCError {
    return error instanceof IPCError;
  },

  /**
   * Extract channel from IPC error
   */
  getErrorChannel(error: Error): string | null {
    return error instanceof IPCError ? error.channel : null;
  },

  /**
   * Create a typed IPC request wrapper
   */
  createTypedRequest: <TRequest, TResponse>(channel: string) => {
    return (
      ipcService: IPCService,
      request: TRequest,
      options?: Partial<IPCRequestOptions>
    ): Promise<TResponse> => {
      return (ipcService as any).sendRequest(channel, request, options) as Promise<TResponse>;
    };
  },

  /**
   * Batch IPC requests
   */
  async batchRequests<T>(
    requests: Array<Promise<T>>,
    options: { failFast?: boolean; maxConcurrent?: number } = {}
  ): Promise<Array<T | Error>> {
    const { failFast = false, maxConcurrent = 10 } = options;

    if (failFast) {
      return Promise.all(requests);
    }

    // Limit concurrency
    const batches: Array<Promise<T>[]> = [];
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      batches.push(requests.slice(i, i + maxConcurrent));
    }

    const results: Array<T | Error> = [];

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(batch);
      results.push(
        ...batchResults.map(result =>
          result.status === 'fulfilled' ? result.value : result.reason
        )
      );
    }

    return results;
  },

  /**
   * Retry IPC request with exponential backoff
   */
  async retryWithBackoff<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },
};

/**
 * Global IPC service instance
 */
export const ipcService = IPCService.getInstance({
  timeout: 10000,
  retries: 2,
  retryDelay: 1000,
});

export default IPCService;
