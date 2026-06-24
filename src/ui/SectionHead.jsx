export function SectionHead({ title, subtitle }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-serif text-[28px] leading-tight tracking-tight">{title}</h2>
      <p className="text-[15px] leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}
