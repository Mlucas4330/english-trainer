export function SoftNote({ heading, children }) {
  return (
    <div className="rounded-xl border border-line bg-soft p-4 text-[15px] leading-relaxed">
      {heading && <span className="font-serif font-semibold">{heading} </span>}{children}
    </div>
  );
}
