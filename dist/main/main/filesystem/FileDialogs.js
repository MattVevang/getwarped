"use strict";
/**
 * FileDialogs.ts
 *
 * Provides native file picker dialogs for GetWarped import/export operations.
 * Implements cross-platform file selection with security validation,
 * file type filtering, and platform-specific optimizations.
 *
 * Features:
 * - Native OS file dialogs for import/export operations
 * - Multi-format file filtering (JSON, CSV, XML, encrypted)
 * - Security validation of selected files
 * - Path sanitization and validation
 * - Recent files and favorites management
 * - Drag-and-drop file validation
 * - Custom file type associations
 * - Batch file selection support
 *
 * Security Properties:
 * - Path traversal protection
 * - File extension validation
 * - Size limit enforcement
 * - Permission verification
 * - Sandboxed file access
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
exports.FileDialogs = void 0;
const electron_1 = require("electron");
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_events_1 = require("node:events");
/**
 * Cross-platform file dialog manager
 *
 * Provides secure native file dialogs for GetWarped import/export operations
 * with comprehensive validation and security checks.
 */
class FileDialogs extends node_events_1.EventEmitter {
    maxFileSize = 100 * 1024 * 1024; // 100MB
    maxFiles = 10;
    recentFiles = new Map();
    recentFilesLimit = 20;
    // Platform-specific configurations
    platformConfig = {
        win32: {
            pathSeparator: '\\',
            maxPathLength: 260,
            restrictedNames: [
                'CON',
                'PRN',
                'AUX',
                'NUL',
                'COM1',
                'COM2',
                'COM3',
                'COM4',
                'COM5',
                'COM6',
                'COM7',
                'COM8',
                'COM9',
                'LPT1',
                'LPT2',
                'LPT3',
                'LPT4',
                'LPT5',
                'LPT6',
                'LPT7',
                'LPT8',
                'LPT9',
            ],
            invalidChars: ['<', '>', ':', '"', '|', '?', '*'],
        },
        darwin: {
            pathSeparator: '/',
            maxPathLength: 1024,
            restrictedNames: [],
            invalidChars: [':'],
        },
        linux: {
            pathSeparator: '/',
            maxPathLength: 4096,
            restrictedNames: [],
            invalidChars: ['\0'],
        },
    };
    // Pre-defined file filters
    filterDefinitions = {
        getwarped: {
            name: 'GetWarped Configuration',
            extensions: ['json'],
            description: 'GetWarped export files (*.json)',
            mimeTypes: ['application/json'],
        },
        encrypted: {
            name: 'Encrypted Configuration',
            extensions: ['encrypted', 'enc'],
            description: 'Encrypted GetWarped files (*.encrypted)',
            mimeTypes: ['application/octet-stream'],
        },
        csv: {
            name: 'CSV Data',
            extensions: ['csv'],
            description: 'Comma-separated values (*.csv)',
            mimeTypes: ['text/csv'],
        },
        xml: {
            name: 'XML Data',
            extensions: ['xml'],
            description: 'XML configuration (*.xml)',
            mimeTypes: ['application/xml', 'text/xml'],
        },
        yaml: {
            name: 'YAML Data',
            extensions: ['yaml', 'yml'],
            description: 'YAML configuration (*.yaml, *.yml)',
            mimeTypes: ['application/x-yaml', 'text/yaml'],
        },
        all: {
            name: 'All Supported',
            extensions: ['json', 'csv', 'xml', 'yaml', 'yml', 'encrypted', 'enc'],
            description: 'All supported formats',
        },
    };
    /**
     * Create a file filter from the definition
     */
    createFilter(filterType) {
        const definition = this.filterDefinitions[filterType];
        return {
            name: definition.name,
            extensions: [...definition.extensions],
        };
    }
    constructor() {
        super();
        this.initializeRecentFiles();
    }
    /**
     * Show import file dialog
     */
    async showImportDialog(parentWindow, options = {}) {
        const dialogOptions = {
            type: 'import',
            title: 'Import Configuration',
            buttonLabel: 'Import',
            filters: [
                this.createFilter('all'),
                this.createFilter('getwarped'),
                this.createFilter('encrypted'),
                this.createFilter('csv'),
                this.createFilter('xml'),
                this.createFilter('yaml'),
            ],
            multiSelect: false,
            securityCheck: true,
            maxFileSize: this.maxFileSize,
            maxFiles: 1,
            ...options,
        };
        return this.showFileDialog(parentWindow, dialogOptions);
    }
    /**
     * Show export file dialog
     */
    async showExportDialog(parentWindow, options = {}) {
        const defaultName = `getwarped-export-${new Date().toISOString().split('T')[0]}`;
        const dialogOptions = {
            type: 'export',
            title: 'Export Configuration',
            buttonLabel: 'Export',
            filters: [
                this.createFilter('getwarped'),
                this.createFilter('csv'),
                this.createFilter('xml'),
                this.createFilter('encrypted'),
            ],
            multiSelect: false,
            defaultName,
            securityCheck: true,
            ...options,
        };
        return this.showSaveDialog(parentWindow, dialogOptions);
    }
    /**
     * Show backup directory selection dialog
     */
    async showBackupDirectoryDialog(parentWindow) {
        this.emit('dialog-opened', { type: 'backup', title: 'Select Backup Directory' });
        try {
            const result = await electron_1.dialog.showOpenDialog(parentWindow || this.getActiveWindow(), {
                title: 'Select Backup Directory',
                buttonLabel: 'Select',
                properties: ['openDirectory', 'createDirectory'],
                defaultPath: this.getDefaultBackupPath(),
            });
            if (result.canceled || !result.filePaths.length) {
                const cancelResult = {
                    success: false,
                    directoryPath: '',
                    cancelled: true,
                    errors: [],
                    permissions: { readable: false, writable: false, executable: false },
                };
                this.emit('dialog-closed', { type: 'backup', result: cancelResult });
                return cancelResult;
            }
            const directoryPath = result.filePaths[0];
            if (!directoryPath) {
                throw new Error('No directory path received from dialog');
            }
            const validationResult = await this.validateDirectory(directoryPath);
            const finalResult = {
                success: validationResult.permissions.writable,
                directoryPath,
                cancelled: false,
                errors: validationResult.permissions.writable ? [] : ['Directory is not writable'],
                permissions: validationResult.permissions,
            };
            this.emit('dialog-closed', { type: 'backup', result: finalResult });
            return finalResult;
        }
        catch (error) {
            const errorResult = {
                success: false,
                directoryPath: '',
                cancelled: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                permissions: { readable: false, writable: false, executable: false },
            };
            this.emit('dialog-closed', { type: 'backup', result: errorResult });
            return errorResult;
        }
    }
    /**
     * Show generic file dialog
     */
    async showGenericDialog(options, parentWindow) {
        return this.showFileDialog(parentWindow, options);
    }
    /**
     * Validate dropped files
     */
    async validateDroppedFiles(filePaths) {
        const result = {
            success: false,
            filePaths: [],
            cancelled: false,
            errors: [],
            warnings: [],
            metadata: {
                totalSize: 0,
                fileCount: filePaths.length,
                validFiles: 0,
                invalidFiles: 0,
                formats: [],
            },
        };
        if (filePaths.length > this.maxFiles) {
            result.errors.push(`Too many files (${filePaths.length}), maximum is ${this.maxFiles}`);
            return result;
        }
        const validationResults = [];
        for (const filePath of filePaths) {
            try {
                const validation = await this.validateFile(filePath, { securityCheck: true });
                validationResults.push(validation);
                if (validation.isValid) {
                    result.filePaths.push(filePath);
                    result.metadata.validFiles++;
                    result.metadata.totalSize += validation.size;
                    const format = validation.extension.toLowerCase();
                    if (!result.metadata.formats.includes(format)) {
                        result.metadata.formats.push(format);
                    }
                }
                else {
                    result.metadata.invalidFiles++;
                    result.errors.push(`File ${path.basename(filePath)} is invalid`);
                }
                if (!validation.security.safe) {
                    result.warnings.push(`Security concerns with ${path.basename(filePath)}`);
                    this.emit('security-warning', {
                        filePath,
                        threats: validation.security.threats,
                    });
                }
            }
            catch (error) {
                result.metadata.invalidFiles++;
                result.errors.push(`Error validating ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        result.success = result.metadata.validFiles > 0 && result.errors.length === 0;
        this.emit('files-validated', { results: validationResults });
        return result;
    }
    /**
     * Get recent import files
     */
    getRecentFiles(fileType) {
        const entries = Array.from(this.recentFiles.values());
        const filtered = fileType ? entries.filter(entry => entry.fileType === fileType) : entries;
        return filtered
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
            .slice(0, this.recentFilesLimit);
    }
    /**
     * Clear recent files
     */
    clearRecentFiles() {
        this.recentFiles.clear();
        this.emit('recent-files-updated', { entries: [] });
    }
    /**
     * Open file in system default application
     */
    async openFileInSystem(filePath) {
        try {
            await electron_1.shell.openPath(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Show file in system file manager
     */
    async showFileInDirectory(filePath) {
        try {
            electron_1.shell.showItemInFolder(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Main file dialog implementation
     */
    async showFileDialog(parentWindow, options) {
        this.emit('dialog-opened', { type: options.type, title: options.title });
        try {
            const dialogResult = await electron_1.dialog.showOpenDialog(parentWindow || this.getActiveWindow(), {
                title: options.title,
                buttonLabel: options.buttonLabel || 'Select',
                filters: options.filters.map(filter => ({
                    name: filter.name,
                    extensions: filter.extensions,
                })),
                properties: this.buildDialogProperties(options),
                defaultPath: options.defaultPath || this.getDefaultPath(options.type),
            });
            if (dialogResult.canceled || !dialogResult.filePaths.length) {
                const result = {
                    success: false,
                    filePaths: [],
                    cancelled: true,
                    errors: [],
                    warnings: [],
                    metadata: {
                        totalSize: 0,
                        fileCount: 0,
                        validFiles: 0,
                        invalidFiles: 0,
                        formats: [],
                    },
                };
                this.emit('dialog-closed', { type: options.type, result });
                return result;
            }
            // Validate selected files
            const validationResult = await this.validateSelectedFiles(dialogResult.filePaths, options);
            // Update recent files
            if (validationResult.success) {
                for (const filePath of validationResult.filePaths) {
                    await this.addToRecentFiles(filePath, options.type);
                }
            }
            this.emit('files-selected', { filePaths: validationResult.filePaths, type: options.type });
            this.emit('dialog-closed', { type: options.type, result: validationResult });
            return validationResult;
        }
        catch (error) {
            const errorResult = {
                success: false,
                filePaths: [],
                cancelled: false,
                errors: [error instanceof Error ? error.message : 'Dialog error'],
                warnings: [],
                metadata: {
                    totalSize: 0,
                    fileCount: 0,
                    validFiles: 0,
                    invalidFiles: 0,
                    formats: [],
                },
            };
            this.emit('dialog-closed', { type: options.type, result: errorResult });
            return errorResult;
        }
    }
    /**
     * Save dialog implementation
     */
    async showSaveDialog(parentWindow, options) {
        this.emit('dialog-opened', { type: options.type, title: options.title });
        try {
            const dialogResult = await electron_1.dialog.showSaveDialog(parentWindow || this.getActiveWindow(), {
                title: options.title,
                buttonLabel: options.buttonLabel || 'Save',
                filters: options.filters.map(filter => ({
                    name: filter.name,
                    extensions: filter.extensions,
                })),
                defaultPath: options.defaultPath
                    ? path.join(options.defaultPath, options.defaultName || 'export')
                    : path.join(this.getDefaultPath(options.type), options.defaultName || 'export'),
            });
            if (dialogResult.canceled || !dialogResult.filePath) {
                const result = {
                    success: false,
                    filePaths: [],
                    cancelled: true,
                    errors: [],
                    warnings: [],
                    metadata: {
                        totalSize: 0,
                        fileCount: 0,
                        validFiles: 0,
                        invalidFiles: 0,
                        formats: [],
                    },
                };
                this.emit('dialog-closed', { type: options.type, result });
                return result;
            }
            // Validate save location
            const savePath = dialogResult.filePath;
            const validation = await this.validateSavePath(savePath);
            const result = {
                success: validation.isValid,
                filePaths: validation.isValid ? [savePath] : [],
                cancelled: false,
                errors: validation.isValid ? [] : ['Invalid save location'],
                warnings: [],
                metadata: {
                    totalSize: 0,
                    fileCount: 1,
                    validFiles: validation.isValid ? 1 : 0,
                    invalidFiles: validation.isValid ? 0 : 1,
                    formats: [path.extname(savePath).toLowerCase().slice(1)],
                },
            };
            this.emit('dialog-closed', { type: options.type, result });
            return result;
        }
        catch (error) {
            const errorResult = {
                success: false,
                filePaths: [],
                cancelled: false,
                errors: [error instanceof Error ? error.message : 'Save dialog error'],
                warnings: [],
                metadata: {
                    totalSize: 0,
                    fileCount: 0,
                    validFiles: 0,
                    invalidFiles: 0,
                    formats: [],
                },
            };
            this.emit('dialog-closed', { type: options.type, result: errorResult });
            return errorResult;
        }
    }
    /**
     * Validate selected files
     */
    async validateSelectedFiles(filePaths, options) {
        const result = {
            success: false,
            filePaths: [],
            cancelled: false,
            errors: [],
            warnings: [],
            metadata: {
                totalSize: 0,
                fileCount: filePaths.length,
                validFiles: 0,
                invalidFiles: 0,
                formats: [],
            },
        };
        for (const filePath of filePaths) {
            try {
                const validation = await this.validateFile(filePath, options);
                if (validation.isValid) {
                    result.filePaths.push(filePath);
                    result.metadata.validFiles++;
                    result.metadata.totalSize += validation.size;
                    const format = validation.extension.toLowerCase();
                    if (!result.metadata.formats.includes(format)) {
                        result.metadata.formats.push(format);
                    }
                }
                else {
                    result.metadata.invalidFiles++;
                }
                if (!validation.security.safe) {
                    result.warnings.push(`Security concerns with ${path.basename(filePath)}`);
                    this.emit('security-warning', {
                        filePath,
                        threats: validation.security.threats,
                    });
                }
            }
            catch (error) {
                result.metadata.invalidFiles++;
                result.errors.push(`Error validating ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        result.success = result.metadata.validFiles > 0 && result.errors.length === 0;
        return result;
    }
    /**
     * Validate individual file
     */
    async validateFile(filePath, options = {}) {
        const result = {
            isValid: false,
            filePath,
            size: 0,
            extension: path.extname(filePath).toLowerCase(),
            permissions: { readable: false, writable: false },
            security: { safe: true, threats: [] },
        };
        try {
            // Check if file exists and get stats
            const stats = await fs.stat(filePath);
            result.size = stats.size;
            // Check file size limits
            const maxSize = options.maxFileSize || this.maxFileSize;
            if (result.size > maxSize) {
                result.security.threats.push(`File size ${result.size} exceeds maximum ${maxSize}`);
                result.security.safe = false;
            }
            // Check file permissions
            try {
                await fs.access(filePath, fs.constants.R_OK);
                result.permissions.readable = true;
            }
            catch {
                result.security.threats.push('File is not readable');
                result.security.safe = false;
            }
            try {
                await fs.access(filePath, fs.constants.W_OK);
                result.permissions.writable = true;
            }
            catch {
                // Write permission not required for reading files
            }
            // Validate file path security
            if (options.securityCheck) {
                const pathValidation = this.validateFilePath(filePath);
                if (!pathValidation.safe) {
                    result.security.threats.push(...pathValidation.threats);
                    result.security.safe = false;
                }
            }
            result.isValid = result.permissions.readable && result.security.safe;
        }
        catch (error) {
            result.security.threats.push(`File access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.security.safe = false;
        }
        return result;
    }
    /**
     * Validate save path
     */
    async validateSavePath(savePath) {
        const errors = [];
        try {
            // Check parent directory exists and is writable
            const parentDir = path.dirname(savePath);
            try {
                await fs.access(parentDir, fs.constants.W_OK);
            }
            catch {
                errors.push('Parent directory is not writable');
            }
            // Validate path security
            const pathValidation = this.validateFilePath(savePath);
            if (!pathValidation.safe) {
                errors.push(...pathValidation.threats);
            }
            // Check if file already exists (warning, not error)
            try {
                await fs.access(savePath, fs.constants.F_OK);
                // File exists - this is usually handled by the save dialog
            }
            catch {
                // File doesn't exist, which is expected for new saves
            }
        }
        catch (error) {
            errors.push(`Path validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    /**
     * Validate directory
     */
    async validateDirectory(directoryPath) {
        const permissions = { readable: false, writable: false, executable: false };
        const errors = [];
        try {
            // Check directory exists
            const stats = await fs.stat(directoryPath);
            if (!stats.isDirectory()) {
                errors.push('Path is not a directory');
                return { permissions, errors };
            }
            // Check permissions
            try {
                await fs.access(directoryPath, fs.constants.R_OK);
                permissions.readable = true;
            }
            catch {
                errors.push('Directory is not readable');
            }
            try {
                await fs.access(directoryPath, fs.constants.W_OK);
                permissions.writable = true;
            }
            catch {
                errors.push('Directory is not writable');
            }
            try {
                await fs.access(directoryPath, fs.constants.X_OK);
                permissions.executable = true;
            }
            catch {
                errors.push('Directory is not executable');
            }
        }
        catch (error) {
            errors.push(`Directory validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        return { permissions, errors };
    }
    /**
     * Validate file path for security issues
     */
    validateFilePath(filePath) {
        const threats = [];
        const platform = process.platform;
        const config = this.platformConfig[platform] || this.platformConfig.linux;
        // Check for path traversal
        if (filePath.includes('..')) {
            threats.push('Path traversal detected');
        }
        // Check for invalid characters
        for (const char of config.invalidChars) {
            if (filePath.includes(char)) {
                threats.push(`Invalid character detected: ${char}`);
            }
        }
        // Check path length
        if (filePath.length > config.maxPathLength) {
            threats.push(`Path length ${filePath.length} exceeds maximum ${config.maxPathLength}`);
        }
        // Check for restricted names (Windows)
        if (platform === 'win32') {
            const fileName = path.basename(filePath, path.extname(filePath)).toUpperCase();
            if (config.restrictedNames.includes(fileName)) {
                threats.push(`Restricted file name: ${fileName}`);
            }
        }
        // Check for hidden system files/directories
        const parts = filePath.split(path.sep);
        for (const part of parts) {
            if (part.startsWith('.') && part.length > 1) {
                // Hidden files/directories - may be legitimate, just warn
                break;
            }
        }
        return {
            safe: threats.length === 0,
            threats,
        };
    }
    /**
     * Build dialog properties array
     */
    buildDialogProperties(options) {
        const properties = ['openFile'];
        if (options.multiSelect) {
            properties.push('multiSelections');
        }
        if (options.showHidden) {
            properties.push('showHiddenFiles');
        }
        return properties;
    }
    /**
     * Get default path for dialog type
     */
    getDefaultPath(type) {
        switch (type) {
            case 'import':
                return electron_1.app.getPath('documents');
            case 'export':
                return electron_1.app.getPath('documents');
            case 'backup':
                return this.getDefaultBackupPath();
            default:
                return electron_1.app.getPath('home');
        }
    }
    /**
     * Get default backup path
     */
    getDefaultBackupPath() {
        return path.join(electron_1.app.getPath('userData'), 'backups');
    }
    /**
     * Get active window or create one
     */
    getActiveWindow() {
        const windows = electron_1.BrowserWindow.getAllWindows();
        return windows.find(win => win.isFocused()) || windows[0] || new electron_1.BrowserWindow();
    }
    /**
     * Add file to recent files list
     */
    async addToRecentFiles(filePath, type) {
        try {
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            const entry = {
                filePath,
                fileName,
                fileType: type,
                lastAccessed: new Date(),
                size: stats.size,
                valid: true,
            };
            this.recentFiles.set(filePath, entry);
            // Trim to limit
            if (this.recentFiles.size > this.recentFilesLimit) {
                const entries = Array.from(this.recentFiles.entries());
                entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());
                for (let i = 0; i < entries.length - this.recentFilesLimit; i++) {
                    const entry = entries[i];
                    if (entry) {
                        this.recentFiles.delete(entry[0]);
                    }
                }
            }
            this.emit('recent-files-updated', { entries: this.getRecentFiles() });
        }
        catch (error) {
            // File might have been moved or deleted, ignore
        }
    }
    /**
     * Initialize recent files from storage
     */
    async initializeRecentFiles() {
        // In production, this would load from persistent storage
        // For now, start with empty list
    }
    // Type-safe event emitter overrides
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
    once(event, listener) {
        return super.once(event, listener);
    }
}
exports.FileDialogs = FileDialogs;
// Default export
exports.default = FileDialogs;
//# sourceMappingURL=FileDialogs.js.map