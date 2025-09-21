/**
 * Redux store configuration for GetWarped application
 * Configures Redux Toolkit store with proper middleware and dev tools
 */

import { configureStore } from '@reduxjs/toolkit';

// TODO: Import slice reducers
// import { workspacesSlice } from './slices/workspacesSlice';
// import { servicesSlice } from './slices/servicesSlice';
// import { uiSlice } from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    // TODO: Add slice reducers
    // workspaces: workspacesSlice.reducer,
    // services: servicesSlice.reducer,
    // ui: uiSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// TODO: Add typed hooks
// export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
