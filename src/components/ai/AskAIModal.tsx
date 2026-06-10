import { useEffect, useRef, useState } from 'react';
import { Send, Square, Sparkles, AlertTriangle, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { SuggestedQuestions } from './SuggestedQuestions';
import { AIAnswer } from './AIAnswer';
import { useAskEvent } from '@/hooks/use-ask-event';
import { getRecentQuestions, addRecentQuestion } from '@/lib/ai-history';
import { EVENT_BY_ID } from '@/lib/events-data';
import { useUiStore } from '@/store/ui-store';
import type { TimelineEvent } from '@/lib/validators';

function AskAIBody({ event }: { event: TimelineEvent }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [recent, setRecent] = useState<string[]>(() => getRecentQuestions());
  const controllerRef = useRef<AbortController | null>(null);
  const mutation = useAskEvent();

  useEffect(() => () => controllerRef.current?.abort(), []);

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || mutation.isPending) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setQuestion(text);
    setAnswer('');
    addRecentQuestion(text);
    setRecent(getRecentQuestions());

    mutation.mutate({
      payload: {
        eventId: event.id,
        eventTitle: event.title,
        year: event.year,
        category: event.category,
        importance: event.importance,
        period: event.period,
        question: text,
      },
      onToken: (chunk) => setAnswer((prev) => prev + chunk),
      signal: controller.signal,
    });
  };

  const stop = () => {
    controllerRef.current?.abort();
    mutation.reset();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(question);
    }
  };

  const errorMessage =
    mutation.isError && mutation.error?.name !== 'AbortError' ? mutation.error.message : null;

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{event.period}</span>
          <CategoryBadge category={event.category} />
        </div>
        <DialogTitle className="mt-1">{event.title}</DialogTitle>
        <DialogDescription>
          Задайте вопрос об этом событии — ответит ИИ-помощник на основе переданного контекста.
        </DialogDescription>
      </DialogHeader>

      <div
        className="-mx-1 max-h-[min(60vh,520px)] space-y-4 overflow-y-auto px-1"
        data-lenis-prevent
      >
        <div className="space-y-2">
          <p className="font-mono text-[11px] tracking-normal text-muted-foreground">
            Быстрые вопросы
          </p>
          <SuggestedQuestions onPick={submit} disabled={mutation.isPending} />
        </div>

        {recent.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-normal text-muted-foreground">
              <History className="size-3.5" aria-hidden />
              Недавние
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.slice(0, 5).map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => submit(q)}
                  className="max-w-full truncate rounded-full bg-foreground/[0.05] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {(answer || mutation.isPending || errorMessage) && (
          <div className="rounded-lg border border-border bg-foreground/[0.04] p-4">
            <AIAnswer answer={answer} isStreaming={mutation.isPending} error={errorMessage} />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Что вы хотите узнать об этом событии?"
            aria-label="Ваш вопрос об этом событии"
            className="resize-none pr-12"
          />
          {mutation.isPending ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={stop}
              aria-label="Остановить"
              className="absolute bottom-2 right-2"
            >
              <Square className="size-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon-sm"
              onClick={() => submit(question)}
              disabled={!question.trim()}
              aria-label="Отправить вопрос"
              className="absolute bottom-2 right-2"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <AlertTriangle className="size-3.5 shrink-0 text-primary/70" aria-hidden />
          ИИ может ошибаться. Сверяйте важные факты с источниками.
        </p>
      </div>
    </>
  );
}

export function AskAIModal() {
  const askEventId = useUiStore((s) => s.askEventId);
  const closeAsk = useUiStore((s) => s.closeAsk);
  const event = askEventId ? EVENT_BY_ID.get(askEventId) : null;

  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && closeAsk()}>
      <DialogContent className="max-w-xl gap-5">
        {event ? (
          <AskAIBody key={event.id} event={event} />
        ) : (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Вопрос ИИ
            </DialogTitle>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}
