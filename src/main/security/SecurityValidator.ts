/**
 * Security Validator
 *
 * Provides comprehensive security validation utilities including CSP (Content Security Policy)
 * generation, input sanitization, URL validation, and security policy enforcement.
 * Used throughout the application to maintain security standards and prevent XSS attacks.
 *
 * @fileoverview Security validation and sanitization utilities
 */

import * as crypto from 'crypto';
import { URL } from 'url';
// InputValidator is available but not currently used in this class

/**
 * Content Security Policy configuration
 */
export interface CSPConfig {
  /** Default source policy */
  defaultSrc: string[];
  /** Script source policy */
  scriptSrc: string[];
  /** Style source policy */
  styleSrc: string[];
  /** Image source policy */
  imgSrc: string[];
  /** Font source policy */
  fontSrc: string[];
  /** Connect source policy (XHR, WebSocket, etc.) */
  connectSrc: string[];
  /** Media source policy (audio, video) */
  mediaSrc: string[];
  /** Object source policy (plugins) */
  objectSrc: string[];
  /** Child source policy (frames, workers) */
  childSrc: string[];
  /** Frame source policy */
  frameSrc: string[];
  /** Worker source policy */
  workerSrc: string[];
  /** Manifest source policy */
  manifestSrc: string[];
  /** Form action policy */
  formAction: string[];
  /** Frame ancestors policy */
  frameAncestors: string[];
  /** Base URI policy */
  baseUri: string[];
  /** Report URI for violations */
  reportUri?: string[];
  /** Report only mode */
  reportOnly?: boolean;
}

/**
 * Input sanitization options
 */
export interface SanitizationOptions {
  /** Allow HTML tags */
  allowHtml?: boolean;
  /** Allowed HTML tags */
  allowedTags?: string[];
  /** Allowed attributes */
  allowedAttributes?: { [tag: string]: string[] };
  /** Maximum length */
  maxLength?: number;
  /** Trim whitespace */
  trim?: boolean;
  /** Convert to lowercase */
  toLowerCase?: boolean;
  /** Remove control characters */
  removeControlChars?: boolean;
}

/**
 * URL validation options
 */
export interface UrlValidationOptions {
  /** Allowed protocols */
  allowedProtocols?: string[];
  /** Allowed domains */
  allowedDomains?: string[];
  /** Block private IPs */
  blockPrivateIps?: boolean;
  /** Block localhost */
  blockLocalhost?: boolean;
  /** Require HTTPS */
  requireHttps?: boolean;
  /** Maximum URL length */
  maxLength?: number;
}

/**
 * Security policy violation
 */
export interface SecurityViolation {
  /** Violation type */
  type: string;
  /** Description of violation */
  message: string;
  /** Input that caused violation */
  input: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Timestamp */
  timestamp: Date;
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  /** Whether input is valid */
  valid: boolean;
  /** Sanitized input (if applicable) */
  sanitized?: string;
  /** Security violations found */
  violations: SecurityViolation[];
  /** Risk score (0-100) */
  riskScore: number;
}

/**
 * Security Validator class for comprehensive security validation
 */
export class SecurityValidator {
  private static readonly DEFAULT_CSP_CONFIG: CSPConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https:', 'wss:'],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    childSrc: ["'self'"],
    frameSrc: ["'self'"],
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
  };

  private static readonly HTML_ESCAPE_MAP: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  private static readonly DANGEROUS_PATTERNS = [
    // JavaScript injection patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // Event handlers

    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
    /(--|\/\*|\*\/|'|")/g,

    // Path traversal patterns
    /\.\.\//g,
    /\.\.\\/g,

    // Command injection patterns
    /[;&|`$()]/g,

    // XSS patterns
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link/gi,
    /<meta/gi,
    /<style/gi,
  ];

  private static readonly PRIVATE_IP_RANGES = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^fc00:/,
    /^fe80:/,
    /^::1$/,
  ];

  /**
   * Generate Content Security Policy header
   */
  static generateCSP(config: Partial<CSPConfig> = {}): string {
    const mergedConfig = { ...this.DEFAULT_CSP_CONFIG, ...config };
    const directives: string[] = [];

    // Build CSP directives
    Object.entries(mergedConfig).forEach(([directive, sources]) => {
      if (directive === 'reportOnly' || !Array.isArray(sources) || sources.length === 0) {
        return;
      }

      // Convert camelCase to kebab-case
      const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();

      if (sources.length > 0) {
        directives.push(`${kebabDirective} ${sources.join(' ')}`);
      }
    });

    // Add report URI if specified
    if (mergedConfig.reportUri && mergedConfig.reportUri.length > 0) {
      directives.push(`report-uri ${mergedConfig.reportUri.join(' ')}`);
    }

    return directives.join('; ');
  }

  /**
   * Sanitize HTML input
   */
  static sanitizeHtml(input: string, options: SanitizationOptions = {}): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    let sanitized = input;
    let riskScore = 0;

    try {
      // Trim whitespace if requested
      if (options.trim !== false) {
        sanitized = sanitized.trim();
      }

      // Check length limit
      if (options.maxLength && sanitized.length > options.maxLength) {
        violations.push({
          type: 'length_exceeded',
          message: `Input exceeds maximum length of ${options.maxLength} characters`,
          input: sanitized,
          severity: 'medium',
          timestamp: new Date(),
        });
        sanitized = sanitized.substring(0, options.maxLength);
        riskScore += 20;
      }

      // Remove control characters if requested
      if (options.removeControlChars !== false) {
        // Control characters check - chars 0-31 and 127-159
        const hasControlChars = sanitized.split('').some(char => {
          const code = char.charCodeAt(0);
          return (code >= 0 && code <= 31) || (code >= 127 && code <= 159);
        });

        if (hasControlChars) {
          violations.push({
            type: 'control_characters',
            message: 'Input contains control characters',
            input: sanitized,
            severity: 'low',
            timestamp: new Date(),
          });
          // Remove control characters
          sanitized = sanitized
            .split('')
            .filter(char => {
              const code = char.charCodeAt(0);
              return !((code >= 0 && code <= 31) || (code >= 127 && code <= 159));
            })
            .join('');
          riskScore += 10;
        }
      }

      // Check for dangerous patterns
      this.DANGEROUS_PATTERNS.forEach((pattern, index) => {
        if (pattern.test(sanitized)) {
          violations.push({
            type: 'dangerous_pattern',
            message: `Input contains potentially dangerous pattern ${index + 1}`,
            input: sanitized,
            severity: 'high',
            timestamp: new Date(),
          });
          riskScore += 30;
        }
      });

      // HTML sanitization
      if (!options.allowHtml) {
        // Escape all HTML characters
        sanitized = sanitized.replace(/[&<>"'`=/]/g, match => {
          return this.HTML_ESCAPE_MAP[match] || match;
        });
      } else {
        // Allow only specified tags and attributes
        sanitized = this.sanitizeAllowedHtml(sanitized, options, violations);
        riskScore += 15;
      }

      // Convert to lowercase if requested
      if (options.toLowerCase) {
        sanitized = sanitized.toLowerCase();
      }

      return {
        valid: violations.length === 0 || violations.every(v => v.severity === 'low'),
        sanitized,
        violations,
        riskScore: Math.min(riskScore, 100),
      };
    } catch (error) {
      violations.push({
        type: 'sanitization_error',
        message: error instanceof Error ? error.message : 'Sanitization failed',
        input,
        severity: 'critical',
        timestamp: new Date(),
      });

      return {
        valid: false,
        sanitized: '',
        violations,
        riskScore: 100,
      };
    }
  }

  /**
   * Validate and sanitize URL
   */
  static validateUrl(url: string, options: UrlValidationOptions = {}): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    let riskScore = 0;

    try {
      // Check length
      if (options.maxLength && url.length > options.maxLength) {
        violations.push({
          type: 'url_too_long',
          message: `URL exceeds maximum length of ${options.maxLength}`,
          input: url,
          severity: 'medium',
          timestamp: new Date(),
        });
        riskScore += 20;
      }

      // Parse URL
      const parsedUrl = new URL(url);

      // Check protocol
      if (options.allowedProtocols && !options.allowedProtocols.includes(parsedUrl.protocol)) {
        violations.push({
          type: 'protocol_not_allowed',
          message: `Protocol ${parsedUrl.protocol} is not allowed`,
          input: url,
          severity: 'high',
          timestamp: new Date(),
        });
        riskScore += 40;
      }

      // Require HTTPS
      if (options.requireHttps && parsedUrl.protocol !== 'https:') {
        violations.push({
          type: 'https_required',
          message: 'HTTPS is required',
          input: url,
          severity: 'medium',
          timestamp: new Date(),
        });
        riskScore += 25;
      }

      // Check allowed domains
      if (
        options.allowedDomains &&
        !this.isDomainAllowed(parsedUrl.hostname, options.allowedDomains)
      ) {
        violations.push({
          type: 'domain_not_allowed',
          message: `Domain ${parsedUrl.hostname} is not allowed`,
          input: url,
          severity: 'high',
          timestamp: new Date(),
        });
        riskScore += 35;
      }

      // Check for private IPs
      if (options.blockPrivateIps && this.isPrivateIp(parsedUrl.hostname)) {
        violations.push({
          type: 'private_ip_blocked',
          message: `Private IP addresses are not allowed: ${parsedUrl.hostname}`,
          input: url,
          severity: 'high',
          timestamp: new Date(),
        });
        riskScore += 40;
      }

      // Check for localhost
      if (options.blockLocalhost && this.isLocalhost(parsedUrl.hostname)) {
        violations.push({
          type: 'localhost_blocked',
          message: 'Localhost addresses are not allowed',
          input: url,
          severity: 'medium',
          timestamp: new Date(),
        });
        riskScore += 30;
      }

      // Check for dangerous URL patterns
      if (this.hasDangerousUrlPattern(url)) {
        violations.push({
          type: 'dangerous_url_pattern',
          message: 'URL contains potentially dangerous patterns',
          input: url,
          severity: 'high',
          timestamp: new Date(),
        });
        riskScore += 35;
      }

      return {
        valid: violations.length === 0 || violations.every(v => v.severity === 'low'),
        sanitized: url,
        violations,
        riskScore: Math.min(riskScore, 100),
      };
    } catch (error) {
      violations.push({
        type: 'invalid_url',
        message: 'Invalid URL format',
        input: url,
        severity: 'high',
        timestamp: new Date(),
      });

      return {
        valid: false,
        sanitized: '',
        violations,
        riskScore: 100,
      };
    }
  }

  /**
   * Validate file path for security
   */
  static validateFilePath(filePath: string): SecurityValidationResult {
    const violations: SecurityViolation[] = [];
    let riskScore = 0;

    // Check for path traversal
    if (filePath.includes('../') || filePath.includes('..\\')) {
      violations.push({
        type: 'path_traversal',
        message: 'Path contains path traversal sequences',
        input: filePath,
        severity: 'critical',
        timestamp: new Date(),
      });
      riskScore += 50;
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      violations.push({
        type: 'null_byte',
        message: 'Path contains null bytes',
        input: filePath,
        severity: 'critical',
        timestamp: new Date(),
      });
      riskScore += 50;
    }

    // Check for dangerous extensions
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.pif',
      '.com',
      '.jar',
      '.vbs',
      '.js',
    ];
    const extension = filePath.toLowerCase().split('.').pop();
    if (extension && dangerousExtensions.includes('.' + extension)) {
      violations.push({
        type: 'dangerous_extension',
        message: `File extension .${extension} is potentially dangerous`,
        input: filePath,
        severity: 'high',
        timestamp: new Date(),
      });
      riskScore += 40;
    }

    return {
      valid: violations.length === 0 || violations.every(v => v.severity !== 'critical'),
      sanitized: filePath,
      violations,
      riskScore: Math.min(riskScore, 100),
    };
  }

  /**
   * Generate secure random nonce for CSP
   */
  static generateNonce(): string {
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Validate content type
   */
  static validateContentType(contentType: string, allowedTypes: string[]): boolean {
    const parts = contentType.toLowerCase().split(';');
    const normalizedType = parts[0]?.trim();
    if (!normalizedType) {
      return false;
    }

    return allowedTypes.some(allowed => {
      if (allowed.endsWith('/*')) {
        return normalizedType.startsWith(allowed.substring(0, allowed.length - 1));
      }
      return normalizedType === allowed;
    });
  }

  /**
   * Sanitize allowed HTML tags and attributes
   */
  private static sanitizeAllowedHtml(
    html: string,
    options: SanitizationOptions,
    violations: SecurityViolation[]
  ): string {
    const allowedTags = options.allowedTags || [];
    const allowedAttributes = options.allowedAttributes || {};

    // Simple HTML tag and attribute sanitization
    // This is a basic implementation - for production use, consider using a library like DOMPurify

    let sanitized = html;

    // Remove script tags completely
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove dangerous event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // If no allowed tags specified, escape everything
    if (allowedTags.length === 0) {
      return sanitized.replace(/[&<>"'`=/]/g, match => {
        return this.HTML_ESCAPE_MAP[match] || match;
      });
    }

    // Basic tag filtering (simplified implementation)
    const tagRegex = /<(\/?)([\w-]+)([^>]*)>/g;
    sanitized = sanitized.replace(tagRegex, (match, closing, tagName, attributes) => {
      const normalizedTag = tagName.toLowerCase();

      if (!allowedTags.includes(normalizedTag)) {
        violations.push({
          type: 'disallowed_tag',
          message: `HTML tag <${normalizedTag}> is not allowed`,
          input: match,
          severity: 'medium',
          timestamp: new Date(),
        });
        return '';
      }

      // If closing tag, return as-is
      if (closing) {
        return `</${normalizedTag}>`;
      }

      // Filter attributes
      const allowedAttrs = allowedAttributes[normalizedTag] || [];
      let filteredAttributes = '';

      if (attributes && allowedAttrs.length > 0) {
        // Basic attribute parsing (simplified)
        const attrRegex = /(\w+)\s*=\s*["']([^"']*)["']/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          const [, attrName, attrValue] = attrMatch;
          if (attrName && allowedAttrs.includes(attrName.toLowerCase())) {
            filteredAttributes += ` ${attrName}="${attrValue}"`;
          }
        }
      }

      return `<${normalizedTag}${filteredAttributes}>`;
    });

    return sanitized;
  }

  /**
   * Check if domain is in allowed list
   */
  private static isDomainAllowed(domain: string, allowedDomains: string[]): boolean {
    return allowedDomains.some(allowed => {
      if (allowed.startsWith('*.')) {
        const baseDomain = allowed.substring(2);
        return domain === baseDomain || domain.endsWith('.' + baseDomain);
      }
      return domain === allowed;
    });
  }

  /**
   * Check if hostname is a private IP
   */
  private static isPrivateIp(hostname: string): boolean {
    return this.PRIVATE_IP_RANGES.some(range => range.test(hostname));
  }

  /**
   * Check if hostname is localhost
   */
  private static isLocalhost(hostname: string): boolean {
    const localhostPatterns = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    return localhostPatterns.includes(hostname.toLowerCase());
  }

  /**
   * Check for dangerous URL patterns
   */
  private static hasDangerousUrlPattern(url: string): boolean {
    const dangerousPatterns = [
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /data:application\//i,
      /file:/i,
      /%00/i, // Null byte encoding
      /%2e%2e/i, // .. encoding
      /\.\.%2f/i, // Path traversal encoding
    ];

    return dangerousPatterns.some(pattern => pattern.test(url));
  }
}

export default SecurityValidator;
