// @vitest-environment node
// Проверяем, что форматтеры работают в окружении без DOM — так же, как в Web Worker,
// где CodeMirror используется только как токенизатор.

import {describe, expect, it} from 'vitest';

import {format} from '../src/formatter/devtools/FormatterWorker.js';
import {FormattableMediaTypes} from '../src/formatter/devtools/types.js';

describe('formatter без DOM (как в Web Worker)', () => {
  it('окружение действительно без document', () => {
    expect(typeof (globalThis as {document?: unknown}).document).toBe('object');
    expect((globalThis as {document: {createRange?: unknown}}).document.createRange).toBeTypeOf('function');
  });

  it('форматирует JS, не добавляя отсутствующие точки с запятой (как DevTools)', () => {
    const result = format(FormattableMediaTypes.TEXT_JAVASCRIPT, 'const a=1', '  ');
    expect(result.content).toBe('const a = 1\n');
  });

  it('форматирует JS и сохраняет точку с запятой', () => {
    const result = format(FormattableMediaTypes.TEXT_JAVASCRIPT, 'const a=1;', '  ');
    expect(result.content).toBe('const a = 1;\n');
  });

  it('форматирует CSS через CodeMirror-режим', () => {
    const result = format(FormattableMediaTypes.TEXT_CSS, 'a{b:c}', '  ');
    expect(result.content).toBe('a {\n  b: c\n}\n');
  });

  it('форматирует HTML через CodeMirror-режим', () => {
    const result = format(FormattableMediaTypes.TEXT_HTML, '<div><b>x</b></div>', '  ');
    expect(result.content).toBe('<div>\n  <b>x</b>\n</div>\n');
  });
});
