import { Card } from "./Card.jsx";
import { Tag } from "./Tag.jsx";
import { SoftNote } from "./SoftNote.jsx";

export const VERDICTS = {
  correct: { label: "spot on", cls: "text-accent" },
  close: { label: "almost there", cls: "text-ink" },
  off: { label: "let's fix this", cls: "text-muted" },
};

export function FeedbackCard({ feedback }) {
  const v = VERDICTS[feedback.verdict] || VERDICTS.close;
  return (
    <Card className="space-y-4">
      <div className="flex items-baseline gap-2.5">
        <Tag>feedback</Tag>
        <span className={`font-serif text-lg ${v.cls}`}>{v.label}</span>
      </div>
      {feedback.corrected && (
        <div>
          <Tag>natural version</Tag>
          <p className="mt-1.5 font-serif text-xl leading-snug">“{feedback.corrected}”</p>
        </div>
      )}
      {feedback.errors && feedback.errors.length > 0 && (
        <div>
          <Tag>what to fix</Tag>
          <ul className="mt-2 space-y-2.5 text-[15px]">
            {feedback.errors.map((e, i) => (
              <li key={i} className="space-y-0.5">
                <span className="text-muted line-through">{e.wrong}</span>
                <span className="mx-2 text-accent">→</span>
                <span className="font-medium">{e.right}</span>
                <p className="text-sm leading-relaxed text-muted">{e.why}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {feedback.note && <SoftNote heading="note.">{feedback.note}</SoftNote>}
    </Card>
  );
}
