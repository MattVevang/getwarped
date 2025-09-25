/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from 'node' to 'jsdom' for React components
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/tests/**/*.test.tsx', // Added tsx support
    '**/tests/**/*.spec.tsx', // Added tsx support
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx', // Added tsx support
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx', // Added tsx support
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/playwright-report/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      tsconfig: {
        jsx: 'react-jsx' // Enable JSX support
      }
    }],
    '^.+\\.tsx$': ['ts-jest', { 
      tsconfig: {
        jsx: 'react-jsx' // Enable JSX support
      }
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-dnd|dnd-core|@react-dnd|react-dnd-html5-backend|react-hot-toast)/)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@renderer/(.*)$': '<rootDir>/src/renderer/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
  },
  testEnvironmentOptions: {
    jsdom: { // Changed from node to jsdom
      experimentalVmModules: true,
    },
  },
};
