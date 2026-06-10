import type { Plugin, Connect } from 'vite';
import { createAskEventHandler, type AskEventHandlerConfig } from './routes/askEvent';

const API_PATH = '/api/ask-event';

/**
 * Vite plugin that mounts the /api/ask-event endpoint on both the dev server
 * and the preview server, so `npm run dev` works out of the box with no
 * separate backend process.
 */
export function apiPlugin(config: AskEventHandlerConfig): Plugin {
  const handler = createAskEventHandler(config);

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? '').split('?')[0];
    if (url !== API_PATH) {
      next();
      return;
    }
    handler(req, res).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Внутренняя ошибка сервера' }));
      } else {
        res.end();
      }
    });
  };

  return {
    name: 'ask-event-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
