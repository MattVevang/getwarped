"use strict";
/**
 * Security Validator
 *
 * Provides comprehensive security validation utilities including CSP (Content Security Policy)
 * generation, input sanitization, URL validation, and security policy enforcement.
 * Used throughout the application to maintain security standards and prevent XSS attacks.
 *
 * @fileoverview Security validation and sanitization utilities
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidator = void 0;
const crypto = __importStar(require("crypto"));
const url_1 = require("url");
/**
 * Security Validator class for comprehensive security validation
 */
class SecurityValidator {
    static DEFAULT_CSP_CONFIG = {
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
    static HTML_ESCAPE_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;',
    };
    static DANGEROUS_PATTERNS = [
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
    static PRIVATE_IP_RANGES = [
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
    static generateCSP(config = {}) {
        const mergedConfig = { ...this.DEFAULT_CSP_CONFIG, ...config };
        const directives = [];
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
    static sanitizeHtml(input, options = {}) {
        const violations = [];
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
            }
            else {
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
        }
        catch (error) {
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
    static validateUrl(url, options = {}) {
        const violations = [];
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
            const parsedUrl = new url_1.URL(url);
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
            if (options.allowedDomains &&
                !this.isDomainAllowed(parsedUrl.hostname, options.allowedDomains)) {
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
        }
        catch (error) {
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
    static validateFilePath(filePath) {
        const violations = [];
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
    static generateNonce() {
        return crypto.randomBytes(16).toString('base64');
    }
    /**
     * Validate content type
     */
    static validateContentType(contentType, allowedTypes) {
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
    static sanitizeAllowedHtml(html, options, violations) {
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
    static isDomainAllowed(domain, allowedDomains) {
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
    static isPrivateIp(hostname) {
        return this.PRIVATE_IP_RANGES.some(range => range.test(hostname));
    }
    /**
     * Check if hostname is localhost
     */
    static isLocalhost(hostname) {
        const localhostPatterns = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
        return localhostPatterns.includes(hostname.toLowerCase());
    }
    /**
     * Check for dangerous URL patterns
     */
    static hasDangerousUrlPattern(url) {
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
exports.SecurityValidator = SecurityValidator;
exports.default = SecurityValidator;
//# sourceMappingURL=SecurityValidator.js.map