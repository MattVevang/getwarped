/**
 * EditServiceModal component
 *
 * Modal for editing existing services
 */

import React from 'react';
import { Modal } from 'antd';

const EditServiceModal: React.FC = () => {
  // TODO: Connect to Redux state for modal visibility and selected service
  const isOpen = false;

  return (
    <Modal
      title='Edit Service'
      open={isOpen}
      onCancel={() => {
        /* TODO: Close modal */
      }}
      footer={null}
    >
      {/* TODO: Add service editing form */}
    </Modal>
  );
};

export default EditServiceModal;
