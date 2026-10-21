// Точка входа standalone-сборки (unminify.html): открывается двойным кликом по file://.
//
// Здесь НЕТ Web Worker и нет ES-модулей: скрипт собирается esbuild-ом в один IIFE-файл
// и инлайнится в HTML. Форматирование выполняется на главном потоке тем же
// сгенерированным кодом DevTools, что и в воркере, — результат идентичен.

import './app.js';
import {setFormatter} from './format-transport.js';
import {format} from './formatter/devtools/FormatterWorker.js';

setFormatter({
  format: async request => format(request.mimeType, request.text, request.indent),
});
