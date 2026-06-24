export function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="text-sm">{label || "Thinking…"}</span>
    </div>
  );
}
