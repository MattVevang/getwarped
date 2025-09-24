// Jest setup file for test configuration
import 'jest';

// Mock Electron modules
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
  },
  BrowserWindow: jest.fn(),
  BrowserView: jest.fn(),
}));

// Mock keytar
jest.mock('keytar', () => ({
  setPassword: jest.fn(),
  getPassword: jest.fn(),
  deletePassword: jest.fn(),
  findCredentials: jest.fn(),
}));

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  }));
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock window.matchMedia for Ant Design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for Ant Design
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
