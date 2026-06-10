import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AIAnswerProps {
  answer: string;
  isStreaming: boolean;
  error?: string | null;
}

export function AIAnswer({ answer, isStreaming, error }: AIAnswerProps) {
  if (error) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive-foreground">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="font-medium">Не удалось получить ответ</p>
          <p className="mt-0.5 text-destructive-foreground/80">{error}</p>
        </div>
      </div>
    );
  }

  // Pending with no text yet → skeleton
  if (isStreaming && !answer) {
    return (
      <div className="space-y-2" aria-live="polite" aria-busy="true">
        <Skeleton className="h-3.5 w-[92%]" />
        <Skeleton className="h-3.5 w-[78%]" />
        <Skeleton className="h-3.5 w-[85%]" />
      </div>
    );
  }

  if (!answer) return null;

  return (
    <div
      className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
      aria-live="polite"
    >
      {answer}
      {isStreaming && (
        <span
          className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary align-middle"
          aria-hidden
        />
      )}
    </div>
  );
}
