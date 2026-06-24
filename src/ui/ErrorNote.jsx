export function ErrorNote({ msg, onRetry }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4 text-sm leading-relaxed text-ink">
      {msg}{" "}
      {onRetry && <button onClick={onRetry} className="font-medium text-accent underline underline-offset-2">Try again</button>}
    </div>
  );
}
