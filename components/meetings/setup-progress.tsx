const STEPS = [
  { n: 1, label: "Basics" },
  { n: 2, label: "When" },
  { n: 3, label: "Topic" },
  { n: 4, label: "Bring list" },
];

export function SetupProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = step.n < current;
        const active = step.n === current;
        return (
          <div key={step.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-glow text-ink"
                      : "border-2 border-muted text-muted-foreground"
                }`}
              >
                {done ? "✓" : step.n}
              </div>
              <span
                className={`text-xs ${
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-4 mx-2 h-px w-8 ${
                  done ? "bg-primary/40" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
