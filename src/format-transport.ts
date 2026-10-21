import type {FormatResult} from './formatter/devtools/types.js';

export interface FormatRequest {
  id?: number;
  mimeType: string;
  text: string;
  indent: string;
}

export interface Formatter {
  format(request: FormatRequest): Promise<FormatResult>;
}

/**
 * Транспорт форматирования. UI не знает, где считается результат:
 * в Web Worker (dev-сервер / обычный сайт) или на главном потоке
 * (standalone-сборка для `file://`). Код форматтера в обоих случаях один и тот же.
 */
let formatter: Formatter|null = null;

export function setFormatter(value: Formatter): void {
  formatter = value;
}

export function getFormatter(): Formatter {
  if (!formatter) {
    throw new Error('Formatter is not initialized');
  }
  return formatter;
}
