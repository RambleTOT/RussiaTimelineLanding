/**
 * Optional standalone production server.
 *   npm run build && npm run server
 * Serves the built `dist/` and the /api/ask-event endpoint.
 * (In development the same endpoint is served by the Vite plugin, so this is
 *  only needed for production-style hosting.)
 */
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import express from 'express';
import { createAskEventHandler } from './routes/askEvent';

const handler = createAskEventHandler({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL,
});

const app = express();

// Raw handler — no body parser, so it can read the stream itself.
app.post('/api/ask-event', (req, res) => {
  handler(req, res).catch(() => {
    if (!res.headersSent) res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    else res.end();
  });
});

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(resolve(distDir, 'index.html')));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`▶ Сервер запущен: http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log('  ⚠ OPENAI_API_KEY не задан — AI работает в демонстрационном режиме.');
  }
});
