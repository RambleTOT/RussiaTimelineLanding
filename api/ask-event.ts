import type { IncomingMessage, ServerResponse } from 'node:http';
import OpenAI from 'openai';
import { z } from 'zod';

/**
 * Vercel serverless function for POST /api/ask-event.
 *
 * NOTE: This file is intentionally self-contained (it imports only `openai` and
 * `zod` from node_modules, no relative `../src` imports). Vercel runs functions
 * as native ESM under `"type": "module"`, where extensionless relative imports
 * fail with ERR_MODULE_NOT_FOUND. The local dev/preview server serves the same
 * endpoint via the shared code in src/server (see vitePlugin.ts).
 *
 * The OpenAI key (OPENAI_API_KEY) is read from the server environment only and
 * is never exposed to the browser. Without a key, a safe demo notice streams.
 */

const DEFAULT_MODEL = 'gpt-4.1-mini';
const BODY_LIMIT = 100_000;

const AskEventRequestSchema = z.object({
  eventId: z.string().min(1),
  eventTitle: z.string().min(1).max(400),
  year: z.number().int().gte(1985).lte(2030),
  category: z.string().min(1).max(120),
  importance: z.string().max(2000).default(''),
  period: z.string().max(60).optional(),
  question: z.string().min(1).max(1000),
});
type AskEventRequest = z.infer<typeof AskEventRequestSchema>;

const SYSTEM_PROMPT = `Ты — исторический помощник. Отвечай аккуратно, нейтрально и понятно.
Используй только контекст события, переданный пользователем, и общедоступные исторические сведения.
Не выдумывай источники. Если не уверен — прямо скажи об этом.
Отвечай на русском языке.`;

function buildUserMessage(p: AskEventRequest): string {
  return [
    'Контекст события:',
    `- Название: ${p.eventTitle}`,
    `- Год начала: ${p.year}`,
    p.period ? `- Период: ${p.period}` : '',
    `- Категория: ${p.category}`,
    p.importance ? `- Почему важно: ${p.importance}` : '',
    '',
    `Вопрос пользователя об этом событии: ${p.question}`,
  ]
    .filter(Boolean)
    .join('\n');
}

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

async function streamDemoAnswer(res: ServerResponse, payload: AskEventRequest): Promise<void> {
  writeStreamHeaders(res);
  const message =
    `⚠️ Демонстрационный режим: ключ OPENAI_API_KEY не настроен на сервере.\n\n` +
    `Чтобы получать реальные ответы ИИ, добавьте ключ в переменные окружения проекта (Vercel → Settings → Environment Variables):\n` +
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

function describeOpenAiError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) return 'Неверный или отсутствующий API-ключ OpenAI на сервере.';
    if (error.status === 429) return 'Превышен лимит запросов к OpenAI. Попробуйте позже.';
    if (error.status && error.status >= 500) return 'Сервис OpenAI временно недоступен.';
    return 'Ошибка запроса к OpenAI.';
  }
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка сервера.';
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Метод не поддерживается' });
    return;
  }

  // Vercel pre-parses JSON into req.body; fall back to reading the raw stream.
  let raw: unknown = req.body;
  if (raw === undefined || raw === '') {
    try {
      raw = await readJsonBody(req);
    } catch (err) {
      sendJson(res, 400, { error: err instanceof Error ? err.message : 'Некорректный запрос' });
      return;
    }
  }
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }

  const parsed = AskEventRequestSchema.safeParse(raw);
  if (!parsed.success) {
    sendJson(res, 400, {
      error: `Проверьте параметры запроса: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    });
    return;
  }
  const payload = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;

  if (!apiKey) {
    await streamDemoAnswer(res, payload);
    return;
  }

  const controller = new AbortController();
  res.on('close', () => controller.abort());

  try {
    const client = new OpenAI({ apiKey });
    const stream = await client.chat.completions.create(
      {
        model,
        temperature: 0.4,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(payload) },
        ],
      },
      { signal: controller.signal },
    );

    let started = false;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        if (!started) {
          started = true;
          writeStreamHeaders(res);
        }
        res.write(delta);
      }
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
}
