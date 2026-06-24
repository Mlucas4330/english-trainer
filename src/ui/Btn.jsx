export function Btn({ children, onClick, kind = "primary", disabled, className = "" }) {
  const base = "flex w-fit items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = kind === "primary"
    ? "bg-ink text-paper hover:bg-accent"
    : "border border-line text-ink hover:border-ink";
  return <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>{children}</button>;
}
