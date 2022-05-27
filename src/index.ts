import path from 'path';

import { Postcss } from 'postcss';
import { validate } from 'schema-utils';
// eslint-disable-next-line import/no-unresolved
import { Schema } from 'schema-utils/declarations/validate';
import { Compilation, Compiler, sources } from 'webpack';

import schema from './options.json';

const CSS_RE = /\.css$/;
const PATH_INTERPOLATION_RE = /\[(\w+)\]/gi;

// Credits goes to KPD at https://stackoverflow.com/a/49725198/5410837
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export interface PostCSSWebpackPluginOptions {
  filename?: string | ((filename: string) => string);
  filter?: RegExp | ((filename: string) => boolean);
  implementation?: Postcss;
  additionalAssets?: true | undefined;
  plugins: any[];
}

export type PostCSSWebpackPluginCacheEntry =
  | sources.RawSource
  | sources.SourceMapSource;

class PostCSSWebpackPlugin {
  private _pluginName: string;
  private _options: RequireAtLeastOne<PostCSSWebpackPluginOptions, 'plugins'>;

  get postcss() {
    return this._options.implementation ?? require('postcss');
  }

  constructor(options: PostCSSWebpackPluginOptions) {
    this._pluginName = this.constructor.name;

    // Set defaults
    this._options = options;

    // Validate options
    validate(schema as Schema, this._options, {
      name: this._pluginName,
      baseDataPath: 'options',
    });
  }

  /**
   * Add compilation hooks to the webpack compiler
   */
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(this._pluginName, compilation => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: this._pluginName,
          stage:
            compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          additionalAssets: this._options.additionalAssets,
        },
        (assets: Compilation['assets']) => this.optimize(assets, compilation)
      );

      compilation.hooks.statsPrinter.tap(this._pluginName, stats => {
        stats.hooks.print
          .for('asset.info.optimized')
          .tap(this._pluginName, (_, { green, formatFlag }) =>
            green && formatFlag ? green(formatFlag('optimized')) : ''
          );
      });
    });
  }

  async optimize(
    assets: Compilation['assets'],
    compilation: Compilation
  ): Promise<void> {
    if (this._options.plugins.length === 0) {
      return;
    }

    // Filter out invalid assets
    const filteredAssets = Object.keys(assets).filter(asset => {
      if (typeof this._options.filter === 'undefined') {
        return CSS_RE.test(asset);
      }

      if (this._options.filter instanceof RegExp) {
        return this._options.filter.test(asset);
      }

      if (typeof this._options.filter === 'function') {
        return this._options.filter(asset);
      }

      return false;
    });

    // Skip when there are no assets to process
    if (filteredAssets.length === 0) {
      return;
    }

    // Process each asset separately
    await Promise.all(
      filteredAssets.map(asset => this._process(asset, compilation))
    );
  }

  private async _process(
    filename: string,
    compilation: Compilation
  ): Promise<void> {
    // Check cache
    const cache = compilation.getCache(this._pluginName);
    const asset = compilation.getAsset(filename);
    const { source, info } = asset || {};

    // Skip empty assets
    if (!source) {
      return;
    }

    const eTag = cache.getLazyHashedEtag(source);
    const cacheItem = cache.getItemCache(filename, eTag);
    const output =
      (await cacheItem.getPromise()) as PostCSSWebpackPluginCacheEntry;

    // Restore data from cache
    if (output) {
      compilation.updateAsset(filename, output);
      return;
    }

    const { map: prevMap, source: fileContents } = source.sourceAndMap();
    const newFilename = this._processFilename(filename);

    // Process css using postcss
    const postcssresult = await this.postcss(this._options.plugins).process(
      fileContents,
      {
        map: prevMap ? { prev: prevMap } : false,
        from: filename,
        to: newFilename,
      }
    );

    const { css, map } = postcssresult;

    // Create new source
    const newSource = map
      ? new sources.SourceMapSource(css, newFilename, map.toJSON())
      : new sources.RawSource(css);

    // Store cache
    await cacheItem.storePromise(newSource as PostCSSWebpackPluginCacheEntry);

    // Updated asset source
    compilation[newFilename === filename ? 'updateAsset' : 'emitAsset'](
      newFilename,
      newSource,
      info
    );
  }

  private _processFilename(filename: string) {
    if (!this._options?.filename) {
      return filename;
    }

    if (typeof this._options.filename === 'function') {
      return this._options.filename(filename);
    }

    const parsedPath = path.parse(filename);

    /**
     * Interpolate template values ([base], [dir], [ext], [name], [root]),
     * we manually prepend the base dir since you usually want to only
     * edit the filename and retain the output path.
     */
    return `${parsedPath.dir ? '[dir]/' : ''}${this._options.filename}`.replace(
      PATH_INTERPOLATION_RE,
      (_, group: keyof path.ParsedPath) => parsedPath[group]
    );
  }
}

export { PostCSSWebpackPlugin };
