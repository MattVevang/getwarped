/**
 * CreateWorkspaceModal component
 *
 * Modal for creating new workspaces with theme configuration
 * and comprehensive workspace settings
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Row,
  Col,
  Typography,
  ColorPicker,
  Divider,
  Switch,
  Select,
  Card,
} from 'antd';
import { PlusOutlined, AppstoreOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { createWorkspace } from '../../store/slices/workspacesSlice';
import { Workspace, WorkspaceTheme } from '../../../shared/types/Workspace';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CreateWorkspaceModalProps {
  visible?: boolean;
  onCancel?: () => void;
}

interface CreateWorkspaceFormData {
  name: string;
  description?: string;
  isDefault: boolean;
  theme: WorkspaceTheme;
}

// Default workspace theme
const DEFAULT_WORKSPACE_THEME: WorkspaceTheme = {
  primaryColor: '#1890ff',
  secondaryColor: '#40a9ff',
  backgroundColor: '#ffffff',
  sidebarColor: '#f0f2f5',
  textColor: '#000000d9',
  accentColor: '#52c41a',
};

// Predefined theme presets
const THEME_PRESETS = [
  {
    name: 'Default Blue',
    theme: DEFAULT_WORKSPACE_THEME,
  },
  {
    name: 'Dark Mode',
    theme: {
      primaryColor: '#177ddc',
      secondaryColor: '#40a9ff',
      backgroundColor: '#141414',
      sidebarColor: '#1f1f1f',
      textColor: '#ffffffa6',
      accentColor: '#52c41a',
    },
  },
  {
    name: 'Green Nature',
    theme: {
      primaryColor: '#52c41a',
      secondaryColor: '#73d13d',
      backgroundColor: '#f6ffed',
      sidebarColor: '#f0f9e8',
      textColor: '#000000d9',
      accentColor: '#1890ff',
    },
  },
  {
    name: 'Purple Creative',
    theme: {
      primaryColor: '#722ed1',
      secondaryColor: '#9254de',
      backgroundColor: '#f9f0ff',
      sidebarColor: '#f0e6ff',
      textColor: '#000000d9',
      accentColor: '#fa541c',
    },
  },
];

/**
 * CreateWorkspaceModal for creating new workspaces
 *
 * Features:
 * - Workspace name and description configuration
 * - Theme customization with presets
 * - Default workspace setting
 * - Color picker for custom themes
 * - Form validation and error handling
 */
const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  visible = false,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [showCustomTheme, setShowCustomTheme] = useState(false);

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }

    // Reset form and state
    form.resetFields();
    setSelectedPreset(0);
    setShowCustomTheme(false);
  };

  /**
   * Handle theme preset selection
   */
  const handlePresetSelect = (presetIndex: number) => {
    setSelectedPreset(presetIndex);
    const preset = THEME_PRESETS[presetIndex];

    form.setFieldsValue({
      theme: preset.theme,
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: CreateWorkspaceFormData) => {
    setIsCreating(true);

    try {
      const workspaceData = {
        name: values.name,
        description: values.description || '',
        theme: values.theme,
        isDefault: values.isDefault,
      };

      await dispatch(createWorkspace(workspaceData)).unwrap();

      handleClose();
    } catch (error) {
      // Error handling will be shown via notifications
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Render theme presets
   */
  const renderThemePresets = () => (
    <div>
      <Title level={5}>Theme Presets</Title>
      <Row gutter={[16, 16]}>
        {THEME_PRESETS.map((preset, index) => (
          <Col span={6} key={index}>
            <Card
              size='small'
              hoverable
              onClick={() => handlePresetSelect(index)}
              style={{
                border: selectedPreset === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
              }}
              bodyStyle={{ padding: '8px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: '40px',
                    background: `linear-gradient(45deg, ${preset.theme.primaryColor}, ${preset.theme.secondaryColor})`,
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                />
                <Text style={{ fontSize: '12px' }}>{preset.name}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  /**
   * Render custom theme configuration
   */
  const renderCustomTheme = () => {
    if (!showCustomTheme) return null;

    return (
      <div>
        <Divider />
        <Title level={5}>Custom Theme Configuration</Title>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item label='Primary Color' name={['theme', 'primaryColor']}>
              <ColorPicker />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Secondary Color' name={['theme', 'secondaryColor']}>
              <ColorPicker />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Accent Color' name={['theme', 'accentColor']}>
              <ColorPicker />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item label='Background Color' name={['theme', 'backgroundColor']}>
              <ColorPicker />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Sidebar Color' name={['theme', 'sidebarColor']}>
              <ColorPicker />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label='Text Color' name={['theme', 'textColor']}>
              <ColorPicker />
            </Form.Item>
          </Col>
        </Row>
      </div>
    );
  };

  // Initialize form with default values
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        isDefault: false,
        theme: DEFAULT_WORKSPACE_THEME,
      });
    }
  }, [visible, form]);

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          Create New Workspace
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout='vertical'
        onFinish={handleSubmit}
        initialValues={{
          isDefault: false,
          theme: DEFAULT_WORKSPACE_THEME,
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Workspace Details
          </Title>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label='Workspace Name'
                name='name'
                rules={[
                  { required: true, message: 'Please enter a workspace name' },
                  { min: 1, max: 100, message: 'Name must be 1-100 characters' },
                ]}
              >
                <Input placeholder='e.g., Work, Personal, Project Alpha' />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label='Set as Default'
                name='isDefault'
                valuePropName='checked'
                tooltip='Make this workspace the default when opening the app'
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label='Description' name='description'>
            <TextArea
              rows={2}
              placeholder='Optional description for this workspace'
              maxLength={500}
            />
          </Form.Item>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Title level={4}>
            <BgColorsOutlined style={{ marginRight: 8 }} />
            Theme Configuration
          </Title>

          {renderThemePresets()}

          <div style={{ marginTop: 16 }}>
            <Button
              type='link'
              onClick={() => setShowCustomTheme(!showCustomTheme)}
              style={{ padding: 0 }}
            >
              {showCustomTheme ? 'Hide' : 'Show'} Custom Theme Options
            </Button>
          </div>

          {renderCustomTheme()}
        </div>

        <Divider />

        <Row justify='end'>
          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type='primary' htmlType='submit' loading={isCreating}>
              Create Workspace
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default CreateWorkspaceModal;
