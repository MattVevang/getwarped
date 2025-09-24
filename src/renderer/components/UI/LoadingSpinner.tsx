/**
 * LoadingSpinner component
 *
 * Provides consistent loading indicators across the application
 * with multiple size variants and customizable styling
 */

import React from 'react';
import { Spin, SpinProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

/**
 * Loading spinner size variants
 */
export type LoadingSize = 'small' | 'default' | 'large';

/**
 * LoadingSpinner component props
 */
interface LoadingSpinnerProps extends Omit<SpinProps, 'size'> {
  /** Size variant of the spinner */
  size?: LoadingSize;
  /** Custom loading text */
  text?: string;
  /** Show spinner with overlay background */
  overlay?: boolean;
  /** Center the spinner */
  centered?: boolean;
  /** Custom color for the spinner */
  color?: string;
  /** Minimum height when centered */
  minHeight?: number | string;
}

/**
 * Size configurations for different spinner variants
 */
const sizeConfigs = {
  small: {
    fontSize: '14px',
    textSize: '12px',
    padding: '8px',
  },
  default: {
    fontSize: '24px',
    textSize: '14px',
    padding: '16px',
  },
  large: {
    fontSize: '32px',
    textSize: '16px',
    padding: '24px',
  },
};

/**
 * Custom loading icon component
 */
const CustomLoadingIcon: React.FC<{
  size: LoadingSize;
  color?: string;
}> = ({ size, color }) => {
  const config = sizeConfigs[size];

  return (
    <LoadingOutlined
      style={{
        fontSize: config.fontSize,
        color: color || '#1890ff',
      }}
      spin
    />
  );
};

/**
 * LoadingSpinner component
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  text,
  overlay = false,
  centered = false,
  color,
  minHeight,
  className,
  style,
  ...props
}) => {
  const config = sizeConfigs[size];

  // Custom spinner indicator
  const indicator = <CustomLoadingIcon size={size} color={color} />;

  // Base spinner component
  const spinnerElement = (
    <Spin
      {...props}
      indicator={indicator}
      tip={text}
      className={`loading-spinner ${className || ''}`}
      style={{
        ...style,
        fontSize: config.textSize,
      }}
    />
  );

  // If overlay is requested, wrap in overlay container
  if (overlay) {
    return (
      <div
        className='loading-overlay'
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)',
        }}
      >
        {spinnerElement}
      </div>
    );
  }

  // If centered is requested, wrap in centered container
  if (centered) {
    return (
      <div
        className='loading-centered'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: config.padding,
          minHeight: minHeight || '200px',
          width: '100%',
        }}
      >
        {spinnerElement}
      </div>
    );
  }

  // Return basic spinner
  return spinnerElement;
};

/**
 * Predefined loading spinner variants for common use cases
 */
export const LoadingVariants = {
  /**
   * Full page loading overlay
   */
  Page: (props?: Partial<LoadingSpinnerProps>) => (
    <LoadingSpinner overlay size='large' text='Loading...' {...props} />
  ),

  /**
   * Card/section loading spinner
   */
  Section: (props?: Partial<LoadingSpinnerProps>) => (
    <LoadingSpinner centered size='default' text='Loading...' minHeight='120px' {...props} />
  ),

  /**
   * Inline loading spinner (small)
   */
  Inline: (props?: Partial<LoadingSpinnerProps>) => <LoadingSpinner size='small' {...props} />,

  /**
   * Button loading spinner
   */
  Button: (props?: Partial<LoadingSpinnerProps>) => <LoadingSpinner size='small' {...props} />,

  /**
   * List item loading spinner
   */
  ListItem: (props?: Partial<LoadingSpinnerProps>) => (
    <LoadingSpinner centered size='small' minHeight='60px' {...props} />
  ),

  /**
   * Modal content loading spinner
   */
  Modal: (props?: Partial<LoadingSpinnerProps>) => (
    <LoadingSpinner centered size='default' text='Processing...' minHeight='150px' {...props} />
  ),
};

/**
 * Hook for managing loading states
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading,
  };
};

/**
 * Higher-order component for adding loading states
 */
export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  LoadingComponent: React.ComponentType<LoadingSpinnerProps> = LoadingSpinner
) => {
  return React.forwardRef<any, P & { isLoading?: boolean; loadingProps?: LoadingSpinnerProps }>(
    ({ isLoading, loadingProps, ...props }, ref) => {
      if (isLoading) {
        return <LoadingComponent centered {...loadingProps} />;
      }

      return <WrappedComponent {...(props as P)} ref={ref} />;
    }
  );
};

/**
 * Loading context for managing global loading states
 */
interface LoadingContextType {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  addLoadingTask: (taskId: string) => void;
  removeLoadingTask: (taskId: string) => void;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

/**
 * LoadingProvider component for managing global loading states
 */
export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingTasks, setLoadingTasks] = React.useState<Set<string>>(new Set());

  const setGlobalLoading = React.useCallback((loading: boolean) => {
    if (loading) {
      setLoadingTasks(prev => new Set(prev).add('global'));
    } else {
      setLoadingTasks(prev => {
        const newTasks = new Set(prev);
        newTasks.delete('global');
        return newTasks;
      });
    }
  }, []);

  const addLoadingTask = React.useCallback((taskId: string) => {
    setLoadingTasks(prev => new Set(prev).add(taskId));
  }, []);

  const removeLoadingTask = React.useCallback((taskId: string) => {
    setLoadingTasks(prev => {
      const newTasks = new Set(prev);
      newTasks.delete(taskId);
      return newTasks;
    });
  }, []);

  const contextValue = React.useMemo(
    () => ({
      isGlobalLoading: loadingTasks.size > 0,
      setGlobalLoading,
      addLoadingTask,
      removeLoadingTask,
    }),
    [loadingTasks.size, setGlobalLoading, addLoadingTask, removeLoadingTask]
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {contextValue.isGlobalLoading && <LoadingVariants.Page />}
    </LoadingContext.Provider>
  );
};

/**
 * Hook for using the loading context
 */
export const useGlobalLoading = () => {
  const context = React.useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingSpinner;
