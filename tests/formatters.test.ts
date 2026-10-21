import {describe, expect, it} from 'vitest';

import {detectMimeType, languageForMimeType} from '../src/detect.js';
import {format} from '../src/formatter/devtools/FormatterWorker.js';
import {FormattableMediaTypes} from '../src/formatter/devtools/types.js';

describe('CSSFormatter', () => {
  it('formats minified css', () => {
    const result = format(FormattableMediaTypes.TEXT_CSS, 'body{margin:0;color:red}', '  ');
    expect(result.content).toBe('body {\n  margin: 0;\n  color: red\n}\n');
  });

  it('keeps comments', () => {
    const result = format(FormattableMediaTypes.TEXT_CSS, '/* hi */a{color:red}', '  ');
    expect(result.content).toBe('/* hi */\na {\n  color: red\n}\n');
  });
});

describe('HTMLFormatter', () => {
  it('formats minified html', () => {
    const result = format(
        FormattableMediaTypes.TEXT_HTML,
        '<div class="a"><span>text</span></div>',
        '  ',
    );
    expect(result.content).toBe('<div class="a">\n  <span>text</span>\n</div>\n');
  });

  it('formats html with inline script', () => {
    const result = format(
        FormattableMediaTypes.TEXT_HTML,
        '<div><script>var a=1;</script></div>',
        '  ',
    );
    expect(result.content).toContain('<script>');
    expect(result.content).toContain('var a = 1;');
  });
});

describe('IdentityFormatter', () => {
  it('returns unknown mime types untouched', () => {
    const text = 'a\nb\n';
    const result = format('text/plain', text, '  ');
    expect(result.content).toBe(text);
    expect(result.error).toBeUndefined();
  });
});

describe('formatter error handling', () => {
  it('reports syntax errors and returns the source text', () => {
    const text = 'var = ;';
    const result = format(FormattableMediaTypes.TEXT_JAVASCRIPT, text, '  ');
    expect(result.content).toBe(text);
    expect(result.error).toBeTruthy();
  });
});

describe('detectMimeType', () => {
  it('detects json', () => {
    expect(detectMimeType('{"a":1}')).toBe(FormattableMediaTypes.APPLICATION_JSON);
  });

  it('detects javascript', () => {
    expect(detectMimeType('function f(){return 1}')).toBe(FormattableMediaTypes.TEXT_JAVASCRIPT);
  });

  it('detects html', () => {
    expect(detectMimeType('<!doctype html><html></html>')).toBe(FormattableMediaTypes.TEXT_HTML);
  });

  it('detects css', () => {
    expect(detectMimeType('body{margin:0}')).toBe(FormattableMediaTypes.TEXT_CSS);
  });

  it('prefers file extension', () => {
    expect(detectMimeType('{"a":1}', 'bundle.css')).toBe(FormattableMediaTypes.TEXT_CSS);
  });

  it('maps mime type back to language', () => {
    expect(languageForMimeType(FormattableMediaTypes.APPLICATION_MANIFEST_JSON)).toBe('json');
    expect(languageForMimeType(FormattableMediaTypes.TEXT_HTML)).toBe('html');
    expect(languageForMimeType(FormattableMediaTypes.TEXT_CSS)).toBe('css');
    expect(languageForMimeType(FormattableMediaTypes.TEXT_JAVASCRIPT)).toBe('javascript');
  });
});
