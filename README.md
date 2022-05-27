<h1 align="center">PostCSS Webpack Plugin</h1>
<p align="center">
  A <a href="https://webpack.js.org/" target="_blank">webpack</a> plugin to process generated assets with <a href="https://postcss.org/" target="_blank">PostCSS</a> with support for webpack 5.x <b>filesystem cache</b>.
</p>
<p align="center">
    <a href="https://github.com/jsimck/postcss-webpack-plugin/actions/workflows/ci.yml">
        <img alt="ci" src="https://github.com/jsimck/postcss-webpack-plugin/actions/workflows/ci.yml/badge.svg?branch=main">
    </a>
    <a href="https://conventionalcommits.org">
        <img alt="Conventional Commits" src="https://img.shields.io/badge/  Conventional%20Commits-1.0.0-yellow.svg">
    </a>
    <a href="https://github.com/prettier/prettier">
        <img alt="Prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
    </a>
</p>

Serves as an alternative and also addition to `postcss-loader`. While webpack loaders are efficient, when you need to run some transformations on concatenated CSS (through `mini-css-extract-plugin` for example), loaders allows you to process just one file at time.

This plugin tries to solve this issue while taking great inspiration from [postcss-pipeline-webpack-plugin](postcss-pipeline-webpack-plugin). It allows you to **run PostCSS plugins** on generated (and newly emitted) **assets**, with support for webpack 5.x **filesystem cache** and ability to change content of **existing assets**, rather than a need to always generate new ones.

## Quick start
```console
npm i -D postcss postcss-webpack-plugin
```

```javascript
new PostCSSWebpackPlugin({
  // Required: Array of PostCSS plugins that are passed directly to postcss function
  plugins: [require('cssnano')],
  /**
   * Optional: Can be either function, which receives asset file name as first
   * argument and should return new name ((filename: string) => string). Or a string
   * with a support for [base], [dir], [name], [ext] template tags. Defaults to the
   * existing filename (updates asset content) if not provided.
   */
  filename?: string | ((filename: string) => string),
  /**
   * Optional: Custom function or RegExp to filter out unwanted assets. Defaults
   * to /\.css$/ to process only CSS files.
   */
  filter?: RegExp | ((filename: string) => boolean),
  // Optional: Custom implementation of postcss, defaults to require('postcss')
  implementation?: require('postcss'),
  /**
   * Optional: Runs plugin also for newly emitted assets. Should be combined
   * with custom filter option in order to not get stuck processing the same
   * file all over again.
   */
  additionalAssets?: true | undefined,
})
```

## Usage
Sample usage in the webpack config object.

```javascript
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
    })
  ]
};
```

### Advanced usage

Multiple instances can be chained together:

```javascript
module.exports = {
  // ...
  plugins: [
    new PostCSSWebpackPlugin({
      plugins: [require('postcss-pxtorem'), require('cssnano')],
      filename: '[name].rem[ext]',
    }),
    new PostCSSWebpackPlugin({
      plugins: [require('postcss-pxtorem'), require('cssnano')],
      filename: '[name].min[ext]',
    })
  ]
};
```
