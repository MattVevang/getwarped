/**
 * AppProviders - Consolidated React Context Providers
 *
 * Central provider component that wraps the entire application with all
 * necessary React context providers. This includes Redux store, theme,
 * configuration, and other application-wide contexts.
 *
 * @fileoverview Consolidated application context providers
 */

import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from '../store/store';
import ThemeProvider from '../components/Theme/ThemeProvider';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Main application providers component
 * Consolidates all React context providers in a single component
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
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
              colorInfo: '#1677ff',
              colorLink: '#3880F6',
              colorBgBase: '#ffffff',
              colorTextBase: '#000000',
              borderRadius: 8,
              wireframe: false,
            },
            algorithm: undefined, // Will be controlled by ThemeProvider
            components: {
              Layout: {
                headerBg: '#ffffff',
                siderBg: '#fafafa',
                bodyBg: '#ffffff',
              },
              Menu: {
                itemBg: 'transparent',
                subMenuItemBg: 'transparent',
                itemSelectedBg: '#e6f7ff',
                itemHoverBg: '#f5f5f5',
              },
              Button: {
                borderRadius: 8,
                controlHeight: 32,
              },
              Card: {
                borderRadius: 12,
                paddingLG: 24,
              },
              Modal: {
                borderRadius: 12,
              },
              Drawer: {
                borderRadius: 12,
              },
              Tabs: {
                borderRadius: 8,
              },
              Input: {
                borderRadius: 6,
                controlHeight: 32,
              },
              Select: {
                borderRadius: 6,
                controlHeight: 32,
              },
            },
          }}
          form={{
            validateMessages: {
              required: '${label} is required',
              types: {
                email: '${label} is not a valid email',
                number: '${label} is not a valid number',
                url: '${label} is not a valid URL',
              },
              string: {
                range: '${label} must be between ${min} and ${max} characters',
              },
              number: {
                range: '${label} must be between ${min} and ${max}',
              },
            },
          }}
          input={{
            autoComplete: 'off',
          }}
          space={{
            size: 'middle',
          }}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default AppProviders;
