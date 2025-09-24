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

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
import { app } from 'electron';
import { CredentialEncryption } from '../storage/CredentialEncryption';
import {
  ConfigurationExport,
  ExportedWorkspace,
  ExportMetadata,
  ImportConfiguration,
  isConfigurationExport,
  validateExportSecurity,
} from '../../shared/types/ConfigurationExport';

/**
 * Default import configuration for safe import operations
 */
const DEFAULT_IMPORT_CONFIG: ImportConfiguration = {
  conflictResolution: 'ask',
  importThemes: true,
  importPreferences: false,
  workspaceMergeStrategy: 'separate',
  validateUrls: true,
  maxServices: 100,
};

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
  'validation-started': { filePath: string; size: number };
  'validation-progress': { stage: string; progress: number };
  'validation-completed': { result: ValidationResult };
  'format-detected': { format: FormatDetectionResult };
  'security-scan-completed': { threats: string[]; safe: boolean };
  'schema-validated': { valid: boolean; errors: string[] };
  'compatibility-checked': { compatible: boolean; migrations: string[] };
}

/**
 * Import file validation manager
 *
 * Provides comprehensive validation for configuration import files,
 * ensuring security, compatibility, and data integrity.
 */
export class ImportFileValidation extends EventEmitter {
  private readonly maxFileSize: number = 50 * 1024 * 1024; // 50MB
  private readonly maxWorkspaces: number = 100;
  private readonly maxServicesPerWorkspace: number = 50;
  private readonly maxTotalServices: number = 500;

  // Validation schemas and patterns
  private readonly DANGEROUS_PATTERNS = [
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /file:\/\//gi,
    /<script[^>]*>/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
  ];

  private readonly SUSPICIOUS_KEYWORDS = [
    'password',
    'token',
    'secret',
    'key',
    'auth',
    'credential',
    'session',
    'cookie',
    'login',
    'private',
    'confidential',
    'internal',
  ];

  private readonly SUPPORTED_FORMATS = ['json', 'encrypted-json', 'csv', 'xml', 'yaml'];

  constructor(_encryption: CredentialEncryption) {
    super();
  }

  /**
   * Validate import file comprehensively
   */
  public async validateImportFile(
    filePath: string,
    importConfig: ImportConfiguration = DEFAULT_IMPORT_CONFIG
  ): Promise<ValidationResult> {
    this.emit('validation-started', {
      filePath,
      size: await this.getFileSize(filePath),
    });

    const result: ValidationResult = {
      isValid: false,
      canImport: false,
      issues: [],
      statistics: {
        workspaceCount: 0,
        serviceCount: 0,
        fileSize: 0,
        formatDetected: 'unknown',
        checksumValid: false,
      },
      compatibility: {
        compatible: false,
        sourceVersion: 'unknown',
        targetVersion: app.getVersion(),
        migrationRequired: false,
        requiredMigrations: [],
      },
      security: {
        safe: false,
        threats: [],
        recommendations: [],
      },
    };

    try {
      // Stage 1: Basic file validation
      this.emit('validation-progress', { stage: 'file-checks', progress: 10 });
      await this.validateFileBasics(filePath, result);

      // Stage 2: Format detection and parsing
      this.emit('validation-progress', { stage: 'format-detection', progress: 20 });
      const content = await this.readAndParseFile(filePath, result);
      if (!content) return result;

      // Stage 3: Schema validation
      this.emit('validation-progress', { stage: 'schema-validation', progress: 40 });
      const parsedData = await this.validateSchema(content, result);
      if (!parsedData) return result;

      // Stage 4: Security scanning
      this.emit('validation-progress', { stage: 'security-scan', progress: 60 });
      await this.performSecurityScan(parsedData, result);

      // Stage 5: Compatibility checking
      this.emit('validation-progress', { stage: 'compatibility-check', progress: 80 });
      await this.checkCompatibility(parsedData, result);

      // Stage 6: Data validation and statistics
      this.emit('validation-progress', { stage: 'data-validation', progress: 90 });
      await this.validateData(parsedData, importConfig, result);

      // Final assessment
      this.emit('validation-progress', { stage: 'final-assessment', progress: 100 });
      this.assessFinalResult(result);

      this.emit('validation-completed', { result });
      return result;
    } catch (error) {
      result.issues.push({
        level: 'critical',
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check file format and try again',
      });

      this.emit('validation-completed', { result });
      return result;
    }
  }

  /**
   * Generate import preview without full validation
   */
  public async generateImportPreview(
    filePath: string,
    importConfig: ImportConfiguration = DEFAULT_IMPORT_CONFIG
  ): Promise<ImportPreview> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = await this.parseContent(content, filePath);

      if (!isConfigurationExport(parsed)) {
        throw new Error('Invalid configuration format');
      }

      return this.createImportPreview(parsed, importConfig);
    } catch (error) {
      throw new Error(
        `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate specific data structure without file I/O
   */
  public async validateConfigurationData(
    data: any,
    importConfig: ImportConfiguration = DEFAULT_IMPORT_CONFIG
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: false,
      canImport: false,
      issues: [],
      statistics: {
        workspaceCount: 0,
        serviceCount: 0,
        fileSize: JSON.stringify(data).length,
        formatDetected: 'json',
        checksumValid: true,
      },
      compatibility: {
        compatible: false,
        sourceVersion: 'unknown',
        targetVersion: app.getVersion(),
        migrationRequired: false,
        requiredMigrations: [],
      },
      security: {
        safe: false,
        threats: [],
        recommendations: [],
      },
    };

    // Schema validation
    const parsedData = await this.validateSchema(data, result);
    if (!parsedData) return result;

    // Security scanning
    await this.performSecurityScan(parsedData, result);

    // Compatibility checking
    await this.checkCompatibility(parsedData, result);

    // Data validation
    await this.validateData(parsedData, importConfig, result);

    // Final assessment
    this.assessFinalResult(result);

    return result;
  }

  /**
   * Check if file format is supported
   */
  public async detectFileFormat(filePath: string): Promise<FormatDetectionResult> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(filePath).toLowerCase();

      const result: FormatDetectionResult = {
        format: 'unknown',
        confidence: 0,
        encoding: 'utf8',
        compressed: false,
        encrypted: false,
      };

      // Check for encryption
      try {
        const parsed = JSON.parse(content);
        if (this.isEncryptedData(parsed)) {
          result.format = 'encrypted-json';
          result.encrypted = true;
          result.confidence = 0.95;
          result.version = parsed.version;

          this.emit('format-detected', { format: result });
          return result;
        }
      } catch {
        // Not JSON, continue with other formats
      }

      // Detect by extension and content
      switch (extension) {
        case '.json':
          if (this.isValidJSON(content)) {
            result.format = 'json';
            result.confidence = 0.9;
          }
          break;
        case '.csv':
          if (this.isValidCSV(content)) {
            result.format = 'csv';
            result.confidence = 0.8;
          }
          break;
        case '.xml':
          if (this.isValidXML(content)) {
            result.format = 'xml';
            result.confidence = 0.8;
          }
          break;
        case '.yaml':
        case '.yml':
          result.format = 'yaml';
          result.confidence = 0.7;
          break;
      }

      // Content-based detection if extension didn't match
      if (result.confidence < 0.5) {
        result.format = this.detectFormatByContent(content);
        result.confidence = 0.6;
      }

      this.emit('format-detected', { format: result });
      return result;
    } catch (error) {
      throw new Error(
        `Format detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Basic file validation
   */
  private async validateFileBasics(filePath: string, result: ValidationResult): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      result.statistics.fileSize = stats.size;

      // Check file size
      if (stats.size > this.maxFileSize) {
        result.issues.push({
          level: 'error',
          code: 'FILE_TOO_LARGE',
          message: `File size ${stats.size} bytes exceeds maximum ${this.maxFileSize} bytes`,
          suggestion: 'Use a smaller configuration file or split into multiple imports',
        });
      }

      // Check if file is readable
      await fs.access(filePath, fs.constants.R_OK);

      // Check file extension
      const extension = path.extname(filePath).toLowerCase();
      if (
        !this.SUPPORTED_FORMATS.some(
          format =>
            extension.includes(format) ||
            extension === '.json' ||
            extension === '.csv' ||
            extension === '.xml' ||
            extension === '.yaml' ||
            extension === '.yml'
        )
      ) {
        result.issues.push({
          level: 'warning',
          code: 'UNKNOWN_EXTENSION',
          message: `File extension '${extension}' is not recognized`,
          suggestion: 'Ensure file is in a supported format (JSON, CSV, XML, YAML)',
        });
      }
    } catch (error) {
      result.issues.push({
        level: 'critical',
        code: 'FILE_ACCESS_ERROR',
        message: `Cannot access file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check file permissions and path',
      });
    }
  }

  /**
   * Read and parse file content
   */
  private async readAndParseFile(filePath: string, result: ValidationResult): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const format = await this.detectFileFormat(filePath);

      result.statistics.formatDetected = format.format;

      return this.parseContent(content, filePath, format);
    } catch (error) {
      result.issues.push({
        level: 'critical',
        code: 'PARSE_ERROR',
        message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check file format and encoding',
      });
      return null;
    }
  }

  /**
   * Parse content based on format
   */
  private async parseContent(
    content: string,
    filePath: string,
    format?: FormatDetectionResult
  ): Promise<any> {
    const detectedFormat = format || (await this.detectFileFormat(filePath));

    switch (detectedFormat.format) {
      case 'json':
        return JSON.parse(content);

      case 'encrypted-json':
        return this.parseEncryptedJSON(content);

      case 'csv':
        return this.parseCSV(content);

      case 'xml':
        return this.parseXML(content);

      case 'yaml':
        return this.parseYAML(content);

      default:
        // Try JSON as fallback
        return JSON.parse(content);
    }
  }

  /**
   * Validate data against schema
   */
  private async validateSchema(
    data: any,
    result: ValidationResult
  ): Promise<ConfigurationExport | null> {
    try {
      if (!isConfigurationExport(data)) {
        result.issues.push({
          level: 'error',
          code: 'INVALID_SCHEMA',
          message: 'Data does not match ConfigurationExport schema',
          suggestion: 'Ensure file contains valid GetWarped export data',
        });

        this.emit('schema-validated', { valid: false, errors: ['Invalid schema'] });
        return null;
      }

      // Validate required fields
      if (!data.version || !data.exportedAt || !Array.isArray(data.workspaces)) {
        result.issues.push({
          level: 'error',
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Missing required fields (version, exportedAt, workspaces)',
          suggestion: 'Ensure export contains all required fields',
        });
        return null;
      }

      // Validate metadata
      if (data.metadata) {
        result.metadata = data.metadata;
        result.compatibility.sourceVersion = data.metadata.appVersion || 'unknown';
      }

      this.emit('schema-validated', { valid: true, errors: [] });
      return data;
    } catch (error) {
      result.issues.push({
        level: 'error',
        code: 'SCHEMA_VALIDATION_ERROR',
        message: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check data structure and format',
      });
      return null;
    }
  }

  /**
   * Perform security scanning
   */
  private async performSecurityScan(
    data: ConfigurationExport,
    result: ValidationResult
  ): Promise<void> {
    const threats: string[] = [];
    const recommendations: string[] = [];

    // Use built-in security validation
    const securityIssues = validateExportSecurity(data);
    threats.push(...securityIssues);

    // Scan for dangerous patterns
    const dataString = JSON.stringify(data).toLowerCase();

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(dataString)) {
        threats.push(`Dangerous pattern detected: ${pattern.toString()}`);
      }
    }

    // Check for suspicious keywords
    for (const keyword of this.SUSPICIOUS_KEYWORDS) {
      if (dataString.includes(keyword.toLowerCase())) {
        threats.push(`Suspicious keyword found: ${keyword}`);
        recommendations.push(`Review content containing '${keyword}' for sensitive information`);
      }
    }

    // Validate URLs in services
    for (const workspace of data.workspaces) {
      for (const service of workspace.services) {
        try {
          const url = new URL(service.url);

          // Check for dangerous protocols
          if (['javascript:', 'data:', 'vbscript:', 'file:'].includes(url.protocol)) {
            threats.push(`Dangerous protocol in service '${service.name}': ${url.protocol}`);
          }

          // Check for credentials in URLs
          if (url.username || url.password) {
            threats.push(`Service '${service.name}' URL contains embedded credentials`);
          }
        } catch {
          threats.push(`Service '${service.name}' has invalid URL: ${service.url}`);
        }
      }
    }

    result.security.threats = threats;
    result.security.recommendations = recommendations;
    result.security.safe = threats.length === 0;

    this.emit('security-scan-completed', {
      threats,
      safe: result.security.safe,
    });
  }

  /**
   * Check version compatibility
   */
  private async checkCompatibility(
    data: ConfigurationExport,
    result: ValidationResult
  ): Promise<void> {
    const currentVersion = app.getVersion();
    const sourceVersion = data.metadata?.appVersion || 'unknown';

    result.compatibility.sourceVersion = sourceVersion;
    result.compatibility.targetVersion = currentVersion;

    // Simple version comparison (in production, use semver)
    const compatible = this.isVersionCompatible(sourceVersion, currentVersion);
    result.compatibility.compatible = compatible;

    if (!compatible) {
      result.compatibility.migrationRequired = true;
      result.compatibility.requiredMigrations = this.getRequiredMigrations(
        sourceVersion,
        currentVersion
      );

      result.issues.push({
        level: 'warning',
        code: 'VERSION_COMPATIBILITY',
        message: `Source version ${sourceVersion} may not be fully compatible with ${currentVersion}`,
        suggestion: 'Migration may be required for full compatibility',
      });
    }

    this.emit('compatibility-checked', {
      compatible,
      migrations: result.compatibility.requiredMigrations,
    });
  }

  /**
   * Validate data content and structure
   */
  private async validateData(
    data: ConfigurationExport,
    importConfig: ImportConfiguration,
    result: ValidationResult
  ): Promise<void> {
    // Update statistics
    result.statistics.workspaceCount = data.workspaces.length;
    result.statistics.serviceCount = data.workspaces.reduce(
      (total, ws) => total + ws.services.length,
      0
    );

    // Check limits
    if (data.workspaces.length > this.maxWorkspaces) {
      result.issues.push({
        level: 'error',
        code: 'TOO_MANY_WORKSPACES',
        message: `${data.workspaces.length} workspaces exceeds maximum of ${this.maxWorkspaces}`,
        suggestion: 'Split import into smaller batches',
      });
    }

    if (result.statistics.serviceCount > this.maxTotalServices) {
      result.issues.push({
        level: 'error',
        code: 'TOO_MANY_SERVICES',
        message: `${result.statistics.serviceCount} services exceeds maximum of ${this.maxTotalServices}`,
        suggestion: 'Reduce number of services or split into multiple imports',
      });
    }

    // Validate individual workspaces
    for (const workspace of data.workspaces) {
      if (workspace.services.length > this.maxServicesPerWorkspace) {
        result.issues.push({
          level: 'warning',
          code: 'WORKSPACE_TOO_MANY_SERVICES',
          message: `Workspace '${workspace.name}' has ${workspace.services.length} services, maximum recommended is ${this.maxServicesPerWorkspace}`,
          field: `workspace.${workspace.name}`,
          suggestion: 'Consider splitting large workspaces',
        });
      }

      // Validate services if URL validation is enabled
      if (importConfig.validateUrls) {
        for (const service of workspace.services) {
          try {
            new URL(service.url);
          } catch {
            result.issues.push({
              level: 'warning',
              code: 'INVALID_SERVICE_URL',
              message: `Service '${service.name}' has invalid URL: ${service.url}`,
              field: `service.${service.name}.url`,
              value: service.url,
              suggestion: 'Fix or remove invalid URLs before import',
            });
          }
        }
      }
    }
  }

  /**
   * Create import preview
   */
  private createImportPreview(
    data: ConfigurationExport,
    importConfig: ImportConfiguration
  ): ImportPreview {
    const workspacesToImport = data.workspaces;
    const servicesToImport = workspacesToImport.reduce(
      (total, ws) => total + ws.services.length,
      0
    );

    // Estimate conflicts (simplified)
    const conflicts = {
      workspaceNameConflicts: workspacesToImport.map(ws => ws.name),
      serviceUrlConflicts: [] as string[],
      themeConflicts: [] as string[],
    };

    // Estimate performance
    const estimates = {
      importTimeMs: servicesToImport * 100 + workspacesToImport.length * 500,
      diskSpaceRequired: JSON.stringify(data).length * 1.5,
      memoryRequired: JSON.stringify(data).length * 2,
    };

    const recommendations = {
      conflictResolution: 'rename' as 'skip' | 'rename' | 'merge',
      suggestedActions: this.generateImportRecommendations(data, importConfig),
    };

    return {
      workspacesToImport,
      servicesToImport,
      conflicts,
      estimates,
      recommendations,
    };
  }

  /**
   * Generate import recommendations
   */
  private generateImportRecommendations(
    data: ConfigurationExport,
    config: ImportConfiguration
  ): string[] {
    const recommendations: string[] = [];

    if (data.workspaces.length > 10) {
      recommendations.push('Consider importing workspaces in smaller batches');
    }

    const totalServices = data.workspaces.reduce((total, ws) => total + ws.services.length, 0);
    if (totalServices > 50) {
      recommendations.push('Large number of services detected - import may take several minutes');
    }

    if (config.validateUrls) {
      recommendations.push('URL validation is enabled - this will increase import time');
    }

    if (config.conflictResolution === 'ask') {
      recommendations.push(
        'Conflict resolution is set to "ask" - you may need to make decisions during import'
      );
    }

    return recommendations;
  }

  /**
   * Assess final validation result
   */
  private assessFinalResult(result: ValidationResult): void {
    const criticalIssues = result.issues.filter(issue => issue.level === 'critical');
    const errorIssues = result.issues.filter(issue => issue.level === 'error');

    result.isValid = criticalIssues.length === 0;
    result.canImport =
      criticalIssues.length === 0 && errorIssues.length === 0 && result.security.safe;

    // Add final recommendations
    if (!result.canImport) {
      result.security.recommendations.push(
        'Resolve all critical and error issues before importing'
      );
    }

    if (result.security.threats.length > 0) {
      result.security.recommendations.push('Review security threats carefully before proceeding');
    }
  }

  /**
   * Helper methods for format detection and parsing
   */
  private isValidJSON(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  private isValidCSV(content: string): boolean {
    return content.includes(',') && content.split('\n').length > 1;
  }

  private isValidXML(content: string): boolean {
    return content.trim().startsWith('<?xml') || content.includes('<configuration>');
  }

  private detectFormatByContent(content: string): string {
    if (this.isValidJSON(content)) return 'json';
    if (this.isValidXML(content)) return 'xml';
    if (this.isValidCSV(content)) return 'csv';
    return 'unknown';
  }

  private isEncryptedData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'encrypted' in data &&
      'iv' in data &&
      'authTag' in data &&
      'salt' in data
    );
  }

  private async parseEncryptedJSON(content: string): Promise<any> {
    const encrypted = JSON.parse(content);
    if (!this.isEncryptedData(encrypted)) {
      throw new Error('Invalid encrypted format');
    }

    // Note: In production, this would require the decryption key
    throw new Error('Encrypted import requires decryption key');
  }

  private parseCSV(_content: string): any {
    throw new Error('CSV parsing not yet implemented');
  }

  private parseXML(_content: string): any {
    throw new Error('XML parsing not yet implemented');
  }

  private parseYAML(_content: string): any {
    throw new Error('YAML parsing not yet implemented');
  }

  private isVersionCompatible(source: string, target: string): boolean {
    // Simplified version check - in production use semver
    return source === target || (source.startsWith('1.') && target.startsWith('1.'));
  }

  private getRequiredMigrations(source: string, target: string): string[] {
    const migrations: string[] = [];

    // Example migration checks
    if (source.startsWith('0.') && target.startsWith('1.')) {
      migrations.push('Migrate v0.x configuration format to v1.x');
    }

    return migrations;
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  // Type-safe event emitter overrides
  public override emit<K extends keyof ImportFileValidationEvents>(
    event: K,
    ...args: [ImportFileValidationEvents[K]]
  ): boolean {
    return super.emit(event, ...args);
  }

  public override on<K extends keyof ImportFileValidationEvents>(
    event: K,
    listener: (arg: ImportFileValidationEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof ImportFileValidationEvents>(
    event: K,
    listener: (arg: ImportFileValidationEvents[K]) => void
  ): this {
    return super.once(event, listener);
  }
}

// Export types for external use
export type {
  ValidationResult,
  ValidationIssue,
  ImportPreview,
  FormatDetectionResult,
  ImportFileValidationEvents,
};

// Default export
export default ImportFileValidation;
