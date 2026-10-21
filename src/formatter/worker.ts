// Веб-воркер форматтера. В DevTools это front_end/entrypoints/formatter_worker/formatter_worker.ts.
// Мы запускаем тот же код в Web Worker, чтобы UI не блокировался на больших файлах.

import './shims/dom-stub.js';

import {format} from './devtools/FormatterWorker.js';
import type {FormatResult} from './devtools/types.js';

export interface FormatRequest {
  id: number;
  mimeType: string;
  text: string;
  indent: string;
}

export interface FormatResponse {
  id: number;
  result: FormatResult;
}

self.onmessage = (event: MessageEvent<FormatRequest>) => {
  const {id, mimeType, text, indent} = event.data;
  const result = format(mimeType, text, indent);
  (self as unknown as Worker).postMessage({id, result} satisfies FormatResponse);
};
