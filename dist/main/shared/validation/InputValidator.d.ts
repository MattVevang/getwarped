/**
 * Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation, XSS protection, and data sanitization
 * utilities following OWASP security best practices. Used throughout the application
 * to validate user input, prevent injection attacks, and ensure data integrity.
 *
 * @fileoverview Security-focused input validation and sanitization utilities
 */
/**
 * Input validation result interface
 */
export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Sanitized input (only present if valid is true) */
    sanitized?: string;
    /** Validation error message (only present if valid is false) */
    error?: string;
    /** Warning messages for non-critical issues */
    warnings?: string[];
}
/**
 * Input validation options for customizing validation behavior
 */
export interface ValidationOptions {
    /** Minimum length (default: 0) */
    minLength?: number;
    /** Maximum length (default: 1000) */
    maxLength?: number;
    /** Allow HTML tags (default: false) */
    allowHtml?: boolean;
    /** Allow special characters (default: false) */
    allowSpecialChars?: boolean;
    /** Allow URLs (default: false) */
    allowUrls?: boolean;
    /** Trim whitespace (default: true) */
    trim?: boolean;
    /** Convert to lowercase (default: false) */
    toLowerCase?: boolean;
    /** Custom regex pattern to validate against */
    pattern?: RegExp;
    /** Custom error message for pattern validation */
    patternError?: string;
}
/**
 * URL validation options for strict URL validation
 */
export interface UrlValidationOptions {
    /** Allowed protocols (default: ['http:', 'https:']) */
    allowedProtocols?: string[];
    /** Allow localhost URLs (default: false in production) */
    allowLocalhost?: boolean;
    /** Allow private IP ranges (default: false in production) */
    allowPrivateIps?: boolean;
    /** Maximum URL length (default: 2048) */
    maxLength?: number;
    /** Require HTTPS only (default: false) */
    requireHttps?: boolean;
}
/**
 * Comprehensive input validator with XSS protection and sanitization
 */
export declare class InputValidator {
    /**
     * HTML entity encoding map for XSS prevention
     */
    private static readonly HTML_ENTITIES;
    /**
     * Dangerous HTML patterns that should be blocked
     */
    private static readonly DANGEROUS_PATTERNS;
    /**
     * SQL injection patterns to detect
     */
    private static readonly SQL_INJECTION_PATTERNS;
    /**
     * Command injection patterns to detect
     */
    private static readonly COMMAND_INJECTION_PATTERNS;
    /**
     * Validates and sanitizes general text input
     *
     * @param input - Input string to validate
     * @param options - Validation options
     * @returns Validation result with sanitized input or error
     */
    static validateText(input: string, options?: ValidationOptions): ValidationResult;
    /**
     * Validates and sanitizes URL input with security checks
     *
     * @param input - URL string to validate
     * @param options - URL validation options
     * @returns Validation result with sanitized URL or error
     */
    static validateUrl(input: string, options?: UrlValidationOptions): ValidationResult;
    /**
     * Validates email address format with security considerations
     *
     * @param input - Email string to validate
     * @returns Validation result with sanitized email or error
     */
    static validateEmail(input: string): ValidationResult;
    /**
     * Validates file paths with security considerations
     *
     * @param input - File path to validate
     * @param options - Validation options
     * @returns Validation result
     */
    static validateFilePath(input: string, options?: {
        allowAbsolute?: boolean;
    }): ValidationResult;
    /**
     * Sanitizes HTML content by removing dangerous elements and attributes
     * Note: For production use, consider using a dedicated library like DOMPurify
     *
     * @param input - HTML string to sanitize
     * @returns Sanitized HTML string
     */
    static sanitizeHtml(input: string): string;
    /**
     * Encodes HTML entities to prevent XSS
     *
     * @param input - String to encode
     * @returns HTML-encoded string
     */
    static encodeHtml(input: string): string;
    /**
     * Decodes HTML entities
     *
     * @param input - HTML-encoded string to decode
     * @returns Decoded string
     */
    static decodeHtml(input: string): string;
    /**
     * Validates JSON string with security considerations
     *
     * @param input - JSON string to validate
     * @param maxDepth - Maximum allowed nesting depth (default: 10)
     * @returns Validation result with parsed JSON or error
     */
    static validateJson(input: string, maxDepth?: number): ValidationResult & {
        data?: any;
    };
    /**
     * Checks if a hostname is a private IP address
     *
     * @param hostname - Hostname to check
     * @returns True if hostname is a private IP
     */
    private static isPrivateIp;
    /**
     * Calculates the maximum depth of nested objects/arrays
     *
     * @param obj - Object to analyze
     * @returns Maximum nesting depth
     */
    private static getObjectDepth;
}
/**
 * Convenience functions for common validation scenarios
 */
export declare const Validators: {
    /**
     * Validates service name with GetWarped-specific rules
     */
    serviceName: (input: string) => ValidationResult;
    /**
     * Validates workspace name with GetWarped-specific rules
     */
    workspaceName: (input: string) => ValidationResult;
    /**
     * Validates service URL with strict security rules
     */
    serviceUrl: (input: string) => ValidationResult;
    /**
     * Validates user notes/descriptions
     */
    userNotes: (input: string) => ValidationResult;
    /**
     * Validates configuration export data
     */
    exportData: (input: string) => ValidationResult & {
        data?: any;
    };
    /**
     * Validates user agent strings
     */
    userAgent: (input: string) => ValidationResult;
    /**
     * Validates UUID strings (v4 format)
     */
    validateUUID: (input: string) => ValidationResult;
};
//# sourceMappingURL=InputValidator.d.ts.map