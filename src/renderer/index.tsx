/**
 * Renderer Entry Point - Main React application entry point
 *
 * Sets up the React application with Redux store, router, error boundary,
 * theme provider, and other essential application context. Serves as the
 * root of the renderer process UI.
 *
 * @fileoverview Main renderer process entry point for GetWarped app
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from './store/store';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import App from './components/App/App';
import ThemeProvider from './components/Theme/ThemeProvider';
import './styles/global.css';

// Extend window interface for Electron API and hot module reloading
declare global {
  interface Window {
    electronAPI?: {
      logError: (type: string, data: any) => void;
    };
  }

  interface NodeModule {
    hot?: {
      accept: (path: string, callback: () => void) => void;
    };
  }
}

/**
 * Application root component with all providers
 */
const AppRoot: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ConfigProvider
          theme={{
            token: {
              // Ant Design theme customization
              colorPrimary: '#3880F6',
              colorSuccess: '#52c41a',
              colorWarning: '#faad14',
              colorError: '#ff4d4f',
              borderRadius: 6,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            components: {
              // Component-specific theme overrides
              Button: {
                borderRadius: 6,
                controlHeight: 36,
              },
              Card: {
                borderRadius: 8,
              },
              Modal: {
                borderRadius: 8,
              },
              Input: {
                borderRadius: 6,
                controlHeight: 36,
              },
              Select: {
                borderRadius: 6,
                controlHeight: 36,
              },
              Tooltip: {
                borderRadius: 4,
              },
            },
          }}
        >
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
};

/**
 * Initialize the React application
 */
const initializeApp = (): void => {
  // Get the root container
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container element not found');
  }

  // Create React root
  const root = createRoot(container);

  // Development mode enhancements
  if (process.env.NODE_ENV === 'development') {
    // Enable React DevTools
    if (typeof window !== 'undefined') {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ =
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
    }
  }

  // Render the application
  root.render(<AppRoot />);

  // Setup global error handling
  window.addEventListener('error', event => {
    // Log error to main process if available
    if (window.electronAPI?.logError) {
      window.electronAPI.logError('renderer-global-error', {
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }
  });

  window.addEventListener('unhandledrejection', event => {
    // Log error to main process if available
    if (window.electronAPI?.logError) {
      window.electronAPI.logError('renderer-unhandled-rejection', {
        reason: String(event.reason),
        promise: String(event.promise),
      });
    }
  });
};

/**
 * Handle application startup
 */
const startApp = (): void => {
  try {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
      initializeApp();
    }
  } catch (error) {
    // Log error to main process if available
    if (window.electronAPI?.logError) {
      window.electronAPI.logError('renderer-startup-error', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // Fallback error display
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          text-align: center;
          padding: 20px;
          color: #ff4d4f;
        ">
          <h1>⚠️ Application Error</h1>
          <p>Failed to start GetWarped application.</p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Check the developer console for more details.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              margin-top: 20px;
              padding: 8px 16px;
              background: #3880F6;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            "
          >
            Reload Application
          </button>
        </div>
      `;
    }
  }
};

// Start the application
startApp();
