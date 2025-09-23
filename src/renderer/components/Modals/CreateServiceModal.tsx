/**
 * CreateServiceModal component
 *
 * Modal for creating new services
 */

import React from 'react';
import { Modal } from 'antd';
import { useAppSelector } from '../../store/store';

const CreateServiceModal: React.FC = () => {
  // TODO: Connect to Redux state for modal visibility
  const isOpen = false;

  return (
    <Modal
      title='Create New Service'
      open={isOpen}
      onCancel={() => {
        /* TODO: Close modal */
      }}
      footer={null}
    >
      {/* TODO: Add service creation form */}
    </Modal>
  );
};

export default CreateServiceModal;
