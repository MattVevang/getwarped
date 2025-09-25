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
import { BrowserWindow } from 'electron';
import { EventEmitter } from 'node:events';
/**
 * File dialog types
 */
type DialogType = 'import' | 'export' | 'backup' | 'generic';
/**
 * File filter configuration
 */
interface FileFilter {
    name: string;
    extensions: string[];
    description?: string;
    mimeTypes?: string[];
}
/**
 * Dialog options for file selection
 */
interface FileDialogOptions {
    type: DialogType;
    title: string;
    buttonLabel?: string;
    filters: FileFilter[];
    multiSelect?: boolean;
    defaultPath?: string;
    defaultName?: string;
    showHidden?: boolean;
    securityCheck?: boolean;
    maxFileSize?: number;
    maxFiles?: number;
}
/**
 * File selection result
 */
interface FileSelectionResult {
    success: boolean;
    filePaths: string[];
    cancelled: boolean;
    errors: string[];
    warnings: string[];
    metadata: {
        totalSize: number;
        fileCount: number;
        validFiles: number;
        invalidFiles: number;
        formats: string[];
    };
}
/**
 * Directory selection result
 */
interface DirectorySelectionResult {
    success: boolean;
    directoryPath: string;
    cancelled: boolean;
    errors: string[];
    permissions: {
        readable: boolean;
        writable: boolean;
        executable: boolean;
    };
}
/**
 * File validation result
 */
interface FileValidationResult {
    isValid: boolean;
    filePath: string;
    size: number;
    extension: string;
    mimeType?: string;
    permissions: {
        readable: boolean;
        writable: boolean;
    };
    security: {
        safe: boolean;
        threats: string[];
    };
}
/**
 * Recent file entry
 */
interface RecentFileEntry {
    filePath: string;
    fileName: string;
    fileType: string;
    lastAccessed: Date;
    size: number;
    valid: boolean;
}
/**
 * Events emitted by FileDialogs
 */
interface FileDialogsEvents {
    'dialog-opened': {
        type: DialogType;
        title: string;
    };
    'dialog-closed': {
        type: DialogType;
        result: FileSelectionResult | DirectorySelectionResult;
    };
    'files-selected': {
        filePaths: string[];
        type: DialogType;
    };
    'files-validated': {
        results: FileValidationResult[];
    };
    'security-warning': {
        filePath: string;
        threats: string[];
    };
    'recent-files-updated': {
        entries: RecentFileEntry[];
    };
}
/**
 * Cross-platform file dialog manager
 *
 * Provides secure native file dialogs for GetWarped import/export operations
 * with comprehensive validation and security checks.
 */
export declare class FileDialogs extends EventEmitter {
    private readonly maxFileSize;
    private readonly maxFiles;
    private readonly recentFiles;
    private readonly recentFilesLimit;
    private readonly platformConfig;
    private readonly filterDefinitions;
    /**
     * Create a file filter from the definition
     */
    private createFilter;
    constructor();
    /**
     * Show import file dialog
     */
    showImportDialog(parentWindow?: BrowserWindow, options?: Partial<FileDialogOptions>): Promise<FileSelectionResult>;
    /**
     * Show export file dialog
     */
    showExportDialog(parentWindow?: BrowserWindow, options?: Partial<FileDialogOptions>): Promise<FileSelectionResult>;
    /**
     * Show backup directory selection dialog
     */
    showBackupDirectoryDialog(parentWindow?: BrowserWindow): Promise<DirectorySelectionResult>;
    /**
     * Show generic file dialog
     */
    showGenericDialog(options: FileDialogOptions, parentWindow?: BrowserWindow): Promise<FileSelectionResult>;
    /**
     * Validate dropped files
     */
    validateDroppedFiles(filePaths: string[]): Promise<FileSelectionResult>;
    /**
     * Get recent import files
     */
    getRecentFiles(fileType?: string): RecentFileEntry[];
    /**
     * Clear recent files
     */
    clearRecentFiles(): void;
    /**
     * Open file in system default application
     */
    openFileInSystem(filePath: string): Promise<boolean>;
    /**
     * Show file in system file manager
     */
    showFileInDirectory(filePath: string): Promise<boolean>;
    /**
     * Main file dialog implementation
     */
    private showFileDialog;
    /**
     * Save dialog implementation
     */
    private showSaveDialog;
    /**
     * Validate selected files
     */
    private validateSelectedFiles;
    /**
     * Validate individual file
     */
    private validateFile;
    /**
     * Validate save path
     */
    private validateSavePath;
    /**
     * Validate directory
     */
    private validateDirectory;
    /**
     * Validate file path for security issues
     */
    private validateFilePath;
    /**
     * Build dialog properties array
     */
    private buildDialogProperties;
    /**
     * Get default path for dialog type
     */
    private getDefaultPath;
    /**
     * Get default backup path
     */
    private getDefaultBackupPath;
    /**
     * Get active window or create one
     */
    private getActiveWindow;
    /**
     * Add file to recent files list
     */
    private addToRecentFiles;
    /**
     * Initialize recent files from storage
     */
    private initializeRecentFiles;
    emit<K extends keyof FileDialogsEvents>(event: K, ...args: [FileDialogsEvents[K]]): boolean;
    on<K extends keyof FileDialogsEvents>(event: K, listener: (arg: FileDialogsEvents[K]) => void): this;
    once<K extends keyof FileDialogsEvents>(event: K, listener: (arg: FileDialogsEvents[K]) => void): this;
}
export type { FileDialogOptions, FileSelectionResult, DirectorySelectionResult, FileValidationResult, RecentFileEntry, FileFilter, FileDialogsEvents, };
export default FileDialogs;
//# sourceMappingURL=FileDialogs.d.ts.map