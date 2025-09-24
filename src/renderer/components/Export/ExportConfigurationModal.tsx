/**
 * ExportConfigurationModal component
 *
 * Modal for exporting application configuration with backup scheduling options
 * Handles secure export with credential stripping and format selection
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Typography,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Card,
  DatePicker,
  TimePicker,
  Checkbox,
  Progress,
  Result,
} from 'antd';
import {
  ExportOutlined,
  FolderOpenOutlined,
  SecurityScanOutlined,
  ScheduleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { exportConfiguration, createBackup } from '../../store/slices/exportImportSlice';
import type { ConfigurationExport } from '../../../shared/types/ConfigurationExport';

// Define missing types locally
export type ExportFormat = 'json' | 'encrypted';

export interface ExportOptions {
  exportPath: string;
  includeThemes: boolean;
  includePreferences: boolean;
  compress: boolean;
  format?: ExportFormat;
  includeCredentials?: boolean;
  includeServices?: boolean;
  includeWorkspaces?: boolean;
  includeSessions?: boolean;
  encryptionPassword?: string;
}

export interface BackupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  retention: number;
}

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ExportConfigurationModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: (exportPath: string) => void;
}

/**
 * ExportConfigurationModal for secure configuration export
 *
 * Features:
 * - Multiple export formats (JSON, encrypted)
 * - Credential stripping options
 * - Backup scheduling
 * - Export progress tracking
 * - Security warnings and confirmations
 */
const ExportConfigurationModal: React.FC<ExportConfigurationModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const {
    exportProgress,
    exportError,
    exporting: isExporting,
  } = useAppSelector(state => state.exportImport);

  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState<'config' | 'progress' | 'complete'>('config');
  const [exportResult, setExportResult] = useState<string | null>(null);

  /**
   * Handle export start
   */
  const handleExport = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const exportOptions: ExportOptions = {
        exportPath: values.exportPath,
        includeThemes: values.includeThemes ?? true,
        includePreferences: values.includeServices ?? true,
        compress: values.format !== 'json',
        format: values.format,
        includeCredentials: values.includeCredentials,
        includeServices: values.includeServices,
        includeWorkspaces: values.includeWorkspaces,
        includeSessions: values.includeSessions,
        encryptionPassword: values.format === 'encrypted' ? values.password : undefined,
      };

      setCurrentStep('progress');

      const resultAction = await dispatch(exportConfiguration(exportOptions));

      if (exportConfiguration.fulfilled.match(resultAction)) {
        setExportResult(resultAction.payload.exportPath);
        setCurrentStep('complete');

        // Schedule backup if requested
        if (values.scheduleBackup && values.backupSchedule) {
          await dispatch(createBackup({}));
        }
      } else {
        setCurrentStep('config');
      }
    } catch (error) {
      setCurrentStep('config');
    }
  }, [dispatch, form]);

  /**
   * Handle modal close
   */
  const handleCancel = useCallback(() => {
    if (currentStep === 'complete' && exportResult && onSuccess) {
      onSuccess(exportResult);
    }

    setCurrentStep('config');
    setExportResult(null);
    form.resetFields();
    onCancel();
  }, [currentStep, exportResult, onSuccess, form, onCancel]);

  /**
   * Handle file path selection
   */
  const handleSelectPath = useCallback(async () => {
    // TODO: Implement file dialog via IPC when available
    // For now, user must manually enter path
    form.setFieldsValue({
      exportPath: 'getwarped-config-export.json',
    });
  }, [form]);

  /**
   * Render configuration step
   */
  const renderConfigurationStep = () => (
    <Form
      form={form}
      layout='vertical'
      initialValues={{
        format: 'json',
        includeCredentials: false,
        includeServices: true,
        includeWorkspaces: true,
        includeThemes: true,
        includeSessions: false,
        scheduleBackup: false,
      }}
    >
      {/* Security Warning */}
      <Alert
        message='Security Notice'
        description='Exported configurations may contain sensitive information. Choose your export options carefully.'
        type='warning'
        icon={<SecurityScanOutlined />}
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={24}>
        <Col span={12}>
          <Card title='Export Options' size='small'>
            <Form.Item
              name='format'
              label='Export Format'
              tooltip='Choose between plain JSON or encrypted format'
            >
              <Select>
                <Option value='json'>JSON (Plain Text)</Option>
                <Option value='encrypted'>Encrypted File</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name='exportPath'
              label='Export Location'
              rules={[{ required: true, message: 'Please select export location' }]}
            >
              <Input
                placeholder='Select export location...'
                readOnly
                suffix={
                  <Button type='text' icon={<FolderOpenOutlined />} onClick={handleSelectPath} />
                }
              />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.format !== currentValues.format
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('format') === 'encrypted' && (
                  <Form.Item
                    name='password'
                    label='Encryption Password'
                    rules={[
                      { required: true, message: 'Password is required for encryption' },
                      { min: 8, message: 'Password must be at least 8 characters' },
                    ]}
                  >
                    <Input.Password placeholder='Enter encryption password' />
                  </Form.Item>
                )
              }
            </Form.Item>
          </Card>
        </Col>

        <Col span={12}>
          <Card title='Content Selection' size='small'>
            <Space direction='vertical' style={{ width: '100%' }}>
              <Form.Item name='includeServices' valuePropName='checked'>
                <Checkbox>Services Configuration</Checkbox>
              </Form.Item>

              <Form.Item name='includeWorkspaces' valuePropName='checked'>
                <Checkbox>Workspaces</Checkbox>
              </Form.Item>

              <Form.Item name='includeThemes' valuePropName='checked'>
                <Checkbox>Custom Themes</Checkbox>
              </Form.Item>

              <Form.Item name='includeSessions' valuePropName='checked'>
                <Checkbox>
                  Session Data
                  <Text type='secondary' style={{ fontSize: 12, display: 'block' }}>
                    (Not recommended for security)
                  </Text>
                </Checkbox>
              </Form.Item>

              <Divider />

              <Form.Item name='includeCredentials' valuePropName='checked'>
                <Checkbox>
                  <Text type='danger'>Include Stored Credentials</Text>
                  <Text type='secondary' style={{ fontSize: 12, display: 'block' }}>
                    ⚠️ High security risk!
                  </Text>
                </Checkbox>
              </Form.Item>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Backup Scheduling */}
      <Card
        title={
          <Space>
            <ScheduleOutlined />
            Backup Scheduling
          </Space>
        }
        size='small'
        style={{ marginTop: 16 }}
      >
        <Form.Item name='scheduleBackup' valuePropName='checked'>
          <Switch /> Enable automatic backups
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.scheduleBackup !== currentValues.scheduleBackup
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('scheduleBackup') && (
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name={['backupSchedule', 'frequency']} label='Frequency'>
                    <Select defaultValue='weekly'>
                      <Option value='daily'>Daily</Option>
                      <Option value='weekly'>Weekly</Option>
                      <Option value='monthly'>Monthly</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name={['backupSchedule', 'time']} label='Time'>
                    <TimePicker use12Hours format='h:mm a' />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name={['backupSchedule', 'retention']} label='Keep Backups'>
                    <Select defaultValue={7}>
                      <Option value={3}>3 backups</Option>
                      <Option value={7}>7 backups</Option>
                      <Option value={30}>30 backups</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )
          }
        </Form.Item>
      </Card>

      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.includeCredentials !== currentValues.includeCredentials ||
          prevValues.includeSessions !== currentValues.includeSessions
        }
      >
        {({ getFieldValue }) => {
          const includesCredentials = getFieldValue('includeCredentials');
          const includesSessions = getFieldValue('includeSessions');

          if (includesCredentials || includesSessions) {
            return (
              <Alert
                message='High Security Risk'
                description={
                  <div>
                    <p>You have selected to include sensitive data in your export:</p>
                    <ul>
                      {includesCredentials && <li>Stored credentials and authentication tokens</li>}
                      {includesSessions && <li>Active session data and cookies</li>}
                    </ul>
                    <p>
                      This data could be used to access your accounts if the export file is
                      compromised.
                    </p>
                  </div>
                }
                type='error'
                icon={<WarningOutlined />}
                showIcon
                style={{ marginTop: 16 }}
              />
            );
          }

          return null;
        }}
      </Form.Item>
    </Form>
  );

  /**
   * Render progress step
   */
  const renderProgressStep = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <Title level={3}>Exporting Configuration</Title>

      <Progress
        type='circle'
        percent={exportProgress}
        status={exportError ? 'exception' : 'active'}
        style={{ marginBottom: 24 }}
      />

      <Paragraph type='secondary'>
        Please wait while your configuration is being exported...
      </Paragraph>

      {exportError && (
        <Alert
          message='Export Failed'
          description={exportError}
          type='error'
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );

  /**
   * Render completion step
   */
  const renderCompletionStep = () => (
    <Result
      status='success'
      title='Export Completed Successfully'
      subTitle={`Configuration exported to: ${exportResult}`}
      icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      extra={
        <Space>
          <Button type='primary' onClick={handleCancel}>
            Close
          </Button>
          <Button
            onClick={() => {
              // TODO: Show in file explorer when IPC is available
              // For now, copy path to clipboard
              navigator.clipboard?.writeText(exportResult!);
            }}
          >
            Copy Path
          </Button>
        </Space>
      }
    />
  );

  /**
   * Get modal content
   */
  const getModalContent = () => {
    switch (currentStep) {
      case 'config':
        return renderConfigurationStep();
      case 'progress':
        return renderProgressStep();
      case 'complete':
        return renderCompletionStep();
      default:
        return renderConfigurationStep();
    }
  };

  /**
   * Get modal props
   */
  const getModalProps = () => {
    const baseProps = {
      open,
      onCancel: handleCancel,
      width: 800,
      destroyOnClose: true,
    };

    switch (currentStep) {
      case 'config':
        return {
          ...baseProps,
          title: (
            <Space>
              <ExportOutlined />
              Export Configuration
            </Space>
          ),
          footer: [
            <Button key='cancel' onClick={handleCancel}>
              Cancel
            </Button>,
            <Button
              key='export'
              type='primary'
              loading={isExporting}
              onClick={handleExport}
              icon={<ExportOutlined />}
            >
              Export
            </Button>,
          ],
        };

      case 'progress':
        return {
          ...baseProps,
          title: 'Exporting Configuration',
          footer: null,
          closable: false,
          maskClosable: false,
        };

      case 'complete':
        return {
          ...baseProps,
          title: 'Export Complete',
          footer: null,
        };

      default:
        return baseProps;
    }
  };

  return <Modal {...getModalProps()}>{getModalContent()}</Modal>;
};

export default ExportConfigurationModal;
