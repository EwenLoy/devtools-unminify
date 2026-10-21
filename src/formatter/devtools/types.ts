// Copyright 2020 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Адаптированная копия front_end/entrypoints/formatter_actions/formatter_actions.ts.
// `const enum` заменён на обычный `enum`, чтобы esbuild/Vite собирали модуль без
// дополнительной настройки `preserveConstEnums`.

export enum FormatterActions {
  FORMAT = 'format',
  PARSE_CSS = 'parseCSS',
  JAVASCRIPT_SUBSTITUTE = 'javaScriptSubstitute',
  JAVASCRIPT_SCOPE_TREE = 'javaScriptScopeTree',
}

export enum FormattableMediaTypes {
  APPLICATION_JAVASCRIPT = 'application/javascript',
  APPLICATION_JSON = 'application/json',
  APPLICATION_MANIFEST_JSON = 'application/manifest+json',
  TEXT_CSS = 'text/css',
  TEXT_HTML = 'text/html',
  TEXT_JAVASCRIPT = 'text/javascript',
}

export const FORMATTABLE_MEDIA_TYPES: string[] = [
  FormattableMediaTypes.APPLICATION_JAVASCRIPT,
  FormattableMediaTypes.APPLICATION_JSON,
  FormattableMediaTypes.APPLICATION_MANIFEST_JSON,
  FormattableMediaTypes.TEXT_CSS,
  FormattableMediaTypes.TEXT_HTML,
  FormattableMediaTypes.TEXT_JAVASCRIPT,
];

export interface FormatMapping {
  original: number[];
  formatted: number[];
}

export interface FormatResult {
  content: string;
  mapping: FormatMapping;
  /** Сообщение об ошибке разбора. В DevTools ошибка только логируется, здесь она возвращается в UI. */
  error?: string;
}
