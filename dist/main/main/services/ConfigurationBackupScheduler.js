"use strict";
/**
 * Configuration Backup Scheduler
 *
 * Manages automated configuration backup scheduling with user-configurable intervals.
 * Provides notifications and prompts for regular configuration exports to prevent data loss.
 *
 * @fileoverview Automated backup scheduling and reminder system
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
exports.ConfigurationBackupScheduler = void 0;
const events_1 = require("events");
/**
 * Configuration backup scheduler service
 * Manages automated backup reminders and scheduling
 */
class ConfigurationBackupScheduler extends events_1.EventEmitter {
    configurationManager;
    configurationExporter;
    scheduleTimer;
    isActive = false;
    config;
    constructor(configurationManager, configurationExporter, initialConfig) {
        super();
        this.configurationManager = configurationManager;
        this.configurationExporter = configurationExporter;
        // Default configuration
        this.config = {
            enabled: true,
            intervalDays: 7, // Weekly reminders by default
            remindOnStartup: true,
            automaticBackup: false,
            maxBackupFiles: 5,
            ...initialConfig,
        };
    }
    /**
     * Start the backup scheduler
     */
    async start() {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        this.emit('scheduler:started');
        // Check for startup reminder
        if (this.config.enabled && this.config.remindOnStartup) {
            await this.checkStartupReminder();
        }
        // Schedule next reminder
        if (this.config.enabled) {
            await this.scheduleNextReminder();
        }
    }
    /**
     * Stop the backup scheduler
     */
    stop() {
        if (this.scheduleTimer) {
            clearTimeout(this.scheduleTimer);
            this.scheduleTimer = undefined;
        }
        this.isActive = false;
        this.emit('scheduler:stopped');
    }
    /**
     * Update backup schedule configuration
     */
    async updateConfig(updates) {
        const previousEnabled = this.config.enabled;
        this.config = { ...this.config, ...updates };
        // Save configuration
        await this.saveScheduleConfig();
        // Restart scheduler if enabled state changed
        if (previousEnabled !== this.config.enabled) {
            if (this.config.enabled) {
                await this.scheduleNextReminder();
            }
            else {
                this.stop();
            }
        }
        this.emit('config:updated', this.config);
    }
    /**
     * Get current backup schedule status
     */
    async getStatus() {
        const lastBackupAt = await this.getLastBackupTime();
        const daysSinceLastBackup = lastBackupAt
            ? Math.floor((Date.now() - lastBackupAt.getTime()) / (1000 * 60 * 60 * 24))
            : 999;
        const nextReminderAt = this.calculateNextReminderTime(lastBackupAt);
        return {
            isActive: this.isActive,
            nextReminderAt,
            lastBackupAt,
            daysSinceLastBackup,
            config: { ...this.config },
        };
    }
    /**
     * Trigger backup reminder manually
     */
    async triggerReminder() {
        const status = await this.getStatus();
        const reminderEvent = {
            daysSinceLastBackup: status.daysSinceLastBackup,
            suggestedFilename: this.generateBackupFilename(),
            isUrgent: status.daysSinceLastBackup > this.config.intervalDays * 2,
        };
        this.emit('backup:reminder', reminderEvent);
    }
    /**
     * Create automatic backup
     */
    async createAutomaticBackup() {
        try {
            if (!this.config.automaticBackup) {
                return {
                    success: false,
                    filePath: undefined,
                    error: 'Automatic backups are not enabled',
                    fileSize: undefined,
                };
            }
            const filename = this.generateBackupFilename();
            const filePath = this.config.backupDirectory
                ? `${this.config.backupDirectory}/${filename}`
                : filename;
            const result = await this.configurationExporter.exportConfiguration(undefined, { filePath });
            if (!result.success) {
                return {
                    success: false,
                    filePath: undefined,
                    error: result.error,
                    fileSize: undefined,
                };
            }
            // Update last backup time
            await this.updateLastBackupTime();
            // Clean up old backup files
            await this.cleanupOldBackups();
            // Get file size
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const stats = await fs.stat(result.filePath);
            const backupResult = {
                success: true,
                filePath: result.filePath,
                error: undefined,
                fileSize: stats.size,
            };
            this.emit('backup:completed', backupResult);
            return backupResult;
        }
        catch (error) {
            const errorResult = {
                success: false,
                filePath: undefined,
                error: error instanceof Error ? error.message : 'Unknown backup error',
                fileSize: undefined,
            };
            this.emit('backup:failed', errorResult);
            return errorResult;
        }
    }
    /**
     * Check if backup reminder should be shown on startup
     */
    async checkStartupReminder() {
        const lastBackupAt = await this.getLastBackupTime();
        if (!lastBackupAt) {
            // Never backed up - show reminder
            await this.triggerReminder();
            return;
        }
        const daysSinceLastBackup = Math.floor((Date.now() - lastBackupAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastBackup >= this.config.intervalDays) {
            await this.triggerReminder();
        }
    }
    /**
     * Schedule next backup reminder
     */
    async scheduleNextReminder() {
        if (this.scheduleTimer) {
            clearTimeout(this.scheduleTimer);
        }
        const lastBackupAt = await this.getLastBackupTime();
        const nextReminderTime = this.calculateNextReminderTime(lastBackupAt);
        if (!nextReminderTime) {
            return;
        }
        const msUntilReminder = nextReminderTime.getTime() - Date.now();
        if (msUntilReminder <= 0) {
            // Should remind now
            await this.triggerReminder();
            await this.scheduleNextReminder();
            return;
        }
        this.scheduleTimer = setTimeout(async () => {
            await this.triggerReminder();
            await this.scheduleNextReminder();
        }, msUntilReminder);
    }
    /**
     * Calculate next reminder time based on last backup
     */
    calculateNextReminderTime(lastBackupAt) {
        if (!this.config.enabled) {
            return undefined;
        }
        const baseTime = lastBackupAt || new Date();
        const nextReminder = new Date(baseTime);
        nextReminder.setDate(nextReminder.getDate() + this.config.intervalDays);
        return nextReminder;
    }
    /**
     * Generate backup filename with timestamp
     */
    generateBackupFilename() {
        const timestamp = new Date().toISOString().split('T')[0];
        return `getwarped-backup-${timestamp}.json`;
    }
    /**
     * Get last backup timestamp from configuration
     */
    async getLastBackupTime() {
        try {
            const config = await this.configurationManager.getConfiguration();
            const backupTimestamp = config.app?.lastBackupAt;
            return backupTimestamp ? new Date(backupTimestamp) : undefined;
        }
        catch (error) {
            return undefined;
        }
    }
    /**
     * Update last backup timestamp in configuration
     */
    async updateLastBackupTime() {
        try {
            const updateResult = await this.configurationManager.updateConfiguration({
                section: 'app',
                updates: { lastBackupAt: new Date().toISOString() },
            });
            if (!updateResult.success) {
                this.emit('error', new Error(`Failed to update last backup time: ${updateResult.error}`));
            }
        }
        catch (error) {
            this.emit('error', new Error(`Error updating last backup time: ${error instanceof Error ? error.message : error}`));
        }
    }
    /**
     * Save schedule configuration to app config
     */
    async saveScheduleConfig() {
        try {
            const updateResult = await this.configurationManager.updateConfiguration({
                section: 'app',
                updates: { backupSchedule: this.config },
            });
            if (!updateResult.success) {
                this.emit('error', new Error(`Failed to save backup schedule config: ${updateResult.error}`));
            }
        }
        catch (error) {
            this.emit('error', new Error(`Error saving backup schedule config: ${error instanceof Error ? error.message : error}`));
        }
    }
    /**
     * Clean up old automatic backup files
     */
    async cleanupOldBackups() {
        if (!this.config.backupDirectory || this.config.maxBackupFiles <= 0) {
            return;
        }
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const files = await fs.readdir(this.config.backupDirectory);
            const backupFiles = files
                .filter(file => file.startsWith('getwarped-backup-') && file.endsWith('.json'))
                .map(file => ({
                name: file,
                path: path.join(this.config.backupDirectory, file),
            }));
            if (backupFiles.length <= this.config.maxBackupFiles) {
                return;
            }
            // Sort by modification time (newest first)
            const filesWithStats = await Promise.all(backupFiles.map(async (file) => {
                const stats = await fs.stat(file.path);
                return { ...file, mtime: stats.mtime };
            }));
            filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            // Delete oldest files
            const filesToDelete = filesWithStats.slice(this.config.maxBackupFiles);
            for (const file of filesToDelete) {
                await fs.unlink(file.path);
            }
            this.emit('backup:cleanup', { deletedCount: filesToDelete.length });
        }
        catch (error) {
            this.emit('error', new Error(`Error cleaning up old backup files: ${error instanceof Error ? error.message : error}`));
        }
    }
}
exports.ConfigurationBackupScheduler = ConfigurationBackupScheduler;
//# sourceMappingURL=ConfigurationBackupScheduler.js.map