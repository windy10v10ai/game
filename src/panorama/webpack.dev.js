const path = require('path');
const { PanoramaTargetPlugin } = require('webpack-panorama-x');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    hud_lottery: { filename: 'hud_lottery/layout.xml', import: './hud_lottery/layout.xml' },
    hud_home: { filename: 'hud_home/layout.xml', import: './hud_home/layout.xml' },
  },
  mode: 'development',
  context: path.resolve(__dirname, 'react'),
  output: {
    path: path.resolve(__dirname, '../../content/panorama/layout/custom_game/react/'),
    publicPath: 'file://{resources}/layout/custom_game/react/',
    chunkFormat: 'commonjs',
  },

  watchOptions: {
    aggregateTimeout: 1000, // 在1s内保存的所有文件都会被一次打包，因此也意味着每次按保存后要等一秒才能看到运行结果
  },

  optimization: {
    usedExports: true, // 启用 tree shaking
  },

  cache: {
    type: 'filesystem', // 降低首次运行的编译时间
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '...'],
    alias: {
      '@utils': path.resolve(__dirname, 'utils'),
    },
    symlinks: false,
  },

  module: {
    rules: [
      {
        test: /\.xml$/,
        loader: 'webpack-panorama-x/lib/layout-loader',
        options: {},
      },
      {
        test: /\.[jt]sx$/,
        issuer: /\.xml$/,
        loader: 'webpack-panorama-x/lib/entry-loader',
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: { transpileOnly: false, configFile: path.resolve(__dirname, 'tsconfig.json') },
      },
      {
        test: /\.js?$|\.jsx?$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        options: { presets: ['@babel/preset-react', '@babel/preset-env'] },
      },
      {
        test: /\.(css|less)$/,
        issuer: /\.xml$/,
        loader: 'file-loader',
        options: { name: '[path][name].css', esModule: false },
      },
      {
        test: /\.less$/,
        loader: 'less-loader',
        options: {
          additionalData: (content) => {
            content = content.replace(
              /@keyframes\s*(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g,
              (match, name) => {
                // add apostrophe to satisfy valve
                return match.replace(name, `'${name}'`);
              },
            );
            return content;
          },
          lessOptions: {
            relativeUrls: false,
          },
        },
      },
    ],
  },

  plugins: [
    new PanoramaTargetPlugin(),
    // ForkTsCheckerWebpackPlugin 和最新版的typescript有冲突，暂时不使用，改用ts-loader进行类型检查
    // new ForkTsCheckerWebpackPlugin({
    //   typescript: {
    //     configFile: path.resolve(__dirname, 'tsconfig.json'),
    //   },
    // }),
  ],
};
