/**
 * NotificationToast component
 *
 * Toast notification system using react-hot-toast for user feedback
 * Provides consistent notification styling and behavior across the app
 */

import React from 'react';
import { Toaster, toast, ToastOptions } from 'react-hot-toast';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseOutlined,
} from '@ant-design/icons';

/**
 * Custom toast notification styles and configuration
 */
const toastConfig: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#fff',
    color: '#333',
    fontSize: '14px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e8e8e8',
    padding: '16px',
    maxWidth: '400px',
  },
};

/**
 * Custom toast types with icons and colors
 */
export const NotificationToast = {
  /**
   * Show success toast
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...toastConfig,
      ...options,
      icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #52c41a',
      },
    });
  },

  /**
   * Show error toast
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...toastConfig,
      duration: 6000, // Longer duration for errors
      ...options,
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #ff4d4f',
      },
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...toastConfig,
      duration: 5000,
      ...options,
      icon: <WarningOutlined style={{ color: '#faad14', fontSize: '16px' }} />,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #faad14',
      },
    });
  },

  /**
   * Show info toast
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...toastConfig,
      ...options,
      icon: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '16px' }} />,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #1890ff',
      },
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...toastConfig,
      duration: Infinity, // Loading toasts persist until dismissed
      ...options,
      style: {
        ...toastConfig.style,
        borderLeft: '4px solid #1890ff',
      },
    });
  },

  /**
   * Show custom toast
   */
  custom: (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...toastConfig,
      ...options,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Show promise toast (automatically updates based on promise state)
   */
  promise: (
    promise: Promise<any>,
    messages: {
      loading: string;
      success: (data: any) => string;
      error: (error: Error) => string;
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...toastConfig,
        ...options,
        style: {
          ...toastConfig.style,
          borderLeft: '4px solid #1890ff',
        },
        success: {
          icon: React.createElement(CheckCircleOutlined, {
            style: { color: '#52c41a', fontSize: '16px' },
          }),
          style: {
            ...toastConfig.style,
            borderLeft: '4px solid #52c41a',
          },
        },
        error: {
          icon: React.createElement(ExclamationCircleOutlined, {
            style: { color: '#ff4d4f', fontSize: '16px' },
          }),
          style: {
            ...toastConfig.style,
            borderLeft: '4px solid #ff4d4f',
          },
        },
      }
    );
  },
};

/**
 * ToastProvider component to be used at app root level
 */
export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position='top-right'
      reverseOrder={false}
      gutter={8}
      containerClassName='toast-container'
      containerStyle={{
        top: 20,
        right: 20,
      }}
      toastOptions={{
        ...toastConfig,
        // Custom close button
        className: 'custom-toast',
        style: {
          ...toastConfig.style,
          position: 'relative',
        },
      }}
    />
  );
};

/**
 * Hook for using notifications in components
 */
export const useNotifications = () => {
  return {
    success: NotificationToast.success,
    error: NotificationToast.error,
    warning: NotificationToast.warning,
    info: NotificationToast.info,
    loading: NotificationToast.loading,
    custom: NotificationToast.custom,
    dismiss: NotificationToast.dismiss,
    dismissAll: NotificationToast.dismissAll,
    promise: NotificationToast.promise,
  };
};

/**
 * Common notification messages for consistency
 */
export const CommonNotifications = {
  // Success messages
  SAVE_SUCCESS: 'Configuration saved successfully',
  EXPORT_SUCCESS: 'Configuration exported successfully',
  IMPORT_SUCCESS: 'Configuration imported successfully',
  SERVICE_CREATED: 'Service created successfully',
  SERVICE_UPDATED: 'Service updated successfully',
  SERVICE_DELETED: 'Service deleted successfully',
  WORKSPACE_CREATED: 'Workspace created successfully',
  WORKSPACE_UPDATED: 'Workspace updated successfully',
  WORKSPACE_DELETED: 'Workspace deleted successfully',

  // Error messages
  SAVE_ERROR: 'Failed to save configuration',
  EXPORT_ERROR: 'Failed to export configuration',
  IMPORT_ERROR: 'Failed to import configuration',
  SERVICE_ERROR: 'Failed to perform service operation',
  WORKSPACE_ERROR: 'Failed to perform workspace operation',
  NETWORK_ERROR: 'Network connection error',
  VALIDATION_ERROR: 'Validation failed',
  AUTHENTICATION_ERROR: 'Authentication required',

  // Warning messages
  UNSAVED_CHANGES: 'You have unsaved changes',
  SERVICE_UNREACHABLE: 'Service may be unreachable',
  COMPATIBILITY_WARNING: 'Compatibility issues detected',
  SECURITY_WARNING: 'Security notice requires attention',

  // Info messages
  LOADING_CONFIG: 'Loading configuration...',
  CONNECTING_SERVICE: 'Connecting to service...',
  PROCESSING: 'Processing your request...',
  REAUTH_REQUIRED: 'Re-authentication required for this service',
};

/**
 * Utility functions for common notification patterns
 */
export const NotificationHelpers = {
  /**
   * Show operation result notification
   */
  showOperationResult: (operation: string, success: boolean, error?: string) => {
    if (success) {
      NotificationToast.success(`${operation} completed successfully`);
    } else {
      NotificationToast.error(error || `${operation} failed`);
    }
  },

  /**
   * Show async operation notifications
   */
  showAsyncOperation: (promise: Promise<any>, operation: string) => {
    return NotificationToast.promise(promise, {
      loading: `${operation}...`,
      success: (data: any) => `${operation} completed successfully`,
      error: (error: Error) => `${operation} failed: ${error.message}`,
    });
  },

  /**
   * Show validation error
   */
  showValidationError: (field: string, message: string) => {
    NotificationToast.error(`${field}: ${message}`);
  },

  /**
   * Show network status
   */
  showNetworkStatus: (online: boolean) => {
    if (online) {
      NotificationToast.success('Connection restored');
    } else {
      NotificationToast.warning('Connection lost - working offline');
    }
  },

  /**
   * Show service status
   */
  showServiceStatus: (serviceName: string, status: 'connected' | 'disconnected' | 'error') => {
    switch (status) {
      case 'connected':
        NotificationToast.success(`Connected to ${serviceName}`);
        break;
      case 'disconnected':
        NotificationToast.warning(`Disconnected from ${serviceName}`);
        break;
      case 'error':
        NotificationToast.error(`Error connecting to ${serviceName}`);
        break;
    }
  },
};

export default NotificationToast;
