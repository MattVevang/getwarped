/**
 * End-to-End test for configuration management workflows
 * Tests: export/import workflows, backup/restore, configuration migration
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Test configuration
const electronPath = path.join(__dirname, '../../../dist/main.js');
const testTimeout = 30000;
const tempDir = path.join(os.tmpdir(), 'getwarped-e2e-config-tests');

test.describe('E2E Test: Configuration Management', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // Create temp directory for test files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Launch GetWarped Electron app
    electronApp = await electron.launch({
      args: [electronPath, '--test-mode'],
      timeout: 10000,
    });

    page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Close the application
    if (electronApp) {
      await electronApp.close();
    }
  });

  test.beforeEach(async () => {
    // Reset application state before each test
    await page.evaluate(() => {
      const win = window as any;
      if (win.electronAPI && win.electronAPI.resetAppData) {
        return win.electronAPI.resetAppData();
      }
    });

    await page.waitForSelector('[data-testid="app-container"]', { timeout: 5000 });
  });

  test('Complete export workflow: create configuration and export', async () => {
    test.setTimeout(testTimeout);

    // Step 1: Create comprehensive configuration
    // Create first workspace
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Work Environment');
    await page.selectOption('[data-testid="workspace-theme-select"]', 'dark');
    await page.fill('[data-testid="workspace-icon-input"]', '💼');
    await page.check('[data-testid="workspace-default-checkbox"]');
    await page.click('[data-testid="save-workspace-btn"]');

    // Add services to first workspace
    const workServices = [
      { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
      { name: 'Calendar', url: 'https://calendar.google.com', icon: '📅' },
      { name: 'Slack', url: 'https://slack.com', icon: '💬' },
    ];

    for (const service of workServices) {
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', service.name);
      await page.fill('[data-testid="service-url-input"]', service.url);
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', service.icon);
      await page.click('[data-testid="save-service-btn"]');
    }

    // Create second workspace
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Personal Projects');
    await page.selectOption('[data-testid="workspace-theme-select"]', 'light');
    await page.fill('[data-testid="workspace-icon-input"]', '🏠');
    await page.click('[data-testid="save-workspace-btn"]');

    // Switch to second workspace and add services
    await page.click('[data-testid="workspace-card"]:has-text("Personal Projects")');

    const personalServices = [
      { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
      { name: 'Reddit', url: 'https://reddit.com', icon: '🤖' },
    ];

    for (const service of personalServices) {
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', service.name);
      await page.fill('[data-testid="service-url-input"]', service.url);
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', service.icon);
      await page.click('[data-testid="save-service-btn"]');
    }

    // Step 2: Export configuration
    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="export-configuration-btn"]');

    // Configure export options
    await page.check('[data-testid="include-settings-checkbox"]');
    await page.check('[data-testid="include-workspaces-checkbox"]');
    await page.check('[data-testid="include-services-checkbox"]');

    // Set export file path
    const exportFilePath = path.join(tempDir, 'complete-config-export.json');
    await page.fill('[data-testid="export-file-path-input"]', exportFilePath);

    // Perform export
    await page.click('[data-testid="perform-export-btn"]');

    // Verify export success
    await expect(page.locator('[data-testid="export-success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-success-message"]')).toContainText(
      'Configuration exported successfully'
    );

    // Step 3: Verify exported file exists and has correct structure
    expect(fs.existsSync(exportFilePath)).toBe(true);

    const exportedConfig = JSON.parse(fs.readFileSync(exportFilePath, 'utf8'));

    // Verify configuration structure
    expect(exportedConfig).toHaveProperty('version');
    expect(exportedConfig).toHaveProperty('exportedAt');
    expect(exportedConfig).toHaveProperty('workspaces');
    expect(exportedConfig).toHaveProperty('services');
    expect(exportedConfig).toHaveProperty('settings');

    // Verify workspace data
    expect(exportedConfig.workspaces).toHaveLength(2);
    expect(exportedConfig.workspaces.some((w: any) => w.name === 'Work Environment')).toBe(true);
    expect(exportedConfig.workspaces.some((w: any) => w.name === 'Personal Projects')).toBe(true);

    // Verify service data
    expect(exportedConfig.services).toHaveLength(5); // 3 work + 2 personal
    expect(exportedConfig.services.some((s: any) => s.name === 'Gmail')).toBe(true);
    expect(exportedConfig.services.some((s: any) => s.name === 'GitHub')).toBe(true);

    // Verify default workspace flag
    const defaultWorkspace = exportedConfig.workspaces.find((w: any) => w.isDefault);
    expect(defaultWorkspace?.name).toBe('Work Environment');
  });

  test('Complete import workflow: import and merge configurations', async () => {
    test.setTimeout(testTimeout);

    // Step 1: Create initial configuration
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Existing Workspace');
    await page.click('[data-testid="save-workspace-btn"]');

    await page.click('[data-testid="add-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Existing Service');
    await page.fill('[data-testid="service-url-input"]', 'https://existing.com');
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '🔧');
    await page.click('[data-testid="save-service-btn"]');

    // Step 2: Create configuration file to import
    const importConfigPath = path.join(tempDir, 'import-config.json');
    const importConfig = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaces: [
        {
          id: '12345678-1234-1234-1234-123456789012',
          name: 'Imported Workspace',
          theme: 'system',
          icon: '📥',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      services: [
        {
          id: '12345678-1234-1234-1234-123456789013',
          name: 'Imported Service 1',
          url: 'https://imported1.com',
          workspaceId: '12345678-1234-1234-1234-123456789012',
          icon: '📤',
          iconType: 'emoji',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '12345678-1234-1234-1234-123456789014',
          name: 'Imported Service 2',
          url: 'https://imported2.com',
          workspaceId: '12345678-1234-1234-1234-123456789012',
          icon: '🎯',
          iconType: 'emoji',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      settings: {
        theme: 'dark',
        autoStart: true,
        notifications: true,
      },
    };

    fs.writeFileSync(importConfigPath, JSON.stringify(importConfig, null, 2));

    // Step 3: Import configuration with merge strategy
    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="import-configuration-btn"]');

    // Set import file path
    await page.fill('[data-testid="import-file-path-input"]', importConfigPath);

    // Select merge strategy
    await page.selectOption('[data-testid="merge-strategy-select"]', 'merge');

    // Perform import
    await page.click('[data-testid="perform-import-btn"]');

    // Verify import success
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();

    // Step 4: Verify merged configuration
    await page.click('[data-testid="close-settings-btn"]');

    // Should have both existing and imported workspaces
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(2);
    await expect(page.locator('text=Existing Workspace')).toBeVisible();
    await expect(page.locator('text=Imported Workspace')).toBeVisible();

    // Check imported workspace services
    await page.click('[data-testid="workspace-card"]:has-text("Imported Workspace")');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(2);
    await expect(page.locator('text=Imported Service 1')).toBeVisible();
    await expect(page.locator('text=Imported Service 2')).toBeVisible();

    // Check existing workspace still has its service
    await page.click('[data-testid="workspace-card"]:has-text("Existing Workspace")');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(1);
    await expect(page.locator('text=Existing Service')).toBeVisible();
  });

  test('Import with replace strategy', async () => {
    test.setTimeout(testTimeout);

    // Create initial configuration
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Will Be Replaced');
    await page.click('[data-testid="save-workspace-btn"]');

    // Create replacement configuration
    const replaceConfigPath = path.join(tempDir, 'replace-config.json');
    const replaceConfig = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaces: [
        {
          id: '12345678-1234-1234-1234-123456789015',
          name: 'Replacement Workspace',
          theme: 'light',
          icon: '🔄',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      services: [
        {
          id: '12345678-1234-1234-1234-123456789016',
          name: 'Replacement Service',
          url: 'https://replacement.com',
          workspaceId: '12345678-1234-1234-1234-123456789015',
          icon: '🆕',
          iconType: 'emoji',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      settings: {
        theme: 'light',
        autoStart: false,
        notifications: false,
      },
    };

    fs.writeFileSync(replaceConfigPath, JSON.stringify(replaceConfig, null, 2));

    // Import with replace strategy
    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="import-configuration-btn"]');
    await page.fill('[data-testid="import-file-path-input"]', replaceConfigPath);
    await page.selectOption('[data-testid="merge-strategy-select"]', 'replace');
    await page.click('[data-testid="perform-import-btn"]');

    // Verify replacement
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();
    await page.click('[data-testid="close-settings-btn"]');

    // Should only have replacement workspace
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(1);
    await expect(page.locator('text=Replacement Workspace')).toBeVisible();
    await expect(page.locator('text=Will Be Replaced')).not.toBeVisible();

    // Should have replacement service
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(1);
    await expect(page.locator('text=Replacement Service')).toBeVisible();
  });

  test('Import with skip-duplicates strategy', async () => {
    test.setTimeout(testTimeout);

    // Create workspace with specific name
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Duplicate Workspace');
    await page.click('[data-testid="save-workspace-btn"]');

    await page.click('[data-testid="add-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Duplicate Service');
    await page.fill('[data-testid="service-url-input"]', 'https://original.com');
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '🔄');
    await page.click('[data-testid="save-service-btn"]');

    // Create import config with same names but different content
    const duplicateConfigPath = path.join(tempDir, 'duplicate-config.json');
    const duplicateConfig = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaces: [
        {
          id: '12345678-1234-1234-1234-123456789017',
          name: 'Duplicate Workspace', // Same name as existing
          theme: 'dark', // Different theme
          icon: '🆔',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '12345678-1234-1234-1234-123456789018',
          name: 'New Workspace', // Different name
          theme: 'system',
          icon: '🆕',
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      services: [
        {
          id: '12345678-1234-1234-1234-123456789019',
          name: 'Duplicate Service', // Same name as existing
          url: 'https://duplicate.com', // Different URL
          workspaceId: '12345678-1234-1234-1234-123456789017',
          icon: '🔄',
          iconType: 'emoji',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '12345678-1234-1234-1234-123456789020',
          name: 'New Service', // Different name
          url: 'https://new-service.com',
          workspaceId: '12345678-1234-1234-1234-123456789018',
          icon: '🆕',
          iconType: 'emoji',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      settings: {},
    };

    fs.writeFileSync(duplicateConfigPath, JSON.stringify(duplicateConfig, null, 2));

    // Import with skip-duplicates strategy
    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="import-configuration-btn"]');
    await page.fill('[data-testid="import-file-path-input"]', duplicateConfigPath);
    await page.selectOption('[data-testid="merge-strategy-select"]', 'skip-duplicates');
    await page.click('[data-testid="perform-import-btn"]');

    // Verify import with skipped duplicates
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible();

    // Check import summary for skipped items
    await expect(page.locator('[data-testid="import-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="skipped-items-count"]')).toContainText('2'); // 1 workspace + 1 service skipped

    await page.click('[data-testid="close-settings-btn"]');

    // Should have original + new workspace (duplicate skipped)
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(2);
    await expect(page.locator('text=Duplicate Workspace')).toBeVisible();
    await expect(page.locator('text=New Workspace')).toBeVisible();

    // Original workspace should keep original service URL
    await page.click('[data-testid="workspace-card"]:has-text("Duplicate Workspace")');
    await page.click(
      '[data-testid="service-card"]:has-text("Duplicate Service") [data-testid="service-details-btn"]'
    );
    await expect(page.locator('[data-testid="service-url-display"]')).toContainText(
      'https://original.com'
    );

    // New workspace should have new service
    await page.click('[data-testid="workspace-card"]:has-text("New Workspace")');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(1);
    await expect(page.locator('text=New Service')).toBeVisible();
  });

  test('Configuration backup and restore workflow', async () => {
    test.setTimeout(testTimeout);

    // Create configuration to backup
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Backup Test Workspace');
    await page.selectOption('[data-testid="workspace-theme-select"]', 'dark');
    await page.click('[data-testid="save-workspace-btn"]');

    await page.click('[data-testid="add-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Backup Test Service');
    await page.fill('[data-testid="service-url-input"]', 'https://backup-test.com');
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '💾');
    await page.click('[data-testid="save-service-btn"]');

    // Create automatic backup
    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="backup-settings-tab"]');
    await page.check('[data-testid="enable-auto-backup-checkbox"]');
    await page.fill('[data-testid="backup-directory-input"]', tempDir);
    await page.click('[data-testid="create-backup-now-btn"]');

    // Verify backup created
    await expect(page.locator('[data-testid="backup-success-message"]')).toBeVisible();

    const backupFiles = fs.readdirSync(tempDir).filter(f => f.includes('backup'));
    expect(backupFiles.length).toBeGreaterThan(0);

    // Simulate data loss by clearing configuration
    await page.click('[data-testid="danger-zone-tab"]');
    await page.click('[data-testid="clear-all-data-btn"]');
    await page.click('[data-testid="confirm-clear-data-btn"]');

    // Verify data cleared
    await page.click('[data-testid="close-settings-btn"]');
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(0);

    // Restore from backup
    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="backup-settings-tab"]');

    const latestBackup = backupFiles.sort().pop();
    const backupPath = path.join(tempDir, latestBackup!);

    await page.fill('[data-testid="restore-backup-file-input"]', backupPath);
    await page.click('[data-testid="restore-backup-btn"]');

    // Verify restoration
    await expect(page.locator('[data-testid="restore-success-message"]')).toBeVisible();
    await page.click('[data-testid="close-settings-btn"]');

    // Check restored data
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(1);
    await expect(page.locator('text=Backup Test Workspace')).toBeVisible();
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(1);
    await expect(page.locator('text=Backup Test Service')).toBeVisible();
  });

  test('Error handling in configuration management', async () => {
    test.setTimeout(testTimeout);

    // Test invalid file format import
    const invalidConfigPath = path.join(tempDir, 'invalid-config.json');
    fs.writeFileSync(invalidConfigPath, 'invalid json content');

    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="import-configuration-btn"]');
    await page.fill('[data-testid="import-file-path-input"]', invalidConfigPath);
    await page.selectOption('[data-testid="merge-strategy-select"]', 'merge');
    await page.click('[data-testid="perform-import-btn"]');

    // Should show error for invalid JSON
    await expect(page.locator('[data-testid="import-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error-message"]')).toContainText(
      'Invalid JSON'
    );

    // Test non-existent file import
    const nonExistentPath = path.join(tempDir, 'does-not-exist.json');
    await page.fill('[data-testid="import-file-path-input"]', nonExistentPath);
    await page.click('[data-testid="perform-import-btn"]');

    // Should show file not found error
    await expect(page.locator('[data-testid="import-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error-message"]')).toContainText(
      'File not found'
    );

    // Test export to invalid path
    await page.click('[data-testid="export-configuration-btn"]');
    const invalidExportPath = '/invalid/path/config.json';
    await page.fill('[data-testid="export-file-path-input"]', invalidExportPath);
    await page.click('[data-testid="perform-export-btn"]');

    // Should show export error
    await expect(page.locator('[data-testid="export-error-message"]')).toBeVisible();

    // Test import with malformed configuration structure
    const malformedConfigPath = path.join(tempDir, 'malformed-config.json');
    const malformedConfig = {
      version: '1.0.0',
      workspaces: 'not-an-array', // Should be array
      services: null, // Should be array
    };
    fs.writeFileSync(malformedConfigPath, JSON.stringify(malformedConfig));

    await page.fill('[data-testid="import-file-path-input"]', malformedConfigPath);
    await page.click('[data-testid="perform-import-btn"]');

    // Should show validation error
    await expect(page.locator('[data-testid="import-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-error-message"]')).toContainText(
      'Invalid configuration structure'
    );
  });

  test('Large configuration import/export performance', async () => {
    test.setTimeout(60000);

    // Create large configuration
    const largeWorkspaces = [];
    const largeServices = [];

    // Generate 50 workspaces
    for (let i = 1; i <= 50; i++) {
      const workspaceId = `workspace-${i.toString().padStart(3, '0')}-1234-1234-1234-123456789012`;
      largeWorkspaces.push({
        id: workspaceId,
        name: `Large Workspace ${i}`,
        theme: i % 2 === 0 ? 'light' : 'dark',
        icon: '📁',
        isDefault: i === 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Generate 10 services per workspace
      for (let j = 1; j <= 10; j++) {
        largeServices.push({
          id: `service-${i}-${j}-1234-1234-1234-123456789012`,
          name: `Service ${i}-${j}`,
          url: `https://service-${i}-${j}.example.com`,
          workspaceId: workspaceId,
          icon: '🔗',
          iconType: 'emoji',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const largeConfig = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      workspaces: largeWorkspaces,
      services: largeServices, // 500 services total
      settings: {
        theme: 'system',
        autoStart: true,
        notifications: true,
      },
    };

    const largeConfigPath = path.join(tempDir, 'large-config.json');
    fs.writeFileSync(largeConfigPath, JSON.stringify(largeConfig, null, 2));

    // Test import performance
    const importStartTime = Date.now();

    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="import-configuration-btn"]');
    await page.fill('[data-testid="import-file-path-input"]', largeConfigPath);
    await page.selectOption('[data-testid="merge-strategy-select"]', 'replace');
    await page.click('[data-testid="perform-import-btn"]');

    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible({
      timeout: 30000,
    });

    const importEndTime = Date.now();
    const importDuration = importEndTime - importStartTime;

    // Import should complete in reasonable time (less than 20 seconds)
    expect(importDuration).toBeLessThan(20000);

    await page.click('[data-testid="close-settings-btn"]');

    // Verify all workspaces imported
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(50);

    // Test UI responsiveness with large dataset
    const searchStartTime = Date.now();
    await page.fill('[data-testid="workspace-search-input"]', 'Workspace 1');
    await expect(page.locator('[data-testid="workspace-card"]:visible')).toHaveCount(11); // Workspace 1, 10-19
    const searchEndTime = Date.now();

    // Search should be fast even with large dataset
    expect(searchEndTime - searchStartTime).toBeLessThan(2000);

    // Test export performance
    const exportStartTime = Date.now();
    const largeExportPath = path.join(tempDir, 'large-export.json');

    await page.click('[data-testid="settings-btn"]');
    await page.click('[data-testid="export-configuration-btn"]');
    await page.check('[data-testid="include-settings-checkbox"]');
    await page.check('[data-testid="include-workspaces-checkbox"]');
    await page.check('[data-testid="include-services-checkbox"]');
    await page.fill('[data-testid="export-file-path-input"]', largeExportPath);
    await page.click('[data-testid="perform-export-btn"]');

    await expect(page.locator('[data-testid="export-success-message"]')).toBeVisible({
      timeout: 30000,
    });

    const exportEndTime = Date.now();
    const exportDuration = exportEndTime - exportStartTime;

    // Export should complete in reasonable time (less than 15 seconds)
    expect(exportDuration).toBeLessThan(15000);

    // Verify exported file exists and has correct size
    expect(fs.existsSync(largeExportPath)).toBe(true);
    const exportedData = JSON.parse(fs.readFileSync(largeExportPath, 'utf8'));
    expect(exportedData.workspaces).toHaveLength(50);
    expect(exportedData.services).toHaveLength(500);
  });
});
