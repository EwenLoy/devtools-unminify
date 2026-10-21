# Unminify

Веб-утилита, которая возвращает читаемый вид минифицированному **JavaScript, JSON, CSS и HTML**.
Работает целиком в браузере и не требует сервера: достаточно открыть `index.html` двойным
кликом — ни установки, ни интернета, ни зависимостей в рантайме.

Форматирование выполняет форматтер из **Chrome DevTools**, адаптированный под обычную
браузерную сборку. Поэтому результат совпадает с кнопкой `{}` (Pretty print) в панели
Sources/Network — вплоть до пробелов и переносов строк.

## Возможности

- **JS, JSON, CSS, HTML** — автоопределение языка и ручной выбор.
- **Отступ**: 2 пробела, 4 пробела (значение по умолчанию в DevTools) или таб.
- **Офлайн**: `index.html` + `assets/` для чтения исходников либо один файл `unminify-single.html`.
- **Две панели** с нумерацией строк, размером и количеством строк.
- **Перетаскиваемый разделитель**: ширина панелей запоминается, двойной клик — сброс 50/50.
- **Копирование и скачивание** результата, `Ctrl`+`Enter` для форматирования.
- **Тёмная тема** и скроллбары в стиле DevTools.

## Быстрый старт

```bash
git clone https://github.com/EwenLoy/devtools-unminify.git
cd devtools-unminify
```

Открой `index.html` — всё. Node.js нужен только для пересборки и тестов.

| Файл | Назначение |
| --- | --- |
| `index.html` | страница утилиты; **исходник** разметки, правится руками |
| `assets/formatter.css` | стили (генерируются из `src/styles.css`) |
| `assets/formatter.js` | скрипт (генерируется из `src/standalone.ts`, не минифицирован, есть source map) |
| `unminify-single.html` | та же страница одним файлом — удобно переслать |

ES-модули и Web Worker браузеры блокируют на `file://`, поэтому в автономной версии
используется классический IIFE-скрипт и форматирование в главном потоке.

## Как это работает

Основа — открытый код Chrome DevTools: `front_end/models/formatter` и
`front_end/entrypoints/formatter_worker`. Здесь он собран в обычную браузерную сборку:

| Файл | Что делает |
| --- | --- |
| `JavaScriptFormatter.ts` | Pretty-print JS: разбор через **acorn**, обход AST через `ESTreeWalker`, печать по потоку токенов. |
| `AcornTokenizer.ts` | Обёртка над токенами acorn: `peekToken`/`nextToken`, комментарии, позиции, номера строк. |
| `ESTreeWalker.ts` | Обход ESTree-дерева и `WALK_ORDER` — порядок обхода полей узлов. |
| `JSONFormatter.ts` | JSON: `JSON.parse` с отступами, ключи и строки берутся из исходника. |
| `CSSFormatter.ts` | CSS: токенизация режимом `css` из **CodeMirror 5**, отступы и переводы строк. |
| `HTMLFormatter.ts` | HTML: режим `htmlmixed`, переносы тегов и атрибутов, сохранение `pre`/`textarea`. |
| `IdentityFormatter.ts` | Заглушка для неизвестных типов — текст как есть. |
| `FormattedContentBuilder.ts` | Сборка результата и **mapping** `original[] → formatted[]`. |

Детали, из-за которых самописный beautifier даёт другой результат:

* JS печатается **не по AST**, а по **потоку токенов**: AST нужен только для контекста
  (`if`, `for`, `try`, шаблонные строки). Поэтому комментарии, регулярки и «странные»
  конструкции остаются на своих местах.
* Пробелы вставляются через soft/hard space, лишние пустые строки схлопываются.
* Внутри `${...}` шаблонных строк пробелы между словами отключаются.
* Отступ по умолчанию — 4 пробела.
* CSS и HTML токенизируются CodeMirror 5, как в DevTools.

Что пришлось адаптировать (на вывод не влияет):

* импорты приведены к локальным путям;
* `third_party/acorn` → npm-пакет `acorn@8.16.0` (та же версия, что в DevTools);
* `third_party/codemirror` → npm-пакет `codemirror@5.65.21` + режимы `xml`, `css`, `javascript`;
* внутренние модули (`platform`, `TextCursor`) заменены небольшими шимами с тем же поведением;
* `const enum` заменён обычным `enum`, чтобы esbuild и Vite собирали без `preserveConstEnums`;
* в результат добавлено поле `error`, чтобы показать синтаксическую ошибку (в DevTools она
  пишется в консоль).

Сам алгоритм форматирования не переписывался.

## Разработка

```bash
npm install
npm run dev              # сервер с Web Worker: http://localhost:5173/dev.html
npm run build:standalone # пересобрать артефакты (assets/, dev.html, single)
npm run build            # typecheck + standalone + vite build в dist/
npm test                 # vitest, офлайн-тесты форматтеров и UI
```

### Где что править

| Что меняешь | Файл | Дальше |
| --- | --- | --- |
| разметку, тексты, кнопки | `index.html` | обновить страницу |
| стили | `src/styles.css` | `npm run build:standalone` |
| логику интерфейса | `src/*.ts` | `npm run build:standalone` |
| сам форматтер | `src/formatter/devtools/*` | `npm test` |

`index.html` — исходник: сборка его не перезаписывает. Генерируются только `assets/*`,
`dev.html` (версия для dev-сервера с модулями и воркером) и `unminify-single.html`.

### Структура

```
index.html                  страница утилиты (исходник)
assets/                     собранные CSS и JS (+ source map)
unminify-single.html        та же страница одним файлом
dev.html                    генерируется из index.html для vite dev
src/
  app.ts                    логика интерфейса
  detect.ts                 определение языка по содержимому
  standalone.ts             вход автономной сборки
  main.ts                   вход для dev-сервера
  format-transport.ts       выбор: Web Worker или главный поток
  formatter-client.ts       обёртка над воркером
  styles.css                стили
  formatter/
    worker.ts               Web Worker
    devtools/               код DevTools (адаптированные импорты)
    shims/                  acorn, codemirror, platform, TextCursor, DOM-заглушка
scripts/build-standalone.mjs
tests/
```

## Тесты

* `tests/JavaScriptFormatter.test.ts` — 73 официальных теста DevTools (await, optional
  chaining, классы, regex, шаблонные строки, `for`/`try`/`switch`, юникод-идентификаторы …).
* `tests/JSONFormatter.test.ts`, `tests/FormattedContentBuilder.test.ts` — тоже из DevTools.
* `tests/formatters.test.ts` — CSS/HTML/Identity, ошибки разбора, определение типа.
* `tests/worker-env.test.ts` — форматтер без DOM (окружение Web Worker).
* `tests/standalone.test.ts` — собирает артефакты и прогоняет реальный UI в jsdom по
  `file://`: проверяет, что нет модулей и воркера, что `index.html` не перезаписывается,
  что вывод совпадает с `FormatterWorker.format()` для JS, JSON, CSS и HTML.

## Ограничения

* DevTools выбирает форматтер по **MIME из сетевого ответа**; в браузере его нет, поэтому в
  режиме `Auto` работает эвристика (`src/detect.ts`). Язык можно указать вручную.
* Source map не строятся: pretty-print в DevTools их тоже не создаёт, он держит mapping в
  сессии. Здесь mapping считается и показывается в статусбаре.
* TS и JSX не разбираются без предварительной транспиляции — как и в DevTools.
* На `file://` браузер блокирует Clipboard API, поэтому копирование переключается на
  `document.execCommand('copy')`.

## Лицензия

Код утилиты — [MIT](LICENSE). Форматтер и вспомогательные модули в
`src/formatter/devtools` и `src/formatter/shims` взяты из Chrome DevTools
(BSD-3-Clause), подробности в [NOTICE](NOTICE).
