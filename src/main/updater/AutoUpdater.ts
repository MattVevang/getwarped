import { app, dialog, BrowserWindow } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';

/**
 * Auto updater service for production releases
 * Handles automatic updates using GitHub releases
 */
export class AutoUpdater {
  private static instance: AutoUpdater;
  private mainWindow: BrowserWindow | null = null;
  private updateDownloaded = false;

  private constructor() {
    this.setupAutoUpdater();
  }

  public static getInstance(): AutoUpdater {
    if (!AutoUpdater.instance) {
      AutoUpdater.instance = new AutoUpdater();
    }
    return AutoUpdater.instance;
  }

  /**
   * Initialize auto updater with main window reference
   */
  public initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;

    // Check for updates on startup (only in production)
    if (!app.isPackaged) {
      return;
    }

    // Initial update check after app is ready
    setTimeout(() => {
      this.checkForUpdates();
    }, 3000); // Wait 3 seconds after startup
  }

  /**
   * Setup auto updater configuration and event handlers
   */
  private setupAutoUpdater(): void {
    // Configure auto updater
    autoUpdater.autoDownload = false; // Manual download control
    autoUpdater.autoInstallOnAppQuit = true;

    // Set update channel based on app version
    const version = app.getVersion();
    autoUpdater.channel = version.includes('beta') ? 'beta' : 'latest';

    // Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.showUpdateAvailableDialog(info);
    });

    // Update not available
    autoUpdater.on('update-not-available', (_info: UpdateInfo) => {
      // Update not available - no action needed
    });

    // Update download progress
    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      const percent = Math.round(progressObj.percent);
      this.sendToRenderer('update-download-progress', { percent });
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.updateDownloaded = true;
      this.showUpdateReadyDialog(info);
    });

    // Update error
    autoUpdater.on('error', (error: Error) => {
      this.sendToRenderer('update-error', { error: error.message });
    });
  }

  /**
   * Check for updates manually
   */
  public async checkForUpdates(): Promise<void> {
    if (!app.isPackaged) {
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (_error) {
      // Error checking for updates - will be handled by error event
    }
  }

  /**
   * Download and install update
   */
  public async downloadUpdate(): Promise<void> {
    try {
      this.sendToRenderer('update-downloading', {});
      await autoUpdater.downloadUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.sendToRenderer('update-error', { error: errorMessage });
    }
  }

  /**
   * Install update and restart app
   */
  public installUpdate(): void {
    if (!this.updateDownloaded) {
      return;
    }

    autoUpdater.quitAndInstall();
  }

  /**
   * Show update available dialog
   */
  private async showUpdateAvailableDialog(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow) return;

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: 'Would you like to download it now?',
      checkboxLabel: 'Automatically download updates in the future',
      checkboxChecked: false,
    });

    if (response.response === 0) {
      await this.downloadUpdate();
    }

    // Update auto-download preference
    if (response.checkboxChecked !== undefined) {
      autoUpdater.autoDownload = response.checkboxChecked;
    }
  }

  /**
   * Show update ready dialog
   */
  private async showUpdateReadyDialog(info: UpdateInfo): Promise<void> {
    if (!this.mainWindow) return;

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'Update Ready',
      message: `Update to version ${info.version} is ready to install.`,
      detail: 'The application will restart to complete the installation.',
    });

    if (response.response === 0) {
      this.installUpdate();
    }
  }

  /**
   * Send update events to renderer process
   */
  private sendToRenderer(event: string, data: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('auto-updater', { event, data });
    }
  }

  /**
   * Get current update status
   */
  public getUpdateStatus(): {
    available: boolean;
    downloaded: boolean;
    version?: string;
  } {
    return {
      available: false, // Will be updated by events
      downloaded: this.updateDownloaded,
    };
  }

  /**
   * Enable or disable auto-download
   */
  public setAutoDownload(enabled: boolean): void {
    autoUpdater.autoDownload = enabled;
  }

  /**
   * Get update channel
   */
  public getChannel(): string {
    return autoUpdater.channel || 'latest';
  }

  /**
   * Set update channel (latest, beta)
   */
  public setChannel(channel: string): void {
    autoUpdater.channel = channel;
  }
}
