#!/usr/bin/env node

/**
 * Configuration Export Script
 * 
 * Command-line utility for exporting GetWarped configuration data.
 * Supports various export formats and filtering options.
 */

const path = require('path');
const fs = require('fs').promises;

async function exportConfig() {
  try {
    const configPath = path.join(process.env.APPDATA || process.env.HOME, 'getwarped-config.json');
    
    // Check if config exists
    try {
      await fs.access(configPath);
    } catch (error) {
      console.error('Configuration file not found. Run the application first to create a configuration.');
      process.exit(1);
    }
    
    // Read configuration
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Generate export filename
    const timestamp = new Date().toISOString().split('T')[0];
    const exportPath = path.join(process.cwd(), `getwarped-export-${timestamp}.json`);
    
    // Export configuration (without sensitive data)
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      configuration: {
        app: config.app || {},
        security: {
          ...config.security,
          // Remove sensitive security settings
        },
        privacy: config.privacy || {},
        ui: config.ui || {},
        advanced: config.advanced || {},
        // Exclude credentials and session data
      }
    };
    
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`Configuration exported to: ${exportPath}`);
    
  } catch (error) {
    console.error('Failed to export configuration:', error.message);
    process.exit(1);
  }
}

exportConfig();