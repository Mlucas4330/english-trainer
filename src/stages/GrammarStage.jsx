import React, { useState, useRef } from "react";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { SoftNote } from "../ui/SoftNote.jsx";
import { OptionBtn, optState } from "../ui/OptionBtn.jsx";
import { secsFor } from "../config/levels.js";
import { grammarMiss } from "../lib/review.js";
import { recordMiss } from "../store.js";

export function GrammarStage({ data, level, onDone }) {
  const qs = data.qs, N = qs.length;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const score = useRef(0);
  const secs = secsFor(24, level);

  function answer(opt) {
    if (picked != null) return;
    setPicked(opt == null ? "—" : opt);
    if (opt === qs[i].answer) score.current++;
    else recordMiss(grammarMiss({ label: "round" }, qs[i]));
  }
  function next() {
    if (i + 1 < N) { setI(i + 1); setPicked(null); }
    else onDone({ type: "grammar", label: "Grammar", correct: score.current, total: N });
  }

  const q = qs[i];
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <Tag>question {i + 1} / {N}</Tag>
        {picked == null && <Countdown key={i} seconds={secs} onExpire={() => answer(null)} />}
      </div>
      <p className="font-serif text-2xl leading-snug">
        {q.sentence.split("___").map((p, idx, arr) => (
          <React.Fragment key={idx}>{p}{idx < arr.length - 1 && (
            <span className="mx-1 inline-block min-w-[64px] border-b-2 border-accent text-center align-baseline text-accent">{picked != null ? q.answer : " "}</span>
          )}</React.Fragment>
        ))}
      </p>
      <div className="flex flex-col gap-2.5">
        {q.options.map((opt) => <OptionBtn key={opt} state={optState(picked != null, opt === q.answer, opt === picked)} onClick={() => answer(opt)}>{opt}</OptionBtn>)}
      </div>
      {picked != null && (
        <div className="space-y-4">
          <SoftNote heading="why.">{q.why}</SoftNote>
          <Btn onClick={next}>{i + 1 < N ? "next" : "next station"}</Btn>
        </div>
      )}
    </Card>
  );
}
