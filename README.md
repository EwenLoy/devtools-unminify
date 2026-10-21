# Unminify JS

Веб-утилита, которая возвращает читаемый вид минифицированному **JavaScript, JSON, CSS и
HTML**. Работает офлайн: открой `index.html` двойным кликом — без сервера, установки и
интернета.

**[Открыть онлайн](https://ewenloy.github.io/unminify-js/)** · **[Скачать](https://github.com/EwenLoy/unminify-js/archive/refs/heads/main.zip)**

## Возможности

- JS, JSON, CSS, HTML — автоопределение языка и ручной выбор.
- Отступ: 2 пробела, 4 пробела (по умолчанию) или таб.
- Две панели с нумерацией строк и размерами, перетаскиваемый разделитель.
- Копирование и скачивание результата, `Ctrl`+`Enter` для запуска.
- Тёмная тема, скроллбары в стиле DevTools.
- `unminify-single.html` — вся утилита одним файлом, удобно переслать.

## Запуск

Открыть `index.html`. Всё.

Node.js нужен только для разработки:

```bash
npm install
npm run dev              # http://localhost:5173/dev.html
npm run build:standalone # пересобрать assets/, dev.html, unminify-single.html
npm test
```

## Где что править

| Что | Файл | Дальше |
| --- | --- | --- |
| разметка, тексты | `index.html` | обновить страницу |
| стили | `src/styles.css` | `npm run build:standalone` |
| логика интерфейса | `src/*.ts` | `npm run build:standalone` |
| форматтер | `src/formatter/` | `npm test` |

`assets/*`, `dev.html` и `unminify-single.html` генерируются — правки в них затрутся.

## Как устроено

Форматтеры лежат в `src/formatter/devtools` (JS/JSON/CSS/HTML + `FormattedContentBuilder`),
разбор JS идёт через acorn, CSS и HTML — через режимы CodeMirror 5. В `src/formatter/shims`
небольшие замены внутренних модулей, чтобы код собирался вне дерева DevTools. В
`src/app.ts` интерфейс, `src/detect.ts` определение языка, `src/standalone.ts` вход
автономной сборки.

Тесты: `npm test` — 118 штук, включая официальные тесты форматтеров и прогон собранного
UI в jsdom по `file://`.

## Ограничения

- В режиме `Auto` язык определяется эвристикой (`src/detect.ts`), можно выбрать вручную.
- TS и JSX не разбираются без предварительной транспиляции.
- Source map не строятся, mapping считается только для статусбара.
- На `file://` копирование идёт через `document.execCommand('copy')`.

## Лицензия

Код утилиты — [MIT](LICENSE). Форматтер в `src/formatter/devtools` и
`src/formatter/shims` — BSD-3-Clause, текст в [NOTICE](NOTICE).
