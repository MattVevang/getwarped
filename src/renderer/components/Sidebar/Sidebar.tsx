/**
 * Sidebar component
 *
 * Left sidebar containing workspace and service navigation with:
 * - Application branding and controls
 * - Workspace selection and management
 * - Service list with icons and status
 * - Create buttons and actions
 * - Settings and preferences access
 */

import React from 'react';
import { Layout, Space, Button, Divider, Typography, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SettingOutlined,
  AppstoreAddOutlined,
  FolderAddOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { selectSidebarCollapsed, toggleSidebar } from '../../store/slices/uiSlice';
import WorkspaceList from './WorkspaceList';
import ServiceList from './ServiceList';

const { Sider } = Layout;
const { Text } = Typography;

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleCreateWorkspace = () => {
    // TODO: Open create workspace modal
  };

  const handleCreateService = () => {
    // TODO: Open create service modal
  };

  const handleOpenSettings = () => {
    // TODO: Open settings modal
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme='light'
      width={280}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        borderRight: '1px solid #f0f0f0',
        background: '#fafafa',
      }}
    >
      <div
        className='sidebar-content'
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header with logo and toggle */}
        <div
          className='sidebar-header'
          style={{
            padding: collapsed ? '16px 8px' : '16px 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {!collapsed && (
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              GetWarped
            </Text>
          )}

          <Tooltip title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
            <Button
              type='text'
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={handleToggleSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
        </div>

        {/* Action Buttons */}
        <div
          className='sidebar-actions'
          style={{
            padding: collapsed ? '12px 8px' : '16px 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space
            direction={collapsed ? 'vertical' : 'horizontal'}
            size='small'
            style={{ width: '100%' }}
          >
            <Tooltip title='Create Workspace' placement={collapsed ? 'right' : 'bottom'}>
              <Button
                type='primary'
                icon={<FolderAddOutlined />}
                onClick={handleCreateWorkspace}
                size={collapsed ? 'small' : 'middle'}
                style={{
                  width: collapsed ? '100%' : 'auto',
                  minWidth: collapsed ? 'auto' : '120px',
                }}
              >
                {!collapsed && 'Workspace'}
              </Button>
            </Tooltip>

            <Tooltip title='Add Service' placement={collapsed ? 'right' : 'bottom'}>
              <Button
                icon={<AppstoreAddOutlined />}
                onClick={handleCreateService}
                size={collapsed ? 'small' : 'middle'}
                style={{
                  width: collapsed ? '100%' : 'auto',
                  minWidth: collapsed ? 'auto' : '100px',
                }}
              >
                {!collapsed && 'Service'}
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* Main Navigation Area */}
        <div
          className='sidebar-navigation'
          style={{
            flex: 1,
            overflow: 'auto',
            padding: collapsed ? '8px 4px' : '16px 0px',
          }}
        >
          {/* Workspaces Section */}
          <div style={{ padding: collapsed ? '8px 4px' : '0 24px', marginBottom: '16px' }}>
            {!collapsed && (
              <Text
                type='secondary'
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                Workspaces
              </Text>
            )}
            <WorkspaceList collapsed={collapsed} />
          </div>

          {/* Services Section */}
          <div style={{ padding: collapsed ? '8px 4px' : '0 24px', marginBottom: '16px' }}>
            {!collapsed && (
              <Text
                type='secondary'
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                  display: 'block',
                }}
              >
                Services
              </Text>
            )}
            <ServiceList collapsed={collapsed} />
          </div>
        </div>

        {/* Footer with Settings */}
        <div
          className='sidebar-footer'
          style={{
            padding: collapsed ? '12px 8px' : '16px 24px',
            borderTop: '1px solid #f0f0f0',
            background: '#ffffff',
          }}
        >
          <Tooltip title='Settings' placement={collapsed ? 'right' : 'top'}>
            <Button
              type='text'
              icon={<SettingOutlined />}
              onClick={handleOpenSettings}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              {!collapsed && 'Settings'}
            </Button>
          </Tooltip>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;
