/**
 * CreateServiceModal component
 *
 * Modal for creating new services with form validation and template selection
 * Features form validation using react-hook-form and comprehensive service configuration
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  Upload,
  ColorPicker,
  Divider,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { selectModalState } from '../../store/slices/uiSlice';
import {
  selectServiceTemplates,
  selectActiveService,
  createService,
} from '../../store/slices/servicesSlice';
import { selectActiveWorkspace } from '../../store/slices/workspacesSlice';
import {
  ServiceConfiguration,
  ServiceTheme,
  DEFAULT_SERVICE_THEME,
} from '../../../shared/types/ServiceConfiguration';
import { ServiceTemplate } from '../../../shared/types/ServiceTemplate';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CreateServiceModalProps {
  visible?: boolean;
  onCancel?: () => void;
  workspaceId?: string;
}

interface CreateServiceFormData {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  iconType: 'url' | 'base64' | 'builtin';
  customUserAgent?: string;
  notifications: boolean;
  blockAds: boolean;
  blockTrackers: boolean;
  theme: ServiceTheme;
}

/**
 * CreateServiceModal for adding new services to workspaces
 *
 * Features:
 * - Service template selection for quick setup
 * - Custom service configuration with validation
 * - Icon upload and URL support
 * - Theme customization
 * - Privacy and notification settings
 * - Real-time form validation
 */
const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  visible: propVisible,
  onCancel: propOnCancel,
  workspaceId: propWorkspaceId,
}) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  // State
  const modalState = useAppSelector(selectModalState);
  const serviceTemplates = useAppSelector(selectServiceTemplates);
  const activeWorkspace = useAppSelector(selectActiveWorkspace);

  const isVisible = propVisible ?? false;
  const targetWorkspaceId = propWorkspaceId ?? activeWorkspace?.id;

  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (propOnCancel) {
      propOnCancel();
    }

    // Reset form and state
    form.resetFields();
    setSelectedTemplate(null);
    setShowAdvanced(false);
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template: ServiceTemplate) => {
    setSelectedTemplate(template);

    form.setFieldsValue({
      name: template.name,
      url: template.url,
      description: template.description,
      iconType: 'builtin',
      icon: template.icon,
      notifications: true,
      blockAds: true,
      blockTrackers: true,
      customUserAgent: template.defaultUserAgent,
      theme: {
        ...DEFAULT_SERVICE_THEME,
        ...template.defaultTheme,
      },
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: CreateServiceFormData) => {
    if (!targetWorkspaceId) {
      return;
    }

    setIsCreating(true);

    try {
      const serviceData = {
        workspaceId: targetWorkspaceId,
        name: values.name,
        url: values.url,
        description: values.description,
        icon: values.icon,
        iconType: values.iconType,
        customUserAgent: values.customUserAgent,
        theme: values.theme,
        notifications: values.notifications,
        blockAds: values.blockAds,
        blockTrackers: values.blockTrackers,
      };

      await dispatch(createService(serviceData)).unwrap();

      handleClose();
    } catch (error) {
      // Error handling will be shown via form validation or notifications
      // TODO: Add proper error notification system
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Render service templates grid
   */
  const renderTemplates = () => {
    const templates = Object.values(serviceTemplates);

    if (templates.length === 0) {
      return (
        <Alert
          message='No Templates Available'
          description='Service templates will be loaded automatically.'
          type='info'
          showIcon
        />
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {templates.map(template => (
          <Col span={8} key={template.id}>
            <Card
              hoverable
              size='small'
              onClick={() => handleTemplateSelect(template)}
              style={{
                border: selectedTemplate?.id === template.id ? '2px solid #1890ff' : undefined,
              }}
            >
              <Space direction='vertical' size='small' style={{ width: '100%' }}>
                <Space>
                  {template.icon && (
                    <img
                      src={template.icon}
                      alt={template.name}
                      style={{ width: 24, height: 24 }}
                    />
                  )}
                  <Title level={5} style={{ margin: 0 }}>
                    {template.name}
                  </Title>
                </Space>
                <Text type='secondary' style={{ fontSize: '12px' }}>
                  {template.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  /**
   * Render advanced settings
   */
  const renderAdvancedSettings = () => {
    if (!showAdvanced) return null;

    return (
      <>
        <Divider>Advanced Settings</Divider>

        <Form.Item label='Custom User Agent' name='customUserAgent'>
          <Input placeholder='Leave empty to use default browser user agent' />
        </Form.Item>

        <Form.Item label='Theme Configuration'>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  label='Primary Color'
                  name={['theme', 'primaryColor']}
                  style={{ marginBottom: 0 }}
                >
                  <ColorPicker />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label='Background'
                  name={['theme', 'backgroundColor']}
                  style={{ marginBottom: 0 }}
                >
                  <ColorPicker />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label='Text Color'
                  name={['theme', 'textColor']}
                  style={{ marginBottom: 0 }}
                >
                  <ColorPicker />
                </Form.Item>
              </Col>
            </Row>
          </Space>
        </Form.Item>
      </>
    );
  };

  // Initialize form with default values
  useEffect(() => {
    if (isVisible && !selectedTemplate) {
      form.setFieldsValue({
        notifications: true,
        blockAds: true,
        blockTrackers: true,
        iconType: 'url',
        theme: DEFAULT_SERVICE_THEME,
      });
    }
  }, [isVisible, form, selectedTemplate]);

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          Create New Service
        </Space>
      }
      open={isVisible}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>
          <AppstoreOutlined style={{ marginRight: 8 }} />
          Choose Template
        </Title>
        {renderTemplates()}
      </div>

      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          notifications: true,
          blockAds: true,
          blockTrackers: true,
          iconType: 'url',
          theme: DEFAULT_SERVICE_THEME,
        }}
      >
        <Title level={4}>
          <SettingOutlined style={{ marginRight: 8 }} />
          Service Configuration
        </Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label='Service Name'
              name='name'
              rules={[
                { required: true, message: 'Please enter a service name' },
                { min: 1, max: 100, message: 'Name must be 1-100 characters' },
              ]}
            >
              <Input placeholder='e.g., Gmail, Slack, GitHub' />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label='Service URL'
              name='url'
              rules={[
                { required: true, message: 'Please enter a service URL' },
                { type: 'url', message: 'Please enter a valid URL' },
              ]}
            >
              <Input prefix={<GlobalOutlined />} placeholder='https://example.com' />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label='Description' name='description'>
          <TextArea rows={2} placeholder='Optional description for this service' maxLength={500} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label='Icon Type' name='iconType'>
              <Select>
                <Select.Option value='url'>URL</Select.Option>
                <Select.Option value='base64'>Upload Image</Select.Option>
                <Select.Option value='builtin'>Built-in</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label='Icon'
              name='icon'
              dependencies={['iconType']}
              rules={[
                ({ getFieldValue }) => ({
                  required: getFieldValue('iconType') !== 'builtin',
                  message: 'Please provide an icon',
                }),
              ]}
            >
              <Input placeholder='Icon URL or identifier' />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5}>Privacy & Notifications</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label='Enable Notifications' name='notifications' valuePropName='checked'>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Block Ads' name='blockAds' valuePropName='checked'>
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Block Trackers' name='blockTrackers' valuePropName='checked'>
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type='link'
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ padding: 0, marginBottom: 16 }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </Button>

        {renderAdvancedSettings()}

        <Divider />

        <Row justify='end'>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={isCreating}
              disabled={!targetWorkspaceId}
            >
              Create Service
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateServiceModal;
