import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';

import {JSDOM} from 'jsdom';
import {beforeAll, describe, expect, it} from 'vitest';

import {format} from '../src/formatter/devtools/FormatterWorker.js';
import {FormattableMediaTypes} from '../src/formatter/devtools/types.js';

/**
 * Автономные сборки для открытия двойным кликом (file://):
 *   index.html + assets/formatter.{css,js} — разложено по файлам;
 *   unminify-single.html                  — всё в одном файле.
 * Тест пересобирает их тем же скриптом, что и `npm run build:standalone`,
 * и прогоняет реальный UI в jsdom: значит проверяется именно то, что
 * пользователь откроет в браузере (без сервера и без воркера).
 */

const root = path.resolve(import.meta.dirname, '..');
const read = (relative: string): string => readFileSync(path.join(root, relative), 'utf8');

/** Снимок index.html до сборки: он исходник и не должен меняться. */
const indexBeforeBuild = read('index.html');

let html = '';
/** index.html с вклеенным assets/formatter.js: jsdom не подгружает внешние файлы сам. */
let page = '';
let singleHtml = '';

beforeAll(() => {
  execFileSync(process.execPath, [path.join(root, 'scripts/build-standalone.mjs')], {cwd: root, stdio: 'pipe'});
  html = read('index.html');
  singleHtml = read('unminify-single.html');
  const script = read('assets/formatter.js').replace(/<\/script/gi, '<\\/script');
  page = html.replace(/<script src="\.\/assets\/formatter\.js"><\/script>/, () => `<script>${script}</script>`);
}, 120_000);

function open(source = page): JSDOM {
  return new JSDOM(source, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'file:///index.html',
  });
}

async function formatInUi(dom: JSDOM, text: string, language = 'auto'): Promise<string> {
  const {document} = dom.window;
  const input = document.getElementById('input') as HTMLTextAreaElement;
  const output = document.getElementById('output') as HTMLTextAreaElement;
  const select = document.getElementById('language') as HTMLSelectElement;

  select.value = language;
  select.dispatchEvent(new dom.window.Event('change'));
  input.value = text;
  input.dispatchEvent(new dom.window.Event('input'));

  (document.getElementById('format') as HTMLButtonElement).click();

  for (let attempt = 0; attempt < 200; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 10));
    if (output.value) {
      return output.value;
    }
  }
  throw new Error('UI не отформатировал код за 2 секунды');
}

describe('standalone-сборки', () => {
  it('index.html разложен на css/js, но не требует сервера', () => {
    expect(html).toContain('<link rel="stylesheet" href="./assets/formatter.css">');
    expect(html).toContain('<script src="./assets/formatter.js"></script>');
    expect(html).not.toContain('type="module"');
    expect(html).not.toContain('./src/main.ts');
    expect(html).toContain('id="format"');
    expect(html).not.toContain('selection-only');

    // Читаемая сборка: не минифицирована и имеет карту исходников.
    const js = read('assets/formatter.js');
    expect(js).toContain('sourceMappingURL=formatter.js.map');
    expect(js).not.toContain('./src/main.ts');
    expect(js).not.toMatch(/new\s+Worker\(/);
    expect(js.split('\n').length).toBeGreaterThan(1000);

    const cssAsset = read('assets/formatter.css');
    expect(cssAsset).toContain('.splitter');
    // Скроллбары в цветах темы: вебкит + стандартный API для Firefox.
    expect(cssAsset).toContain('::-webkit-scrollbar-thumb');
    expect(cssAsset).toContain('scrollbar-color: var(--scrollbar-thumb) transparent');
    expect(cssAsset).toContain('scrollbar-gutter: stable');
    expect(JSON.parse(read('assets/formatter.js.map')).version).toBe(3);
  });

  it('не перезаписывает index.html — правки в разметке сохраняются', () => {
    // Главное обещание: index.html правят руками, сборка его не трогает.
    expect(read('index.html')).toBe(indexBeforeBuild);

    // А производные файлы генерируются из него.
    const dev = read('dev.html');
    expect(dev).toContain('Сгенерировано scripts/build-standalone.mjs');
    expect(dev).toContain('<link rel="stylesheet" href="./src/styles.css">');
    expect(dev).toContain('<script type="module" src="./src/main.ts"></script>');
    expect(dev).not.toContain('./assets/formatter.js');
  });

  it('unminify-single.html — самодостаточный один файл', () => {
    expect(singleHtml).not.toContain('type="module"');
    expect(singleHtml).not.toContain('<link');
    expect(singleHtml).not.toMatch(/<script[^>]+src=/i);
    expect(singleHtml).toContain('<style>');
  });

  it('один файл форматирует так же, как разложенная версия', async () => {
    const source = 'const a={b:1};function f(x){return x*2}';
    const expected = format(FormattableMediaTypes.TEXT_JAVASCRIPT, source, '    ').content;
    const actual = await formatInUi(open(singleHtml), source);
    expect(actual).toBe(expected);
  });

  it('форматирует JS ровно как FormatterWorker.format()', async () => {
    const source = 'function f(a,b){if(a){return b}else{return [1,2].map(n=>n*2)}}const o={x:1,"y":2};';
    const expected = format(FormattableMediaTypes.TEXT_JAVASCRIPT, source, '    ').content;
    const actual = await formatInUi(open(), source);

    expect(actual).toBe(expected);
    expect(actual).toBe([
      'function f(a, b) {',
      '    if (a) {',
      '        return b',
      '    } else {',
      '        return [1, 2].map(n => n * 2)',
      '    }',
      '}',
      'const o = {',
      '    x: 1,',
      '    "y": 2',
      '};',
      '',
    ].join('\n'));
  });

  it('форматирует JSON', async () => {
    const actual = await formatInUi(open(), '{"a":1,"b":[true,null,"x"]}', 'json');
    expect(actual).toBe(format(FormattableMediaTypes.APPLICATION_JSON, '{"a":1,"b":[true,null,"x"]}', '    ').content);
    expect(actual).toContain('    "a": 1,');
  });

  it('форматирует CSS', async () => {
    const actual = await formatInUi(open(), 'a{color:red;background:blue}@media (min-width:1px){b{c:d}}', 'css');
    expect(actual).toBe(format(FormattableMediaTypes.TEXT_CSS, 'a{color:red;background:blue}@media (min-width:1px){b{c:d}}', '    ').content);
    expect(actual).toContain('a {\n    color: red;');
  });

  it('форматирует HTML', async () => {
    const actual = await formatInUi(open(), '<div class="a"><span>text</span></div>', 'html');
    expect(actual).toContain('<div class="a">');
    expect(actual).toContain('    <span>text</span>');
  });

  it('позволяет менять размер панелей разделителем', () => {
    const dom = open();
    const {document} = dom.window;
    const panes = document.getElementById('panes') as HTMLElement;
    const splitter = document.getElementById('splitter') as HTMLElement;

    expect(splitter).toBeTruthy();
    expect(panes.style.getPropertyValue('--split')).toBe('50.00%');

    splitter.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
    expect(panes.style.getPropertyValue('--split')).toBe('52.00%');
    expect(splitter.getAttribute('aria-valuenow')).toBe('52');

    splitter.dispatchEvent(new dom.window.MouseEvent('dblclick', {bubbles: true}));
    expect(panes.style.getPropertyValue('--split')).toBe('50.00%');
  });

  it('показывает синтаксическую ошибку, но не теряет исходник', async () => {
    const dom = open();
    const result = await formatInUi(dom, 'function () {');
    expect(result).toBe('function () {');
    expect(dom.window.document.getElementById('status')?.textContent).toContain('Parse error');
  });
});
