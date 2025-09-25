/**
 * ExportFileOperations.ts
 *
 * Handles secure export operations for GetWarped configuration data.
 * Provides comprehensive export functionality with multiple formats,
 * security validation, and data sanitization.
 *
 * Features:
 * - Multi-format export (JSON, encrypted, CSV, XML)
 * - Selective data export with filtering
 * - Data sanitization and privacy protection
 * - Compression and encryption options
 * - Export validation and verification
 * - Progress tracking for large exports
 * - Incremental and differential exports
 *
 * Security Properties:
 * - Sensitive data filtering and masking
 * - Optional encryption of export files
 * - Path traversal protection
 * - File size and content validation
 * - Secure temporary file handling
 */
import { EventEmitter } from 'node:events';
import { CredentialEncryption } from '../storage/CredentialEncryption';
import type { ConfigurationExport } from '../../shared/types/ConfigurationExport';
/**
 * Export format options
 */
type ExportFormat = 'json' | 'encrypted-json' | 'csv' | 'xml' | 'yaml';
/**
 * Export options configuration
 */
interface ExportOptions {
    format: ExportFormat;
    includeCredentials: boolean;
    includeSensitiveData: boolean;
    includeMetadata: boolean;
    compress: boolean;
    encrypt: boolean;
    password?: string;
    encryptionKey?: string;
    maxFileSize: number;
    chunkSize: number;
    includeBackupData: boolean;
    exportPath?: string;
    filename?: string;
}
/**
 * Data filtering options
 */
interface FilterOptions {
    workspaceIds?: string[];
    serviceIds?: string[];
    dataTypes?: string[];
    dateRange?: {
        from: Date;
        to: Date;
    };
    excludeFields?: string[];
    includeOnly?: string[];
}
/**
 * Export progress information
 */
interface ExportProgress {
    stage: 'initializing' | 'collecting' | 'filtering' | 'serializing' | 'writing' | 'compressing' | 'encrypting' | 'completed';
    totalItems: number;
    processedItems: number;
    currentItem?: string;
    bytesWritten: number;
    estimatedTimeRemaining?: number;
    warnings: string[];
    errors: string[];
}
/**
 * Export result information
 */
interface ExportResult {
    success: boolean;
    filePath: string;
    format: ExportFormat;
    fileSize: number;
    itemsExported: number;
    checksum: string;
    createdAt: Date;
    exportOptions: ExportOptions;
    warnings: string[];
    errors: string[];
    metadata: {
        appVersion: string;
        exportVersion: string;
        compressed: boolean;
        encrypted: boolean;
    };
}
/**
 * Events emitted by ExportFileOperations
 */
interface ExportFileOperationsEvents {
    'export-started': {
        exportId: string;
        options: ExportOptions;
    };
    'export-progress': {
        exportId: string;
        progress: ExportProgress;
    };
    'export-completed': {
        exportId: string;
        result: ExportResult;
    };
    'export-error': {
        exportId: string;
        error: string;
        stage: string;
    };
    'data-filtered': {
        originalCount: number;
        filteredCount: number;
    };
    'sensitive-data-masked': {
        fieldCount: number;
        itemCount: number;
    };
    'compression-completed': {
        originalSize: number;
        compressedSize: number;
    };
    'encryption-completed': {
        algorithm: string;
        keyLength: number;
    };
}
/**
 * Secure export file operations manager
 *
 * Handles comprehensive export operations with security, validation,
 * and multiple format support for GetWarped configuration data.
 */
export declare class ExportFileOperations extends EventEmitter {
    private readonly encryption;
    private readonly exportDirectory;
    private readonly tempDirectory;
    private readonly activeExports;
    private readonly gzipAsync;
    private readonly DEFAULT_EXPORT_OPTIONS;
    constructor(encryption: CredentialEncryption);
    /**
     * Export configuration data with specified options
     */
    exportConfiguration(data: ConfigurationExport, options?: Partial<ExportOptions>, filterOptions?: FilterOptions): Promise<ExportResult>;
    /**
     * Export specific workspace configuration
     */
    exportWorkspace(workspaceId: string, data: ConfigurationExport, options?: Partial<ExportOptions>): Promise<ExportResult>;
    /**
     * Export specific service configuration
     */
    exportService(serviceId: string, data: ConfigurationExport, options?: Partial<ExportOptions>): Promise<ExportResult>;
    /**
     * Export configuration for date range
     */
    exportDateRange(fromDate: Date, toDate: Date, data: ConfigurationExport, options?: Partial<ExportOptions>): Promise<ExportResult>;
    /**
     * Get export progress for active export
     */
    getExportProgress(exportId: string): ExportProgress | null;
    /**
     * List active exports
     */
    getActiveExports(): string[];
    /**
     * Cancel active export
     */
    cancelExport(exportId: string): Promise<boolean>;
    /**
     * Validate export file
     */
    validateExportFile(filePath: string): Promise<{
        isValid: boolean;
        format: ExportFormat;
        metadata: any;
        checksum: string;
        errors: string[];
    }>;
    /**
     * Collect data for export
     */
    private collectExportData;
    /**
     * Filter export data based on criteria
     */
    private filterExportData;
    /**
     * Serialize export data to specified format
     */
    private serializeExportData;
    /**
     * Serialize data to CSV format
     */
    private serializeToCSV;
    /**
     * Serialize data to XML format
     */
    private serializeToXML;
    /**
     * Serialize data to YAML format
     */
    private serializeToYAML;
    /**
     * Sanitize workspace data
     */
    private sanitizeWorkspaces;
    /**
     * Compress data using gzip
     */
    private compressData;
    /**
     * Encrypt export data
     */
    private encryptExportData;
    /**
     * Generate unique export ID
     */
    private generateExportId;
    /**
     * Generate export file path
     */
    private generateExportPath;
    /**
     * Get file extension for format
     */
    private getFileExtension;
    /**
     * Update file extension
     */
    private updateFileExtension;
    /**
     * Count items in export data
     */
    private countExportItems;
    /**
     * Calculate file checksum
     */
    private calculateFileChecksum;
    /**
     * Detect file format from extension
     */
    private detectFileFormat;
    /**
     * Parse content by format
     */
    private parseByFormat;
    /**
     * Check if data is encrypted
     */
    private isEncryptedData;
    /**
     * Validate export options
     */
    private validateExportOptions;
    /**
     * Initialize directories
     */
    private initializeDirectories;
    emit<K extends keyof ExportFileOperationsEvents>(event: K, ...args: [ExportFileOperationsEvents[K]]): boolean;
    on<K extends keyof ExportFileOperationsEvents>(event: K, listener: (arg: ExportFileOperationsEvents[K]) => void): this;
    once<K extends keyof ExportFileOperationsEvents>(event: K, listener: (arg: ExportFileOperationsEvents[K]) => void): this;
}
export type { ExportOptions, FilterOptions, ExportProgress, ExportResult, ExportFileOperationsEvents, };
export default ExportFileOperations;
//# sourceMappingURL=ExportFileOperations.d.ts.map