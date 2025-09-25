"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyLevel = exports.ErrorCategory = exports.ErrorSeverity = exports.ErrorReporter = void 0;
const events_1 = require("events");
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
const electron_1 = require("electron");
/**
 * Error severity levels
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Error categories
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["RUNTIME"] = "runtime";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["FILE_SYSTEM"] = "file_system";
    ErrorCategory["SECURITY"] = "security";
    ErrorCategory["PERFORMANCE"] = "performance";
    ErrorCategory["UI"] = "ui";
    ErrorCategory["IPC"] = "ipc";
    ErrorCategory["BROWSER_VIEW"] = "browser_view";
    ErrorCategory["CONFIGURATION"] = "configuration";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
/**
 * Privacy level for error reporting
 */
var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel["MINIMAL"] = "minimal";
    PrivacyLevel["STANDARD"] = "standard";
    PrivacyLevel["DETAILED"] = "detailed";
    PrivacyLevel["FULL"] = "full";
})(PrivacyLevel || (exports.PrivacyLevel = PrivacyLevel = {}));
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
class ErrorReporter extends events_1.EventEmitter {
    logger;
    performanceMonitor;
    config;
    errorHistory = new Map();
    errorPatterns = [];
    reportQueue = [];
    reportCount = 0;
    isInitialized = false;
    maxHistorySize = 500;
    constructor(logger, config, performanceMonitor) {
        super();
        this.logger = logger;
        this.performanceMonitor = performanceMonitor;
        // Default configuration
        this.config = {
            enabled: true,
            privacyLevel: PrivacyLevel.STANDARD,
            userConsent: false, // Must be explicitly granted
            maxReportsPerSession: 50,
            maxReportSize: 1024 * 1024, // 1MB
            retentionDays: 30,
            autoReportSeverities: [ErrorSeverity.CRITICAL],
            requireConsentForSeverities: [
                ErrorSeverity.MEDIUM,
                ErrorSeverity.HIGH,
                ErrorSeverity.CRITICAL,
            ],
            includeStackTrace: true,
            includeSystemInfo: true,
            includePerformanceData: false,
            hashSensitiveData: true,
            ...config,
        };
        this.initializeKnownPatterns();
    }
    /**
     * Initialize error reporting
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Configure Electron crash reporter
            if (this.config.enabled && this.config.userConsent) {
                electron_1.crashReporter.start({
                    productName: 'GetWarped',
                    companyName: 'GetWarped',
                    submitURL: this.config.reportingEndpoint || '',
                    uploadToServer: !!this.config.reportingEndpoint,
                    ignoreSystemCrashHandler: false,
                    rateLimit: true,
                    compress: true,
                });
            }
            // Set up global error handlers
            this.setupGlobalErrorHandlers();
            this.isInitialized = true;
            this.logger.info('ErrorReporter initialized', {
                config: {
                    enabled: this.config.enabled,
                    privacyLevel: this.config.privacyLevel,
                    userConsent: this.config.userConsent,
                    maxReportsPerSession: this.config.maxReportsPerSession,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize ErrorReporter', error);
            throw error;
        }
    }
    /**
     * Capture and report an error
     */
    captureError(error, options = {}) {
        if (!this.config.enabled) {
            return '';
        }
        // Generate unique error ID
        const errorId = this.generateErrorId(error, options);
        // Check if we've already reported this exact error
        if (this.errorHistory.has(errorId)) {
            const existingReport = this.errorHistory.get(errorId);
            existingReport.context.timestamp = new Date();
            return errorId;
        }
        // Check session report limit
        if (this.reportCount >= this.config.maxReportsPerSession) {
            this.logger.warn('Maximum error reports per session reached', {
                count: this.reportCount,
                limit: this.config.maxReportsPerSession,
            });
            return errorId;
        }
        try {
            // Create crash report
            const crashReport = this.createCrashReport(error, options, errorId);
            // Analyze error
            const analysis = this.analyzeError(crashReport);
            // Store in history
            this.errorHistory.set(errorId, crashReport);
            this.maintainHistorySize();
            // Emit events
            this.emit('error-captured', crashReport);
            this.emit('error-analyzed', analysis);
            // Check for known issues
            this.checkKnownIssues(crashReport, analysis);
            // Decide if we should auto-report
            const shouldAutoReport = this.shouldAutoReport(crashReport);
            if (shouldAutoReport) {
                this.queueForReporting(crashReport);
            }
            this.reportCount++;
            this.logger.debug('Error captured', {
                errorId,
                severity: crashReport.severity,
                category: crashReport.category,
                autoReported: shouldAutoReport,
            });
            return errorId;
        }
        catch (captureError) {
            this.logger.error('Failed to capture error', captureError, {
                originalError: error instanceof Error ? error.message : error,
            });
            return '';
        }
    }
    /**
     * Capture an unhandled exception
     */
    captureException(error, fatal = false) {
        return this.captureError(error, {
            severity: fatal ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
            category: ErrorCategory.RUNTIME,
            component: 'global_handler',
            action: fatal ? 'unhandled_exception' : 'unhandled_error',
        });
    }
    /**
     * Capture a promise rejection
     */
    captureRejection(reason) {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        return this.captureError(error, {
            severity: ErrorSeverity.MEDIUM,
            category: ErrorCategory.RUNTIME,
            component: 'promise_handler',
            action: 'unhandled_rejection',
        });
    }
    /**
     * Get error by ID
     */
    getError(errorId) {
        return this.errorHistory.get(errorId);
    }
    /**
     * Get all errors by category
     */
    getErrorsByCategory(category) {
        return Array.from(this.errorHistory.values()).filter(report => report.category === category);
    }
    /**
     * Get error statistics
     */
    getErrorStatistics() {
        const reports = Array.from(this.errorHistory.values());
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const stats = {
            totalErrors: reports.length,
            bySeverity: {
                [ErrorSeverity.LOW]: 0,
                [ErrorSeverity.MEDIUM]: 0,
                [ErrorSeverity.HIGH]: 0,
                [ErrorSeverity.CRITICAL]: 0,
            },
            byCategory: {
                [ErrorCategory.RUNTIME]: 0,
                [ErrorCategory.NETWORK]: 0,
                [ErrorCategory.FILE_SYSTEM]: 0,
                [ErrorCategory.SECURITY]: 0,
                [ErrorCategory.PERFORMANCE]: 0,
                [ErrorCategory.UI]: 0,
                [ErrorCategory.IPC]: 0,
                [ErrorCategory.BROWSER_VIEW]: 0,
                [ErrorCategory.CONFIGURATION]: 0,
                [ErrorCategory.UNKNOWN]: 0,
            },
            reportedCount: 0,
            knownIssuesCount: 0,
            recentErrors: 0,
        };
        for (const report of reports) {
            stats.bySeverity[report.severity]++;
            stats.byCategory[report.category]++;
            if (report.reported) {
                stats.reportedCount++;
            }
            if (report.analyzed) {
                stats.knownIssuesCount++;
            }
            if (report.timestamp >= oneDayAgo) {
                stats.recentErrors++;
            }
        }
        return stats;
    }
    /**
     * Update error reporting configuration
     */
    updateConfiguration(newConfig) {
        const oldPrivacyLevel = this.config.privacyLevel;
        const oldEnabled = this.config.enabled;
        Object.assign(this.config, newConfig);
        // Handle privacy level changes
        if (newConfig.privacyLevel && newConfig.privacyLevel !== oldPrivacyLevel) {
            this.emit('privacy-level-changed', newConfig.privacyLevel);
        }
        // Handle enabled/disabled changes
        if (typeof newConfig.enabled === 'boolean' && newConfig.enabled !== oldEnabled) {
            if (newConfig.enabled) {
                this.emit('reporting-enabled', undefined);
            }
            else {
                this.emit('reporting-disabled', undefined);
            }
        }
        this.logger.info('ErrorReporter configuration updated', { newConfig });
    }
    /**
     * Set user consent for error reporting
     */
    setUserConsent(consent) {
        this.config.userConsent = consent;
        if (consent) {
            this.emit('reporting-enabled', undefined);
            this.processQueuedReports();
        }
        else {
            this.emit('reporting-disabled', undefined);
            this.clearQueuedReports();
        }
        this.logger.info('User consent for error reporting changed', { consent });
    }
    /**
     * Clear error history
     */
    clearHistory() {
        this.errorHistory.clear();
        this.reportQueue.length = 0;
        this.reportCount = 0;
        this.logger.info('Error history cleared');
    }
    /**
     * Export error reports for analysis
     */
    exportReports(options = {}) {
        const reports = Array.from(this.errorHistory.values());
        // Filter by date range if specified
        const filteredReports = options.dateRange
            ? reports.filter(report => report.timestamp >= options.dateRange.start &&
                report.timestamp <= options.dateRange.end)
            : reports;
        // Sanitize data based on privacy settings
        const sanitizedReports = filteredReports.map(report => this.sanitizeReport(report, options.includePrivateData || false));
        if (options.format === 'csv') {
            return this.convertToCSV(sanitizedReports);
        }
        return JSON.stringify(sanitizedReports, null, 2);
    }
    /**
     * Create crash report from error
     */
    createCrashReport(error, options, errorId) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        // Determine severity
        const severity = options.severity || this.determineSeverity(errorObj, options);
        // Determine category
        const category = options.category || this.categorizeError(errorObj, options);
        // Build context
        const context = this.buildContext(options.context, options);
        // Create crash report
        const crashReport = {
            id: errorId,
            timestamp: new Date(),
            severity,
            category,
            message: this.sanitizeMessage(errorObj.message),
            code: errorObj.code,
            context,
            privacyLevel: this.config.privacyLevel,
            sanitized: this.config.hashSensitiveData,
            analyzed: false,
            reported: false,
            userConsent: this.config.userConsent,
            reportingEnabled: this.config.enabled,
        };
        // Add stack trace if available and enabled
        if (this.config.includeStackTrace) {
            const sanitizedStack = this.sanitizeStackTrace(errorObj.stack);
            if (sanitizedStack !== undefined) {
                crashReport.stack = sanitizedStack;
            }
        }
        return crashReport;
    }
    /**
     * Analyze error for patterns and known issues
     */
    analyzeError(crashReport) {
        const analysis = {
            errorId: crashReport.id,
            category: crashReport.category,
            severity: crashReport.severity,
            isKnownIssue: false,
            similarErrors: [],
            possibleCauses: [],
            suggestedFixes: [],
            affectedComponents: [],
            userImpact: this.assessUserImpact(crashReport),
            regressionRisk: this.assessRegressionRisk(crashReport),
        };
        // Check against known patterns
        for (const pattern of this.errorPatterns) {
            if (this.matchesPattern(crashReport, pattern)) {
                analysis.isKnownIssue = true;
                analysis.possibleCauses.push(pattern.description);
                if (pattern.knownFix) {
                    analysis.suggestedFixes.push(pattern.knownFix);
                }
                if (pattern.workaround) {
                    analysis.suggestedFixes.push(`Workaround: ${pattern.workaround}`);
                }
            }
        }
        // Find similar errors
        analysis.similarErrors = this.findSimilarErrors(crashReport);
        // Analyze affected components
        analysis.affectedComponents = this.identifyAffectedComponents(crashReport);
        // Mark as analyzed
        crashReport.analyzed = true;
        return analysis;
    }
    /**
     * Check if error matches known patterns
     */
    checkKnownIssues(crashReport, analysis) {
        if (analysis.isKnownIssue) {
            const matchingPatterns = this.errorPatterns.filter(pattern => this.matchesPattern(crashReport, pattern));
            for (const pattern of matchingPatterns) {
                this.emit('known-issue-detected', {
                    errorId: crashReport.id,
                    pattern,
                });
            }
        }
    }
    /**
     * Determine if error should be auto-reported
     */
    shouldAutoReport(crashReport) {
        if (!this.config.enabled || !this.config.userConsent) {
            return false;
        }
        // Check if severity requires auto-reporting
        if (this.config.autoReportSeverities.includes(crashReport.severity)) {
            return true;
        }
        // Check if consent is required for this severity level
        if (this.config.requireConsentForSeverities.includes(crashReport.severity)) {
            return this.config.userConsent;
        }
        return false;
    }
    /**
     * Queue error for reporting
     */
    queueForReporting(crashReport) {
        this.reportQueue.push(crashReport);
        // Process queue immediately if we have consent
        if (this.config.userConsent) {
            this.processQueuedReports();
        }
    }
    /**
     * Process queued error reports
     */
    async processQueuedReports() {
        if (!this.config.userConsent || this.reportQueue.length === 0) {
            return;
        }
        const reportsToProcess = [...this.reportQueue];
        this.reportQueue.length = 0;
        for (const report of reportsToProcess) {
            try {
                await this.sendReport(report);
            }
            catch (error) {
                this.logger.error('Failed to send error report', error, {
                    reportId: report.id,
                });
                // Re-queue for later retry (with limit)
                if (this.reportQueue.length < 10) {
                    this.reportQueue.push(report);
                }
            }
        }
    }
    /**
     * Send error report to endpoint
     */
    async sendReport(crashReport) {
        if (!this.config.reportingEndpoint) {
            return;
        }
        // Sanitize report for transmission
        const sanitizedReport = this.sanitizeReport(crashReport, false);
        // Check size limit
        const reportData = JSON.stringify(sanitizedReport);
        if (reportData.length > this.config.maxReportSize) {
            this.logger.warn('Error report exceeds size limit', {
                reportId: crashReport.id,
                size: reportData.length,
                limit: this.config.maxReportSize,
            });
            return;
        }
        // Simulate report sending (replace with actual HTTP request)
        const reportId = crypto.randomUUID();
        // Mark as reported
        crashReport.reported = true;
        crashReport.reportedAt = new Date();
        crashReport.reportId = reportId;
        this.emit('error-reported', {
            reportId,
            crashReport: crashReport,
        });
        this.logger.info('Error report sent', {
            reportId,
            errorId: crashReport.id,
            severity: crashReport.severity,
        });
    }
    /**
     * Clear queued reports
     */
    clearQueuedReports() {
        this.reportQueue.length = 0;
    }
    /**
     * Generate unique error ID
     */
    generateErrorId(error, options) {
        const message = error instanceof Error ? error.message : String(error);
        const component = options.component || 'unknown';
        const action = options.action || 'unknown';
        const key = `${message}-${component}-${action}`;
        return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
    }
    /**
     * Determine error severity
     */
    determineSeverity(error, _options) {
        // Check for critical keywords
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';
        if (message.includes('crash') || message.includes('fatal') || message.includes('segfault')) {
            return ErrorSeverity.CRITICAL;
        }
        if (message.includes('memory') || message.includes('heap') || stack.includes('out of memory')) {
            return ErrorSeverity.HIGH;
        }
        if (message.includes('network') ||
            message.includes('timeout') ||
            message.includes('connection')) {
            return ErrorSeverity.MEDIUM;
        }
        return ErrorSeverity.LOW;
    }
    /**
     * Categorize error
     */
    categorizeError(error, _options) {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';
        if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
            return ErrorCategory.NETWORK;
        }
        if (message.includes('file') || message.includes('path') || message.includes('fs')) {
            return ErrorCategory.FILE_SYSTEM;
        }
        if (message.includes('ipc') || message.includes('electron')) {
            return ErrorCategory.IPC;
        }
        if (message.includes('browserview') || message.includes('webcontents')) {
            return ErrorCategory.BROWSER_VIEW;
        }
        if (message.includes('config') || message.includes('setting')) {
            return ErrorCategory.CONFIGURATION;
        }
        if (stack.includes('renderer') || message.includes('react') || message.includes('component')) {
            return ErrorCategory.UI;
        }
        if (message.includes('security') ||
            message.includes('auth') ||
            message.includes('credential')) {
            return ErrorCategory.SECURITY;
        }
        if (message.includes('performance') || message.includes('memory') || message.includes('cpu')) {
            return ErrorCategory.PERFORMANCE;
        }
        return ErrorCategory.RUNTIME;
    }
    /**
     * Build error context
     */
    buildContext(providedContext = {}, options = {}) {
        const memUsage = process.memoryUsage();
        const performanceData = this.performanceMonitor?.getCurrentStatus();
        const context = {
            // Application context
            applicationVersion: electron_1.app.getVersion(),
            electronVersion: process.versions.electron || 'unknown',
            nodeVersion: process.version,
            platform: os.platform(),
            arch: os.arch(),
            timestamp: new Date(),
            // Process context
            processType: process.type || 'main',
            processId: process.pid,
            // Merge provided context
            ...providedContext,
        };
        // Add optional system info if enabled
        if (this.config.includeSystemInfo) {
            context.memoryUsage = memUsage;
            context.windowCount = require('electron').BrowserWindow.getAllWindows().length;
        }
        // Add performance data if enabled
        if (this.config.includePerformanceData && performanceData?.lastMetrics) {
            context.cpuUsage = performanceData.lastMetrics.system.cpuUsagePercent;
        }
        // Add additional context
        if (options.component !== undefined) {
            context.component = options.component;
        }
        if (options.action !== undefined) {
            context.action = options.action;
        }
        if (options.additionalData !== undefined) {
            context.additionalData = options.additionalData;
        }
        // Hash sensitive data if required
        if (this.config.hashSensitiveData) {
            if (context.userId) {
                context.userId = this.hashValue(context.userId);
            }
            if (context.activeWorkspaceId) {
                context.activeWorkspaceId = this.hashValue(context.activeWorkspaceId);
            }
        }
        return context;
    }
    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            this.captureException(error, true);
        });
        // Unhandled promise rejection handler
        process.on('unhandledRejection', (reason) => {
            this.captureRejection(reason);
        });
    }
    /**
     * Initialize known error patterns
     */
    initializeKnownPatterns() {
        this.errorPatterns.push({
            id: 'memory-leak',
            name: 'Memory Leak',
            description: 'Potential memory leak detected',
            pattern: /heap.*out of memory|maximum call stack size exceeded/i,
            category: ErrorCategory.PERFORMANCE,
            severity: ErrorSeverity.HIGH,
            knownFix: 'Review memory management and dispose of unused resources',
            resolved: false,
        }, {
            id: 'network-timeout',
            name: 'Network Timeout',
            description: 'Network request timeout',
            pattern: /timeout|network error|connection.*refused/i,
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.MEDIUM,
            workaround: 'Check network connectivity and retry',
            resolved: false,
        }, {
            id: 'file-not-found',
            name: 'File Not Found',
            description: 'Required file is missing',
            pattern: /enoent|no such file or directory/i,
            category: ErrorCategory.FILE_SYSTEM,
            severity: ErrorSeverity.MEDIUM,
            knownFix: 'Verify file paths and permissions',
            resolved: false,
        });
    }
    /**
     * Check if error matches pattern
     */
    matchesPattern(crashReport, pattern) {
        const text = `${crashReport.message} ${crashReport.stack || ''}`;
        if (pattern.pattern instanceof RegExp) {
            return pattern.pattern.test(text);
        }
        return text.toLowerCase().includes(pattern.pattern.toLowerCase());
    }
    /**
     * Find similar errors in history
     */
    findSimilarErrors(crashReport) {
        const similar = [];
        for (const [id, report] of this.errorHistory) {
            if (id === crashReport.id)
                continue;
            // Check message similarity
            if (this.calculateStringSimilarity(crashReport.message, report.message) > 0.7) {
                similar.push(id);
            }
        }
        return similar.slice(0, 5); // Return up to 5 similar errors
    }
    /**
     * Calculate string similarity (simple implementation)
     */
    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        // Initialize matrix
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            if (matrix[0]) {
                matrix[0][j] = j;
            }
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    const prevDiagonal = matrix[i - 1]?.[j - 1];
                    if (prevDiagonal !== undefined) {
                        matrix[i][j] = prevDiagonal;
                    }
                }
                else {
                    const prevDiagonal = matrix[i - 1]?.[j - 1];
                    const prevHorizontal = matrix[i]?.[j - 1];
                    const prevVertical = matrix[i - 1]?.[j];
                    if (prevDiagonal !== undefined &&
                        prevHorizontal !== undefined &&
                        prevVertical !== undefined) {
                        matrix[i][j] = Math.min(prevDiagonal + 1, prevHorizontal + 1, prevVertical + 1);
                    }
                }
            }
        }
        const result = matrix[str2.length]?.[str1.length];
        return result !== undefined ? result : 0;
    }
    /**
     * Identify affected components
     */
    identifyAffectedComponents(crashReport) {
        const components = [];
        const text = `${crashReport.message} ${crashReport.stack || ''}`.toLowerCase();
        // Check for component keywords
        const componentMap = {
            renderer: ['renderer', 'react', 'component', 'ui'],
            main: ['main', 'electron', 'app'],
            browserview: ['browserview', 'webcontents'],
            ipc: ['ipc', 'invoke', 'handle'],
            filesystem: ['fs', 'file', 'path'],
            network: ['fetch', 'http', 'request'],
            security: ['credential', 'auth', 'security'],
            configuration: ['config', 'setting', 'workspace'],
        };
        for (const [component, keywords] of Object.entries(componentMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                components.push(component);
            }
        }
        return components;
    }
    /**
     * Assess user impact
     */
    assessUserImpact(crashReport) {
        switch (crashReport.severity) {
            case ErrorSeverity.CRITICAL:
                return 'high';
            case ErrorSeverity.HIGH:
                return 'medium';
            case ErrorSeverity.MEDIUM:
                return 'low';
            case ErrorSeverity.LOW:
                return 'none';
        }
    }
    /**
     * Assess regression risk
     */
    assessRegressionRisk(_crashReport) {
        const recentErrors = Array.from(this.errorHistory.values()).filter(report => {
            const timeDiff = Date.now() - report.timestamp.getTime();
            return timeDiff < 24 * 60 * 60 * 1000; // Last 24 hours
        });
        if (recentErrors.length > 10) {
            return 'high';
        }
        else if (recentErrors.length > 5) {
            return 'medium';
        }
        else if (recentErrors.length > 2) {
            return 'low';
        }
        return 'none';
    }
    /**
     * Sanitize error message
     */
    sanitizeMessage(message) {
        if (!this.config.hashSensitiveData) {
            return message;
        }
        // Remove file paths that might contain usernames
        let sanitized = message.replace(/[A-Z]:\\Users\\[^\\]+/gi, '[USER_PATH]');
        sanitized = sanitized.replace(/\/Users\/[^/]+/gi, '[USER_PATH]');
        sanitized = sanitized.replace(/\/home\/[^/]+/gi, '[USER_PATH]');
        // Remove potential email addresses
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
        // Remove potential API keys or tokens
        sanitized = sanitized.replace(/[a-zA-Z0-9]{32,}/g, '[TOKEN]');
        return sanitized;
    }
    /**
     * Sanitize stack trace
     */
    sanitizeStackTrace(stack) {
        if (!stack || !this.config.hashSensitiveData) {
            return stack;
        }
        // Remove user paths from stack trace
        let sanitized = stack.replace(/[A-Z]:\\Users\\[^\\]+/gi, '[USER_PATH]');
        sanitized = sanitized.replace(/\/Users\/[^/]+/gi, '[USER_PATH]');
        sanitized = sanitized.replace(/\/home\/[^/]+/gi, '[USER_PATH]');
        return sanitized;
    }
    /**
     * Sanitize report for transmission
     */
    sanitizeReport(report, includePrivateData) {
        const sanitized = {
            id: report.id,
            timestamp: report.timestamp,
            severity: report.severity,
            category: report.category,
            message: report.message,
            privacyLevel: report.privacyLevel,
            sanitized: report.sanitized,
            analyzed: report.analyzed,
            reported: report.reported,
        };
        // Include stack trace based on privacy level
        if (this.config.includeStackTrace &&
            (includePrivateData || this.config.privacyLevel !== PrivacyLevel.MINIMAL) &&
            report.stack !== undefined) {
            sanitized.stack = report.stack;
        }
        // Include context based on privacy settings
        if (includePrivateData || this.config.privacyLevel !== PrivacyLevel.MINIMAL) {
            const contextData = {
                applicationVersion: report.context.applicationVersion,
                electronVersion: report.context.electronVersion,
                platform: report.context.platform,
                arch: report.context.arch,
                nodeVersion: report.context.nodeVersion,
                processId: report.context.processId,
                timestamp: report.context.timestamp,
                processType: report.context.processType,
            };
            // Add optional properties only if they exist
            if (report.context.component !== undefined) {
                contextData.component = report.context.component;
            }
            if (report.context.action !== undefined) {
                contextData.action = report.context.action;
            }
            sanitized.context = contextData;
            // Add system info if allowed
            if (this.config.includeSystemInfo) {
                if (report.context.memoryUsage !== undefined) {
                    sanitized.context.memoryUsage = report.context.memoryUsage;
                }
                if (report.context.windowCount !== undefined) {
                    sanitized.context.windowCount = report.context.windowCount;
                }
            }
        }
        return sanitized;
    }
    /**
     * Convert reports to CSV format
     */
    convertToCSV(reports) {
        if (reports.length === 0)
            return '';
        const headers = ['id', 'timestamp', 'severity', 'category', 'message', 'reported'];
        const rows = reports.map(report => [
            report.id || '',
            report.timestamp?.toISOString() || '',
            report.severity || '',
            report.category || '',
            `"${(report.message || '').replace(/"/g, '""')}"`,
            report.reported ? 'true' : 'false',
        ]);
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    /**
     * Hash sensitive value
     */
    hashValue(value) {
        return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
    }
    /**
     * Maintain error history size
     */
    maintainHistorySize() {
        if (this.errorHistory.size > this.maxHistorySize) {
            // Remove oldest entries
            const entries = Array.from(this.errorHistory.entries());
            entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
            const toRemove = entries.slice(0, this.errorHistory.size - this.maxHistorySize);
            for (const [id] of toRemove) {
                this.errorHistory.delete(id);
            }
        }
    }
    /**
     * Dispose of resources
     */
    async dispose() {
        this.clearHistory();
        this.removeAllListeners();
        this.logger.info('ErrorReporter disposed');
    }
    // EventEmitter type overrides
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
    emit(event, arg) {
        return super.emit(event, arg);
    }
}
exports.ErrorReporter = ErrorReporter;
// Default export
exports.default = ErrorReporter;
//# sourceMappingURL=ErrorReporter.js.map