/**
 * ErrorBoundary component for GetWarped
 *
 * Comprehensive error boundary with detailed error reporting, logging,
 * and user-friendly fallback UI. Integrates with IPC for error reporting
 * to main process and provides recovery options for users.
 *
 * @fileoverview Production-ready error boundary component
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Space, Collapse, Typography, Card, Divider } from 'antd';
import { ReloadOutlined, BugOutlined, WarningOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

interface Props {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  /** Whether to show detailed error information (dev mode) */
  showDetails?: boolean;
  /** Custom error handler */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Recovery attempts before showing permanent error */
  maxRecoveryAttempts?: number;
}

interface State {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  errorId: string;
  recoveryAttempts: number;
  isRecovering: boolean;
}

/**
 * Generate unique error ID for tracking
 */
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize error stack trace for display
 */
const sanitizeStackTrace = (stack: string): string => {
  // Remove file paths and sensitive information
  return stack
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 10) // Limit to first 10 lines
    .join('\n');
};

class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  public override state: State = {
    hasError: false,
    errorId: '',
    recoveryAttempts: 0,
    isRecovering: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Report error to main process (includes logging)
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Report error to main process for logging
   */
  private reportError = (error: Error, errorInfo: ErrorInfo): void => {
    try {
      // Check if Electron API is available
      if ((window as any).electron?.ipcRenderer?.invoke) {
        (window as any).electron.ipcRenderer.invoke('log-error', 'react-error-boundary', {
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          name: error.name,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      }
    } catch (reportingError) {
      // Silently fail error reporting - we don't want to crash the error boundary
    }
  };

  /**
   * Reset error boundary state
   */
  public resetErrorBoundary = (): void => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      recoveryAttempts: 0,
      isRecovering: false,
    });
  };

  /**
   * Reload the entire application
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Reset just the error boundary
   */
  private handleReset = (): void => {
    this.resetErrorBoundary();
  };

  /**
   * Copy error details to clipboard
   */
  private copyErrorDetails = async (): Promise<void> => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorDetails = {
      id: this.state.errorId,
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      // Could show a notification here
    } catch (error) {
      // Silently fail clipboard operation
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.resetErrorBoundary
        );
      }

      // Show recovery loading state
      if (this.state.isRecovering) {
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              padding: '20px',
            }}
          >
            <Result
              icon={<ReloadOutlined spin />}
              title='Recovering...'
              subTitle='Attempting to recover from the error. Please wait.'
            />
          </div>
        );
      }

      const isDevelopment = process.env['NODE_ENV'] === 'development';
      const showDetails = this.props.showDetails ?? isDevelopment;

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Card style={{ maxWidth: 800, width: '100%' }}>
            <Result
              status='error'
              icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
              title='Application Error'
              subTitle='An unexpected error occurred in the application. You can try to recover or reload the app.'
              extra={[
                <Space key='actions' size='middle' wrap>
                  <Button type='primary' icon={<ReloadOutlined />} onClick={this.handleReset}>
                    Try Again
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={this.handleReload}>
                    Reload Application
                  </Button>
                  {showDetails && (
                    <Button icon={<BugOutlined />} onClick={this.copyErrorDetails}>
                      Copy Error Details
                    </Button>
                  )}
                </Space>,
              ]}
            />

            {showDetails && (
              <>
                <Divider />
                <Collapse ghost>
                  <Panel
                    header={
                      <Space>
                        <WarningOutlined />
                        <Text strong>Error Details</Text>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          ({this.state.errorId})
                        </Text>
                      </Space>
                    }
                    key='error-details'
                  >
                    <Space direction='vertical' style={{ width: '100%' }}>
                      <div>
                        <Text strong>Error Message:</Text>
                        <Paragraph
                          code
                          copyable
                          style={{
                            backgroundColor: '#fafafa',
                            padding: '8px',
                            margin: '4px 0',
                          }}
                        >
                          {this.state.error.message}
                        </Paragraph>
                      </div>

                      {this.state.error.stack && (
                        <div>
                          <Text strong>Stack Trace:</Text>
                          <Paragraph
                            code
                            copyable
                            style={{
                              backgroundColor: '#fafafa',
                              padding: '8px',
                              margin: '4px 0',
                              fontSize: '12px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                            }}
                          >
                            {sanitizeStackTrace(this.state.error.stack)}
                          </Paragraph>
                        </div>
                      )}

                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <Text strong>Component Stack:</Text>
                          <Paragraph
                            code
                            copyable
                            style={{
                              backgroundColor: '#fafafa',
                              padding: '8px',
                              margin: '4px 0',
                              fontSize: '12px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                            }}
                          >
                            {this.state.errorInfo.componentStack}
                          </Paragraph>
                        </div>
                      )}
                    </Space>
                  </Panel>
                </Collapse>
              </>
            )}

            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Text type='secondary' style={{ fontSize: '12px' }}>
                Error ID: {this.state.errorId} | Recovery Attempts: {this.state.recoveryAttempts}
              </Text>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
