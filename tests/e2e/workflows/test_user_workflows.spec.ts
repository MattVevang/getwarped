/**
 * End-to-End test for complete user workflows
 * Tests: workspace creation to service management, full user journey scenarios
 */

import { test, expect, Page, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import * as path from 'path';

// Test configuration
const electronPath = path.join(__dirname, '../../../dist/main.js');
const testTimeout = 30000; // 30 seconds per test

test.describe('E2E Test: Complete User Workflows', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // Launch GetWarped Electron app
    electronApp = await electron.launch({
      args: [electronPath, '--test-mode'],
      timeout: 10000,
    });

    // Wait for the main window
    page = await electronApp.firstWindow();
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    // Close the application
    if (electronApp) {
      await electronApp.close();
    }
  });

  test.beforeEach(async () => {
    // Reset application state before each test
    await page.evaluate(() => {
      // Clear any existing data through the app's reset functionality
      const win = window as any;
      if (win.electronAPI && win.electronAPI.resetAppData) {
        return win.electronAPI.resetAppData();
      }
    });

    // Wait for UI to be ready
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 5000 });
  });

  test('Complete new user workflow: setup workspace and services', async () => {
    test.setTimeout(testTimeout);

    // Step 1: First-time user should see welcome screen
    await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible();
    await expect(page.locator('text=Welcome to GetWarped')).toBeVisible();

    // Step 2: Create first workspace
    await page.click('[data-testid="create-first-workspace-btn"]');

    // Fill workspace details
    await page.fill('[data-testid="workspace-name-input"]', 'My Work Workspace');
    await page.selectOption('[data-testid="workspace-theme-select"]', 'light');
    await page.fill('[data-testid="workspace-icon-input"]', '💼');

    // Save workspace
    await page.click('[data-testid="save-workspace-btn"]');

    // Verify workspace was created
    await expect(page.locator('[data-testid="workspace-card"]')).toBeVisible();
    await expect(page.locator('text=My Work Workspace')).toBeVisible();

    // Step 3: Add first service to the workspace
    await page.click('[data-testid="add-service-btn"]');

    // Fill service details
    await page.fill('[data-testid="service-name-input"]', 'Gmail');
    await page.fill('[data-testid="service-url-input"]', 'https://mail.google.com');
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '📧');

    // Save service
    await page.click('[data-testid="save-service-btn"]');

    // Verify service was created
    await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
    await expect(page.locator('text=Gmail')).toBeVisible();

    // Step 4: Launch the service
    await page.click('[data-testid="service-card"] [data-testid="launch-service-btn"]');

    // Verify service opened in BrowserView
    await expect(page.locator('[data-testid="browser-view-container"]')).toBeVisible();

    // Wait for navigation to complete
    await page.waitForTimeout(2000);

    // Step 5: Add second service (different category)
    await page.click('[data-testid="workspace-services-tab"]');
    await page.click('[data-testid="add-service-btn"]');

    await page.fill('[data-testid="service-name-input"]', 'Slack');
    await page.fill('[data-testid="service-url-input"]', 'https://slack.com');
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '💬');

    await page.click('[data-testid="save-service-btn"]');

    // Verify both services are visible
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(2);
    await expect(page.locator('text=Gmail')).toBeVisible();
    await expect(page.locator('text=Slack')).toBeVisible();

    // Step 6: Switch between services
    await page.click('[data-testid="service-card"]:has-text("Slack")');
    await expect(page.locator('[data-testid="active-service"]')).toContainText('Slack');

    await page.click('[data-testid="service-card"]:has-text("Gmail")');
    await expect(page.locator('[data-testid="active-service"]')).toContainText('Gmail');

    // Step 7: Test service isolation (open both services)
    await page.click(
      '[data-testid="service-card"]:has-text("Gmail") [data-testid="launch-service-btn"]'
    );
    await page.click(
      '[data-testid="service-card"]:has-text("Slack") [data-testid="launch-service-btn"]'
    );

    // Verify both services have separate browser views
    await expect(page.locator('[data-testid="browser-view-tab"]')).toHaveCount(2);

    // Step 8: Create second workspace
    await page.click('[data-testid="workspaces-tab"]');
    await page.click('[data-testid="add-workspace-btn"]');

    await page.fill('[data-testid="workspace-name-input"]', 'Personal Projects');
    await page.selectOption('[data-testid="workspace-theme-select"]', 'dark');
    await page.fill('[data-testid="workspace-icon-input"]', '🏠');

    await page.click('[data-testid="save-workspace-btn"]');

    // Verify second workspace was created
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(2);
    await expect(page.locator('text=Personal Projects')).toBeVisible();

    // Step 9: Add service to second workspace
    await page.click('[data-testid="workspace-card"]:has-text("Personal Projects")');
    await page.click('[data-testid="add-service-btn"]');

    await page.fill('[data-testid="service-name-input"]', 'GitHub');
    await page.fill('[data-testid="service-url-input"]', 'https://github.com');
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '🐙');

    await page.click('[data-testid="save-service-btn"]');

    // Step 10: Verify workspace isolation
    // Switch to first workspace
    await page.click('[data-testid="workspace-card"]:has-text("My Work Workspace")');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(2); // Gmail + Slack
    await expect(page.locator('text=GitHub')).not.toBeVisible();

    // Switch to second workspace
    await page.click('[data-testid="workspace-card"]:has-text("Personal Projects")');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(1); // GitHub only
    await expect(page.locator('text=Gmail')).not.toBeVisible();
    await expect(page.locator('text=Slack')).not.toBeVisible();
  });

  test('Power user workflow: multiple workspaces and service management', async () => {
    test.setTimeout(testTimeout);

    // Create multiple workspaces quickly
    const workspaces = [
      { name: 'Development', theme: 'dark', icon: '⚡' },
      { name: 'Communication', theme: 'light', icon: '💬' },
      { name: 'Productivity', theme: 'system', icon: '📊' },
    ];

    for (const workspace of workspaces) {
      await page.click('[data-testid="add-workspace-btn"]');
      await page.fill('[data-testid="workspace-name-input"]', workspace.name);
      await page.selectOption('[data-testid="workspace-theme-select"]', workspace.theme);
      await page.fill('[data-testid="workspace-icon-input"]', workspace.icon);
      await page.click('[data-testid="save-workspace-btn"]');
    }

    // Verify all workspaces created
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(3);

    // Add services to Development workspace
    await page.click('[data-testid="workspace-card"]:has-text("Development")');

    const devServices = [
      { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
      { name: 'VS Code Web', url: 'https://vscode.dev', icon: '💻' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📚' },
    ];

    for (const service of devServices) {
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', service.name);
      await page.fill('[data-testid="service-url-input"]', service.url);
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', service.icon);
      await page.click('[data-testid="save-service-btn"]');
    }

    // Add services to Communication workspace
    await page.click('[data-testid="workspace-card"]:has-text("Communication")');

    const commServices = [
      { name: 'Slack', url: 'https://slack.com', icon: '💬' },
      { name: 'Discord', url: 'https://discord.com', icon: '🎮' },
      { name: 'Teams', url: 'https://teams.microsoft.com', icon: '👥' },
    ];

    for (const service of commServices) {
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', service.name);
      await page.fill('[data-testid="service-url-input"]', service.url);
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', service.icon);
      await page.click('[data-testid="save-service-btn"]');
    }

    // Test bulk service operations
    await page.click('[data-testid="workspace-card"]:has-text("Development")');

    // Select multiple services
    await page.click(
      '[data-testid="service-card"]:has-text("GitHub") [data-testid="service-checkbox"]'
    );
    await page.click(
      '[data-testid="service-card"]:has-text("VS Code Web") [data-testid="service-checkbox"]'
    );

    // Launch selected services
    await page.click('[data-testid="launch-selected-services-btn"]');

    // Verify multiple browser views opened
    await expect(page.locator('[data-testid="browser-view-tab"]')).toHaveCount(2);

    // Test service search and filtering
    await page.fill('[data-testid="service-search-input"]', 'GitHub');
    await expect(page.locator('[data-testid="service-card"]:visible')).toHaveCount(1);
    await expect(page.locator('[data-testid="service-card"]:visible')).toContainText('GitHub');

    // Clear search
    await page.fill('[data-testid="service-search-input"]', '');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(3);

    // Test workspace switching with keyboard shortcuts
    await page.keyboard.press('Control+1');
    await expect(page.locator('[data-testid="active-workspace"]')).toContainText('Development');

    await page.keyboard.press('Control+2');
    await expect(page.locator('[data-testid="active-workspace"]')).toContainText('Communication');
  });

  test('Service customization and advanced features', async () => {
    test.setTimeout(testTimeout);

    // Create workspace
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Customization Test');
    await page.click('[data-testid="save-workspace-btn"]');

    // Create service with custom settings
    await page.click('[data-testid="add-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Custom Service');
    await page.fill('[data-testid="service-url-input"]', 'https://example.com');

    // Test custom icon upload (file type)
    await page.selectOption('[data-testid="service-icon-type-select"]', 'file');
    // Note: In real implementation, would handle file upload here

    // Switch back to emoji for this test
    await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
    await page.fill('[data-testid="service-icon-input"]', '🔧');

    await page.click('[data-testid="save-service-btn"]');

    // Test service editing
    await page.click('[data-testid="service-card"] [data-testid="edit-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Updated Custom Service');
    await page.fill('[data-testid="service-url-input"]', 'https://updated-example.com');
    await page.click('[data-testid="save-service-btn"]');

    // Verify changes
    await expect(page.locator('text=Updated Custom Service')).toBeVisible();

    // Test service session management
    await page.click('[data-testid="service-card"] [data-testid="launch-service-btn"]');

    // Open service settings
    await page.click('[data-testid="service-card"] [data-testid="service-settings-btn"]');

    // Test session clearing
    await page.click('[data-testid="clear-cookies-btn"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Cookies cleared');

    await page.click('[data-testid="clear-storage-btn"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Storage cleared');

    // Test session isolation verification
    await page.click('[data-testid="session-info-btn"]');
    await expect(page.locator('[data-testid="session-partition"]')).toBeVisible();

    // Test service duplication
    await page.click('[data-testid="service-card"] [data-testid="duplicate-service-btn"]');
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(2);
    await expect(page.locator('text=Updated Custom Service (Copy)')).toBeVisible();
  });

  test('Error recovery and resilience workflow', async () => {
    test.setTimeout(testTimeout);

    // Create workspace and service
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Error Test Workspace');
    await page.click('[data-testid="save-workspace-btn"]');

    // Test invalid URL handling
    await page.click('[data-testid="add-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Invalid URL Service');
    await page.fill('[data-testid="service-url-input"]', 'not-a-url');
    await page.click('[data-testid="save-service-btn"]');

    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid URL');

    // Fix the URL
    await page.fill('[data-testid="service-url-input"]', 'https://httpbin.org/status/404');
    await page.click('[data-testid="save-service-btn"]');

    // Service should be created
    await expect(page.locator('[data-testid="service-card"]')).toBeVisible();

    // Test network error handling
    await page.click('[data-testid="service-card"] [data-testid="launch-service-btn"]');

    // Should handle 404 error gracefully
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-testid="browser-view-error"]')).toBeVisible();

    // Test app recovery after simulated crash
    await page.evaluate(() => {
      // Simulate app state corruption
      const win = window as any;
      if (win.electronAPI && win.electronAPI.simulateStateCorruption) {
        return win.electronAPI.simulateStateCorruption();
      }
    });

    // App should recover and show error recovery UI
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should offer to restore previous session
    if (await page.locator('[data-testid="recovery-dialog"]').isVisible()) {
      await page.click('[data-testid="restore-session-btn"]');

      // Verify workspace and service are restored
      await expect(page.locator('text=Error Test Workspace')).toBeVisible();
      await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
    }

    // Test duplicate name handling
    await page.click('[data-testid="add-service-btn"]');
    await page.fill('[data-testid="service-name-input"]', 'Invalid URL Service'); // Same name as existing
    await page.fill('[data-testid="service-url-input"]', 'https://example.com');
    await page.click('[data-testid="save-service-btn"]');

    // Should either prevent creation or auto-rename
    const serviceCards = await page.locator('[data-testid="service-card"]').count();
    if (serviceCards === 2) {
      // Auto-renamed
      await expect(page.locator('text=Invalid URL Service (1)')).toBeVisible();
    } else {
      // Prevented creation
      await expect(page.locator('[data-testid="error-message"]')).toContainText('already exists');
    }
  });

  test('Accessibility and keyboard navigation', async () => {
    test.setTimeout(testTimeout);

    // Test keyboard navigation through UI
    await page.keyboard.press('Tab'); // Focus first interactive element
    await page.keyboard.press('Enter'); // Activate focused element

    // Navigate through workspace creation
    await page.keyboard.type('Accessibility Workspace');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Save workspace

    // Verify workspace created via keyboard
    await expect(page.locator('text=Accessibility Workspace')).toBeVisible();

    // Test screen reader compatibility
    const createServiceBtn = page.locator('[data-testid="add-service-btn"]');
    await expect(createServiceBtn).toHaveAttribute('aria-label');

    // Test focus management
    await page.click('[data-testid="add-service-btn"]');
    const nameInput = page.locator('[data-testid="service-name-input"]');
    await expect(nameInput).toBeFocused();

    // Test escape key handling
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="service-form"]')).not.toBeVisible();

    // Test keyboard shortcuts
    await page.keyboard.press('Control+n'); // New service shortcut
    await expect(page.locator('[data-testid="service-form"]')).toBeVisible();

    // Fill service form with keyboard
    await page.keyboard.type('Keyboard Service');
    await page.keyboard.press('Tab');
    await page.keyboard.type('https://keyboard-test.com');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip to icon input
    await page.keyboard.type('⌨️');
    await page.keyboard.press('Enter'); // Save

    // Verify service created
    await expect(page.locator('text=Keyboard Service')).toBeVisible();

    // Test service navigation with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // Test context menu with keyboard
    await page.keyboard.press('ContextMenu'); // Right-click equivalent
    if (await page.locator('[data-testid="context-menu"]').isVisible()) {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
  });

  test('Performance and responsiveness under load', async () => {
    test.setTimeout(60000); // Longer timeout for performance test

    // Create workspace
    await page.click('[data-testid="add-workspace-btn"]');
    await page.fill('[data-testid="workspace-name-input"]', 'Performance Test');
    await page.click('[data-testid="save-workspace-btn"]');

    // Create many services quickly
    const serviceCount = 20;
    const startTime = Date.now();

    for (let i = 1; i <= serviceCount; i++) {
      await page.click('[data-testid="add-service-btn"]');
      await page.fill('[data-testid="service-name-input"]', `Service ${i}`);
      await page.fill('[data-testid="service-url-input"]', `https://service${i}.example.com`);
      await page.selectOption('[data-testid="service-icon-type-select"]', 'emoji');
      await page.fill('[data-testid="service-icon-input"]', '🔗');
      await page.click('[data-testid="save-service-btn"]');
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete in reasonable time (less than 30 seconds for 20 services)
    expect(totalTime).toBeLessThan(30000);

    // Verify all services created
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(serviceCount);

    // Test UI responsiveness with many services
    await page.fill('[data-testid="service-search-input"]', 'Service 1');

    // Search should be responsive
    const searchStartTime = Date.now();
    await expect(page.locator('[data-testid="service-card"]:visible')).toHaveCount(11); // Service 1, 10, 11-19
    const searchEndTime = Date.now();

    expect(searchEndTime - searchStartTime).toBeLessThan(1000); // Search should be under 1 second

    // Test scrolling performance
    await page.fill('[data-testid="service-search-input"]', ''); // Clear search

    // Scroll through services
    const serviceContainer = page.locator('[data-testid="services-container"]');
    await serviceContainer.hover();

    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }

    // UI should remain responsive
    await expect(page.locator('[data-testid="service-card"]').first()).toBeVisible();

    // Test memory usage (if available through DevTools)
    const memoryInfo = await page.evaluate(() => {
      const perf = performance as any;
      if (perf.memory) {
        return {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
        };
      }
      return null;
    });

    if (memoryInfo) {
      // Memory usage should be reasonable (less than 100MB for JS heap)
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    }
  });
});
