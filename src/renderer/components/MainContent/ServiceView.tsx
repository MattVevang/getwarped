/**
 * ServiceView component
 *
 * Displays an individual service in an isolated webview container.
 * Handles BrowserView creation, navigation, and lifecycle management.
 * Communicates with main process for session isolation and security.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Button, Spin, Alert, Space, Typography, Tooltip } from 'antd';
import {
  ReloadOutlined,
  HomeOutlined,
  BackwardOutlined,
  ForwardOutlined,
  SettingOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { ServiceConfiguration } from '../../../shared/types/ServiceConfiguration';

const { Title, Text } = Typography;

interface ServiceViewProps {
  service: ServiceConfiguration;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  onClose?: () => void;
  onEdit?: () => void;
}

interface ServiceViewState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  canGoBack: boolean;
  canGoForward: boolean;
  currentUrl: string;
}

/**
 * ServiceView component for displaying services in isolated BrowserViews
 *
 * Features:
 * - Creates isolated BrowserView via IPC
 * - Navigation controls (back, forward, reload, home)
 * - Loading and error states
 * - Service settings and configuration
 * - Proper cleanup on unmount
 */
const ServiceView: React.FC<ServiceViewProps> = ({
  service,
  bounds,
  isActive,
  onClose,
  onEdit,
}) => {
  const [state, setState] = useState<ServiceViewState>({
    isLoading: true,
    hasError: false,
    errorMessage: '',
    canGoBack: false,
    canGoForward: false,
    currentUrl: service.url,
  });

  const browserViewRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Updates the service view state
   */
  const updateState = useCallback((updates: Partial<ServiceViewState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Creates BrowserView via IPC
   */
  const createBrowserView = useCallback(async () => {
    try {
      updateState({ isLoading: true, hasError: false });

      // Request BrowserView creation from main process
      const response = await window.electronAPI.invoke('browserview:create', {
        serviceId: service.id,
        bounds,
      });

      if (response.success) {
        browserViewRef.current = true;

        // Navigate to service URL
        await window.electronAPI.invoke('browserview:navigate', {
          serviceId: service.id,
          url: service.url,
        });

        updateState({
          isLoading: false,
          hasError: false,
          currentUrl: service.url,
        });
      } else {
        updateState({
          isLoading: false,
          hasError: true,
          errorMessage: response.error || 'Failed to create service view',
        });
      }
    } catch (error) {
      updateState({
        isLoading: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [service.id, service.url, bounds, updateState]);

  /**
   * Destroys BrowserView via IPC
   */
  const destroyBrowserView = useCallback(async () => {
    if (browserViewRef.current) {
      try {
        await window.electronAPI.invoke('browserview:destroy', {
          serviceId: service.id,
        });
        browserViewRef.current = false;
      } catch (error) {
        // Log error silently - proper logging will be implemented later
      }
    }
  }, [service.id]);

  /**
   * Navigates to a specific URL
   */
  const navigateToUrl = useCallback(
    async (url: string) => {
      try {
        updateState({ isLoading: true });

        const response = await window.electronAPI.invoke('browserview:navigate', {
          serviceId: service.id,
          url,
        });

        if (response.success) {
          updateState({
            isLoading: false,
            currentUrl: url,
            hasError: false,
          });
        } else {
          updateState({
            isLoading: false,
            hasError: true,
            errorMessage: response.error || 'Navigation failed',
          });
        }
      } catch (error) {
        updateState({
          isLoading: false,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Navigation error',
        });
      }
    },
    [service.id, updateState]
  );

  /**
   * Navigation control handlers
   */
  const handleBack = useCallback(() => {
    window.electronAPI.invoke('browserview:go-back', { serviceId: service.id });
  }, [service.id]);

  const handleForward = useCallback(() => {
    window.electronAPI.invoke('browserview:go-forward', { serviceId: service.id });
  }, [service.id]);

  const handleReload = useCallback(() => {
    window.electronAPI.invoke('browserview:reload', { serviceId: service.id });
  }, [service.id]);

  const handleHome = useCallback(() => {
    navigateToUrl(service.url);
  }, [navigateToUrl, service.url]);

  /**
   * Resize BrowserView when bounds change
   */
  const resizeBrowserView = useCallback(async () => {
    if (browserViewRef.current && isActive) {
      try {
        await window.electronAPI.invoke('browserview:resize', {
          serviceId: service.id,
          bounds,
        });
      } catch (error) {
        // Log error silently - proper logging will be implemented later
      }
    }
  }, [service.id, bounds, isActive]);

  /**
   * Show/hide BrowserView based on active state
   */
  const toggleBrowserViewVisibility = useCallback(async () => {
    if (browserViewRef.current) {
      try {
        await window.electronAPI.invoke('browserview:set-visibility', {
          serviceId: service.id,
          visible: isActive,
        });
      } catch (error) {
        // Log error silently - proper logging will be implemented later
      }
    }
  }, [service.id, isActive]);

  // Create BrowserView on mount
  useEffect(() => {
    createBrowserView();

    return () => {
      destroyBrowserView();
    };
  }, [createBrowserView, destroyBrowserView]);

  // Handle bounds changes
  useEffect(() => {
    resizeBrowserView();
  }, [resizeBrowserView]);

  // Handle visibility changes
  useEffect(() => {
    toggleBrowserViewVisibility();
  }, [toggleBrowserViewVisibility]);

  /**
   * Render navigation toolbar
   */
  const renderToolbar = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fafafa',
      }}
    >
      <Space>
        <Tooltip title='Go Back'>
          <Button
            type='text'
            icon={<BackwardOutlined />}
            onClick={handleBack}
            disabled={!state.canGoBack || state.isLoading}
          />
        </Tooltip>

        <Tooltip title='Go Forward'>
          <Button
            type='text'
            icon={<ForwardOutlined />}
            onClick={handleForward}
            disabled={!state.canGoForward || state.isLoading}
          />
        </Tooltip>

        <Tooltip title='Reload'>
          <Button
            type='text'
            icon={<ReloadOutlined />}
            onClick={handleReload}
            disabled={state.isLoading}
          />
        </Tooltip>

        <Tooltip title='Home'>
          <Button
            type='text'
            icon={<HomeOutlined />}
            onClick={handleHome}
            disabled={state.isLoading}
          />
        </Tooltip>
      </Space>

      <Space>
        <Text type='secondary' style={{ fontSize: '12px' }}>
          {state.currentUrl}
        </Text>

        {onEdit && (
          <Tooltip title='Service Settings'>
            <Button type='text' icon={<SettingOutlined />} onClick={onEdit} size='small' />
          </Tooltip>
        )}

        {onClose && (
          <Tooltip title='Close Service'>
            <Button type='text' icon={<CloseOutlined />} onClick={onClose} size='small' />
          </Tooltip>
        )}
      </Space>
    </div>
  );

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        padding: '20px',
      }}
    >
      <Spin size='large' />
      <Title level={4} style={{ marginTop: '16px', color: '#666' }}>
        Loading {service.name}...
      </Title>
      <Text type='secondary'>Initializing secure session for {service.url}</Text>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <div style={{ padding: '20px' }}>
      <Alert
        message='Service Loading Error'
        description={state.errorMessage}
        type='error'
        icon={<ExclamationCircleOutlined />}
        action={
          <Button size='small' onClick={createBrowserView}>
            Retry
          </Button>
        }
      />
    </div>
  );

  /**
   * Render service view container
   */
  const renderServiceContainer = () => {
    if (state.isLoading) {
      return renderLoading();
    }

    if (state.hasError) {
      return renderError();
    }

    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: bounds.height - 48, // Account for toolbar
          position: 'relative',
          backgroundColor: '#fff',
        }}
      >
        {/* BrowserView is managed by main process and overlaid here */}
        {!isActive && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <Text type='secondary'>Service is inactive</Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      style={{
        width: bounds.width,
        height: bounds.height,
        border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0 }}
      title={
        <Space>
          {service.icon && (
            <img
              src={service.icon}
              alt={service.name}
              style={{ width: 16, height: 16 }}
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span>{service.name}</span>
        </Space>
      }
      extra={renderToolbar()}
    >
      {renderServiceContainer()}
    </Card>
  );
};

export default ServiceView;
