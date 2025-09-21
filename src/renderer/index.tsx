/**
 * Renderer process entry point for GetWarped Electron application
 * Initializes React app with Redux store and routing
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './components/App/App';
import { store } from './store/store';
import './styles/global.css';

/**
 * Initialize the React application
 */
function initializeApp(): void {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root element not found');
  }

  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// TODO: Add error boundary
// TODO: Add theme provider
// TODO: Add routing
// TODO: Add service worker for offline support
