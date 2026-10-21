// Copyright 2011 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Platform from '../shims/platform.js';
import {CodeMirror} from '../shims/codemirror.js';
import {type FormatResult, FormattableMediaTypes} from './types.js';

import {CSSFormatter} from './CSSFormatter.js';
import {FormattedContentBuilder} from './FormattedContentBuilder.js';
import {HTMLFormatter} from './HTMLFormatter.js';
import {IdentityFormatter} from './IdentityFormatter.js';
import {JavaScriptFormatter} from './JavaScriptFormatter.js';
import {JSONFormatter} from './JSONFormatter.js';


export interface Chunk {
  chunk: unknown[];
  isLastChunk: boolean;
}

export type ChunkCallback = (arg0: Chunk) => void;

export type TokenizerCallback = (value: string, style: string|null, start: number, end: number) =>
    Object|undefined|void;

/**
 * A tokenizer function returned by {@link createTokenizer}.
 *
 * @param line The string content to tokenize.
 * @param callback A callback function invoked for each token parsed.
 * @param startOffset An optional offset pointing to where tokenization should start within
 * the line, avoiding the need to allocate substrings when tokenizing a block inside a larger file.
 */
export type Tokenizer = (line: string, callback: TokenizerCallback, startOffset?: number) => void;

/**
 * Creates a tokenizer for the specified MIME type.
 */
export function createTokenizer(mimeType: string): Tokenizer {
  const mode = CodeMirror.getMode({indentUnit: 2}, mimeType);

  if (!mode || mode.name === 'null') {
    throw new Error(`Could not find CodeMirror mode for MimeType: ${mimeType}`);
  }

  if (!mode.token) {
    throw new Error(`Could not find CodeMirror mode with token method: ${mimeType}`);
  }

  const token = mode.token;
  const state = CodeMirror.startState(mode);

  return (line: string,
          callback: (arg0: string, arg1: string|null, arg2: number, arg3: number) => void|Object|undefined,
          startOffset = 0) => {
    const stream = new CodeMirror.StringStream(line);
    if (startOffset) {
      stream.pos = startOffset;
      stream.start = startOffset;
    }
    while (!stream.eol()) {
      const style = token.call(mode, stream, state) ?? null;
      const value = stream.current();
      if (callback(value, style, stream.start, stream.start + value.length) === AbortTokenization) {
        return;
      }
      stream.start = stream.pos;
    }
  };
}


export const AbortTokenization = {};

export function format(mimeType: string, text: string, indentString?: string): FormatResult {
  // Default to a 4-space indent.
  indentString = indentString || '    ';

  let result: FormatResult;
  const builder = new FormattedContentBuilder(indentString);
  const lineEndings = Platform.StringUtilities.findLineEndingIndexes(text);
  try {
    switch (mimeType) {
      case FormattableMediaTypes.TEXT_HTML: {
        const formatter = new HTMLFormatter(builder);
        formatter.format(text, lineEndings);
        break;
      }
      case FormattableMediaTypes.TEXT_CSS: {
        const formatter = new CSSFormatter(builder);
        formatter.format(text, lineEndings, 0, text.length);
        break;
      }
      case FormattableMediaTypes.APPLICATION_JAVASCRIPT:
      case FormattableMediaTypes.TEXT_JAVASCRIPT: {
        const formatter = new JavaScriptFormatter(builder);
        formatter.format(text, lineEndings, 0, text.length);
        break;
      }
      case FormattableMediaTypes.APPLICATION_JSON:
      case FormattableMediaTypes.APPLICATION_MANIFEST_JSON: {
        const formatter = new JSONFormatter(builder);
        formatter.format(text, lineEndings, 0, text.length);
        break;
      }
      default: {
        const formatter = new IdentityFormatter(builder);
        formatter.format(text, lineEndings, 0, text.length);
      }
    }
    result = {
      mapping: builder.mapping,
      content: builder.content(),
    };
  } catch (e) {
    console.error(e);
    result = {
      mapping: {original: [0], formatted: [0]},
      content: text,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  return result;
}

