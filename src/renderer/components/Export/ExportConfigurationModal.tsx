/**
 * ExportConfigurationModal component
 *
 * Modal for exporting configuration
 */

import React from 'react';
import { Modal } from 'antd';

const ExportConfigurationModal: React.FC = () => {
  // TODO: Connect to Redux state for modal visibility
  const isOpen = false;

  return (
    <Modal
      title='Export Configuration'
      open={isOpen}
      onCancel={() => {
        /* TODO: Close modal */
      }}
      footer={null}
    >
      {/* TODO: Add export configuration form */}
    </Modal>
  );
};

export default ExportConfigurationModal;
