/**
 * IconManager - Icon caching and fallback system for service icons
 *
 * Handles loading, caching, and fallback behavior for service icons.
 * Supports multiple icon sources (URL, base64, builtin) with intelligent caching
 * and fallback mechanisms for improved reliability and performance.
 *
 * @fileoverview IconManager service for service icon management
 */

import { EventEmitter } from 'events';

/**
 * Icon cache entry with metadata
 */
export interface IconCacheEntry {
  /** Icon data (base64 encoded) */
  data: string;
  /** Content type (e.g., image/png, image/jpeg) */
  contentType: string;
  /** Cache timestamp */
  cachedAt: Date;
  /** Original source URL */
  sourceUrl: string;
  /** Icon size in bytes */
  size: number;
  /** Whether icon was fetched successfully */
  isValid: boolean;
}

/**
 * Icon metadata for validation and processing
 */
export interface IconMetadata {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** File format (png, jpg, svg, etc.) */
  format: string;
  /** File size in bytes */
  size: number;
  /** Whether icon is animated */
  isAnimated: boolean;
}

/**
 * Icon loading options
 */
export interface IconLoadOptions {
  /** Timeout for icon loading in milliseconds */
  timeout?: number;
  /** Maximum icon size in bytes */
  maxSize?: number;
  /** Preferred icon size in pixels */
  preferredSize?: number;
  /** Whether to use cache */
  useCache?: boolean;
  /** Fallback icon to use if loading fails */
  fallback?: string;
}

/**
 * Built-in service icons mapping
 */
export const BuiltinIcons = {
  // Service icons
  gmail:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDRINEMyLjkgNCAyIDQuOSAyIDZWMThDMiAxOS4xIDIuOSAyMCA0IDIwSDIwQzIxLjEgMjAgMjIgMTkuMSAyMiAxOFY2QzIyIDQuOSAyMS4xIDQgMjAgNFoiIGZpbGw9IiNFQTQzMzUiLz4KPHBhdGggZD0iTTIwIDZMMTIgMTNMNCA2SDE2VjE4SDIwVjZaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
  slack:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNSIgZmlsbD0iIzRBMTU0QiIvPgo8cGF0aCBkPSJNOSA3SDEyVjEwSDlWN1oiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTE0IDlIMTdWMTJIMTRWOVoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTkgMTVIMTJWMThIOVYxNVoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTcgMTNIMTBWMTZIN1YxM1oiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==',
  github:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40NzcgMiAyIDYuNDg0IDIgMTIuMDE3QzIgMTYuNjI0IDQuODY1IDE5LjU4MiA4LjgzOCAyMS4wNzFDOS4yMzggMjEuMTQ2IDkuMzc0IDIwLjg5MyA5LjM3NCAyMC42NzZDOS4zNzQgMjAuNDc5IDkuMzY3IDIwIDkuMzU5IDE5LjMxNUMxMC4wNTMgMTkuNDc2IDEwLjM0MiAxOC45NzMgMTAuMzQyIDE4Ljk3M1MxMC45NzMgMTcuNTE4IDExLjcxNiAxNi41NDhDMTEuNzE2IDE2LjU0OCAxMi45NzQgMTcuMTMzIDEzLjUzNiAxNy4zODNDMTUuNjI0IDE2Ljc2NSAxNy40NzYgMTUuNTc5IDE3LjQ3NiAxMC45NjNDMTcuNDc2IDkuNzYxIDE3LjAzIDguODExIDE2LjQ0MSA4LjI5OUMxNi4zNDIgOC4wNyAxNy4wMiA2LjY5NSAxNy4wMiA2LjY5NVMxNi40NzMgNi4yNzUgMTQuNjk5IDcuMzA5TDE0LjY5OSA3LjMwOUMxMy45MzQgNy4xMDggMTIuOTY5IDcuMDExIDEyLjAxIDcuMDExUzEwLjE3IDcuMTA4IDkuMzI0IDcuMzA5TDkuMzI0IDcuMzA5UzguMDQzIDYuMzA4IDguMDQzIDYuNjk1QzguMDQzIDYuNjk1IDguNTE3IDguMDY3IDguNDI0IDguMjk3QzcuODg2IDguNzI5IDcuNDQ2IDkuNzEgNy40NDYgMTAuOTNDNy40NDYgMTUuNTMzIDkuNzYzIDE2LjgxMSAxMS43MjQgMTcuMzMxVjE3LjMzMVYxOS45OTFDOS4zNDggMTguNzkzIDEwIDEwLjcgMTAgOC44OTNDMTAgNC45MTggNy4yOTcgMS45OTYgMy43NzQgMS45OTZTLTIuNDUyIDQuOTEyIC0yLjQ1MiA4Ljg4N0MtMi40NTIgMTMuNDAxIC0wLjE2NSAxNy4yNzYgNC44NDIgMTkuMDM2UTMuNTQzIDE3LjY5NyAzLjU0MyAxNi4yNTVDMy41NDMgMTYuMDM3IDMuNjc1IDE1LjU2NyA0LjA3OCAxNS40ODZDMTEuNzE2IDEzLjU2MyAxMi45NzQgMTcuMzM0IDEzLjUzNiAxNy41ODNDMTUuNjI0IDE2Ljk2MyAyMiAxNS43NjYgMjIgMTEuOTE0VjExLjkxNFY5Ljk5M1YxMy40NzlaIiBmaWxsPSIjMTgxNzE3Ii8+Cjwvc3ZnPgo=',
  discord:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNSIgZmlsbD0iIzU4NjVGMiIvPgo8cGF0aCBkPSJNMTAuNDUgOEExLjQzIDEuNDMgMCAwIDAgOSA5LjQzVjE1SDEwLjU3VjEyLjgzSDEyLjA3VjExLjQ1SDEwLjU3VjkuODNIMTMuNzNWOEgxMC40NVoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTE1LjI3IDEwLjc5QzE0Ljg1IDEwLjU4IDE0LjQxIDEwLjQ1IDE0IDEwLjQ1VjEzQzE0IDEzLjU1IDE0LjQ1IDE0IDE1IDE0SDEyLjc3VjEySDEwVjExSDE2VjEzQzE2IDE0LjY2IDE0LjY2IDE2IDEzIDE2SDlWOEgxM0MxNC42NiA4IDE2IDkuMzQgMTYgMTFWMTNMMTUuMjcgMTAuNzlaIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo=',
  default:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzM3ODBGNiIvPgo8cGF0aCBkPSJNOSA5SDExVjE1SDlWOVoiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTEzIDlIMTVWMTVIMTNWOVoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==',
  loading:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNMTIgNkMxMC4zNSA2IDkgNy4zNSA5IDlDOSAxMC42NSAxMC4zNSAxMiAxMiAxMkMxMy42NSAxMiAxNSAxMC42NSAxNSA5QzE1IDcuMzUgMTMuNjUgNiAxMiA2Wk0xMiA4LjVDMTIuODMgOC41IDEzLjUgOS4xNyAxMy41IDEwQzEzLjUgMTAuODMgMTIuODMgMTEuNSAxMiAxMS41QzExLjE3IDExLjUgMTAuNSAxMC44MyAxMC41IDEwQzEwLjUgOS4xNyAxMS4xNyA4LjUgMTIgOC41WiIgZmlsbD0iI0JEQkRCRCIvPgo8L3N2Zz4K',
  error:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0Y1MzIzMiIvPgo8cGF0aCBkPSJNMTAgMTBMMTQgMTQiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTE0IDEwTDEwIDE0IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=',
} as const;

/**
 * Icon manager class for handling service icons with caching and fallback
 */
export class IconManager extends EventEmitter {
  private cache: Map<string, IconCacheEntry> = new Map();
  private loadingPromises: Map<string, Promise<IconCacheEntry>> = new Map();
  private maxCacheSize: number;
  private cacheTimeout: number;
  private defaultOptions: Required<IconLoadOptions>;

  constructor(
    options: {
      maxCacheSize?: number;
      cacheTimeout?: number;
      defaultTimeout?: number;
      defaultMaxSize?: number;
    } = {}
  ) {
    super();

    this.maxCacheSize = options.maxCacheSize ?? 100;
    this.cacheTimeout = options.cacheTimeout ?? 24 * 60 * 60 * 1000; // 24 hours
    this.defaultOptions = {
      timeout: options.defaultTimeout ?? 10000,
      maxSize: options.defaultMaxSize ?? 1024 * 1024, // 1MB
      preferredSize: 64,
      useCache: true,
      fallback: 'default',
    };

    // Clean expired cache entries periodically
    setInterval(() => this.cleanExpiredCache(), 60000); // Every minute
  }

  /**
   * Load an icon with caching and fallback support
   */
  async loadIcon(iconSource: string, options: Partial<IconLoadOptions> = {}): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.getCacheKey(iconSource, opts);

    // Return cached icon if available and valid
    if (opts.useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (this.isCacheEntryValid(cached)) {
        this.emit('icon-loaded', { source: iconSource, fromCache: true });
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      const cached = await this.loadingPromises.get(cacheKey)!;
      return cached.data;
    }

    // Start loading
    const loadingPromise = this.loadIconInternal(iconSource, opts);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const cached = await loadingPromise;

      // Cache if enabled and valid
      if (opts.useCache && cached.isValid) {
        this.addToCache(cacheKey, cached);
      }

      this.emit('icon-loaded', {
        source: iconSource,
        fromCache: false,
        success: cached.isValid,
      });

      return cached.data;
    } catch (error) {
      this.emit('icon-error', { source: iconSource, error });

      // Return fallback icon
      return this.getFallbackIcon(opts.fallback);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Internal icon loading logic
   */
  private async loadIconInternal(
    iconSource: string,
    options: Required<IconLoadOptions>
  ): Promise<IconCacheEntry> {
    // Handle built-in icons
    if (iconSource in BuiltinIcons) {
      return {
        data: BuiltinIcons[iconSource as keyof typeof BuiltinIcons],
        contentType: 'image/svg+xml',
        cachedAt: new Date(),
        sourceUrl: iconSource,
        size: 0,
        isValid: true,
      };
    }

    // Handle base64 data URIs
    if (iconSource.startsWith('data:')) {
      return this.processDataUri(iconSource);
    }

    // Handle URL loading
    return this.loadFromUrl(iconSource, options);
  }

  /**
   * Process base64 data URI
   */
  private processDataUri(dataUri: string): IconCacheEntry {
    try {
      const [header, data] = dataUri.split(',');
      const contentType = header.match(/data:([^;]+)/)?.[1] || 'image/png';

      return {
        data: dataUri,
        contentType,
        cachedAt: new Date(),
        sourceUrl: dataUri,
        size: data.length,
        isValid: true,
      };
    } catch (error) {
      throw new Error(
        `Invalid data URI: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load icon from URL
   */
  private async loadFromUrl(
    url: string,
    options: Required<IconLoadOptions>
  ): Promise<IconCacheEntry> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeoutId = setTimeout(() => {
        img.onload = null;
        img.onerror = null;
        reject(new Error(`Icon loading timeout: ${url}`));
      }, options.timeout);

      img.onload = async () => {
        clearTimeout(timeoutId);

        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Resize if needed
          const targetSize = Math.min(options.preferredSize, Math.max(img.width, img.height));

          canvas.width = targetSize;
          canvas.height = targetSize;

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, targetSize, targetSize);

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png');
          const size = Math.round(dataUrl.length * 0.75); // Approximate size

          // Check size limit
          if (size > options.maxSize) {
            throw new Error(`Icon too large: ${size} bytes (max: ${options.maxSize})`);
          }

          resolve({
            data: dataUrl,
            contentType: 'image/png',
            cachedAt: new Date(),
            sourceUrl: url,
            size,
            isValid: true,
          });
        } catch (error) {
          reject(
            new Error(
              `Icon processing failed: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load icon: ${url}`));
      };

      // Start loading
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  /**
   * Get fallback icon
   */
  private getFallbackIcon(fallback: string): string {
    if (fallback in BuiltinIcons) {
      return BuiltinIcons[fallback as keyof typeof BuiltinIcons];
    }
    return BuiltinIcons.default;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(source: string, options: Required<IconLoadOptions>): string {
    return `${source}:${options.preferredSize}:${options.maxSize}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheEntryValid(entry: IconCacheEntry): boolean {
    const age = Date.now() - entry.cachedAt.getTime();
    return age < this.cacheTimeout && entry.isValid;
  }

  /**
   * Add entry to cache with size management
   */
  private addToCache(key: string, entry: IconCacheEntry): void {
    // Remove oldest entries if cache is full
    while (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      } else {
        break; // Safety check
      }
    }

    this.cache.set(key, entry);
    this.emit('cache-updated', { key, size: this.cache.size });
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.cachedAt.getTime() > this.cacheTimeout) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.emit('cache-cleaned', { removedCount, currentSize: this.cache.size });
    }
  }

  /**
   * Get icon metadata (if available)
   */
  async getIconMetadata(source: string): Promise<IconMetadata | null> {
    try {
      const icon = await this.loadIcon(source, { useCache: false });
      return await this.extractMetadata(icon);
    } catch {
      return null;
    }
  }

  /**
   * Extract metadata from icon data
   */
  private async extractMetadata(iconData: string): Promise<IconMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          format: this.getFormatFromDataUrl(iconData),
          size: Math.round(iconData.length * 0.75),
          isAnimated: false, // Simple check - could be enhanced
        });
      };

      img.onerror = () => reject(new Error('Failed to extract metadata'));
      img.src = iconData;
    });
  }

  /**
   * Get format from data URL
   */
  private getFormatFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/data:image\/([^;]+)/);
    return match?.[1] || 'unknown';
  }

  /**
   * Preload icons for services
   */
  async preloadIcons(sources: string[], options?: Partial<IconLoadOptions>): Promise<void> {
    const promises = sources.map(source => this.loadIcon(source, options).catch(() => null));

    await Promise.all(promises);
    this.emit('preload-completed', { count: sources.length });
  }

  /**
   * Clear all cached icons
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
    maxSize: number;
    hitRate: number;
    totalSize: number;
  } {
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      totalSize,
    };
  }

  /**
   * Check if icon source is valid URL
   */
  static isValidIconUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Check if icon source is builtin
   */
  static isBuiltinIcon(source: string): boolean {
    return source in BuiltinIcons;
  }

  /**
   * Check if icon source is data URI
   */
  static isDataUri(source: string): boolean {
    return source.startsWith('data:image/');
  }

  /**
   * Get available builtin icons
   */
  static getBuiltinIcons(): string[] {
    return Object.keys(BuiltinIcons);
  }
}

/**
 * Global icon manager instance
 */
export const iconManager = new IconManager({
  maxCacheSize: 200,
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  defaultTimeout: 15000,
  defaultMaxSize: 2 * 1024 * 1024, // 2MB
});

/**
 * Icon utilities for common operations
 */
export const IconUtils = {
  /**
   * Load icon with retry logic
   */
  async loadWithRetry(
    source: string,
    options: Partial<IconLoadOptions> = {},
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await iconManager.loadIcon(source, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Validate icon source
   */
  validateIconSource(source: string): { isValid: boolean; type: string; reason?: string } {
    if (!source) {
      return { isValid: false, type: 'empty', reason: 'Icon source is empty' };
    }

    if (IconManager.isBuiltinIcon(source)) {
      return { isValid: true, type: 'builtin' };
    }

    if (IconManager.isDataUri(source)) {
      return { isValid: true, type: 'datauri' };
    }

    if (IconManager.isValidIconUrl(source)) {
      return { isValid: true, type: 'url' };
    }

    return { isValid: false, type: 'unknown', reason: 'Invalid icon source format' };
  },

  /**
   * Get icon source priority (for fallback chain)
   */
  getIconPriority(source: string): number {
    if (IconManager.isBuiltinIcon(source)) return 1; // Highest priority
    if (IconManager.isDataUri(source)) return 2;
    if (IconManager.isValidIconUrl(source)) return 3;
    return 4; // Lowest priority
  },

  /**
   * Create favicon URL from service URL
   */
  createFaviconUrl(serviceUrl: string): string {
    try {
      const url = new URL(serviceUrl);
      return `${url.origin}/favicon.ico`;
    } catch {
      return '';
    }
  },
};

export default IconManager;
