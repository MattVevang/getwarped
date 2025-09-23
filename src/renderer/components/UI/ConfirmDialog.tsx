/**
 * ConfirmDialog component
 *
 * Global confirmation dialog controlled by Redux state
 */

import React from 'react';
import { Modal } from 'antd';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { hideConfirmDialog, selectConfirmDialog } from '../../store/slices/uiSlice';

const ConfirmDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmDialog = useAppSelector(selectConfirmDialog);

  if (!confirmDialog) {
    return null;
  }

  const handleConfirm = () => {
    // TODO: Implement callback system for confirm actions
    // This will be connected to the action system later
    dispatch(hideConfirmDialog());
  };

  const handleCancel = () => {
    dispatch(hideConfirmDialog());
  };

  return (
    <Modal
      title={confirmDialog.title}
      open={true}
      onOk={handleConfirm}
      onCancel={handleCancel}
      okText={confirmDialog.confirmText}
      cancelText={confirmDialog.cancelText}
      okType={confirmDialog.type === 'error' ? 'danger' : 'primary'}
    >
      {confirmDialog.message}
    </Modal>
  );
};

export default ConfirmDialog;
