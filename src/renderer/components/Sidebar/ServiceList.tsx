/**
 * ServiceList component
 *
 * Displays list of services with drag-and-drop functionality
 * Features:
 * - Service selection and navigation
 * - Drag-and-drop reordering within workspace
 * - Service health status indicators
 * - Service management actions (edit, delete, refresh)
 * - Service icons and visual status
 * - Filtering by workspace
 */

import React, { useCallback, useMemo } from 'react';
import {
  List,
  Button,
  Typography,
  Space,
  Tooltip,
  Badge,
  Dropdown,
  Spin,
  Empty,
  Avatar,
} from 'antd';
import {
  AppstoreOutlined,
  GlobalOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useDrag, useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/store';
import {
  selectServices,
  selectActiveService,
  selectServicesLoading,
  selectServicesByWorkspace,
  selectServiceHealth,
  setActiveService,
  deleteService,
} from '../../store/slices/servicesSlice';
import { selectActiveWorkspace } from '../../store/slices/workspacesSlice';
import { showConfirmDialog } from '../../store/slices/uiSlice';
import type { ServiceConfiguration } from '../../../shared/types/ServiceConfiguration';

const { Text } = Typography;

// Drag and drop types
const ItemType = {
  SERVICE: 'service',
};

interface DragItem {
  type: string;
  id: string;
  index: number;
  workspaceId: string;
}

interface ServiceItemProps {
  service: ServiceConfiguration;
  index: number;
  isActive: boolean;
  healthStatus?: 'healthy' | 'unhealthy' | 'loading' | 'unknown';
  onMove: (dragIndex: number, hoverIndex: number, workspaceId: string) => void;
  onSelect: (serviceId: string) => void;
  onEdit: (service: ServiceConfiguration) => void;
  onDelete: (service: ServiceConfiguration) => void;
  onRefresh: (service: ServiceConfiguration) => void;
  collapsed?: boolean;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  index,
  isActive,
  healthStatus = 'unknown',
  onMove,
  onSelect,
  onEdit,
  onDelete,
  onRefresh,
  collapsed = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  // Drag configuration
  const [{ isDragging }, drag] = useDrag({
    type: ItemType.SERVICE,
    item: () => ({
      type: ItemType.SERVICE,
      id: service.id,
      index,
      workspaceId: service.workspaceId,
    }),
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop configuration
  const [, drop] = useDrop({
    accept: ItemType.SERVICE,
    hover: (item: DragItem) => {
      if (!ref.current) return;

      // Only allow reordering within the same workspace
      if (item.workspaceId !== service.workspaceId) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      onMove(dragIndex, hoverIndex, service.workspaceId);
      item.index = hoverIndex;
    },
  });

  // Combine drag and drop refs
  drag(drop(ref));

  const handleSelect = () => {
    onSelect(service.id);
  };

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'unhealthy':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'loading':
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getHealthTooltip = () => {
    switch (healthStatus) {
      case 'healthy':
        return 'Service is running normally';
      case 'unhealthy':
        return 'Service is experiencing issues';
      case 'loading':
        return 'Checking service status...';
      default:
        return 'Service status unknown';
    }
  };

  const menuItems = [
    {
      key: 'refresh',
      icon: <ReloadOutlined />,
      label: 'Refresh Service',
      onClick: () => onRefresh(service),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Service',
      onClick: () => onEdit(service),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Service',
      onClick: () => onDelete(service),
      danger: true,
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <List.Item
        style={{
          padding: collapsed ? '8px 12px' : '12px 16px',
          margin: '2px 0',
          backgroundColor: isActive ? '#e6f7ff' : 'transparent',
          borderRadius: '6px',
          border: isActive ? '1px solid #91d5ff' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={handleSelect}
        actions={
          !collapsed
            ? [
                <Tooltip key='status' title={getHealthTooltip()}>
                  {getHealthIcon()}
                </Tooltip>,
                <Dropdown
                  key='more'
                  menu={{ items: menuItems }}
                  trigger={['click']}
                  placement='bottomRight'
                >
                  <Button
                    type='text'
                    size='small'
                    icon={<MoreOutlined />}
                    onClick={e => e.stopPropagation()}
                  />
                </Dropdown>,
              ]
            : [
                <Tooltip key='status' title={getHealthTooltip()}>
                  {getHealthIcon()}
                </Tooltip>,
              ]
        }
      >
        <List.Item.Meta
          avatar={
            <Avatar
              size={collapsed ? 24 : 32}
              icon={service.icon ? undefined : <AppstoreOutlined />}
              src={service.icon}
              style={{
                backgroundColor: service.icon ? 'transparent' : '#1890ff',
                border: isActive ? '2px solid #1890ff' : 'none',
              }}
            />
          }
          title={
            collapsed ? (
              <Tooltip title={service.name} placement='right'>
                <Text strong={isActive} style={{ fontSize: '14px' }}>
                  {service.name.substring(0, 4)}...
                </Text>
              </Tooltip>
            ) : (
              <Text strong={isActive} style={{ fontSize: '14px' }}>
                {service.name}
              </Text>
            )
          }
          description={
            !collapsed && (
              <Space size={4} direction='vertical' style={{ fontSize: '12px' }}>
                <Text type='secondary' ellipsis style={{ maxWidth: '180px' }}>
                  {new URL(service.url).hostname}
                </Text>
                {service.category && (
                  <Text type='secondary' style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                    {service.category}
                  </Text>
                )}
              </Space>
            )
          }
        />
      </List.Item>
    </div>
  );
};

interface ServiceListProps {
  workspaceId?: string;
  collapsed?: boolean;
  showAll?: boolean;
}

const ServiceList: React.FC<ServiceListProps> = ({
  workspaceId,
  collapsed = false,
  showAll = false,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const allServices = useAppSelector(selectServices);
  const activeService = useAppSelector(selectActiveService);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const loading = useAppSelector(selectServicesLoading);

  // Determine which workspace to show services for
  const targetWorkspaceId = workspaceId || activeWorkspace?.id;

  // Get services for the target workspace
  const services = useAppSelector(state => {
    if (showAll) {
      return Object.values(allServices);
    } else if (targetWorkspaceId) {
      return selectServicesByWorkspace(state, targetWorkspaceId);
    }
    return [];
  });

  const handleMove = useCallback(
    (dragIndex: number, hoverIndex: number, serviceWorkspaceId: string) => {
      // TODO: Implement service reordering within workspace
      // This will require a reorderServices action similar to reorderWorkspaces
    },
    []
  );

  const handleSelect = useCallback(
    (serviceId: string) => {
      dispatch(setActiveService(serviceId));
      navigate(`/service/${serviceId}`);
    },
    [dispatch, navigate]
  );

  const handleEdit = useCallback((service: ServiceConfiguration) => {
    // TODO: Set selected service for editing
  }, []);

  const handleDelete = useCallback(
    (service: ServiceConfiguration) => {
      dispatch(
        showConfirmDialog({
          title: 'Delete Service',
          message: `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: `deleteService:${service.id}`,
          type: 'error',
        })
      );
    },
    [dispatch]
  );

  const handleRefresh = useCallback((service: ServiceConfiguration) => {
    // TODO: Implement service refresh functionality
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size='small' />
      </div>
    );
  }

  if (services.length === 0) {
    const emptyMessage = showAll
      ? 'No services yet'
      : targetWorkspaceId
        ? 'No services in this workspace'
        : 'Select a workspace to view services';

    return (
      <div style={{ padding: collapsed ? '8px 4px' : '20px 16px' }}>
        {!collapsed ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={emptyMessage}
            style={{ margin: '20px 0' }}
          />
        ) : (
          <Tooltip title={emptyMessage} placement='right'>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <AppstoreOutlined style={{ fontSize: '24px', color: '#d9d9d9' }} />
            </div>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className='service-list'>
      <List
        size='small'
        dataSource={services}
        renderItem={(service, index) => {
          // Get health status for this service
          const healthStatus = useAppSelector(state => selectServiceHealth(state, service.id));

          return (
            <ServiceItem
              key={service.id}
              service={service}
              index={index}
              isActive={activeService?.id === service.id}
              healthStatus={healthStatus?.status as any}
              onMove={handleMove}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              collapsed={collapsed}
            />
          );
        }}
        style={{ padding: '0' }}
      />
    </div>
  );
};

export default ServiceList;
