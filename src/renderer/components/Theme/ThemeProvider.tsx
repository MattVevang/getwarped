/**
 * ThemeProvider component
 *
 * Provides theme management functionality with dark/light mode support
 * Integrates with Ant Design's ConfigProvider and system preferences
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { ConfigProvider, theme, App } from 'antd';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { selectTheme, selectEffectiveTheme, setTheme } from '../../store/slices/uiSlice';

const { darkAlgorithm, defaultAlgorithm } = theme;

/**
 * Theme context type
 */
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  effectiveTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
  setSystemTheme: () => void;
}

/**
 * Theme context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme provider component props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Custom theme tokens for GetWarped
 */
const customThemeTokens = {
  light: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    colorText: '#000000d9',
    colorTextSecondary: '#00000073',
    colorTextTertiary: '#00000040',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#141414',
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
    colorText: '#ffffffd9',
    colorTextSecondary: '#ffffff73',
    colorTextTertiary: '#ffffff40',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },
};

/**
 * Component-specific theme styles
 */
const componentStyles = {
  light: {
    Modal: {
      contentBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Card: {
      colorBg: '#ffffff',
      colorBorderSecondary: '#f0f0f0',
    },
    Menu: {
      colorBg: '#ffffff',
      colorItemBg: 'transparent',
      colorActiveBarBg: '#1890ff',
    },
    Layout: {
      colorBgHeader: '#ffffff',
      colorBgBody: '#f5f5f5',
      colorBgTrigger: '#f5f5f5',
    },
    Button: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d9d9d9',
    },
    Input: {
      colorBg: '#ffffff',
      colorBorder: '#d9d9d9',
    },
  },
  dark: {
    Modal: {
      contentBg: '#1f1f1f',
      headerBg: '#1f1f1f',
    },
    Card: {
      colorBg: '#1f1f1f',
      colorBorderSecondary: '#434343',
    },
    Menu: {
      colorBg: '#1f1f1f',
      colorItemBg: 'transparent',
      colorActiveBarBg: '#1890ff',
    },
    Layout: {
      colorBgHeader: '#1f1f1f',
      colorBgBody: '#141414',
      colorBgTrigger: '#141414',
    },
    Button: {
      colorBgContainer: '#1f1f1f',
      colorBorder: '#434343',
    },
    Input: {
      colorBg: '#1f1f1f',
      colorBorder: '#434343',
    },
  },
};

/**
 * Hook to detect system theme preference
 */
const useSystemTheme = (): 'light' | 'dark' => {
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return systemTheme;
};

/**
 * ThemeProvider component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const effectiveTheme = useAppSelector(selectEffectiveTheme);
  const systemTheme = useSystemTheme();

  // Update effective theme when system theme changes and current theme is 'system'
  useEffect(() => {
    if (currentTheme === 'system') {
      // The effectiveTheme selector will handle this automatically
    }
  }, [currentTheme, systemTheme]);

  // Theme management functions
  const toggleTheme = () => {
    const nextTheme = effectiveTheme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(nextTheme));
  };

  const setLightTheme = () => {
    dispatch(setTheme('light'));
  };

  const setDarkTheme = () => {
    dispatch(setTheme('dark'));
  };

  const setSystemTheme = () => {
    dispatch(setTheme('system'));
  };

  // Build theme configuration
  const themeConfig = {
    algorithm: effectiveTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
    token: customThemeTokens[effectiveTheme],
    components: componentStyles[effectiveTheme],
  };

  // Context value
  const contextValue: ThemeContextType = {
    theme: currentTheme,
    effectiveTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  };

  // Apply theme to document body for global styling
  useEffect(() => {
    document.body.setAttribute('data-theme', effectiveTheme);
    document.body.className =
      document.body.className.replace(/theme-\w+/g, '') + ` theme-${effectiveTheme}`;
  }, [effectiveTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig}>
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use the theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme toggle component
 */
export const ThemeToggle: React.FC<{
  size?: 'small' | 'middle' | 'large';
  showLabel?: boolean;
  className?: string;
}> = ({ size = 'middle', showLabel = false, className = '' }) => {
  const { effectiveTheme, toggleTheme } = useTheme();

  return (
    <div className={`theme-toggle ${className}`}>
      <button
        onClick={toggleTheme}
        className={`theme-toggle-btn theme-toggle-btn-${size}`}
        title={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
        aria-label={`Switch to ${effectiveTheme === 'light' ? 'dark' : 'light'} theme`}
      >
        {effectiveTheme === 'light' ? '🌙' : '☀️'}
        {showLabel && (
          <span className='theme-toggle-label'>
            {effectiveTheme === 'light' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
    </div>
  );
};

/**
 * Theme selector component
 */
export const ThemeSelector: React.FC<{
  size?: 'small' | 'middle' | 'large';
  className?: string;
}> = ({ size = 'middle', className = '' }) => {
  const { theme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();

  return (
    <div className={`theme-selector ${className}`}>
      <div className='theme-selector-options'>
        <button
          onClick={setLightTheme}
          className={`theme-selector-option ${theme === 'light' ? 'active' : ''}`}
          title='Light theme'
        >
          ☀️ Light
        </button>
        <button
          onClick={setDarkTheme}
          className={`theme-selector-option ${theme === 'dark' ? 'active' : ''}`}
          title='Dark theme'
        >
          🌙 Dark
        </button>
        <button
          onClick={setSystemTheme}
          className={`theme-selector-option ${theme === 'system' ? 'active' : ''}`}
          title='System theme'
        >
          🖥️ System
        </button>
      </div>
    </div>
  );
};

/**
 * Higher-order component for theme-aware components
 */
export const withTheme = (WrappedComponent: React.ComponentType<any>) => {
  return React.forwardRef<any, any>((props, ref) => {
    const { effectiveTheme } = useTheme();
    return React.createElement(WrappedComponent, { ...props, theme: effectiveTheme, ref });
  });
};

/**
 * Theme utilities
 */
export const ThemeUtils = {
  /**
   * Get theme-specific value
   */
  getThemeValue: (lightValue: any, darkValue: any, theme: 'light' | 'dark'): any => {
    return theme === 'dark' ? darkValue : lightValue;
  },

  /**
   * Get theme-specific color
   */
  getThemeColor: (colorKey: keyof typeof customThemeTokens.light, theme: 'light' | 'dark') => {
    return customThemeTokens[theme][colorKey];
  },

  /**
   * Check if current theme is dark
   */
  isDark: (theme: 'light' | 'dark'): boolean => {
    return theme === 'dark';
  },

  /**
   * Generate theme-aware styles
   */
  createThemeStyles: (lightStyles: React.CSSProperties, darkStyles: React.CSSProperties) => {
    return (theme: 'light' | 'dark'): React.CSSProperties => {
      return theme === 'dark' ? darkStyles : lightStyles;
    };
  },
};

export default ThemeProvider;
