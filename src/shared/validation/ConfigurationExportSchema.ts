/**
 * ConfigurationExport JSON Schema Validation
 *
 * Provides comprehensive runtime validation for ConfigurationExport objects including
 * security validation to prevent import of sensitive data. Ensures export/import
 * data integrity and maintains security boundaries.
 *
 * @fileoverview ConfigurationExport validation schema and security utilities
 */

import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ConfigurationExport } from '../types/ConfigurationExport';

/**
 * Initialize ajv instance with comprehensive validation settings
 */
const ajv = new Ajv({
  allErrors: true, // Collect all validation errors
  removeAdditional: false, // Keep additional properties for flexibility
  useDefaults: true, // Apply default values
  coerceTypes: false, // Strict type checking
  verbose: true, // Detailed error messages
});

// Add format validators
addFormats(ajv);

/**
 * JSON Schema for ExportedService interface
 * Validates individual service configurations within exports
 */
const exportedServiceSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: '^[^<>&"\'\\x00-\\x1f\\x7f]+$', // Prevent XSS and control characters
      description: 'Service display name (1-100 chars, no HTML/control chars)',
    },
    url: {
      type: 'string',
      format: 'uri',
      pattern: '^https?://', // Only HTTP/HTTPS protocols
      maxLength: 2048,
      description: 'Service URL (HTTP/HTTPS only, max 2048 chars)',
    },
    icon: {
      type: ['string', 'null'],
      maxLength: 100000, // 100KB limit for base64 images
      description: 'Icon URL or base64 data',
    },
    iconType: {
      type: 'string',
      enum: ['url', 'base64', 'builtin'],
      description: 'Icon source type',
    },
    theme: {
      oneOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            primaryColor: {
              type: ['string', 'null'],
              pattern:
                '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$',
            },
            backgroundColor: {
              type: ['string', 'null'],
              pattern:
                '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$',
            },
            textColor: {
              type: ['string', 'null'],
              pattern:
                '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$',
            },
          },
          additionalProperties: false,
        },
      ],
    },
    notifications: {
      type: 'boolean',
      description: 'Enable/disable notifications',
    },
    position: {
      type: 'integer',
      minimum: 0,
      maximum: 999,
      description: 'Display position (0-999)',
    },
    customUserAgent: {
      type: ['string', 'null'],
      maxLength: 500,
      pattern: '^[^\\x00-\\x1f\\x7f]*$', // No control characters
      description: 'Custom user agent string',
    },
    blockAds: {
      type: 'boolean',
      description: 'Ad blocking preference',
    },
    blockTrackers: {
      type: 'boolean',
      description: 'Tracker blocking preference',
    },
    category: {
      type: ['string', 'null'],
      maxLength: 50,
      pattern: '^[a-zA-Z0-9\\s-_]+$',
      description: 'Service category',
    },
    notes: {
      type: ['string', 'null'],
      maxLength: 1000,
      description: 'Optional service notes',
    },
    templateId: {
      type: ['string', 'null'],
      pattern: '^[a-zA-Z0-9\\-_]+$',
      maxLength: 100,
      description: 'Service template identifier',
    },
  },
  required: ['name', 'url', 'iconType', 'notifications', 'position', 'blockAds', 'blockTrackers'],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for ExportedWorkspace interface
 * Validates workspace configurations within exports
 */
const exportedWorkspaceSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: '^[^<>&"\'\\x00-\\x1f\\x7f]+$',
      description: 'Workspace name (1-100 chars, no HTML/control chars)',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Optional workspace description',
    },
    services: {
      type: 'array',
      items: exportedServiceSchema,
      maxItems: 100, // Safety limit
      description: 'Array of exported services',
    },
    theme: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: ['WORK', 'PERSONAL', 'DARK', 'LIGHT', 'CUSTOM'],
          description: 'Theme name',
        },
        primaryColor: {
          type: 'string',
          pattern: '^#[0-9A-Fa-f]{6}$',
          description: 'Primary color (hex)',
        },
        secondaryColor: {
          type: 'string',
          pattern: '^#[0-9A-Fa-f]{6}$',
          description: 'Secondary color (hex)',
        },
        backgroundColor: {
          type: 'string',
          pattern: '^#[0-9A-Fa-f]{6}$',
          description: 'Background color (hex)',
        },
      },
      required: ['name', 'primaryColor', 'secondaryColor', 'backgroundColor'],
      additionalProperties: false,
    },
    position: {
      type: 'integer',
      minimum: 0,
      maximum: 999,
      description: 'Workspace position',
    },
    wasDefault: {
      type: 'boolean',
      description: 'Whether this was the default workspace',
    },
    notes: {
      type: ['string', 'null'],
      maxLength: 1000,
      description: 'Optional workspace notes',
    },
  },
  required: ['name', 'services', 'theme', 'position', 'wasDefault'],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for ExportMetadata interface
 * Validates export metadata and version information
 */
const exportMetadataSchema = {
  type: 'object',
  properties: {
    appVersion: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9-]+)?$',
      description: 'Semantic version string',
    },
    platform: {
      type: 'string',
      enum: ['win32', 'darwin', 'linux', 'Windows', 'macOS', 'Linux'],
      description: 'Operating system platform',
    },
    totalWorkspaces: {
      type: 'integer',
      minimum: 0,
      maximum: 50, // Reasonable limit
      description: 'Number of exported workspaces',
    },
    totalServices: {
      type: 'integer',
      minimum: 0,
      maximum: 1000, // Safety limit
      description: 'Total number of exported services',
    },
    exportVersion: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Export format version',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Optional export description',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Export creation timestamp',
    },
    checksum: {
      type: ['string', 'null'],
      pattern: '^[a-fA-F0-9]+$',
      maxLength: 128,
      description: 'Optional data integrity checksum',
    },
  },
  required: [
    'appVersion',
    'platform',
    'totalWorkspaces',
    'totalServices',
    'exportVersion',
    'createdAt',
  ],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for ExportedPreferences interface
 * Validates application preferences within exports
 */
const exportedPreferencesSchema = {
  type: 'object',
  properties: {
    theme: {
      type: 'string',
      enum: ['light', 'dark', 'system'],
      description: 'UI theme preference',
    },
    language: {
      type: 'string',
      pattern: '^[a-z]{2}(-[A-Z]{2})?$',
      description: 'Language/locale code (e.g., en, en-US)',
    },
    notifications: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        showInTray: { type: 'boolean' },
        soundEnabled: { type: 'boolean' },
      },
      required: ['enabled', 'showInTray', 'soundEnabled'],
      additionalProperties: false,
    },
    window: {
      type: 'object',
      properties: {
        width: {
          type: 'integer',
          minimum: 400,
          maximum: 4000,
        },
        height: {
          type: 'integer',
          minimum: 300,
          maximum: 3000,
        },
        maximized: { type: 'boolean' },
      },
      required: ['width', 'height', 'maximized'],
      additionalProperties: false,
    },
    privacy: {
      type: 'object',
      properties: {
        analytics: { type: 'boolean' },
        crashReports: { type: 'boolean' },
        errorReporting: { type: 'boolean' },
      },
      required: ['analytics', 'crashReports', 'errorReporting'],
      additionalProperties: false,
    },
    updates: {
      type: 'object',
      properties: {
        autoCheck: { type: 'boolean' },
        autoInstall: { type: 'boolean' },
        includePrerelease: { type: 'boolean' },
      },
      required: ['autoCheck', 'autoInstall', 'includePrerelease'],
      additionalProperties: false,
    },
  },
  required: ['theme', 'language', 'notifications', 'window', 'privacy', 'updates'],
  additionalProperties: false,
} as const;

/**
 * Main JSON Schema for ConfigurationExport interface
 * Comprehensive validation of complete export structure
 */
const configurationExportSchema = {
  type: 'object',
  properties: {
    version: {
      type: 'string',
      pattern: '^\\d+\\.\\d+\\.\\d+$',
      description: 'Export format version',
    },
    exportedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Export timestamp',
    },
    workspaces: {
      type: 'array',
      items: exportedWorkspaceSchema,
      minItems: 0,
      maxItems: 50, // Safety limit
      description: 'Array of exported workspaces',
    },
    metadata: exportMetadataSchema,
    preferences: {
      oneOf: [{ type: 'null' }, exportedPreferencesSchema],
    },
    securityNotices: {
      type: ['array', 'null'],
      items: {
        type: 'string',
        maxLength: 200,
      },
      maxItems: 20,
      description: 'Security warnings and notices',
    },
  },
  required: ['version', 'exportedAt', 'workspaces', 'metadata'],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for ImportConfiguration interface
 */
const importConfigurationSchema = {
  type: 'object',
  properties: {
    conflictResolution: {
      type: 'string',
      enum: ['skip', 'rename', 'overwrite', 'ask'],
      description: 'How to handle name conflicts',
    },
    importThemes: {
      type: 'boolean',
      description: 'Whether to import workspace themes',
    },
    importPreferences: {
      type: 'boolean',
      description: 'Whether to import application preferences',
    },
    workspaceMergeStrategy: {
      type: 'string',
      enum: ['separate', 'merge', 'replace'],
      description: 'Workspace merge strategy',
    },
    validateUrls: {
      type: 'boolean',
      description: 'Whether to validate URLs during import',
    },
    maxServices: {
      type: ['integer', 'null'],
      minimum: 1,
      maximum: 1000,
      description: 'Maximum services to import (safety limit)',
    },
  },
  required: [
    'conflictResolution',
    'importThemes',
    'importPreferences',
    'workspaceMergeStrategy',
    'validateUrls',
  ],
  additionalProperties: false,
} as const;

/**
 * Compiled validation functions
 */
export const validateConfigurationExport = ajv.compile(configurationExportSchema);
export const validateExportedWorkspace = ajv.compile(exportedWorkspaceSchema);
export const validateExportedService = ajv.compile(exportedServiceSchema);
export const validateExportMetadata = ajv.compile(exportMetadataSchema);
export const validateExportedPreferences = ajv.compile(exportedPreferencesSchema);
export const validateImportConfiguration = ajv.compile(importConfigurationSchema);

/**
 * Validation result interface for structured error handling
 */
export interface ValidationResult<T> {
  /** Whether validation passed */
  valid: boolean;
  /** Validated data (only present if valid is true) */
  data?: T;
  /** Validation errors (only present if valid is false) */
  errors?: ValidationError[];
}

/**
 * Structured validation error
 */
export interface ValidationError {
  /** JSON Schema path where error occurred */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Invalid value that caused the error */
  value?: unknown;
  /** Schema keyword that failed */
  keyword?: string;
}

/**
 * Validates a ConfigurationExport object and returns structured result
 *
 * @param data - Object to validate
 * @returns Structured validation result with errors if invalid
 */
export function validateConfigurationExportWithResult(
  data: unknown
): ValidationResult<ConfigurationExport> {
  // Preprocess dates
  const processedData = preprocessConfigurationExport(data);

  const valid = validateConfigurationExport(processedData);

  if (valid) {
    return {
      valid: true,
      data: processedData as ConfigurationExport,
    };
  }

  const errors =
    (validateConfigurationExport.errors as ErrorObject[])?.map(err => ({
      path: err.instancePath || err.schemaPath,
      message: err.message || 'Unknown validation error',
      value: err.data,
      keyword: err.keyword,
    })) || [];

  return {
    valid: false,
    errors,
  };
}

/**
 * Comprehensive security validation for ConfigurationExport
 * Performs deep security analysis beyond JSON schema validation
 *
 * @param exportData - Export data to validate
 * @returns Array of security issues found (empty if secure)
 */
export function validateConfigurationExportSecurity(exportData: ConfigurationExport): string[] {
  const issues: string[] = [];

  // Keywords that might indicate sensitive data leakage
  const forbiddenKeywords = [
    'password',
    'passwd',
    'pwd',
    'token',
    'jwt',
    'bearer',
    'session',
    'sessionid',
    'sid',
    'cookie',
    'cookies',
    'credential',
    'credentials',
    'cred',
    'auth',
    'authentication',
    'authorization',
    'login',
    'signin',
    'logon',
    'secret',
    'secrets',
    'key',
    'keys',
    'apikey',
    'api_key',
    'private',
    'priv',
  ];

  // Convert to JSON string for content analysis (case-insensitive)
  const jsonString = JSON.stringify(exportData).toLowerCase();

  // Check for forbidden keywords
  forbiddenKeywords.forEach(keyword => {
    if (jsonString.includes(keyword.toLowerCase())) {
      issues.push(`Potential sensitive data detected: '${keyword}' found in export`);
    }
  });

  // Validate each workspace and service
  exportData.workspaces.forEach((workspace, workspaceIndex) => {
    // Check workspace name for suspicious content
    if (containsSensitivePatterns(workspace.name)) {
      issues.push(
        `Workspace ${workspaceIndex + 1} ('${workspace.name}') name contains potentially sensitive content`
      );
    }

    workspace.services.forEach(service => {
      // Validate service URLs
      try {
        const url = new URL(service.url);

        // Check for credentials embedded in URL
        if (url.username || url.password) {
          issues.push(`Service '${service.name}' contains embedded credentials in URL`);
        }

        // Check for internal/private URLs in production context
        if (isPrivateUrl(url)) {
          issues.push(
            `Service '${service.name}' URL appears to be internal/private: ${url.hostname}`
          );
        }

        // Check for suspicious URL patterns
        if (containsSuspiciousUrlPatterns(url)) {
          issues.push(`Service '${service.name}' URL contains suspicious patterns`);
        }
      } catch (error) {
        issues.push(`Service '${service.name}' has invalid URL format: ${service.url}`);
      }

      // Check service name for sensitive content
      if (containsSensitivePatterns(service.name)) {
        issues.push(`Service '${service.name}' name contains potentially sensitive content`);
      }

      // Check custom user agent for suspicious content
      if (service.customUserAgent && containsSuspiciousUserAgent(service.customUserAgent)) {
        issues.push(`Service '${service.name}' has suspicious user agent string`);
      }

      // Check base64 icon data
      if (service.iconType === 'base64' && service.icon) {
        if (!isValidBase64Icon(service.icon)) {
          issues.push(`Service '${service.name}' has invalid base64 icon format`);
        }

        if (service.icon.length > 50000) {
          // ~37KB base64 encoded
          issues.push(`Service '${service.name}' icon is too large (>37KB)`);
        }
      }
    });
  });

  // Check metadata for suspicious content
  if (
    exportData.metadata.description &&
    containsSensitivePatterns(exportData.metadata.description)
  ) {
    issues.push('Export metadata description contains potentially sensitive content');
  }

  // Validate export size limits
  const totalServices = exportData.workspaces.reduce((sum, ws) => sum + ws.services.length, 0);
  if (totalServices > 1000) {
    issues.push(
      `Export contains too many services (${totalServices}), maximum recommended is 1000`
    );
  }

  if (exportData.workspaces.length > 50) {
    issues.push(
      `Export contains too many workspaces (${exportData.workspaces.length}), maximum recommended is 50`
    );
  }

  return issues;
}

/**
 * Comprehensive validation combining JSON schema and security validation
 *
 * @param data - Data to validate
 * @returns Complete validation result
 */
export function validateConfigurationExportComplete(
  data: unknown
): ValidationResult<ConfigurationExport> {
  // First, run JSON schema validation
  const schemaResult = validateConfigurationExportWithResult(data);

  if (!schemaResult.valid) {
    return schemaResult;
  }

  // Then run security validation
  const securityIssues = validateConfigurationExportSecurity(schemaResult.data!);

  if (securityIssues.length > 0) {
    return {
      valid: false,
      errors: securityIssues.map(issue => ({
        path: '/security',
        message: issue,
        keyword: 'security',
      })),
    };
  }

  return schemaResult;
}

/**
 * Preprocesses ConfigurationExport data for validation
 * Handles Date string conversion and other data normalization
 */
function preprocessConfigurationExport(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const processed = { ...data } as any;

  // Convert date strings to proper format
  if (typeof processed.exportedAt === 'string') {
    try {
      const date = new Date(processed.exportedAt);
      processed.exportedAt = date.toISOString();
    } catch {
      // Leave as string for validation to catch
    }
  }

  if (processed.metadata && typeof processed.metadata.createdAt === 'string') {
    try {
      const date = new Date(processed.metadata.createdAt);
      processed.metadata.createdAt = date.toISOString();
    } catch {
      // Leave as string for validation to catch
    }
  }

  return processed;
}

/**
 * Helper function to check for sensitive patterns in text
 */
function containsSensitivePatterns(text: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /key/i,
    /secret/i,
    /credential/i,
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Email addresses
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
    /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN pattern
    /<script/i,
    /javascript:/i,
    /data:/i, // XSS patterns
  ];

  return sensitivePatterns.some(pattern => pattern.test(text));
}

/**
 * Helper function to check if URL is private/internal
 */
function isPrivateUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  );
}

/**
 * Helper function to check for suspicious URL patterns
 */
function containsSuspiciousUrlPatterns(url: URL): boolean {
  const suspiciousPatterns = [
    /admin/i,
    /login/i,
    /auth/i,
    /private/i,
    /internal/i,
    /debug/i,
    /test/i,
    /dev/i,
    /staging/i,
  ];

  const fullUrl = url.toString().toLowerCase();
  return suspiciousPatterns.some(pattern => pattern.test(fullUrl));
}

/**
 * Helper function to check for suspicious user agent strings
 */
function containsSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /<script/i,
    /javascript:/i,
    /eval\(/i,
    /function\(/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Helper function to validate base64 icon format
 */
function isValidBase64Icon(icon: string): boolean {
  // Check for proper data URL format
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/;

  if (!dataUrlPattern.test(icon)) {
    return false;
  }

  // Extract and validate base64 portion
  const base64Data = icon.split(',')[1];
  if (!base64Data) return false;

  // Basic base64 validation
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Pattern.test(base64Data);
}

// Export schemas for external use
export {
  configurationExportSchema,
  exportedWorkspaceSchema,
  exportedServiceSchema,
  exportMetadataSchema,
  exportedPreferencesSchema,
  importConfigurationSchema,
};
