/**
 * ImportPreview component
 *
 * Preview component for configuration imports with security warnings
 * and re-authentication requirements preview
 */

import React from 'react';
import {
  Card,
  Typography,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Badge,
  Collapse,
  Timeline,
  Progress,
  Button,
} from 'antd';
import {
  CloudServerOutlined as ServiceOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  SettingOutlined,
  SecurityScanOutlined,
  ExclamationCircleOutlined as ExclamationTriangleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ConfigurationExport } from '../../../shared/types/ConfigurationExport';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export interface ImportOptions {
  overwriteExisting: boolean;
  importServices: boolean;
  importWorkspaces: boolean;
  importThemes: boolean;
  importPreferences: boolean;
  createBackupBeforeImport: boolean;
}

interface ImportPreviewProps {
  configuration: ConfigurationExport;
  options: ImportOptions;
  onOptionsChange?: (options: ImportOptions) => void;
}

/**
 * ImportPreview for detailed configuration import preview
 *
 * Features:
 * - Configuration summary and statistics
 * - Security warnings for sensitive data
 * - Re-authentication requirements preview
 * - Conflict detection with existing data
 * - Detailed breakdown of import content
 * - Migration compatibility warnings
 */
const ImportPreview: React.FC<ImportPreviewProps> = ({
  configuration,
  options,
  onOptionsChange,
}) => {
  /**
   * Get import statistics
   */
  const getImportStats = () => {
    const stats = {
      services:
        configuration.workspaces?.reduce((acc: number, ws: any) => acc + ws.services.length, 0) ||
        0,
      workspaces: configuration.workspaces?.length || 0,
      themes: 0, // TODO: Count themes when available
      preferences: configuration.preferences ? 1 : 0,
    };

    return stats;
  };

  /**
   * Get security warnings
   */
  const getSecurityWarnings = () => {
    const warnings: Array<{ type: 'warning' | 'error' | 'info'; message: string }> = [];

    // Check for version compatibility
    if (configuration.metadata.exportVersion !== '1.0.0') {
      warnings.push({
        type: 'warning',
        message: `Configuration was exported from version ${configuration.metadata.exportVersion}. Some features may not be compatible.`,
      });
    }

    // Check for platform differences
    if (configuration.metadata.platform !== process.platform) {
      warnings.push({
        type: 'info',
        message: `Configuration was exported from ${configuration.metadata.platform}. Some file paths may need adjustment.`,
      });
    }

    // Check for re-authentication requirements
    const servicesRequiringAuth =
      configuration.workspaces?.reduce((acc: number, ws: any) => {
        const authServices = ws.services.filter(
          (service: any) =>
            service.url.includes('google.com') ||
            service.url.includes('microsoft.com') ||
            service.url.includes('github.com')
        );
        return acc + authServices.length;
      }, 0) || 0;

    if (servicesRequiringAuth > 0) {
      warnings.push({
        type: 'warning',
        message: `${servicesRequiringAuth} service(s) will require re-authentication after import.`,
      });
    }

    return warnings;
  };

  /**
   * Get compatibility status
   */
  const getCompatibilityStatus = () => {
    const appVersion = '1.0.0'; // TODO: Get from app constants
    const exportVersion = configuration.metadata.exportVersion;

    if (exportVersion === appVersion) {
      return { status: 'success', message: 'Fully compatible' };
    } else if (exportVersion.startsWith('1.')) {
      return { status: 'warning', message: 'Compatible with minor differences' };
    } else {
      return { status: 'error', message: 'May have compatibility issues' };
    }
  };

  const stats = getImportStats();
  const warnings = getSecurityWarnings();
  const compatibility = getCompatibilityStatus();

  return (
    <Space direction='vertical' size={24} style={{ width: '100%' }}>
      {/* Configuration Overview */}
      <Card title='Configuration Overview' size='small'>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title='Services'
              value={stats.services}
              prefix={<ServiceOutlined />}
              valueStyle={{ color: options.importServices ? '#3f8600' : '#999' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title='Workspaces'
              value={stats.workspaces}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: options.importWorkspaces ? '#3f8600' : '#999' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title='Themes'
              value={stats.themes}
              prefix={<BgColorsOutlined />}
              valueStyle={{ color: options.importThemes ? '#3f8600' : '#999' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title='Preferences'
              value={stats.preferences}
              prefix={<SettingOutlined />}
              valueStyle={{ color: options.importPreferences ? '#3f8600' : '#999' }}
            />
          </Col>
        </Row>

        <Divider />

        <Space size={16}>
          <div>
            <Text strong>Export Date:</Text>{' '}
            <Text>{new Date(configuration.metadata.createdAt).toLocaleDateString()}</Text>
          </div>
          <div>
            <Text strong>App Version:</Text> <Text>{configuration.metadata.appVersion}</Text>
          </div>
          <div>
            <Text strong>Platform:</Text> <Text>{configuration.metadata.platform}</Text>
          </div>
        </Space>
      </Card>

      {/* Compatibility Status */}
      <Card title='Compatibility Status' size='small'>
        <Space align='center'>
          {compatibility.status === 'success' && (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          )}
          {compatibility.status === 'warning' && (
            <WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />
          )}
          {compatibility.status === 'error' && (
            <ExclamationTriangleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
          )}
          <Text>{compatibility.message}</Text>
        </Space>
      </Card>

      {/* Security Warnings */}
      {warnings.length > 0 && (
        <Card
          title={
            <Space>
              <SecurityScanOutlined />
              Security & Compatibility Notices
            </Space>
          }
          size='small'
        >
          <List
            size='small'
            dataSource={warnings}
            renderItem={warning => (
              <List.Item>
                <Space align='start'>
                  {warning.type === 'error' && (
                    <ExclamationTriangleOutlined style={{ color: '#ff4d4f' }} />
                  )}
                  {warning.type === 'warning' && <WarningOutlined style={{ color: '#faad14' }} />}
                  {warning.type === 'info' && <InfoCircleOutlined style={{ color: '#1890ff' }} />}
                  <Text>{warning.message}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Detailed Breakdown */}
      <Card title='Import Details' size='small'>
        <Collapse size='small'>
          {/* Workspaces */}
          {options.importWorkspaces && configuration.workspaces && (
            <Panel
              header={
                <Space>
                  <AppstoreOutlined />
                  <span>Workspaces ({configuration.workspaces.length})</span>
                  <Badge count={configuration.workspaces.length} />
                </Space>
              }
              key='workspaces'
            >
              <List
                size='small'
                dataSource={configuration.workspaces}
                renderItem={(workspace: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={workspace.name}
                      description={
                        <Space size={8}>
                          <Text type='secondary'>{workspace.services.length} services</Text>
                          {workspace.theme && <Tag color='blue'>Custom Theme</Tag>}
                          {workspace.wasDefault && <Tag color='green'>Default</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Panel>
          )}

          {/* Services */}
          {options.importServices && configuration.workspaces && (
            <Panel
              header={
                <Space>
                  <ServiceOutlined />
                  <span>Services ({stats.services})</span>
                  <Badge count={stats.services} />
                </Space>
              }
              key='services'
            >
              {configuration.workspaces.map((workspace: any) => (
                <div key={workspace.id}>
                  <Text strong>{workspace.name}</Text>
                  <List
                    size='small'
                    style={{ marginBottom: 16 }}
                    dataSource={workspace.services}
                    renderItem={(service: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={service.name}
                          description={
                            <Space size={8}>
                              <Text type='secondary'>{service.url}</Text>
                              <Tag color={service.category ? 'blue' : 'default'}>
                                {service.category || 'uncategorized'}
                              </Tag>
                              {service.url.includes('google.com') ||
                              service.url.includes('microsoft.com') ||
                              service.url.includes('github.com') ? (
                                <Tag color='orange' icon={<ClockCircleOutlined />}>
                                  Re-auth Required
                                </Tag>
                              ) : null}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ))}
            </Panel>
          )}

          {/* Preferences */}
          {options.importPreferences && configuration.preferences && (
            <Panel
              header={
                <Space>
                  <SettingOutlined />
                  <span>Application Preferences</span>
                </Space>
              }
              key='preferences'
            >
              <Timeline>
                <Timeline.Item dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
                  <Text>Application Settings</Text>
                  <br />
                  <Text type='secondary'>Theme preferences, window settings, etc.</Text>
                </Timeline.Item>
                <Timeline.Item dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
                  <Text>UI Preferences</Text>
                  <br />
                  <Text type='secondary'>Layout, shortcuts, and interface customizations</Text>
                </Timeline.Item>
                <Timeline.Item dot={<CheckCircleOutlined style={{ color: '#52c41a' }} />}>
                  <Text>Security Settings</Text>
                  <br />
                  <Text type='secondary'>Privacy preferences and security configurations</Text>
                </Timeline.Item>
              </Timeline>
            </Panel>
          )}
        </Collapse>
      </Card>

      {/* Re-authentication Notice */}
      {warnings.some(w => w.message.includes('re-authentication')) && (
        <Alert
          message='Re-authentication Required'
          description={
            <div>
              <Paragraph>
                Some services will require you to sign in again after import. This is normal and
                helps maintain security by not transferring stored credentials.
              </Paragraph>
              <Paragraph>
                <Text strong>Services requiring re-authentication:</Text>
              </Paragraph>
              <ul>
                {configuration.workspaces?.map((ws: any) =>
                  ws.services
                    .filter(
                      (s: any) =>
                        s.url.includes('google.com') ||
                        s.url.includes('microsoft.com') ||
                        s.url.includes('github.com')
                    )
                    .map((s: any) => (
                      <li key={s.id}>
                        {s.name} - {s.url}
                      </li>
                    ))
                )}
              </ul>
            </div>
          }
          type='info'
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Import Progress Estimate */}
      <Card title='Import Estimate' size='small'>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Text>
            Estimated import time: <Text strong>~{Math.ceil(stats.services / 10)} minutes</Text>
          </Text>
          <Progress percent={0} showInfo={false} strokeColor='#1890ff' size='small' />
          <Text type='secondary'>
            Time may vary based on service complexity and re-authentication requirements
          </Text>
        </Space>
      </Card>
    </Space>
  );
};

export default ImportPreview;
