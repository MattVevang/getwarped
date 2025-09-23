/**
 * Main App component for GetWarped
 *
 * Root application component that provides:
 * - Redux Provider for state management
 * - React Router for navigation
 * - Ant Design theme provider
 * - Global error boundary
 * - Layout structure with sidebar and main content
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, Layout, theme } from 'antd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from 'react-hot-toast';

import { store, persistor } from '../../store/store';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { fetchWorkspaces } from '../../store/slices/workspacesSlice';
import { fetchServices } from '../../store/slices/servicesSlice';
import { selectEffectiveTheme } from '../../store/slices/uiSlice';

import Sidebar from '../Sidebar';
import MainContent from '../MainContent';
import ErrorBoundary from '../ErrorBoundary';
import { LoadingSpinner, ConfirmDialog } from '../UI';

// Import modals and dialogs
import { CreateServiceModal, EditServiceModal, CreateWorkspaceModal } from '../Modals';
import ExportConfigurationModal from '../Export';
import ImportConfigurationModal from '../Import';

const { Content } = Layout;

/**
 * Inner App component with access to Redux store
 */
const AppInner: React.FC = () => {
  const dispatch = useAppDispatch();
  const effectiveTheme = useAppSelector(selectEffectiveTheme);

  // Initialize application data
  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchServices({}));
  }, [dispatch]);

  // Ant Design theme configuration
  const antdTheme = {
    algorithm: effectiveTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      wireframe: false,
    },
  };

  return (
    <ConfigProvider theme={antdTheme}>
      <DndProvider backend={HTML5Backend}>
        <Router>
          <Layout className='app-layout' style={{ height: '100vh' }}>
            <Sidebar />

            <Layout>
              <Content className='app-content'>
                <Routes>
                  <Route path='/' element={<MainContent />} />
                  <Route path='/workspace/:workspaceId' element={<MainContent />} />
                  <Route path='/service/:serviceId' element={<MainContent />} />
                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
              </Content>
            </Layout>

            {/* Global Modals */}
            <CreateServiceModal />
            <EditServiceModal />
            <CreateWorkspaceModal />
            <ExportConfigurationModal />
            <ImportConfigurationModal />
            <ConfirmDialog />

            {/* Global Toast Notifications */}
            <Toaster
              position='top-right'
              toastOptions={{
                duration: 4000,
                style: {
                  background: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
                  color: effectiveTheme === 'dark' ? '#ffffff' : '#000000',
                  border: `1px solid ${effectiveTheme === 'dark' ? '#434343' : '#d9d9d9'}`,
                },
                success: {
                  iconTheme: {
                    primary: '#52c41a',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff4d4f',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </Layout>
        </Router>
      </DndProvider>
    </ConfigProvider>
  );
};

/**
 * Root App component with providers
 */
export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
          <AppInner />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
