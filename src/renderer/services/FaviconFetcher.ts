/**
 * FaviconFetcher - Error handling and fallback icon system for services
 *
 * Automatically fetches and manages favicons for web services with intelligent
 * fallback mechanisms, caching, and error handling. Integrates with IconManager
 * for comprehensive icon management solution.
 *
 * @fileoverview FaviconFetcher service for automatic favicon retrieval
 */

import { EventEmitter } from 'events';
import { iconManager, IconUtils, BuiltinIcons } from './IconManager';

/**
 * Favicon fetch result
 */
export interface FaviconResult {
  /** Whether favicon was successfully fetched */
  success: boolean;
  /** Final icon data (data URL) */
  iconData: string;
  /** Source URL where icon was found */
  sourceUrl: string;
  /** Icon size information */
  size: { width: number; height: number };
  /** Content type of the icon */
  contentType: string;
  /** Whether result came from cache */
  fromCache: boolean;
  /** Error message if fetch failed */
  error?: string;
}

/**
 * Favicon fetch options
 */
export interface FaviconFetchOptions {
  /** Timeout for fetch operations in milliseconds */
  timeout?: number;
  /** Preferred icon size */
  preferredSize?: number;
  /** Maximum icon file size in bytes */
  maxFileSize?: number;
  /** Whether to use cache */
  useCache?: boolean;
  /** Custom User-Agent string */
  userAgent?: string;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Fallback icon if all sources fail */
  fallbackIcon?: string;
}

/**
 * Favicon source with priority
 */
interface FaviconSource {
  /** URL to try fetching from */
  url: string;
  /** Priority (lower = higher priority) */
  priority: number;
  /** Source type for logging */
  type: string;
}

/**
 * Common favicon paths to try
 */
const FAVICON_PATHS = [
  '/favicon.ico',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

/**
 * Common favicon sizes to look for in link tags
 */
const PREFERRED_SIZES = [
  { size: '192x192', priority: 1 },
  { size: '180x180', priority: 2 },
  { size: '152x152', priority: 3 },
  { size: '144x144', priority: 4 },
  { size: '120x120', priority: 5 },
  { size: '114x114', priority: 6 },
  { size: '96x96', priority: 7 },
  { size: '72x72', priority: 8 },
  { size: '64x64', priority: 9 },
  { size: '57x57', priority: 10 },
  { size: '32x32', priority: 11 },
  { size: '16x16', priority: 12 },
];

/**
 * FaviconFetcher class for automatic favicon retrieval
 */
export class FaviconFetcher extends EventEmitter {
  private cache: Map<string, FaviconResult> = new Map();
  private fetchPromises: Map<string, Promise<FaviconResult>> = new Map();
  private defaultOptions: Required<FaviconFetchOptions>;

  constructor(options: Partial<FaviconFetchOptions> = {}) {
    super();

    this.defaultOptions = {
      timeout: 10000,
      preferredSize: 192,
      maxFileSize: 1024 * 1024, // 1MB
      useCache: true,
      userAgent: 'GetWarped/1.0.0 (Favicon Fetcher)',
      maxRetries: 2,
      fallbackIcon: 'default',
    } as Required<FaviconFetchOptions>;

    // Apply user options
    Object.assign(this.defaultOptions, options);
  }

  /**
   * Fetch favicon for a service URL
   */
  async fetchFavicon(
    serviceUrl: string,
    options: Partial<FaviconFetchOptions> = {}
  ): Promise<FaviconResult> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = `${serviceUrl}:${opts.preferredSize}`;

    // Return cached result if available and valid
    if (opts.useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.emit('favicon-fetched', { serviceUrl, result: cached });
      return cached;
    }

    // Check if already fetching
    if (this.fetchPromises.has(cacheKey)) {
      return await this.fetchPromises.get(cacheKey)!;
    }

    // Start fetching
    const fetchPromise = this.fetchFaviconInternal(serviceUrl, opts);
    this.fetchPromises.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;

      // Cache successful results
      if (opts.useCache && result.success) {
        this.cache.set(cacheKey, result);
      }

      this.emit('favicon-fetched', { serviceUrl, result });
      return result;
    } finally {
      this.fetchPromises.delete(cacheKey);
    }
  }

  /**
   * Internal favicon fetching logic
   */
  private async fetchFaviconInternal(
    serviceUrl: string,
    options: Required<FaviconFetchOptions>
  ): Promise<FaviconResult> {
    try {
      const baseUrl = new URL(serviceUrl);
      const sources = await this.generateFaviconSources(baseUrl, options);

      // Try each source in priority order
      for (const source of sources) {
        try {
          const result = await this.tryFetchFromSource(source, options);
          if (result.success) {
            return result;
          }
        } catch (error) {
          // Log but continue to next source
          this.emit('fetch-error', { source: source.url, error });
        }
      }

      // All sources failed, return fallback
      return this.createFallbackResult(serviceUrl, options);
    } catch (error) {
      return this.createErrorResult(serviceUrl, error, options);
    }
  }

  /**
   * Generate prioritized list of favicon sources to try
   */
  private async generateFaviconSources(
    baseUrl: URL,
    options: Required<FaviconFetchOptions>
  ): Promise<FaviconSource[]> {
    const sources: FaviconSource[] = [];

    try {
      // First, try to parse HTML for link tags
      const htmlSources = await this.parseHtmlForFavicons(baseUrl, options);
      sources.push(...htmlSources);
    } catch (error) {
      // HTML parsing failed, continue with fallback methods
      this.emit('parse-error', { baseUrl: baseUrl.href, error });
    }

    // Add common favicon paths as fallback
    FAVICON_PATHS.forEach((path, index) => {
      sources.push({
        url: `${baseUrl.origin}${path}`,
        priority: 100 + index, // Lower priority than HTML sources
        type: 'common-path',
      });
    });

    // Sort by priority (lower number = higher priority)
    return sources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Parse HTML page for favicon link tags
   */
  private async parseHtmlForFavicons(
    baseUrl: URL,
    options: Required<FaviconFetchOptions>
  ): Promise<FaviconSource[]> {
    const sources: FaviconSource[] = [];

    try {
      // Fetch HTML content
      const response = await fetch(baseUrl.href, {
        method: 'GET',
        headers: {
          'User-Agent': options.userAgent,
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(options.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse link tags for icons
      const linkRegex =
        /<link[^>]*(?:rel=["'](?:icon|shortcut icon|apple-touch-icon|apple-touch-icon-precomposed)["'])[^>]*>/gi;
      const matches = html.match(linkRegex) || [];

      for (const match of matches) {
        const source = this.parseLinkTag(match, baseUrl);
        if (source) {
          sources.push(source);
        }
      }

      // Also look for manifest.json for PWA icons
      const manifestMatch = html.match(/<link[^>]*rel=["']manifest["'][^>]*>/i);
      if (manifestMatch) {
        const manifestSource = await this.parseManifestForIcons(manifestMatch[0], baseUrl);
        if (manifestSource.length > 0) {
          sources.push(...manifestSource);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to parse HTML: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    return sources;
  }

  /**
   * Parse individual link tag for favicon information
   */
  private parseLinkTag(linkTag: string, baseUrl: URL): FaviconSource | null {
    try {
      // Extract href
      const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) return null;

      let iconUrl = hrefMatch[1];

      // Convert relative URLs to absolute
      if (!iconUrl.startsWith('http')) {
        iconUrl = new URL(iconUrl, baseUrl.href).href;
      }

      // Extract sizes for priority calculation
      const sizesMatch = linkTag.match(/sizes=["']([^"']+)["']/i);
      const sizes = sizesMatch ? sizesMatch[1] : '';

      // Calculate priority based on size preference
      let priority = 50; // Default priority

      if (sizes) {
        const sizeEntry = PREFERRED_SIZES.find(s => sizes.includes(s.size));
        if (sizeEntry) {
          priority = sizeEntry.priority;
        }
      }

      // Boost priority for specific icon types
      if (linkTag.includes('apple-touch-icon')) priority -= 5;
      if (linkTag.includes('android-chrome')) priority -= 3;

      return {
        url: iconUrl,
        priority,
        type: 'html-link',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse PWA manifest for icon information
   */
  private async parseManifestForIcons(manifestTag: string, baseUrl: URL): Promise<FaviconSource[]> {
    try {
      const hrefMatch = manifestTag.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) return [];

      const manifestUrl = new URL(hrefMatch[1], baseUrl.href).href;

      const response = await fetch(manifestUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];

      const manifest = await response.json();
      const sources: FaviconSource[] = [];

      if (manifest.icons && Array.isArray(manifest.icons)) {
        manifest.icons.forEach((icon: any, index: number) => {
          if (icon.src) {
            const iconUrl = new URL(icon.src, baseUrl.href).href;
            const sizes = icon.sizes || '';

            // Calculate priority
            let priority = 20 + index; // Higher priority than common paths
            const sizeEntry = PREFERRED_SIZES.find(s => sizes.includes(s.size));
            if (sizeEntry) {
              priority = sizeEntry.priority - 10; // Boost manifest icons
            }

            sources.push({
              url: iconUrl,
              priority,
              type: 'manifest',
            });
          }
        });
      }

      return sources;
    } catch (error) {
      return [];
    }
  }

  /**
   * Try to fetch favicon from a specific source
   */
  private async tryFetchFromSource(
    source: FaviconSource,
    options: Required<FaviconFetchOptions>
  ): Promise<FaviconResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        // Use IconManager for actual fetching and caching
        const iconData = await iconManager.loadIcon(source.url, {
          timeout: options.timeout,
          maxSize: options.maxFileSize,
          preferredSize: options.preferredSize,
          useCache: options.useCache,
        });

        // Get metadata if possible
        const metadata = await iconManager.getIconMetadata(source.url);

        return {
          success: true,
          iconData,
          sourceUrl: source.url,
          size: {
            width: metadata?.width || options.preferredSize,
            height: metadata?.height || options.preferredSize,
          },
          contentType: metadata?.format || 'image/png',
          fromCache: false, // IconManager will handle cache detection
          error: undefined,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Wait before retry (exponential backoff)
        if (attempt < options.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Unknown error');
  }

  /**
   * Create fallback result when all sources fail
   */
  private createFallbackResult(
    serviceUrl: string,
    options: Required<FaviconFetchOptions>
  ): FaviconResult {
    const fallbackIcon = IconUtils.validateIconSource(options.fallbackIcon).isValid
      ? options.fallbackIcon
      : 'default';

    // Use appropriate builtin icon
    let iconData = '';
    if (fallbackIcon in BuiltinIcons) {
      iconData = BuiltinIcons[fallbackIcon as keyof typeof BuiltinIcons];
    } else if (BuiltinIcons.default) {
      iconData = BuiltinIcons.default;
    }

    return {
      success: false,
      iconData,
      sourceUrl: 'fallback',
      size: { width: options.preferredSize, height: options.preferredSize },
      contentType: 'image/svg+xml',
      fromCache: false,
      error: 'All favicon sources failed, using fallback',
    };
  }

  /**
   * Create error result for unexpected failures
   */
  private createErrorResult(
    serviceUrl: string,
    error: unknown,
    options: Required<FaviconFetchOptions>
  ): FaviconResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      iconData: '', // Will be populated with fallback icon
      sourceUrl: 'error',
      size: { width: options.preferredSize, height: options.preferredSize },
      contentType: 'image/svg+xml',
      fromCache: false,
      error: `Favicon fetch failed: ${errorMessage}`,
    };
  }

  /**
   * Batch fetch favicons for multiple services
   */
  async fetchMultipleFavicons(
    serviceUrls: string[],
    options: Partial<FaviconFetchOptions> = {}
  ): Promise<Map<string, FaviconResult>> {
    const results = new Map<string, FaviconResult>();

    const promises = serviceUrls.map(async url => {
      const result = await this.fetchFavicon(url, options);
      results.set(url, result);
      return result;
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Preload favicons for services (fire-and-forget)
   */
  preloadFavicons(serviceUrls: string[], options?: Partial<FaviconFetchOptions>): void {
    serviceUrls.forEach(url => {
      this.fetchFavicon(url, options).catch(error => {
        this.emit('preload-error', { url, error });
      });
    });
  }

  /**
   * Clear favicon cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cache-cleared', { previousSize: size });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    urls: string[];
    totalDataSize: number;
  } {
    const urls = Array.from(this.cache.keys());
    const totalDataSize = Array.from(this.cache.values()).reduce(
      (sum, result) => sum + (result.iconData.length || 0),
      0
    );

    return {
      size: this.cache.size,
      urls,
      totalDataSize,
    };
  }

  /**
   * Update favicon for a service (force refresh)
   */
  async updateFavicon(
    serviceUrl: string,
    options?: Partial<FaviconFetchOptions>
  ): Promise<FaviconResult> {
    // Clear from cache to force refresh
    const cacheKey = `${serviceUrl}:${options?.preferredSize || this.defaultOptions.preferredSize}`;
    this.cache.delete(cacheKey);

    // Fetch fresh
    return this.fetchFavicon(serviceUrl, { ...options, useCache: false });
  }

  /**
   * Check if favicon exists in cache
   */
  hasCachedFavicon(serviceUrl: string, preferredSize?: number): boolean {
    const cacheKey = `${serviceUrl}:${preferredSize || this.defaultOptions.preferredSize}`;
    return this.cache.has(cacheKey);
  }
}

/**
 * Favicon utilities
 */
export const FaviconUtils = {
  /**
   * Extract base domain for favicon fetching
   */
  getBaseDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return url;
    }
  },

  /**
   * Validate favicon URL format
   */
  isValidFaviconUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const validExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg'];
      const hasValidExtension = validExtensions.some(ext =>
        parsed.pathname.toLowerCase().endsWith(ext)
      );

      return (
        ['http:', 'https:'].includes(parsed.protocol) &&
        (hasValidExtension || parsed.pathname === '/favicon.ico')
      );
    } catch {
      return false;
    }
  },

  /**
   * Generate common favicon URLs for a domain
   */
  generateCommonFaviconUrls(baseUrl: string): string[] {
    try {
      const parsed = new URL(baseUrl);
      const origin = parsed.origin;

      return FAVICON_PATHS.map(path => `${origin}${path}`);
    } catch {
      return [];
    }
  },

  /**
   * Estimate favicon file size from data URL
   */
  estimateDataUrlSize(dataUrl: string): number {
    if (!dataUrl.startsWith('data:')) return 0;

    const base64Data = dataUrl.split(',')[1];
    return base64Data ? Math.round(base64Data.length * 0.75) : 0;
  },
};

/**
 * Global favicon fetcher instance
 */
export const faviconFetcher = new FaviconFetcher({
  timeout: 15000,
  preferredSize: 192,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  useCache: true,
  maxRetries: 2,
  fallbackIcon: 'default',
});

export default FaviconFetcher;
