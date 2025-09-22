/**
 * Unit Tests for InputValidator
 *
 * These tests verify the core validation functionality works correctly.
 * Integration tests will run in later phases when IPC handlers are implemented.
 */

import { InputValidator } from '../../../src/shared/validation/InputValidator';

describe('InputValidator - Unit Tests', () => {
  describe('XSS Protection', () => {
    it('should detect XSS patterns in input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '"><script>alert("xss")</script>',
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
      ];

      maliciousInputs.forEach(input => {
        const result = InputValidator.validateText(input);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/(dangerous HTML|malicious SQL)/);
      });
    });

    it('should allow safe input with proper options', () => {
      const safeInputs = ['Hello World', 'My Service Name', 'This is a normal description'];

      safeInputs.forEach(input => {
        const result = InputValidator.validateText(input, { allowSpecialChars: true });
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.org',
        'valid.email@sub.domain.com',
      ];

      validEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject clearly invalid email addresses', () => {
      const invalidEmails = ['invalid-email', 'user@', '@domain.com', ''];

      invalidEmails.forEach(email => {
        const result = InputValidator.validateEmail(email);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate safe URLs', () => {
      const safeUrls = ['https://www.example.com', 'https://app.example.org/path'];

      safeUrls.forEach(url => {
        const result = InputValidator.validateUrl(url, { allowLocalhost: true });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject dangerous URLs', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com',
      ];

      dangerousUrls.forEach(url => {
        const result = InputValidator.validateUrl(url);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('SQL Injection Protection', () => {
    it('should detect SQL injection patterns', () => {
      const sqlInjectionInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        '1; DELETE FROM users',
        "' UNION SELECT * FROM users --",
      ];

      sqlInjectionInputs.forEach(input => {
        const result = InputValidator.validateText(input);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('malicious SQL');
      });
    });
  });

  describe('HTML Sanitization', () => {
    it('should sanitize dangerous HTML', () => {
      const dangerousHtml = '<script>alert("xss")</script>';
      const sanitized = InputValidator.sanitizeHtml(dangerousHtml);
      expect(sanitized).not.toContain('<script>');
    });

    it('should preserve plain text', () => {
      const plainText = 'Plain text content';
      const sanitized = InputValidator.sanitizeHtml(plainText);
      expect(sanitized).toBe(plainText);
    });
  });
});
