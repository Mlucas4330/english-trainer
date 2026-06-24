export function OptionBtn({ state, onClick, children }) {
  const correct = state === "correct", wrong = state === "wrong", dim = state === "dim";
  const cls = correct ? "border-accent bg-accent/[0.05] text-ink"
    : wrong ? "border-line text-muted line-through"
    : dim ? "border-line text-muted opacity-60"
    : "border-line text-ink hover:border-ink";
  return (
    <button onClick={onClick} disabled={state !== "idle"}
      className={`flex w-full items-start gap-2 rounded-xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors ${cls}`}>
      {(correct || wrong) && <span className="font-medium text-accent">{correct ? "✓" : "✕"}</span>}
      <span>{children}</span>
    </button>
  );
}

export function optState(show, right, isPicked) {
  if (!show) return "idle";
  if (right) return "correct";
  if (isPicked) return "wrong";
  return "dim";
}
