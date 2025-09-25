/**
 * ServiceConfiguration JSON Schema Validation
 *
 * Provides runtime validation for ServiceConfiguration objects using ajv JSON Schema
 * validation library. Ensures data integrity during import/export, API communication,
 * and user input processing.
 *
 * @fileoverview ServiceConfiguration validation schema and utilities
 */

import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { ServiceConfiguration, ServiceTheme } from '../types/ServiceConfiguration';

/**
 * Initialize ajv instance with format validation
 * Includes URL, date-time, and other format validators
 */
const ajv = new Ajv({
  allErrors: true, // Collect all validation errors, not just the first
  removeAdditional: false, // Keep additional properties (for flexibility)
  useDefaults: true, // Apply default values during validation
  coerceTypes: false, // Strict type checking - no automatic coercion
});

// Add format validators (url, date-time, etc.)
addFormats(ajv);

/**
 * JSON Schema for ServiceTheme interface
 * Validates service-specific theming configuration
 */
const serviceThemeSchema = {
  type: 'object',
  properties: {
    primaryColor: {
      type: ['string', 'null'],
      pattern:
        '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$',
      description: 'CSS color value (hex, rgb, rgba, or named color)',
    },
    backgroundColor: {
      type: ['string', 'null'],
      pattern:
        '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$',
      description: 'CSS color value for background',
    },
    textColor: {
      type: ['string', 'null'],
      pattern:
        '^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$',
      description: 'CSS color value for text',
    },
  },
  required: [],
  additionalProperties: false,
} as const;

/**
 * JSON Schema for ServiceConfiguration interface
 * Comprehensive validation including security, format, and business rule checks
 */
const serviceConfigurationSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      description: 'UUID v4 identifier',
    },
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
      pattern: '^https?://', // Only allow HTTP/HTTPS protocols
      maxLength: 2048,
      description: 'Service URL (HTTP/HTTPS only, max 2048 chars)',
    },
    icon: {
      type: ['string', 'null'],
      maxLength: 100000, // Reasonable limit for base64 images or URLs
      description: 'Icon URL or base64 data (max 100KB)',
    },
    iconType: {
      type: 'string',
      enum: ['url', 'base64', 'builtin'],
      description: 'Icon source type',
    },
    workspaceId: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      description: 'Parent workspace UUID v4 identifier',
    },
    category: {
      type: ['string', 'null'],
      maxLength: 50,
      description: 'Optional service category',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Optional service description',
    },
    position: {
      type: 'integer',
      minimum: 0,
      maximum: 999,
      description: 'Display position (0-999, lower = higher priority)',
    },
    sortOrder: {
      type: 'integer',
      minimum: 0,
      description: 'Sort order for services within workspace',
    },
    theme: {
      oneOf: [{ type: 'null' }, serviceThemeSchema],
      description: 'Optional service-specific theming',
    },
    notifications: {
      type: 'boolean',
      description: 'Enable/disable notifications for this service',
    },
    isActive: {
      type: 'boolean',
      description: 'Whether the service is currently active/enabled',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 creation timestamp',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 last update timestamp',
    },
    customUserAgent: {
      type: ['string', 'null'],
      maxLength: 500,
      pattern: '^[^\\x00-\\x1f\\x7f]*$', // Prevent control characters
      description: 'Custom user agent string (max 500 chars, no control chars)',
    },
    blockAds: {
      type: 'boolean',
      description: 'Enable ad blocking for this service',
    },
    blockTrackers: {
      type: 'boolean',
      description: 'Enable tracker blocking for this service',
    },
  },
  required: [
    'id',
    'name',
    'url',
    'iconType',
    'workspaceId',
    'position',
    'sortOrder',
    'notifications',
    'isActive',
    'createdAt',
    'updatedAt',
    'blockAds',
    'blockTrackers',
  ],
  additionalProperties: false,
} as const;

/**
 * Compiled validation function for ServiceConfiguration
 * Type guard that narrows the type after successful validation
 */
export const validateServiceConfiguration = ajv.compile(serviceConfigurationSchema);

/**
 * Compiled validation function for ServiceTheme
 * Type guard for theme-specific validation
 */
export const validateServiceTheme = ajv.compile(serviceThemeSchema);

/**
 * Validation result interface for better error handling
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
 * Structured validation error for better error handling
 */
export interface ValidationError {
  /** JSON Schema path where error occurred */
  path: string;
  /** Human-readable error message */
  message: string;
  /** Invalid value that caused the error */
  value?: unknown;
  /** Schema keyword that failed (e.g., 'type', 'pattern', 'required') */
  keyword?: string;
}

/**
 * Validates a ServiceConfiguration object and returns structured result
 *
 * @param data - Object to validate
 * @returns Structured validation result with errors if invalid
 *
 * @example
 * ```typescript
 * const result = validateServiceConfigurationWithResult(userInput);
 * if (result.valid) {
 *   // result.data is typed as ServiceConfiguration
 *   console.log('Valid service:', result.data.name);
 * } else {
 *   // Handle validation errors
 *   result.errors?.forEach(err => console.error(err.message));
 * }
 * ```
 */
export function validateServiceConfigurationWithResult(
  data: unknown
): ValidationResult<ServiceConfiguration> {
  // Handle Date conversion for createdAt/updatedAt if they're strings
  const processedData = preprocessServiceConfiguration(data);

  const valid = validateServiceConfiguration(processedData);

  if (valid) {
    return {
      valid: true,
      data: processedData as ServiceConfiguration,
    };
  }

  // Convert ajv errors to our structured format
  const errors =
    (validateServiceConfiguration.errors as ErrorObject[])?.map(err => ({
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
 * Validates a ServiceTheme object and returns structured result
 *
 * @param data - Theme object to validate
 * @returns Structured validation result with errors if invalid
 */
export function validateServiceThemeWithResult(data: unknown): ValidationResult<ServiceTheme> {
  const valid = validateServiceTheme(data);

  if (valid) {
    return {
      valid: true,
      data: data as ServiceTheme,
    };
  }

  const errors =
    (validateServiceTheme.errors as ErrorObject[])?.map(err => ({
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
 * Preprocesses ServiceConfiguration data for validation
 * Handles Date string conversion and other data normalization
 *
 * @param data - Raw data to preprocess
 * @returns Preprocessed data ready for validation
 */
function preprocessServiceConfiguration(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const processed = { ...data } as any;

  // Convert Date objects to ISO strings for schema validation
  if (processed.createdAt instanceof Date) {
    processed.createdAt = processed.createdAt.toISOString();
  }

  if (processed.updatedAt instanceof Date) {
    processed.updatedAt = processed.updatedAt.toISOString();
  }

  return processed;
}

/**
 * Security validation for ServiceConfiguration
 * Additional checks beyond JSON schema validation
 *
 * @param config - ServiceConfiguration to validate
 * @returns Array of security issues found (empty if secure)
 */
export function validateServiceConfigurationSecurity(config: ServiceConfiguration): string[] {
  const issues: string[] = [];

  // URL security checks
  try {
    const url = new URL(config.url);

    // Block dangerous protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      issues.push(`Unsafe protocol: ${url.protocol}`);
    }

    // Block localhost/private IPs in production
    if (process.env['NODE_ENV'] === 'production') {
      const hostname = url.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
      ) {
        issues.push('Private/localhost URLs not allowed in production');
      }
    }
  } catch {
    issues.push('Invalid URL format');
  }

  // Icon security checks
  if (config.icon) {
    if (config.iconType === 'base64') {
      // Basic base64 validation for images
      if (!config.icon.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/)) {
        issues.push('Invalid base64 image format');
      }

      // Size check for base64 images (approximate)
      const base64Size = config.icon.length * 0.75; // Base64 is ~133% of original
      if (base64Size > 50000) {
        // 50KB limit
        issues.push('Base64 icon too large (max 50KB)');
      }
    } else if (config.iconType === 'url') {
      try {
        const iconUrl = new URL(config.icon);
        if (!['http:', 'https:'].includes(iconUrl.protocol)) {
          issues.push('Icon URL must use HTTP/HTTPS');
        }
      } catch {
        issues.push('Invalid icon URL format');
      }
    }
  }

  // Name security checks (XSS prevention)
  if (config.name.includes('<') || config.name.includes('>')) {
    issues.push('Service name contains potentially dangerous characters');
  }

  // Custom user agent checks
  if (config.customUserAgent) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /<script/i,
      /javascript:/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(config.customUserAgent)) {
        issues.push(`Suspicious user agent pattern detected: ${pattern.source}`);
        break;
      }
    }
  }

  return issues;
}

/**
 * Comprehensive validation that combines JSON schema and security validation
 *
 * @param data - Data to validate
 * @returns Comprehensive validation result
 */
export function validateServiceConfigurationComplete(
  data: unknown
): ValidationResult<ServiceConfiguration> {
  // First, run JSON schema validation
  const schemaResult = validateServiceConfigurationWithResult(data);

  if (!schemaResult.valid) {
    return schemaResult;
  }

  // Then run security validation
  const securityIssues = validateServiceConfigurationSecurity(schemaResult.data!);

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
 * ServiceConfigurationValidator class for object-oriented validation
 */
export class ServiceConfigurationValidator {
  /**
   * Validate a ServiceConfiguration object
   */
  async validate(config: ServiceConfiguration): Promise<ValidationResult<ServiceConfiguration>> {
    return validateServiceConfigurationComplete(config);
  }

  /**
   * Quick validation check (returns boolean)
   */
  isValid(config: ServiceConfiguration): boolean {
    const result = validateServiceConfigurationWithResult(config);
    return result.valid;
  }
}

// Export the schemas for external use if needed
export { serviceConfigurationSchema, serviceThemeSchema };
