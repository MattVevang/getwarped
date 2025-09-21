/**
 * Main process entry point for GetWarped Electron application
 * Handles application lifecycle, window management, and IPC communication
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';

/**
 * Create the main application window
 */
function createWindow(): void {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    minHeight: 600,
    minWidth: 800,
    show: false, // Don't show until ready-to-show
    webPreferences: {
      nodeIntegration: false, // Security: Disable node integration
      contextIsolation: true, // Security: Enable context isolation
      preload: path.join(__dirname, '../renderer/preload.js'), // TODO: Create preload script
    },
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../../assets/icons/icon.png'), // TODO: Add application icon
  });

  // Load the renderer process
  if (process.env['NODE_ENV'] === 'development') {
    mainWindow.loadURL('http://localhost:9000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    // Usually you would store windows in an array if your app supports multi windows
    // This is the time when you should delete the corresponding element.
  });
}

/**
 * This method will be called when Electron has finished initialization
 * and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(createWindow);

/**
 * Quit when all windows are closed, except on macOS.
 * On macOS it is common for applications and their menu bar
 * to stay active until the user quits explicitly with Cmd + Q.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * On macOS it's common to re-create a window in the app when the
 * dock icon is clicked and there are no other windows open.
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Security: Prevent new window creation from renderer
 */
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // eslint-disable-next-line no-console
    console.log('Blocked new window creation to:', url);
    return { action: 'deny' };
  });
});

// TODO: Initialize IPC handlers
// TODO: Initialize service managers
// TODO: Setup logging and monitoring
// TODO: Setup security policies
