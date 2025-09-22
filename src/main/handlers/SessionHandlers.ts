import { ipcMain, IpcMainInvokeEvent } from 'electron';
import SessionManager, {
  SessionCreateRequest,
  SessionUpdateRequest,
  CredentialStoreRequest,
  CredentialRetrieveRequest,
} from '../services/SessionManager';

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
export class SessionHandlers {
  private sessionManager: SessionManager;

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
    this.registerHandlers();
  }

  /**
   * Register all session-related IPC handlers
   */
  private registerHandlers(): void {
    // Session lifecycle operations
    ipcMain.handle('session:create', this.handleCreateSession.bind(this));
    ipcMain.handle('session:update', this.handleUpdateSession.bind(this));
    ipcMain.handle('session:delete', this.handleDeleteSession.bind(this));
    ipcMain.handle('session:get', this.handleGetSession.bind(this));
    ipcMain.handle('session:getActive', this.handleGetActiveSessions.bind(this));
    ipcMain.handle('session:getForService', this.handleGetSessionsForService.bind(this));
    ipcMain.handle('session:clear', this.handleClearAllSessions.bind(this));

    // Credential operations
    ipcMain.handle('session:storeCredential', this.handleStoreCredential.bind(this));
    ipcMain.handle('session:retrieveCredential', this.handleRetrieveCredential.bind(this));
    ipcMain.handle('session:deleteCredential', this.handleDeleteCredential.bind(this));
    ipcMain.handle('session:listCredentials', this.handleListCredentials.bind(this));
  }

  /**
   * Handle session:create IPC call
   */
  private async handleCreateSession(
    _event: IpcMainInvokeEvent,
    request: SessionCreateRequest
  ): Promise<IPCResponse<{ sessionId: string }>> {
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
        data: { sessionId: result.sessionId! },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during session creation';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:update IPC call
   */
  private async handleUpdateSession(
    _event: IpcMainInvokeEvent,
    request: SessionUpdateRequest
  ): Promise<IPCResponse<void>> {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during session update';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:delete IPC call
   */
  private async handleDeleteSession(
    _event: IpcMainInvokeEvent,
    sessionId: string
  ): Promise<IPCResponse<void>> {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during session deletion';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:get IPC call
   */
  private async handleGetSession(
    _event: IpcMainInvokeEvent,
    sessionId: string
  ): Promise<IPCResponse<import('../services/SessionManager').SessionData>> {
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
        data: result.session!,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during session retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:getActive IPC call
   */
  private async handleGetActiveSessions(
    _event: IpcMainInvokeEvent
  ): Promise<IPCResponse<import('../services/SessionManager').SessionData[]>> {
    try {
      const sessions = await this.sessionManager.getActiveSessions();

      return {
        success: true,
        data: sessions,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during active sessions retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:getForService IPC call
   */
  private async handleGetSessionsForService(
    _event: IpcMainInvokeEvent,
    serviceId: string
  ): Promise<IPCResponse<import('../services/SessionManager').SessionData[]>> {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during service sessions retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:clear IPC call
   */
  private async handleClearAllSessions(_event: IpcMainInvokeEvent): Promise<IPCResponse<void>> {
    try {
      const result = await this.sessionManager.clearAllSessions();

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to clear sessions' };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during session clearing';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:storeCredential IPC call
   */
  private async handleStoreCredential(
    _event: IpcMainInvokeEvent,
    request: CredentialStoreRequest
  ): Promise<IPCResponse<void>> {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during credential storage';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:retrieveCredential IPC call
   */
  private async handleRetrieveCredential(
    _event: IpcMainInvokeEvent,
    request: CredentialRetrieveRequest
  ): Promise<IPCResponse<{ credential: string }>> {
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
        data: { credential: result.credential! },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during credential retrieval';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:deleteCredential IPC call
   */
  private async handleDeleteCredential(
    _event: IpcMainInvokeEvent,
    request: CredentialRetrieveRequest
  ): Promise<IPCResponse<void>> {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during credential deletion';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle session:listCredentials IPC call
   */
  private async handleListCredentials(
    _event: IpcMainInvokeEvent,
    serviceId: string,
    userId: string
  ): Promise<IPCResponse<{ credentials: string[] }>> {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during credential listing';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Unregister all IPC handlers
   */
  destroy(): void {
    // Session lifecycle operations
    ipcMain.removeHandler('session:create');
    ipcMain.removeHandler('session:update');
    ipcMain.removeHandler('session:delete');
    ipcMain.removeHandler('session:get');
    ipcMain.removeHandler('session:getActive');
    ipcMain.removeHandler('session:getForService');
    ipcMain.removeHandler('session:clear');

    // Credential operations
    ipcMain.removeHandler('session:storeCredential');
    ipcMain.removeHandler('session:retrieveCredential');
    ipcMain.removeHandler('session:deleteCredential');
    ipcMain.removeHandler('session:listCredentials');
  }
}

export default SessionHandlers;
