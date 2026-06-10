import type { AskEventRequest } from './validators';

export type AskEventPayload = AskEventRequest;

interface StreamOptions {
  signal?: AbortSignal;
  /** Called with each text chunk as it streams in. */
  onToken?: (chunk: string) => void;
}

/**
 * Calls the backend endpoint POST /api/ask-event and streams the answer.
 * The OpenAI key never touches the client — the server holds it.
 * Returns the full concatenated answer once the stream finishes.
 */
export async function streamAskEvent(
  payload: AskEventPayload,
  { signal, onToken }: StreamOptions = {},
): Promise<string> {
  const response = await fetch('/api/ask-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let message = 'Не удалось получить ответ от сервера.';
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* non-JSON error body — keep default message */
    }
    throw new Error(message);
  }

  // Fallback for non-streaming responses.
  if (!response.body) {
    const text = await response.text();
    onToken?.(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      full += chunk;
      onToken?.(chunk);
    }
  }

  return full;
}
