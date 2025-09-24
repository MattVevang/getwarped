/**
 * UrlValidator - Security checking and malicious URL detection service
 *
 * Validates URLs for security, malicious content, and proper formatting.
 * Includes checks for known malicious domains, suspicious patterns,
 * and security best practices for web service URLs.
 *
 * @fileoverview UrlValidator service for URL security and validation
 */

import { EventEmitter } from 'events';

/**
 * URL validation result
 */
export interface UrlValidationResult {
  /** Whether the URL is valid and safe */
  isValid: boolean;
  /** Whether the URL is considered safe for use */
  isSafe: boolean;
  /** Validation score (0-100, higher is better) */
  score: number;
  /** List of issues found */
  issues: UrlValidationIssue[];
  /** Sanitized/normalized URL */
  sanitizedUrl?: string;
  /** Additional metadata about the URL */
  metadata: UrlMetadata;
}

/**
 * URL validation issue
 */
export interface UrlValidationIssue {
  /** Issue severity level */
  severity: 'error' | 'warning' | 'info';
  /** Issue type/category */
  type: string;
  /** Human-readable issue description */
  message: string;
  /** Suggested fix or mitigation */
  suggestion?: string;
}

/**
 * URL metadata extracted during validation
 */
export interface UrlMetadata {
  /** Protocol (http, https, etc.) */
  protocol: string;
  /** Domain name */
  domain: string;
  /** Port number (if specified) */
  port?: number;
  /** Path portion of URL */
  path: string;
  /** Query parameters */
  queryParams: Record<string, string>;
  /** URL hash/fragment */
  hash: string;
  /** Whether URL uses HTTPS */
  isSecure: boolean;
  /** Whether domain appears to be an IP address */
  isIpAddress: boolean;
  /** Domain reputation score (if available) */
  reputationScore?: number;
}

/**
 * URL validation options
 */
export interface UrlValidationOptions {
  /** Allow HTTP URLs (default: false for security) */
  allowHttp?: boolean;
  /** Allow localhost URLs (default: true for development) */
  allowLocalhost?: boolean;
  /** Allow IP addresses instead of domains */
  allowIpAddresses?: boolean;
  /** Maximum URL length */
  maxLength?: number;
  /** Check against blocklists */
  checkBlocklists?: boolean;
  /** Check for suspicious patterns */
  checkSuspiciousPatterns?: boolean;
  /** Require valid TLD */
  requireValidTld?: boolean;
  /** Custom allowed domains pattern */
  allowedDomainsPattern?: RegExp;
  /** Custom blocked domains pattern */
  blockedDomainsPattern?: RegExp;
}

/**
 * Known malicious domain patterns and indicators
 */
const SECURITY_PATTERNS = {
  // Suspicious TLDs often used for malicious purposes
  suspiciousTlds: [
    '.tk',
    '.ml',
    '.ga',
    '.cf',
    '.gq',
    '.pw',
    '.cc',
    '.click',
    '.download',
    '.stream',
    '.science',
    '.party',
    '.racing',
  ],

  // Phishing indicators
  phishingPatterns: [
    /[a-z]+-[a-z]+-[a-z]+\.(tk|ml|ga|cf|gq)/i, // Common phishing pattern
    /[a-z]+[0-9]+[a-z]+\.(com|net|org)/i, // Mixed alphanumeric suspicious
    /(secure|login|verify|update|confirm)-.*\.(com|net|org)/i, // Security-themed
    /(paypal|amazon|google|microsoft|apple)-.*\.(com|net|org)/i, // Brand impersonation
    /[a-z]+-[a-z]+-[a-z]+-[a-z]+/i, // Multiple hyphens (often suspicious)
  ],

  // URL shortener domains
  urlShorteners: [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    't.co',
    'short.link',
    'ow.ly',
    'buff.ly',
    'is.gd',
    'v.gd',
    'x.co',
    'tiny.cc',
  ],

  // Suspicious path patterns
  suspiciousPaths: [
    /\/[a-f0-9]{32,}/i, // Long hex strings
    /\/[a-zA-Z0-9]{50,}/i, // Very long random strings
    /\/(admin|login|signin|portal).*[0-9]+/i, // Admin paths with numbers
    /\/\?[a-zA-Z0-9=&]{100,}/i, // Very long query strings
  ],

  // Known malicious domains (sample - in production would be much larger)
  knownMaliciousDomains: [
    'malware-example.com',
    'phishing-test.net',
    'suspicious-site.org',
    // Add more known malicious domains
  ],
};

/**
 * Valid top-level domains
 */
const VALID_TLDS = new Set([
  // Generic TLDs
  'com',
  'net',
  'org',
  'edu',
  'gov',
  'mil',
  'int',
  'arpa',
  'aero',
  'asia',
  'biz',
  'cat',
  'coop',
  'info',
  'jobs',
  'mobi',
  'museum',
  'name',
  'post',
  'pro',
  'tel',
  'travel',
  'xxx',
  // New generic TLDs (sample)
  'app',
  'dev',
  'tech',
  'online',
  'site',
  'website',
  'store',
  'blog',
  'news',
  'media',
  'social',
  'email',
  'chat',
  'video',
  // Country code TLDs (sample)
  'us',
  'uk',
  'ca',
  'au',
  'de',
  'fr',
  'jp',
  'cn',
  'ru',
  'br',
  'in',
  'mx',
  'it',
  'es',
  'kr',
  'nl',
  'se',
  'no',
  'dk',
  'fi',
]);

/**
 * URL validator class
 */
export class UrlValidator extends EventEmitter {
  private defaultOptions: UrlValidationOptions;
  private reputationCache: Map<string, number> = new Map();
  private blocklistCache: Map<string, boolean> = new Map();

  constructor(options: Partial<UrlValidationOptions> = {}) {
    super();

    this.defaultOptions = {
      allowHttp: false,
      allowLocalhost: true,
      allowIpAddresses: false,
      maxLength: 2048,
      checkBlocklists: true,
      checkSuspiciousPatterns: true,
      requireValidTld: true,
      ...options,
    } as Required<UrlValidationOptions>;
  }

  /**
   * Validate a URL for security and correctness
   */
  async validateUrl(
    url: string,
    options: Partial<UrlValidationOptions> = {}
  ): Promise<UrlValidationResult> {
    const opts = {
      allowHttp: options.allowHttp ?? this.defaultOptions.allowHttp ?? false,
      allowLocalhost: options.allowLocalhost ?? this.defaultOptions.allowLocalhost ?? true,
      allowIpAddresses: options.allowIpAddresses ?? this.defaultOptions.allowIpAddresses ?? false,
      maxLength: options.maxLength ?? this.defaultOptions.maxLength ?? 2048,
      checkBlocklists: options.checkBlocklists ?? this.defaultOptions.checkBlocklists ?? true,
      checkSuspiciousPatterns:
        options.checkSuspiciousPatterns ?? this.defaultOptions.checkSuspiciousPatterns ?? true,
      requireValidTld: options.requireValidTld ?? this.defaultOptions.requireValidTld ?? true,
      allowedDomainsPattern:
        options.allowedDomainsPattern ?? this.defaultOptions.allowedDomainsPattern,
      blockedDomainsPattern:
        options.blockedDomainsPattern ?? this.defaultOptions.blockedDomainsPattern,
    };

    const issues: UrlValidationIssue[] = [];
    let score = 100;

    try {
      // Basic format validation
      const parsed = new URL(url);
      const metadata = this.extractMetadata(parsed);

      // Length check
      if (url.length > opts.maxLength) {
        issues.push({
          severity: 'error',
          type: 'length',
          message: `URL exceeds maximum length of ${opts.maxLength} characters`,
          suggestion: 'Use a shorter URL or URL shortener',
        });
        score -= 30;
      }

      // Protocol validation
      if (!opts.allowHttp && parsed.protocol === 'http:') {
        issues.push({
          severity: 'warning',
          type: 'protocol',
          message: 'HTTP URLs are not secure, HTTPS recommended',
          suggestion: 'Use HTTPS version of the URL',
        });
        score -= 20;
      }

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        issues.push({
          severity: 'error',
          type: 'protocol',
          message: `Unsupported protocol: ${parsed.protocol}`,
          suggestion: 'Use HTTP or HTTPS URLs only',
        });
        score -= 50;
      }

      // Localhost validation
      if (!opts.allowLocalhost && this.isLocalhost(parsed.hostname)) {
        issues.push({
          severity: 'warning',
          type: 'localhost',
          message: 'Localhost URLs may not work for all users',
          suggestion: 'Use a public domain instead',
        });
        score -= 10;
      }

      // IP address validation
      if (!opts.allowIpAddresses && metadata.isIpAddress) {
        issues.push({
          severity: 'warning',
          type: 'ip_address',
          message: 'IP addresses are less trustworthy than domain names',
          suggestion: 'Use a proper domain name if possible',
        });
        score -= 15;
      }

      // TLD validation
      if (opts.requireValidTld && !this.hasValidTld(parsed.hostname)) {
        issues.push({
          severity: 'error',
          type: 'invalid_tld',
          message: 'URL uses an invalid or suspicious top-level domain',
          suggestion: 'Verify the domain is legitimate',
        });
        score -= 40;
      }

      // Security pattern checks
      if (opts.checkSuspiciousPatterns) {
        const securityIssues = await this.checkSecurityPatterns(parsed, metadata);
        issues.push(...securityIssues);
        score -= securityIssues.length * 15;
      }

      // Blocklist checks
      if (opts.checkBlocklists) {
        const blocklistIssues = await this.checkBlocklists(parsed.hostname);
        issues.push(...blocklistIssues);
        score -= blocklistIssues.filter(i => i.severity === 'error').length * 50;
      }

      // Custom domain pattern checks
      if (opts.allowedDomainsPattern && !opts.allowedDomainsPattern.test(parsed.hostname)) {
        issues.push({
          severity: 'warning',
          type: 'domain_policy',
          message: 'Domain does not match allowed pattern',
          suggestion: 'Verify domain is approved for use',
        });
        score -= 20;
      }

      if (opts.blockedDomainsPattern && opts.blockedDomainsPattern.test(parsed.hostname)) {
        issues.push({
          severity: 'error',
          type: 'domain_policy',
          message: 'Domain matches blocked pattern',
          suggestion: 'Use a different domain',
        });
        score -= 60;
      }

      // Ensure score bounds
      score = Math.max(0, Math.min(100, score));

      const isValid = issues.filter(i => i.severity === 'error').length === 0;
      const isSafe = score >= 50 && !issues.some(i => i.severity === 'error');

      const result: UrlValidationResult = {
        isValid,
        isSafe,
        score,
        issues,
        sanitizedUrl: this.sanitizeUrl(parsed),
        metadata,
      };

      this.emit('url-validated', { url, result });
      return result;
    } catch (error) {
      const result: UrlValidationResult = {
        isValid: false,
        isSafe: false,
        score: 0,
        issues: [
          {
            severity: 'error',
            type: 'format',
            message: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`,
            suggestion: 'Check URL spelling and format',
          },
        ],
        metadata: {
          protocol: '',
          domain: '',
          path: '',
          queryParams: {},
          hash: '',
          isSecure: false,
          isIpAddress: false,
        },
      };

      this.emit('url-validated', { url, result });
      return result;
    }
  }

  /**
   * Extract metadata from parsed URL
   */
  private extractMetadata(parsed: URL): UrlMetadata {
    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    return {
      protocol: parsed.protocol,
      domain: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : undefined,
      path: parsed.pathname,
      queryParams,
      hash: parsed.hash,
      isSecure: parsed.protocol === 'https:',
      isIpAddress: this.isIpAddress(parsed.hostname),
    };
  }

  /**
   * Check if hostname is localhost
   */
  private isLocalhost(hostname: string): boolean {
    return (
      ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname.toLowerCase()) ||
      hostname.endsWith('.local')
    );
  }

  /**
   * Check if hostname is an IP address
   */
  private isIpAddress(hostname: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;

    return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
  }

  /**
   * Check if domain has valid TLD
   */
  private hasValidTld(hostname: string): boolean {
    const parts = hostname.toLowerCase().split('.');
    if (parts.length < 2) return false;

    const tld = parts[parts.length - 1];
    return VALID_TLDS.has(tld) && !SECURITY_PATTERNS.suspiciousTlds.includes(`.${tld}`);
  }

  /**
   * Check URL against security patterns
   */
  private async checkSecurityPatterns(
    parsed: URL,
    metadata: UrlMetadata
  ): Promise<UrlValidationIssue[]> {
    const issues: UrlValidationIssue[] = [];

    // Check suspicious TLDs
    const domain = parsed.hostname.toLowerCase();
    for (const suspiciousTld of SECURITY_PATTERNS.suspiciousTlds) {
      if (domain.endsWith(suspiciousTld)) {
        issues.push({
          severity: 'warning',
          type: 'suspicious_tld',
          message: `Domain uses suspicious TLD: ${suspiciousTld}`,
          suggestion: 'Verify this is a legitimate service',
        });
        break;
      }
    }

    // Check phishing patterns
    for (const pattern of SECURITY_PATTERNS.phishingPatterns) {
      if (pattern.test(domain)) {
        issues.push({
          severity: 'error',
          type: 'phishing_pattern',
          message: 'Domain matches known phishing pattern',
          suggestion: 'Do not use this URL, it may be malicious',
        });
        break;
      }
    }

    // Check URL shorteners
    if (SECURITY_PATTERNS.urlShorteners.includes(domain)) {
      issues.push({
        severity: 'info',
        type: 'url_shortener',
        message: 'URL uses a shortening service',
        suggestion: 'Consider using the full URL for transparency',
      });
    }

    // Check suspicious paths
    const fullPath = parsed.pathname + parsed.search;
    for (const pattern of SECURITY_PATTERNS.suspiciousPaths) {
      if (pattern.test(fullPath)) {
        issues.push({
          severity: 'warning',
          type: 'suspicious_path',
          message: 'URL path contains suspicious patterns',
          suggestion: 'Verify this URL is legitimate',
        });
        break;
      }
    }

    // Check for excessive subdomains
    const subdomainCount = domain.split('.').length - 2;
    if (subdomainCount > 3) {
      issues.push({
        severity: 'warning',
        type: 'excessive_subdomains',
        message: 'URL has unusually many subdomains',
        suggestion: 'Verify this is the official service URL',
      });
    }

    return issues;
  }

  /**
   * Check URL against known blocklists
   */
  private async checkBlocklists(hostname: string): Promise<UrlValidationIssue[]> {
    const issues: UrlValidationIssue[] = [];

    // Check cache first
    if (this.blocklistCache.has(hostname)) {
      if (this.blocklistCache.get(hostname)) {
        issues.push({
          severity: 'error',
          type: 'blocklist',
          message: 'Domain is on known malicious blocklist',
          suggestion: 'Do not use this URL',
        });
      }
      return issues;
    }

    // Check against known malicious domains
    if (SECURITY_PATTERNS.knownMaliciousDomains.includes(hostname.toLowerCase())) {
      issues.push({
        severity: 'error',
        type: 'known_malicious',
        message: 'Domain is known to be malicious',
        suggestion: 'Do not use this URL',
      });

      this.blocklistCache.set(hostname, true);
      return issues;
    }

    // In a real implementation, you would check against:
    // - Google Safe Browsing API
    // - VirusTotal API
    // - Internal/company blocklists
    // - Community-maintained blocklists

    // Cache negative result
    this.blocklistCache.set(hostname, false);
    return issues;
  }

  /**
   * Sanitize and normalize URL
   */
  private sanitizeUrl(parsed: URL): string {
    // Remove unnecessary query parameters
    const cleanedUrl = new URL(parsed.href);

    // Remove tracking parameters (common ones)
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
      'ref',
      'referrer',
      'source',
      'campaign',
    ];

    trackingParams.forEach(param => {
      cleanedUrl.searchParams.delete(param);
    });

    // Normalize case
    cleanedUrl.hostname = cleanedUrl.hostname.toLowerCase();

    return cleanedUrl.href;
  }

  /**
   * Batch validate multiple URLs
   */
  async validateUrls(
    urls: string[],
    options: Partial<UrlValidationOptions> = {}
  ): Promise<Map<string, UrlValidationResult>> {
    const results = new Map<string, UrlValidationResult>();

    const promises = urls.map(async url => {
      const result = await this.validateUrl(url, options);
      results.set(url, result);
      return result;
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get domain reputation score
   */
  async getDomainReputation(domain: string): Promise<number> {
    // Check cache first
    if (this.reputationCache.has(domain)) {
      return this.reputationCache.get(domain)!;
    }

    // Simple reputation scoring based on heuristics
    let score = 50; // Neutral score

    // Positive indicators
    if (domain.endsWith('.edu') || domain.endsWith('.gov')) score += 30;
    if (['google.com', 'microsoft.com', 'apple.com', 'github.com'].includes(domain)) score += 40;

    // Negative indicators
    if (SECURITY_PATTERNS.suspiciousTlds.some(tld => domain.endsWith(tld))) score -= 30;
    if (SECURITY_PATTERNS.knownMaliciousDomains.includes(domain)) score = 0;

    // Ensure bounds
    score = Math.max(0, Math.min(100, score));

    // Cache result
    this.reputationCache.set(domain, score);
    return score;
  }

  /**
   * Check if URL is safe for iframe embedding
   */
  async isSafeForEmbedding(url: string): Promise<boolean> {
    const result = await this.validateUrl(url, {
      allowHttp: false,
      checkBlocklists: true,
      checkSuspiciousPatterns: true,
    });

    // Additional checks for embedding
    if (!result.metadata.isSecure) return false;
    if (result.issues.some(i => i.severity === 'error')) return false;
    if (result.score < 70) return false;

    return true;
  }

  /**
   * Clear reputation cache
   */
  clearCache(): void {
    this.reputationCache.clear();
    this.blocklistCache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    reputationCacheSize: number;
    blocklistCacheSize: number;
  } {
    return {
      reputationCacheSize: this.reputationCache.size,
      blocklistCacheSize: this.blocklistCache.size,
    };
  }
}

/**
 * URL validation utilities
 */
export const UrlValidationUtils = {
  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  },

  /**
   * Check if two URLs are from the same domain
   */
  isSameDomain(url1: string, url2: string): boolean {
    const domain1 = this.extractDomain(url1);
    const domain2 = this.extractDomain(url2);
    return domain1 !== null && domain2 !== null && domain1 === domain2;
  },

  /**
   * Normalize URL for comparison
   */
  normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      parsed.hostname = parsed.hostname.toLowerCase();
      parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
      return parsed.href;
    } catch {
      return url;
    }
  },

  /**
   * Check if URL looks like a service URL
   */
  looksLikeServiceUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Must be HTTPS for services
      if (parsed.protocol !== 'https:') return false;

      // Must have a proper domain
      if (parsed.hostname.split('.').length < 2) return false;

      // Should not be localhost
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return false;

      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Global URL validator instance
 */
export const urlValidator = new UrlValidator({
  allowHttp: false,
  allowLocalhost: true,
  allowIpAddresses: false,
  maxLength: 2048,
  checkBlocklists: true,
  checkSuspiciousPatterns: true,
  requireValidTld: true,
});

export default UrlValidator;
