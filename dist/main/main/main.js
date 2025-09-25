"use strict";
/**
 * Main process entry point for GetWarped Electron application
 * Handles application lifecycle, window management, and IPC communication
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
const electron_1 = require("electron");
const path = __importStar(require("path"));
// Service managers
const ConfigurationManager_1 = require("./services/ConfigurationManager");
const ConfigurationExporter_1 = require("./services/ConfigurationExporter");
const ConfigurationImporter_1 = require("./services/ConfigurationImporter");
const ConfigurationBackupScheduler_1 = require("./services/ConfigurationBackupScheduler");
const ConfigurationMigrationWizard_1 = require("./services/ConfigurationMigrationWizard");
// IPC handlers
const ConfigurationHandlers_1 = require("./handlers/ConfigurationHandlers");
// Global service instances
let configurationManager;
let configurationExporter;
let configurationImporter;
let backupScheduler;
let migrationWizard;
/**
 * Create the main application window
 */
function createWindow() {
    // Create the browser window
    const mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
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
electron_1.app.whenReady().then(async () => {
    await initializeServices();
    createWindow();
});
/**
 * Quit when all windows are closed, except on macOS.
 * On macOS it is common for applications and their menu bar
 * to stay active until the user quits explicitly with Cmd + Q.
 */
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
/**
 * On macOS it's common to re-create a window in the app when the
 * dock icon is clicked and there are no other windows open.
 */
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
/**
 * Security: Prevent new window creation from renderer
 */
electron_1.app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        // eslint-disable-next-line no-console
        console.log('Blocked new window creation to:', url);
        return { action: 'deny' };
    });
});
/**
 * Initialize all service managers and IPC handlers
 */
async function initializeServices() {
    try {
        // Initialize core configuration manager
        configurationManager = new ConfigurationManager_1.ConfigurationManager();
        // Initialize export/import services
        configurationExporter = new ConfigurationExporter_1.ConfigurationExporter(configurationManager);
        configurationImporter = new ConfigurationImporter_1.ConfigurationImporter(configurationManager);
        // Initialize backup scheduler
        backupScheduler = new ConfigurationBackupScheduler_1.ConfigurationBackupScheduler(configurationManager, configurationExporter);
        // Initialize migration wizard
        migrationWizard = new ConfigurationMigrationWizard_1.ConfigurationMigrationWizard(configurationManager, configurationImporter, configurationExporter);
        // Check for migrations on startup
        const migrationPlan = await migrationWizard.checkMigrationNeeded();
        if (migrationPlan) {
            // TODO: Show migration prompt in UI
            void migrationPlan;
        }
        // Start backup scheduler
        await backupScheduler.start();
        // Initialize IPC handlers
        new ConfigurationHandlers_1.ConfigurationHandlers();
        // Handlers register themselves automatically in constructor
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        void errorMessage; // Suppress console warning for now
        electron_1.app.quit();
    }
}
//# sourceMappingURL=main.js.map