import { EventEmitter } from 'events';
import type { ApplicationLogger } from '../logging/ApplicationLogger';
import type { PerformanceMonitor } from './PerformanceMonitor';
/**
 * Error severity levels
 */
declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error categories
 */
declare enum ErrorCategory {
    RUNTIME = "runtime",
    NETWORK = "network",
    FILE_SYSTEM = "file_system",
    SECURITY = "security",
    PERFORMANCE = "performance",
    UI = "ui",
    IPC = "ipc",
    BROWSER_VIEW = "browser_view",
    CONFIGURATION = "configuration",
    UNKNOWN = "unknown"
}
/**
 * Privacy level for error reporting
 */
declare enum PrivacyLevel {
    MINIMAL = "minimal",// Only basic error info, no user data
    STANDARD = "standard",// Include context but sanitized
    DETAILED = "detailed",// Full context for debugging (user consent required)
    FULL = "full"
}
/**
 * Error context information
 */
interface ErrorContext {
    applicationVersion: string;
    electronVersion: string;
    nodeVersion: string;
    platform: string;
    arch: string;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    processType: 'main' | 'renderer' | 'worker';
    processId: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: number;
    windowCount?: number;
    browserViewCount?: number;
    activeWorkspaceId?: string;
    serviceCount?: number;
    component?: string;
    action?: string;
    additionalData?: Record<string, any>;
}
/**
 * Crash report data
 */
interface CrashReport {
    id: string;
    timestamp: Date;
    severity: ErrorSeverity;
    category: ErrorCategory;
    message: string;
    stack?: string;
    code?: string | number;
    context: ErrorContext;
    privacyLevel: PrivacyLevel;
    sanitized: boolean;
    analyzed: boolean;
    reported: boolean;
    reportedAt?: Date;
    reportId?: string;
    userConsent: boolean;
    reportingEnabled: boolean;
}
/**
 * Error analysis result
 */
interface ErrorAnalysis {
    errorId: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    isKnownIssue: boolean;
    similarErrors: string[];
    possibleCauses: string[];
    suggestedFixes: string[];
    affectedComponents: string[];
    userImpact: 'none' | 'low' | 'medium' | 'high';
    regressionRisk: 'none' | 'low' | 'medium' | 'high';
}
/**
 * Error reporting configuration
 */
interface ErrorReportingConfig {
    enabled: boolean;
    privacyLevel: PrivacyLevel;
    userConsent: boolean;
    reportingEndpoint?: string;
    maxReportsPerSession: number;
    maxReportSize: number;
    retentionDays: number;
    autoReportSeverities: ErrorSeverity[];
    requireConsentForSeverities: ErrorSeverity[];
    includeStackTrace: boolean;
    includeSystemInfo: boolean;
    includePerformanceData: boolean;
    hashSensitiveData: boolean;
}
/**
 * Error pattern for known issues
 */
interface ErrorPattern {
    id: string;
    name: string;
    description: string;
    pattern: RegExp | string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    knownFix?: string;
    workaround?: string;
    affectedVersions?: string[];
    resolved: boolean;
}
/**
 * Error reporting events
 */
interface ErrorReporterEvents {
    'error-captured': CrashReport;
    'error-analyzed': ErrorAnalysis;
    'error-reported': {
        reportId: string;
        crashReport: CrashReport;
    };
    'reporting-enabled': void;
    'reporting-disabled': void;
    'privacy-level-changed': PrivacyLevel;
    'known-issue-detected': {
        errorId: string;
        pattern: ErrorPattern;
    };
}
/**
 * Centralized error reporting and crash analysis system for GetWarped.
 *
 * Features:
 * - Comprehensive error capture and categorization
 * - Privacy-first design with user consent management
 * - Automatic error analysis and pattern recognition
 * - Known issue detection with suggested fixes
 * - Performance impact analysis
 * - Sanitized error reporting with configurable privacy levels
 * - Crash dump analysis and reporting
 * - Error trend analysis and regression detection
 */
export declare class ErrorReporter extends EventEmitter {
    private readonly logger;
    private readonly performanceMonitor;
    private readonly config;
    private readonly errorHistory;
    private readonly errorPatterns;
    private readonly reportQueue;
    private reportCount;
    private isInitialized;
    private readonly maxHistorySize;
    constructor(logger: ApplicationLogger, config?: Partial<ErrorReportingConfig>, performanceMonitor?: PerformanceMonitor);
    /**
     * Initialize error reporting
     */
    initialize(): Promise<void>;
    /**
     * Capture and report an error
     */
    captureError(error: Error | string, options?: {
        severity?: ErrorSeverity;
        category?: ErrorCategory;
        context?: Partial<ErrorContext>;
        component?: string;
        action?: string;
        additionalData?: Record<string, any>;
    }): string;
    /**
     * Capture an unhandled exception
     */
    captureException(error: Error, fatal?: boolean): string;
    /**
     * Capture a promise rejection
     */
    captureRejection(reason: any): string;
    /**
     * Get error by ID
     */
    getError(errorId: string): CrashReport | undefined;
    /**
     * Get all errors by category
     */
    getErrorsByCategory(category: ErrorCategory): CrashReport[];
    /**
     * Get error statistics
     */
    getErrorStatistics(): {
        totalErrors: number;
        bySeverity: Record<ErrorSeverity, number>;
        byCategory: Record<ErrorCategory, number>;
        reportedCount: number;
        knownIssuesCount: number;
        recentErrors: number;
    };
    /**
     * Update error reporting configuration
     */
    updateConfiguration(newConfig: Partial<ErrorReportingConfig>): void;
    /**
     * Set user consent for error reporting
     */
    setUserConsent(consent: boolean): void;
    /**
     * Clear error history
     */
    clearHistory(): void;
    /**
     * Export error reports for analysis
     */
    exportReports(options?: {
        includePrivateData?: boolean;
        format?: 'json' | 'csv';
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): string;
    /**
     * Create crash report from error
     */
    private createCrashReport;
    /**
     * Analyze error for patterns and known issues
     */
    private analyzeError;
    /**
     * Check if error matches known patterns
     */
    private checkKnownIssues;
    /**
     * Determine if error should be auto-reported
     */
    private shouldAutoReport;
    /**
     * Queue error for reporting
     */
    private queueForReporting;
    /**
     * Process queued error reports
     */
    private processQueuedReports;
    /**
     * Send error report to endpoint
     */
    private sendReport;
    /**
     * Clear queued reports
     */
    private clearQueuedReports;
    /**
     * Generate unique error ID
     */
    private generateErrorId;
    /**
     * Determine error severity
     */
    private determineSeverity;
    /**
     * Categorize error
     */
    private categorizeError;
    /**
     * Build error context
     */
    private buildContext;
    /**
     * Setup global error handlers
     */
    private setupGlobalErrorHandlers;
    /**
     * Initialize known error patterns
     */
    private initializeKnownPatterns;
    /**
     * Check if error matches pattern
     */
    private matchesPattern;
    /**
     * Find similar errors in history
     */
    private findSimilarErrors;
    /**
     * Calculate string similarity (simple implementation)
     */
    private calculateStringSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Identify affected components
     */
    private identifyAffectedComponents;
    /**
     * Assess user impact
     */
    private assessUserImpact;
    /**
     * Assess regression risk
     */
    private assessRegressionRisk;
    /**
     * Sanitize error message
     */
    private sanitizeMessage;
    /**
     * Sanitize stack trace
     */
    private sanitizeStackTrace;
    /**
     * Sanitize report for transmission
     */
    private sanitizeReport;
    /**
     * Convert reports to CSV format
     */
    private convertToCSV;
    /**
     * Hash sensitive value
     */
    private hashValue;
    /**
     * Maintain error history size
     */
    private maintainHistorySize;
    /**
     * Dispose of resources
     */
    dispose(): Promise<void>;
    on<K extends keyof ErrorReporterEvents>(event: K, listener: (arg: ErrorReporterEvents[K]) => void): this;
    once<K extends keyof ErrorReporterEvents>(event: K, listener: (arg: ErrorReporterEvents[K]) => void): this;
    emit<K extends keyof ErrorReporterEvents>(event: K, arg: ErrorReporterEvents[K]): boolean;
}
export type { ErrorContext, CrashReport, ErrorAnalysis, ErrorReportingConfig, ErrorPattern, ErrorReporterEvents, };
export { ErrorSeverity, ErrorCategory, PrivacyLevel };
export default ErrorReporter;
//# sourceMappingURL=ErrorReporter.d.ts.map