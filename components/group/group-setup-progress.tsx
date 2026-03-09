const STEPS = [
  { n: 1, label: "Details" },
  { n: 2, label: "Privacy" },
  { n: 3, label: "Invite" },
] as const;

export function GroupSetupProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = s.n < step;
        const active = s.n === step;
        return (
          <div key={s.n} className="flex items-center">
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
                {done ? "✓" : s.n}
              </div>
              <span
                className={`text-xs ${
                  active ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-4 mx-2 h-px w-8 ${done ? "bg-primary/40" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
