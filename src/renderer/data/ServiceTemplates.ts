/**
 * ServiceTemplates data
 *
 * Predefined templates for popular services with proper metadata
 * Provides a comprehensive list of common web services with their configurations
 */

import {
  ServiceTemplate,
  ServiceCategory,
  TemplateFeature,
} from '../../shared/types/ServiceTemplate';

/**
 * Popular service templates with comprehensive metadata
 */
export const ServiceTemplates: ServiceTemplate[] = [
  // Email Services
  {
    id: 'gmail',
    name: 'Gmail',
    description: "Google's email service with advanced features and integration",
    category: ServiceCategory.EMAIL,
    url: 'https://mail.google.com',
    icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    defaultTheme: {
      primaryColor: '#db4437',
      backgroundColor: '#ffffff',
      textColor: '#202124',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.AD_BLOCKING,
      TemplateFeature.DARK_MODE,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in with your Google account',
      'Enable notifications for new emails',
      'Configure labels and filters as needed',
    ],
    configurationHints: {
      notifications: 'Enable desktop notifications for better productivity',
      theme: 'Gmail supports both light and dark themes',
      shortcuts: 'Press ? to see all keyboard shortcuts',
    },
  },

  {
    id: 'outlook',
    name: 'Outlook',
    description: "Microsoft's email and calendar service",
    category: ServiceCategory.EMAIL,
    url: 'https://outlook.live.com',
    icon: 'https://res.cdn.office.net/assets/mail/file-types/16/outlook.png',
    defaultTheme: {
      primaryColor: '#0078d4',
      backgroundColor: '#ffffff',
      textColor: '#323130',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.AD_BLOCKING,
      TemplateFeature.DARK_MODE,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in with your Microsoft account',
      'Set up calendar and task integration',
      'Configure email rules and organization',
    ],
    configurationHints: {
      notifications: 'Configure focused inbox for better email management',
      calendar: 'Integrated calendar helps with scheduling',
      rules: 'Set up rules to automatically organize emails',
    },
  },

  // Communication Services
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration platform',
    category: ServiceCategory.COMMUNICATION,
    url: 'https://slack.com',
    icon: 'https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png',
    defaultTheme: {
      primaryColor: '#4a154b',
      backgroundColor: '#ffffff',
      textColor: '#1d1c1d',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.DARK_MODE,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Join your workspace or create a new one',
      'Set notification preferences',
      'Install useful apps and integrations',
    ],
    configurationHints: {
      notifications: 'Customize notification schedules to avoid burnout',
      threads: 'Use threads to keep conversations organized',
      apps: 'Integrate with tools your team already uses',
    },
  },

  {
    id: 'discord',
    name: 'Discord',
    description: 'Voice, video, and text communication for communities',
    category: ServiceCategory.COMMUNICATION,
    url: 'https://discord.com/app',
    icon: 'https://discord.com/assets/07dca80a102d4149e9736d4b162cff6f.ico',
    defaultTheme: {
      primaryColor: '#5865f2',
      backgroundColor: '#36393f',
      textColor: '#dcddde',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.DARK_MODE,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Create account or sign in',
      'Join servers or create your own',
      'Set up voice and video settings',
    ],
    configurationHints: {
      servers: 'Join servers based on your interests',
      voice: 'Test your microphone and speakers',
      privacy: 'Review privacy settings for your comfort level',
    },
  },

  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: "Microsoft's collaboration platform for modern workplace",
    category: ServiceCategory.COMMUNICATION,
    url: 'https://teams.microsoft.com',
    icon: 'https://statics.teams.cdn.office.net/hashedassets-launcher/launcher_teams_96x96.32c0ce7d.png',
    defaultTheme: {
      primaryColor: '#464eb8',
      backgroundColor: '#ffffff',
      textColor: '#323130',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.DARK_MODE,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in with your Microsoft work/school account',
      "Join your organization's team",
      'Set up meeting preferences and notifications',
    ],
    configurationHints: {
      meetings: 'Configure camera and microphone before important calls',
      status: 'Set your status to let colleagues know your availability',
      apps: 'Integrate with Office 365 for seamless collaboration',
    },
  },

  // Development Services
  {
    id: 'github',
    name: 'GitHub',
    description: 'Git repository hosting and software development platform',
    category: ServiceCategory.DEVELOPMENT,
    url: 'https://github.com',
    icon: 'https://github.githubassets.com/assets/pinned-octocat-093da3e6fa40.svg',
    defaultTheme: {
      primaryColor: '#181717',
      backgroundColor: '#ffffff',
      textColor: '#24292f',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.DARK_MODE,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in or create a GitHub account',
      'Set up SSH keys for secure access',
      'Configure notification preferences',
    ],
    configurationHints: {
      ssh: 'Set up SSH keys for secure repository access',
      notifications: 'Configure notifications for repositories you care about',
      profile: 'Complete your profile to build your developer presence',
    },
  },

  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'DevOps platform with Git repository management',
    category: ServiceCategory.DEVELOPMENT,
    url: 'https://gitlab.com',
    icon: 'https://gitlab.com/assets/favicon-72a2cad5025aa931d6ea56c3201d1f18e68a8cd39788c7c80d5b2b82aa5143ef.png',
    defaultTheme: {
      primaryColor: '#fc6d26',
      backgroundColor: '#ffffff',
      textColor: '#303030',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.DARK_MODE,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Create GitLab account or sign in',
      'Set up SSH keys for repository access',
      'Configure CI/CD pipelines as needed',
    ],
    configurationHints: {
      cicd: 'GitLab CI/CD is powerful for automated deployments',
      merge: 'Use merge requests for code review and collaboration',
      issues: 'Track bugs and features with GitLab Issues',
    },
  },

  // Productivity Services
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Cloud storage and file synchronization service',
    category: ServiceCategory.PRODUCTIVITY,
    url: 'https://drive.google.com',
    icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
    defaultTheme: {
      primaryColor: '#0f9d58',
      backgroundColor: '#ffffff',
      textColor: '#202124',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.DARK_MODE,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in with your Google account',
      'Organize files into folders',
      'Set up sharing permissions for collaboration',
    ],
    configurationHints: {
      sharing: 'Carefully manage sharing permissions for security',
      sync: 'Install Google Drive desktop app for file synchronization',
      storage: 'Monitor your storage usage to avoid running out of space',
    },
  },

  {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes, tasks, wikis, and databases',
    category: ServiceCategory.PRODUCTIVITY,
    url: 'https://www.notion.so',
    icon: 'https://www.notion.so/images/favicon.ico',
    defaultTheme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#37352f',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.DARK_MODE,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Create Notion account or sign in',
      'Explore templates for different use cases',
      'Set up your workspace structure',
    ],
    configurationHints: {
      templates: "Start with templates to learn Notion's capabilities",
      blocks: 'Everything in Notion is built with blocks',
      collaboration: 'Invite team members for collaborative workspaces',
    },
  },

  // Social Media
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Social networking and microblogging service',
    category: ServiceCategory.SOCIAL,
    url: 'https://twitter.com',
    icon: 'https://abs.twimg.com/favicons/twitter.2.ico',
    defaultTheme: {
      primaryColor: '#1da1f2',
      backgroundColor: '#ffffff',
      textColor: '#14171a',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.DARK_MODE,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in to your Twitter account',
      'Customize your notification settings',
      'Follow accounts relevant to your interests',
    ],
    configurationHints: {
      timeline: 'Choose between chronological and algorithmic timeline',
      notifications: 'Manage notification settings to avoid overwhelm',
      privacy: 'Review your privacy and safety settings regularly',
    },
  },

  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking social media platform',
    category: ServiceCategory.SOCIAL,
    url: 'https://www.linkedin.com',
    icon: 'https://static-exp1.licdn.com/sc/h/8w2oasnxrgtb1dhlei6n7p7wh',
    defaultTheme: {
      primaryColor: '#0077b5',
      backgroundColor: '#ffffff',
      textColor: '#000000',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.REAL_TIME,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in to your LinkedIn account',
      'Complete your professional profile',
      'Connect with colleagues and industry contacts',
    ],
    configurationHints: {
      profile: 'A complete profile gets more views and opportunities',
      network: 'Connect with people you know professionally',
      content: 'Share relevant content to build your professional brand',
    },
  },

  // Entertainment
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Video sharing and streaming platform',
    category: ServiceCategory.ENTERTAINMENT,
    url: 'https://www.youtube.com',
    icon: 'https://www.youtube.com/s/desktop/12345678/img/favicon_144.png',
    defaultTheme: {
      primaryColor: '#ff0000',
      backgroundColor: '#ffffff',
      textColor: '#030303',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.DARK_MODE,
      TemplateFeature.AD_BLOCKING,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in with your Google account (optional)',
      'Subscribe to channels you enjoy',
      'Create playlists to organize videos',
    ],
    configurationHints: {
      subscriptions: 'Subscribe to channels to get notifications of new videos',
      quality: 'Adjust video quality based on your internet connection',
      history: 'Your watch history helps YouTube recommend relevant content',
    },
  },

  // Design Tools
  {
    id: 'figma',
    name: 'Figma',
    description: 'Collaborative interface design tool',
    category: ServiceCategory.DESIGN,
    url: 'https://www.figma.com',
    icon: 'https://static.figma.com/app/icon/1/favicon.png',
    defaultTheme: {
      primaryColor: '#f24e1e',
      backgroundColor: '#ffffff',
      textColor: '#000000',
    },
    userAgentRequired: false,
    supportedFeatures: [
      TemplateFeature.NOTIFICATIONS,
      TemplateFeature.REAL_TIME,
      TemplateFeature.AUTHENTICATION,
      TemplateFeature.FILE_UPLOAD,
      TemplateFeature.KEYBOARD_SHORTCUTS,
    ],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Create Figma account or sign in',
      'Join design teams or create your own',
      'Explore community resources and plugins',
    ],
    configurationHints: {
      collaboration: "Real-time collaboration is Figma's biggest strength",
      plugins: "Explore plugins to extend Figma's capabilities",
      components: 'Create reusable components for consistent design',
    },
  },

  // Finance
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Digital payment platform',
    category: ServiceCategory.FINANCE,
    url: 'https://www.paypal.com',
    icon: 'https://www.paypalobjects.com/webstatic/icon/pp258.png',
    defaultTheme: {
      primaryColor: '#003087',
      backgroundColor: '#ffffff',
      textColor: '#2c2e2f',
    },
    userAgentRequired: false,
    supportedFeatures: [TemplateFeature.NOTIFICATIONS, TemplateFeature.AUTHENTICATION],
    version: '1.0.0',
    updatedAt: new Date('2024-01-01'),
    verified: true,
    setupInstructions: [
      'Sign in to your PayPal account',
      'Verify your identity and payment methods',
      'Review security settings and enable 2FA',
    ],
    knownIssues: [
      'Some regions may have limited functionality',
      'Business accounts have different features than personal accounts',
    ],
    configurationHints: {
      security: 'Enable two-factor authentication for enhanced security',
      limits: 'Verify your account to increase transaction limits',
      notifications: 'Set up email/SMS notifications for transactions',
    },
  },
];

/**
 * Service template utilities
 */
export const ServiceTemplateUtils = {
  /**
   * Get templates by category
   */
  getByCategory: (category: ServiceCategory): ServiceTemplate[] => {
    return ServiceTemplates.filter(template => template.category === category);
  },

  /**
   * Get verified templates only
   */
  getVerified: (): ServiceTemplate[] => {
    return ServiceTemplates.filter(template => template.verified);
  },

  /**
   * Search templates by name or description
   */
  search: (query: string): ServiceTemplate[] => {
    const lowercaseQuery = query.toLowerCase();
    return ServiceTemplates.filter(
      template =>
        template.name.toLowerCase().includes(lowercaseQuery) ||
        template.description.toLowerCase().includes(lowercaseQuery)
    );
  },

  /**
   * Get template by ID
   */
  getById: (id: string): ServiceTemplate | undefined => {
    return ServiceTemplates.find(template => template.id === id);
  },

  /**
   * Get all categories with templates
   */
  getCategories: (): ServiceCategory[] => {
    return [...new Set(ServiceTemplates.map(template => template.category))];
  },

  /**
   * Get templates that support a specific feature
   */
  getByFeature: (feature: TemplateFeature): ServiceTemplate[] => {
    return ServiceTemplates.filter(template => template.supportedFeatures.includes(feature));
  },

  /**
   * Get templates that require authentication
   */
  getAuthRequired: (): ServiceTemplate[] => {
    return ServiceTemplates.filter(template =>
      template.supportedFeatures.includes(TemplateFeature.AUTHENTICATION)
    );
  },

  /**
   * Validate service template
   */
  validateTemplate: (
    template: Partial<ServiceTemplate>
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!template.id) errors.push('ID is required');
    if (!template.name) errors.push('Name is required');
    if (!template.url) errors.push('URL is required');
    if (!template.category) errors.push('Category is required');
    if (!template.description) errors.push('Description is required');
    if (!template.version) errors.push('Version is required');
    if (!template.updatedAt) errors.push('Updated date is required');

    // Validate URL format
    if (template.url) {
      try {
        new URL(template.url);
      } catch {
        errors.push('Invalid URL format');
      }
    }

    // Validate required theme properties
    if (template.defaultTheme) {
      const theme = template.defaultTheme;
      if (!theme.primaryColor) errors.push('Default theme must have primary color');
      if (!theme.backgroundColor) errors.push('Default theme must have background color');
      if (!theme.textColor) errors.push('Default theme must have text color');
    } else {
      errors.push('Default theme is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

export default ServiceTemplates;
