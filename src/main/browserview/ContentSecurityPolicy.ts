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

import { BrowserView, WebContents } from 'electron';
import { EventEmitter } from 'events';

/**
 * CSP directive types
 */
export enum CSPDirective {
  DEFAULT_SRC = 'default-src',
  SCRIPT_SRC = 'script-src',
  STYLE_SRC = 'style-src',
  IMG_SRC = 'img-src',
  FONT_SRC = 'font-src',
  CONNECT_SRC = 'connect-src',
  MEDIA_SRC = 'media-src',
  OBJECT_SRC = 'object-src',
  FRAME_SRC = 'frame-src',
  CHILD_SRC = 'child-src',
  FORM_ACTION = 'form-action',
  FRAME_ANCESTORS = 'frame-ancestors',
  BASE_URI = 'base-uri',
  UPGRADE_INSECURE_REQUESTS = 'upgrade-insecure-requests',
  BLOCK_ALL_MIXED_CONTENT = 'block-all-mixed-content',
}

/**
 * CSP source keywords
 */
export enum CSPSource {
  SELF = "'self'",
  NONE = "'none'",
  UNSAFE_INLINE = "'unsafe-inline'",
  UNSAFE_EVAL = "'unsafe-eval'",
  STRICT_DYNAMIC = "'strict-dynamic'",
  HTTPS = 'https:',
  DATA = 'data:',
  BLOB = 'blob:',
  WEBSOCKET = 'ws:',
  SECURE_WEBSOCKET = 'wss:',
}

/**
 * CSP security levels
 */
export enum CSPSecurityLevel {
  STRICT = 'strict', // Maximum security, minimal functionality
  SECURE = 'secure', // Balanced security and functionality
  PERMISSIVE = 'permissive', // Minimal restrictions
  CUSTOM = 'custom', // User-defined policy
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
export class ContentSecurityPolicy extends EventEmitter {
  private browserViews: Map<string, BrowserView> = new Map();
  private configurations: Map<string, CSPConfiguration> = new Map();
  private policies: Map<string, CSPPolicy> = new Map();
  private violationReports: Map<string, CSPViolationReport[]> = new Map();
  private nonces: Map<string, string> = new Map();

  private readonly MAX_VIOLATION_REPORTS = 100;

  constructor() {
    super();
  }

  /**
   * Register BrowserView with CSP controls
   */
  public registerBrowserView(
    serviceId: string,
    browserView: BrowserView,
    config: CSPConfiguration
  ): void {
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
  public unregisterBrowserView(serviceId: string): void {
    this.browserViews.delete(serviceId);
    this.configurations.delete(serviceId);
    this.policies.delete(serviceId);
    this.violationReports.delete(serviceId);
    this.nonces.delete(serviceId);
  }

  /**
   * Update CSP configuration for a service
   */
  public updateConfiguration(serviceId: string, config: Partial<CSPConfiguration>): void {
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
  public getCSPPolicy(serviceId: string): string | null {
    const policy = this.policies.get(serviceId);
    if (!policy) {
      return null;
    }

    return this.policyToString(policy);
  }

  /**
   * Get violation reports for a service
   */
  public getViolationReports(serviceId: string): CSPViolationReport[] {
    return this.violationReports.get(serviceId) || [];
  }

  /**
   * Get nonce for a service
   */
  public getNonce(serviceId: string): string | undefined {
    return this.nonces.get(serviceId);
  }

  /**
   * Clear violation reports for a service
   */
  public clearViolationReports(serviceId: string): void {
    this.violationReports.set(serviceId, []);
  }

  /**
   * Create CSP policy based on configuration
   */
  private createCSPPolicy(config: CSPConfiguration): CSPPolicy {
    const nonce = this.nonces.get(config.serviceId);
    const policy: CSPPolicy = {
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
          policy.directives.set(directive as CSPDirective, [...sources]);
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
  private applyStrictPolicy(policy: CSPPolicy): void {
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
  private applySecurePolicy(policy: CSPPolicy): void {
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
  private applyPermissivePolicy(policy: CSPPolicy): void {
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
  private addAllowedDomains(policy: CSPPolicy, domains: string[]): void {
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
  private addNonceToPolicy(policy: CSPPolicy, nonce: string): void {
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
  private policyToString(policy: CSPPolicy): string {
    const directives: string[] = [];

    for (const [directive, sources] of policy.directives) {
      if (sources.length === 0) {
        directives.push(directive);
      } else {
        directives.push(`${directive} ${sources.join(' ')}`);
      }
    }

    return directives.join('; ');
  }

  /**
   * Apply CSP policy to WebContents
   */
  private applyCSPPolicy(serviceId: string, webContents: WebContents): void {
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
  private generateNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  }

  /**
   * Check if configuration requires nonce generation
   */
  private requiresNonce(config: CSPConfiguration): boolean {
    return (
      config.securityLevel === CSPSecurityLevel.STRICT ||
      config.securityLevel === CSPSecurityLevel.SECURE
    );
  }

  /**
   * Handle CSP violation report
   */
  public handleViolationReport(serviceId: string, report: any): void {
    const violationReport: CSPViolationReport = {
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
  public destroy(): void {
    this.browserViews.clear();
    this.configurations.clear();
    this.policies.clear();
    this.violationReports.clear();
    this.nonces.clear();
    this.removeAllListeners();
  }
}

export default ContentSecurityPolicy;
