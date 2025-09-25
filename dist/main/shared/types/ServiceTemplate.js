"use strict";
/**
 * ServiceTemplate: Predefined service configurations and category definitions
 *
 * Service templates provide pre-configured setups for popular online services,
 * making it easy for users to quickly add common services like Gmail, Slack, etc.
 * Templates include default theming, icons, and service-specific configurations.
 *
 * @fileoverview ServiceTemplate interface and related enums
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POPULAR_TEMPLATES = exports.TemplateFeature = exports.ServiceCategory = void 0;
exports.isServiceTemplate = isServiceTemplate;
exports.createServiceTemplate = createServiceTemplate;
exports.getCategoryDisplayName = getCategoryDisplayName;
exports.getFeatureDisplayName = getFeatureDisplayName;
exports.filterTemplatesByCategory = filterTemplatesByCategory;
exports.searchTemplates = searchTemplates;
/**
 * Service categories for organizing templates and services
 * Used for filtering, grouping, and navigation in the UI
 */
var ServiceCategory;
(function (ServiceCategory) {
    /** Email services (Gmail, Outlook, Yahoo Mail, etc.) */
    ServiceCategory["EMAIL"] = "email";
    /** Productivity tools (Google Workspace, Office 365, Notion, etc.) */
    ServiceCategory["PRODUCTIVITY"] = "productivity";
    /** Communication platforms (Slack, Discord, Teams, etc.) */
    ServiceCategory["COMMUNICATION"] = "communication";
    /** Development tools (GitHub, GitLab, Jira, etc.) */
    ServiceCategory["DEVELOPMENT"] = "development";
    /** Social media platforms (Twitter, LinkedIn, Facebook, etc.) */
    ServiceCategory["SOCIAL"] = "social";
    /** Entertainment services (YouTube, Netflix, Spotify, etc.) */
    ServiceCategory["ENTERTAINMENT"] = "entertainment";
    /** Financial services (banking, trading, accounting, etc.) */
    ServiceCategory["FINANCE"] = "finance";
    /** E-commerce and shopping platforms */
    ServiceCategory["SHOPPING"] = "shopping";
    /** News and media websites */
    ServiceCategory["NEWS"] = "news";
    /** Educational platforms and learning resources */
    ServiceCategory["EDUCATION"] = "education";
    /** Cloud storage and file sharing services */
    ServiceCategory["STORAGE"] = "storage";
    /** Design and creative tools */
    ServiceCategory["DESIGN"] = "design";
    /** Monitoring and analytics tools */
    ServiceCategory["MONITORING"] = "monitoring";
    /** Other/uncategorized services */
    ServiceCategory["OTHER"] = "other";
})(ServiceCategory || (exports.ServiceCategory = ServiceCategory = {}));
/**
 * Template features that services can support
 * Used to indicate capabilities and customize UI accordingly
 */
var TemplateFeature;
(function (TemplateFeature) {
    /** Service supports native notifications */
    TemplateFeature["NOTIFICATIONS"] = "notifications";
    /** Service benefits from ad blocking */
    TemplateFeature["AD_BLOCKING"] = "ad_blocking";
    /** Service benefits from tracker blocking */
    TemplateFeature["TRACKER_BLOCKING"] = "tracker_blocking";
    /** Service requires or benefits from custom user agent */
    TemplateFeature["CUSTOM_USER_AGENT"] = "custom_user_agent";
    /** Service supports custom theming */
    TemplateFeature["CUSTOM_THEMING"] = "custom_theming";
    /** Service supports dark mode */
    TemplateFeature["DARK_MODE"] = "dark_mode";
    /** Service has keyboard shortcuts */
    TemplateFeature["KEYBOARD_SHORTCUTS"] = "keyboard_shortcuts";
    /** Service supports file uploads */
    TemplateFeature["FILE_UPLOAD"] = "file_upload";
    /** Service supports real-time updates */
    TemplateFeature["REAL_TIME"] = "real_time";
    /** Service requires authentication */
    TemplateFeature["AUTHENTICATION"] = "authentication";
})(TemplateFeature || (exports.TemplateFeature = TemplateFeature = {}));
/**
 * Type guard to check if an object is a valid ServiceTemplate
 *
 * @param obj - Object to validate
 * @returns True if object matches ServiceTemplate interface
 */
function isServiceTemplate(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const template = obj;
    return (typeof template.id === 'string' &&
        typeof template.name === 'string' &&
        typeof template.url === 'string' &&
        typeof template.icon === 'string' &&
        Object.values(ServiceCategory).includes(template.category) &&
        typeof template.description === 'string' &&
        typeof template.userAgentRequired === 'boolean' &&
        Array.isArray(template.supportedFeatures) &&
        template.supportedFeatures.every(feature => Object.values(TemplateFeature).includes(feature)) &&
        typeof template.version === 'string' &&
        template.updatedAt instanceof Date &&
        typeof template.verified === 'boolean');
}
/**
 * Creates a ServiceTemplate with default values
 *
 * @param partial - Partial template data
 * @returns Complete ServiceTemplate with defaults
 */
function createServiceTemplate(partial) {
    return {
        icon: 'default-service-icon',
        description: '',
        defaultTheme: {
            primaryColor: '#3B82F6',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937',
        },
        userAgentRequired: false,
        supportedFeatures: [],
        version: '1.0.0',
        updatedAt: new Date(),
        verified: false,
        ...partial,
    };
}
/**
 * Popular service templates with pre-configured settings
 */
exports.POPULAR_TEMPLATES = {
    GMAIL: {
        id: 'gmail',
        name: 'Gmail',
        url: 'https://mail.google.com',
        category: ServiceCategory.EMAIL,
        description: "Google's email service with powerful search and organization",
        defaultTheme: { primaryColor: '#EA4335' },
        supportedFeatures: [
            TemplateFeature.NOTIFICATIONS,
            TemplateFeature.AD_BLOCKING,
            TemplateFeature.DARK_MODE,
            TemplateFeature.KEYBOARD_SHORTCUTS,
        ],
    },
    SLACK: {
        id: 'slack',
        name: 'Slack',
        url: 'https://slack.com',
        category: ServiceCategory.COMMUNICATION,
        description: 'Team communication and collaboration platform',
        defaultTheme: { primaryColor: '#4A154B' },
        supportedFeatures: [
            TemplateFeature.NOTIFICATIONS,
            TemplateFeature.REAL_TIME,
            TemplateFeature.DARK_MODE,
            TemplateFeature.FILE_UPLOAD,
        ],
    },
    GITHUB: {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com',
        category: ServiceCategory.DEVELOPMENT,
        description: 'Version control and collaboration for software development',
        defaultTheme: { primaryColor: '#24292F' },
        supportedFeatures: [
            TemplateFeature.NOTIFICATIONS,
            TemplateFeature.DARK_MODE,
            TemplateFeature.KEYBOARD_SHORTCUTS,
        ],
    },
    DISCORD: {
        id: 'discord',
        name: 'Discord',
        url: 'https://discord.com/app',
        category: ServiceCategory.COMMUNICATION,
        description: 'Voice, video, and text communication for communities',
        defaultTheme: { primaryColor: '#5865F2' },
        supportedFeatures: [
            TemplateFeature.NOTIFICATIONS,
            TemplateFeature.REAL_TIME,
            TemplateFeature.DARK_MODE,
            TemplateFeature.FILE_UPLOAD,
        ],
    },
};
/**
 * Gets category display name for UI
 *
 * @param category - Service category
 * @returns Human-readable category name
 */
function getCategoryDisplayName(category) {
    const categoryNames = {
        [ServiceCategory.EMAIL]: 'Email',
        [ServiceCategory.PRODUCTIVITY]: 'Productivity',
        [ServiceCategory.COMMUNICATION]: 'Communication',
        [ServiceCategory.DEVELOPMENT]: 'Development',
        [ServiceCategory.SOCIAL]: 'Social Media',
        [ServiceCategory.ENTERTAINMENT]: 'Entertainment',
        [ServiceCategory.FINANCE]: 'Finance',
        [ServiceCategory.SHOPPING]: 'Shopping',
        [ServiceCategory.NEWS]: 'News & Media',
        [ServiceCategory.EDUCATION]: 'Education',
        [ServiceCategory.STORAGE]: 'Cloud Storage',
        [ServiceCategory.DESIGN]: 'Design & Creative',
        [ServiceCategory.MONITORING]: 'Monitoring & Analytics',
        [ServiceCategory.OTHER]: 'Other',
    };
    return categoryNames[category] || 'Unknown';
}
/**
 * Gets feature display name for UI
 *
 * @param feature - Template feature
 * @returns Human-readable feature name
 */
function getFeatureDisplayName(feature) {
    const featureNames = {
        [TemplateFeature.NOTIFICATIONS]: 'Notifications',
        [TemplateFeature.AD_BLOCKING]: 'Ad Blocking',
        [TemplateFeature.TRACKER_BLOCKING]: 'Tracker Blocking',
        [TemplateFeature.CUSTOM_USER_AGENT]: 'Custom User Agent',
        [TemplateFeature.CUSTOM_THEMING]: 'Custom Theming',
        [TemplateFeature.DARK_MODE]: 'Dark Mode',
        [TemplateFeature.KEYBOARD_SHORTCUTS]: 'Keyboard Shortcuts',
        [TemplateFeature.FILE_UPLOAD]: 'File Upload',
        [TemplateFeature.REAL_TIME]: 'Real-time Updates',
        [TemplateFeature.AUTHENTICATION]: 'Authentication Required',
    };
    return featureNames[feature] || 'Unknown Feature';
}
/**
 * Filters templates by category
 *
 * @param templates - Array of templates to filter
 * @param category - Category to filter by
 * @returns Filtered templates
 */
function filterTemplatesByCategory(templates, category) {
    return templates.filter(template => template.category === category);
}
/**
 * Searches templates by name or description
 *
 * @param templates - Array of templates to search
 * @param query - Search query
 * @returns Matching templates
 */
function searchTemplates(templates, query) {
    const lowercaseQuery = query.toLowerCase();
    return templates.filter(template => template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery) ||
        template.id.toLowerCase().includes(lowercaseQuery));
}
//# sourceMappingURL=ServiceTemplate.js.map