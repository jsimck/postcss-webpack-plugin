<h1 align="center">PostCSS Webpack Plugin</h1>
<p align="center">
  A <a href="https://webpack.js.org/" target="_blank">webpack</a> plugin to process generated assets with <a href="https://postcss.org/" target="_blank">PostCSS</a> with support for webpack 5.x <b>filesystem cache</b>.
</p>
<p align="center">
    <a href="https://github.com/jsimck/postcss-webpack-plugin/actions/workflows/ci.yml">
        <img alt="ci" src="https://github.com/jsimck/postcss-webpack-plugin/actions/workflows/ci.yml/badge.svg?branch=main">
    </a>
    <a href="https://github.com/prettier/prettier">
        <img alt="Prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
    </a>
</p>

Serves as an alternative and also addition to `postcss-loader`. While webpack loaders are pretty efficient, they allow you to process just one file at time.

This plugin tries to solve this issue while taking great inspiration from [postcss-pipeline-webpack-plugin](https://github.com/mistakster/postcss-pipeline-webpack-plugin#readme). It allows you to run PostCSS plugins on generated (and newly emitted) assets, with support for webpack 5.x filesystem cache and ability to change content of existing assets, rather than a need to always generate new ones.

## Installation
```console
npm i -D postcss-webpack-plugin
```

## Usage

```javascript
// webpack.config.js
const { PostCSSWebpackPlugin } = require('postcss-webpack-plugin');

module.exports = {
  entry: 'base.css',
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
  plugins: [
    new PostCSSWebpackPlugin({
      plugins: [require('postcss-pxtorem'), require('cssnano')],
    }),
  ],
};
```

### Chaining multiple instances together

Following example first runs css nano and pxtorem plugin son the `base.css` asset and then creates a new one with only mobile styles (using `unmq` plugin) in the second pass.

```javascript
// webpack.config.js
const { PostCSSWebpackPlugin } = require('postcss-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new PostCSSWebpackPlugin({
      plugins: [require('postcss-pxtorem'), require('cssnano')],
    }),
    new PostCSSWebpackPlugin({
      plugins: [
        require('postcss-unmq')({
          type: 'screen',
          width: 540,
        }),
      ],
      filename: '[name].mobile[ext]',
    })
  ]
}
```


### Plugin options
```typescript
interface PostCSSWebpackPluginOptions {
  filename?: string | ((filename: string) => string);
  filter?: RegExp | ((filename: string) => boolean);
  implementation?: Postcss;
  additionalAssets?: true | undefined;
  stage?: number;
  plugins: any[];
}
```

#### `filename`
> `string | ((filename: string) => string)`

Optional custom filename. If not provided the plugins are applied on the existing css assets without creating new ones. Can be either function or string with support for `[base], [dir], [ext], [name], [root]` template variables.

#### `filter`
> `RegExp | ((filename: string) => boolean)`

Custom function or RegExp to filter assets to process (defaults to `/\.css$/`).

#### `implementation`
> `Postcss`

Optional custom implementation for `postcss`. Can be usefull in some projects where the default `require('postcss')` resolves to wrong version.

#### `additionalAssets`
> `true | undefined`

Set to true to run plugin for newly emitted assets. Should be used in combination with `filter` option in order to prevent cycles in compilation.

#### `stage`
> `number`

Custom plugin processAssets hook stage (defaults to `PROCESS_ASSETS_STAGE_OPTIMIZE`).

#### `plugins`
> `any[]`

Array of postcss plugins.

## Supported versions
- node  **14+**
- postcss **8+**
- webpack **5+**
