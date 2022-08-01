import path from 'path';

import { createFsFromVolume, Volume } from 'memfs';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';

function getCompiler(config: webpack.Configuration = {}): webpack.Compiler {
  const compiler = webpack({
    entry: config.entry ?? './base.css',
    mode: 'development',
    devtool: config.devtool ?? false,
    context: path.resolve(__dirname, '../__mocks__'),
    output: {
      pathinfo: false,
      path: path.resolve(__dirname, '../../__outputs__'),
      filename: '[name].js',
      chunkFilename: '[id].[name].js',
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].[name].css',
      }),
      ...(config?.plugins ?? []),
    ],
    module: {
      rules: [
        {
          test: /.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
  });

  compiler.outputFileSystem = createFsFromVolume(new Volume());

  return compiler;
}

function compile(compiler: webpack.Compiler): Promise<webpack.Stats> {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }

      return resolve(stats as webpack.Stats);
    });
  });
}

function readAssets(
  compiler: webpack.Compiler,
  stats: webpack.Stats
): Record<string, string> {
  const outputsPath = path.resolve(__dirname, '../../__outputs__');
  const usedFs = compiler.outputFileSystem;
  const outputPath = stats.compilation.outputOptions.path ?? '';
  const assets = Object.keys(stats.compilation.assets).filter(assetName =>
    /\.css$/.test(assetName)
  );

  return assets.reduce<Record<string, string>>((acc, cur) => {
    try {
      const assetOutputPath = path.join(outputPath, cur);
      // Get assets path with root dir === __outputs__ dir
      const normAssetOutputPath = assetOutputPath.replace(outputsPath, '');

      acc[normAssetOutputPath] = (usedFs as any)
        .readFileSync(assetOutputPath)
        .toString();
    } catch (error) {
      if (error instanceof Error) {
        acc[cur] = error.toString();
      }
    }

    return acc;
  }, {});
}

export { getCompiler, compile, readAssets };
