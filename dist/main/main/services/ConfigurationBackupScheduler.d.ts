/**
 * Configuration Backup Scheduler
 *
 * Manages automated configuration backup scheduling with user-configurable intervals.
 * Provides notifications and prompts for regular configuration exports to prevent data loss.
 *
 * @fileoverview Automated backup scheduling and reminder system
 */
import { EventEmitter } from 'events';
import { ConfigurationExporter } from './ConfigurationExporter';
import { ConfigurationManager } from './ConfigurationManager';
/**
 * Backup schedule configuration
 */
export interface BackupScheduleConfig {
    /** Whether automatic backup reminders are enabled */
    enabled: boolean;
    /** Backup reminder interval in days */
    intervalDays: number;
    /** Whether to show backup reminders on app startup */
    remindOnStartup: boolean;
    /** Whether to create automatic backups without prompts */
    automaticBackup: boolean;
    /** Maximum number of automatic backup files to retain */
    maxBackupFiles: number;
    /** Custom backup directory path (optional) */
    backupDirectory?: string;
}
/**
 * Backup reminder event data
 */
export interface BackupReminderEvent {
    /** Time since last backup in days */
    daysSinceLastBackup: number;
    /** Suggested backup filename */
    suggestedFilename: string;
    /** Whether this is an urgent reminder */
    isUrgent: boolean;
}
/**
 * Backup schedule status
 */
export interface BackupScheduleStatus {
    /** Whether scheduling is active */
    isActive: boolean;
    /** Next scheduled backup reminder timestamp */
    nextReminderAt: Date | undefined;
    /** Last backup timestamp */
    lastBackupAt: Date | undefined;
    /** Days since last backup */
    daysSinceLastBackup: number;
    /** Current schedule configuration */
    config: BackupScheduleConfig;
}
/**
 * Backup operation result
 */
export interface BackupOperationResult {
    /** Whether backup succeeded */
    success: boolean;
    /** Path to backup file */
    filePath: string | undefined;
    /** Error message if failed */
    error: string | undefined;
    /** Backup file size in bytes */
    fileSize: number | undefined;
}
/**
 * Configuration backup scheduler service
 * Manages automated backup reminders and scheduling
 */
export declare class ConfigurationBackupScheduler extends EventEmitter {
    private readonly configurationManager;
    private readonly configurationExporter;
    private scheduleTimer;
    private isActive;
    private config;
    constructor(configurationManager: ConfigurationManager, configurationExporter: ConfigurationExporter, initialConfig?: Partial<BackupScheduleConfig>);
    /**
     * Start the backup scheduler
     */
    start(): Promise<void>;
    /**
     * Stop the backup scheduler
     */
    stop(): void;
    /**
     * Update backup schedule configuration
     */
    updateConfig(updates: Partial<BackupScheduleConfig>): Promise<void>;
    /**
     * Get current backup schedule status
     */
    getStatus(): Promise<BackupScheduleStatus>;
    /**
     * Trigger backup reminder manually
     */
    triggerReminder(): Promise<void>;
    /**
     * Create automatic backup
     */
    createAutomaticBackup(): Promise<BackupOperationResult>;
    /**
     * Check if backup reminder should be shown on startup
     */
    private checkStartupReminder;
    /**
     * Schedule next backup reminder
     */
    private scheduleNextReminder;
    /**
     * Calculate next reminder time based on last backup
     */
    private calculateNextReminderTime;
    /**
     * Generate backup filename with timestamp
     */
    private generateBackupFilename;
    /**
     * Get last backup timestamp from configuration
     */
    private getLastBackupTime;
    /**
     * Update last backup timestamp in configuration
     */
    private updateLastBackupTime;
    /**
     * Save schedule configuration to app config
     */
    private saveScheduleConfig;
    /**
     * Clean up old automatic backup files
     */
    private cleanupOldBackups;
}
//# sourceMappingURL=ConfigurationBackupScheduler.d.ts.map