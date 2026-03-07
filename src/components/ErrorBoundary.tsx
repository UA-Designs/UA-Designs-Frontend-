import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `
              radial-gradient(circle at 20% 50%, rgba(0, 204, 102, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0, 204, 102, 0.05) 0%, transparent 50%),
              linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 50%, #0d0d0d 100%)
            `,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              border: '1px solid rgba(0, 204, 102, 0.2)',
              borderRadius: '20px',
              padding: '40px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 204, 102, 0.15), 0 4px 16px rgba(0, 0, 0, 0.3)',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <Result
              status="error"
              title={
                <Text style={{ color: '#ffffff', fontSize: '24px', fontWeight: '600' }}>
                  Oops! Something went wrong
                </Text>
              }
              subTitle={
                <Text style={{ color: '#b3b3b3', fontSize: '16px' }}>
                  We encountered an unexpected error. Don't worry, our team has been notified.
                </Text>
              }
              extra={[
                <Button
                  key="reload"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                  style={{
                    background: 'linear-gradient(135deg, #009944 0%, #007733 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    height: '40px',
                    marginRight: '12px',
                  }}
                >
                  Reload Page
                </Button>,
                <Button
                  key="home"
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                  style={{
                    border: '1px solid rgba(0, 204, 102, 0.3)',
                    color: '#009944',
                    borderRadius: '8px',
                    height: '40px',
                  }}
                >
                  Go to Dashboard
                </Button>,
              ]}
            />
            
            {(import.meta as any).env?.DEV && this.state.error && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'rgba(255, 0, 64, 0.1)',
                  border: '1px solid rgba(255, 0, 64, 0.3)',
                  borderRadius: '8px',
                }}
              >
                <Text style={{ color: '#ff4d4f', fontSize: '12px', fontWeight: '500' }}>
                  Development Error Details:
                </Text>
                <pre
                  style={{
                    color: '#ff4d4f',
                    fontSize: '11px',
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
