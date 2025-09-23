/**
 * WorkspaceList component
 *
 * Displays list of workspaces with drag-and-drop reordering functionality
 * Features:
 * - Workspace selection and switching
 * - Drag-and-drop reordering with react-dnd
 * - Active workspace highlighting
 * - Workspace management actions (edit, delete)
 * - Empty state handling
 */

import React, { useCallback } from 'react';
import { List, Button, Typography, Space, Tooltip, Badge, Dropdown, Spin, Empty } from 'antd';
import {
  FolderOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useDrag, useDrop } from 'react-dnd';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/store';
import {
  selectWorkspacesList,
  selectActiveWorkspace,
  selectWorkspacesLoading,
  selectDefaultWorkspace,
  reorderWorkspaces,
  setActiveWorkspace,
  deleteWorkspace,
} from '../../store/slices/workspacesSlice';
import { selectServicesByWorkspace } from '../../store/slices/servicesSlice';
import { showConfirmDialog } from '../../store/slices/uiSlice';
import type { Workspace } from '../../../shared/types/Workspace';

const { Text } = Typography;

// Drag and drop types
const ItemType = {
  WORKSPACE: 'workspace',
};

interface DragItem {
  type: string;
  id: string;
  index: number;
}

interface WorkspaceItemProps {
  workspace: Workspace;
  index: number;
  isActive: boolean;
  isDefault: boolean;
  serviceCount: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onSelect: (workspaceId: string) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  collapsed?: boolean;
}

const WorkspaceItem: React.FC<WorkspaceItemProps> = ({
  workspace,
  index,
  isActive,
  isDefault,
  serviceCount,
  onMove,
  onSelect,
  onEdit,
  onDelete,
  collapsed = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  // Drag configuration
  const [{ isDragging }, drag] = useDrag({
    type: ItemType.WORKSPACE,
    item: () => ({ type: ItemType.WORKSPACE, id: workspace.id, index }),
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop configuration
  const [, drop] = useDrop({
    accept: ItemType.WORKSPACE,
    hover: (item: DragItem) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Combine drag and drop refs
  drag(drop(ref));

  const handleSelect = () => {
    onSelect(workspace.id);
  };

  const menuItems = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Workspace',
      onClick: () => onEdit(workspace),
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Workspace',
      onClick: () => onDelete(workspace),
      disabled: isDefault, // Cannot delete default workspace
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
            : undefined
        }
      >
        <List.Item.Meta
          avatar={
            <Space size={4}>
              {isDefault && (
                <Tooltip title='Default Workspace'>
                  <StarFilled style={{ color: '#faad14', fontSize: '12px' }} />
                </Tooltip>
              )}
              {isActive ? (
                <FolderOpenOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
              ) : (
                <FolderOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />
              )}
            </Space>
          }
          title={
            collapsed ? (
              <Tooltip title={workspace.name} placement='right'>
                <Text strong={isActive} style={{ fontSize: '14px' }}>
                  {workspace.name.substring(0, 3)}...
                </Text>
              </Tooltip>
            ) : (
              <Text strong={isActive} style={{ fontSize: '14px' }}>
                {workspace.name}
              </Text>
            )
          }
          description={
            !collapsed && (
              <Space size={8}>
                <Badge count={serviceCount} size='small' style={{ backgroundColor: '#52c41a' }} />
                <Text type='secondary' style={{ fontSize: '12px' }}>
                  {serviceCount === 1 ? 'service' : 'services'}
                </Text>
              </Space>
            )
          }
        />
      </List.Item>
    </div>
  );
};

interface WorkspaceListProps {
  collapsed?: boolean;
}

const WorkspaceList: React.FC<WorkspaceListProps> = ({ collapsed = false }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const workspaces = useAppSelector(selectWorkspacesList);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);
  const defaultWorkspace = useAppSelector(selectDefaultWorkspace);
  const loading = useAppSelector(selectWorkspacesLoading);

  const handleMove = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const draggedWorkspace = workspaces[dragIndex];
      const newOrder = [...workspaces];

      // Remove dragged item
      newOrder.splice(dragIndex, 1);
      // Insert at new position
      newOrder.splice(hoverIndex, 0, draggedWorkspace);

      // Dispatch reorder action
      dispatch(
        reorderWorkspaces({
          workspaceIds: newOrder.map(w => w.id),
        })
      );
    },
    [workspaces, dispatch]
  );

  const handleSelect = useCallback(
    (workspaceId: string) => {
      dispatch(setActiveWorkspace({ workspaceId }));
      navigate(`/workspace/${workspaceId}`);
    },
    [dispatch, navigate]
  );

  const handleEdit = useCallback((workspace: Workspace) => {
    // TODO: Set selected workspace for editing and open modal
  }, []);

  const handleDelete = useCallback(
    (workspace: Workspace) => {
      dispatch(
        showConfirmDialog({
          title: 'Delete Workspace',
          message: `Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          onConfirm: `deleteWorkspace:${workspace.id}`,
          type: 'error',
        })
      );
    },
    [dispatch]
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size='small' />
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div style={{ padding: collapsed ? '8px 4px' : '20px 16px' }}>
        {!collapsed ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='No workspaces yet'
            style={{ margin: '20px 0' }}
          />
        ) : (
          <Tooltip title='No workspaces' placement='right'>
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <FolderOutlined style={{ fontSize: '24px', color: '#d9d9d9' }} />
            </div>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className='workspace-list'>
      <List
        size='small'
        dataSource={workspaces}
        renderItem={(workspace, index) => {
          // Get service count for this workspace
          const services = useAppSelector(state => selectServicesByWorkspace(state, workspace.id));

          return (
            <WorkspaceItem
              key={workspace.id}
              workspace={workspace}
              index={index}
              isActive={activeWorkspace?.id === workspace.id}
              isDefault={defaultWorkspace?.id === workspace.id}
              serviceCount={services.length}
              onMove={handleMove}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              collapsed={collapsed}
            />
          );
        }}
        style={{ padding: '0' }}
      />
    </div>
  );
};

export default WorkspaceList;
