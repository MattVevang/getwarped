module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Basic rules only for now
    'no-unused-vars': 'off',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-undef': 'off', // Disabled for TypeScript
  },

  settings: {
    react: {
      version: 'detect',
    },
  },

  ignorePatterns: ['node_modules/', 'dist/', 'build/', '*.config.js', '.eslintrc.js'],

  overrides: [
    {
      files: ['src/main/**/*'],
      env: {
        node: true,
        browser: false,
      },
    },
    {
      files: ['src/renderer/**/*'],
      env: {
        browser: true,
        node: false,
      },
    },
    {
      files: ['tests/**/*'],
      env: {
        jest: true,
      },
    },
  ],
};
