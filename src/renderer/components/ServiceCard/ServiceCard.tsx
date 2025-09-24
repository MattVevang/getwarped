/**
 * ServiceCard component
 *
 * Displays individual service information in card format with hover states,
 * drag-and-drop support, and action buttons for service management
 */

import React, { useState, useCallback } from 'react';
import { Card, Avatar, Button, Space, Typography, Tag, Tooltip, Dropdown, Badge } from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  NotificationOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { ServiceConfiguration } from '../../../shared/types/ServiceConfiguration';
import { ServiceHealthStatus } from '../../../shared/types/ApplicationState';

const { Title, Text } = Typography;
const { Meta } = Card;

interface ServiceCardProps {
  service: ServiceConfiguration;
  isActive?: boolean;
  isDragging?: boolean;
  healthStatus?: ServiceHealthStatus;
  onClick?: (service: ServiceConfiguration) => void;
  onEdit?: (service: ServiceConfiguration) => void;
  onDelete?: (service: ServiceConfiguration) => void;
  onToggleActive?: (service: ServiceConfiguration) => void;
  onRefresh?: (service: ServiceConfiguration) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * ServiceCard component for displaying service information
 *
 * Features:
 * - Service icon, name, and URL display
 * - Health status indicator
 * - Hover effects and active state
 * - Action menu with edit, delete, toggle options
 * - Notification status display
 * - Drag-and-drop support (styling)
 * - Responsive design
 */
const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isActive = false,
  isDragging = false,
  healthStatus,
  onClick,
  onEdit,
  onDelete,
  onToggleActive,
  onRefresh,
  className,
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  /**
   * Handle card click
   */
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(service);
    }
  }, [onClick, service]);

  /**
   * Get health status indicator
   */
  const getHealthIndicator = () => {
    if (!healthStatus) {
      return null;
    }

    const statusConfig = {
      healthy: { color: 'green', text: 'Online' },
      degraded: { color: 'orange', text: 'Degraded' },
      unhealthy: { color: 'red', text: 'Offline' },
      unknown: { color: 'blue', text: 'Unknown' },
    };

    const config = statusConfig[healthStatus.status] || statusConfig.unknown;

    return <Badge color={config.color} text={config.text} style={{ fontSize: '11px' }} />;
  };

  /**
   * Get service icon
   */
  const getServiceIcon = () => {
    if (service.icon) {
      if (service.iconType === 'url' || service.iconType === 'base64') {
        return (
          <Avatar
            src={service.icon}
            size={32}
            style={{ backgroundColor: service.theme?.primaryColor }}
          />
        );
      } else {
        // Built-in icon - use first letter as fallback
        return (
          <Avatar
            size={32}
            style={{
              backgroundColor: service.theme?.primaryColor || '#1890ff',
              color: service.theme?.textColor || '#ffffff',
            }}
          >
            {service.name.charAt(0).toUpperCase()}
          </Avatar>
        );
      }
    }

    return (
      <Avatar
        icon={<GlobalOutlined />}
        size={32}
        style={{
          backgroundColor: service.theme?.primaryColor || '#1890ff',
        }}
      />
    );
  };

  /**
   * Get action menu items
   */
  const getActionMenuItems = () => [
    {
      key: 'edit',
      label: 'Edit Service',
      icon: <EditOutlined />,
    },
    {
      key: 'toggle',
      label: service.isActive ? 'Disable' : 'Enable',
      icon: service.isActive ? <EyeInvisibleOutlined /> : <EyeOutlined />,
    },
    {
      key: 'refresh',
      label: 'Refresh',
      icon: <ReloadOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: 'Delete Service',
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  /**
   * Handle menu item clicks
   */
  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'edit':
        if (onEdit) {
          onEdit(service);
        }
        break;
      case 'toggle':
        if (onToggleActive) {
          onToggleActive(service);
        }
        break;
      case 'refresh':
        if (onRefresh) {
          onRefresh(service);
        }
        break;
      case 'delete':
        if (onDelete) {
          onDelete(service);
        }
        break;
    }
  };

  /**
   * Get card style based on state
   */
  const getCardStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ...style,
    };

    if (isDragging) {
      baseStyle.opacity = 0.5;
      baseStyle.transform = 'rotate(5deg)';
    } else if (isActive) {
      baseStyle.borderColor = service.theme?.primaryColor || '#1890ff';
      baseStyle.boxShadow = `0 0 0 2px ${service.theme?.primaryColor || '#1890ff'}20`;
    } else if (isHovered) {
      baseStyle.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      baseStyle.transform = 'translateY(-2px)';
    }

    if (!service.isActive) {
      baseStyle.opacity = 0.6;
      baseStyle.filter = 'grayscale(20%)';
    }

    return baseStyle;
  };

  /**
   * Format URL for display
   */
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url.length > 30 ? `${url.substring(0, 30)}...` : url;
    }
  };

  return (
    <Card
      {...(className && { className })}
      style={getCardStyle()}
      hoverable
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      actions={[
        <Dropdown
          key='actions'
          menu={{ items: getActionMenuItems(), onClick: handleMenuClick }}
          trigger={['click']}
          placement='bottomRight'
        >
          <Button type='text' icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
        </Dropdown>,
      ]}
    >
      <Meta
        avatar={getServiceIcon()}
        title={
          <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title
                level={5}
                style={{
                  margin: 0,
                  color: service.theme?.textColor,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '150px',
                }}
              >
                {service.name}
              </Title>
              <Space size={4}>
                {service.notifications && (
                  <Tooltip title='Notifications enabled'>
                    <NotificationOutlined
                      style={{
                        fontSize: '12px',
                        color: service.theme?.primaryColor || '#52c41a',
                      }}
                    />
                  </Tooltip>
                )}
                {!service.isActive && <Tag color='default'>Inactive</Tag>}
              </Space>
            </div>
            {getHealthIndicator()}
          </Space>
        }
        description={
          <Space direction='vertical' size={2} style={{ width: '100%' }}>
            <Text
              type='secondary'
              style={{
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              <GlobalOutlined style={{ marginRight: 4 }} />
              {formatUrl(service.url)}
            </Text>

            {service.description && (
              <Text
                type='secondary'
                style={{
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  opacity: 0.8,
                }}
              >
                {service.description}
              </Text>
            )}

            <Space size={4} style={{ marginTop: 4 }}>
              {service.blockAds && (
                <Tag color='blue' style={{ fontSize: '10px' }}>
                  Ad Block
                </Tag>
              )}
              {service.blockTrackers && (
                <Tag color='green' style={{ fontSize: '10px' }}>
                  Tracker Block
                </Tag>
              )}
              {service.customUserAgent && (
                <Tag color='purple' style={{ fontSize: '10px' }}>
                  Custom UA
                </Tag>
              )}
            </Space>
          </Space>
        }
      />
    </Card>
  );
};

export default ServiceCard;
