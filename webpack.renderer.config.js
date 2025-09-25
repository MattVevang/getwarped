const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * Webpack configuration for Electron renderer process
 * @type {import('webpack').Configuration}
 */
module.exports = {
  target: 'electron-renderer',

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  entry: './src/renderer/index.tsx',

  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: process.env.NODE_ENV === 'production' ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    clean: true,
    publicPath: './',
    pathinfo: false, // Disable pathinfo in production for performance
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.renderer.json',
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]',
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
      inject: 'body',
      scriptLoading: 'blocking',
      minify: process.env.NODE_ENV === 'production' ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false,
    }),
    // Bundle analyzer - only in analyze mode
    ...(process.env.ANALYZE_BUNDLE === 'true' ? [
      new (require('webpack-bundle-analyzer')).BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
      }),
    ] : []),
    // Define plugin for environment variables
    new (require('webpack')).DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.ELECTRON_DISABLE_SECURITY_WARNINGS': JSON.stringify('true'),
    }),
    // Progress plugin for build feedback
    new (require('webpack')).ProgressPlugin(),
  ],

  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: process.env.NODE_ENV === 'production' ? [
      // TerserPlugin for renderer optimization
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          ecma: 2020,
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
            pure_funcs: ['console.info', 'console.debug', 'console.warn'],
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      // CssMinimizerPlugin for CSS optimization
      new (require('css-minimizer-webpack-plugin'))(),
    ] : [],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      cacheGroups: {
        // React and related libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        // Redux and state management
        redux: {
          test: /[\\/]node_modules[\\/](@reduxjs\/toolkit|react-redux)[\\/]/,
          name: 'redux',
          chunks: 'all',
          priority: 19,
        },
        // Ant Design UI library
        antd: {
          test: /[\\/]node_modules[\\/]antd[\\/]/,
          name: 'antd',
          chunks: 'all',
          priority: 18,
        },
        // Other vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          minSize: 30000,
        },
        // Common modules
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist/renderer'),
    },
    compress: true,
    port: 9000,
    hot: true,
    historyApiFallback: true,
  },

  stats: {
    errorDetails: true,
    colors: true,
  },
};
