/**
 * MainContent component
 *
 * Main content area that displays services and workspaces
 */

import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/store';
import { selectSidebarCollapsed } from '../../store/slices/uiSlice';

const { Content } = Layout;

const MainContent: React.FC = () => {
  const { workspaceId, serviceId } = useParams();
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);

  // Calculate margin based on sidebar state
  const marginLeft = sidebarCollapsed ? 80 : 280;

  return (
    <Content
      style={{
        marginLeft,
        padding: '24px',
        minHeight: '100vh',
        background: '#ffffff',
      }}
    >
      <div>
        <h2>Main Content</h2>
        {workspaceId && <p>Workspace ID: {workspaceId}</p>}
        {serviceId && <p>Service ID: {serviceId}</p>}
        {/* TODO: Add service view and workspace management */}
      </div>
    </Content>
  );
};

export default MainContent;
