import { useState, useRef } from "react";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { OptionBtn, optState } from "../ui/OptionBtn.jsx";
import { secsFor } from "../config/levels.js";
import { vocabMiss } from "../lib/review.js";
import { recordMiss } from "../store.js";

export function VocabStage({ data, level, onDone }) {
  const { words, order, opts } = data;
  const [phase, setPhase] = useState("study");
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null);
  const score = useRef(0);
  const studySecs = secsFor(18, level);
  const qSecs = secsFor(16, level);

  function answer(opt) {
    if (picked != null) return;
    const w = words[order[qi]];
    setPicked(opt == null ? "—" : opt);
    if (opt === w.word) score.current++;
    else recordMiss(vocabMiss("round", w));
  }
  function nextQ() {
    if (qi + 1 < order.length) { setQi(qi + 1); setPicked(null); }
    else onDone({ type: "vocab", label: "Vocabulary", correct: score.current, total: order.length });
  }

  if (phase === "study") {
    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <Tag>learn these — quiz next</Tag>
          <Countdown seconds={studySecs} onExpire={() => setPhase("quiz")} />
        </div>
        {words.map((w, k) => (
          <div key={k} className="border-t border-line pt-3 first:border-0 first:pt-0">
            <span className="font-serif text-xl">{w.word}</span> <span className="text-sm italic text-muted">{w.pos}</span>
            <p className="mt-1 text-[15px] leading-relaxed">{w.definition}</p>
            <p className="text-[14px] italic leading-relaxed text-muted">“{w.example}”</p>
          </div>
        ))}
        <Btn onClick={() => setPhase("quiz")}>I'm ready, quiz me</Btn>
      </Card>
    );
  }
  const w = words[order[qi]];
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <Tag>recall {qi + 1} / {order.length}</Tag>
        {picked == null && <Countdown key={qi} seconds={qSecs} onExpire={() => answer(null)} />}
      </div>
      <div><p className="text-sm text-muted">which word means</p><p className="mt-1 font-serif text-2xl leading-snug">{w.definition}</p></div>
      <div className="flex flex-col gap-2.5">
        {opts[qi].map((opt) => <OptionBtn key={opt} state={optState(picked != null, opt === w.word, opt === picked)} onClick={() => answer(opt)}>{opt}</OptionBtn>)}
      </div>
      {picked != null && <Btn onClick={nextQ}>{qi + 1 < order.length ? "next" : "next station"}</Btn>}
    </Card>
  );
}
