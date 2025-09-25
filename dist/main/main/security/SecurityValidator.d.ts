/**
 * Security Validator
 *
 * Provides comprehensive security validation utilities including CSP (Content Security Policy)
 * generation, input sanitization, URL validation, and security policy enforcement.
 * Used throughout the application to maintain security standards and prevent XSS attacks.
 *
 * @fileoverview Security validation and sanitization utilities
 */
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
    allowedAttributes?: {
        [tag: string]: string[];
    };
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
export declare class SecurityValidator {
    private static readonly DEFAULT_CSP_CONFIG;
    private static readonly HTML_ESCAPE_MAP;
    private static readonly DANGEROUS_PATTERNS;
    private static readonly PRIVATE_IP_RANGES;
    /**
     * Generate Content Security Policy header
     */
    static generateCSP(config?: Partial<CSPConfig>): string;
    /**
     * Sanitize HTML input
     */
    static sanitizeHtml(input: string, options?: SanitizationOptions): SecurityValidationResult;
    /**
     * Validate and sanitize URL
     */
    static validateUrl(url: string, options?: UrlValidationOptions): SecurityValidationResult;
    /**
     * Validate file path for security
     */
    static validateFilePath(filePath: string): SecurityValidationResult;
    /**
     * Generate secure random nonce for CSP
     */
    static generateNonce(): string;
    /**
     * Validate content type
     */
    static validateContentType(contentType: string, allowedTypes: string[]): boolean;
    /**
     * Sanitize allowed HTML tags and attributes
     */
    private static sanitizeAllowedHtml;
    /**
     * Check if domain is in allowed list
     */
    private static isDomainAllowed;
    /**
     * Check if hostname is a private IP
     */
    private static isPrivateIp;
    /**
     * Check if hostname is localhost
     */
    private static isLocalhost;
    /**
     * Check for dangerous URL patterns
     */
    private static hasDangerousUrlPattern;
}
export default SecurityValidator;
//# sourceMappingURL=SecurityValidator.d.ts.map