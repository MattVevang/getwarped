"use strict";
/**
 * Configuration Migration Wizard
 *
 * Handles migration of configuration data between different application versions.
 * Provides guided migration process for major version upgrades and data structure changes.
 *
 * @fileoverview Version migration and data transformation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationMigrationWizard = void 0;
const events_1 = require("events");
/**
 * Configuration migration wizard service
 * Handles version migrations and data transformations
 */
class ConfigurationMigrationWizard extends events_1.EventEmitter {
    configurationManager;
    configurationExporter;
    currentMigration;
    constructor(configurationManager, configurationImporter, configurationExporter) {
        super();
        this.configurationManager = configurationManager;
        this.configurationExporter = configurationExporter;
        // Store reference for future use
        void configurationImporter;
        this.initializeBuiltInMigrations();
    }
    /**
     * Check if migration is needed for current configuration
     */
    async checkMigrationNeeded() {
        try {
            const config = await this.configurationManager.getConfiguration();
            const currentVersion = this.getConfigurationVersion(config);
            const targetVersion = this.getLatestSupportedVersion();
            if (currentVersion === targetVersion) {
                return null;
            }
            return this.createMigrationPlan(currentVersion, targetVersion);
        }
        catch (error) {
            this.emit('error', new Error(`Failed to check migration status: ${error instanceof Error ? error.message : error}`));
            return null;
        }
    }
    /**
     * Create migration plan for version upgrade
     */
    async createMigrationPlan(fromVersion, toVersion) {
        try {
            const steps = this.findMigrationPath(fromVersion, toVersion);
            if (steps.length === 0) {
                return null;
            }
            const requiresBackup = steps.some(step => !step.canRollback);
            const estimatedDuration = steps.length * 5000; // Rough estimate: 5s per step
            const plan = {
                id: this.generateMigrationId(),
                currentVersion: fromVersion,
                targetVersion: toVersion,
                steps,
                requiresBackup,
                estimatedDuration,
            };
            return plan;
        }
        catch (error) {
            this.emit('error', new Error(`Failed to create migration plan: ${error instanceof Error ? error.message : error}`));
            return null;
        }
    }
    /**
     * Execute migration plan
     */
    async executeMigration(plan, options = {}) {
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
                const progress = {
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
            const saveResult = await this.configurationManager.importConfiguration(this.currentMigration.configuration);
            if (!saveResult.success) {
                this.emit('migration:failed', { plan, error: saveResult.error });
                return false;
            }
            // Final progress update
            const finalProgress = {
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
        }
        catch (error) {
            this.emit('migration:failed', {
                plan,
                error: error instanceof Error ? error.message : error,
            });
            return false;
        }
        finally {
            this.currentMigration = undefined;
        }
    }
    /**
     * Get rollback plan for last migration
     */
    async getRollbackPlan() {
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
        }
        catch (error) {
            this.emit('error', new Error(`Failed to create rollback plan: ${error instanceof Error ? error.message : error}`));
            return null;
        }
    }
    /**
     * Execute rollback to previous configuration
     */
    async executeRollback(rollbackPlan) {
        try {
            this.emit('rollback:started', { rollbackPlan });
            // Restore original configuration
            const restoreResult = await this.configurationManager.importConfiguration(rollbackPlan.originalConfiguration);
            if (!restoreResult.success) {
                this.emit('rollback:failed', { rollbackPlan, error: restoreResult.error });
                return false;
            }
            this.emit('rollback:completed', { rollbackPlan });
            return true;
        }
        catch (error) {
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
    getConfigurationVersion(config) {
        return config.app?.version || '1.0.0';
    }
    /**
     * Get latest supported version
     */
    getLatestSupportedVersion() {
        return '1.0.0'; // Will be updated as new versions are released
    }
    /**
     * Find migration path between versions
     */
    findMigrationPath(_fromVersion, _toVersion) {
        // For now, return empty array as we're on initial version
        // Future versions will implement version comparison and path finding
        return [];
    }
    /**
     * Execute single migration step
     */
    async executeMigrationStep(step) {
        const startTime = Date.now();
        try {
            this.emit('step:started', { step });
            // Execute step-specific migration logic
            const changes = await this.executeStepLogic(step);
            const result = {
                step,
                success: true,
                duration: Date.now() - startTime,
                changes,
            };
            this.emit('step:completed', { step, result });
            return result;
        }
        catch (error) {
            const result = {
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
    async executeStepLogic(step) {
        const changes = [];
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
    async requestStepConfirmation(step) {
        return new Promise(resolve => {
            this.emit('step:confirmation_required', {
                step,
                respond: (confirmed) => resolve(confirmed),
            });
        });
    }
    /**
     * Validate migration plan
     */
    validateMigrationPlan(plan) {
        return Boolean(plan.id &&
            plan.currentVersion &&
            plan.targetVersion &&
            Array.isArray(plan.steps) &&
            plan.steps.every(step => step.id && step.name && step.fromVersion && step.toVersion));
    }
    /**
     * Create backup before migration
     */
    async createMigrationBackup(plan) {
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
    generateMigrationId() {
        return `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Initialize built-in migration steps
     */
    initializeBuiltInMigrations() {
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
exports.ConfigurationMigrationWizard = ConfigurationMigrationWizard;
//# sourceMappingURL=ConfigurationMigrationWizard.js.map