// Copyright 2014 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Минимальный срез front_end/core/platform/platform.ts, нужный форме рамкам.

export const DEFAULT_COMPARATOR = (a: number|string, b: number|string): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

export const lowerBound = <T>(array: ArrayLike<T>, needle: T, comparator: (a: T, b: T) => number, left = 0,
                              right = array.length): number => {
  while (left < right) {
    const mid = (left + right) >> 1;
    if (comparator(array[mid], needle) < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
};

export const upperBound = <T>(array: ArrayLike<T>, needle: T, comparator: (a: T, b: T) => number, left = 0,
                              right = array.length): number => {
  while (left < right) {
    const mid = (left + right) >> 1;
    if (comparator(array[mid], needle) <= 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
};

export const ArrayUtilities = {
  DEFAULT_COMPARATOR,
  lowerBound,
  upperBound,
};

/**
 * Индексы символов '\n' в строке. Ровно та же семантика, что
 * Platform.StringUtilities.findLineEndingIndexes() в DevTools.
 */
export const findLineEndingIndexes = (text: string): number[] => {
  const lineEndings: number[] = [];
  let position = 0;
  while (position < text.length) {
    const index = text.indexOf('\n', position);
    if (index === -1) {
      break;
    }
    lineEndings.push(index);
    position = index + 1;
  }
  return lineEndings;
};

export const isWhitespace = (input: string): boolean => !/\S/.test(input);

export const StringUtilities = {
  findLineEndingIndexes,
  isWhitespace,
};
