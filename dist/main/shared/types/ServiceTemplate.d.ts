/**
 * ServiceTemplate: Predefined service configurations and category definitions
 *
 * Service templates provide pre-configured setups for popular online services,
 * making it easy for users to quickly add common services like Gmail, Slack, etc.
 * Templates include default theming, icons, and service-specific configurations.
 *
 * @fileoverview ServiceTemplate interface and related enums
 */
import { ServiceTheme } from './ServiceConfiguration';
/**
 * Service categories for organizing templates and services
 * Used for filtering, grouping, and navigation in the UI
 */
export declare enum ServiceCategory {
    /** Email services (Gmail, Outlook, Yahoo Mail, etc.) */
    EMAIL = "email",
    /** Productivity tools (Google Workspace, Office 365, Notion, etc.) */
    PRODUCTIVITY = "productivity",
    /** Communication platforms (Slack, Discord, Teams, etc.) */
    COMMUNICATION = "communication",
    /** Development tools (GitHub, GitLab, Jira, etc.) */
    DEVELOPMENT = "development",
    /** Social media platforms (Twitter, LinkedIn, Facebook, etc.) */
    SOCIAL = "social",
    /** Entertainment services (YouTube, Netflix, Spotify, etc.) */
    ENTERTAINMENT = "entertainment",
    /** Financial services (banking, trading, accounting, etc.) */
    FINANCE = "finance",
    /** E-commerce and shopping platforms */
    SHOPPING = "shopping",
    /** News and media websites */
    NEWS = "news",
    /** Educational platforms and learning resources */
    EDUCATION = "education",
    /** Cloud storage and file sharing services */
    STORAGE = "storage",
    /** Design and creative tools */
    DESIGN = "design",
    /** Monitoring and analytics tools */
    MONITORING = "monitoring",
    /** Other/uncategorized services */
    OTHER = "other"
}
/**
 * Template features that services can support
 * Used to indicate capabilities and customize UI accordingly
 */
export declare enum TemplateFeature {
    /** Service supports native notifications */
    NOTIFICATIONS = "notifications",
    /** Service benefits from ad blocking */
    AD_BLOCKING = "ad_blocking",
    /** Service benefits from tracker blocking */
    TRACKER_BLOCKING = "tracker_blocking",
    /** Service requires or benefits from custom user agent */
    CUSTOM_USER_AGENT = "custom_user_agent",
    /** Service supports custom theming */
    CUSTOM_THEMING = "custom_theming",
    /** Service supports dark mode */
    DARK_MODE = "dark_mode",
    /** Service has keyboard shortcuts */
    KEYBOARD_SHORTCUTS = "keyboard_shortcuts",
    /** Service supports file uploads */
    FILE_UPLOAD = "file_upload",
    /** Service supports real-time updates */
    REAL_TIME = "real_time",
    /** Service requires authentication */
    AUTHENTICATION = "authentication"
}
/**
 * Predefined service template for quick service setup
 *
 * Templates provide default configurations for popular services, including
 * optimized settings, theming, and feature flags. Users can create services
 * from templates or start from scratch.
 *
 * @example
 * ```typescript
 * const gmailTemplate: ServiceTemplate = {
 *   id: 'gmail',
 *   name: 'Gmail',
 *   url: 'https://mail.google.com',
 *   icon: 'gmail-icon',
 *   category: ServiceCategory.EMAIL,
 *   description: 'Google\'s email service with powerful search and organization',
 *   defaultTheme: { primaryColor: '#EA4335' },
 *   userAgentRequired: false,
 *   supportedFeatures: [
 *     TemplateFeature.NOTIFICATIONS,
 *     TemplateFeature.AD_BLOCKING,
 *     TemplateFeature.DARK_MODE
 *   ]
 * };
 * ```
 */
export interface ServiceTemplate {
    /** Template identifier (e.g., "gmail", "slack", "github") */
    id: string;
    /** Display name for the service */
    name: string;
    /** Default service URL */
    url: string;
    /** Built-in icon identifier or URL */
    icon: string;
    /** Service category for organization */
    category: ServiceCategory;
    /** Template description for user selection */
    description: string;
    /** Default theming configuration */
    defaultTheme: ServiceTheme;
    /** Whether service requires custom user agent */
    userAgentRequired: boolean;
    /** Default user agent string if required */
    defaultUserAgent?: string;
    /** Features supported by this service */
    supportedFeatures: TemplateFeature[];
    /** Template version for updates and compatibility */
    version: string;
    /** Template creation/update timestamp */
    updatedAt: Date;
    /** Whether template is officially verified */
    verified: boolean;
    /** Optional setup instructions for users */
    setupInstructions?: string[];
    /** Known compatibility issues or limitations */
    knownIssues?: string[];
    /** Service-specific configuration hints */
    configurationHints?: Record<string, string>;
}
/**
 * Template collection for organizing related templates
 * Useful for grouping templates by provider or theme
 */
export interface TemplateCollection {
    /** Collection identifier */
    id: string;
    /** Collection display name */
    name: string;
    /** Collection description */
    description: string;
    /** Templates in this collection */
    templates: string[];
    /** Collection icon or logo */
    icon?: string;
    /** Collection category */
    category: ServiceCategory;
    /** Collection popularity score for sorting */
    popularity: number;
}
/**
 * Type guard to check if an object is a valid ServiceTemplate
 *
 * @param obj - Object to validate
 * @returns True if object matches ServiceTemplate interface
 */
export declare function isServiceTemplate(obj: unknown): obj is ServiceTemplate;
/**
 * Creates a ServiceTemplate with default values
 *
 * @param partial - Partial template data
 * @returns Complete ServiceTemplate with defaults
 */
export declare function createServiceTemplate(partial: Partial<ServiceTemplate> & Pick<ServiceTemplate, 'id' | 'name' | 'url' | 'category'>): ServiceTemplate;
/**
 * Popular service templates with pre-configured settings
 */
export declare const POPULAR_TEMPLATES: {
    readonly GMAIL: {
        readonly id: "gmail";
        readonly name: "Gmail";
        readonly url: "https://mail.google.com";
        readonly category: ServiceCategory.EMAIL;
        readonly description: "Google's email service with powerful search and organization";
        readonly defaultTheme: {
            readonly primaryColor: "#EA4335";
        };
        readonly supportedFeatures: readonly [TemplateFeature.NOTIFICATIONS, TemplateFeature.AD_BLOCKING, TemplateFeature.DARK_MODE, TemplateFeature.KEYBOARD_SHORTCUTS];
    };
    readonly SLACK: {
        readonly id: "slack";
        readonly name: "Slack";
        readonly url: "https://slack.com";
        readonly category: ServiceCategory.COMMUNICATION;
        readonly description: "Team communication and collaboration platform";
        readonly defaultTheme: {
            readonly primaryColor: "#4A154B";
        };
        readonly supportedFeatures: readonly [TemplateFeature.NOTIFICATIONS, TemplateFeature.REAL_TIME, TemplateFeature.DARK_MODE, TemplateFeature.FILE_UPLOAD];
    };
    readonly GITHUB: {
        readonly id: "github";
        readonly name: "GitHub";
        readonly url: "https://github.com";
        readonly category: ServiceCategory.DEVELOPMENT;
        readonly description: "Version control and collaboration for software development";
        readonly defaultTheme: {
            readonly primaryColor: "#24292F";
        };
        readonly supportedFeatures: readonly [TemplateFeature.NOTIFICATIONS, TemplateFeature.DARK_MODE, TemplateFeature.KEYBOARD_SHORTCUTS];
    };
    readonly DISCORD: {
        readonly id: "discord";
        readonly name: "Discord";
        readonly url: "https://discord.com/app";
        readonly category: ServiceCategory.COMMUNICATION;
        readonly description: "Voice, video, and text communication for communities";
        readonly defaultTheme: {
            readonly primaryColor: "#5865F2";
        };
        readonly supportedFeatures: readonly [TemplateFeature.NOTIFICATIONS, TemplateFeature.REAL_TIME, TemplateFeature.DARK_MODE, TemplateFeature.FILE_UPLOAD];
    };
};
/**
 * Gets category display name for UI
 *
 * @param category - Service category
 * @returns Human-readable category name
 */
export declare function getCategoryDisplayName(category: ServiceCategory): string;
/**
 * Gets feature display name for UI
 *
 * @param feature - Template feature
 * @returns Human-readable feature name
 */
export declare function getFeatureDisplayName(feature: TemplateFeature): string;
/**
 * Filters templates by category
 *
 * @param templates - Array of templates to filter
 * @param category - Category to filter by
 * @returns Filtered templates
 */
export declare function filterTemplatesByCategory(templates: ServiceTemplate[], category: ServiceCategory): ServiceTemplate[];
/**
 * Searches templates by name or description
 *
 * @param templates - Array of templates to search
 * @param query - Search query
 * @returns Matching templates
 */
export declare function searchTemplates(templates: ServiceTemplate[], query: string): ServiceTemplate[];
//# sourceMappingURL=ServiceTemplate.d.ts.map