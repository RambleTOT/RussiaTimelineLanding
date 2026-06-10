import OpenAI from 'openai';
import type { AskEventRequest } from '../lib/validators';

/** System prompt — neutral historical assistant, Russian, no invented sources. */
export const SYSTEM_PROMPT = `Ты — исторический помощник. Отвечай аккуратно, нейтрально и понятно.
Используй только контекст события, переданный пользователем, и общедоступные исторические сведения.
Не выдумывай источники. Если не уверен — прямо скажи об этом.
Отвечай на русском языке.`;

/** Compose the user message: event context + the user's question. */
export function buildUserMessage(p: AskEventRequest): string {
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

export interface CompletionConfig {
  apiKey: string;
  model: string;
}

/** Stream the assistant answer as text deltas. */
export async function* streamAnswer(
  payload: AskEventRequest,
  config: CompletionConfig,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const client = new OpenAI({ apiKey: config.apiKey });

  const stream = await client.chat.completions.create(
    {
      model: config.model,
      temperature: 0.4,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(payload) },
      ],
    },
    { signal },
  );

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/** Translate SDK errors into a safe, user-facing Russian message (no secrets). */
export function describeOpenAiError(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) return 'Неверный или отсутствующий API-ключ OpenAI на сервере.';
    if (error.status === 429) return 'Превышен лимит запросов к OpenAI. Попробуйте позже.';
    if (error.status && error.status >= 500) return 'Сервис OpenAI временно недоступен.';
    return 'Ошибка запроса к OpenAI.';
  }
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка сервера.';
}
