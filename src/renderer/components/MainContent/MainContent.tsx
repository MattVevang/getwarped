/**
 * MainContent component
 *
 * Main content area that displays services and workspaces
 * Handles service view rendering and workspace management
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Empty, Typography, Button, Space, Alert } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { selectSidebarCollapsed } from '../../store/slices/uiSlice';
import { selectServices, selectActiveService } from '../../store/slices/servicesSlice';
import {
  selectWorkspaces,
  selectActiveWorkspace,
  selectWorkspaceById,
} from '../../store/slices/workspacesSlice';
import ServiceView from './ServiceView';

const { Content } = Layout;
const { Title, Text } = Typography;

interface MainContentProps {}

/**
 * MainContent component for service and workspace management
 *
 * Features:
 * - Displays active service in ServiceView component
 * - Workspace management and service selection
 * - Service creation and configuration
 * - Responsive layout with sidebar integration
 */
const MainContent: React.FC<MainContentProps> = () => {
  const { workspaceId, serviceId } = useParams<{
    workspaceId?: string;
    serviceId?: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // UI State
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);

  // Service and Workspace State
  const services = useAppSelector(selectServices);
  const workspaces = useAppSelector(selectWorkspaces);
  const activeService = useAppSelector(selectActiveService);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);

  const currentService = serviceId ? services[serviceId] : activeService;
  const currentWorkspace = workspaceId ? workspaces[workspaceId] : activeWorkspace;

  // Local state
  const [contentBounds, setContentBounds] = useState({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  });

  // Calculate layout dimensions
  const marginLeft = sidebarCollapsed ? 80 : 280;

  /**
   * Calculate content bounds based on window size and sidebar state
   */
  const calculateBounds = useMemo(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    return {
      x: marginLeft,
      y: 60, // Account for top bar
      width: Math.max(600, windowWidth - marginLeft - 40),
      height: Math.max(400, windowHeight - 120),
    };
  }, [marginLeft]);

  /**
   * Update bounds when window resizes or sidebar changes
   */
  useEffect(() => {
    const updateBounds = () => {
      setContentBounds(calculateBounds);
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);

    return () => {
      window.removeEventListener('resize', updateBounds);
    };
  }, [calculateBounds]);

  /**
   * Handle service navigation
   */
  const handleNavigateToService = (newServiceId: string) => {
    if (currentWorkspace) {
      navigate(`/workspace/${currentWorkspace.id}/service/${newServiceId}`);
    }
  };

  /**
   * Handle service creation
   */
  const handleCreateService = () => {
    if (currentWorkspace) {
      navigate(`/workspace/${currentWorkspace.id}/create-service`);
    }
  };

  /**
   * Handle service editing
   */
  const handleEditService = () => {
    if (currentService && currentWorkspace) {
      navigate(`/workspace/${currentWorkspace.id}/edit-service/${currentService.id}`);
    }
  };

  /**
   * Handle workspace settings
   */
  const handleWorkspaceSettings = () => {
    if (currentWorkspace) {
      navigate(`/workspace/${currentWorkspace.id}/settings`);
    }
  };

  /**
   * Render empty state when no service is selected
   */
  const renderEmptyState = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        padding: '20px',
      }}
    >
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Space direction='vertical' align='center'>
            <Title level={3} type='secondary'>
              {currentWorkspace ? 'No Service Selected' : 'No Workspace Selected'}
            </Title>
            <Text type='secondary'>
              {currentWorkspace
                ? 'Select a service from the sidebar or create a new one'
                : 'Please select a workspace to get started'}
            </Text>
          </Space>
        }
      >
        {currentWorkspace && (
          <Space>
            <Button type='primary' icon={<PlusOutlined />} onClick={handleCreateService}>
              Create Service
            </Button>
            <Button icon={<SettingOutlined />} onClick={handleWorkspaceSettings}>
              Workspace Settings
            </Button>
          </Space>
        )}
      </Empty>
    </div>
  );

  /**
   * Render workspace header
   */
  const renderWorkspaceHeader = () => {
    if (!currentWorkspace) return null;

    return (
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}
      >
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            {currentWorkspace.name}
          </Title>
          {currentWorkspace.description && (
            <Text type='secondary'>{currentWorkspace.description}</Text>
          )}
          <Button type='text' icon={<SettingOutlined />} onClick={handleWorkspaceSettings}>
            Settings
          </Button>
        </Space>
      </div>
    );
  };

  /**
   * Render service view or empty state
   */
  const renderContent = () => {
    if (!currentService) {
      return renderEmptyState();
    }

    return (
      <div style={{ padding: '24px', height: '100%' }}>
        <ServiceView
          service={currentService}
          bounds={contentBounds}
          isActive={true}
          onEdit={handleEditService}
          onClose={() => handleNavigateToService('')}
        />
      </div>
    );
  };

  /**
   * Render error state for invalid workspace/service
   */
  const renderErrorState = () => {
    if (workspaceId && !currentWorkspace) {
      return (
        <Alert
          message='Workspace Not Found'
          description={`The workspace with ID "${workspaceId}" could not be found.`}
          type='error'
          showIcon
          style={{ margin: '20px' }}
          action={<Button onClick={() => navigate('/')}>Go Home</Button>}
        />
      );
    }

    if (serviceId && !currentService) {
      return (
        <Alert
          message='Service Not Found'
          description={`The service with ID "${serviceId}" could not be found.`}
          type='error'
          showIcon
          style={{ margin: '20px' }}
          action={
            <Button onClick={() => navigate(`/workspace/${workspaceId}`)}>Back to Workspace</Button>
          }
        />
      );
    }

    return null;
  };

  return (
    <Content
      style={{
        marginLeft,
        minHeight: '100vh',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {renderWorkspaceHeader()}
      {renderErrorState() || renderContent()}
    </Content>
  );
};

export default MainContent;
