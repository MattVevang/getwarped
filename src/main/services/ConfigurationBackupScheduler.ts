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
export class ConfigurationBackupScheduler extends EventEmitter {
  private scheduleTimer: NodeJS.Timeout | undefined;
  private isActive = false;
  private config: BackupScheduleConfig;

  constructor(
    private readonly configurationManager: ConfigurationManager,
    private readonly configurationExporter: ConfigurationExporter,
    initialConfig?: Partial<BackupScheduleConfig>
  ) {
    super();

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
  async start(): Promise<void> {
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
  stop(): void {
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
  async updateConfig(updates: Partial<BackupScheduleConfig>): Promise<void> {
    const previousEnabled = this.config.enabled;
    this.config = { ...this.config, ...updates };

    // Save configuration
    await this.saveScheduleConfig();

    // Restart scheduler if enabled state changed
    if (previousEnabled !== this.config.enabled) {
      if (this.config.enabled) {
        await this.scheduleNextReminder();
      } else {
        this.stop();
      }
    }

    this.emit('config:updated', this.config);
  }

  /**
   * Get current backup schedule status
   */
  async getStatus(): Promise<BackupScheduleStatus> {
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
  async triggerReminder(): Promise<void> {
    const status = await this.getStatus();

    const reminderEvent: BackupReminderEvent = {
      daysSinceLastBackup: status.daysSinceLastBackup,
      suggestedFilename: this.generateBackupFilename(),
      isUrgent: status.daysSinceLastBackup > this.config.intervalDays * 2,
    };

    this.emit('backup:reminder', reminderEvent);
  }

  /**
   * Create automatic backup
   */
  async createAutomaticBackup(): Promise<BackupOperationResult> {
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
      const fs = await import('fs/promises');
      const stats = await fs.stat(result.filePath!);

      const backupResult: BackupOperationResult = {
        success: true,
        filePath: result.filePath,
        error: undefined,
        fileSize: stats.size,
      };

      this.emit('backup:completed', backupResult);
      return backupResult;
    } catch (error) {
      const errorResult: BackupOperationResult = {
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
  private async checkStartupReminder(): Promise<void> {
    const lastBackupAt = await this.getLastBackupTime();

    if (!lastBackupAt) {
      // Never backed up - show reminder
      await this.triggerReminder();
      return;
    }

    const daysSinceLastBackup = Math.floor(
      (Date.now() - lastBackupAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastBackup >= this.config.intervalDays) {
      await this.triggerReminder();
    }
  }

  /**
   * Schedule next backup reminder
   */
  private async scheduleNextReminder(): Promise<void> {
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
  private calculateNextReminderTime(lastBackupAt?: Date): Date | undefined {
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
  private generateBackupFilename(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `getwarped-backup-${timestamp}.json`;
  }

  /**
   * Get last backup timestamp from configuration
   */
  private async getLastBackupTime(): Promise<Date | undefined> {
    try {
      const config = await this.configurationManager.getConfiguration();
      const backupTimestamp = (config.app as any)?.lastBackupAt;

      return backupTimestamp ? new Date(backupTimestamp) : undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Update last backup timestamp in configuration
   */
  private async updateLastBackupTime(): Promise<void> {
    try {
      const updateResult = await this.configurationManager.updateConfiguration({
        section: 'app',
        updates: { lastBackupAt: new Date().toISOString() } as any,
      });

      if (!updateResult.success) {
        this.emit('error', new Error(`Failed to update last backup time: ${updateResult.error}`));
      }
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Error updating last backup time: ${error instanceof Error ? error.message : error}`
        )
      );
    }
  }

  /**
   * Save schedule configuration to app config
   */
  private async saveScheduleConfig(): Promise<void> {
    try {
      const updateResult = await this.configurationManager.updateConfiguration({
        section: 'app',
        updates: { backupSchedule: this.config } as any,
      });

      if (!updateResult.success) {
        this.emit(
          'error',
          new Error(`Failed to save backup schedule config: ${updateResult.error}`)
        );
      }
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Error saving backup schedule config: ${error instanceof Error ? error.message : error}`
        )
      );
    }
  }

  /**
   * Clean up old automatic backup files
   */
  private async cleanupOldBackups(): Promise<void> {
    if (!this.config.backupDirectory || this.config.maxBackupFiles <= 0) {
      return;
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const files = await fs.readdir(this.config.backupDirectory);
      const backupFiles = files
        .filter(file => file.startsWith('getwarped-backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupDirectory!, file),
        }));

      if (backupFiles.length <= this.config.maxBackupFiles) {
        return;
      }

      // Sort by modification time (newest first)
      const filesWithStats = await Promise.all(
        backupFiles.map(async file => {
          const stats = await fs.stat(file.path);
          return { ...file, mtime: stats.mtime };
        })
      );

      filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Delete oldest files
      const filesToDelete = filesWithStats.slice(this.config.maxBackupFiles);

      for (const file of filesToDelete) {
        await fs.unlink(file.path);
      }

      this.emit('backup:cleanup', { deletedCount: filesToDelete.length });
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Error cleaning up old backup files: ${error instanceof Error ? error.message : error}`
        )
      );
    }
  }
}
