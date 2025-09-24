/**
 * SecurityWarning component
 *
 * Component for displaying security warnings, re-authentication notices,
 * and credential stripping alerts during import/export operations
 */

import React from 'react';
import {
  Alert,
  Typography,
  Space,
  List,
  Card,
  Divider,
  Button,
  Collapse,
  Tag,
  Timeline,
} from 'antd';
import {
  SecurityScanOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SafetyOutlined as ShieldOutlined,
  KeyOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

export type SecuritySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SecurityWarningItem {
  id: string;
  type: SecuritySeverity;
  title: string;
  message: string;
  details?: string;
  actionRequired?: boolean;
  recommendation?: string;
}

interface SecurityWarningProps {
  warnings?: SecurityWarningItem[];
  title?: string;
  severity?: SecuritySeverity;
  showDetails?: boolean;
  collapsible?: boolean;
  onAcknowledge?: () => void;
}

/**
 * SecurityWarning for displaying security alerts and notices
 *
 * Features:
 * - Multiple severity levels (info, warning, error, critical)
 * - Collapsible detailed information
 * - Re-authentication requirements display
 * - Credential stripping alerts
 * - Action recommendations
 * - User acknowledgment tracking
 */
const SecurityWarning: React.FC<SecurityWarningProps> = ({
  warnings = [],
  title = 'Security Notice',
  severity = 'warning',
  showDetails = true,
  collapsible = true,
  onAcknowledge,
}) => {
  /**
   * Get alert type from severity
   */
  const getAlertType = (sev: SecuritySeverity) => {
    switch (sev) {
      case 'critical':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  /**
   * Get icon for severity
   */
  const getSeverityIcon = (sev: SecuritySeverity) => {
    switch (sev) {
      case 'critical':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  /**
   * Get color for severity
   */
  const getSeverityColor = (sev: SecuritySeverity) => {
    switch (sev) {
      case 'critical':
        return '#ff4d4f';
      case 'error':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      case 'info':
      default:
        return '#1890ff';
    }
  };

  /**
   * Render security best practices
   */
  const renderSecurityBestPractices = () => (
    <Card title='Security Best Practices' size='small' style={{ marginTop: 16 }}>
      <Timeline>
        <Timeline.Item dot={<ShieldOutlined style={{ color: '#52c41a' }} />}>
          <Text strong>Credential Protection</Text>
          <br />
          <Text type='secondary'>
            GetWarped never exports your stored passwords, tokens, or session cookies. All
            credentials remain secure on your local device.
          </Text>
        </Timeline.Item>

        <Timeline.Item dot={<KeyOutlined style={{ color: '#1890ff' }} />}>
          <Text strong>Re-authentication</Text>
          <br />
          <Text type='secondary'>
            You'll need to sign in again to services after import. This is intentional and helps
            maintain your account security.
          </Text>
        </Timeline.Item>

        <Timeline.Item dot={<EyeInvisibleOutlined style={{ color: '#faad14' }} />}>
          <Text strong>Privacy Protection</Text>
          <br />
          <Text type='secondary'>
            Configuration exports exclude browsing history, personal data, and other sensitive
            information.
          </Text>
        </Timeline.Item>

        <Timeline.Item dot={<LockOutlined style={{ color: '#722ed1' }} />}>
          <Text strong>Encryption Option</Text>
          <br />
          <Text type='secondary'>
            Use encrypted exports for additional protection when sharing or storing configuration
            files.
          </Text>
        </Timeline.Item>
      </Timeline>
    </Card>
  );

  /**
   * Render warning details
   */
  const renderWarningDetails = (warning: SecurityWarningItem) => (
    <Space direction='vertical' size={12} style={{ width: '100%' }}>
      <div>
        <Space>
          {getSeverityIcon(warning.type)}
          <Text strong>{warning.title}</Text>
          <Tag color={getSeverityColor(warning.type)}>{warning.type.toUpperCase()}</Tag>
        </Space>
      </div>

      <Paragraph>{warning.message}</Paragraph>

      {warning.details && (
        <div>
          <Text strong>Details:</Text>
          <Paragraph type='secondary' style={{ marginTop: 8 }}>
            {warning.details}
          </Paragraph>
        </div>
      )}

      {warning.recommendation && (
        <div>
          <Text strong>Recommendation:</Text>
          <Paragraph
            style={{
              marginTop: 8,
              padding: 12,
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 6,
            }}
          >
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            {warning.recommendation}
          </Paragraph>
        </div>
      )}

      {warning.actionRequired && (
        <Alert
          message='Action Required'
          description='Please review and address this security concern before proceeding.'
          type='warning'
          showIcon
          style={{ marginTop: 8 }}
        />
      )}
    </Space>
  );

  /**
   * Get the most severe warning level
   */
  const getMostSevereLevel = () => {
    if (warnings.some(w => w.type === 'critical')) return 'critical';
    if (warnings.some(w => w.type === 'error')) return 'error';
    if (warnings.some(w => w.type === 'warning')) return 'warning';
    return 'info';
  };

  /**
   * Count warnings by severity
   */
  const getWarningCounts = () => {
    return warnings.reduce(
      (counts, warning) => {
        counts[warning.type] = (counts[warning.type] || 0) + 1;
        return counts;
      },
      {} as Record<SecuritySeverity, number>
    );
  };

  if (warnings.length === 0) {
    return null;
  }

  const alertType = getAlertType(getMostSevereLevel());
  const warningCounts = getWarningCounts();

  return (
    <Space direction='vertical' size={16} style={{ width: '100%' }}>
      {/* Main Alert */}
      <Alert
        message={
          <Space>
            <SecurityScanOutlined />
            <span>{title}</span>
            {Object.entries(warningCounts).map(([sev, count]) => (
              <Tag key={sev} color={getSeverityColor(sev as SecuritySeverity)}>
                {count} {sev}
              </Tag>
            ))}
          </Space>
        }
        description='Please review the security notices below before proceeding.'
        type={alertType}
        showIcon
      />

      {/* Warning List */}
      {showDetails && (
        <div>
          {collapsible ? (
            <Collapse size='small'>
              {warnings.map((warning, index) => (
                <Panel
                  key={warning.id}
                  header={
                    <Space>
                      {getSeverityIcon(warning.type)}
                      <span>{warning.title}</span>
                      <Tag color={getSeverityColor(warning.type)}>{warning.type.toUpperCase()}</Tag>
                    </Space>
                  }
                  extra={
                    warning.actionRequired ? <WarningOutlined style={{ color: '#faad14' }} /> : null
                  }
                >
                  {renderWarningDetails(warning)}
                </Panel>
              ))}
            </Collapse>
          ) : (
            <List
              size='small'
              dataSource={warnings}
              renderItem={warning => (
                <List.Item>
                  <Card size='small' style={{ width: '100%' }}>
                    {renderWarningDetails(warning)}
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      )}

      {/* Security Best Practices */}
      {showDetails && renderSecurityBestPractices()}

      {/* Acknowledgment Button */}
      {onAcknowledge && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type='primary' onClick={onAcknowledge} icon={<CheckCircleOutlined />}>
            I Understand the Security Implications
          </Button>
        </div>
      )}
    </Space>
  );
};

// Preset warning configurations for common scenarios
export const CommonWarnings = {
  CREDENTIAL_STRIPPING: {
    id: 'credential-stripping',
    type: 'info' as SecuritySeverity,
    title: 'Credentials Not Included',
    message: 'Your stored passwords and authentication tokens will not be exported.',
    details:
      'This is intentional security behavior. You will need to sign in to your services again after importing this configuration.',
    actionRequired: false,
    recommendation: "Make note of which services you'll need to re-authenticate with after import.",
  },

  REAUTHENTICATION_REQUIRED: {
    id: 'reauth-required',
    type: 'warning' as SecuritySeverity,
    title: 'Re-authentication Required',
    message: 'Several services will require you to sign in again after import.',
    details:
      'Services like Google, Microsoft, and GitHub will require fresh authentication for security reasons.',
    actionRequired: true,
    recommendation:
      'Prepare your login credentials for the services that will require re-authentication.',
  },

  VERSION_COMPATIBILITY: {
    id: 'version-compat',
    type: 'warning' as SecuritySeverity,
    title: 'Version Compatibility Warning',
    message: 'This configuration was created with a different version of GetWarped.',
    details:
      'Some features or settings may not be fully compatible and could be modified during import.',
    actionRequired: false,
    recommendation:
      'Review the imported configuration after the process completes and adjust any settings as needed.',
  },

  PLATFORM_DIFFERENCES: {
    id: 'platform-diff',
    type: 'info' as SecuritySeverity,
    title: 'Cross-Platform Import',
    message: 'This configuration was exported from a different operating system.',
    details:
      'File paths and some system-specific settings may be adjusted automatically during import.',
    actionRequired: false,
    recommendation:
      'Verify that all services work correctly after import and update any file paths if necessary.',
  },

  ENCRYPTED_EXPORT: {
    id: 'encrypted-export',
    type: 'info' as SecuritySeverity,
    title: 'Encrypted Configuration',
    message: 'This configuration file is encrypted and requires a password.',
    details:
      'You will need the original encryption password to decrypt and import this configuration.',
    actionRequired: true,
    recommendation:
      'Ensure you have the correct decryption password before proceeding with the import.',
  },
};

export default SecurityWarning;
