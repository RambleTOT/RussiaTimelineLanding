import { useMutation } from '@tanstack/react-query';
import { streamAskEvent, type AskEventPayload } from '@/lib/api';

interface AskArgs {
  payload: AskEventPayload;
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

/** react-query mutation that drives the streamed AI answer. */
export function useAskEvent() {
  return useMutation<string, Error, AskArgs>({
    mutationFn: ({ payload, onToken, signal }) => streamAskEvent(payload, { onToken, signal }),
  });
}
