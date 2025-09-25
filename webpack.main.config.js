const path = require('path');

/**
 * Webpack configuration for Electron main process
 * @type {import('webpack').Configuration}
 */
module.exports = {
  target: 'electron-main',

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

  entry: './src/main/main.ts',

  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'main.js',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
            transpileOnly: true,
          },
        },
      },
    ],
  },

  node: {
    __dirname: false,
    __filename: false,
  },

  externals: {
    // Exclude native modules from bundling
    keytar: 'commonjs keytar',
    'electron-store': 'commonjs electron-store',
    'electron-log': 'commonjs electron-log',
  },

  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: process.env.NODE_ENV === 'production' ? [
      // TerserPlugin for main process optimization
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          ecma: 2020,
          compress: {
            drop_console: false, // Keep console for main process logging
            drop_debugger: true,
            pure_funcs: ['console.debug'],
          },
          mangle: {
            keep_fnames: true, // Keep function names for stack traces
          },
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ] : [],
    nodeEnv: process.env.NODE_ENV,
  },

  stats: {
    errorDetails: true,
    colors: true,
  },
};
