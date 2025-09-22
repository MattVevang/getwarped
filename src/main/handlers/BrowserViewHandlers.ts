import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import BrowserViewManager, {
  BrowserViewConfig,
  BrowserViewState,
} from '../security/BrowserViewManager';

/**
 * Standard IPC response interface for successful operations
 */
export interface IPCSuccessResponse<T> {
  success: true;
  data: T;
  warnings?: string[];
}

/**
 * Standard IPC response interface for failed operations
 */
export interface IPCErrorResponse {
  success: false;
  error: string;
  warnings?: string[];
}

/**
 * Union type for all IPC responses
 */
export type IPCResponse<T = any> = IPCSuccessResponse<T> | IPCErrorResponse;

/**
 * Browser view attachment request
 */
export interface AttachViewRequest {
  /** View ID to attach */
  viewId: string;
  /** Window ID to attach to */
  windowId: number;
}

/**
 * Browser view detachment request
 */
export interface DetachViewRequest {
  /** View ID to detach */
  viewId: string;
  /** Window ID to detach from (optional) */
  windowId?: number;
}

/**
 * Browser view navigation request
 */
export interface NavigateViewRequest {
  /** View ID to navigate */
  viewId: string;
  /** URL to navigate to */
  url: string;
}

/**
 * Browser view bounds update request
 */
export interface UpdateBoundsRequest {
  /** View ID to update */
  viewId: string;
  /** New bounds */
  bounds: BrowserViewConfig['bounds'];
}

/**
 * BrowserView Handlers for IPC communication
 * Handles browser view lifecycle and management operations
 */
export class BrowserViewHandlers {
  private browserViewManager: BrowserViewManager;

  constructor(browserViewManager: BrowserViewManager) {
    this.browserViewManager = browserViewManager;
    this.registerHandlers();
  }

  /**
   * Register all browser view-related IPC handlers
   */
  private registerHandlers(): void {
    // Browser view lifecycle operations
    ipcMain.handle('browserview:create', this.handleCreateBrowserView.bind(this));
    ipcMain.handle('browserview:destroy', this.handleDestroyBrowserView.bind(this));
    ipcMain.handle('browserview:attachToWindow', this.handleAttachViewToWindow.bind(this));
    ipcMain.handle('browserview:detachFromWindow', this.handleDetachViewFromWindow.bind(this));

    // Browser view operations
    ipcMain.handle('browserview:navigate', this.handleNavigateToUrl.bind(this));
    ipcMain.handle('browserview:updateBounds', this.handleUpdateViewBounds.bind(this));
    ipcMain.handle('browserview:getState', this.handleGetViewState.bind(this));

    // Browser view queries
    ipcMain.handle('browserview:getForService', this.handleGetViewsForService.bind(this));
    ipcMain.handle('browserview:getForUser', this.handleGetViewsForUser.bind(this));
    ipcMain.handle('browserview:clearServiceViews', this.handleClearServiceViews.bind(this));
  }

  /**
   * Handle browserview:create IPC call
   */
  private async handleCreateBrowserView(
    _event: IpcMainInvokeEvent,
    config: BrowserViewConfig
  ): Promise<IPCResponse<{ viewId: string }>> {
    try {
      if (!config) {
        return {
          success: false,
          error: 'Browser view configuration is required',
        };
      }

      const result = await this.browserViewManager.createBrowserView(config);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create browser view' };
      }

      return {
        success: true,
        data: { viewId: result.viewId! },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during browser view creation';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:destroy IPC call
   */
  private async handleDestroyBrowserView(
    _event: IpcMainInvokeEvent,
    viewId: string
  ): Promise<IPCResponse<void>> {
    try {
      if (!viewId || typeof viewId !== 'string') {
        return {
          success: false,
          error: 'Valid view ID is required',
        };
      }

      const result = await this.browserViewManager.destroyBrowserView(viewId);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to destroy browser view' };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during browser view destruction';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:attachToWindow IPC call
   */
  private async handleAttachViewToWindow(
    _event: IpcMainInvokeEvent,
    request: AttachViewRequest
  ): Promise<IPCResponse<void>> {
    try {
      if (!request) {
        return {
          success: false,
          error: 'Attach view request is required',
        };
      }

      if (!request.viewId || typeof request.viewId !== 'string') {
        return {
          success: false,
          error: 'Valid view ID is required',
        };
      }

      if (typeof request.windowId !== 'number') {
        return {
          success: false,
          error: 'Valid window ID is required',
        };
      }

      // Get the browser window
      const window = BrowserWindow.fromId(request.windowId);
      if (!window) {
        return {
          success: false,
          error: 'Browser window not found',
        };
      }

      const result = await this.browserViewManager.attachViewToWindow(request.viewId, window);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to attach view to window' };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during view attachment';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:detachFromWindow IPC call
   */
  private async handleDetachViewFromWindow(
    _event: IpcMainInvokeEvent,
    request: DetachViewRequest
  ): Promise<IPCResponse<void>> {
    try {
      if (!request) {
        return {
          success: false,
          error: 'Detach view request is required',
        };
      }

      if (!request.viewId || typeof request.viewId !== 'string') {
        return {
          success: false,
          error: 'Valid view ID is required',
        };
      }

      const windowId = request.windowId ? request.windowId.toString() : undefined;
      const result = await this.browserViewManager.detachViewFromWindow(request.viewId, windowId);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to detach view from window' };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during view detachment';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:navigate IPC call
   */
  private async handleNavigateToUrl(
    _event: IpcMainInvokeEvent,
    request: NavigateViewRequest
  ): Promise<IPCResponse<void>> {
    try {
      if (!request) {
        return {
          success: false,
          error: 'Navigate view request is required',
        };
      }

      if (!request.viewId || typeof request.viewId !== 'string') {
        return {
          success: false,
          error: 'Valid view ID is required',
        };
      }

      if (!request.url || typeof request.url !== 'string') {
        return {
          success: false,
          error: 'Valid URL is required',
        };
      }

      const result = await this.browserViewManager.navigateToUrl(request.viewId, request.url);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to navigate browser view' };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during browser view navigation';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:updateBounds IPC call
   */
  private async handleUpdateViewBounds(
    _event: IpcMainInvokeEvent,
    request: UpdateBoundsRequest
  ): Promise<IPCResponse<void>> {
    try {
      if (!request) {
        return {
          success: false,
          error: 'Update bounds request is required',
        };
      }

      if (!request.viewId || typeof request.viewId !== 'string') {
        return {
          success: false,
          error: 'Valid view ID is required',
        };
      }

      if (!request.bounds || typeof request.bounds !== 'object') {
        return {
          success: false,
          error: 'Valid bounds are required',
        };
      }

      const result = await this.browserViewManager.updateViewBounds(request.viewId, request.bounds);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update view bounds' };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during view bounds update';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:getState IPC call
   */
  private async handleGetViewState(
    _event: IpcMainInvokeEvent,
    viewId: string
  ): Promise<IPCResponse<BrowserViewState>> {
    try {
      if (!viewId || typeof viewId !== 'string') {
        return {
          success: false,
          error: 'Valid view ID is required',
        };
      }

      const viewState = this.browserViewManager.getViewState(viewId);

      if (!viewState) {
        return {
          success: false,
          error: 'Browser view not found',
        };
      }

      return {
        success: true,
        data: viewState,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during view state retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:getForService IPC call
   */
  private async handleGetViewsForService(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<IPCResponse<BrowserViewState[]>> {
    try {
      if (!serviceId || typeof serviceId !== 'string') {
        return {
          success: false,
          error: 'Valid service ID is required',
        };
      }

      const views = this.browserViewManager.getViewsForService(serviceId);

      return {
        success: true,
        data: views,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during service views retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:getForUser IPC call
   */
  private async handleGetViewsForUser(
    _event: IpcMainInvokeEvent,
    userId: string
  ): Promise<IPCResponse<BrowserViewState[]>> {
    try {
      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          error: 'Valid user ID is required',
        };
      }

      const views = this.browserViewManager.getViewsForUser(userId);

      return {
        success: true,
        data: views,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during user views retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browserview:clearServiceViews IPC call
   */
  private async handleClearServiceViews(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<IPCResponse<{ clearedCount: number }>> {
    try {
      if (!serviceId || typeof serviceId !== 'string') {
        return {
          success: false,
          error: 'Valid service ID is required',
        };
      }

      const result = await this.browserViewManager.clearServiceViews(serviceId);

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to clear service views' };
      }

      return {
        success: true,
        data: { clearedCount: result.clearedCount || 0 },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during service views clearing';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Unregister all IPC handlers
   */
  destroy(): void {
    // Browser view lifecycle operations
    ipcMain.removeHandler('browserview:create');
    ipcMain.removeHandler('browserview:destroy');
    ipcMain.removeHandler('browserview:attachToWindow');
    ipcMain.removeHandler('browserview:detachFromWindow');

    // Browser view operations
    ipcMain.removeHandler('browserview:navigate');
    ipcMain.removeHandler('browserview:updateBounds');
    ipcMain.removeHandler('browserview:getState');

    // Browser view queries
    ipcMain.removeHandler('browserview:getForService');
    ipcMain.removeHandler('browserview:getForUser');
    ipcMain.removeHandler('browserview:clearServiceViews');
  }
}

export default BrowserViewHandlers;
