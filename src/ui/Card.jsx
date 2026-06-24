export function Card({ children, tone = "default", className = "" }) {
  const tones = {
    default: "border-line bg-white",
    dark: "border-ink bg-ink text-paper",
    soft: "border-line bg-soft",
  };
  return <div className={`rounded-2xl border ${tones[tone]} p-6 ${className}`}>{children}</div>;
}
