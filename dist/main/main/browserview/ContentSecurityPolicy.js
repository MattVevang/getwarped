"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentSecurityPolicy = exports.CSPSecurityLevel = exports.CSPSource = exports.CSPDirective = void 0;
const events_1 = require("events");
/**
 * CSP directive types
 */
var CSPDirective;
(function (CSPDirective) {
    CSPDirective["DEFAULT_SRC"] = "default-src";
    CSPDirective["SCRIPT_SRC"] = "script-src";
    CSPDirective["STYLE_SRC"] = "style-src";
    CSPDirective["IMG_SRC"] = "img-src";
    CSPDirective["FONT_SRC"] = "font-src";
    CSPDirective["CONNECT_SRC"] = "connect-src";
    CSPDirective["MEDIA_SRC"] = "media-src";
    CSPDirective["OBJECT_SRC"] = "object-src";
    CSPDirective["FRAME_SRC"] = "frame-src";
    CSPDirective["CHILD_SRC"] = "child-src";
    CSPDirective["FORM_ACTION"] = "form-action";
    CSPDirective["FRAME_ANCESTORS"] = "frame-ancestors";
    CSPDirective["BASE_URI"] = "base-uri";
    CSPDirective["UPGRADE_INSECURE_REQUESTS"] = "upgrade-insecure-requests";
    CSPDirective["BLOCK_ALL_MIXED_CONTENT"] = "block-all-mixed-content";
})(CSPDirective || (exports.CSPDirective = CSPDirective = {}));
/**
 * CSP source keywords
 */
var CSPSource;
(function (CSPSource) {
    CSPSource["SELF"] = "'self'";
    CSPSource["NONE"] = "'none'";
    CSPSource["UNSAFE_INLINE"] = "'unsafe-inline'";
    CSPSource["UNSAFE_EVAL"] = "'unsafe-eval'";
    CSPSource["STRICT_DYNAMIC"] = "'strict-dynamic'";
    CSPSource["HTTPS"] = "https:";
    CSPSource["DATA"] = "data:";
    CSPSource["BLOB"] = "blob:";
    CSPSource["WEBSOCKET"] = "ws:";
    CSPSource["SECURE_WEBSOCKET"] = "wss:";
})(CSPSource || (exports.CSPSource = CSPSource = {}));
/**
 * CSP security levels
 */
var CSPSecurityLevel;
(function (CSPSecurityLevel) {
    CSPSecurityLevel["STRICT"] = "strict";
    CSPSecurityLevel["SECURE"] = "secure";
    CSPSecurityLevel["PERMISSIVE"] = "permissive";
    CSPSecurityLevel["CUSTOM"] = "custom";
})(CSPSecurityLevel || (exports.CSPSecurityLevel = CSPSecurityLevel = {}));
/**
 * Comprehensive Content Security Policy manager
 */
class ContentSecurityPolicy extends events_1.EventEmitter {
    browserViews = new Map();
    configurations = new Map();
    policies = new Map();
    violationReports = new Map();
    nonces = new Map();
    MAX_VIOLATION_REPORTS = 100;
    constructor() {
        super();
    }
    /**
     * Register BrowserView with CSP controls
     */
    registerBrowserView(serviceId, browserView, config) {
        // Validate inputs
        if (!serviceId || !browserView) {
            throw new Error('Service ID and BrowserView are required');
        }
        // Store references
        this.browserViews.set(serviceId, browserView);
        this.configurations.set(serviceId, config);
        this.violationReports.set(serviceId, []);
        // Generate and store nonce if needed
        if (config.nonce || this.requiresNonce(config)) {
            const nonce = this.generateNonce();
            this.nonces.set(serviceId, nonce);
            this.emit('nonce-generated', serviceId, nonce);
        }
        // Create and apply CSP policy
        const policy = this.createCSPPolicy(config);
        this.policies.set(serviceId, policy);
        this.applyCSPPolicy(serviceId, browserView.webContents);
    }
    /**
     * Unregister BrowserView from CSP controls
     */
    unregisterBrowserView(serviceId) {
        this.browserViews.delete(serviceId);
        this.configurations.delete(serviceId);
        this.policies.delete(serviceId);
        this.violationReports.delete(serviceId);
        this.nonces.delete(serviceId);
    }
    /**
     * Update CSP configuration for a service
     */
    updateConfiguration(serviceId, config) {
        const currentConfig = this.configurations.get(serviceId);
        const browserView = this.browserViews.get(serviceId);
        if (!currentConfig || !browserView) {
            return;
        }
        // Merge configurations
        const updatedConfig = { ...currentConfig, ...config };
        this.configurations.set(serviceId, updatedConfig);
        // Regenerate nonce if needed
        if (config.nonce || this.requiresNonce(updatedConfig)) {
            const nonce = this.generateNonce();
            this.nonces.set(serviceId, nonce);
            this.emit('nonce-generated', serviceId, nonce);
        }
        // Update and apply policy
        const policy = this.createCSPPolicy(updatedConfig);
        this.policies.set(serviceId, policy);
        this.applyCSPPolicy(serviceId, browserView.webContents);
    }
    /**
     * Get CSP policy for a service
     */
    getCSPPolicy(serviceId) {
        const policy = this.policies.get(serviceId);
        if (!policy) {
            return null;
        }
        return this.policyToString(policy);
    }
    /**
     * Get violation reports for a service
     */
    getViolationReports(serviceId) {
        return this.violationReports.get(serviceId) || [];
    }
    /**
     * Get nonce for a service
     */
    getNonce(serviceId) {
        return this.nonces.get(serviceId);
    }
    /**
     * Clear violation reports for a service
     */
    clearViolationReports(serviceId) {
        this.violationReports.set(serviceId, []);
    }
    /**
     * Create CSP policy based on configuration
     */
    createCSPPolicy(config) {
        const nonce = this.nonces.get(config.serviceId);
        const policy = {
            directives: new Map(),
            reportOnly: config.reportOnly || false,
        };
        // Add nonce if available
        if (nonce) {
            policy.nonce = nonce;
        }
        // Apply security level presets
        switch (config.securityLevel) {
            case CSPSecurityLevel.STRICT:
                this.applyStrictPolicy(policy);
                break;
            case CSPSecurityLevel.SECURE:
                this.applySecurePolicy(policy);
                break;
            case CSPSecurityLevel.PERMISSIVE:
                this.applyPermissivePolicy(policy);
                break;
            case CSPSecurityLevel.CUSTOM:
                // Start with secure defaults for custom policies
                this.applySecurePolicy(policy);
                break;
        }
        // Apply custom directives
        if (config.customDirectives) {
            for (const [directive, sources] of Object.entries(config.customDirectives)) {
                if (sources && sources.length > 0) {
                    policy.directives.set(directive, [...sources]);
                }
            }
        }
        // Add allowed domains
        if (config.allowedDomains && config.allowedDomains.length > 0) {
            this.addAllowedDomains(policy, config.allowedDomains);
        }
        // Add nonce to script and style sources if available
        if (policy.nonce) {
            this.addNonceToPolicy(policy, policy.nonce);
        }
        return policy;
    }
    /**
     * Apply strict security policy (maximum security)
     */
    applyStrictPolicy(policy) {
        policy.directives.set(CSPDirective.DEFAULT_SRC, [CSPSource.NONE]);
        policy.directives.set(CSPDirective.SCRIPT_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.STYLE_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.IMG_SRC, [CSPSource.SELF, CSPSource.DATA]);
        policy.directives.set(CSPDirective.FONT_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.CONNECT_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.MEDIA_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.OBJECT_SRC, [CSPSource.NONE]);
        policy.directives.set(CSPDirective.FRAME_SRC, [CSPSource.NONE]);
        policy.directives.set(CSPDirective.CHILD_SRC, [CSPSource.NONE]);
        policy.directives.set(CSPDirective.FORM_ACTION, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.FRAME_ANCESTORS, [CSPSource.NONE]);
        policy.directives.set(CSPDirective.BASE_URI, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.UPGRADE_INSECURE_REQUESTS, []);
        policy.directives.set(CSPDirective.BLOCK_ALL_MIXED_CONTENT, []);
    }
    /**
     * Apply secure policy (balanced security and functionality)
     */
    applySecurePolicy(policy) {
        policy.directives.set(CSPDirective.DEFAULT_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.SCRIPT_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.STYLE_SRC, [CSPSource.SELF, CSPSource.UNSAFE_INLINE]);
        policy.directives.set(CSPDirective.IMG_SRC, [CSPSource.SELF, CSPSource.DATA, CSPSource.HTTPS]);
        policy.directives.set(CSPDirective.FONT_SRC, [CSPSource.SELF, CSPSource.HTTPS]);
        policy.directives.set(CSPDirective.CONNECT_SRC, [
            CSPSource.SELF,
            CSPSource.HTTPS,
            CSPSource.SECURE_WEBSOCKET,
        ]);
        policy.directives.set(CSPDirective.MEDIA_SRC, [CSPSource.SELF, CSPSource.HTTPS]);
        policy.directives.set(CSPDirective.OBJECT_SRC, [CSPSource.NONE]);
        policy.directives.set(CSPDirective.FRAME_SRC, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.FORM_ACTION, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.FRAME_ANCESTORS, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.BASE_URI, [CSPSource.SELF]);
        policy.directives.set(CSPDirective.UPGRADE_INSECURE_REQUESTS, []);
    }
    /**
     * Apply permissive policy (minimal restrictions)
     */
    applyPermissivePolicy(policy) {
        policy.directives.set(CSPDirective.DEFAULT_SRC, [
            CSPSource.SELF,
            CSPSource.UNSAFE_INLINE,
            CSPSource.UNSAFE_EVAL,
        ]);
        policy.directives.set(CSPDirective.SCRIPT_SRC, [
            CSPSource.SELF,
            CSPSource.UNSAFE_INLINE,
            CSPSource.UNSAFE_EVAL,
        ]);
        policy.directives.set(CSPDirective.STYLE_SRC, [CSPSource.SELF, CSPSource.UNSAFE_INLINE]);
        policy.directives.set(CSPDirective.IMG_SRC, ['*', CSPSource.DATA, CSPSource.BLOB]);
        policy.directives.set(CSPDirective.FONT_SRC, ['*']);
        policy.directives.set(CSPDirective.CONNECT_SRC, ['*']);
        policy.directives.set(CSPDirective.MEDIA_SRC, ['*']);
        policy.directives.set(CSPDirective.FRAME_SRC, ['*']);
        policy.directives.set(CSPDirective.FORM_ACTION, ['*']);
        policy.directives.set(CSPDirective.BASE_URI, ['*']);
    }
    /**
     * Add allowed domains to policy
     */
    addAllowedDomains(policy, domains) {
        const httpsUrls = domains.map(domain => `https://${domain}`);
        // Add to relevant directives
        const directivesToUpdate = [
            CSPDirective.SCRIPT_SRC,
            CSPDirective.STYLE_SRC,
            CSPDirective.IMG_SRC,
            CSPDirective.FONT_SRC,
            CSPDirective.CONNECT_SRC,
            CSPDirective.MEDIA_SRC,
        ];
        for (const directive of directivesToUpdate) {
            const currentSources = policy.directives.get(directive) || [];
            policy.directives.set(directive, [...currentSources, ...httpsUrls]);
        }
    }
    /**
     * Add nonce to script and style sources
     */
    addNonceToPolicy(policy, nonce) {
        const nonceSource = `'nonce-${nonce}'`;
        // Add nonce to script-src
        const scriptSources = policy.directives.get(CSPDirective.SCRIPT_SRC) || [];
        if (!scriptSources.includes(nonceSource)) {
            policy.directives.set(CSPDirective.SCRIPT_SRC, [...scriptSources, nonceSource]);
        }
        // Add nonce to style-src
        const styleSources = policy.directives.get(CSPDirective.STYLE_SRC) || [];
        if (!styleSources.includes(nonceSource)) {
            policy.directives.set(CSPDirective.STYLE_SRC, [...styleSources, nonceSource]);
        }
    }
    /**
     * Convert policy object to CSP header string
     */
    policyToString(policy) {
        const directives = [];
        for (const [directive, sources] of policy.directives) {
            if (sources.length === 0) {
                directives.push(directive);
            }
            else {
                directives.push(`${directive} ${sources.join(' ')}`);
            }
        }
        return directives.join('; ');
    }
    /**
     * Apply CSP policy to WebContents
     */
    applyCSPPolicy(serviceId, webContents) {
        const policy = this.policies.get(serviceId);
        const config = this.configurations.get(serviceId);
        if (!policy || !config) {
            return;
        }
        const policyString = this.policyToString(policy);
        const headerName = policy.reportOnly
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy';
        // Apply CSP via response headers
        const sessionInstance = webContents.session;
        sessionInstance.webRequest.onHeadersReceived((details, callback) => {
            const responseHeaders = details.responseHeaders || {};
            responseHeaders[headerName] = [policyString];
            // Add CSP reporting endpoint if configured
            if (config.enableReporting && config.reportUri) {
                responseHeaders['Content-Security-Policy'] = [
                    `${policyString}; report-uri ${config.reportUri}`,
                ];
            }
            callback({ responseHeaders });
        });
        this.emit('policy-applied', serviceId, policyString);
    }
    /**
     * Generate cryptographically secure nonce
     */
    generateNonce() {
        const crypto = require('crypto');
        return crypto.randomBytes(16).toString('base64');
    }
    /**
     * Check if configuration requires nonce generation
     */
    requiresNonce(config) {
        return (config.securityLevel === CSPSecurityLevel.STRICT ||
            config.securityLevel === CSPSecurityLevel.SECURE);
    }
    /**
     * Handle CSP violation report
     */
    handleViolationReport(serviceId, report) {
        const violationReport = {
            serviceId,
            timestamp: new Date(),
            documentUri: report['document-uri'] || '',
            referrer: report.referrer || '',
            violatedDirective: report['violated-directive'] || '',
            effectiveDirective: report['effective-directive'] || '',
            originalPolicy: report['original-policy'] || '',
            blockedUri: report['blocked-uri'] || '',
            statusCode: report['status-code'] || 0,
            sourceFile: report['source-file'],
            lineNumber: report['line-number'],
            columnNumber: report['column-number'],
        };
        // Store violation report
        const reports = this.violationReports.get(serviceId) || [];
        reports.push(violationReport);
        // Limit number of stored reports
        if (reports.length > this.MAX_VIOLATION_REPORTS) {
            reports.shift();
        }
        this.violationReports.set(serviceId, reports);
        this.emit('violation-reported', violationReport);
    }
    /**
     * Clean up CSP manager
     */
    destroy() {
        this.browserViews.clear();
        this.configurations.clear();
        this.policies.clear();
        this.violationReports.clear();
        this.nonces.clear();
        this.removeAllListeners();
    }
}
exports.ContentSecurityPolicy = ContentSecurityPolicy;
exports.default = ContentSecurityPolicy;
//# sourceMappingURL=ContentSecurityPolicy.js.map