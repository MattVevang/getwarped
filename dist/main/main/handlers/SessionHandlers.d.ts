import SessionManager from '../services/SessionManager';
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
 * Session Handlers for IPC communication
 * Handles session lifecycle and credential storage operations
 */
export declare class SessionHandlers {
    private sessionManager;
    constructor(sessionManager: SessionManager);
    /**
     * Register all session-related IPC handlers
     */
    private registerHandlers;
    /**
     * Handle session:create IPC call
     */
    private handleCreateSession;
    /**
     * Handle session:update IPC call
     */
    private handleUpdateSession;
    /**
     * Handle session:delete IPC call
     */
    private handleDeleteSession;
    /**
     * Handle session:get IPC call
     */
    private handleGetSession;
    /**
     * Handle session:getActive IPC call
     */
    private handleGetActiveSessions;
    /**
     * Handle session:getForService IPC call
     */
    private handleGetSessionsForService;
    /**
     * Handle session:clear IPC call
     */
    private handleClearAllSessions;
    /**
     * Handle session:storeCredential IPC call
     */
    private handleStoreCredential;
    /**
     * Handle session:retrieveCredential IPC call
     */
    private handleRetrieveCredential;
    /**
     * Handle session:deleteCredential IPC call
     */
    private handleDeleteCredential;
    /**
     * Handle session:listCredentials IPC call
     */
    private handleListCredentials;
    /**
     * Unregister all IPC handlers
     */
    destroy(): void;
}
export default SessionHandlers;
//# sourceMappingURL=SessionHandlers.d.ts.map