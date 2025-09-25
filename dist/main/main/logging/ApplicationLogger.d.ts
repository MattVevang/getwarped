/**
 * @fileoverview Application Logger - Comprehensive logging system with file rotation,
 * performance metrics, and security event tracking
 * @version 1.0.0
 * @author GetWarped Development Team
 * @since 2024
 */
import { EventEmitter } from 'events';
/**
 * Log severity levels
 */
export declare enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}
/**
 * Log categories for filtering and routing
 */
export declare enum LogCategory {
    APPLICATION = "application",
    SECURITY = "security",
    PERFORMANCE = "performance",
    IPC = "ipc",
    FILESYSTEM = "filesystem",
    NETWORK = "network",
    UI = "ui",
    DATABASE = "database",
    AUTHENTICATION = "authentication",
    CONFIGURATION = "configuration"
}
/**
 * Log entry structure
 */
export interface LogEntry {
    readonly id: string;
    readonly timestamp: Date;
    readonly level: LogLevel;
    readonly category: LogCategory;
    readonly message: string;
    readonly data?: Record<string, any>;
    readonly error?: Error;
    readonly context?: LogContext;
    readonly sessionId?: string;
    readonly userId?: string;
    readonly stackTrace?: string;
}
/**
 * Contextual information for log entries
 */
export interface LogContext {
    readonly module?: string;
    readonly function?: string;
    readonly file?: string;
    readonly line?: number;
    readonly pid?: number;
    readonly threadId?: string;
    readonly requestId?: string;
    readonly operationId?: string;
}
/**
 * Log rotation configuration
 */
export interface LogRotationConfig {
    readonly maxFileSize: number;
    readonly maxFiles: number;
    readonly rotateDaily: boolean;
    readonly compressOldFiles: boolean;
    readonly cleanupDays: number;
}
/**
 * Logger configuration
 */
export interface LoggerConfig {
    readonly logLevel: LogLevel;
    readonly logDirectory: string;
    readonly maxLogSize: number;
    readonly enableConsole: boolean;
    readonly enableFile: boolean;
    readonly enableMetrics: boolean;
    readonly bufferSize: number;
    readonly flushInterval: number;
    readonly rotation: LogRotationConfig;
    readonly categories: LogCategory[];
}
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    readonly timestamp: Date;
    readonly memoryUsage: NodeJS.MemoryUsage;
    readonly cpuUsage: NodeJS.CpuUsage;
    readonly eventLoopDelay: number;
    readonly activeHandles: number;
    readonly activeRequests: number;
    readonly uptime: number;
    readonly logEntriesPerSecond: number;
    readonly errorRate: number;
}
/**
 * Log formatter interface
 */
export interface LogFormatter {
    format(entry: LogEntry): string;
}
/**
 * Log transport interface
 */
export interface LogTransport {
    write(entry: LogEntry): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
/**
 * Main application logger with comprehensive features
 */
export declare class ApplicationLogger extends EventEmitter {
    private readonly config;
    private readonly transports;
    private readonly logBuffer;
    private readonly performanceMetrics;
    private flushTimer?;
    private metricsTimer?;
    private lastCpuUsage?;
    private logCount;
    private errorCount;
    private startTime;
    constructor(config?: Partial<LoggerConfig>);
    /**
     * Log a trace message
     */
    trace(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log a debug message
     */
    debug(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log an info message
     */
    info(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log a warning message
     */
    warn(message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log an error message
     */
    error(message: string, error?: Error, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log a fatal error message
     */
    fatal(message: string, error?: Error, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log with specific category
     */
    logCategory(level: LogLevel, category: LogCategory, message: string, data?: Record<string, any>, error?: Error, context?: LogContext): void;
    /**
     * Log a security event
     */
    security(level: LogLevel, message: string, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Log a performance event
     */
    performance(message: string, duration: number, data?: Record<string, any>, context?: LogContext): void;
    /**
     * Core logging method
     */
    private log;
    /**
     * Flush log buffer to all transports
     */
    flush(): Promise<void>;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get recent performance metrics history
     */
    getMetricsHistory(minutes?: number): PerformanceMetrics[];
    /**
     * Get log statistics
     */
    getStatistics(): {
        totalLogs: number;
        totalErrors: number;
        logsPerSecond: number;
        errorRate: number;
        bufferSize: number;
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
        transportCount: number;
    };
    /**
     * Close logger and cleanup resources
     */
    close(): Promise<void>;
    /**
     * Initialize transports based on configuration
     */
    private initializeTransports;
    /**
     * Start periodic buffer flushing
     */
    private startPeriodicFlush;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Get current thread ID (simplified)
     */
    private getThreadId;
    /**
     * Get current stack trace
     */
    private getStackTrace;
    /**
     * Measure event loop delay (simplified approximation)
     */
    private getEventLoopDelay;
}
export declare const logger: ApplicationLogger;
//# sourceMappingURL=ApplicationLogger.d.ts.map