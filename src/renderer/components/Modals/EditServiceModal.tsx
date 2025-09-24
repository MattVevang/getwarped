/**
 * EditServiceModal component
 *
 * Modal for editing existing services with comprehensive form validation
 * and advanced configuration options
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
  Row,
  Col,
  Typography,
  ColorPicker,
  Divider,
  Alert,
  Popconfirm,
  Tabs,
} from 'antd';
import {
  EditOutlined,
  GlobalOutlined,
  SettingOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { updateService, deleteService } from '../../store/slices/servicesSlice';
import {
  ServiceConfiguration,
  ServiceTheme,
  DEFAULT_SERVICE_THEME,
} from '../../../shared/types/ServiceConfiguration';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EditServiceModalProps {
  visible?: boolean;
  serviceId?: string;
  onCancel?: () => void;
}

interface EditServiceFormData {
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
  isActive: boolean;
}

/**
 * EditServiceModal for modifying existing services
 *
 * Features:
 * - Complete service configuration editing
 * - Advanced privacy and security settings
 * - Session management and clearing
 * - Service deletion with confirmation
 * - Theme customization
 * - Real-time validation
 */
const EditServiceModal: React.FC<EditServiceModalProps> = ({
  visible = false,
  serviceId,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  // Find the service to edit
  const services = useAppSelector(state => state.services.items);
  const service = serviceId ? services[serviceId] : null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingSession, setIsClearingSession] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }

    // Reset form and state
    form.resetFields();
    setActiveTab('general');
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: EditServiceFormData) => {
    if (!service) return;

    setIsUpdating(true);

    try {
      const updates: Partial<ServiceConfiguration> = {
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
        isActive: values.isActive,
        updatedAt: new Date(),
      };

      await dispatch(
        updateService({
          serviceId: service.id,
          updates,
        })
      ).unwrap();

      handleClose();
    } catch (error) {
      // Error handling will be shown via notifications
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handle service deletion
   */
  const handleDelete = async () => {
    if (!service) return;

    setIsDeleting(true);

    try {
      await dispatch(
        deleteService({
          serviceId: service.id,
        })
      ).unwrap();

      handleClose();
    } catch (error) {
      // Error handling will be shown via notifications
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handle session clearing
   */
  const handleClearSession = async () => {
    if (!service) return;

    setIsClearingSession(true);

    try {
      // TODO: Implement session clearing via IPC
      // await window.electronAPI.invoke('session:clear', { serviceId: service.id });
    } catch (error) {
      // Error handling will be shown via notifications
    } finally {
      setIsClearingSession(false);
    }
  };

  /**
   * Initialize form with service data
   */
  useEffect(() => {
    if (visible && service) {
      form.setFieldsValue({
        name: service.name,
        url: service.url,
        description: service.description || '',
        icon: service.icon || '',
        iconType: service.iconType,
        customUserAgent: service.customUserAgent || '',
        notifications: service.notifications ?? true,
        blockAds: service.blockAds ?? true,
        blockTrackers: service.blockTrackers ?? true,
        isActive: service.isActive,
        theme: {
          ...DEFAULT_SERVICE_THEME,
          ...service.theme,
        },
      });
    }
  }, [visible, service, form]);

  /**
   * Render general settings tab
   */
  const renderGeneralTab = () => (
    <div>
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
          <Form.Item label='Icon' name='icon' dependencies={['iconType']}>
            <Input placeholder='Icon URL or identifier' />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label='Service Status' name='isActive' valuePropName='checked'>
        <Switch checkedChildren='Active' unCheckedChildren='Inactive' />
      </Form.Item>
    </div>
  );

  /**
   * Render privacy settings tab
   */
  const renderPrivacyTab = () => (
    <div>
      <Title level={5}>Notification Settings</Title>
      <Form.Item
        label='Enable Notifications'
        name='notifications'
        valuePropName='checked'
        tooltip='Allow this service to show desktop notifications'
      >
        <Switch />
      </Form.Item>

      <Divider />

      <Title level={5}>Privacy Protection</Title>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label='Block Advertisements'
            name='blockAds'
            valuePropName='checked'
            tooltip='Block ads and promotional content in this service'
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label='Block Trackers'
            name='blockTrackers'
            valuePropName='checked'
            tooltip='Block tracking scripts and analytics in this service'
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Session Management</Title>
      <Alert
        message='Session Data'
        description='Clear stored login sessions, cookies, and cached data for this service. You will need to log in again.'
        type='info'
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Popconfirm
        title='Clear Session Data?'
        description='This will log you out and clear all cached data for this service.'
        onConfirm={handleClearSession}
        okText='Clear'
        cancelText='Cancel'
        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
      >
        <Button danger icon={<LockOutlined />} loading={isClearingSession}>
          Clear Session Data
        </Button>
      </Popconfirm>
    </div>
  );

  /**
   * Render advanced settings tab
   */
  const renderAdvancedTab = () => (
    <div>
      <Title level={5}>Browser Settings</Title>
      <Form.Item
        label='Custom User Agent'
        name='customUserAgent'
        tooltip='Override the default browser user agent for this service'
      >
        <Input placeholder='Leave empty to use default browser user agent' />
      </Form.Item>

      <Divider />

      <Title level={5}>Theme Configuration</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label='Primary Color' name={['theme', 'primaryColor']}>
            <ColorPicker />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label='Background Color' name={['theme', 'backgroundColor']}>
            <ColorPicker />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label='Text Color' name={['theme', 'textColor']}>
            <ColorPicker />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Danger Zone</Title>
      <Alert
        message='Delete Service'
        description='Permanently remove this service from your workspace. This action cannot be undone.'
        type='error'
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Popconfirm
        title='Delete this service?'
        description='This will permanently remove the service and all its data. This action cannot be undone.'
        onConfirm={handleDelete}
        okText='Delete'
        cancelText='Cancel'
        okButtonProps={{ danger: true }}
        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
      >
        <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
          Delete Service
        </Button>
      </Popconfirm>
    </div>
  );

  if (!service) {
    return (
      <Modal title='Edit Service' open={visible} onCancel={handleClose} footer={null}>
        <Alert
          message='Service Not Found'
          description='The selected service could not be found.'
          type='error'
          showIcon
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          Edit Service: {service.name}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'general',
              label: 'General',
              children: renderGeneralTab(),
            },
            {
              key: 'privacy',
              label: 'Privacy & Security',
              children: renderPrivacyTab(),
            },
            {
              key: 'advanced',
              label: 'Advanced',
              children: renderAdvancedTab(),
            },
          ]}
        />

        <Divider />

        <Row justify='end'>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={isUpdating}
              icon={<SettingOutlined />}
            >
              Update Service
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditServiceModal;
