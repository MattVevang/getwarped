"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionHandlers = void 0;
const electron_1 = require("electron");
/**
 * Session Handlers for IPC communication
 * Handles session lifecycle and credential storage operations
 */
class SessionHandlers {
    sessionManager;
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
        this.registerHandlers();
    }
    /**
     * Register all session-related IPC handlers
     */
    registerHandlers() {
        // Session lifecycle operations
        electron_1.ipcMain.handle('session:create', this.handleCreateSession.bind(this));
        electron_1.ipcMain.handle('session:update', this.handleUpdateSession.bind(this));
        electron_1.ipcMain.handle('session:delete', this.handleDeleteSession.bind(this));
        electron_1.ipcMain.handle('session:get', this.handleGetSession.bind(this));
        electron_1.ipcMain.handle('session:getActive', this.handleGetActiveSessions.bind(this));
        electron_1.ipcMain.handle('session:getForService', this.handleGetSessionsForService.bind(this));
        electron_1.ipcMain.handle('session:clear', this.handleClearAllSessions.bind(this));
        // Credential operations
        electron_1.ipcMain.handle('session:storeCredential', this.handleStoreCredential.bind(this));
        electron_1.ipcMain.handle('session:retrieveCredential', this.handleRetrieveCredential.bind(this));
        electron_1.ipcMain.handle('session:deleteCredential', this.handleDeleteCredential.bind(this));
        electron_1.ipcMain.handle('session:listCredentials', this.handleListCredentials.bind(this));
    }
    /**
     * Handle session:create IPC call
     */
    async handleCreateSession(_event, request) {
        try {
            if (!request) {
                return {
                    success: false,
                    error: 'Session create request is required',
                };
            }
            const result = await this.sessionManager.createSession(request);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to create session' };
            }
            return {
                success: true,
                data: { sessionId: result.sessionId },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during session creation';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:update IPC call
     */
    async handleUpdateSession(_event, request) {
        try {
            if (!request) {
                return {
                    success: false,
                    error: 'Session update request is required',
                };
            }
            const result = await this.sessionManager.updateSession(request);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to update session' };
            }
            return {
                success: true,
                data: undefined,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during session update';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:delete IPC call
     */
    async handleDeleteSession(_event, sessionId) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                return {
                    success: false,
                    error: 'Valid session ID is required',
                };
            }
            const result = await this.sessionManager.deleteSession(sessionId);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to delete session' };
            }
            return {
                success: true,
                data: undefined,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during session deletion';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:get IPC call
     */
    async handleGetSession(_event, sessionId) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                return {
                    success: false,
                    error: 'Valid session ID is required',
                };
            }
            const result = await this.sessionManager.getSession(sessionId);
            if (!result.valid) {
                return { success: false, error: result.error || 'Session not found or invalid' };
            }
            return {
                success: true,
                data: result.session,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during session retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:getActive IPC call
     */
    async handleGetActiveSessions(_event) {
        try {
            const sessions = await this.sessionManager.getActiveSessions();
            return {
                success: true,
                data: sessions,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during active sessions retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:getForService IPC call
     */
    async handleGetSessionsForService(_event, serviceId) {
        try {
            if (!serviceId || typeof serviceId !== 'string') {
                return {
                    success: false,
                    error: 'Valid service ID is required',
                };
            }
            const sessions = await this.sessionManager.getSessionsForService(serviceId);
            return {
                success: true,
                data: sessions,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during service sessions retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:clear IPC call
     */
    async handleClearAllSessions(_event) {
        try {
            const result = await this.sessionManager.clearAllSessions();
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to clear sessions' };
            }
            return {
                success: true,
                data: undefined,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during session clearing';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:storeCredential IPC call
     */
    async handleStoreCredential(_event, request) {
        try {
            if (!request) {
                return {
                    success: false,
                    error: 'Credential store request is required',
                };
            }
            const result = await this.sessionManager.storeCredential(request);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to store credential' };
            }
            return {
                success: true,
                data: undefined,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during credential storage';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:retrieveCredential IPC call
     */
    async handleRetrieveCredential(_event, request) {
        try {
            if (!request) {
                return {
                    success: false,
                    error: 'Credential retrieve request is required',
                };
            }
            const result = await this.sessionManager.retrieveCredential(request);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to retrieve credential' };
            }
            return {
                success: true,
                data: { credential: result.credential },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during credential retrieval';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:deleteCredential IPC call
     */
    async handleDeleteCredential(_event, request) {
        try {
            if (!request) {
                return {
                    success: false,
                    error: 'Credential delete request is required',
                };
            }
            const result = await this.sessionManager.deleteCredential(request);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to delete credential' };
            }
            return {
                success: true,
                data: undefined,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during credential deletion';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Handle session:listCredentials IPC call
     */
    async handleListCredentials(_event, serviceId, userId) {
        try {
            if (!serviceId || typeof serviceId !== 'string') {
                return {
                    success: false,
                    error: 'Valid service ID is required',
                };
            }
            if (!userId || typeof userId !== 'string') {
                return {
                    success: false,
                    error: 'Valid user ID is required',
                };
            }
            const result = await this.sessionManager.listCredentials(serviceId, userId);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to list credentials' };
            }
            return {
                success: true,
                data: { credentials: result.credentials || [] },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error during credential listing';
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Unregister all IPC handlers
     */
    destroy() {
        // Session lifecycle operations
        electron_1.ipcMain.removeHandler('session:create');
        electron_1.ipcMain.removeHandler('session:update');
        electron_1.ipcMain.removeHandler('session:delete');
        electron_1.ipcMain.removeHandler('session:get');
        electron_1.ipcMain.removeHandler('session:getActive');
        electron_1.ipcMain.removeHandler('session:getForService');
        electron_1.ipcMain.removeHandler('session:clear');
        // Credential operations
        electron_1.ipcMain.removeHandler('session:storeCredential');
        electron_1.ipcMain.removeHandler('session:retrieveCredential');
        electron_1.ipcMain.removeHandler('session:deleteCredential');
        electron_1.ipcMain.removeHandler('session:listCredentials');
    }
}
exports.SessionHandlers = SessionHandlers;
exports.default = SessionHandlers;
//# sourceMappingURL=SessionHandlers.js.map