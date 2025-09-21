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
    filename: '[name].js',
    chunkFilename: '[name].[chunkhash].js',
    clean: true,
    publicPath: './',
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
    }),
  ],

  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',

  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
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
