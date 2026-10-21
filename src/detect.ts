import {FormattableMediaTypes} from './formatter/devtools/types.js';

export type SupportedLanguage = 'auto'|'javascript'|'json'|'html'|'css';

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  auto: 'Auto',
  javascript: 'JavaScript',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
};

const MIME_BY_LANGUAGE: Record<Exclude<SupportedLanguage, 'auto'>, string> = {
  javascript: FormattableMediaTypes.TEXT_JAVASCRIPT,
  json: FormattableMediaTypes.APPLICATION_JSON,
  html: FormattableMediaTypes.TEXT_HTML,
  css: FormattableMediaTypes.TEXT_CSS,
};

const EXTENSION_RE = /\.([a-z0-9]+)(?:[?#].*)?$/i;

const MIME_BY_EXTENSION: Record<string, string> = {
  js: FormattableMediaTypes.TEXT_JAVASCRIPT,
  mjs: FormattableMediaTypes.TEXT_JAVASCRIPT,
  cjs: FormattableMediaTypes.TEXT_JAVASCRIPT,
  jsx: FormattableMediaTypes.TEXT_JAVASCRIPT,
  ts: FormattableMediaTypes.TEXT_JAVASCRIPT,
  tsx: FormattableMediaTypes.TEXT_JAVASCRIPT,
  json: FormattableMediaTypes.APPLICATION_JSON,
  map: FormattableMediaTypes.APPLICATION_JSON,
  webmanifest: FormattableMediaTypes.APPLICATION_MANIFEST_JSON,
  css: FormattableMediaTypes.TEXT_CSS,
  html: FormattableMediaTypes.TEXT_HTML,
  htm: FormattableMediaTypes.TEXT_HTML,
  svg: FormattableMediaTypes.TEXT_HTML,
  xml: FormattableMediaTypes.TEXT_HTML,
};

/**
 * DevTools определяет тип ресурса по MIME из ответа сервера (`NetworkRequest.mimeType`).
 * В веб-версии MIME нет, поэтому эвристика повторяет логику DevTools для случая
 * «неизвестный тип»: сначала JSON, потом JS, потом HTML/CSS.
 */
export function detectMimeType(text: string, fileName?: string): string {
  if (fileName) {
    const match = EXTENSION_RE.exec(fileName.trim());
    const byExtension = match && MIME_BY_EXTENSION[match[1].toLowerCase()];
    if (byExtension) {
      return byExtension;
    }
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return FormattableMediaTypes.TEXT_JAVASCRIPT;
  }

  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && isJson(trimmed)) {
    return FormattableMediaTypes.APPLICATION_JSON;
  }

  const head = trimmed.slice(0, 512).toLowerCase();
  if (head.startsWith('<!doctype html') || head.startsWith('<html') || /^<[a-z!]/.test(head)) {
    return FormattableMediaTypes.TEXT_HTML;
  }

  if (/^(?:\/\*|@(?:media|import|charset|font-face|keyframes|supports|page|namespace)|[.#]?[a-z-]+\s*\{)/i.test(trimmed) ||
      /^[^{}]*\{[^{}]*[a-z-]+\s*:[^{}]*\}/i.test(trimmed.slice(0, 2048)) && !/[;=]\s*function\b/.test(head)) {
    return FormattableMediaTypes.TEXT_CSS;
  }

  return FormattableMediaTypes.TEXT_JAVASCRIPT;
}

export function mimeTypeFor(language: SupportedLanguage, text: string, fileName?: string): string {
  return language === 'auto' ? detectMimeType(text, fileName) : MIME_BY_LANGUAGE[language];
}

export function languageForMimeType(mimeType: string): Exclude<SupportedLanguage, 'auto'> {
  switch (mimeType) {
    case FormattableMediaTypes.APPLICATION_JSON:
    case FormattableMediaTypes.APPLICATION_MANIFEST_JSON:
      return 'json';
    case FormattableMediaTypes.TEXT_HTML:
      return 'html';
    case FormattableMediaTypes.TEXT_CSS:
      return 'css';
    default:
      return 'javascript';
  }
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
