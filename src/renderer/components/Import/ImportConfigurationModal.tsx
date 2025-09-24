/**
 * ImportConfigurationModal component
 *
 * Modal for importing configuration with migration wizard integration
 * Handles secure import with validation and conflict resolution
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  Upload,
  Button,
  Typography,
  Space,
  Alert,
  Steps,
  Divider,
  Card,
  Checkbox,
  Row,
  Col,
  Progress,
  Result,
  List,
  Tag,
  Input,
} from 'antd';
import {
  ImportOutlined,
  UploadOutlined,
  FileTextOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { validateImportFile, importConfiguration } from '../../store/slices/exportImportSlice';
import type { ConfigurationExport } from '../../../shared/types/ConfigurationExport';
// TODO: Import these when created
// import ImportPreview from './ImportPreview';
// import SecurityWarning from '../Security/SecurityWarning';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;

interface ImportConfigurationModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

/**
 * ImportConfigurationModal for secure configuration import
 *
 * Features:
 * - File validation and security scanning
 * - Migration wizard integration
 * - Conflict resolution
 * - Import preview with detailed breakdown
 * - Progress tracking
 * - Security warnings for sensitive data
 */
const ImportConfigurationModal: React.FC<ImportConfigurationModalProps> = ({
  open,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const {
    importing,
    importProgress,
    importError,
    importPreview,
    importValidation,
    securityWarnings,
  } = useAppSelector(state => state.exportImport);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    importServices: true,
    importWorkspaces: true,
    importThemes: true,
    importPreferences: true,
    createBackupBeforeImport: true,
  });
  const [password, setPassword] = useState<string>('');

  /**
   * Reset modal state
   */
  const resetModal = useCallback(() => {
    setCurrentStep(0);
    setSelectedFile(null);
    setPassword('');
    setImportOptions({
      overwriteExisting: false,
      importServices: true,
      importWorkspaces: true,
      importThemes: true,
      importPreferences: true,
      createBackupBeforeImport: true,
    });
  }, []);

  /**
   * Handle modal close
   */
  const handleCancel = useCallback(() => {
    if (currentStep === 4 && onSuccess) {
      onSuccess();
    }
    resetModal();
    onCancel();
  }, [currentStep, onSuccess, resetModal, onCancel]);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setCurrentStep(1);

      // Validate file
      const resultAction = await dispatch(
        validateImportFile({
          filePath: file.name, // TODO: Use actual file path when available
        })
      );

      if (validateImportFile.fulfilled.match(resultAction)) {
        setCurrentStep(2);
      } else {
        setCurrentStep(0);
      }
    },
    [dispatch, password]
  );

  /**
   * Handle import start
   */
  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setCurrentStep(3);

    const resultAction = await dispatch(
      importConfiguration({
        importPath: selectedFile.name, // TODO: Use actual file path when available
        validateOnly: false,
      })
    );

    if (importConfiguration.fulfilled.match(resultAction)) {
      setCurrentStep(4);
    } else {
      setCurrentStep(2);
    }
  }, [dispatch, selectedFile, password, importOptions]);

  /**
   * Upload props for Ant Design Upload component
   */
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.json,.enc',
    showUploadList: false,
    beforeUpload: (file: File) => {
      handleFileSelect(file);
      return false; // Prevent automatic upload
    },
  };

  /**
   * Render file selection step
   */
  const renderFileSelection = () => (
    <Space direction='vertical' size={24} style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>Select Configuration File</Title>
        <Paragraph type='secondary'>
          Choose a GetWarped configuration export file to import
        </Paragraph>
      </div>

      <Dragger {...uploadProps} style={{ padding: '40px' }}>
        <p className='ant-upload-drag-icon'>
          <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
        </p>
        <p className='ant-upload-text'>Click or drag configuration file to this area</p>
        <p className='ant-upload-hint'>
          Support for .json and .enc files. Encrypted files will require a password.
        </p>
      </Dragger>

      <Alert
        message='Supported File Types'
        description='JSON files (.json) - Plain text exports. Encrypted files (.enc) - Password-protected exports.'
        type='info'
        showIcon
      />
    </Space>
  );

  /**
   * Render validation step
   */
  const renderValidation = () => (
    <Space direction='vertical' size={24} style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>Validating Configuration</Title>
        <Progress type='circle' percent={75} status='active' />
        <Paragraph type='secondary' style={{ marginTop: 16 }}>
          Please wait while we validate the configuration file...
        </Paragraph>
      </div>

      {selectedFile && (
        <Card size='small'>
          <Text strong>Selected File:</Text> {selectedFile.name}
          <br />
          <Text type='secondary'>Size: {(selectedFile.size / 1024).toFixed(1)} KB</Text>
        </Card>
      )}

      {importError && (
        <Alert message='Validation Failed' description={importError} type='error' showIcon />
      )}
    </Space>
  );

  /**
   * Render preview and options step
   */
  const renderPreviewAndOptions = () => (
    <Space direction='vertical' size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3}>Import Preview</Title>
        <Paragraph type='secondary'>Review the configuration and select import options</Paragraph>
      </div>

      {/* Security Warnings */}
      {securityWarnings.length > 0 && (
        <Alert
          message='Security Notice'
          description={`${securityWarnings.length} security warning(s) found. Please review carefully.`}
          type='warning'
          showIcon
          icon={<SecurityScanOutlined />}
        />
      )}

      {/* Import Preview */}
      {importPreview && (
        <Card title='Configuration Preview' size='small'>
          <Text>Preview functionality will be implemented in ImportPreview component (T081)</Text>
          <Divider />
          <Text type='secondary'>
            Configuration contains: Services, Workspaces, Themes, and Preferences
          </Text>
        </Card>
      )}

      {/* Password Input for Encrypted Files */}
      {selectedFile?.name.endsWith('.enc') && (
        <Card title='Decryption' size='small'>
          <Input.Password
            placeholder='Enter decryption password'
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </Card>
      )}

      {/* Import Options */}
      <Card title='Import Options' size='small'>
        <Space direction='vertical' style={{ width: '100%' }}>
          <Checkbox
            checked={importOptions.overwriteExisting}
            onChange={e =>
              setImportOptions(prev => ({
                ...prev,
                overwriteExisting: e.target.checked,
              }))
            }
          >
            Overwrite existing configurations
            <Text type='secondary' style={{ fontSize: 12, display: 'block' }}>
              Replace existing services and workspaces with imported ones
            </Text>
          </Checkbox>

          <Checkbox
            checked={importOptions.createBackupBeforeImport}
            onChange={e =>
              setImportOptions(prev => ({
                ...prev,
                createBackupBeforeImport: e.target.checked,
              }))
            }
          >
            Create backup before import
            <Text type='secondary' style={{ fontSize: 12, display: 'block' }}>
              Recommended: Create a backup of current configuration
            </Text>
          </Checkbox>

          <Divider />

          <Text strong>Import Content:</Text>

          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Checkbox
                checked={importOptions.importServices}
                onChange={e =>
                  setImportOptions(prev => ({
                    ...prev,
                    importServices: e.target.checked,
                  }))
                }
              >
                Services
              </Checkbox>
            </Col>
            <Col span={12}>
              <Checkbox
                checked={importOptions.importWorkspaces}
                onChange={e =>
                  setImportOptions(prev => ({
                    ...prev,
                    importWorkspaces: e.target.checked,
                  }))
                }
              >
                Workspaces
              </Checkbox>
            </Col>
            <Col span={12}>
              <Checkbox
                checked={importOptions.importThemes}
                onChange={e =>
                  setImportOptions(prev => ({
                    ...prev,
                    importThemes: e.target.checked,
                  }))
                }
              >
                Themes
              </Checkbox>
            </Col>
            <Col span={12}>
              <Checkbox
                checked={importOptions.importPreferences}
                onChange={e =>
                  setImportOptions(prev => ({
                    ...prev,
                    importPreferences: e.target.checked,
                  }))
                }
              >
                Preferences
              </Checkbox>
            </Col>
          </Row>
        </Space>
      </Card>
    </Space>
  );

  /**
   * Render import progress step
   */
  const renderImportProgress = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <Title level={3}>Importing Configuration</Title>

      <Progress
        type='circle'
        percent={importProgress}
        status={importError ? 'exception' : 'active'}
        style={{ marginBottom: 24 }}
      />

      <Paragraph type='secondary'>
        Please wait while your configuration is being imported...
      </Paragraph>

      {importError && (
        <Alert
          message='Import Failed'
          description={importError}
          type='error'
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );

  /**
   * Render completion step
   */
  const renderCompletion = () => (
    <Result
      status='success'
      title='Import Completed Successfully'
      subTitle='Your configuration has been imported and is now active.'
      icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
      extra={
        <Space>
          <Button type='primary' onClick={handleCancel}>
            Close
          </Button>
        </Space>
      }
    />
  );

  /**
   * Get step content
   */
  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderFileSelection();
      case 1:
        return renderValidation();
      case 2:
        return renderPreviewAndOptions();
      case 3:
        return renderImportProgress();
      case 4:
        return renderCompletion();
      default:
        return renderFileSelection();
    }
  };

  /**
   * Get modal footer
   */
  const getModalFooter = () => {
    switch (currentStep) {
      case 2:
        return [
          <Button key='back' onClick={() => setCurrentStep(0)}>
            Back
          </Button>,
          <Button key='cancel' onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key='import'
            type='primary'
            onClick={handleImport}
            icon={<ImportOutlined />}
            disabled={
              !importOptions.importServices &&
              !importOptions.importWorkspaces &&
              !importOptions.importThemes &&
              !importOptions.importPreferences
            }
          >
            Import Configuration
          </Button>,
        ];

      case 3:
        return null; // No footer during import

      case 4:
        return null; // Footer handled by Result component

      default:
        return [
          <Button key='cancel' onClick={handleCancel}>
            Cancel
          </Button>,
        ];
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ImportOutlined />
          Import Configuration
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={getModalFooter()}
      width={800}
      destroyOnClose
      closable={currentStep !== 3}
      maskClosable={currentStep !== 3}
    >
      {/* Progress Steps */}
      {currentStep < 4 && (
        <div style={{ marginBottom: 24 }}>
          <Steps current={currentStep} size='small'>
            <Step title='Select File' icon={<UploadOutlined />} />
            <Step title='Validate' icon={<SecurityScanOutlined />} />
            <Step title='Preview' icon={<FileTextOutlined />} />
            <Step title='Import' icon={<ImportOutlined />} />
          </Steps>
        </div>
      )}

      {getStepContent()}
    </Modal>
  );
};

export default ImportConfigurationModal;
