// CodeMirror 5 — это редактор, а не только токенизатор: при загрузке модуль
// обращается к `document.createRange` (см. codemirror.js). В Web Worker `document`
// отсутствует. Для режимов (`CodeMirror.getMode` + `StringStream`) DOM не нужен,
// поэтому достаточно минимальной заглушки. Этот модуль должен импортироваться
// ДО `codemirror`, поэтому он идёт первым импортом в shims/codemirror.ts.

const globalObject = globalThis as unknown as {document?: unknown; navigator?: unknown; window?: unknown};

if (typeof globalObject.navigator === 'undefined') {
  globalObject.navigator = {userAgent: 'worker', platform: ''};
}

if (typeof globalObject.window === 'undefined') {
  globalObject.window = {
    getSelection: undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

if (typeof globalObject.document === 'undefined') {
  const fakeRange = {
    setStart: () => undefined,
    setEnd: () => undefined,
    setStartBefore: () => undefined,
    setStartAfter: () => undefined,
    setEndBefore: () => undefined,
    setEndAfter: () => undefined,
    collapse: () => undefined,
    selectNodeContents: () => undefined,
    compareBoundaryPoints: () => 0,
    cloneRange: () => fakeRange,
    detach: () => undefined,
    getBoundingClientRect: () => ({top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0}),
  };

  globalObject.document = {
    createRange: () => fakeRange,
    createElement: () => ({style: {}, setAttribute: () => undefined, appendChild: () => undefined}),
    createTextNode: () => ({}),
    body: {createTextRange: () => fakeRange},
  };
}
