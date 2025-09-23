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
export class ConfigurationMigrationWizard extends EventEmitter {
  private currentMigration: MigrationContext | undefined;

  constructor(
    private readonly configurationManager: ConfigurationManager,
    configurationImporter: ConfigurationImporter,
    private readonly configurationExporter: ConfigurationExporter
  ) {
    super();
    // Store reference for future use
    void configurationImporter;
    this.initializeBuiltInMigrations();
  }

  /**
   * Check if migration is needed for current configuration
   */
  async checkMigrationNeeded(): Promise<MigrationPlan | null> {
    try {
      const config = await this.configurationManager.getConfiguration();
      const currentVersion = this.getConfigurationVersion(config);
      const targetVersion = this.getLatestSupportedVersion();

      if (currentVersion === targetVersion) {
        return null;
      }

      return this.createMigrationPlan(currentVersion, targetVersion);
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Failed to check migration status: ${error instanceof Error ? error.message : error}`
        )
      );
      return null;
    }
  }

  /**
   * Create migration plan for version upgrade
   */
  async createMigrationPlan(fromVersion: string, toVersion: string): Promise<MigrationPlan | null> {
    try {
      const steps = this.findMigrationPath(fromVersion, toVersion);

      if (steps.length === 0) {
        return null;
      }

      const requiresBackup = steps.some(step => !step.canRollback);
      const estimatedDuration = steps.length * 5000; // Rough estimate: 5s per step

      const plan: MigrationPlan = {
        id: this.generateMigrationId(),
        currentVersion: fromVersion,
        targetVersion: toVersion,
        steps,
        requiresBackup,
        estimatedDuration,
      };

      return plan;
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Failed to create migration plan: ${error instanceof Error ? error.message : error}`
        )
      );
      return null;
    }
  }

  /**
   * Execute migration plan
   */
  async executeMigration(
    plan: MigrationPlan,
    options: { createBackup?: boolean; skipConfirmation?: boolean } = {}
  ): Promise<boolean> {
    try {
      // Validate plan
      if (!this.validateMigrationPlan(plan)) {
        throw new Error('Invalid migration plan');
      }

      // Get current configuration
      const config = await this.configurationManager.getConfiguration();

      // Create backup if requested
      if (options.createBackup || plan.requiresBackup) {
        await this.createMigrationBackup(plan);
      }

      // Initialize migration context
      this.currentMigration = {
        configuration: JSON.parse(JSON.stringify(config)),
        originalConfiguration: JSON.parse(JSON.stringify(config)),
        plan,
        currentStep: undefined,
        stepResults: [],
      };

      this.emit('migration:started', { plan });

      const startTime = Date.now();

      // Execute migration steps
      for (let i = 0; i < plan.steps.length; i++) {
        const step = plan.steps[i];
        if (!step) {
          throw new Error(`Invalid step at index ${i}`);
        }

        this.currentMigration.currentStep = step;

        // Emit progress
        const progress: MigrationProgress = {
          plan,
          currentStepIndex: i,
          totalSteps: plan.steps.length,
          progressPercent: Math.round((i / plan.steps.length) * 100),
          currentStep: step,
          elapsedTime: Date.now() - startTime,
        };
        this.emit('migration:progress', progress);

        // Request confirmation if needed
        if (step.requiresConfirmation && !options.skipConfirmation) {
          const confirmed = await this.requestStepConfirmation(step);
          if (!confirmed) {
            // User cancelled migration
            this.emit('migration:cancelled', { plan, step });
            return false;
          }
        }

        // Execute step
        const stepResult = await this.executeMigrationStep(step);
        this.currentMigration.stepResults.push(stepResult);

        if (!stepResult.success && !stepResult.skipped) {
          this.emit('migration:failed', { plan, step, error: stepResult.error });
          return false;
        }
      }

      // Save migrated configuration - using importConfiguration as a workaround
      const saveResult = await this.configurationManager.importConfiguration(
        this.currentMigration.configuration
      );

      if (!saveResult.success) {
        this.emit('migration:failed', { plan, error: saveResult.error });
        return false;
      }

      // Final progress update
      const finalProgress: MigrationProgress = {
        plan,
        currentStepIndex: plan.steps.length,
        totalSteps: plan.steps.length,
        progressPercent: 100,
        currentStep: undefined,
        elapsedTime: Date.now() - startTime,
      };
      this.emit('migration:progress', finalProgress);

      this.emit('migration:completed', {
        plan,
        results: this.currentMigration.stepResults,
        elapsedTime: Date.now() - startTime,
      });

      return true;
    } catch (error) {
      this.emit('migration:failed', {
        plan,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    } finally {
      this.currentMigration = undefined;
    }
  }

  /**
   * Get rollback plan for last migration
   */
  async getRollbackPlan(): Promise<RollbackPlan | null> {
    try {
      if (!this.currentMigration) {
        return null;
      }

      const rollbackSteps = this.currentMigration.stepResults
        .filter(result => result.success && result.step.canRollback)
        .map(result => result.step)
        .reverse();

      if (rollbackSteps.length === 0) {
        return null;
      }

      return {
        migrationId: this.currentMigration.plan.id,
        rollbackSteps,
        originalConfiguration: this.currentMigration.originalConfiguration,
        canRollback: true,
      };
    } catch (error) {
      this.emit(
        'error',
        new Error(
          `Failed to create rollback plan: ${error instanceof Error ? error.message : error}`
        )
      );
      return null;
    }
  }

  /**
   * Execute rollback to previous configuration
   */
  async executeRollback(rollbackPlan: RollbackPlan): Promise<boolean> {
    try {
      this.emit('rollback:started', { rollbackPlan });

      // Restore original configuration
      const restoreResult = await this.configurationManager.importConfiguration(
        rollbackPlan.originalConfiguration
      );

      if (!restoreResult.success) {
        this.emit('rollback:failed', { rollbackPlan, error: restoreResult.error });
        return false;
      }

      this.emit('rollback:completed', { rollbackPlan });
      return true;
    } catch (error) {
      this.emit('rollback:failed', {
        rollbackPlan,
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Get configuration version from app config
   */
  private getConfigurationVersion(config: AppConfiguration): string {
    return (config.app as any)?.version || '1.0.0';
  }

  /**
   * Get latest supported version
   */
  private getLatestSupportedVersion(): string {
    return '1.0.0'; // Will be updated as new versions are released
  }

  /**
   * Find migration path between versions
   */
  private findMigrationPath(_fromVersion: string, _toVersion: string): MigrationStep[] {
    // For now, return empty array as we're on initial version
    // Future versions will implement version comparison and path finding
    return [];
  }

  /**
   * Execute single migration step
   */
  private async executeMigrationStep(step: MigrationStep): Promise<MigrationStepResult> {
    const startTime = Date.now();

    try {
      this.emit('step:started', { step });

      // Execute step-specific migration logic
      const changes = await this.executeStepLogic(step);

      const result: MigrationStepResult = {
        step,
        success: true,
        duration: Date.now() - startTime,
        changes,
      };

      this.emit('step:completed', { step, result });
      return result;
    } catch (error) {
      const result: MigrationStepResult = {
        step,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown step error',
        duration: Date.now() - startTime,
      };

      this.emit('step:failed', { step, result });
      return result;
    }
  }

  /**
   * Execute step-specific migration logic
   */
  private async executeStepLogic(step: MigrationStep): Promise<string[]> {
    const changes: string[] = [];

    // Step-specific logic based on step ID
    switch (step.id) {
      case 'migrate_v1_to_v2':
        // Example migration logic
        changes.push('Updated configuration schema to v2');
        break;

      default:
        // No-op for unknown steps
        break;
    }

    return changes;
  }

  /**
   * Request user confirmation for migration step
   */
  private async requestStepConfirmation(step: MigrationStep): Promise<boolean> {
    return new Promise(resolve => {
      this.emit('step:confirmation_required', {
        step,
        respond: (confirmed: boolean) => resolve(confirmed),
      });
    });
  }

  /**
   * Validate migration plan
   */
  private validateMigrationPlan(plan: MigrationPlan): boolean {
    return Boolean(
      plan.id &&
        plan.currentVersion &&
        plan.targetVersion &&
        Array.isArray(plan.steps) &&
        plan.steps.every(step => step.id && step.name && step.fromVersion && step.toVersion)
    );
  }

  /**
   * Create backup before migration
   */
  private async createMigrationBackup(plan: MigrationPlan): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `getwarped-pre-migration-${plan.id}-${timestamp}.json`;

    const backupResult = await this.configurationExporter.exportConfiguration(undefined, {
      filePath: filename,
    });

    if (!backupResult.success) {
      throw new Error(`Failed to create migration backup: ${backupResult.error}`);
    }

    this.emit('backup:created', { filename: backupResult.filePath });
  }

  /**
   * Generate unique migration ID
   */
  private generateMigrationId(): string {
    return `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize built-in migration steps
   */
  private initializeBuiltInMigrations(): void {
    // Future version migrations will be registered here
    // Example:
    // this.registerMigration({
    //   id: 'migrate_v1_to_v2',
    //   name: 'Migrate to Version 2.0',
    //   description: 'Updates configuration schema for new features',
    //   fromVersion: '1.0.0',
    //   toVersion: '2.0.0',
    //   requiresConfirmation: true,
    //   canRollback: true,
    // });
  }
}
