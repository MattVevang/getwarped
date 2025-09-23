#!/usr/bin/env node

/**
 * Configuration Import Script
 * 
 * Command-line utility for importing GetWarped configuration data.
 * Validates and imports configuration from export files.
 */

const path = require('path');
const fs = require('fs').promises;

async function importConfig() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      process.stdout.write('Usage: npm run config:import <export-file>\n');
      process.exit(1);
    }
    
    const importFile = args[0];
    const configPath = path.join(process.env.APPDATA || process.env.HOME, 'getwarped-config.json');
    
    // Check if import file exists
    try {
      await fs.access(importFile);
    } catch (error) {
      process.stderr.write(`Import file not found: ${importFile}\n`);
      process.exit(1);
    }
    
    // Read and validate import data
    const importData = await fs.readFile(importFile, 'utf8');
    const data = JSON.parse(importData);
    
    if (!data.version || !data.configuration) {
      process.stderr.write('Invalid import file format\n');
      process.exit(1);
    }
    
    // Backup existing configuration
    try {
      const existingConfig = await fs.readFile(configPath, 'utf8');
      const backupPath = `${configPath}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, existingConfig);
      process.stdout.write(`Existing configuration backed up to: ${backupPath}\n`);
    } catch (error) {
      // No existing config, continue
    }
    
    // Import configuration
    const newConfig = {
      ...data.configuration,
      app: {
        ...data.configuration.app,
        lastImportAt: new Date().toISOString()
      }
    };
    
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
    process.stdout.write('Configuration imported successfully\n');
    process.stdout.write('Restart the application to apply changes\n');
    
  } catch (error) {
    process.stderr.write(`Failed to import configuration: ${error.message}\n`);
    process.exit(1);
  }
}

importConfig();