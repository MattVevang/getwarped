/**
 * ConfigurationExport JSON Schema Validation
 *
 * Provides comprehensive runtime validation for ConfigurationExport objects including
 * security validation to prevent import of sensitive data. Ensures export/import
 * data integrity and maintains security boundaries.
 *
 * @fileoverview ConfigurationExport validation schema and security utilities
 */
import { ConfigurationExport } from '../types/ConfigurationExport';
/**
 * JSON Schema for ExportedService interface
 * Validates individual service configurations within exports
 */
declare const exportedServiceSchema: {
    readonly type: "object";
    readonly properties: {
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 100;
            readonly pattern: "^[^<>&\"'\\x00-\\x1f\\x7f]+$";
            readonly description: "Service display name (1-100 chars, no HTML/control chars)";
        };
        readonly url: {
            readonly type: "string";
            readonly format: "uri";
            readonly pattern: "^https?://";
            readonly maxLength: 2048;
            readonly description: "Service URL (HTTP/HTTPS only, max 2048 chars)";
        };
        readonly icon: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 100000;
            readonly description: "Icon URL or base64 data";
        };
        readonly iconType: {
            readonly type: "string";
            readonly enum: readonly ["url", "base64", "builtin"];
            readonly description: "Icon source type";
        };
        readonly theme: {
            readonly oneOf: readonly [{
                readonly type: "null";
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly primaryColor: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                    };
                    readonly backgroundColor: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                    };
                    readonly textColor: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                    };
                };
                readonly additionalProperties: false;
            }];
        };
        readonly notifications: {
            readonly type: "boolean";
            readonly description: "Enable/disable notifications";
        };
        readonly position: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 999;
            readonly description: "Display position (0-999)";
        };
        readonly customUserAgent: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 500;
            readonly pattern: "^[^\\x00-\\x1f\\x7f]*$";
            readonly description: "Custom user agent string";
        };
        readonly blockAds: {
            readonly type: "boolean";
            readonly description: "Ad blocking preference";
        };
        readonly blockTrackers: {
            readonly type: "boolean";
            readonly description: "Tracker blocking preference";
        };
        readonly category: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 50;
            readonly pattern: "^[a-zA-Z0-9\\s-_]+$";
            readonly description: "Service category";
        };
        readonly notes: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 1000;
            readonly description: "Optional service notes";
        };
        readonly templateId: {
            readonly type: readonly ["string", "null"];
            readonly pattern: "^[a-zA-Z0-9\\-_]+$";
            readonly maxLength: 100;
            readonly description: "Service template identifier";
        };
    };
    readonly required: readonly ["name", "url", "iconType", "notifications", "position", "blockAds", "blockTrackers"];
    readonly additionalProperties: false;
};
/**
 * JSON Schema for ExportedWorkspace interface
 * Validates workspace configurations within exports
 */
declare const exportedWorkspaceSchema: {
    readonly type: "object";
    readonly properties: {
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 100;
            readonly pattern: "^[^<>&\"'\\x00-\\x1f\\x7f]+$";
            readonly description: "Workspace name (1-100 chars, no HTML/control chars)";
        };
        readonly description: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 500;
            readonly description: "Optional workspace description";
        };
        readonly services: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly minLength: 1;
                        readonly maxLength: 100;
                        readonly pattern: "^[^<>&\"'\\x00-\\x1f\\x7f]+$";
                        readonly description: "Service display name (1-100 chars, no HTML/control chars)";
                    };
                    readonly url: {
                        readonly type: "string";
                        readonly format: "uri";
                        readonly pattern: "^https?://";
                        readonly maxLength: 2048;
                        readonly description: "Service URL (HTTP/HTTPS only, max 2048 chars)";
                    };
                    readonly icon: {
                        readonly type: readonly ["string", "null"];
                        readonly maxLength: 100000;
                        readonly description: "Icon URL or base64 data";
                    };
                    readonly iconType: {
                        readonly type: "string";
                        readonly enum: readonly ["url", "base64", "builtin"];
                        readonly description: "Icon source type";
                    };
                    readonly theme: {
                        readonly oneOf: readonly [{
                            readonly type: "null";
                        }, {
                            readonly type: "object";
                            readonly properties: {
                                readonly primaryColor: {
                                    readonly type: readonly ["string", "null"];
                                    readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                                };
                                readonly backgroundColor: {
                                    readonly type: readonly ["string", "null"];
                                    readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                                };
                                readonly textColor: {
                                    readonly type: readonly ["string", "null"];
                                    readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                                };
                            };
                            readonly additionalProperties: false;
                        }];
                    };
                    readonly notifications: {
                        readonly type: "boolean";
                        readonly description: "Enable/disable notifications";
                    };
                    readonly position: {
                        readonly type: "integer";
                        readonly minimum: 0;
                        readonly maximum: 999;
                        readonly description: "Display position (0-999)";
                    };
                    readonly customUserAgent: {
                        readonly type: readonly ["string", "null"];
                        readonly maxLength: 500;
                        readonly pattern: "^[^\\x00-\\x1f\\x7f]*$";
                        readonly description: "Custom user agent string";
                    };
                    readonly blockAds: {
                        readonly type: "boolean";
                        readonly description: "Ad blocking preference";
                    };
                    readonly blockTrackers: {
                        readonly type: "boolean";
                        readonly description: "Tracker blocking preference";
                    };
                    readonly category: {
                        readonly type: readonly ["string", "null"];
                        readonly maxLength: 50;
                        readonly pattern: "^[a-zA-Z0-9\\s-_]+$";
                        readonly description: "Service category";
                    };
                    readonly notes: {
                        readonly type: readonly ["string", "null"];
                        readonly maxLength: 1000;
                        readonly description: "Optional service notes";
                    };
                    readonly templateId: {
                        readonly type: readonly ["string", "null"];
                        readonly pattern: "^[a-zA-Z0-9\\-_]+$";
                        readonly maxLength: 100;
                        readonly description: "Service template identifier";
                    };
                };
                readonly required: readonly ["name", "url", "iconType", "notifications", "position", "blockAds", "blockTrackers"];
                readonly additionalProperties: false;
            };
            readonly maxItems: 100;
            readonly description: "Array of exported services";
        };
        readonly theme: {
            readonly type: "object";
            readonly properties: {
                readonly name: {
                    readonly type: "string";
                    readonly enum: readonly ["WORK", "PERSONAL", "DARK", "LIGHT", "CUSTOM"];
                    readonly description: "Theme name";
                };
                readonly primaryColor: {
                    readonly type: "string";
                    readonly pattern: "^#[0-9A-Fa-f]{6}$";
                    readonly description: "Primary color (hex)";
                };
                readonly secondaryColor: {
                    readonly type: "string";
                    readonly pattern: "^#[0-9A-Fa-f]{6}$";
                    readonly description: "Secondary color (hex)";
                };
                readonly backgroundColor: {
                    readonly type: "string";
                    readonly pattern: "^#[0-9A-Fa-f]{6}$";
                    readonly description: "Background color (hex)";
                };
            };
            readonly required: readonly ["name", "primaryColor", "secondaryColor", "backgroundColor"];
            readonly additionalProperties: false;
        };
        readonly position: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 999;
            readonly description: "Workspace position";
        };
        readonly wasDefault: {
            readonly type: "boolean";
            readonly description: "Whether this was the default workspace";
        };
        readonly notes: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 1000;
            readonly description: "Optional workspace notes";
        };
    };
    readonly required: readonly ["name", "services", "theme", "position", "wasDefault"];
    readonly additionalProperties: false;
};
/**
 * JSON Schema for ExportMetadata interface
 * Validates export metadata and version information
 */
declare const exportMetadataSchema: {
    readonly type: "object";
    readonly properties: {
        readonly appVersion: {
            readonly type: "string";
            readonly pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9-]+)?$";
            readonly description: "Semantic version string";
        };
        readonly platform: {
            readonly type: "string";
            readonly enum: readonly ["win32", "darwin", "linux", "Windows", "macOS", "Linux"];
            readonly description: "Operating system platform";
        };
        readonly totalWorkspaces: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 50;
            readonly description: "Number of exported workspaces";
        };
        readonly totalServices: {
            readonly type: "integer";
            readonly minimum: 0;
            readonly maximum: 1000;
            readonly description: "Total number of exported services";
        };
        readonly exportVersion: {
            readonly type: "string";
            readonly pattern: "^\\d+\\.\\d+\\.\\d+$";
            readonly description: "Export format version";
        };
        readonly description: {
            readonly type: readonly ["string", "null"];
            readonly maxLength: 500;
            readonly description: "Optional export description";
        };
        readonly createdAt: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "Export creation timestamp";
        };
        readonly checksum: {
            readonly type: readonly ["string", "null"];
            readonly pattern: "^[a-fA-F0-9]+$";
            readonly maxLength: 128;
            readonly description: "Optional data integrity checksum";
        };
    };
    readonly required: readonly ["appVersion", "platform", "totalWorkspaces", "totalServices", "exportVersion", "createdAt"];
    readonly additionalProperties: false;
};
/**
 * JSON Schema for ExportedPreferences interface
 * Validates application preferences within exports
 */
declare const exportedPreferencesSchema: {
    readonly type: "object";
    readonly properties: {
        readonly theme: {
            readonly type: "string";
            readonly enum: readonly ["light", "dark", "system"];
            readonly description: "UI theme preference";
        };
        readonly language: {
            readonly type: "string";
            readonly pattern: "^[a-z]{2}(-[A-Z]{2})?$";
            readonly description: "Language/locale code (e.g., en, en-US)";
        };
        readonly notifications: {
            readonly type: "object";
            readonly properties: {
                readonly enabled: {
                    readonly type: "boolean";
                };
                readonly showInTray: {
                    readonly type: "boolean";
                };
                readonly soundEnabled: {
                    readonly type: "boolean";
                };
            };
            readonly required: readonly ["enabled", "showInTray", "soundEnabled"];
            readonly additionalProperties: false;
        };
        readonly window: {
            readonly type: "object";
            readonly properties: {
                readonly width: {
                    readonly type: "integer";
                    readonly minimum: 400;
                    readonly maximum: 4000;
                };
                readonly height: {
                    readonly type: "integer";
                    readonly minimum: 300;
                    readonly maximum: 3000;
                };
                readonly maximized: {
                    readonly type: "boolean";
                };
            };
            readonly required: readonly ["width", "height", "maximized"];
            readonly additionalProperties: false;
        };
        readonly privacy: {
            readonly type: "object";
            readonly properties: {
                readonly analytics: {
                    readonly type: "boolean";
                };
                readonly crashReports: {
                    readonly type: "boolean";
                };
                readonly errorReporting: {
                    readonly type: "boolean";
                };
            };
            readonly required: readonly ["analytics", "crashReports", "errorReporting"];
            readonly additionalProperties: false;
        };
        readonly updates: {
            readonly type: "object";
            readonly properties: {
                readonly autoCheck: {
                    readonly type: "boolean";
                };
                readonly autoInstall: {
                    readonly type: "boolean";
                };
                readonly includePrerelease: {
                    readonly type: "boolean";
                };
            };
            readonly required: readonly ["autoCheck", "autoInstall", "includePrerelease"];
            readonly additionalProperties: false;
        };
    };
    readonly required: readonly ["theme", "language", "notifications", "window", "privacy", "updates"];
    readonly additionalProperties: false;
};
/**
 * Main JSON Schema for ConfigurationExport interface
 * Comprehensive validation of complete export structure
 */
declare const configurationExportSchema: {
    readonly type: "object";
    readonly properties: {
        readonly version: {
            readonly type: "string";
            readonly pattern: "^\\d+\\.\\d+\\.\\d+$";
            readonly description: "Export format version";
        };
        readonly exportedAt: {
            readonly type: "string";
            readonly format: "date-time";
            readonly description: "Export timestamp";
        };
        readonly workspaces: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly minLength: 1;
                        readonly maxLength: 100;
                        readonly pattern: "^[^<>&\"'\\x00-\\x1f\\x7f]+$";
                        readonly description: "Workspace name (1-100 chars, no HTML/control chars)";
                    };
                    readonly description: {
                        readonly type: readonly ["string", "null"];
                        readonly maxLength: 500;
                        readonly description: "Optional workspace description";
                    };
                    readonly services: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly name: {
                                    readonly type: "string";
                                    readonly minLength: 1;
                                    readonly maxLength: 100;
                                    readonly pattern: "^[^<>&\"'\\x00-\\x1f\\x7f]+$";
                                    readonly description: "Service display name (1-100 chars, no HTML/control chars)";
                                };
                                readonly url: {
                                    readonly type: "string";
                                    readonly format: "uri";
                                    readonly pattern: "^https?://";
                                    readonly maxLength: 2048;
                                    readonly description: "Service URL (HTTP/HTTPS only, max 2048 chars)";
                                };
                                readonly icon: {
                                    readonly type: readonly ["string", "null"];
                                    readonly maxLength: 100000;
                                    readonly description: "Icon URL or base64 data";
                                };
                                readonly iconType: {
                                    readonly type: "string";
                                    readonly enum: readonly ["url", "base64", "builtin"];
                                    readonly description: "Icon source type";
                                };
                                readonly theme: {
                                    readonly oneOf: readonly [{
                                        readonly type: "null";
                                    }, {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly primaryColor: {
                                                readonly type: readonly ["string", "null"];
                                                readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                                            };
                                            readonly backgroundColor: {
                                                readonly type: readonly ["string", "null"];
                                                readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                                            };
                                            readonly textColor: {
                                                readonly type: readonly ["string", "null"];
                                                readonly pattern: "^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)|rgba\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*[0-9.]+\\s*\\)|[a-zA-Z]+)$";
                                            };
                                        };
                                        readonly additionalProperties: false;
                                    }];
                                };
                                readonly notifications: {
                                    readonly type: "boolean";
                                    readonly description: "Enable/disable notifications";
                                };
                                readonly position: {
                                    readonly type: "integer";
                                    readonly minimum: 0;
                                    readonly maximum: 999;
                                    readonly description: "Display position (0-999)";
                                };
                                readonly customUserAgent: {
                                    readonly type: readonly ["string", "null"];
                                    readonly maxLength: 500;
                                    readonly pattern: "^[^\\x00-\\x1f\\x7f]*$";
                                    readonly description: "Custom user agent string";
                                };
                                readonly blockAds: {
                                    readonly type: "boolean";
                                    readonly description: "Ad blocking preference";
                                };
                                readonly blockTrackers: {
                                    readonly type: "boolean";
                                    readonly description: "Tracker blocking preference";
                                };
                                readonly category: {
                                    readonly type: readonly ["string", "null"];
                                    readonly maxLength: 50;
                                    readonly pattern: "^[a-zA-Z0-9\\s-_]+$";
                                    readonly description: "Service category";
                                };
                                readonly notes: {
                                    readonly type: readonly ["string", "null"];
                                    readonly maxLength: 1000;
                                    readonly description: "Optional service notes";
                                };
                                readonly templateId: {
                                    readonly type: readonly ["string", "null"];
                                    readonly pattern: "^[a-zA-Z0-9\\-_]+$";
                                    readonly maxLength: 100;
                                    readonly description: "Service template identifier";
                                };
                            };
                            readonly required: readonly ["name", "url", "iconType", "notifications", "position", "blockAds", "blockTrackers"];
                            readonly additionalProperties: false;
                        };
                        readonly maxItems: 100;
                        readonly description: "Array of exported services";
                    };
                    readonly theme: {
                        readonly type: "object";
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                                readonly enum: readonly ["WORK", "PERSONAL", "DARK", "LIGHT", "CUSTOM"];
                                readonly description: "Theme name";
                            };
                            readonly primaryColor: {
                                readonly type: "string";
                                readonly pattern: "^#[0-9A-Fa-f]{6}$";
                                readonly description: "Primary color (hex)";
                            };
                            readonly secondaryColor: {
                                readonly type: "string";
                                readonly pattern: "^#[0-9A-Fa-f]{6}$";
                                readonly description: "Secondary color (hex)";
                            };
                            readonly backgroundColor: {
                                readonly type: "string";
                                readonly pattern: "^#[0-9A-Fa-f]{6}$";
                                readonly description: "Background color (hex)";
                            };
                        };
                        readonly required: readonly ["name", "primaryColor", "secondaryColor", "backgroundColor"];
                        readonly additionalProperties: false;
                    };
                    readonly position: {
                        readonly type: "integer";
                        readonly minimum: 0;
                        readonly maximum: 999;
                        readonly description: "Workspace position";
                    };
                    readonly wasDefault: {
                        readonly type: "boolean";
                        readonly description: "Whether this was the default workspace";
                    };
                    readonly notes: {
                        readonly type: readonly ["string", "null"];
                        readonly maxLength: 1000;
                        readonly description: "Optional workspace notes";
                    };
                };
                readonly required: readonly ["name", "services", "theme", "position", "wasDefault"];
                readonly additionalProperties: false;
            };
            readonly minItems: 0;
            readonly maxItems: 50;
            readonly description: "Array of exported workspaces";
        };
        readonly metadata: {
            readonly type: "object";
            readonly properties: {
                readonly appVersion: {
                    readonly type: "string";
                    readonly pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9-]+)?$";
                    readonly description: "Semantic version string";
                };
                readonly platform: {
                    readonly type: "string";
                    readonly enum: readonly ["win32", "darwin", "linux", "Windows", "macOS", "Linux"];
                    readonly description: "Operating system platform";
                };
                readonly totalWorkspaces: {
                    readonly type: "integer";
                    readonly minimum: 0;
                    readonly maximum: 50;
                    readonly description: "Number of exported workspaces";
                };
                readonly totalServices: {
                    readonly type: "integer";
                    readonly minimum: 0;
                    readonly maximum: 1000;
                    readonly description: "Total number of exported services";
                };
                readonly exportVersion: {
                    readonly type: "string";
                    readonly pattern: "^\\d+\\.\\d+\\.\\d+$";
                    readonly description: "Export format version";
                };
                readonly description: {
                    readonly type: readonly ["string", "null"];
                    readonly maxLength: 500;
                    readonly description: "Optional export description";
                };
                readonly createdAt: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "Export creation timestamp";
                };
                readonly checksum: {
                    readonly type: readonly ["string", "null"];
                    readonly pattern: "^[a-fA-F0-9]+$";
                    readonly maxLength: 128;
                    readonly description: "Optional data integrity checksum";
                };
            };
            readonly required: readonly ["appVersion", "platform", "totalWorkspaces", "totalServices", "exportVersion", "createdAt"];
            readonly additionalProperties: false;
        };
        readonly preferences: {
            readonly oneOf: readonly [{
                readonly type: "null";
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly theme: {
                        readonly type: "string";
                        readonly enum: readonly ["light", "dark", "system"];
                        readonly description: "UI theme preference";
                    };
                    readonly language: {
                        readonly type: "string";
                        readonly pattern: "^[a-z]{2}(-[A-Z]{2})?$";
                        readonly description: "Language/locale code (e.g., en, en-US)";
                    };
                    readonly notifications: {
                        readonly type: "object";
                        readonly properties: {
                            readonly enabled: {
                                readonly type: "boolean";
                            };
                            readonly showInTray: {
                                readonly type: "boolean";
                            };
                            readonly soundEnabled: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["enabled", "showInTray", "soundEnabled"];
                        readonly additionalProperties: false;
                    };
                    readonly window: {
                        readonly type: "object";
                        readonly properties: {
                            readonly width: {
                                readonly type: "integer";
                                readonly minimum: 400;
                                readonly maximum: 4000;
                            };
                            readonly height: {
                                readonly type: "integer";
                                readonly minimum: 300;
                                readonly maximum: 3000;
                            };
                            readonly maximized: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["width", "height", "maximized"];
                        readonly additionalProperties: false;
                    };
                    readonly privacy: {
                        readonly type: "object";
                        readonly properties: {
                            readonly analytics: {
                                readonly type: "boolean";
                            };
                            readonly crashReports: {
                                readonly type: "boolean";
                            };
                            readonly errorReporting: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["analytics", "crashReports", "errorReporting"];
                        readonly additionalProperties: false;
                    };
                    readonly updates: {
                        readonly type: "object";
                        readonly properties: {
                            readonly autoCheck: {
                                readonly type: "boolean";
                            };
                            readonly autoInstall: {
                                readonly type: "boolean";
                            };
                            readonly includePrerelease: {
                                readonly type: "boolean";
                            };
                        };
                        readonly required: readonly ["autoCheck", "autoInstall", "includePrerelease"];
                        readonly additionalProperties: false;
                    };
                };
                readonly required: readonly ["theme", "language", "notifications", "window", "privacy", "updates"];
                readonly additionalProperties: false;
            }];
        };
        readonly securityNotices: {
            readonly type: readonly ["array", "null"];
            readonly items: {
                readonly type: "string";
                readonly maxLength: 200;
            };
            readonly maxItems: 20;
            readonly description: "Security warnings and notices";
        };
    };
    readonly required: readonly ["version", "exportedAt", "workspaces", "metadata"];
    readonly additionalProperties: false;
};
/**
 * JSON Schema for ImportConfiguration interface
 */
declare const importConfigurationSchema: {
    readonly type: "object";
    readonly properties: {
        readonly conflictResolution: {
            readonly type: "string";
            readonly enum: readonly ["skip", "rename", "overwrite", "ask"];
            readonly description: "How to handle name conflicts";
        };
        readonly importThemes: {
            readonly type: "boolean";
            readonly description: "Whether to import workspace themes";
        };
        readonly importPreferences: {
            readonly type: "boolean";
            readonly description: "Whether to import application preferences";
        };
        readonly workspaceMergeStrategy: {
            readonly type: "string";
            readonly enum: readonly ["separate", "merge", "replace"];
            readonly description: "Workspace merge strategy";
        };
        readonly validateUrls: {
            readonly type: "boolean";
            readonly description: "Whether to validate URLs during import";
        };
        readonly maxServices: {
            readonly type: readonly ["integer", "null"];
            readonly minimum: 1;
            readonly maximum: 1000;
            readonly description: "Maximum services to import (safety limit)";
        };
    };
    readonly required: readonly ["conflictResolution", "importThemes", "importPreferences", "workspaceMergeStrategy", "validateUrls"];
    readonly additionalProperties: false;
};
/**
 * Compiled validation functions
 */
export declare const validateConfigurationExport: import("ajv").ValidateFunction<{
    exportedAt: any;
    metadata: any;
    version: any;
    workspaces: any;
} & {
    exportedAt: any;
} & {
    metadata: any;
} & {
    version: any;
} & {
    workspaces: any;
}>;
export declare const validateExportedWorkspace: import("ajv").ValidateFunction<{
    name: any;
    theme: any;
    position: any;
    services: any;
    wasDefault: any;
} & {
    name: any;
} & {
    theme: any;
} & {
    position: any;
} & {
    services: any;
} & {
    wasDefault: any;
}>;
export declare const validateExportedService: import("ajv").ValidateFunction<{
    name: any;
    url: any;
    notifications: any;
    iconType: any;
    position: any;
    blockAds: any;
    blockTrackers: any;
} & {
    name: any;
} & {
    url: any;
} & {
    notifications: any;
} & {
    iconType: any;
} & {
    position: any;
} & {
    blockAds: any;
} & {
    blockTrackers: any;
}>;
export declare const validateExportMetadata: import("ajv").ValidateFunction<{
    appVersion: any;
    createdAt: any;
    platform: any;
    totalWorkspaces: any;
    totalServices: any;
    exportVersion: any;
} & {
    appVersion: any;
} & {
    createdAt: any;
} & {
    platform: any;
} & {
    totalWorkspaces: any;
} & {
    totalServices: any;
} & {
    exportVersion: any;
}>;
export declare const validateExportedPreferences: import("ajv").ValidateFunction<{
    privacy: any;
    window: any;
    language: any;
    theme: any;
    notifications: any;
    updates: any;
} & {
    privacy: any;
} & {
    window: any;
} & {
    language: any;
} & {
    theme: any;
} & {
    notifications: any;
} & {
    updates: any;
}>;
export declare const validateImportConfiguration: import("ajv").ValidateFunction<{
    conflictResolution: any;
    importThemes: any;
    importPreferences: any;
    workspaceMergeStrategy: any;
    validateUrls: any;
} & {
    conflictResolution: any;
} & {
    importThemes: any;
} & {
    importPreferences: any;
} & {
    workspaceMergeStrategy: any;
} & {
    validateUrls: any;
}>;
/**
 * Validation result interface for structured error handling
 */
export interface ValidationResult<T> {
    /** Whether validation passed */
    valid: boolean;
    /** Validated data (only present if valid is true) */
    data?: T;
    /** Validation errors (only present if valid is false) */
    errors?: ValidationError[];
}
/**
 * Structured validation error
 */
export interface ValidationError {
    /** JSON Schema path where error occurred */
    path: string;
    /** Human-readable error message */
    message: string;
    /** Invalid value that caused the error */
    value?: unknown;
    /** Schema keyword that failed */
    keyword?: string;
}
/**
 * Validates a ConfigurationExport object and returns structured result
 *
 * @param data - Object to validate
 * @returns Structured validation result with errors if invalid
 */
export declare function validateConfigurationExportWithResult(data: unknown): ValidationResult<ConfigurationExport>;
/**
 * Comprehensive security validation for ConfigurationExport
 * Performs deep security analysis beyond JSON schema validation
 *
 * @param exportData - Export data to validate
 * @returns Array of security issues found (empty if secure)
 */
export declare function validateConfigurationExportSecurity(exportData: ConfigurationExport): string[];
/**
 * Comprehensive validation combining JSON schema and security validation
 *
 * @param data - Data to validate
 * @returns Complete validation result
 */
export declare function validateConfigurationExportComplete(data: unknown): ValidationResult<ConfigurationExport>;
export { configurationExportSchema, exportedWorkspaceSchema, exportedServiceSchema, exportMetadataSchema, exportedPreferencesSchema, importConfigurationSchema, };
//# sourceMappingURL=ConfigurationExportSchema.d.ts.map