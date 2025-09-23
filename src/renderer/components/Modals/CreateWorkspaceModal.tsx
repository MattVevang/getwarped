/**
 * CreateWorkspaceModal component
 *
 * Modal for creating new workspaces
 */

import React from 'react';
import { Modal } from 'antd';

const CreateWorkspaceModal: React.FC = () => {
  // TODO: Connect to Redux state for modal visibility
  const isOpen = false;

  return (
    <Modal
      title='Create New Workspace'
      open={isOpen}
      onCancel={() => {
        /* TODO: Close modal */
      }}
      footer={null}
    >
      {/* TODO: Add workspace creation form */}
    </Modal>
  );
};

export default CreateWorkspaceModal;
