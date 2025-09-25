import {
  SessionIsolation,
  SessionConfiguration,
  SessionMetadata,
} from '../../../src/main/browserview/SessionIsolation';
import { session } from 'electron';

// Mock Electron modules
jest.mock('electron', () => ({
  BrowserView: jest.fn().mockImplementation(() => ({
    id: Math.random(),
    webContents: {
      session: {
        partition: 'persist:test',
        clearStorageData: jest.fn(),
        clearCache: jest.fn(),
        clearHostResolverCache: jest.fn(),
        clearAuthCache: jest.fn(),
        setUserAgent: jest.fn(),
        setPermissionRequestHandler: jest.fn(),
        webRequest: {
          onBeforeRequest: jest.fn(),
          onHeadersReceived: jest.fn(),
          onBeforeSendHeaders: jest.fn(),
          onCompleted: jest.fn(),
        },
        on: jest.fn(),
        cookies: {
          get: jest.fn(),
          set: jest.fn(),
          remove: jest.fn(),
        },
      },
      executeJavaScript: jest.fn(),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
      destroy: jest.fn(),
    },
    setBounds: jest.fn(),
    destroy: jest.fn(),
  })),
  BrowserWindow: jest.fn().mockImplementation(() => ({
    setBrowserView: jest.fn(),
    removeBrowserView: jest.fn(),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
    },
  })),
  session: {
    fromPartition: jest.fn().mockReturnValue({
      partition: 'persist:test',
      clearStorageData: jest.fn().mockResolvedValue(undefined),
      clearCache: jest.fn(),
      clearHostResolverCache: jest.fn(),
      clearAuthCache: jest.fn(),
      setUserAgent: jest.fn(),
      setPermissionRequestHandler: jest.fn(),
      webRequest: {
        onBeforeRequest: jest.fn(),
        onHeadersReceived: jest.fn(),
        onBeforeSendHeaders: jest.fn(),
        onCompleted: jest.fn(),
      },
      on: jest.fn(),
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      },
    }),
    defaultSession: {
      setPermissionRequestHandler: jest.fn(),
      protocol: {
        registerHttpProtocol: jest.fn(),
      },
    },
  },
}));

describe('SessionIsolation', () => {
  let sessionIsolation: SessionIsolation;
  let mockSession: any;

  beforeEach(() => {
    sessionIsolation = new SessionIsolation();
    mockSession = {
      partition: 'persist:test',
      clearStorageData: jest.fn().mockResolvedValue(undefined),
      setUserAgent: jest.fn(),
      setPermissionRequestHandler: jest.fn(),
      webRequest: {
        onBeforeRequest: jest.fn(),
        onHeadersReceived: jest.fn(),
        onBeforeSendHeaders: jest.fn(),
        onCompleted: jest.fn(),
      },
      on: jest.fn(),
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      },
    };

    (session.fromPartition as jest.Mock).mockReturnValue(mockSession);

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    sessionIsolation.destroy();
    jest.resetAllMocks();
  });

  describe('Session Creation and Isolation', () => {
    it('should create isolated session for each service', async () => {
      const config1: SessionConfiguration = { serviceId: 'service-123', serviceName: 'Service 1' };
      const config2: SessionConfiguration = { serviceId: 'service-456', serviceName: 'Service 2' };

      const session1 = await sessionIsolation.createIsolatedSession(config1);
      const session2 = await sessionIsolation.createIsolatedSession(config2);

      expect(session1).toBeDefined();
      expect(session2).toBeDefined();
      expect(session1).toBe(mockSession);
      expect(session2).toBe(mockSession);
      expect(session.fromPartition).toHaveBeenCalledTimes(2);
    });

    it('should throw error for duplicate session creation', async () => {
      const config: SessionConfiguration = { serviceId: 'service-123', serviceName: 'Service 1' };

      await sessionIsolation.createIsolatedSession(config);

      await expect(sessionIsolation.createIsolatedSession(config)).rejects.toThrow(
        'Session for service service-123 already exists'
      );
    });

    it('should throw error for invalid configuration', async () => {
      const config: SessionConfiguration = { serviceId: '', serviceName: 'Test' };

      await expect(sessionIsolation.createIsolatedSession(config)).rejects.toThrow(
        'Service ID and name are required'
      );
    });

    it('should set proper session configuration', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
        persistent: true,
        userAgent: 'CustomAgent/1.0',
        permissions: ['notifications', 'geolocation'],
      };

      const session = await sessionIsolation.createIsolatedSession(config);
      const metadata = sessionIsolation.getSessionMetadata(config.serviceId);

      expect(session).toBeDefined();
      expect(metadata?.serviceName).toBe('Test Service');
      expect(metadata?.permissions).toEqual(['notifications', 'geolocation']);
      expect(mockSession.setUserAgent).toHaveBeenCalledWith('CustomAgent/1.0');
    });
  });

  describe('Session Management', () => {
    it('should retrieve session by service ID', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);
      const retrievedSession = sessionIsolation.getSession('service-123');

      expect(retrievedSession).toBe(mockSession);
    });

    it('should return undefined for non-existent session', () => {
      const retrievedSession = sessionIsolation.getSession('non-existent');

      expect(retrievedSession).toBeUndefined();
    });

    it('should retrieve session metadata', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
        permissions: ['camera', 'microphone'],
      };

      await sessionIsolation.createIsolatedSession(config);
      const metadata = sessionIsolation.getSessionMetadata('service-123');

      expect(metadata).toBeDefined();
      expect(metadata?.serviceId).toBe('service-123');
      expect(metadata?.serviceName).toBe('Test Service');
      expect(metadata?.permissions).toEqual(['camera', 'microphone']);
      expect(metadata?.isActive).toBe(true);
      expect(metadata?.dataCleared).toBe(false);
    });

    it('should get all sessions', async () => {
      const config1: SessionConfiguration = { serviceId: 'service-123', serviceName: 'Service 1' };
      const config2: SessionConfiguration = { serviceId: 'service-456', serviceName: 'Service 2' };

      await sessionIsolation.createIsolatedSession(config1);
      await sessionIsolation.createIsolatedSession(config2);

      const allSessions = sessionIsolation.getAllSessions();

      expect(allSessions.size).toBe(2);
      expect(allSessions.has('service-123')).toBe(true);
      expect(allSessions.has('service-456')).toBe(true);
    });
  });

  describe('Session Data Management', () => {
    it('should clear session data', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };
      await sessionIsolation.createIsolatedSession(config);

      const result = await sessionIsolation.clearSessionData('service-123', {
        cookies: true,
        localstorage: true,
      });

      expect(result).toBe(true);
      expect(mockSession.clearStorageData).toHaveBeenCalledWith({
        storages: expect.arrayContaining(['cookies', 'localstorage']),
      });

      const metadata = sessionIsolation.getSessionMetadata('service-123');
      expect(metadata?.dataCleared).toBe(true);
      expect(metadata?.storageSize).toBe(0);
    });

    it('should return false when clearing data for non-existent session', async () => {
      const result = await sessionIsolation.clearSessionData('non-existent');

      expect(result).toBe(false);
    });

    it('should clear all data types by default', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };
      await sessionIsolation.createIsolatedSession(config);

      await sessionIsolation.clearSessionData('service-123');

      expect(mockSession.clearStorageData).toHaveBeenCalledWith({
        storages: expect.arrayContaining([
          'appcache',
          'cookies',
          'filesystem',
          'indexdb',
          'localstorage',
          'shadercache',
          'websql',
          'serviceworkers',
          'cachestorage',
        ]),
      });
    });
  });

  describe('Session Lifecycle Management', () => {
    it('should destroy session and cleanup resources', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);
      expect(sessionIsolation.getSession('service-123')).toBeDefined();

      const result = await sessionIsolation.destroySession('service-123');

      expect(result).toBe(true);
      expect(sessionIsolation.getSession('service-123')).toBeUndefined();
      expect(sessionIsolation.getSessionMetadata('service-123')).toBeUndefined();
    });

    it('should destroy all sessions', async () => {
      const configs: SessionConfiguration[] = [
        { serviceId: 'service-123', serviceName: 'Service 1' },
        { serviceId: 'service-456', serviceName: 'Service 2' },
        { serviceId: 'service-789', serviceName: 'Service 3' },
      ];

      for (const config of configs) {
        await sessionIsolation.createIsolatedSession(config);
      }

      expect(sessionIsolation.getAllSessions().size).toBe(3);

      await sessionIsolation.destroyAllSessions();

      expect(sessionIsolation.getAllSessions().size).toBe(0);
    });

    it('should update session access time', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);
      const originalMetadata = sessionIsolation.getSessionMetadata('service-123');
      const originalAccessTime = originalMetadata?.lastAccessedAt;

      // Wait a bit and update access
      await new Promise(resolve => setTimeout(resolve, 10));
      sessionIsolation.updateSessionAccess('service-123');

      const updatedMetadata = sessionIsolation.getSessionMetadata('service-123');
      expect(updatedMetadata?.lastAccessedAt.getTime()).toBeGreaterThan(
        originalAccessTime!.getTime()
      );
    });
  });

  describe('Security Configuration', () => {
    it('should configure user agent', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
        userAgent: 'CustomAgent/2.0',
      };

      await sessionIsolation.createIsolatedSession(config);

      expect(mockSession.setUserAgent).toHaveBeenCalledWith('CustomAgent/2.0');
    });

    it('should configure permissions', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
        permissions: ['camera', 'microphone', 'notifications'],
      };

      await sessionIsolation.createIsolatedSession(config);

      expect(mockSession.setPermissionRequestHandler).toHaveBeenCalled();
    });

    it('should configure Content Security Policy', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
        contentSecurityPolicy: "default-src 'self'; script-src 'self'",
      };

      await sessionIsolation.createIsolatedSession(config);

      expect(mockSession.webRequest.onHeadersReceived).toHaveBeenCalled();
    });

    it('should configure custom headers', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
        customHeaders: {
          'X-Custom-Header': 'CustomValue',
          Authorization: 'Bearer token123',
        },
      };

      await sessionIsolation.createIsolatedSession(config);

      expect(mockSession.webRequest.onBeforeSendHeaders).toHaveBeenCalled();
    });
  });

  describe('Storage Limit Enforcement', () => {
    it('should enforce storage limits', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);

      // This method exists but is mostly internal - just verify it doesn't throw
      await expect(sessionIsolation.enforceStorageLimits()).resolves.not.toThrow();
    });
  });

  describe('Event Emission', () => {
    it('should emit session-created event', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      const eventPromise = new Promise<SessionMetadata>(resolve => {
        sessionIsolation.once('session-created', resolve);
      });

      await sessionIsolation.createIsolatedSession(config);

      const eventData = await eventPromise;
      expect(eventData.serviceId).toBe('service-123');
      expect(eventData.serviceName).toBe('Test Service');
    });

    it('should emit session-destroyed event', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);

      const eventPromise = new Promise<string>(resolve => {
        sessionIsolation.once('session-destroyed', resolve);
      });

      await sessionIsolation.destroySession('service-123');

      const serviceId = await eventPromise;
      expect(serviceId).toBe('service-123');
    });

    it('should emit session-data-cleared event', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);

      const eventPromise = new Promise<{ serviceId: string; dataTypes: any }>(resolve => {
        sessionIsolation.once('session-data-cleared', (serviceId, dataTypes) => {
          resolve({ serviceId, dataTypes });
        });
      });

      await sessionIsolation.clearSessionData('service-123', { cookies: true });

      const eventData = await eventPromise;
      expect(eventData.serviceId).toBe('service-123');
      expect(eventData.dataTypes.cookies).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle session creation failure gracefully', async () => {
      // Mock session creation failure
      (session.fromPartition as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Session creation failed');
      });

      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await expect(sessionIsolation.createIsolatedSession(config)).rejects.toThrow(
        'Failed to create isolated session: Session creation failed'
      );
    });

    it('should handle clearStorageData failure', async () => {
      const config: SessionConfiguration = {
        serviceId: 'service-123',
        serviceName: 'Test Service',
      };

      await sessionIsolation.createIsolatedSession(config);

      // Mock clearStorageData failure
      mockSession.clearStorageData.mockRejectedValueOnce(new Error('Clear failed'));

      const result = await sessionIsolation.clearSessionData('service-123');

      expect(result).toBe(false);
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should cleanup resources on destroy', async () => {
      const configs: SessionConfiguration[] = [
        { serviceId: 'service-123', serviceName: 'Service 1' },
        { serviceId: 'service-456', serviceName: 'Service 2' },
      ];

      for (const config of configs) {
        await sessionIsolation.createIsolatedSession(config);
      }

      expect(sessionIsolation.getAllSessions().size).toBe(2);

      sessionIsolation.destroy();

      expect(sessionIsolation.getAllSessions().size).toBe(0);
    });

    it('should handle destroy when no sessions exist', () => {
      expect(() => sessionIsolation.destroy()).not.toThrow();
    });
  });
});
