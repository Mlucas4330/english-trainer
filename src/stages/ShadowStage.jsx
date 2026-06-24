import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/Card.jsx";
import { Tag } from "../ui/Tag.jsx";
import { Btn } from "../ui/Btn.jsx";
import { Countdown } from "../ui/Countdown.jsx";
import { normWords, alignHits } from "../lib/text.js";
import { findVoice } from "../lib/speech.js";
import { openInTab } from "../lib/chrome.js";
import { secsFor } from "../config/levels.js";
import { useRecorder, SpeechRec } from "../hooks/useRecorder.js";

export function ShadowStage({ data, level, voices, onDone }) {
  const items = data.items, N = items.length;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);
  const rec = useRecorder();
  const out = useRef([]);
  const secs = secsFor(35, level);
  const speechOK = "speechSynthesis" in window;

  useEffect(() => () => { if (speechOK) window.speechSynthesis.cancel(); }, []);

  function play() {
    if (!speechOK) return;
    const v = findVoice(voices, ["en-US", "en-GB", "en-AU", "en"]);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(items[i].text);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 0.95; u.onend = () => setPlaying(false);
    setPlaying(true); window.speechSynthesis.speak(u);
  }
  function score() {
    rec.stop();
    const tokens = items[i].text.split(/\s+/);
    const norm = tokens.map((t) => t.toLowerCase().replace(/[^a-z0-9']/g, ""));
    const hits = alignHits(norm, normWords(rec.transcript));
    const counted = norm.filter(Boolean).length || 1;
    const pct = Math.round(100 * hits.filter(Boolean).length / counted);
    out.current[i] = { pct };
    setResult({ tokens, hits, pct });
  }
  function next() {
    if (i + 1 < N) { setI(i + 1); setResult(null); rec.setTranscript(""); }
    else { const p = out.current.map((o) => o.pct); onDone({ type: "shadow", label: "Shadowing", pct: p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length) : null }); }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <Tag>line {i + 1} / {N}</Tag>
        {rec.running && <Countdown seconds={secs} onExpire={score} />}
      </div>
      <p className="font-serif text-2xl leading-snug">{items[i].text}</p>
      <p className="text-sm leading-relaxed text-muted">{items[i].note}</p>
      <div className="flex flex-wrap gap-3">
        <Btn onClick={play} disabled={!speechOK}>{playing ? "▶ playing…" : "🔊 play line"}</Btn>
        {SpeechRec && !result && (rec.running
          ? <Btn kind="ghost" onClick={score}>stop &amp; score</Btn>
          : <Btn onClick={rec.start}>🎤 record echo</Btn>)}
      </div>
      {rec.running && <p className="text-sm text-muted">listening… {rec.transcript}</p>}
      {rec.recErr && <p className="text-sm leading-relaxed text-muted">{rec.recErr}</p>}
      {!SpeechRec && (
        <div className="space-y-2">
          <p className="text-sm text-muted">No speech recognition here — <button onClick={openInTab} className="underline underline-offset-2">open in a full tab</button> to score this.</p>
          <Btn kind="ghost" onClick={() => onDone({ type: "shadow", label: "Shadowing", pct: null })}>skip to next station</Btn>
        </div>
      )}
      {result && (
        <div className="space-y-3">
          <div><Tag>match</Tag> <span className="font-medium text-accent">{result.pct}%</span></div>
          <p className="font-serif text-lg leading-snug">{result.tokens.map((t, k) => <span key={k} className={result.hits[k] ? "text-ink" : "text-muted line-through decoration-accent/50"}>{t}{k < result.tokens.length - 1 ? " " : ""}</span>)}</p>
          <Btn onClick={next}>{i + 1 < N ? "next line" : "next station"}</Btn>
        </div>
      )}
    </Card>
  );
}
