const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'oddsockets.min.js' : 'oddsockets.js',
      library: {
        name: 'OddSockets',
        type: 'umd'
      },
      globalObject: 'this',
      clean: false
    },
    resolve: {
      extensions: ['.js', '.ts'],
      alias: {
        // Use browser-specific HTTP implementation
        'axios': path.resolve(__dirname, 'src/browser-http.js')
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 8']
                  },
                  modules: false
                }]
              ]
            }
          }
        }
      ]
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction, // Remove ALL console statements in production
              drop_debugger: true,
              pure_funcs: isProduction ? [
                'console.log',
                'console.info', 
                'console.debug',
                'console.warn',
                'console.error',
                'console.trace',
                'console.time',
                'console.timeEnd',
                'console.group',
                'console.groupEnd',
                'console.groupCollapsed'
              ] : ['console.debug'],
              // More aggressive console removal
              global_defs: isProduction ? {
                'console.log': 'void 0',
                'console.info': 'void 0',
                'console.debug': 'void 0',
                'console.warn': 'void 0',
                'console.error': 'void 0',
                'console.trace': 'void 0'
              } : {}
            },
            mangle: {
              reserved: ['OddSockets', 'Channel', 'PubNubCompat']
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        })
      ]
    },
    externals: {
      // Don't bundle these dependencies - they'll be included in the bundle
      // Comment out if you want them bundled
      // 'socket.io-client': 'io',
      // 'eventemitter3': 'EventEmitter'
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    target: 'web',
    mode: argv.mode || 'development'
  };
};
