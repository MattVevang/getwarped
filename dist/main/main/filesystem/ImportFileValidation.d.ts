/**
 * ImportFileValidation.ts
 *
 * Provides comprehensive validation for imported GetWarped configuration data.
 * Ensures security, data integrity, and compatibility during import operations.
 *
 * Features:
 * - Multi-format import validation (JSON, encrypted, CSV, XML)
 * - Schema validation and structure verification
 * - Se  private async detectFileFormat(filePath: string): Promise<FormatDetectionResult> {
    try {
      await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(filePath).toLowerCase();y scanning for malicious content
 * - Data sanitization and normalization
 * - Compatibility checking across versions
 * - Conflict detection and resolution strategies
 * - URL validation and security checks
 * - Size and complexity limits enforcement
 *
 * Security Properties:
 * - Prevents import of malicious configurations
 * - Validates URL safety and accessibility
 * - Scans for embedded credentials or sensitive data
 * - Enforces data size and complexity limits
 * - Validates file structure against known schemas
 */
import { EventEmitter } from 'node:events';
import { CredentialEncryption } from '../storage/CredentialEncryption';
import { ExportedWorkspace, ExportMetadata, ImportConfiguration } from '../../shared/types/ConfigurationExport';
/**
 * Validation result levels
 */
type ValidationLevel = 'info' | 'warning' | 'error' | 'critical';
/**
 * Individual validation issue
 */
interface ValidationIssue {
    level: ValidationLevel;
    code: string;
    message: string;
    field?: string;
    value?: any;
    suggestion?: string;
}
/**
 * Comprehensive validation result
 */
interface ValidationResult {
    isValid: boolean;
    canImport: boolean;
    issues: ValidationIssue[];
    metadata?: ExportMetadata;
    statistics: {
        workspaceCount: number;
        serviceCount: number;
        fileSize: number;
        formatDetected: string;
        checksumValid: boolean;
    };
    compatibility: {
        compatible: boolean;
        sourceVersion: string;
        targetVersion: string;
        migrationRequired: boolean;
        requiredMigrations: string[];
    };
    security: {
        safe: boolean;
        threats: string[];
        recommendations: string[];
    };
}
/**
 * Import preview information
 */
interface ImportPreview {
    workspacesToImport: ExportedWorkspace[];
    servicesToImport: number;
    conflicts: {
        workspaceNameConflicts: string[];
        serviceUrlConflicts: string[];
        themeConflicts: string[];
    };
    estimates: {
        importTimeMs: number;
        diskSpaceRequired: number;
        memoryRequired: number;
    };
    recommendations: {
        conflictResolution: 'skip' | 'rename' | 'merge';
        suggestedActions: string[];
    };
}
/**
 * File format detection result
 */
interface FormatDetectionResult {
    format: string;
    confidence: number;
    encoding: string;
    compressed: boolean;
    encrypted: boolean;
    version?: string;
}
/**
 * Events emitted by ImportFileValidation
 */
interface ImportFileValidationEvents {
    'validation-started': {
        filePath: string;
        size: number;
    };
    'validation-progress': {
        stage: string;
        progress: number;
    };
    'validation-completed': {
        result: ValidationResult;
    };
    'format-detected': {
        format: FormatDetectionResult;
    };
    'security-scan-completed': {
        threats: string[];
        safe: boolean;
    };
    'schema-validated': {
        valid: boolean;
        errors: string[];
    };
    'compatibility-checked': {
        compatible: boolean;
        migrations: string[];
    };
}
/**
 * Import file validation manager
 *
 * Provides comprehensive validation for configuration import files,
 * ensuring security, compatibility, and data integrity.
 */
export declare class ImportFileValidation extends EventEmitter {
    private readonly maxFileSize;
    private readonly maxWorkspaces;
    private readonly maxServicesPerWorkspace;
    private readonly maxTotalServices;
    private readonly DANGEROUS_PATTERNS;
    private readonly SUSPICIOUS_KEYWORDS;
    private readonly SUPPORTED_FORMATS;
    constructor(_encryption: CredentialEncryption);
    /**
     * Validate import file comprehensively
     */
    validateImportFile(filePath: string, importConfig?: ImportConfiguration): Promise<ValidationResult>;
    /**
     * Generate import preview without full validation
     */
    generateImportPreview(filePath: string, importConfig?: ImportConfiguration): Promise<ImportPreview>;
    /**
     * Validate specific data structure without file I/O
     */
    validateConfigurationData(data: any, importConfig?: ImportConfiguration): Promise<ValidationResult>;
    /**
     * Check if file format is supported
     */
    detectFileFormat(filePath: string): Promise<FormatDetectionResult>;
    /**
     * Basic file validation
     */
    private validateFileBasics;
    /**
     * Read and parse file content
     */
    private readAndParseFile;
    /**
     * Parse content based on format
     */
    private parseContent;
    /**
     * Validate data against schema
     */
    private validateSchema;
    /**
     * Perform security scanning
     */
    private performSecurityScan;
    /**
     * Check version compatibility
     */
    private checkCompatibility;
    /**
     * Validate data content and structure
     */
    private validateData;
    /**
     * Create import preview
     */
    private createImportPreview;
    /**
     * Generate import recommendations
     */
    private generateImportRecommendations;
    /**
     * Assess final validation result
     */
    private assessFinalResult;
    /**
     * Helper methods for format detection and parsing
     */
    private isValidJSON;
    private isValidCSV;
    private isValidXML;
    private detectFormatByContent;
    private isEncryptedData;
    private parseEncryptedJSON;
    private parseCSV;
    private parseXML;
    private parseYAML;
    private isVersionCompatible;
    private getRequiredMigrations;
    private getFileSize;
    emit<K extends keyof ImportFileValidationEvents>(event: K, ...args: [ImportFileValidationEvents[K]]): boolean;
    on<K extends keyof ImportFileValidationEvents>(event: K, listener: (arg: ImportFileValidationEvents[K]) => void): this;
    once<K extends keyof ImportFileValidationEvents>(event: K, listener: (arg: ImportFileValidationEvents[K]) => void): this;
}
export type { ValidationResult, ValidationIssue, ImportPreview, FormatDetectionResult, ImportFileValidationEvents, };
export default ImportFileValidation;
//# sourceMappingURL=ImportFileValidation.d.ts.map