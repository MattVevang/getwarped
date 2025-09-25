/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
  appId: 'com.getwarped.app',
  productName: 'GetWarped',
  copyright: 'Copyright © 2025 GetWarped Team',

  directories: {
    output: 'release',
    buildResources: 'build',
  },

  files: [
    'dist/**/*',
    'assets/**/*',
    'package.json',
    '!src',
    '!tests',
    '!docs',
    '!*.config.*',
    '!tsconfig*.json',
    '!.eslint*',
    '!.prettier*',
    '!.husky',
    '!coverage',
    '!playwright-report',
    '!test-results',
    // Exclude development files
    '!**/*.map',
    '!**/*.ts',
    '!**/*.tsx',
    '!**/README.md',
    '!**/LICENSE',
    '!**/.git*',
    '!node_modules/**/*.d.ts',
    '!node_modules/**/*.md',
    '!node_modules/**/test/**',
    '!node_modules/**/tests/**',
    '!node_modules/**/*.test.js',
    '!node_modules/**/*.spec.js',
  ],

  // Node modules optimization
  nodeModulesPolicy: 'prune',
  
  // Compression settings
  compression: 'maximum',

  extraMetadata: {
    main: 'dist/main/main.js',
  },

  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32'],
      },
      {
        target: 'portable',
        arch: ['x64'],
      },
    ],
    icon: 'build/icons/icon.ico',
    publisherName: 'GetWarped Team',
    requestedExecutionLevel: 'asInvoker',
    artifactName: '${productName}-Setup-${version}.${ext}',
    certificateFile: process.env.CSC_LINK,
    certificatePassword: process.env.CSC_KEY_PASSWORD,
  },

  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
    ],
    icon: 'build/icons/icon.icns',
    category: 'public.app-category.productivity',
    type: 'distribution',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64'],
      },
      {
        target: 'deb',
        arch: ['x64'],
      },
      {
        target: 'rpm',
        arch: ['x64'],
      },
    ],
    icon: 'build/icons',
    category: 'Office',
    artifactName: '${productName}-${version}-${arch}.${ext}',
    desktop: {
      StartupWMClass: 'GetWarped',
    },
  },

  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icons/icon.ico',
    uninstallerIcon: 'build/icons/icon.ico',
    installerHeaderIcon: 'build/icons/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'GetWarped',
  },

  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },

  publish: {
    provider: 'github',
    owner: 'yourusername',
    repo: 'getwarped',
  },
};
