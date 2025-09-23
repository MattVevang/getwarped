/**
 * LoadingSpinner component
 *
 * Displays a centered loading spinner with optional text
 */

import React from 'react';
import { Spin, Space } from 'antd';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'large', tip = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
      }}
    >
      <Space direction='vertical' align='center'>
        <Spin size={size} tip={tip} />
      </Space>
    </div>
  );
};

export default LoadingSpinner;
