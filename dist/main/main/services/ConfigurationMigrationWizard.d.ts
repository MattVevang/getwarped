/**
 * Configuration Migration Wizard
 *
 * Handles migration of configuration data between different application versions.
 * Provides guided migration process for major version upgrades and data structure changes.
 *
 * @fileoverview Version migration and data transformation utilities
 */
import { EventEmitter } from 'events';
import { ConfigurationManager, AppConfiguration } from './ConfigurationManager';
import { ConfigurationImporter } from './ConfigurationImporter';
import { ConfigurationExporter } from './ConfigurationExporter';
/**
 * Migration step definition
 */
export interface MigrationStep {
    /** Step identifier */
    id: string;
    /** Human-readable step name */
    name: string;
    /** Step description for user */
    description: string;
    /** Source version pattern this step applies to */
    fromVersion: string;
    /** Target version this step migrates to */
    toVersion: string;
    /** Whether this step requires user confirmation */
    requiresConfirmation: boolean;
    /** Whether this step can be rolled back */
    canRollback: boolean;
}
/**
 * Migration plan containing ordered steps
 */
export interface MigrationPlan {
    /** Unique plan identifier */
    id: string;
    /** Current configuration version */
    currentVersion: string;
    /** Target version to migrate to */
    targetVersion: string;
    /** Ordered migration steps */
    steps: MigrationStep[];
    /** Whether backup is recommended before migration */
    requiresBackup: boolean;
    /** Estimated migration time in milliseconds */
    estimatedDuration: number;
}
/**
 * Migration execution context
 */
export interface MigrationContext {
    /** Current configuration being migrated */
    configuration: AppConfiguration;
    /** Original configuration backup */
    originalConfiguration: AppConfiguration;
    /** Migration plan being executed */
    plan: MigrationPlan;
    /** Current step being executed */
    currentStep: MigrationStep | undefined;
    /** Step execution results */
    stepResults: MigrationStepResult[];
}
/**
 * Migration step execution result
 */
export interface MigrationStepResult {
    /** Step that was executed */
    step: MigrationStep;
    /** Whether step succeeded */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Execution duration in milliseconds */
    duration: number;
    /** Changes made by this step */
    changes?: string[];
    /** Whether step was skipped */
    skipped?: boolean;
}
/**
 * Migration progress information
 */
export interface MigrationProgress {
    /** Migration plan being executed */
    plan: MigrationPlan;
    /** Current step index (0-based) */
    currentStepIndex: number;
    /** Total number of steps */
    totalSteps: number;
    /** Progress percentage (0-100) */
    progressPercent: number;
    /** Current step being executed */
    currentStep: MigrationStep | undefined;
    /** Elapsed time in milliseconds */
    elapsedTime: number;
}
/**
 * Migration rollback information
 */
export interface RollbackPlan {
    /** Migration that can be rolled back */
    migrationId: string;
    /** Steps that can be rolled back (in reverse order) */
    rollbackSteps: MigrationStep[];
    /** Original configuration to restore */
    originalConfiguration: AppConfiguration;
    /** Whether rollback is available */
    canRollback: boolean;
}
/**
 * Configuration migration wizard service
 * Handles version migrations and data transformations
 */
export declare class ConfigurationMigrationWizard extends EventEmitter {
    private readonly configurationManager;
    private readonly configurationExporter;
    private currentMigration;
    constructor(configurationManager: ConfigurationManager, configurationImporter: ConfigurationImporter, configurationExporter: ConfigurationExporter);
    /**
     * Check if migration is needed for current configuration
     */
    checkMigrationNeeded(): Promise<MigrationPlan | null>;
    /**
     * Create migration plan for version upgrade
     */
    createMigrationPlan(fromVersion: string, toVersion: string): Promise<MigrationPlan | null>;
    /**
     * Execute migration plan
     */
    executeMigration(plan: MigrationPlan, options?: {
        createBackup?: boolean;
        skipConfirmation?: boolean;
    }): Promise<boolean>;
    /**
     * Get rollback plan for last migration
     */
    getRollbackPlan(): Promise<RollbackPlan | null>;
    /**
     * Execute rollback to previous configuration
     */
    executeRollback(rollbackPlan: RollbackPlan): Promise<boolean>;
    /**
     * Get configuration version from app config
     */
    private getConfigurationVersion;
    /**
     * Get latest supported version
     */
    private getLatestSupportedVersion;
    /**
     * Find migration path between versions
     */
    private findMigrationPath;
    /**
     * Execute single migration step
     */
    private executeMigrationStep;
    /**
     * Execute step-specific migration logic
     */
    private executeStepLogic;
    /**
     * Request user confirmation for migration step
     */
    private requestStepConfirmation;
    /**
     * Validate migration plan
     */
    private validateMigrationPlan;
    /**
     * Create backup before migration
     */
    private createMigrationBackup;
    /**
     * Generate unique migration ID
     */
    private generateMigrationId;
    /**
     * Initialize built-in migration steps
     */
    private initializeBuiltInMigrations;
}
//# sourceMappingURL=ConfigurationMigrationWizard.d.ts.map