import { useState, useRef } from "react";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { ErrorNote } from "../ui/ErrorNote.jsx";
import { STATIONS } from "../config/stations.js";
import { useStationPipeline } from "../hooks/useStationPipeline.js";
import { ListenStage } from "../stages/ListenStage.jsx";
import { GrammarStage } from "../stages/GrammarStage.jsx";
import { VocabStage } from "../stages/VocabStage.jsx";
import { ShadowStage } from "../stages/ShadowStage.jsx";
import { SpeakStage } from "../stages/SpeakStage.jsx";
import { WriteStage } from "../stages/WriteStage.jsx";

const STAGES = {
  listen: ListenStage,
  grammar: GrammarStage,
  vocab: VocabStage,
  shadow: ShadowStage,
  speak: SpeakStage,
  write: WriteStage,
};

export function Round({ level, voices, onComplete }) {
  const [si, setSi] = useState(0);
  const results = useRef([]);
  const { slots, retry } = useStationPipeline(level);

  function done(r) {
    results.current.push(r);
    if (si + 1 < STATIONS.length) setSi(si + 1);
    else onComplete(results.current);
  }

  const st = STATIONS[si];
  const slot = slots[si];
  const Stage = STAGES[st.id];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Tag>{si + 1} / {STATIONS.length} · {st.label}</Tag>
          <button onClick={() => onComplete(results.current)} className="text-xs text-muted underline underline-offset-2 hover:text-ink">end round</button>
        </div>
        <div className="flex items-center gap-1.5">
          {STATIONS.map((s, k) => <div key={s.id} className={`h-1.5 flex-1 rounded-full ${k < si ? "bg-accent" : k === si ? "bg-ink" : "bg-line"}`} />)}
        </div>
      </div>
      {slot.status === "error" ? <ErrorNote msg={st.loadError} onRetry={() => retry(si)} />
        : slot.status !== "ready" ? <Card><Spinner label={st.loadLabel} /></Card>
        : <Stage key={st.id} data={slot.data} level={level} voices={voices} onDone={done} />}
    </div>
  );
}
