"use strict";
/**
 * Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation, XSS protection, and data sanitization
 * utilities following OWASP security best practices. Used throughout the application
 * to validate user input, prevent injection attacks, and ensure data integrity.
 *
 * @fileoverview Security-focused input validation and sanitization utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validators = exports.InputValidator = void 0;
/**
 * Comprehensive input validator with XSS protection and sanitization
 */
class InputValidator {
    /**
     * HTML entity encoding map for XSS prevention
     */
    static HTML_ENTITIES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    };
    /**
     * Dangerous HTML patterns that should be blocked
     */
    static DANGEROUS_PATTERNS = [
        // Script tags and content
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /<script[\s\S]*?>/gi,
        // Event handlers
        /on\w+\s*=/gi,
        // JavaScript URLs
        /javascript\s*:/gi,
        // Data URLs (can contain scripts)
        /data\s*:\s*text\s*\/\s*html/gi,
        // Object and embed tags
        /<(object|embed|applet|iframe|frame|frameset)[\s\S]*?>/gi,
        // Meta refresh and base href attacks
        /<meta[\s\S]*?http-equiv[\s\S]*?refresh[\s\S]*?>/gi,
        /<base[\s\S]*?href[\s\S]*?>/gi,
        // Form action hijacking
        /<form[\s\S]*?action[\s\S]*?>/gi,
        // Link manipulation
        /<link[\s\S]*?href[\s\S]*?>/gi,
        // Style tags with expressions
        /<style[\s\S]*?>[\s\S]*?<\/style>/gi,
        // Expressions in style attributes
        /style\s*=[\s\S]*?expression\s*\(/gi,
        // Import statements
        /@import/gi,
        // VBScript
        /vbscript\s*:/gi,
        // MSScript
        /msscript\s*:/gi,
    ];
    /**
     * SQL injection patterns to detect
     */
    static SQL_INJECTION_PATTERNS = [
        /('|\\')|(;|\\;)|(--)|(\s)+(--)+(.*)|(\||\\\|)+/gi,
        /((\s)+(or|OR)+(\s)+)|((\s)+(and|AND)+(\s)+)/gi,
        /((\s)+(union|UNION)(\s)+)|((\s)+(select|SELECT)(\s)+)/gi,
        /((\s)+(insert|INSERT)(\s)+)|((\s)+(delete|DELETE)(\s)+)/gi,
        /((\s)+(drop|DROP)(\s)+)|((\s)+(create|CREATE)(\s)+)/gi,
        /((\s)+(update|UPDATE)(\s)+)|((\s)+(alter|ALTER)(\s)+)/gi,
        /(exec|EXEC)(\s)*\(|(sp_|xp_)/gi,
    ];
    /**
     * Command injection patterns to detect
     */
    static COMMAND_INJECTION_PATTERNS = [
        /[;&|`$(){}[\]\\]/g,
        /(cmd|powershell|bash|sh|python|perl|ruby|php|java|node)\s/gi,
        /\.\.\//g,
        /(cat|ls|dir|type|copy|move|del|rm|mkdir|rmdir)\s/gi,
    ];
    /**
     * Validates and sanitizes general text input
     *
     * @param input - Input string to validate
     * @param options - Validation options
     * @returns Validation result with sanitized input or error
     */
    static validateText(input, options = {}) {
        const opts = {
            minLength: 0,
            maxLength: 1000,
            allowHtml: false,
            allowSpecialChars: false,
            allowUrls: false,
            trim: true,
            toLowerCase: false,
            ...options,
        };
        if (typeof input !== 'string') {
            return { valid: false, error: 'Input must be a string' };
        }
        let processed = input;
        const warnings = [];
        // Trim whitespace if requested
        if (opts.trim) {
            processed = processed.trim();
        }
        // Convert to lowercase if requested
        if (opts.toLowerCase) {
            processed = processed.toLowerCase();
        }
        // Length validation
        if (processed.length < opts.minLength) {
            return {
                valid: false,
                error: `Input must be at least ${opts.minLength} characters long`,
            };
        }
        if (processed.length > opts.maxLength) {
            return {
                valid: false,
                error: `Input must not exceed ${opts.maxLength} characters`,
            };
        }
        // Check for null bytes and control characters
        // eslint-disable-next-line no-control-regex
        if (/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/.test(processed)) {
            return {
                valid: false,
                error: 'Input contains invalid control characters',
            };
        }
        // XSS detection and prevention
        if (!opts.allowHtml) {
            // Check for dangerous HTML patterns
            for (const pattern of this.DANGEROUS_PATTERNS) {
                if (pattern.test(processed)) {
                    return {
                        valid: false,
                        error: 'Input contains potentially dangerous HTML or script content',
                    };
                }
            }
            // HTML encode if HTML is not allowed
            processed = this.encodeHtml(processed);
        }
        // SQL injection detection
        for (const pattern of this.SQL_INJECTION_PATTERNS) {
            if (pattern.test(processed)) {
                return {
                    valid: false,
                    error: 'Input contains potentially malicious SQL patterns',
                };
            }
        }
        // Command injection detection
        if (!opts.allowSpecialChars) {
            for (const pattern of this.COMMAND_INJECTION_PATTERNS) {
                if (pattern.test(processed)) {
                    return {
                        valid: false,
                        error: 'Input contains potentially dangerous special characters',
                    };
                }
            }
        }
        // URL detection and validation
        const urlRegex = /https?:\/\/[^\s]+/gi;
        const urls = processed.match(urlRegex);
        if (urls && !opts.allowUrls) {
            return {
                valid: false,
                error: 'URLs are not allowed in this input',
            };
        }
        if (urls && opts.allowUrls) {
            // Validate each URL found
            for (const url of urls) {
                const urlResult = this.validateUrl(url);
                if (!urlResult.valid) {
                    return {
                        valid: false,
                        error: `Invalid URL found: ${urlResult.error}`,
                    };
                }
            }
        }
        // Custom pattern validation
        if (opts.pattern && !opts.pattern.test(processed)) {
            return {
                valid: false,
                error: opts.patternError || 'Input does not match required format',
            };
        }
        const result = {
            valid: true,
            sanitized: processed,
        };
        if (warnings.length > 0) {
            result.warnings = warnings;
        }
        return result;
    }
    /**
     * Validates and sanitizes URL input with security checks
     *
     * @param input - URL string to validate
     * @param options - URL validation options
     * @returns Validation result with sanitized URL or error
     */
    static validateUrl(input, options = {}) {
        const opts = {
            allowedProtocols: ['http:', 'https:'],
            allowLocalhost: process.env['NODE_ENV'] === 'development',
            allowPrivateIps: process.env['NODE_ENV'] === 'development',
            maxLength: 2048,
            requireHttps: false,
            ...options,
        };
        if (typeof input !== 'string') {
            return { valid: false, error: 'URL must be a string' };
        }
        const trimmedInput = input.trim();
        // Length validation
        if (trimmedInput.length === 0) {
            return { valid: false, error: 'URL cannot be empty' };
        }
        if (trimmedInput.length > opts.maxLength) {
            return {
                valid: false,
                error: `URL must not exceed ${opts.maxLength} characters`,
            };
        }
        // Basic URL structure validation
        let url;
        try {
            url = new URL(trimmedInput);
        }
        catch (error) {
            return {
                valid: false,
                error: 'Invalid URL format',
            };
        }
        // Protocol validation
        if (!opts.allowedProtocols.includes(url.protocol)) {
            return {
                valid: false,
                error: `Protocol ${url.protocol} is not allowed. Allowed: ${opts.allowedProtocols.join(', ')}`,
            };
        }
        // HTTPS requirement
        if (opts.requireHttps && url.protocol !== 'https:') {
            return {
                valid: false,
                error: 'HTTPS is required',
            };
        }
        // Check for credentials in URL
        if (url.username || url.password) {
            return {
                valid: false,
                error: 'URLs with embedded credentials are not allowed',
            };
        }
        // Localhost validation
        const hostname = url.hostname.toLowerCase();
        if (!opts.allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1')) {
            return {
                valid: false,
                error: 'Localhost URLs are not allowed',
            };
        }
        // Private IP validation
        if (!opts.allowPrivateIps && this.isPrivateIp(hostname)) {
            return {
                valid: false,
                error: 'Private IP addresses are not allowed',
            };
        }
        // Check for suspicious patterns in URL
        const suspiciousPatterns = [
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /file:/i,
            /@/, // Potential for confusion attacks
            /\.(exe|bat|cmd|scr|pif|com|zip|rar)$/i, // Suspicious file extensions
        ];
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(url.href)) {
                return {
                    valid: false,
                    error: 'URL contains suspicious patterns',
                };
            }
        }
        return {
            valid: true,
            sanitized: url.href, // Use URL object's normalized href
        };
    }
    /**
     * Validates email address format with security considerations
     *
     * @param input - Email string to validate
     * @returns Validation result with sanitized email or error
     */
    static validateEmail(input) {
        if (typeof input !== 'string') {
            return { valid: false, error: 'Email must be a string' };
        }
        const trimmed = input.trim().toLowerCase();
        // Length validation
        if (trimmed.length === 0) {
            return { valid: false, error: 'Email cannot be empty' };
        }
        if (trimmed.length > 254) {
            // RFC 5321 limit
            return { valid: false, error: 'Email address too long (max 254 characters)' };
        }
        // Basic email regex (RFC 5322 compliant)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(trimmed)) {
            return { valid: false, error: 'Invalid email format' };
        }
        // Check for dangerous characters
        if (/[<>&"'\\]/.test(trimmed)) {
            return {
                valid: false,
                error: 'Email contains potentially dangerous characters',
            };
        }
        const parts = trimmed.split('@');
        if (parts.length !== 2) {
            return { valid: false, error: 'Email must contain exactly one @ symbol' };
        }
        const localPart = parts[0];
        const domain = parts[1];
        if (!localPart || !domain) {
            return { valid: false, error: 'Email local part and domain are required' };
        }
        // Local part validation
        if (localPart.length > 64) {
            // RFC 5321 limit
            return { valid: false, error: 'Email local part too long (max 64 characters)' };
        }
        // Domain validation
        if (domain.length > 253) {
            return { valid: false, error: 'Email domain too long (max 253 characters)' };
        }
        // Check for consecutive dots
        if (trimmed.includes('..')) {
            return { valid: false, error: 'Email cannot contain consecutive dots' };
        }
        return { valid: true, sanitized: trimmed };
    }
    /**
     * Validates file paths with security considerations
     *
     * @param input - File path to validate
     * @param options - Validation options
     * @returns Validation result
     */
    static validateFilePath(input, options = {}) {
        if (typeof input !== 'string') {
            return { valid: false, error: 'File path must be a string' };
        }
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'File path cannot be empty' };
        }
        // Check for path traversal attempts
        if (trimmed.includes('..')) {
            return { valid: false, error: 'Path traversal patterns are not allowed' };
        }
        // Check for null bytes
        if (trimmed.includes('\0')) {
            return { valid: false, error: 'Null bytes are not allowed in file paths' };
        }
        // Check for dangerous characters
        const dangerousChars = /[<>"|?*]/;
        if (dangerousChars.test(trimmed)) {
            return { valid: false, error: 'File path contains invalid characters' };
        }
        // Validate against absolute paths if not allowed
        if (!options.allowAbsolute) {
            if (trimmed.startsWith('/') || /^[a-zA-Z]:/.test(trimmed)) {
                return { valid: false, error: 'Absolute paths are not allowed' };
            }
        }
        // Check for suspicious file extensions
        const suspiciousExtensions = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar)$/i;
        if (suspiciousExtensions.test(trimmed)) {
            return {
                valid: false,
                error: 'Potentially dangerous file extension detected',
            };
        }
        return { valid: true, sanitized: trimmed };
    }
    /**
     * Sanitizes HTML content by removing dangerous elements and attributes
     * Note: For production use, consider using a dedicated library like DOMPurify
     *
     * @param input - HTML string to sanitize
     * @returns Sanitized HTML string
     */
    static sanitizeHtml(input) {
        if (typeof input !== 'string') {
            return '';
        }
        let sanitized = input;
        // Remove dangerous patterns
        for (const pattern of this.DANGEROUS_PATTERNS) {
            sanitized = sanitized.replace(pattern, '');
        }
        // Remove event handlers
        sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
        sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
        // Remove javascript: and data: URLs
        sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
        sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
        sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href="#"');
        sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""');
        return sanitized;
    }
    /**
     * Encodes HTML entities to prevent XSS
     *
     * @param input - String to encode
     * @returns HTML-encoded string
     */
    static encodeHtml(input) {
        if (typeof input !== 'string') {
            return '';
        }
        return input.replace(/[&<>"'`=/]/g, char => this.HTML_ENTITIES[char] || char);
    }
    /**
     * Decodes HTML entities
     *
     * @param input - HTML-encoded string to decode
     * @returns Decoded string
     */
    static decodeHtml(input) {
        if (typeof input !== 'string') {
            return '';
        }
        const entityMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#x27;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '=',
        };
        return input.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, entity => entityMap[entity] || entity);
    }
    /**
     * Validates JSON string with security considerations
     *
     * @param input - JSON string to validate
     * @param maxDepth - Maximum allowed nesting depth (default: 10)
     * @returns Validation result with parsed JSON or error
     */
    static validateJson(input, maxDepth = 10) {
        if (typeof input !== 'string') {
            return { valid: false, error: 'JSON input must be a string' };
        }
        const trimmed = input.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'JSON input cannot be empty' };
        }
        // Size limit to prevent DoS
        if (trimmed.length > 1000000) {
            // 1MB limit
            return { valid: false, error: 'JSON input too large (max 1MB)' };
        }
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch (error) {
            return { valid: false, error: 'Invalid JSON format' };
        }
        // Check nesting depth to prevent DoS
        const depth = this.getObjectDepth(parsed);
        if (depth > maxDepth) {
            return {
                valid: false,
                error: `JSON nesting too deep (max ${maxDepth} levels)`,
            };
        }
        // Check for potentially dangerous content in JSON strings
        const jsonString = JSON.stringify(parsed);
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(jsonString)) {
                return {
                    valid: false,
                    error: 'JSON contains potentially dangerous content',
                };
            }
        }
        return { valid: true, sanitized: trimmed, data: parsed };
    }
    /**
     * Checks if a hostname is a private IP address
     *
     * @param hostname - Hostname to check
     * @returns True if hostname is a private IP
     */
    static isPrivateIp(hostname) {
        // IPv4 private ranges
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = hostname.match(ipv4Regex);
        if (match) {
            const numbers = match.slice(1).map(Number);
            if (numbers.length !== 4 || numbers.some(isNaN)) {
                return false;
            }
            const a = numbers[0];
            const b = numbers[1];
            const c = numbers[2];
            const d = numbers[3];
            // Check for valid IP range
            if (a > 255 || b > 255 || c > 255 || d > 255) {
                return false;
            }
            // Private IP ranges
            return (a === 10 || // 10.0.0.0/8
                (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
                (a === 192 && b === 168) || // 192.168.0.0/16
                a === 127 // Loopback
            );
        }
        // Check for local domains
        return hostname.endsWith('.local') || hostname.endsWith('.internal');
    }
    /**
     * Calculates the maximum depth of nested objects/arrays
     *
     * @param obj - Object to analyze
     * @returns Maximum nesting depth
     */
    static getObjectDepth(obj) {
        if (obj === null || typeof obj !== 'object') {
            return 0;
        }
        if (Array.isArray(obj)) {
            return 1 + Math.max(0, ...obj.map(item => this.getObjectDepth(item)));
        }
        const values = Object.values(obj);
        if (values.length === 0) {
            return 1;
        }
        return 1 + Math.max(...values.map(value => this.getObjectDepth(value)));
    }
}
exports.InputValidator = InputValidator;
/**
 * Convenience functions for common validation scenarios
 */
exports.Validators = {
    /**
     * Validates service name with GetWarped-specific rules
     */
    serviceName: (input) => InputValidator.validateText(input, {
        minLength: 1,
        maxLength: 100,
        allowHtml: false,
        allowSpecialChars: false,
        trim: true,
    }),
    /**
     * Validates workspace name with GetWarped-specific rules
     */
    workspaceName: (input) => InputValidator.validateText(input, {
        minLength: 1,
        maxLength: 100,
        allowHtml: false,
        allowSpecialChars: false,
        trim: true,
    }),
    /**
     * Validates service URL with strict security rules
     */
    serviceUrl: (input) => InputValidator.validateUrl(input, {
        allowedProtocols: ['http:', 'https:'],
        allowLocalhost: process.env['NODE_ENV'] === 'development',
        allowPrivateIps: process.env['NODE_ENV'] === 'development',
        requireHttps: false,
    }),
    /**
     * Validates user notes/descriptions
     */
    userNotes: (input) => InputValidator.validateText(input, {
        maxLength: 1000,
        allowHtml: false,
        allowSpecialChars: true,
        trim: true,
    }),
    /**
     * Validates configuration export data
     */
    exportData: (input) => InputValidator.validateJson(input, 20), // Allow deeper nesting for complex configs
    /**
     * Validates user agent strings
     */
    userAgent: (input) => InputValidator.validateText(input, {
        maxLength: 500,
        allowHtml: false,
        allowSpecialChars: false,
        pattern: /^[a-zA-Z0-9\s\-_.()/;:,]+$/,
        patternError: 'User agent contains invalid characters',
    }),
    /**
     * Validates UUID strings (v4 format)
     */
    validateUUID: (input) => {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return InputValidator.validateText(input, {
            pattern: uuidPattern,
            patternError: 'Invalid UUID format',
            trim: true,
            toLowerCase: true,
        });
    },
};
// Export the main validator class and convenience validators
//# sourceMappingURL=InputValidator.js.map