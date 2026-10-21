import {getFormatter} from './format-transport.js';
import {LANGUAGE_LABELS, languageForMimeType, mimeTypeFor, type SupportedLanguage} from './detect.js';
import {FormattableMediaTypes} from './formatter/devtools/types.js';

const $ = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Element #${id} not found`);
  }
  return element as T;
};

const input = $<HTMLTextAreaElement>('input');
const output = $<HTMLTextAreaElement>('output');
const inputGutter = $<HTMLDivElement>('input-gutter');
const outputGutter = $<HTMLDivElement>('output-gutter');
const languageSelect = $<HTMLSelectElement>('language');
const indentSelect = $<HTMLSelectElement>('indent');
const formatButton = $<HTMLButtonElement>('format');
const copyButton = $<HTMLButtonElement>('copy');
const downloadButton = $<HTMLButtonElement>('download');
const clearButton = $<HTMLButtonElement>('clear');
const swapButton = $<HTMLButtonElement>('swap');
const status = $<HTMLElement>('status');
const detected = $<HTMLElement>('detected');
const inputMeta = $<HTMLElement>('input-meta');
const outputMeta = $<HTMLElement>('output-meta');
const toast = $<HTMLElement>('toast');
const panes = $<HTMLElement>('panes');
const splitter = $<HTMLElement>('splitter');

let currentMimeType: string = FormattableMediaTypes.TEXT_JAVASCRIPT;
let lastFormatted = '';

/* ---------- Нумерация строк и синхронизация прокрутки ---------- */

function lineCount(text: string): number {
  if (!text) {
    return 1;
  }
  let count = 1;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) {
      count++;
    }
  }
  return count;
}

function renderGutter(gutter: HTMLElement, text: string): void {
  const count = lineCount(text);
  let html = '';
  for (let line = 1; line <= count; line++) {
    html += `${line}\n`;
  }
  if (gutter.textContent !== html) {
    gutter.textContent = html;
  }
}

function syncEditor(textarea: HTMLTextAreaElement, gutter: HTMLElement): void {
  renderGutter(gutter, textarea.value);
  gutter.scrollTop = textarea.scrollTop;
}

function attachEditor(textarea: HTMLTextAreaElement, gutter: HTMLElement): void {
  textarea.addEventListener('scroll', () => {
    gutter.scrollTop = textarea.scrollTop;
  });
  textarea.addEventListener('input', () => {
    renderGutter(gutter, textarea.value);
    updateInputMeta();
  });
  renderGutter(gutter, textarea.value);
}

/* ---------- Метрики ---------- */

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const byteLength = (text: string): number => new TextEncoder().encode(text).length;

const lineMeta = (lines: number, size: string): string =>
    `${lines} ${lines === 1 ? 'line' : 'lines'} · ${size}`;

function updateInputMeta(): void {
  const value = input.value;
  inputMeta.textContent = lineMeta(lineCount(value), formatBytes(byteLength(value)));
}

function updateOutputMeta(): void {
  outputMeta.textContent = lastFormatted ?
      lineMeta(lineCount(lastFormatted), formatBytes(byteLength(lastFormatted))) :
      '—';
}

/* ---------- Статус / тост ---------- */

function setStatus(message: string, isError = false): void {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

let toastTimer = 0;
function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1800);
}


/* ---------- Форматирование ---------- */

function selectedLanguage(): SupportedLanguage {
  return languageSelect.value as SupportedLanguage;
}

function updateDetected(): void {
  const language = selectedLanguage();
  const mimeType = mimeTypeFor(language, input.value);
  currentMimeType = mimeType;
  if (!input.value.trim()) {
    detected.textContent = '';
    return;
  }
  const resolved = languageForMimeType(mimeType);
  detected.textContent = language === 'auto' ?
      `detected: ${LANGUAGE_LABELS[resolved]} (${mimeType})` :
      mimeType;
}

async function runFormat(): Promise<void> {
  const source = input.value;
  if (!source.trim()) {
    showToast('Paste some code to format');
    input.focus();
    return;
  }

  updateDetected();

  const indent = indentSelect.value;

  formatButton.disabled = true;
  setStatus('Formatting…');

  const started = performance.now();
  try {
    const result = await getFormatter().format({
      id: 0,
      mimeType: currentMimeType,
      text: source,
      indent,
    });

    output.value = result.content;
    lastFormatted = result.content;
    syncEditor(output, outputGutter);
    updateOutputMeta();

    if (result.error) {
      setStatus(`Parse error: ${result.error}`, true);
      showToast('The code has a syntax error — showing the original text');
    } else {
      const elapsed = Math.round(performance.now() - started);
      const points = Math.max(0, result.mapping.original.length - 1);
      setStatus(`Done in ${elapsed} ms · ${points} mapping points`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(`Error: ${message}`, true);
  } finally {
    formatButton.disabled = false;
  }
}

/* ---------- Действия ---------- */

async function copyOutput(): Promise<void> {
  if (!output.value) {
    showToast('Nothing to copy');
    return;
  }
  try {
    await navigator.clipboard.writeText(output.value);
    showToast('Copied');
  } catch {
    output.select();
    document.execCommand('copy');
    showToast('Copied');
  }
}

function downloadOutput(): void {
  if (!output.value) {
    showToast('Nothing to download');
    return;
  }
  const extensions: Record<string, string> = {
    [FormattableMediaTypes.TEXT_JAVASCRIPT]: 'js',
    [FormattableMediaTypes.APPLICATION_JSON]: 'json',
    [FormattableMediaTypes.APPLICATION_MANIFEST_JSON]: 'json',
    [FormattableMediaTypes.TEXT_HTML]: 'html',
    [FormattableMediaTypes.TEXT_CSS]: 'css',
  };
  const extension = extensions[currentMimeType] ?? 'txt';
  const blob = new Blob([output.value], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `formatted.${extension}`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ---------- Разделитель панелей ---------- */

const SPLIT_STORAGE_KEY = 'unminify:split';
const SPLIT_MIN = 0.15;
const SPLIT_MAX = 0.85;
const SPLIT_STEP = 0.02;

/** На узких экранах панели стоят друг под другом (см. media query в styles.css). */
function isStacked(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 900px)').matches;
}

function loadSplit(): number {
  try {
    const raw = window.localStorage.getItem(SPLIT_STORAGE_KEY);
    const value = raw === null ? Number.NaN : Number.parseFloat(raw);
    if (Number.isFinite(value) && value >= SPLIT_MIN && value <= SPLIT_MAX) {
      return value;
    }
  } catch {
    // localStorage может быть недоступен (file://, приватный режим) — не критично.
  }
  return 0.5;
}

function saveSplit(): void {
  try {
    window.localStorage.setItem(SPLIT_STORAGE_KEY, splitRatio.toFixed(4));
  } catch {
    // см. loadSplit()
  }
}

let splitRatio = loadSplit();
let isDragging = false;

function applySplit(): void {
  panes.style.setProperty('--split', `${(splitRatio * 100).toFixed(2)}%`);
  splitter.setAttribute('aria-valuenow', String(Math.round(splitRatio * 100)));
}

function setSplit(ratio: number): void {
  splitRatio = Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, ratio));
  applySplit();
}

function ratioFromPointer(event: PointerEvent): number {
  const rect = panes.getBoundingClientRect();
  const stacked = isStacked();
  const size = stacked ? rect.height : rect.width;
  if (!size) {
    return splitRatio;
  }
  const offset = stacked ? event.clientY - rect.top : event.clientX - rect.left;
  return offset / size;
}

splitter.addEventListener('pointerdown', event => {
  if (event.button !== 0) {
    return;
  }
  isDragging = true;
  try {
    splitter.setPointerCapture(event.pointerId);
  } catch {
    // некоторые браузеры не поддерживают capture — drag всё равно работает
  }
  document.body.classList.add('resizing');
  event.preventDefault();
});

splitter.addEventListener('pointermove', event => {
  if (!isDragging) {
    return;
  }
  setSplit(ratioFromPointer(event));
});

function endDrag(event: PointerEvent): void {
  if (!isDragging) {
    return;
  }
  isDragging = false;
  document.body.classList.remove('resizing');
  try {
    if (splitter.hasPointerCapture(event.pointerId)) {
      splitter.releasePointerCapture(event.pointerId);
    }
  } catch {
    // ignore
  }
  saveSplit();
}

splitter.addEventListener('pointerup', endDrag);
splitter.addEventListener('pointercancel', endDrag);

splitter.addEventListener('dblclick', () => {
  setSplit(0.5);
  saveSplit();
});

splitter.addEventListener('keydown', event => {
  const increaseKey = isStacked() ? 'ArrowDown' : 'ArrowRight';
  const decreaseKey = isStacked() ? 'ArrowUp' : 'ArrowLeft';
  if (event.key === increaseKey) {
    event.preventDefault();
    setSplit(splitRatio + SPLIT_STEP);
    saveSplit();
  } else if (event.key === decreaseKey) {
    event.preventDefault();
    setSplit(splitRatio - SPLIT_STEP);
    saveSplit();
  } else if (event.key === 'Home' || event.key === 'Enter') {
    event.preventDefault();
    setSplit(0.5);
    saveSplit();
  }
});

applySplit();

/* ---------- Инициализация ---------- */

attachEditor(input, inputGutter);
attachEditor(output, outputGutter);

formatButton.addEventListener('click', () => {
  void runFormat();
});

input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    void runFormat();
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    input.setRangeText(indentSelect.value, input.selectionStart, input.selectionEnd, 'end');
  }
});

input.addEventListener('input', updateDetected);
languageSelect.addEventListener('change', updateDetected);
indentSelect.addEventListener('change', () => {
  input.style.tabSize = indentSelect.value === '\t' ? '1' : '4';
});
copyButton.addEventListener('click', () => {
  void copyOutput();
});
downloadButton.addEventListener('click', downloadOutput);
clearButton.addEventListener('click', () => {
  input.value = '';
  output.value = '';
  lastFormatted = '';
  syncEditor(input, inputGutter);
  syncEditor(output, outputGutter);
  updateInputMeta();
  updateOutputMeta();
  setStatus('Ready');
  detected.textContent = '';
  input.focus();
});
swapButton.addEventListener('click', () => {
  const swap = input.value;
  input.value = output.value;
  output.value = swap;
  lastFormatted = output.value;
  syncEditor(input, inputGutter);
  syncEditor(output, outputGutter);
  updateInputMeta();
  updateOutputMeta();
  updateDetected();
});

updateInputMeta();
updateOutputMeta();
setStatus('Ready');
