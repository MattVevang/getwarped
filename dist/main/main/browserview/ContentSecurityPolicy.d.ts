/**
 * ContentSecurityPolicy - Comprehensive CSP enforcement for BrowserView instances
 *
 * Implements robust Content Security Policy controls to prevent:
 * - Cross-Site Scripting (XSS) attacks
 * - Data injection attacks
 * - Malicious script execution
 * - Unsafe inline content
 * - Mixed content vulnerabilities
 * - Unauthorized resource loading
 *
 * @fileoverview Content Security Policy management for secure BrowserView operations
 */
import { BrowserView } from 'electron';
import { EventEmitter } from 'events';
/**
 * CSP directive types
 */
export declare enum CSPDirective {
    DEFAULT_SRC = "default-src",
    SCRIPT_SRC = "script-src",
    STYLE_SRC = "style-src",
    IMG_SRC = "img-src",
    FONT_SRC = "font-src",
    CONNECT_SRC = "connect-src",
    MEDIA_SRC = "media-src",
    OBJECT_SRC = "object-src",
    FRAME_SRC = "frame-src",
    CHILD_SRC = "child-src",
    FORM_ACTION = "form-action",
    FRAME_ANCESTORS = "frame-ancestors",
    BASE_URI = "base-uri",
    UPGRADE_INSECURE_REQUESTS = "upgrade-insecure-requests",
    BLOCK_ALL_MIXED_CONTENT = "block-all-mixed-content"
}
/**
 * CSP source keywords
 */
export declare enum CSPSource {
    SELF = "'self'",
    NONE = "'none'",
    UNSAFE_INLINE = "'unsafe-inline'",
    UNSAFE_EVAL = "'unsafe-eval'",
    STRICT_DYNAMIC = "'strict-dynamic'",
    HTTPS = "https:",
    DATA = "data:",
    BLOB = "blob:",
    WEBSOCKET = "ws:",
    SECURE_WEBSOCKET = "wss:"
}
/**
 * CSP security levels
 */
export declare enum CSPSecurityLevel {
    STRICT = "strict",// Maximum security, minimal functionality
    SECURE = "secure",// Balanced security and functionality
    PERMISSIVE = "permissive",// Minimal restrictions
    CUSTOM = "custom"
}
/**
 * CSP configuration for a service
 */
export interface CSPConfiguration {
    /** Service identifier */
    serviceId: string;
    /** Security level */
    securityLevel: CSPSecurityLevel;
    /** Custom CSP directives */
    customDirectives?: Partial<Record<CSPDirective, string[]>>;
    /** Additional allowed domains */
    allowedDomains?: string[];
    /** Whether to enable CSP reporting */
    enableReporting?: boolean;
    /** Report URI for CSP violations */
    reportUri?: string;
    /** Whether to enforce CSP in report-only mode */
    reportOnly?: boolean;
    /** Nonce for inline scripts/styles */
    nonce?: string;
}
/**
 * CSP violation report
 */
export interface CSPViolationReport {
    serviceId: string;
    timestamp: Date;
    documentUri: string;
    referrer: string;
    violatedDirective: string;
    effectiveDirective: string;
    originalPolicy: string;
    blockedUri: string;
    statusCode: number;
    sourceFile?: string;
    lineNumber?: number;
    columnNumber?: number;
}
/**
 * CSP policy definition
 */
export interface CSPPolicy {
    directives: Map<CSPDirective, string[]>;
    reportOnly: boolean;
    nonce?: string;
}
/**
 * CSP events
 */
export interface CSPEvents {
    'policy-applied': (serviceId: string, policy: string) => void;
    'violation-reported': (report: CSPViolationReport) => void;
    'policy-updated': (serviceId: string, policy: string) => void;
    'nonce-generated': (serviceId: string, nonce: string) => void;
}
/**
 * Comprehensive Content Security Policy manager
 */
export declare class ContentSecurityPolicy extends EventEmitter {
    private browserViews;
    private configurations;
    private policies;
    private violationReports;
    private nonces;
    private readonly MAX_VIOLATION_REPORTS;
    constructor();
    /**
     * Register BrowserView with CSP controls
     */
    registerBrowserView(serviceId: string, browserView: BrowserView, config: CSPConfiguration): void;
    /**
     * Unregister BrowserView from CSP controls
     */
    unregisterBrowserView(serviceId: string): void;
    /**
     * Update CSP configuration for a service
     */
    updateConfiguration(serviceId: string, config: Partial<CSPConfiguration>): void;
    /**
     * Get CSP policy for a service
     */
    getCSPPolicy(serviceId: string): string | null;
    /**
     * Get violation reports for a service
     */
    getViolationReports(serviceId: string): CSPViolationReport[];
    /**
     * Get nonce for a service
     */
    getNonce(serviceId: string): string | undefined;
    /**
     * Clear violation reports for a service
     */
    clearViolationReports(serviceId: string): void;
    /**
     * Create CSP policy based on configuration
     */
    private createCSPPolicy;
    /**
     * Apply strict security policy (maximum security)
     */
    private applyStrictPolicy;
    /**
     * Apply secure policy (balanced security and functionality)
     */
    private applySecurePolicy;
    /**
     * Apply permissive policy (minimal restrictions)
     */
    private applyPermissivePolicy;
    /**
     * Add allowed domains to policy
     */
    private addAllowedDomains;
    /**
     * Add nonce to script and style sources
     */
    private addNonceToPolicy;
    /**
     * Convert policy object to CSP header string
     */
    private policyToString;
    /**
     * Apply CSP policy to WebContents
     */
    private applyCSPPolicy;
    /**
     * Generate cryptographically secure nonce
     */
    private generateNonce;
    /**
     * Check if configuration requires nonce generation
     */
    private requiresNonce;
    /**
     * Handle CSP violation report
     */
    handleViolationReport(serviceId: string, report: any): void;
    /**
     * Clean up CSP manager
     */
    destroy(): void;
}
export default ContentSecurityPolicy;
//# sourceMappingURL=ContentSecurityPolicy.d.ts.map