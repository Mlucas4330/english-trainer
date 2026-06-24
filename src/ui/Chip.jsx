export function Chip({ on, children, onClick, dim }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${on ? "border-accent bg-accent/[0.08] text-accent" : "border-line text-ink hover:border-ink"} ${dim ? "opacity-40" : ""}`}>
      {children}
    </button>
  );
}
