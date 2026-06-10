export const SUGGESTED_QUESTIONS = [
  'Почему это событие важно?',
  'Какие были причины?',
  'Какие были последствия?',
  'Объясни простыми словами',
  'Дай контекст в 5 пунктах',
];

interface SuggestedQuestionsProps {
  onPick: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({ onPick, disabled }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_QUESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onPick(q)}
          className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
