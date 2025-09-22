/**
 * ServiceConfiguration: Core interface for individual service definitions
 *
 * Represents an individual online service configuration within a workspace.
 * Used throughout the application for service management, UI rendering, and persistence.
 *
 * @fileoverview ServiceConfiguration and related theme interfaces
 */

/**
 * Service-specific theming configuration
 * Allows customization of colors and appearance for individual services
 */
export interface ServiceTheme {
  /** Custom primary color (hex, rgb, or named color) */
  primaryColor?: string;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom CSS styles */
  customCSS?: string;
}

/**
 * Individual online service configuration
 *
 * This is the core entity representing a configured service (like Gmail, Slack, etc.)
 * within a workspace. Contains all necessary information for service rendering,
 * authentication, and user preferences.
 *
 * @example
 * ```typescript
 * const gmailService: ServiceConfiguration = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'Gmail',
 *   url: 'https://mail.google.com',
 *   iconType: 'builtin',
 *   workspaceId: 'work-workspace-id',
 *   position: 0,
 *   notifications: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   blockAds: true,
 *   blockTrackers: true
 * };
 * ```
 */
export interface ServiceConfiguration {
  /** Unique identifier (UUID) */
  id: string;

  /** Display name (e.g., "Gmail", "GitHub") */
  name: string;

  /** Service URL (https://mail.google.com) */
  url: string;

  /** Icon URL or base64 data (optional) */
  icon?: string;

  /** Icon source type - determines how to interpret the icon field */
  iconType: 'url' | 'base64' | 'builtin';

  /** Parent workspace reference (UUID) */
  workspaceId: string;

  /** Optional service category */
  category?: string;

  /** Optional service description */
  description?: string;

  /** Display order within workspace (0-based, lower = higher priority) */
  position?: number;

  /** Sort order for services within workspace */
  sortOrder: number;

  /** Service-specific theming configuration */
  theme?: ServiceTheme;

  /** Enable/disable notifications for this service */
  notifications?: boolean;

  /** Whether the service is currently active/enabled */
  isActive: boolean;

  /** Creation timestamp */
  createdAt: Date | string;

  /** Last modification timestamp */
  updatedAt: Date | string;

  /** Optional custom user agent for service requests */
  customUserAgent?: string;

  /** Ad blocking preference for this service */
  blockAds?: boolean;

  /** Tracker blocking preference for this service */
  blockTrackers?: boolean;
}

/**
 * Type guard to check if an object is a valid ServiceConfiguration
 * Useful for runtime type checking, especially during import/deserialization
 *
 * @param obj - Object to validate
 * @returns True if object matches ServiceConfiguration interface
 */
export function isServiceConfiguration(obj: unknown): obj is ServiceConfiguration {
  if (!obj || typeof obj !== 'object') return false;

  const service = obj as Partial<ServiceConfiguration>;

  return (
    typeof service.id === 'string' &&
    typeof service.name === 'string' &&
    typeof service.url === 'string' &&
    ['url', 'base64', 'builtin'].includes(service.iconType as string) &&
    typeof service.workspaceId === 'string' &&
    typeof service.position === 'number' &&
    typeof service.notifications === 'boolean' &&
    service.createdAt instanceof Date &&
    service.updatedAt instanceof Date &&
    typeof service.blockAds === 'boolean' &&
    typeof service.blockTrackers === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid ServiceTheme
 *
 * @param obj - Object to validate
 * @returns True if object matches ServiceTheme interface
 */
export function isServiceTheme(obj: unknown): obj is ServiceTheme {
  if (!obj || typeof obj !== 'object') return false;

  const theme = obj as Partial<ServiceTheme>;

  return (
    (theme.primaryColor === undefined || typeof theme.primaryColor === 'string') &&
    (theme.backgroundColor === undefined || typeof theme.backgroundColor === 'string') &&
    (theme.textColor === undefined || typeof theme.textColor === 'string')
  );
}

/**
 * Default theme configuration for services
 * Used as fallback when no custom theme is specified
 */
export const DEFAULT_SERVICE_THEME: ServiceTheme = {
  primaryColor: '#3B82F6', // Blue-500
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937', // Gray-800
};

/**
 * Creates a new ServiceConfiguration with default values
 * Useful for service creation forms and templates
 *
 * @param partial - Partial service configuration
 * @returns Complete ServiceConfiguration with defaults applied
 */
export function createServiceConfiguration(
  partial: Partial<ServiceConfiguration> &
    Pick<ServiceConfiguration, 'name' | 'url' | 'workspaceId'>
): ServiceConfiguration {
  const now = new Date();

  return {
    id: generateUUID(),
    iconType: 'builtin',
    position: 0,
    sortOrder: 0,
    notifications: true,
    isActive: true,
    blockAds: true,
    blockTrackers: true,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * Simple UUID generator for service IDs
 * In production, consider using a more robust UUID library
 *
 * @returns UUID v4 string
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
