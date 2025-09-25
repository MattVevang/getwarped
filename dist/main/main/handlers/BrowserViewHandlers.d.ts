import BrowserViewManager, { BrowserViewConfig } from '../security/BrowserViewManager';
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
export declare class BrowserViewHandlers {
    private browserViewManager;
    constructor(browserViewManager: BrowserViewManager);
    /**
     * Register all browser view-related IPC handlers
     */
    private registerHandlers;
    /**
     * Handle browserview:create IPC call
     */
    private handleCreateBrowserView;
    /**
     * Handle browserview:destroy IPC call
     */
    private handleDestroyBrowserView;
    /**
     * Handle browserview:attachToWindow IPC call
     */
    private handleAttachViewToWindow;
    /**
     * Handle browserview:detachFromWindow IPC call
     */
    private handleDetachViewFromWindow;
    /**
     * Handle browserview:navigate IPC call
     */
    private handleNavigateToUrl;
    /**
     * Handle browserview:updateBounds IPC call
     */
    private handleUpdateViewBounds;
    /**
     * Handle browserview:getState IPC call
     */
    private handleGetViewState;
    /**
     * Handle browserview:getForService IPC call
     */
    private handleGetViewsForService;
    /**
     * Handle browserview:getForUser IPC call
     */
    private handleGetViewsForUser;
    /**
     * Handle browserview:clearServiceViews IPC call
     */
    private handleClearServiceViews;
    /**
     * Unregister all IPC handlers
     */
    destroy(): void;
}
export default BrowserViewHandlers;
//# sourceMappingURL=BrowserViewHandlers.d.ts.map