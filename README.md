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
- Тёмная тема, аккуратные скроллбары.
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

`src/formatter` — форматтеры для JS, JSON, CSS и HTML: JS разбирается через acorn и
печатается по потоку токенов, CSS и HTML — через режимы CodeMirror 5. В
`src/formatter/shims` небольшие замены внутренних модулей, чтобы код собирался как обычный
браузерный бандл. Интерфейс — `src/app.ts`, определение языка — `src/detect.ts`, вход
автономной сборки — `src/standalone.ts`.

`npm test` — 118 тестов: форматтеры и прогон собранного UI в jsdom по `file://`.

## Ограничения

- В режиме `Auto` язык определяется эвристикой (`src/detect.ts`), можно выбрать вручную.
- TS и JSX не разбираются без предварительной транспиляции.
- Source map не строятся, mapping считается только для статусбара.
- На `file://` копирование идёт через `document.execCommand('copy')`.

## Лицензия

Код утилиты — [MIT](LICENSE). Сторонний код в `src/formatter` — BSD-3-Clause, текст в
[NOTICE](NOTICE).
