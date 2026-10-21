// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Замена front_end/third_party/acorn/acorn.ts.
// DevTools вендорит acorn 8.16.0; мы используем тот же acorn из npm,
// поэтому результат разбора (и pretty-print) идентичен.

import {Parser} from 'acorn';

export {defaultOptions, getLineInfo, tokTypes} from 'acorn';
export type {Comment, Node, SourceLocation, Token} from 'acorn';

export {Parser};

export const tokenizer: typeof Parser.tokenizer = Parser.tokenizer.bind(Parser);
export const parse: typeof Parser.parse = Parser.parse.bind(Parser);

/**
 * Типы ESTree-узлов. В DevTools это отдельный estree-legacy.d.ts; в веб-версии
 * достаточно структурных алиасов, потому что все обращения в форматтере идут
 * через динамические поля узлов (`node.type`, `node.start`, `node.end`, ...).
 */
export namespace ESTree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Node = any;
  export type IfStatement = any;
  export type TryStatement = any;
  export type CatchClause = any;
  export type ForStatement = any;
  export type ForInStatement = any;
  export type ForOfStatement = any;
}
