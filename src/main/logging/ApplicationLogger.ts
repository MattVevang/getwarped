/**
 * @fileoverview Application Logger - Comprehensive logging system with file rotation,
 * performance metrics, and security event tracking
 * @version 1.0.0
 * @author GetWarped Development Team
 * @since 2024
 */

import { EventEmitter } from 'events';
import { promises as fs, createWriteStream, WriteStream } from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { randomUUID } from 'crypto';

/**
 * Log severity levels
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

/**
 * Log categories for filtering and routing
 */
export enum LogCategory {
  APPLICATION = 'application',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  IPC = 'ipc',
  FILESYSTEM = 'filesystem',
  NETWORK = 'network',
  UI = 'ui',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  CONFIGURATION = 'configuration',
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
  readonly maxFileSize: number; // in bytes
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
 * Default log formatter - JSON format
 */
class JSONFormatter implements LogFormatter {
  format(entry: LogEntry): string {
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
class TextFormatter implements LogFormatter {
  format(entry: LogEntry): string {
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
class ConsoleTransport implements LogTransport {
  private readonly formatter: LogFormatter;

  constructor(formatter: LogFormatter = new TextFormatter()) {
    this.formatter = formatter;
  }

  async write(entry: LogEntry): Promise<void> {
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

  async flush(): Promise<void> {
    // Console doesn't need explicit flushing
  }

  async close(): Promise<void> {
    // Console doesn't need cleanup
  }
}
/* eslint-enable no-console */

/**
 * File transport with rotation support
 */
class FileTransport extends EventEmitter implements LogTransport {
  private readonly config: LoggerConfig;
  private readonly formatter: LogFormatter;
  private writeStream?: WriteStream | undefined;
  private currentLogFile: string;
  private currentFileSize: number = 0;
  private rotationInProgress: boolean = false;

  constructor(config: LoggerConfig, formatter: LogFormatter = new JSONFormatter()) {
    super();
    this.config = config;
    this.formatter = formatter;
    this.currentLogFile = this.generateLogFileName();
  }

  async write(entry: LogEntry): Promise<void> {
    if (!this.writeStream) {
      await this.initializeStream();
    }

    const formatted = this.formatter.format(entry);
    const size = Buffer.byteLength(formatted, 'utf8');

    // Check if rotation is needed
    if (
      this.currentFileSize + size > this.config.rotation.maxFileSize &&
      !this.rotationInProgress
    ) {
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
        } else {
          this.currentFileSize += size;
          resolve();
        }
      });
    });
  }

  async flush(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve, reject) => {
        this.writeStream!.end((error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      await this.flush();
      this.writeStream = undefined;
    }
  }

  private async initializeStream(): Promise<void> {
    try {
      // Ensure log directory exists
      await fs.mkdir(path.dirname(this.currentLogFile), { recursive: true });

      // Check current file size if file exists
      try {
        const stats = await fs.stat(this.currentLogFile);
        this.currentFileSize = stats.size;
      } catch {
        this.currentFileSize = 0;
      }

      this.writeStream = createWriteStream(this.currentLogFile, { flags: 'a' });

      this.writeStream.on('error', error => {
        this.emit('error', 'Log file write error', error);
        this.writeStream = undefined;
      });
    } catch (error) {
      throw new Error(
        `Failed to initialize log file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async rotateLog(): Promise<void> {
    this.rotationInProgress = true;

    try {
      // Close current stream
      if (this.writeStream) {
        await new Promise<void>(resolve => {
          this.writeStream!.end(() => resolve());
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
    } catch (error) {
      this.emit('error', 'Log rotation failed', error);
    } finally {
      this.rotationInProgress = false;
    }
  }

  private async rotateExistingFiles(): Promise<void> {
    const baseName = path.basename(this.currentLogFile, '.log');
    const dir = path.dirname(this.currentLogFile);

    // Rotate numbered files (app.log.2 -> app.log.3, app.log.1 -> app.log.2, etc.)
    for (let i = this.config.rotation.maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(dir, `${baseName}.log.${i}`);
      const newFile = path.join(dir, `${baseName}.log.${i + 1}`);

      try {
        await fs.access(oldFile);
        if (i === this.config.rotation.maxFiles - 1) {
          // Delete the oldest file
          await fs.unlink(oldFile);
        } else {
          // Rename to next number
          await fs.rename(oldFile, newFile);
        }
      } catch {
        // File doesn't exist, continue
      }
    }

    // Move current file to .1
    try {
      const rotatedFile = path.join(dir, `${baseName}.log.1`);
      await fs.rename(this.currentLogFile, rotatedFile);

      // Compress if enabled
      if (this.config.rotation.compressOldFiles) {
        await this.compressFile(rotatedFile);
      }
    } catch (error) {
      this.emit('warn', 'Failed to rotate current log file', error);
    }
  }

  private async compressFile(filePath: string): Promise<void> {
    // Implementation would use zlib to compress the file
    // For now, we'll skip compression to avoid additional dependencies
    this.emit('debug', `Log compression requested for ${filePath} (not implemented)`);
  }

  private async cleanupOldFiles(): Promise<void> {
    if (this.config.rotation.cleanupDays <= 0) return;

    try {
      const dir = path.dirname(this.currentLogFile);
      const files = await fs.readdir(dir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.rotation.cleanupDays);

      for (const file of files) {
        if (file.includes('.log')) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            this.emit('debug', `Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      this.emit('warn', 'Log cleanup failed', error);
    }
  }

  private generateLogFileName(): string {
    const now = new Date();
    const dateStr = this.config.rotation.rotateDaily ? now.toISOString().split('T')[0] : '';

    const baseName = dateStr ? `app-${dateStr}.log` : 'app.log';
    return path.join(this.config.logDirectory, baseName);
  }
}

/**
 * Main application logger with comprehensive features
 */
export class ApplicationLogger extends EventEmitter {
  private readonly config: LoggerConfig;
  private readonly transports: LogTransport[] = [];
  private readonly logBuffer: LogEntry[] = [];
  private readonly performanceMetrics: PerformanceMetrics[] = [];
  private flushTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;
  private lastCpuUsage?: NodeJS.CpuUsage;
  private logCount: number = 0;
  private errorCount: number = 0;
  private startTime: Date = new Date();

  constructor(config: Partial<LoggerConfig> = {}) {
    super();

    this.config = {
      logLevel: LogLevel.INFO,
      logDirectory: path.join(app.getPath('logs')),
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
  trace(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.log(LogLevel.TRACE, LogCategory.APPLICATION, message, data, undefined, context);
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.log(LogLevel.DEBUG, LogCategory.APPLICATION, message, data, undefined, context);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.log(LogLevel.INFO, LogCategory.APPLICATION, message, data, undefined, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, any>, context?: LogContext): void {
    this.log(LogLevel.WARN, LogCategory.APPLICATION, message, data, undefined, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, data?: Record<string, any>, context?: LogContext): void {
    this.log(LogLevel.ERROR, LogCategory.APPLICATION, message, data, error, context);
    this.errorCount++;
  }

  /**
   * Log a fatal error message
   */
  fatal(message: string, error?: Error, data?: Record<string, any>, context?: LogContext): void {
    this.log(LogLevel.FATAL, LogCategory.APPLICATION, message, data, error, context);
    this.errorCount++;
  }

  /**
   * Log with specific category
   */
  logCategory(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    error?: Error,
    context?: LogContext
  ): void {
    this.log(level, category, message, data, error, context);
  }

  /**
   * Log a security event
   */
  security(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    this.log(level, LogCategory.SECURITY, message, data, undefined, context);
  }

  /**
   * Log a performance event
   */
  performance(
    message: string,
    duration: number,
    data?: Record<string, any>,
    context?: LogContext
  ): void {
    const perfData = { ...data, duration, unit: 'ms' };
    this.log(LogLevel.INFO, LogCategory.PERFORMANCE, message, perfData, undefined, context);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, any>,
    error?: Error,
    context?: LogContext
  ): void {
    // Check log level
    if (level < this.config.logLevel) {
      return;
    }

    // Check category filter
    if (!this.config.categories.includes(category)) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      id: randomUUID(),
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
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const entries = this.logBuffer.splice(0);

    try {
      await Promise.all(
        this.transports.map(transport => Promise.all(entries.map(entry => transport.write(entry))))
      );

      // Flush all transports
      await Promise.all(this.transports.map(transport => transport.flush()));

      this.emit('logs-flushed', { count: entries.length });
    } catch (error) {
      this.emit('flush-error', error);

      // Put entries back in buffer for retry
      this.logBuffer.unshift(...entries);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const now = new Date();
    const uptime = (now.getTime() - this.startTime.getTime()) / 1000;
    const logRate = this.logCount / uptime;
    const errorRate = this.errorCount / Math.max(this.logCount, 1);

    return {
      timestamp: now,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(this.lastCpuUsage),
      eventLoopDelay: this.getEventLoopDelay(),
      activeHandles: (process as any)._getActiveHandles().length,
      activeRequests: (process as any)._getActiveRequests().length,
      uptime,
      logEntriesPerSecond: logRate,
      errorRate,
    };
  }

  /**
   * Get recent performance metrics history
   */
  getMetricsHistory(minutes: number = 60): PerformanceMetrics[] {
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
  async close(): Promise<void> {
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
  private initializeTransports(): void {
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
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        this.emit('flush-error', error);
      });
    }, this.config.flushInterval);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.config.enableMetrics) return;

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
      } catch (error) {
        this.emit('metrics-error', error);
      }
    }, 60000); // Collect every minute
  }

  /**
   * Get current thread ID (simplified)
   */
  private getThreadId(): string {
    return `main-${process.pid}`;
  }

  /**
   * Get current stack trace
   */
  private getStackTrace(): string {
    const stack = new Error().stack;
    if (!stack) return '';

    const lines = stack.split('\n');
    // Remove the first two lines (Error and this function)
    return lines.slice(3).join('\n');
  }

  /**
   * Measure event loop delay (simplified approximation)
   */
  private getEventLoopDelay(): number {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000;
      return delay;
    });
    return 0; // Simplified - real implementation would use async measurement
  }
}

// Default logger instance
export const logger = new ApplicationLogger();
