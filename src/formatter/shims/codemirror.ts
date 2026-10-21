// Замена front_end/third_party/codemirror/codemirror-legacy.js: DevTools использует
// CodeMirror 5 (@codemirror/runmode + режимы css/xml/javascript) как токенизатор.
// Мы берём тот же CodeMirror 5 из npm вместе с теми же режимами.

// CodeMirror 5 нужен лишь как токенизатор (режимы css/xml/javascript).
// dom-stub обязан выполниться раньше самого CodeMirror — в Web Worker нет `document`.
import './dom-stub.js';

import CodeMirrorLib from 'codemirror';

import 'codemirror/mode/xml/xml.js';
import 'codemirror/mode/css/css.js';
import 'codemirror/mode/javascript/javascript.js';

export interface CodeMirrorStream {
  pos: number;
  start: number;
  current(): string;
  eol(): boolean;
}

export interface CodeMirrorMode {
  name?: string;
  token?: (stream: CodeMirrorStream, state: unknown) => string|null|undefined;
}

export interface CodeMirrorApi {
  getMode(options: Record<string, unknown>, spec: string|object): CodeMirrorMode|null;
  startState(mode: CodeMirrorMode, ...args: unknown[]): unknown;
  StringStream: new (line: string) => CodeMirrorStream;
}

export const CodeMirror = CodeMirrorLib as unknown as CodeMirrorApi;
