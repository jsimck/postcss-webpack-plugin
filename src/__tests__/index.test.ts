import { compile, getCompiler, readAssets } from '../helpers/testUtils';
import { PostCSSWebpackPlugin } from '../index';

describe('when used with default options', () => {
  it('should work with one PostCSS plugin', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('cssnano')],
          filename: '[name].optimized[ext]',
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.optimized.css": "body{font-family:sans-serif;font-size:15px}",
        "main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
      }
    `);
  });

  it('should work with multiple PostCSS plugins', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('postcss-pxtorem'), require('cssnano')],
          filename: '[name].optimized[ext]',
        }),
      ],
    });

    const stats = await compile(compiler);

    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.optimized.css": "body{font-family:sans-serif;font-size:.9375rem}",
        "main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
      }
    `);
  });
});

describe('test additional assets', () => {
  it('should chain multiple instances of PostCSSWebpackPlugin', async () => {
    const compiler = getCompiler({
      plugins: [
        new PostCSSWebpackPlugin({
          plugins: [require('postcss-pxtorem')],
          filename: '[name].minimized[ext]',
        }),
      ],
    });

    const stats = await compile(compiler);

    // TODO should generate 2 assets, and not touch the original...
    expect(readAssets(compiler, stats)).toMatchInlineSnapshot(`
      Object {
        "/main.minimized.css": "body {
        font-size: 0.9375rem;
        font-family: sans-serif;
      }

      ",
        "main.css": "body {
        font-size: 15px;
        font-family: sans-serif;
      }

      ",
      }
    `);
  });
});

describe('test filename and multiple files export (chained)', () => {
  it.todo('todo');
});

describe('test with and without source maps', () => {
  it.todo('todo');
});

describe('test filtering options', () => {
  it.todo('todo');
});
