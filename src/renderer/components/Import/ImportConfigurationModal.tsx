/**
 * ImportConfigurationModal component
 *
 * Modal for importing configuration
 */

import React from 'react';
import { Modal } from 'antd';

const ImportConfigurationModal: React.FC = () => {
  // TODO: Connect to Redux state for modal visibility
  const isOpen = false;

  return (
    <Modal
      title='Import Configuration'
      open={isOpen}
      onCancel={() => {
        /* TODO: Close modal */
      }}
      footer={null}
    >
      {/* TODO: Add import configuration form */}
    </Modal>
  );
};

export default ImportConfigurationModal;
