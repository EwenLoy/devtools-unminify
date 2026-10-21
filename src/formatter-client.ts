import {format} from './formatter/devtools/FormatterWorker.js';
import type {FormatResult} from './formatter/devtools/types.js';
import type {Formatter, FormatRequest} from './format-transport.js';
import type {FormatResponse} from './formatter/worker.js';

/**
 * Обёртка над воркером: тот же API, что у FormatterWorker.format(),
 * но выполняется в фоновом потоке. Если воркер недоступен (например, при
 * открытии через file://), форматирование выполняется на главном потоке —
 * результат идентичен, потому что используется один и тот же код.
 */
export class FormatterClient implements Formatter {
  #worker: Worker|null = null;
  #nextId = 1;
  #pending = new Map<number, (result: FormatResult) => void>();

  constructor() {
    if (typeof Worker === 'undefined' || globalThis.location?.protocol === 'file:') {
      return;
    }
    try {
      this.#worker = new Worker(new URL('./formatter/worker.ts', import.meta.url), {type: 'module'});
      this.#worker.onmessage = (event: MessageEvent<FormatResponse>) => {
        const resolve = this.#pending.get(event.data.id);
        if (resolve) {
          this.#pending.delete(event.data.id);
          resolve(event.data.result);
        }
      };
      this.#worker.onerror = () => {
        this.#worker?.terminate();
        this.#worker = null;
        for (const resolve of this.#pending.values()) {
          resolve({mapping: {original: [0], formatted: [0]}, content: '', error: 'Formatter is unavailable'});
        }
        this.#pending.clear();
      };
    } catch {
      this.#worker = null;
    }
  }

  async format(request: FormatRequest): Promise<FormatResult> {
    if (!this.#worker) {
      return format(request.mimeType, request.text, request.indent);
    }
    const id = this.#nextId++;
    return await new Promise<FormatResult>(resolve => {
      this.#pending.set(id, resolve);
      this.#worker?.postMessage({...request, id});
    });
  }
}

