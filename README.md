# Unminify JS

[![CI](https://github.com/EwenLoy/unminify-js/actions/workflows/ci.yml/badge.svg)](https://github.com/EwenLoy/unminify-js/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Live demo](https://img.shields.io/badge/demo-online-brightgreen.svg)](https://ewenloy.github.io/unminify-js/)

A small offline web tool that turns minified **JavaScript, JSON, CSS and HTML** back into
readable code. No server, no install, no network — just open `index.html`.

**[Open online](https://ewenloy.github.io/unminify-js/)** ·
**[Download ZIP](https://github.com/EwenLoy/unminify-js/archive/refs/heads/main.zip)**

## Features

- **Four languages** — JavaScript, JSON, CSS and HTML, with automatic detection and a manual override.
- **Indentation** — 2 spaces, 4 spaces or a tab.
- **Works offline** — static files only; `unminify-single.html` packs everything into one file.
- **Two panes** — line numbers, line and byte counters, draggable splitter with a saved position.
- **Handy actions** — copy, download, `Ctrl`/`Cmd` + `Enter` to format.
- **Dark UI** — compact, dense layout with themed scrollbars.
- **Errors are visible** — invalid input is reported in the status bar, the original text is kept.

## Quick start

Download or clone the repository and open `index.html` in a browser:

```bash
git clone https://github.com/EwenLoy/unminify-js.git
cd unminify-js
```

That is the whole setup. Node.js is only needed for development and tests.

## Usage

1. Paste minified code into the left pane.
2. Pick a language, or leave **Auto**.
3. Press **Format** or `Ctrl`/`Cmd` + `Enter`.
4. Copy or download the result from the right pane.

The splitter between panes can be dragged; double-click it to reset to 50/50. `Tab` focuses it,
arrow keys resize, `Home` or `Enter` resets.

## Development

```bash
npm install
npm run dev              # dev server with a Web Worker build, http://localhost:5173/dev.html
npm run build:standalone # rebuild assets/, dev.html and unminify-single.html
npm run build            # standalone build + type check + Vite dist/
npm test                 # 118 tests
npm run typecheck        # tsc --noEmit
```

### Generated files

| File | Built from |
| --- | --- |
| `assets/formatter.css` | `src/styles.css` |
| `assets/formatter.js` + `.map` | `src/standalone.ts` (unminified, with source map) |
| `dev.html` | `index.html` |
| `unminify-single.html` | `index.html` + inlined CSS and JS |

`index.html` is the source of the markup — it is never overwritten by the build.

## Project structure

```
index.html                     entry point, edited by hand
assets/                        generated CSS and JS bundle
unminify-single.html           single-file build
src/
  app.ts                       UI logic, panes, splitter, actions
  detect.ts                    language detection heuristics
  format-transport.ts          worker or main-thread transport
  formatter-client.ts          client for the formatter
  standalone.ts                entry for the file:// build
  main.ts                      entry for the dev server build
  styles.css                   styles
  formatter/
    devtools/                  JS, JSON, CSS, HTML formatters
    shims/                     small adapters for the bundled dependencies
tests/                         unit tests, including the original formatter suites
scripts/build-standalone.mjs   static build script
```

## How it works

JavaScript is parsed with [acorn](https://github.com/acornjs/acorn) and printed from the token
stream, so comments, regular expressions and template literals survive untouched. CSS and HTML
are tokenized with CodeMirror 5 language modes. JSON is parsed and re-indented while keeping the
original key order and string spelling.

The formatters in `src/formatter` derive from the open-source Chromium formatter
(BSD-3-Clause), so the output matches the pretty-print built into the browser. The adaptations
are import paths, the dependency shims in `src/formatter/shims`, and an `error` field so failures
can be shown in the UI. The formatting logic itself is unchanged.

## Tests

```bash
npm test
```

The suite covers the formatter implementations (including the upstream formatter tests), language
detection, the worker environment, and the built `index.html` executed in jsdom over `file://`.

## Limitations

- `Auto` mode guesses the language; pick it manually when the guess is wrong.
- TypeScript and JSX must be transpiled first.
- No source maps are produced; the mapping is only used for counters.
- Clipboard access on `file://` falls back to `document.execCommand('copy')` in some browsers.

## License

The tool itself is released under the [MIT License](LICENSE). Third-party code in
`src/formatter` is distributed under BSD-3-Clause; see [NOTICE](NOTICE).

Bundled dependencies: [acorn](https://github.com/acornjs/acorn) (MIT) and
[CodeMirror 5](https://github.com/codemirror/codemirror5) (MIT).
