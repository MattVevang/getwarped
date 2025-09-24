/**
 * Unit tests for CredentialStore
 *
 * Tests secure credential management, keytar integration, and credential cleanup.
 * Validates secure storage patterns and error handling for OS-native credential storage.
 *
 * @fileoverview Comprehensive unit tests for CredentialStore class
 */

import { CredentialStore, CredentialType } from '../../../src/main/storage/CredentialStore';

// Mock keytar
jest.mock('keytar');

describe('CredentialStore', () => {
  let credentialStore: CredentialStore;
  let mockKeytar: any;

  const mockCredentials = {
    serviceId: 'test-service',
    serviceName: 'Test Service',
    account: 'test@example.com',
    credential: 'secure-password',
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock keytar
    mockKeytar = require('keytar');
    mockKeytar.setPassword = jest.fn().mockResolvedValue(undefined);
    mockKeytar.getPassword = jest.fn().mockResolvedValue(null);
    mockKeytar.deletePassword = jest.fn().mockResolvedValue(true);
    mockKeytar.findCredentials = jest.fn().mockResolvedValue([]);

    // Create CredentialStore instance
    credentialStore = new CredentialStore();
  });

  describe('storeCredential', () => {
    it('should store credentials successfully', async () => {
      const result = await credentialStore.storeCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential,
        CredentialType.PASSWORD
      );

      expect(result.success).toBe(true);
      expect(mockKeytar.setPassword).toHaveBeenCalled();
    });

    it('should fail with missing serviceId', async () => {
      const result = await credentialStore.storeCredential(
        '', // Empty serviceId
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
      expect(mockKeytar.setPassword).not.toHaveBeenCalled();
    });

    it('should handle keytar storage errors gracefully', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('Keychain access denied'));

      const result = await credentialStore.storeCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential
      );

      // CredentialStore falls back to memory cache on keytar failure
      expect(result.success).toBe(true);
      expect(result.error).toContain('memory cache');
    });
  });

  describe('getCredential', () => {
    it('should retrieve credentials successfully', async () => {
      mockKeytar.getPassword.mockResolvedValue('encrypted-credential');

      const result = await credentialStore.getCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockKeytar.getPassword).toHaveBeenCalled();
    });

    it('should handle non-existent credentials', async () => {
      mockKeytar.getPassword.mockResolvedValue(null);

      const result = await credentialStore.getCredential(
        'non-existent-service',
        'Non-existent Service',
        'non-existent@example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle keytar access errors gracefully', async () => {
      mockKeytar.getPassword.mockRejectedValue(new Error('Keychain locked'));

      const result = await credentialStore.getCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account
      );

      // CredentialStore falls back gracefully on keytar errors
      expect(result.success).toBe(false);
      expect(result.error).toBe('Credential not found');
    });
  });

  describe('deleteCredential', () => {
    it('should delete credentials successfully', async () => {
      mockKeytar.deletePassword.mockResolvedValue(true);

      const result = await credentialStore.deleteCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account
      );

      expect(result.success).toBe(true);
      expect(mockKeytar.deletePassword).toHaveBeenCalled();
    });

    it('should handle keytar deletion errors gracefully', async () => {
      mockKeytar.deletePassword.mockRejectedValue(new Error('Permission denied'));

      const result = await credentialStore.deleteCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account
      );

      // CredentialStore continues gracefully even if keytar fails
      expect(result.success).toBe(true);
    });
  });

  describe('Security validations', () => {
    it('should never log sensitive data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await credentialStore.storeCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential
      );

      // Verify no sensitive data in logs
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(mockCredentials.credential)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(mockCredentials.credential)
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should use secure service names for keytar', async () => {
      await credentialStore.storeCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential
      );

      // Check actual service key format used
      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        'GetWarped-Test Service-test-service',
        'test@example.com',
        'secure-password'
      );
    });
  });

  describe('Error handling', () => {
    it('should handle store initialization without keytar', () => {
      // This should not throw during construction
      expect(() => new CredentialStore()).not.toThrow();
    });

    it('should validate required parameters', async () => {
      const result = await credentialStore.storeCredential(
        '',
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Event handling', () => {
    it('should emit events on credential operations', async () => {
      const eventSpy = jest.fn();
      credentialStore.on('credential-stored', eventSpy);

      await credentialStore.storeCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account,
        mockCredentials.credential
      );

      expect(eventSpy).toHaveBeenCalledWith(
        mockCredentials.serviceId,
        mockCredentials.account,
        CredentialType.PASSWORD
      );
    });

    it('should emit events on credential deletion', async () => {
      const eventSpy = jest.fn();
      mockKeytar.deletePassword.mockResolvedValue(true);

      credentialStore.on('credential-deleted', eventSpy);

      await credentialStore.deleteCredential(
        mockCredentials.serviceId,
        mockCredentials.serviceName,
        mockCredentials.account
      );

      expect(eventSpy).toHaveBeenCalledWith(mockCredentials.serviceId, mockCredentials.account);
    });
  });
});
