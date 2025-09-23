#!/usr/bin/env node

/**
 * Configuration Backup Script
 * 
 * Command-line utility for creating GetWarped configuration backups.
 * Creates timestamped backup files for disaster recovery.
 */

const path = require('path');
const fs = require('fs').promises;

async function backupConfig() {
  try {
    const configPath = path.join(process.env.APPDATA || process.env.HOME, 'getwarped-config.json');
    
    // Check if config exists
    try {
      await fs.access(configPath);
    } catch (error) {
      process.stderr.write('Configuration file not found. Run the application first to create a configuration.\n');
      process.exit(1);
    }
    
    // Read configuration
    const configData = await fs.readFile(configPath, 'utf8');
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(process.cwd(), `getwarped-backup-${timestamp}.json`);
    
    // Create backup
    await fs.writeFile(backupPath, configData);
    process.stdout.write(`Configuration backed up to: ${backupPath}\n`);
    
  } catch (error) {
    process.stderr.write(`Failed to backup configuration: ${error.message}\n`);
    process.exit(1);
  }
}

backupConfig();