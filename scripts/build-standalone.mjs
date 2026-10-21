// Сборка автономной версии (без сервера, открывается двойным кликом по file://).
//
// ВАЖНО: index.html — ИСХОДНИК разметки. Его правят руками, и этот скрипт его
// НИКОГДА не перезаписывает. Генерируются только производные файлы:
//
//   src/styles.css      →  assets/formatter.css
//   src/standalone.ts   →  assets/formatter.js (+ formatter.js.map)
//   index.html          →  dev.html             (для Vite: ./src/styles.css + ./src/main.ts)
//   index.html          →  unminify-single.html (всё в одном файле, минифицировано)
//
// Почему бандл — классический IIFE, а не модули: браузеры блокируют ES-модули
// и Web Worker на file://, поэтому двойной клик с модулями не работает.
//
// Замены делаются через функции: в тексте бандла встречаются `$&`, `$'` и т.п.,
// которые String.replace в строковой замене трактует как спец-шаблоны.

import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

import {build} from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = relative => path.join(root, relative);

const page = await readFile(at('index.html'), 'utf8');
const css = (await readFile(at('src/styles.css'), 'utf8')).trim();

// Именно эти две строки связывают руками написанный index.html со сборкой.
const CSS_TAG = '<link rel="stylesheet" href="./assets/formatter.css">';
const JS_TAG = '<script src="./assets/formatter.js"></script>';

for (const tag of [CSS_TAG, JS_TAG]) {
  if (!page.includes(tag)) {
    throw new Error(`index.html: не найдено \`${tag}\` — изменилась разметка?`);
  }
}

const buildOptions = {
  entryPoints: [at('src/standalone.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'eof',
  write: false,
  charset: 'utf8',
  define: {'process.env.NODE_ENV': '"production"'},
};

/* ---------- 1. assets/formatter.css + assets/formatter.js ---------- */

await mkdir(at('assets'), {recursive: true});

const readable = await build({
  ...buildOptions,
  minify: false,
  sourcemap: 'external',
  outfile: at('assets/formatter.js'),
});

const jsAsset = readable.outputFiles.find(file => file.path.endsWith('.js'));
const mapAsset = readable.outputFiles.find(file => file.path.endsWith('.map'));
if (!jsAsset || !mapAsset) {
  throw new Error('esbuild не вернул js/map для разложенной сборки');
}

// sourceMappingURL относительный, поэтому карта подхватывается и на file://.
const js = `${jsAsset.text.trimEnd()}\n//# sourceMappingURL=formatter.js.map\n`;

await writeFile(at('assets/formatter.css'), `${css}\n`, 'utf8');
await writeFile(at('assets/formatter.js'), js, 'utf8');
await writeFile(at('assets/formatter.js.map'), mapAsset.text, 'utf8');

/* ---------- 2. dev.html — та же разметка, но с модулями и воркером ---------- */

const devHtml = page
    .replace(CSS_TAG, () => '<link rel="stylesheet" href="./src/styles.css">')
    .replace(JS_TAG, () => '<script type="module" src="./src/main.ts"></script>');

/* ---------- 3. unminify-single.html — всё в одном файле ---------- */

const single = await build({...buildOptions, minify: true});
const escapedJs = single.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const singleHtml = page
    .replace(CSS_TAG, () => `<style>\n${css}\n  </style>`)
    .replace(JS_TAG, () => `<script>\n${escapedJs}\n  </script>`);

/* ---------- Проверки и запись ---------- */

const generatedBy = source =>
  `<!-- Сгенерировано scripts/build-standalone.mjs из ${source}. Правьте ${source}, а не этот файл. -->`;

const outputs = [
  ['dev.html', devHtml.replace('<!DOCTYPE html>', () => `<!DOCTYPE html>\n${generatedBy('index.html')}`)],
  ['unminify-single.html', singleHtml.replace('<!DOCTYPE html>', () => `<!DOCTYPE html>\n${generatedBy('index.html')}`)],
];

for (const [name, html] of outputs) {
  if (html.includes('./assets/formatter.js') || !html.includes('id="format"')) {
    throw new Error(`${name}: подстановка не удалась — изменилась разметка index.html?`);
  }
}
if (!devHtml.includes('src="./src/main.ts"')) {
  throw new Error('dev.html: не подставился модульный вход ./src/main.ts');
}

for (const [name, html] of outputs) {
  await writeFile(at(name), html, 'utf8');
}

const kb = text => (Buffer.byteLength(text) / 1024).toFixed(0);
console.log(`assets/formatter.css ${kb(css)} КБ, assets/formatter.js ${kb(js)} КБ (+ map)`);
console.log(`dev.html: ${kb(devHtml)} КБ — для сервера (npm run dev)`);
console.log(`unminify-single.html: ${kb(singleHtml)} КБ — всё в одном файле`);
console.log('index.html не тронут: его правим руками, двойной клик работает как раньше');
