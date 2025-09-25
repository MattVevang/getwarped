"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserViewHandlers = void 0;
const electron_1 = require("electron");
/**
 * BrowserView Handlers for IPC communication
 * Handles browser view lifecycle and management operations
 */
class BrowserViewHandlers {
    browserViewManager;
    constructor(browserViewManager) {
        this.browserViewManager = browserViewManager;
        this.registerHandlers();
    }
    /**
     * Register all browser view-related IPC handlers
     */
    registerHandlers() {
        // Browser view lifecycle operations
        electron_1.ipcMain.handle('browserview:create', this.handleCreateBrowserView.bind(this));
        electron_1.ipcMain.handle('browserview:destroy', this.handleDestroyBrowserView.bind(this));
        electron_1.ipcMain.handle('browserview:attachToWindow', this.handleAttachViewToWindow.bind(this));
        electron_1.ipcMain.handle('browserview:detachFromWindow', this.handleDetachViewFromWindow.bind(this));
        // Browser view operations
        electron_1.ipcMain.handle('browserview:navigate', this.handleNavigateToUrl.bind(this));
        electron_1.ipcMain.handle('browserview:updateBounds', this.handleUpdateViewBounds.bind(this));
        electron_1.ipcMain.handle('browserview:getState', this.handleGetViewState.bind(this));
        // Browser view queries
        electron_1.ipcMain.handle('browserview:getForService', this.handleGetViewsForService.bind(this));
        electron_1.ipcMain.handle('browserview:getForUser', this.handleGetViewsForUser.bind(this));
        electron_1.ipcMain.handle('browserview:clearServiceViews', this.handleClearServiceViews.bind(this));
    }
    /**
     * Handle browserview:create IPC call
     */
    async handleCreateBrowserView(_event, config) {
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
                data: { viewId: result.viewId },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during browser view creation';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:destroy IPC call
     */
    async handleDestroyBrowserView(_event, viewId) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during browser view destruction';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:attachToWindow IPC call
     */
    async handleAttachViewToWindow(_event, request) {
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
            const window = electron_1.BrowserWindow.fromId(request.windowId);
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during view attachment';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:detachFromWindow IPC call
     */
    async handleDetachViewFromWindow(_event, request) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during view detachment';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:navigate IPC call
     */
    async handleNavigateToUrl(_event, request) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during browser view navigation';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:updateBounds IPC call
     */
    async handleUpdateViewBounds(_event, request) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during view bounds update';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:getState IPC call
     */
    async handleGetViewState(_event, viewId) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during view state retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:getForService IPC call
     */
    async handleGetViewsForService(_event, serviceId) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during service views retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:getForUser IPC call
     */
    async handleGetViewsForUser(_event, userId) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during user views retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle browserview:clearServiceViews IPC call
     */
    async handleClearServiceViews(_event, serviceId) {
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
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during service views clearing';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Unregister all IPC handlers
     */
    destroy() {
        // Browser view lifecycle operations
        electron_1.ipcMain.removeHandler('browserview:create');
        electron_1.ipcMain.removeHandler('browserview:destroy');
        electron_1.ipcMain.removeHandler('browserview:attachToWindow');
        electron_1.ipcMain.removeHandler('browserview:detachFromWindow');
        // Browser view operations
        electron_1.ipcMain.removeHandler('browserview:navigate');
        electron_1.ipcMain.removeHandler('browserview:updateBounds');
        electron_1.ipcMain.removeHandler('browserview:getState');
        // Browser view queries
        electron_1.ipcMain.removeHandler('browserview:getForService');
        electron_1.ipcMain.removeHandler('browserview:getForUser');
        electron_1.ipcMain.removeHandler('browserview:clearServiceViews');
    }
}
exports.BrowserViewHandlers = BrowserViewHandlers;
exports.default = BrowserViewHandlers;
//# sourceMappingURL=BrowserViewHandlers.js.map