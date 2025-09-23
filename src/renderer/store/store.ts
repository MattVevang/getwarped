/**
 * Redux store configuration for GetWarped application
 * Configures Redux Toolkit store with redux-persist for state persistence
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import slice reducers
import { workspacesSlice } from './slices/workspacesSlice';
import { servicesSlice } from './slices/servicesSlice';
import { uiSlice } from './slices/uiSlice';
import { exportImportSlice } from './slices/exportImportSlice';

// Storage configuration for electron renderer
const storage = {
  getItem: (key: string) => {
    try {
      const value = localStorage.getItem(key);
      return Promise.resolve(value);
    } catch (error) {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (error) {
      return Promise.resolve();
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (error) {
      return Promise.resolve();
    }
  },
};

// Persist configuration
const persistConfig = {
  key: 'getwarped-root',
  version: 1,
  storage,
  // Whitelist specific slices to persist
  whitelist: ['ui'], // Only persist UI preferences
  // Don't persist services/workspaces as they're managed by main process
  blacklist: ['services', 'workspaces', 'exportImport'],
};

// Combined reducers
const rootReducer = combineReducers({
  workspaces: workspacesSlice.reducer,
  services: servicesSlice.reducer,
  ui: uiSlice.reducer,
  exportImport: exportImportSlice.reducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['persist'],
      },
      immutableCheck: {
        warnAfter: 32,
      },
    }),
  devTools: typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production',
});

export const persistor = persistStore(store);

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
