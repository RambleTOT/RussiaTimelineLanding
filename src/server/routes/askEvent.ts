import type { IncomingMessage, ServerResponse } from 'node:http';
import { AskEventRequestSchema, type AskEventRequest } from '../../lib/validators';
import { streamAnswer, describeOpenAiError } from '../openai';

export interface AskEventHandlerConfig {
  apiKey?: string;
  model?: string;
}

const DEFAULT_MODEL = 'gpt-4.1-mini';
const BODY_LIMIT = 100_000; // bytes

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function writeStreamHeaders(res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error('Тело запроса слишком большое'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Некорректный JSON'));
      }
    });
    req.on('error', reject);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Streamed fallback when no API key is configured — keeps the UX testable. */
async function streamDemoAnswer(res: ServerResponse, payload: AskEventRequest): Promise<void> {
  writeStreamHeaders(res);
  const message =
    `⚠️ Демонстрационный режим: ключ OPENAI_API_KEY не настроен на сервере.\n\n` +
    `Чтобы получать реальные ответы ИИ, добавьте ключ в файл .env:\n` +
    `OPENAI_API_KEY=ваш_ключ\n\n` +
    `Ваш вопрос: «${payload.question}»\n` +
    `Событие: «${payload.eventTitle}» (${payload.year}, ${payload.category}).\n\n` +
    `ИИ может ошибаться. Сверяйте важные факты с источниками.`;

  for (const token of message.split(/(\s+)/)) {
    res.write(token);
    await sleep(8);
  }
  res.end();
}

/**
 * Framework-agnostic Node handler for POST /api/ask-event.
 * Works as Vite/Connect middleware and as an Express route. The OpenAI key
 * lives only here, on the server — it is never sent to the browser.
 */
export function createAskEventHandler(config: AskEventHandlerConfig) {
  const model = config.model?.trim() || DEFAULT_MODEL;
  const apiKey = config.apiKey?.trim();

  return async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, { error: 'Метод не поддерживается' });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendJson(res, 400, { error: err instanceof Error ? err.message : 'Некорректный запрос' });
      return;
    }

    const parsed = AskEventRequestSchema.safeParse(body);
    if (!parsed.success) {
      sendJson(res, 400, {
        error: `Проверьте параметры запроса: ${parsed.error.issues
          .map((i) => i.message)
          .join('; ')}`,
      });
      return;
    }
    const payload = parsed.data;

    // No key → graceful streamed demo notice.
    if (!apiKey) {
      await streamDemoAnswer(res, payload);
      return;
    }

    const controller = new AbortController();
    res.on('close', () => controller.abort());

    try {
      let started = false;
      for await (const delta of streamAnswer(payload, { apiKey, model }, controller.signal)) {
        if (!started) {
          started = true;
          writeStreamHeaders(res);
        }
        res.write(delta);
      }
      if (!started) {
        writeStreamHeaders(res);
        res.write('Не удалось сформировать ответ. Попробуйте переформулировать вопрос.');
      }
      res.end();
    } catch (error) {
      if (controller.signal.aborted) {
        res.end();
        return;
      }
      if (!res.headersSent) {
        sendJson(res, 502, { error: describeOpenAiError(error) });
      } else {
        res.end();
      }
    }
  };
}
