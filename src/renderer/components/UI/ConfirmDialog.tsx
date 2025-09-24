/**
 * ConfirmDialog component
 *
 * Provides confirmation dialogs for critical user actions
 * with customizable styling, icons, and behavior
 */

import React, { useState } from 'react';
import { Modal, Button, Typography, Space, Input } from 'antd';
import {
  ExclamationCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { hideConfirmDialog, selectConfirmDialog } from '../../store/slices/uiSlice';

const { Text, Paragraph } = Typography;

/**
 * Dialog type configurations with icons and colors
 */
const dialogTypeConfigs = {
  info: {
    icon: <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '22px' }} />,
    okButtonType: 'primary' as const,
    title: 'Confirmation',
  },
  warning: {
    icon: <WarningOutlined style={{ color: '#faad14', fontSize: '22px' }} />,
    okButtonType: 'primary' as const,
    title: 'Warning',
  },
  error: {
    icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '22px' }} />,
    okButtonType: 'danger' as const,
    title: 'Important',
  },
  delete: {
    icon: <DeleteOutlined style={{ color: '#ff4d4f', fontSize: '22px' }} />,
    okButtonType: 'danger' as const,
    title: 'Delete Confirmation',
  },
  success: {
    icon: <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '22px' }} />,
    okButtonType: 'primary' as const,
    title: 'Success',
  },
};

/**
 * ConfirmDialog component
 */
export const ConfirmDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmDialog = useAppSelector(selectConfirmDialog);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!confirmDialog) {
    return null;
  }

  const config = dialogTypeConfigs[confirmDialog.type || 'info'];

  const handleConfirm = async () => {
    // Check confirmation input if required
    if (confirmDialog.requireConfirmation) {
      const expectedText = confirmDialog.confirmationText || 'DELETE';
      if (confirmationInput.trim() !== expectedText) {
        return; // Don't proceed if confirmation text doesn't match
      }
    }

    setIsExecuting(true);

    try {
      // TODO: Implement callback system based on onConfirm string identifier
      // This will dispatch the appropriate action based on the callback identifier
      if (confirmDialog.onConfirm) {
        // Handle confirmation action based on identifier
      }
    } catch (error) {
      // Handle error silently for now
    } finally {
      setIsExecuting(false);
      dispatch(hideConfirmDialog());
      setConfirmationInput('');
    }
  };

  const handleCancel = () => {
    // TODO: Execute cancel callback if provided
    if (confirmDialog.onCancel) {
      // Handle cancel action based on identifier
    }

    dispatch(hideConfirmDialog());
    setConfirmationInput('');
  };

  const isConfirmDisabled =
    confirmDialog.requireConfirmation &&
    confirmationInput.trim() !== (confirmDialog.confirmationText || 'DELETE');

  return (
    <Modal
      title={
        <Space align='start'>
          {config.icon}
          <span>{confirmDialog.title || config.title}</span>
        </Space>
      }
      open={true}
      onCancel={handleCancel}
      width={confirmDialog.width || 480}
      centered
      maskClosable={false}
      keyboard={false}
      footer={[
        <Button key='cancel' onClick={handleCancel} disabled={isExecuting}>
          {confirmDialog.cancelText || 'Cancel'}
        </Button>,
        <Button
          key='confirm'
          type='primary'
          onClick={handleConfirm}
          loading={isExecuting}
          disabled={isConfirmDisabled}
          danger={config.okButtonType === 'danger'}
        >
          {confirmDialog.confirmText || 'Confirm'}
        </Button>,
      ]}
    >
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        {/* Main message */}
        <Paragraph style={{ marginBottom: 0 }}>{confirmDialog.message}</Paragraph>

        {/* Additional details */}
        {confirmDialog.details && (
          <Paragraph type='secondary' style={{ fontSize: '13px', marginBottom: 0 }}>
            {confirmDialog.details}
          </Paragraph>
        )}

        {/* Consequences warning */}
        {confirmDialog.consequences && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: '6px',
            }}
          >
            <Text type='warning' style={{ fontSize: '13px' }}>
              <strong>Warning:</strong> {confirmDialog.consequences}
            </Text>
          </div>
        )}

        {/* Confirmation input for dangerous actions */}
        {confirmDialog.requireConfirmation && (
          <div>
            <Text style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              To confirm this action, please type{' '}
              <Text code>{confirmDialog.confirmationText || 'DELETE'}</Text>:
            </Text>
            <Input
              value={confirmationInput}
              onChange={e => setConfirmationInput(e.target.value)}
              placeholder={confirmDialog.confirmationText || 'DELETE'}
              autoFocus
              disabled={isExecuting}
            />
          </div>
        )}

        {/* List of affected items */}
        {confirmDialog.affectedItems && confirmDialog.affectedItems.length > 0 && (
          <div>
            <Text style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
              {confirmDialog.affectedItemsLabel || 'Affected items:'}
            </Text>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {confirmDialog.affectedItems.map((item, index) => (
                <li key={index}>
                  <Text style={{ fontSize: '13px' }}>{item}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Space>
    </Modal>
  );
};

/**
 * Utility functions for showing common confirmation dialogs
 */
export const ConfirmDialogHelpers = {
  /**
   * Show delete confirmation
   */
  showDeleteConfirm: (
    dispatch: any,
    options: {
      title?: string;
      message: string;
      itemName?: string;
      onConfirm?: () => Promise<void> | void;
      onCancel?: () => void;
      requireConfirmation?: boolean;
      consequences?: string;
    }
  ) => {
    dispatch({
      type: 'ui/showConfirmDialog',
      payload: {
        type: 'delete',
        title: options.title || `Delete ${options.itemName || 'Item'}`,
        message: options.message,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        requireConfirmation: options.requireConfirmation || false,
        confirmationText: 'DELETE',
        consequences: options.consequences || 'This action cannot be undone.',
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      },
    });
  },

  /**
   * Show warning confirmation
   */
  showWarningConfirm: (
    dispatch: any,
    options: {
      title?: string;
      message: string;
      details?: string;
      onConfirm?: () => Promise<void> | void;
      onCancel?: () => void;
    }
  ) => {
    dispatch({
      type: 'ui/showConfirmDialog',
      payload: {
        type: 'warning',
        title: options.title || 'Warning',
        message: options.message,
        details: options.details,
        confirmText: 'Continue',
        cancelText: 'Cancel',
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
      },
    });
  },

  /**
   * Show unsaved changes confirmation
   */
  showUnsavedChangesConfirm: (
    dispatch: any,
    options: {
      onSave?: () => Promise<void> | void;
      onDiscard?: () => Promise<void> | void;
      onCancel?: () => void;
    }
  ) => {
    dispatch({
      type: 'ui/showConfirmDialog',
      payload: {
        type: 'warning',
        title: 'Unsaved Changes',
        message: 'You have unsaved changes that will be lost.',
        details: 'Would you like to save your changes before continuing?',
        confirmText: 'Save Changes',
        cancelText: 'Discard',
        onConfirm: options.onSave,
        onCancel: options.onDiscard,
      },
    });
  },

  /**
   * Show service removal confirmation
   */
  showRemoveServiceConfirm: (
    dispatch: any,
    serviceName: string,
    onConfirm?: () => Promise<void> | void
  ) => {
    dispatch({
      type: 'ui/showConfirmDialog',
      payload: {
        type: 'delete',
        title: 'Remove Service',
        message: `Are you sure you want to remove "${serviceName}"?`,
        details:
          "This will remove the service from your workspace but won't affect your actual account.",
        consequences:
          'You will need to re-add and re-configure this service if you want to use it again.',
        confirmText: 'Remove Service',
        cancelText: 'Keep Service',
        onConfirm,
      },
    });
  },

  /**
   * Show workspace deletion confirmation
   */
  showDeleteWorkspaceConfirm: (
    dispatch: any,
    workspaceName: string,
    serviceCount: number,
    onConfirm?: () => Promise<void> | void
  ) => {
    dispatch({
      type: 'ui/showConfirmDialog',
      payload: {
        type: 'delete',
        title: 'Delete Workspace',
        message: `Are you sure you want to delete the workspace "${workspaceName}"?`,
        consequences: `This will permanently delete the workspace and remove ${serviceCount} service${serviceCount !== 1 ? 's' : ''}.`,
        requireConfirmation: true,
        confirmationText: 'DELETE',
        confirmText: 'Delete Workspace',
        cancelText: 'Cancel',
        affectedItems:
          serviceCount > 0
            ? [`${serviceCount} service${serviceCount !== 1 ? 's' : ''} will be removed`]
            : undefined,
        onConfirm,
      },
    });
  },
};

export default ConfirmDialog;
