"use strict";
/**
 * @fileoverview Application Logger - Comprehensive logging system with file rotation,
 * performance metrics, and security event tracking
 * @version 1.0.0
 * @author GetWarped Development Team
 * @since 2024
 */
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
exports.logger = exports.ApplicationLogger = exports.LogCategory = exports.LogLevel = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const electron_1 = require("electron");
const crypto_1 = require("crypto");
/**
 * Log severity levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["TRACE"] = 0] = "TRACE";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 5] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Log categories for filtering and routing
 */
var LogCategory;
(function (LogCategory) {
    LogCategory["APPLICATION"] = "application";
    LogCategory["SECURITY"] = "security";
    LogCategory["PERFORMANCE"] = "performance";
    LogCategory["IPC"] = "ipc";
    LogCategory["FILESYSTEM"] = "filesystem";
    LogCategory["NETWORK"] = "network";
    LogCategory["UI"] = "ui";
    LogCategory["DATABASE"] = "database";
    LogCategory["AUTHENTICATION"] = "authentication";
    LogCategory["CONFIGURATION"] = "configuration";
})(LogCategory || (exports.LogCategory = LogCategory = {}));
/**
 * Default log formatter - JSON format
 */
class JSONFormatter {
    format(entry) {
        const output = {
            id: entry.id,
            timestamp: entry.timestamp.toISOString(),
            level: LogLevel[entry.level],
            category: entry.category,
            message: entry.message,
            ...(entry.data && { data: entry.data }),
            ...(entry.error && {
                error: {
                    name: entry.error.name,
                    message: entry.error.message,
                    stack: entry.error.stack,
                },
            }),
            ...(entry.context && { context: entry.context }),
            ...(entry.sessionId && { sessionId: entry.sessionId }),
            ...(entry.userId && { userId: entry.userId }),
            ...(entry.stackTrace && { stackTrace: entry.stackTrace }),
        };
        return JSON.stringify(output) + '\n';
    }
}
/**
 * Human-readable log formatter
 */
class TextFormatter {
    format(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level].padEnd(5);
        const category = entry.category.padEnd(12);
        let output = `[${timestamp}] ${level} ${category} ${entry.message}`;
        if (entry.data) {
            output += ` | Data: ${JSON.stringify(entry.data)}`;
        }
        if (entry.error) {
            output += ` | Error: ${entry.error.message}`;
            if (entry.error.stack) {
                output += `\n${entry.error.stack}`;
            }
        }
        if (entry.context?.module) {
            output += ` | Module: ${entry.context.module}`;
        }
        return output + '\n';
    }
}
/**
 * Console transport for development
 */
/* eslint-disable no-console */
class ConsoleTransport {
    formatter;
    constructor(formatter = new TextFormatter()) {
        this.formatter = formatter;
    }
    async write(entry) {
        const formatted = this.formatter.format(entry).trim();
        switch (entry.level) {
            case LogLevel.TRACE:
            case LogLevel.DEBUG:
                console.debug(formatted);
                break;
            case LogLevel.INFO:
                console.info(formatted);
                break;
            case LogLevel.WARN:
                console.warn(formatted);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(formatted);
                break;
        }
    }
    async flush() {
        // Console doesn't need explicit flushing
    }
    async close() {
        // Console doesn't need cleanup
    }
}
/* eslint-enable no-console */
/**
 * File transport with rotation support
 */
class FileTransport extends events_1.EventEmitter {
    config;
    formatter;
    writeStream;
    currentLogFile;
    currentFileSize = 0;
    rotationInProgress = false;
    constructor(config, formatter = new JSONFormatter()) {
        super();
        this.config = config;
        this.formatter = formatter;
        this.currentLogFile = this.generateLogFileName();
    }
    async write(entry) {
        if (!this.writeStream) {
            await this.initializeStream();
        }
        const formatted = this.formatter.format(entry);
        const size = Buffer.byteLength(formatted, 'utf8');
        // Check if rotation is needed
        if (this.currentFileSize + size > this.config.rotation.maxFileSize &&
            !this.rotationInProgress) {
            await this.rotateLog();
        }
        return new Promise((resolve, reject) => {
            if (!this.writeStream) {
                reject(new Error('Write stream not initialized'));
                return;
            }
            this.writeStream.write(formatted, 'utf8', error => {
                if (error) {
                    reject(error);
                }
                else {
                    this.currentFileSize += size;
                    resolve();
                }
            });
        });
    }
    async flush() {
        if (this.writeStream) {
            return new Promise((resolve, reject) => {
                this.writeStream.end((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
    }
    async close() {
        if (this.writeStream) {
            await this.flush();
            this.writeStream = undefined;
        }
    }
    async initializeStream() {
        try {
            // Ensure log directory exists
            await fs_1.promises.mkdir(path.dirname(this.currentLogFile), { recursive: true });
            // Check current file size if file exists
            try {
                const stats = await fs_1.promises.stat(this.currentLogFile);
                this.currentFileSize = stats.size;
            }
            catch {
                this.currentFileSize = 0;
            }
            this.writeStream = (0, fs_1.createWriteStream)(this.currentLogFile, { flags: 'a' });
            this.writeStream.on('error', error => {
                this.emit('error', 'Log file write error', error);
                this.writeStream = undefined;
            });
        }
        catch (error) {
            throw new Error(`Failed to initialize log file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async rotateLog() {
        this.rotationInProgress = true;
        try {
            // Close current stream
            if (this.writeStream) {
                await new Promise(resolve => {
                    this.writeStream.end(() => resolve());
                });
                this.writeStream = undefined;
            }
            // Rotate existing files
            await this.rotateExistingFiles();
            // Create new log file
            this.currentLogFile = this.generateLogFileName();
            this.currentFileSize = 0;
            // Initialize new stream
            await this.initializeStream();
            // Cleanup old files
            await this.cleanupOldFiles();
        }
        catch (error) {
            this.emit('error', 'Log rotation failed', error);
        }
        finally {
            this.rotationInProgress = false;
        }
    }
    async rotateExistingFiles() {
        const baseName = path.basename(this.currentLogFile, '.log');
        const dir = path.dirname(this.currentLogFile);
        // Rotate numbered files (app.log.2 -> app.log.3, app.log.1 -> app.log.2, etc.)
        for (let i = this.config.rotation.maxFiles - 1; i > 0; i--) {
            const oldFile = path.join(dir, `${baseName}.log.${i}`);
            const newFile = path.join(dir, `${baseName}.log.${i + 1}`);
            try {
                await fs_1.promises.access(oldFile);
                if (i === this.config.rotation.maxFiles - 1) {
                    // Delete the oldest file
                    await fs_1.promises.unlink(oldFile);
                }
                else {
                    // Rename to next number
                    await fs_1.promises.rename(oldFile, newFile);
                }
            }
            catch {
                // File doesn't exist, continue
            }
        }
        // Move current file to .1
        try {
            const rotatedFile = path.join(dir, `${baseName}.log.1`);
            await fs_1.promises.rename(this.currentLogFile, rotatedFile);
            // Compress if enabled
            if (this.config.rotation.compressOldFiles) {
                await this.compressFile(rotatedFile);
            }
        }
        catch (error) {
            this.emit('warn', 'Failed to rotate current log file', error);
        }
    }
    async compressFile(filePath) {
        // Implementation would use zlib to compress the file
        // For now, we'll skip compression to avoid additional dependencies
        this.emit('debug', `Log compression requested for ${filePath} (not implemented)`);
    }
    async cleanupOldFiles() {
        if (this.config.rotation.cleanupDays <= 0)
            return;
        try {
            const dir = path.dirname(this.currentLogFile);
            const files = await fs_1.promises.readdir(dir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.rotation.cleanupDays);
            for (const file of files) {
                if (file.includes('.log')) {
                    const filePath = path.join(dir, file);
                    const stats = await fs_1.promises.stat(filePath);
                    if (stats.mtime < cutoffDate) {
                        await fs_1.promises.unlink(filePath);
                        this.emit('debug', `Cleaned up old log file: ${file}`);
                    }
                }
            }
        }
        catch (error) {
            this.emit('warn', 'Log cleanup failed', error);
        }
    }
    generateLogFileName() {
        const now = new Date();
        const dateStr = this.config.rotation.rotateDaily ? now.toISOString().split('T')[0] : '';
        const baseName = dateStr ? `app-${dateStr}.log` : 'app.log';
        return path.join(this.config.logDirectory, baseName);
    }
}
/**
 * Main application logger with comprehensive features
 */
class ApplicationLogger extends events_1.EventEmitter {
    config;
    transports = [];
    logBuffer = [];
    performanceMetrics = [];
    flushTimer;
    metricsTimer;
    lastCpuUsage;
    logCount = 0;
    errorCount = 0;
    startTime = new Date();
    constructor(config = {}) {
        super();
        this.config = {
            logLevel: LogLevel.INFO,
            logDirectory: path.join(electron_1.app.getPath('logs')),
            maxLogSize: 100 * 1024 * 1024, // 100MB
            enableConsole: process.env['NODE_ENV'] !== 'production',
            enableFile: true,
            enableMetrics: true,
            bufferSize: 100,
            flushInterval: 5000,
            rotation: {
                maxFileSize: 50 * 1024 * 1024, // 50MB
                maxFiles: 10,
                rotateDaily: true,
                compressOldFiles: false,
                cleanupDays: 30,
            },
            categories: Object.values(LogCategory),
            ...config,
        };
        this.initializeTransports();
        this.startPeriodicFlush();
        this.startMetricsCollection();
    }
    /**
     * Log a trace message
     */
    trace(message, data, context) {
        this.log(LogLevel.TRACE, LogCategory.APPLICATION, message, data, undefined, context);
    }
    /**
     * Log a debug message
     */
    debug(message, data, context) {
        this.log(LogLevel.DEBUG, LogCategory.APPLICATION, message, data, undefined, context);
    }
    /**
     * Log an info message
     */
    info(message, data, context) {
        this.log(LogLevel.INFO, LogCategory.APPLICATION, message, data, undefined, context);
    }
    /**
     * Log a warning message
     */
    warn(message, data, context) {
        this.log(LogLevel.WARN, LogCategory.APPLICATION, message, data, undefined, context);
    }
    /**
     * Log an error message
     */
    error(message, error, data, context) {
        this.log(LogLevel.ERROR, LogCategory.APPLICATION, message, data, error, context);
        this.errorCount++;
    }
    /**
     * Log a fatal error message
     */
    fatal(message, error, data, context) {
        this.log(LogLevel.FATAL, LogCategory.APPLICATION, message, data, error, context);
        this.errorCount++;
    }
    /**
     * Log with specific category
     */
    logCategory(level, category, message, data, error, context) {
        this.log(level, category, message, data, error, context);
    }
    /**
     * Log a security event
     */
    security(level, message, data, context) {
        this.log(level, LogCategory.SECURITY, message, data, undefined, context);
    }
    /**
     * Log a performance event
     */
    performance(message, duration, data, context) {
        const perfData = { ...data, duration, unit: 'ms' };
        this.log(LogLevel.INFO, LogCategory.PERFORMANCE, message, perfData, undefined, context);
    }
    /**
     * Core logging method
     */
    log(level, category, message, data, error, context) {
        // Check log level
        if (level < this.config.logLevel) {
            return;
        }
        // Check category filter
        if (!this.config.categories.includes(category)) {
            return;
        }
        // Create log entry
        const entry = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            level,
            category,
            message,
            ...(data && { data }),
            ...(error && { error }),
            context: {
                ...context,
                pid: process.pid,
                threadId: this.getThreadId(),
            },
            ...(error?.stack && { stackTrace: error.stack }),
            ...(level >= LogLevel.ERROR && !error && { stackTrace: this.getStackTrace() }),
        };
        // Add to buffer
        this.logBuffer.push(entry);
        this.logCount++;
        // Emit event
        this.emit('log-entry', entry);
        // Flush if buffer is full or critical level
        if (this.logBuffer.length >= this.config.bufferSize || level >= LogLevel.ERROR) {
            this.flush();
        }
    }
    /**
     * Flush log buffer to all transports
     */
    async flush() {
        if (this.logBuffer.length === 0)
            return;
        const entries = this.logBuffer.splice(0);
        try {
            await Promise.all(this.transports.map(transport => Promise.all(entries.map(entry => transport.write(entry)))));
            // Flush all transports
            await Promise.all(this.transports.map(transport => transport.flush()));
            this.emit('logs-flushed', { count: entries.length });
        }
        catch (error) {
            this.emit('flush-error', error);
            // Put entries back in buffer for retry
            this.logBuffer.unshift(...entries);
        }
    }
    /**
     * Get current performance metrics
     */
    getMetrics() {
        const now = new Date();
        const uptime = (now.getTime() - this.startTime.getTime()) / 1000;
        const logRate = this.logCount / uptime;
        const errorRate = this.errorCount / Math.max(this.logCount, 1);
        return {
            timestamp: now,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(this.lastCpuUsage),
            eventLoopDelay: this.getEventLoopDelay(),
            activeHandles: process._getActiveHandles().length,
            activeRequests: process._getActiveRequests().length,
            uptime,
            logEntriesPerSecond: logRate,
            errorRate,
        };
    }
    /**
     * Get recent performance metrics history
     */
    getMetricsHistory(minutes = 60) {
        const cutoff = new Date();
        cutoff.setMinutes(cutoff.getMinutes() - minutes);
        return this.performanceMetrics.filter(m => m.timestamp >= cutoff);
    }
    /**
     * Get log statistics
     */
    getStatistics() {
        const uptime = (new Date().getTime() - this.startTime.getTime()) / 1000;
        return {
            totalLogs: this.logCount,
            totalErrors: this.errorCount,
            logsPerSecond: this.logCount / uptime,
            errorRate: this.errorCount / Math.max(this.logCount, 1),
            bufferSize: this.logBuffer.length,
            uptime,
            memoryUsage: process.memoryUsage(),
            transportCount: this.transports.length,
        };
    }
    /**
     * Close logger and cleanup resources
     */
    async close() {
        // Stop timers
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
        // Flush remaining logs
        await this.flush();
        // Close all transports
        await Promise.all(this.transports.map(transport => transport.close()));
        this.emit('logger-closed');
    }
    /**
     * Initialize transports based on configuration
     */
    initializeTransports() {
        if (this.config.enableConsole) {
            this.transports.push(new ConsoleTransport());
        }
        if (this.config.enableFile) {
            this.transports.push(new FileTransport(this.config));
        }
    }
    /**
     * Start periodic buffer flushing
     */
    startPeriodicFlush() {
        this.flushTimer = setInterval(() => {
            this.flush().catch(error => {
                this.emit('flush-error', error);
            });
        }, this.config.flushInterval);
    }
    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        if (!this.config.enableMetrics)
            return;
        this.metricsTimer = setInterval(() => {
            try {
                const metrics = this.getMetrics();
                this.performanceMetrics.push(metrics);
                // Keep only last 24 hours of metrics
                const cutoff = new Date();
                cutoff.setHours(cutoff.getHours() - 24);
                const index = this.performanceMetrics.findIndex(m => m.timestamp >= cutoff);
                if (index > 0) {
                    this.performanceMetrics.splice(0, index);
                }
                this.lastCpuUsage = process.cpuUsage();
                this.emit('metrics-collected', metrics);
            }
            catch (error) {
                this.emit('metrics-error', error);
            }
        }, 60000); // Collect every minute
    }
    /**
     * Get current thread ID (simplified)
     */
    getThreadId() {
        return `main-${process.pid}`;
    }
    /**
     * Get current stack trace
     */
    getStackTrace() {
        const stack = new Error().stack;
        if (!stack)
            return '';
        const lines = stack.split('\n');
        // Remove the first two lines (Error and this function)
        return lines.slice(3).join('\n');
    }
    /**
     * Measure event loop delay (simplified approximation)
     */
    getEventLoopDelay() {
        const start = process.hrtime.bigint();
        setImmediate(() => {
            const delay = Number(process.hrtime.bigint() - start) / 1000000;
            return delay;
        });
        return 0; // Simplified - real implementation would use async measurement
    }
}
exports.ApplicationLogger = ApplicationLogger;
// Default logger instance
exports.logger = new ApplicationLogger();
//# sourceMappingURL=ApplicationLogger.js.map