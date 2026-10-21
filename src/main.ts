// Точка входа для dev-сервера / обычного сайта: UI + Web Worker.
// `main.ts` используется в index.html (Vite), поэтому здесь можно import.meta.

import './app.js';
import {setFormatter} from './format-transport.js';
import {FormatterClient} from './formatter-client.js';

setFormatter(new FormatterClient());
