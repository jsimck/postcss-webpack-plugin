import { PostCSSWebpackPlugin } from '../index';
import { compile, getCompiler, readAssets } from './helpers/testUtils';

describe('when used with default options', () => {
  it('should not do anything with empty plugins', async () => {
    const compiler = getCompiler();
    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
      }
    `);
  });

  it('should apply postcss plugins to existing assets without creating new ones', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body{font-family:sans-serif;font-size:15px}",
      }
    `);
  });

  it('should work with multiple postcss plugins', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('postcss-pxtorem'), require('cssnano')],
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body{font-family:sans-serif;font-size:.9375rem}",
      }
    `);
  });
});

describe('when used with additionalAssets option', () => {
  it('should apply postcss to additional assets', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('postcss-pxtorem')],
          filename: '[name].pxtorem[ext]',
        }),
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filename: '[name].minimized[ext]',
          additionalAssets: true,
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body {
        font-size: 0.9375rem;
        font-family: sans-serif;
      }

      ",
        "/main.pxtorem.css": "body {
        font-size: 0.9375rem;
        font-family: sans-serif;
      }

      ",
        "/main.pxtorem.minimized.css": "body{font-family:sans-serif;font-size:.9375rem}",
        "/main.pxtorem.minimized.minimized.css": "body{font-family:sans-serif;font-size:.9375rem}",
      }
    `);
  });
});

describe('when used with custom filter', () => {
  it('should not fail when there are no assets to process', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filter: () => false,
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
      }
    `);
  });

  it('should apply changes only to filtered assets using function filter', async () => {
    const compiler = getCompiler({
      entry: { base: './base.css', component: './component.css' },
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filter: filename => filename.endsWith('base.css'),
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/base.css": "body{font-family:sans-serif;font-size:15px}",
        "/component.css": ".component {
        background: black;
        font-size: 12px;
      }

      ",
      }
    `);
  });

  it('should apply changes only to filtered assets using regexp filter', async () => {
    const compiler = getCompiler({
      entry: { base: './base.css', component: './component.css' },
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filter: filename => /component\.css$/.test(filename),
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/base.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
        "/component.css": ".component{background:#000;font-size:12px}",
      }
    `);
  });
});

describe('when used with custom filename option', () => {
  it('should interpolate template variables and create new asset', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filename: '[name].min[ext]',
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
        "/main.min.css": "body{font-family:sans-serif;font-size:15px}",
      }
    `);
  });

  it('should work with custom filename function option', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filename: filename =>
            `prefix__${filename.split('.')[0]}__postfix.css`,
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
        "/prefix__main__postfix.css": "body{font-family:sans-serif;font-size:15px}",
      }
    `);
  });

  it('should work with custom paths', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filename: './minimized/[base]',
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
        "/minimized/main.css": "body{font-family:sans-serif;font-size:15px}",
      }
    `);
  });
});

describe('when used with source maps enabled', () => {
  it('should work properly with external source maps', async () => {
    const compiler = getCompiler({
      devtool: 'source-map',
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('postcss-pxtorem'), require('cssnano')],
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.css": "body{font-family:sans-serif;font-size:.9375rem}
      /*# sourceMappingURL=main.css.map*/",
      }
    `);
  });
});
