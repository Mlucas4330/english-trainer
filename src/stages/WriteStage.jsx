import { useState } from "react";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { INPUT_TEXTAREA } from "../ui/styles.js";
import { secsFor } from "../config/levels.js";

export function WriteStage({ data, level, onDone }) {
  const item = data;
  const [typed, setTyped] = useState("");
  const secs = secsFor(120, level);

  function finish() {
    const req = (item.requirements || []).join("; ");
    onDone({ type: "write", label: "Writing", prompt: item.prompt + (req ? " Requirements: " + req + "." : ""), transcript: typed,
      criteria: "structure, cohesion, grammatical range and task achievement; in the note give a CEFR-style band (B2, B2+, C1) and one focus tip" });
  }

  const words = typed.trim() ? typed.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-4">
      <Card tone="dark" className="space-y-3">
        <div className="flex items-center justify-between"><Tag>write about this · {secs}s</Tag><Countdown seconds={secs} onExpire={finish} /></div>
        <p className="font-serif text-2xl leading-snug">{item.prompt}</p>
      </Card>
      {item.requirements && item.requirements.length > 0 && (
        <Card><Tag>include</Tag><ul className="mt-2 space-y-1.5 text-[15px]">{item.requirements.map((r, k) => <li key={k} className="flex gap-2"><span className="text-accent">·</span>{r}</li>)}</ul></Card>
      )}
      <Card className="space-y-3">
        <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={6} placeholder="write your answer…" className={INPUT_TEXTAREA} />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{words} {words === 1 ? "word" : "words"}</span>
          <Btn onClick={finish} disabled={!typed.trim()}>finish → results</Btn>
        </div>
      </Card>
    </div>
  );
}
