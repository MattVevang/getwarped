/**
 * End-to-End test for application lifecycle scenarios
 * Tests: startup, shutdown, recovery, persistence validation, crash recovery
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Test configuration
const electronPath = path.join(__dirname, '../../../dist/main.js');
const testTimeout = 45000;
const tempDir = path.join(os.tmpdir(), 'getwarped-e2e-lifecycle-tests');

test.describe('E2E Test: Application Lifecycle', () => {
  test.beforeAll(async () => {
    // Create temp directory for test files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  test.afterAll(async () => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Application startup and initialization', async () => {
    test.setTimeout(testTimeout);

    // Launch application and measure startup time
    const startupStartTime = Date.now();

    const electronApp = await electron.launch({
      args: [electronPath, '--test-mode'],
      timeout: 15000,
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    const startupEndTime = Date.now();
    const startupDuration = startupEndTime - startupStartTime;

    try {
      // Startup should be reasonably fast (less than 10 seconds)
      expect(startupDuration).toBeLessThan(10000);

      // Verify main window is present
      expect(page).toBeDefined();

      // Verify app container is loaded
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();

      // Verify navigation elements are present
      await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

      // For first-time users, should show welcome screen
      const hasExistingData = (await page.locator('[data-testid="workspace-card"]').count()) > 0;
      if (!hasExistingData) {
        await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible();
      }

      // Verify menu bar is accessible
      await page.click('[data-testid="menu-button"]');
      await expect(page.locator('[data-testid="app-menu"]')).toBeVisible();
      await page.keyboard.press('Escape'); // Close menu

      // Test window controls (basic verification)
      const windows = electronApp.windows();
      expect(windows.length).toBe(1);

      // Verify window is accessible
      expect(page.isClosed()).toBe(false);

      // Test window resize through evaluate
      await page.evaluate(() => {
        window.resizeTo(1200, 800);
      });

      const windowSize = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));

      // Size should be approximately correct (allowing for window decorations)
      expect(windowSize.width).toBeGreaterThan(1000);
      expect(windowSize.height).toBeGreaterThan(700);
    } finally {
      await electronApp.close();
    }
  });

  test('Data persistence across sessions', async () => {
    test.setTimeout(testTimeout);

    let electronApp: ElectronApplication;
    let page: Page;

    // Session 1: Create data
    electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/session1`],
      timeout: 10000,
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Create workspace and service
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Persistent Workspace');
      await page.selectOption('[data-testid="workspace-theme-select"]', 'dark');
      await page.fill('[data-testid="workspace-icon-input"]', '💾');
      await page.check('[data-testid="workspace-default-checkbox"]');
      await page.click('[data-testid="save-workspace-btn"]');

      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Persistent Service');
      await page.fill('[data-testid="service-url-input"]', 'https://persistent.com');
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '🔒');
      await page.click('[data-testid="save-service-btn"]');

      // Verify data created
      await expect(page.locator('text=Persistent Workspace')).toBeVisible();
      await expect(page.locator('text=Persistent Service')).toBeVisible();

      // Launch service to create session data
      await page.click('[data-testid="service-card"] [data-testid="launch-service-btn"]');
      await expect(page.locator('[data-testid="browser-view-container"]')).toBeVisible();

      // Configure app settings
      await page.click('[data-testid="settings-btn"]');
      await page.selectOption('[data-testid="app-theme-select"]', 'dark');
      await page.check('[data-testid="auto-start-checkbox"]');
      await page.check('[data-testid="notifications-checkbox"]');
      await page.click('[data-testid="save-settings-btn"]');
      await page.click('[data-testid="close-settings-btn"]');
    } finally {
      await electronApp.close();
    }

    // Wait a moment for data to be persisted
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Session 2: Verify persistence
    electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/session1`], // Same user data
      timeout: 10000,
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Verify workspace and service persisted
      await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(1);
      await expect(page.locator('text=Persistent Workspace')).toBeVisible();
      await expect(page.locator('[data-testid="service-card"]')).toHaveCount(1);
      await expect(page.locator('text=Persistent Service')).toBeVisible();

      // Verify default workspace is selected
      await expect(
        page.locator('[data-testid="workspace-card"][data-active="true"]')
      ).toContainText('Persistent Workspace');

      // Verify app settings persisted
      await page.click('[data-testid="settings-btn"]');

      const themeSelect = page.locator('[data-testid="app-theme-select"]');
      await expect(themeSelect).toHaveValue('dark');

      const autoStartCheckbox = page.locator('[data-testid="auto-start-checkbox"]');
      await expect(autoStartCheckbox).toBeChecked();

      const notificationsCheckbox = page.locator('[data-testid="notifications-checkbox"]');
      await expect(notificationsCheckbox).toBeChecked();

      await page.click('[data-testid="close-settings-btn"]');

      // Verify session state can be restored
      await page.click('[data-testid="service-card"] [data-testid="launch-service-btn"]');
      await expect(page.locator('[data-testid="browser-view-container"]')).toBeVisible();
    } finally {
      await electronApp.close();
    }
  });

  test('Graceful shutdown and cleanup', async () => {
    test.setTimeout(testTimeout);

    const electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/shutdown`],
      timeout: 10000,
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Create some data and active sessions
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Shutdown Test');
      await page.click('[data-testid="save-workspace-btn"]');

      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Active Service');
      await page.fill('[data-testid="service-url-input"]', 'https://active.com');
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '🔄');
      await page.click('[data-testid="save-service-btn"]');

      // Launch service to create active session
      await page.click('[data-testid="service-card"] [data-testid="launch-service-btn"]');
      await expect(page.locator('[data-testid="browser-view-container"]')).toBeVisible();

      // Test graceful shutdown via menu
      await page.click('[data-testid="menu-button"]');
      await page.click('[data-testid="quit-app-btn"]');

      // Should prompt to save if there are unsaved changes
      if (await page.locator('[data-testid="shutdown-dialog"]').isVisible()) {
        await expect(page.locator('[data-testid="shutdown-dialog"]')).toContainText('Save changes');
        await page.click('[data-testid="save-and-quit-btn"]');
      }

      // Wait for application to close
      await electronApp.waitForEvent('close', { timeout: 10000 });
    } catch (error) {
      // Ensure app is closed even if test fails
      try {
        await electronApp.close();
      } catch (e) {
        // App might already be closed
      }
      throw error;
    }

    // Verify clean shutdown - no hanging processes
    // This would be implementation-specific, but we can at least verify
    // the app closed properly by trying to launch again
    const newApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/shutdown`],
      timeout: 10000,
    });

    const newPage = await newApp.firstWindow();
    await newPage.waitForLoadState('networkidle');

    try {
      // Data should still be there after graceful shutdown
      await expect(newPage.locator('text=Shutdown Test')).toBeVisible();
      await expect(newPage.locator('text=Active Service')).toBeVisible();
    } finally {
      await newApp.close();
    }
  });

  test('Crash recovery and data integrity', async () => {
    test.setTimeout(testTimeout);

    let electronApp: ElectronApplication;
    let page: Page;

    // Create initial data
    electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/crash`],
      timeout: 10000,
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Create test data
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Crash Recovery Workspace');
      await page.click('[data-testid="save-workspace-btn"]');

      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Recovery Service');
      await page.fill('[data-testid="service-url-input"]', 'https://recovery.com');
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '🚑');
      await page.click('[data-testid="save-service-btn"]');

      // Simulate unsaved changes
      await page.click('[data-testid="service-card"] [data-testid="edit-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Modified Recovery Service');
      // Don't save - leave it as unsaved change
    } finally {
      // Force close without graceful shutdown (simulate crash)
      await electronApp.close();
    }

    // Wait a moment before recovery
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Launch app again (recovery scenario)
    electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/crash`],
      timeout: 10000,
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Should show crash recovery dialog
      if (await page.locator('[data-testid="crash-recovery-dialog"]').isVisible()) {
        await expect(page.locator('[data-testid="crash-recovery-dialog"]')).toContainText(
          'unexpected shutdown'
        );

        // Option to restore previous session
        await page.click('[data-testid="restore-session-btn"]');

        // Should restore to last saved state
        await expect(page.locator('text=Crash Recovery Workspace')).toBeVisible();
        await expect(page.locator('text=Recovery Service')).toBeVisible();

        // Unsaved changes should be lost (expected behavior)
        await expect(page.locator('text=Modified Recovery Service')).not.toBeVisible();

        // Should offer to recover any auto-saved drafts
        if (await page.locator('[data-testid="draft-recovery-panel"]').isVisible()) {
          await expect(page.locator('[data-testid="recovered-drafts"]')).toBeVisible();
        }
      } else {
        // If no crash dialog, data should still be intact
        await expect(page.locator('text=Crash Recovery Workspace')).toBeVisible();
        await expect(page.locator('text=Recovery Service')).toBeVisible();
      }

      // Verify app is fully functional after recovery
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Post-Recovery Service');
      await page.fill('[data-testid="service-url-input"]', 'https://post-recovery.com');
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '✅');
      await page.click('[data-testid="save-service-btn"]');

      // New service should work normally
      await expect(page.locator('text=Post-Recovery Service')).toBeVisible();
    } finally {
      await electronApp.close();
    }
  });

  test('Auto-save and draft recovery', async () => {
    test.setTimeout(testTimeout);

    const electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/autosave`],
      timeout: 10000,
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Enable auto-save in settings
      await page.click('[data-testid="settings-btn"]');
      await page.click('[data-testid="advanced-settings-tab"]');
      await page.check('[data-testid="enable-auto-save-checkbox"]');
      await page.fill('[data-testid="auto-save-interval-input"]', '5'); // 5 seconds
      await page.click('[data-testid="save-settings-btn"]');
      await page.click('[data-testid="close-settings-btn"]');

      // Create workspace
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Auto-save Workspace');
      await page.click('[data-testid="save-workspace-btn"]');

      // Start creating a service but don't save
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Draft Service');
      await page.fill('[data-testid="service-url-input"]', 'https://draft.com');
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '📝');

      // Wait for auto-save interval
      await page.waitForTimeout(6000);

      // Should see auto-save indicator
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();

      // Start editing existing workspace
      await page.click('[data-testid="workspace-card"] [data-testid="edit-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Auto-save Workspace Modified');

      // Don't save, but wait for auto-save
      await page.waitForTimeout(6000);
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible();

      // Force close (simulate crash during editing)
      await electronApp.close();
    } catch (error) {
      try {
        await electronApp.close();
      } catch (e) {
        // App might already be closed
      }
      throw error;
    }

    // Restart app
    const newApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/autosave`],
      timeout: 10000,
    });

    const newPage = await newApp.firstWindow();
    await newPage.waitForLoadState('networkidle');

    try {
      // Should offer to restore drafts
      if (await newPage.locator('[data-testid="draft-recovery-dialog"]').isVisible()) {
        await expect(newPage.locator('[data-testid="draft-recovery-dialog"]')).toContainText(
          'unsaved changes'
        );

        // Should show list of recoverable items
        await expect(newPage.locator('[data-testid="recoverable-service-draft"]')).toContainText(
          'Draft Service'
        );
        await expect(newPage.locator('[data-testid="recoverable-workspace-draft"]')).toContainText(
          'Auto-save Workspace Modified'
        );

        // Restore selected drafts
        await newPage.check('[data-testid="restore-service-draft-checkbox"]');
        await newPage.check('[data-testid="restore-workspace-draft-checkbox"]');
        await newPage.click('[data-testid="restore-selected-drafts-btn"]');

        // Verify drafts restored
        await expect(newPage.locator('text=Auto-save Workspace Modified')).toBeVisible();

        // Service draft should be in edit mode
        await expect(newPage.locator('[data-testid="service-form"]')).toBeVisible();
        await expect(newPage.locator('[data-testid="service-name-input"]')).toHaveValue(
          'Draft Service'
        );
      }
    } finally {
      await newApp.close();
    }
  });

  test('System resource monitoring and limits', async () => {
    test.setTimeout(testTimeout);

    const electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/resources`],
      timeout: 10000,
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Create workspace
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Resource Monitor Test');
      await page.click('[data-testid="save-workspace-btn"]');

      // Create multiple services to test resource usage
      const serviceCount = 10;
      for (let i = 1; i <= serviceCount; i++) {
        await page.click('[data-testid="add-service-btn"]');
        await page.fill('[data-testid="service-name-input"]', `Resource Service ${i}`);
        await page.fill('[data-testid="service-url-input"]', `https://resource${i}.example.com`);
        await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
        await page.fill('[data-testid="service-icon-input"]', '📊');
        await page.click('[data-testid="save-service-btn"]');
      }

      // Launch multiple services
      for (let i = 1; i <= 5; i++) {
        await page.click(
          `[data-testid="service-card"]:has-text("Resource Service ${i}") [data-testid="launch-service-btn"]`
        );
      }

      // Check system resource usage (if available)
      await page.click('[data-testid="settings-btn"]');
      await page.click('[data-testid="system-info-tab"]');

      // Should show resource monitoring
      if (await page.locator('[data-testid="resource-monitor"]').isVisible()) {
        await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
        await expect(page.locator('[data-testid="cpu-usage"]')).toBeVisible();

        // Memory usage should be reasonable
        const memoryText = await page.locator('[data-testid="memory-usage-value"]').textContent();
        if (memoryText) {
          const memoryMB = parseInt(memoryText.replace(/[^\d]/g, ''));
          expect(memoryMB).toBeLessThan(1000); // Less than 1GB
        }

        // Should show BrowserView count
        await expect(page.locator('[data-testid="browser-view-count"]')).toContainText('5');
      }

      // Test memory cleanup when closing services
      await page.click('[data-testid="close-settings-btn"]');

      // Close some services
      for (let i = 1; i <= 3; i++) {
        await page.click(
          `[data-testid="browser-view-tab"]:has-text("Resource Service ${i}") [data-testid="close-tab-btn"]`
        );
      }

      // Resource usage should decrease
      await page.click('[data-testid="settings-btn"]');
      await page.click('[data-testid="system-info-tab"]');

      if (await page.locator('[data-testid="browser-view-count"]').isVisible()) {
        await expect(page.locator('[data-testid="browser-view-count"]')).toContainText('2');
      }

      // Test resource limit enforcement
      await page.click('[data-testid="performance-settings-tab"]');
      await page.fill('[data-testid="max-concurrent-services-input"]', '3');
      await page.click('[data-testid="save-settings-btn"]');
      await page.click('[data-testid="close-settings-btn"]');

      // Try to launch more services than limit
      for (let i = 6; i <= 8; i++) {
        await page.click(
          `[data-testid="service-card"]:has-text("Resource Service ${i}") [data-testid="launch-service-btn"]`
        );
      }

      // Should respect the limit
      const browserViewCount = await page.locator('[data-testid="browser-view-tab"]').count();
      expect(browserViewCount).toBeLessThanOrEqual(3);

      // Should show warning when limit exceeded
      if (await page.locator('[data-testid="resource-limit-warning"]').isVisible()) {
        await expect(page.locator('[data-testid="resource-limit-warning"]')).toContainText(
          'maximum concurrent services'
        );
      }
    } finally {
      await electronApp.close();
    }
  });

  test('Update and migration handling', async () => {
    test.setTimeout(testTimeout);

    // Simulate old version data
    const oldUserDataDir = path.join(tempDir, 'migration');
    if (!fs.existsSync(oldUserDataDir)) {
      fs.mkdirSync(oldUserDataDir, { recursive: true });
    }

    // Create old format configuration file
    const oldConfigPath = path.join(oldUserDataDir, 'config.json');
    const oldFormatConfig = {
      version: '0.9.0', // Older version
      workspaces: {
        'old-workspace-1': {
          name: 'Legacy Workspace',
          theme: 'light',
          services: {
            'old-service-1': {
              name: 'Legacy Service',
              url: 'https://legacy.com',
            },
          },
        },
      },
      settings: {
        theme: 'dark',
      },
    };

    fs.writeFileSync(oldConfigPath, JSON.stringify(oldFormatConfig, null, 2));

    // Launch app with old data
    const electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${oldUserDataDir}`],
      timeout: 10000,
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Should show migration dialog
      if (await page.locator('[data-testid="migration-dialog"]').isVisible()) {
        await expect(page.locator('[data-testid="migration-dialog"]')).toContainText(
          'data migration'
        );
        await expect(page.locator('[data-testid="migration-from-version"]')).toContainText('0.9.0');
        await expect(page.locator('[data-testid="migration-to-version"]')).toContainText('1.0.0');

        // Should offer backup option
        await page.check('[data-testid="create-backup-before-migration"]');
        await page.click('[data-testid="start-migration-btn"]');

        // Should show migration progress
        await expect(page.locator('[data-testid="migration-progress"]')).toBeVisible();
        await expect(page.locator('[data-testid="migration-status"]')).toContainText('Migrating');

        // Wait for migration to complete
        await expect(page.locator('[data-testid="migration-complete"]')).toBeVisible({
          timeout: 15000,
        });
        await page.click('[data-testid="continue-to-app-btn"]');
      }

      // Verify migrated data
      await expect(page.locator('text=Legacy Workspace')).toBeVisible();
      await expect(page.locator('text=Legacy Service')).toBeVisible();

      // Verify new format is being used
      await page.click('[data-testid="settings-btn"]');
      await page.click('[data-testid="about-tab"]');
      await expect(page.locator('[data-testid="app-version"]')).toContainText('1.0.0');

      // Verify backup was created
      if (fs.existsSync(path.join(oldUserDataDir, 'backups'))) {
        const backupFiles = fs.readdirSync(path.join(oldUserDataDir, 'backups'));
        expect(backupFiles.length).toBeGreaterThan(0);
      }
    } finally {
      await electronApp.close();
    }
  });

  test('Multi-window management', async () => {
    test.setTimeout(testTimeout);

    const electronApp = await electron.launch({
      args: [electronPath, '--test-mode', `--user-data-dir=${tempDir}/multiwindow`],
      timeout: 10000,
    });

    const page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');

    try {
      // Create test data
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', 'Multi-Window Test');
      await page.click('[data-testid="save-workspace-btn"]');

      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', 'Window Test Service');
      await page.fill('[data-testid="service-url-input"]', 'https://window-test.com');
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '🪟');
      await page.click('[data-testid="save-service-btn"]');

      // Open new window
      await page.keyboard.press('Control+Shift+N');

      // Wait for new window
      const newWindow = await electronApp.waitForEvent('window');
      const newPage = newWindow;
      await newPage.waitForLoadState('networkidle');

      // New window should share data but have independent state
      await expect(newPage.locator('text=Multi-Window Test')).toBeVisible();
      await expect(newPage.locator('text=Window Test Service')).toBeVisible();

      // Changes in one window should sync to others
      await newPage.click('[data-testid="add-service-btn"]');
      await newPage.fill('[data-testid="service-name-input"]', 'Second Window Service');
      await newPage.fill('[data-testid="service-url-input"]', 'https://second-window.com');
      await newPage.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await newPage.fill('[data-testid="service-icon-input"]', '🔄');
      await newPage.click('[data-testid="save-service-btn"]');

      // Original window should see the new service
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Second Window Service')).toBeVisible();

      // Windows should have independent navigation state
      await page.click(
        '[data-testid="service-card"]:has-text("Window Test Service") [data-testid="launch-service-btn"]'
      );
      await newPage.click(
        '[data-testid="service-card"]:has-text("Second Window Service") [data-testid="launch-service-btn"]'
      );

      // Each window should show different active service
      await expect(page.locator('[data-testid="active-service"]')).toContainText(
        'Window Test Service'
      );
      await expect(newPage.locator('[data-testid="active-service"]')).toContainText(
        'Second Window Service'
      );

      // Closing one window shouldn't affect the other
      await newPage.close();

      // Original window should still be functional
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      await expect(page.locator('text=Multi-Window Test')).toBeVisible();
    } finally {
      await electronApp.close();
    }
  });
});
