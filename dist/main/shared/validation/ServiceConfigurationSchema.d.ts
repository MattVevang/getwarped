/**
 * ServiceConfiguration JSON Schema Validation
 *
 * Provides runtime validation for ServiceConfiguration objects using ajv JSON Schema
 * validation library. Ensures data integrity during import/export, API communication,
 * and user input processing.
 *
 * @fileoverview ServiceConfiguration validation schema and utilities
 */
import { ServiceConfiguration, ServiceTheme } from '../types/ServiceConfiguration';
/**
 * JSON Schema for ServiceTheme interface
 * Validates service-specific theming configuration
 */
declare const serviceThemeSchema: {
    readonly type: "object";
    readonly properties: {
        readonly primaryColor: {
            readonly type: readonly ["string", "null"];
            readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
            readonly description: "CSS color value (hex, rgb, rgba, or named color)";
        };
        readonly backgroundColor: {
            readonly type: readonly ["string", "null"];
            readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
            readonly description: "CSS color value for background";
        };
        readonly textColor: {
            readonly type: readonly ["string", "null"];
            readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
            readonly description: "CSS color value for text";
        };
    };
    readonly required: readonly [];
    readonly additionalProperties: false;
};
/**
 * JSON Schema for ServiceConfiguration interface
 * Comprehensive validation including security, format, and business rule checks
 */
declare const serviceConfigurationSchema: {
    readonly type: "object";
    readonly properties: {
        readonly id: {
            readonly type: "string";
            readonly pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
            readonly description: "UUID v4 identifier";
        };
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 100;
            readonly pattern: "^[^<>&\"'\\x00-\\x1f\\x7f]+$";
            readonly description: "Service display name (1-100 chars, no HTML/control chars)";
        };
        readonly url: {
            readonly type: "string";
            readonly format: "uri";
            readonly pattern: "^https?://";
            readonly maxLength: 2048;
            readonly description: "Service URL (HTTP/HTTPS only, max 2048 chars)";
        };
        readonly icon: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 100000;
            readonly description: "Icon URL or base64 data (max 100KB)";
        };
        readonly iconType: {
            readonly type: "string";
            readonly enum: readonly ["url", "base64", "builtin"];
            readonly description: "Icon source type";
        };
        readonly workspaceId: {
            readonly type: "string";
            readonly pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
            readonly description: "Parent workspace UUID v4 identifier";
        };
        readonly position: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 999;
            readonly description: "Display position (0-999, lower = higher priority)";
        };
        readonly theme: {
            readonly oneOf: readonly [{
                readonly type: "null";
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly primaryColor: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                        readonly description: "CSS color value (hex, rgb, rgba, or named color)";
                    };
                    readonly backgroundColor: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                        readonly description: "CSS color value for background";
                    };
                    readonly textColor: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                        readonly description: "CSS color value for text";
                    };
                };
                readonly required: readonly [];
                readonly additionalProperties: false;
            }];
            readonly description: "Optional service-specific theming";
        };
        readonly notifications: {
            readonly type: "boolean";
            readonly description: "Enable/disable notifications for this service";
        };
        readonly createdAt: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "ISO 8601 creation timestamp";
        };
        readonly updatedAt: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "ISO 8601 last update timestamp";
        };
        readonly customUserAgent: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 500;
            readonly pattern: "^[^\\x00-\\x1f\\x7f]*$";
            readonly description: "Custom user agent string (max 500 chars, no control chars)";
        };
        readonly blockAds: {
            readonly type: "boolean";
            readonly description: "Enable ad blocking for this service";
        };
        readonly blockTrackers: {
            readonly type: "boolean";
            readonly description: "Enable tracker blocking for this service";
        };
    };
    readonly required: readonly ["id", "name", "url", "iconType", "workspaceId", "position", "notifications", "createdAt", "updatedAt", "blockAds", "blockTrackers"];
    readonly additionalProperties: false;
};
/**
 * Compiled validation function for ServiceConfiguration
 * Type guard that narrows the type after successful validation
 */
export declare const validateServiceConfiguration: import("ajv").ValidateFunction<{
    name: any;
    url: any;
    notifications: any;
    id: any;
    iconType: any;
    workspaceId: any;
    position: any;
    createdAt: any;
    updatedAt: any;
    blockAds: any;
    blockTrackers: any;
} & {
    name: any;
} & {
    url: any;
} & {
    notifications: any;
} & {
    id: any;
} & {
    iconType: any;
} & {
    workspaceId: any;
} & {
    position: any;
} & {
    createdAt: any;
} & {
    updatedAt: any;
} & {
    blockAds: any;
} & {
    blockTrackers: any;
}>;
/**
 * Compiled validation function for ServiceTheme
 * Type guard for theme-specific validation
 */
export declare const validateServiceTheme: import("ajv").ValidateFunction<unknown>;
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
export declare function validateServiceConfigurationWithResult(data: unknown): ValidationResult<ServiceConfiguration>;
/**
 * Validates a ServiceTheme object and returns structured result
 *
 * @param data - Theme object to validate
 * @returns Structured validation result with errors if invalid
 */
export declare function validateServiceThemeWithResult(data: unknown): ValidationResult<ServiceTheme>;
/**
 * Security validation for ServiceConfiguration
 * Additional checks beyond JSON schema validation
 *
 * @param config - ServiceConfiguration to validate
 * @returns Array of security issues found (empty if secure)
 */
export declare function validateServiceConfigurationSecurity(config: ServiceConfiguration): string[];
/**
 * Comprehensive validation that combines JSON schema and security validation
 *
 * @param data - Data to validate
 * @returns Comprehensive validation result
 */
export declare function validateServiceConfigurationComplete(data: unknown): ValidationResult<ServiceConfiguration>;
/**
 * ServiceConfigurationValidator class for object-oriented validation
 */
export declare class ServiceConfigurationValidator {
    /**
     * Validate a ServiceConfiguration object
     */
    validate(config: ServiceConfiguration): Promise<ValidationResult<ServiceConfiguration>>;
    /**
     * Quick validation check (returns boolean)
     */
    isValid(config: ServiceConfiguration): boolean;
}
export { serviceConfigurationSchema, serviceThemeSchema };
//# sourceMappingURL=ServiceConfigurationSchema.d.ts.map