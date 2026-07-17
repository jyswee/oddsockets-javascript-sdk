const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

// Hardened obfuscation — ported from bgz-cli (scripts/build.js), target: browser.
// Applied to OUR src only (exclude node_modules) so socket.io internals are not
// control-flow-flattened (which breaks them). RC4-encodes strings incl. the endpoint.
const OBFUSCATOR_OPTIONS = {
  compact: true,
  // Browser-tuned: control-flow-flattening + dead-code-injection disabled to keep
  // the bundle light and avoid transforming vendored socket.io. String hiding
  // (the endpoint) comes from the RC4 string-array below, which is retained.
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 1,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  renameGlobals: true,
  renameProperties: false,
  selfDefending: false,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  transformObjectKeys: true,
  unicodeEscapeSequence: true,
  target: 'browser'
};

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
    plugins: isProduction ? [
      // Obfuscate the final emitted bundle (bgz-cli flag set). Runs after webpack
      // has resolved all imports to numeric ids, so module wiring stays intact.
      new WebpackObfuscator(OBFUSCATOR_OPTIONS)
    ] : [],
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
    devtool: isProduction ? false : 'eval-source-map',
    target: 'web',
    mode: argv.mode || 'development'
  };
};
